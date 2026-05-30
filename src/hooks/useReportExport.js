/*
 * useReportExport.js — Custom hook that handles downloading report data as CSV, Excel, or PDF.
 *
 * Components call `exportData(...)` with the table data, column definitions, a filename,
 * and a format string. This hook takes care of building the file and triggering the browser
 * download so that UI components stay simple and free of file-generation logic.
 */

import { useState, useContext } from 'react';
import { AlertContext } from '../contexts/AlertContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

export const useReportExport = () => {
  // Track whether an export is currently in progress so the UI can show a spinner.
  const [isExporting, setIsExporting] = useState(false);

  // Pull alert helpers from context so we can notify the user of success or failure.
  const { error: showError, success } = useContext(AlertContext);

  /*
   * exportData — Main entry point that validates the data and delegates to the correct
   * format-specific function (CSV, Excel, or PDF).
   * @param {Array}  data     - The rows of data to export.
   * @param {Array}  columns  - Column definitions including key, label, and optional renderers.
   * @param {string} filename - The base filename (without extension) for the downloaded file.
   * @param {string} format   - One of 'csv', 'excel', or 'pdf'.
   */
  const exportData = async ({ data, columns, filename, format }) => {
    if (!data || data.length === 0) {
      showError('No data available to export.');
      return;
    }

    setIsExporting(true);
    try {
      // Simulate slight delay for loading state visibility
      await new Promise(resolve => setTimeout(resolve, 500));

      if (format === 'csv') {
        exportCSV(data, columns, filename);
      } else if (format === 'excel') {
        exportExcel(data, columns, filename);
      } else if (format === 'pdf') {
        exportPDF(data, columns, filename);
      }
      success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Export failed:', err);
      showError(`Failed to export report as ${format.toUpperCase()}`);
    } finally {
      // Always reset the loading flag whether the export succeeded or failed.
      setIsExporting(false);
    }
  };

  /*
   * getExportableData — Converts raw data rows into plain objects keyed by column label.
   * Uses each column's `exportRender` first (a string/number-safe formatter), then falls
   * back to `render`, and finally the raw value — ensuring the exported file contains
   * readable text rather than React elements.
   * @param {Array} data    - Raw data rows from the API.
   * @param {Array} columns - Column definitions with optional render helpers.
   * @returns {Array} Plain objects ready to be written to a file.
   */
  const getExportableData = (data, columns) => {
    return data.map(row => {
      const exportRow = {};
      columns.forEach(col => {
        if (col.key) {
          // If the column has a specific export string representation, use it
          // Else try to fallback to raw data
          let val = row[col.key];

          if (col.exportRender) {
            // exportRender is a plain-text formatter designed specifically for file export.
            val = col.exportRender(val, row);
          } else if (col.render) {
            const rendered = col.render(val, row);
            // Only use the render result if it's a primitive; JSX elements can't go in files.
            if (typeof rendered === 'string' || typeof rendered === 'number') {
              val = rendered;
            }
          }

          exportRow[col.label] = val;
        }
      });
      return exportRow;
    });
  };

  /*
   * exportCSV — Converts data to CSV format using the SheetJS library and triggers a download.
   * @param {Array}  data     - Raw data rows.
   * @param {Array}  columns  - Column definitions.
   * @param {string} filename - Output filename (without extension).
   */
  const exportCSV = (data, columns, filename) => {
    const exportableData = getExportableData(data, columns);
    // Convert the JS array to a SheetJS worksheet object, then to a CSV string.
    const worksheet = XLSX.utils.json_to_sheet(exportableData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    // Wrap the CSV string in a Blob so the browser can treat it as a downloadable file.
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  /*
   * exportExcel — Builds an .xlsx workbook with a single "Report" sheet and downloads it.
   * @param {Array}  data     - Raw data rows.
   * @param {Array}  columns  - Column definitions.
   * @param {string} filename - Output filename (without extension).
   */
  const exportExcel = (data, columns, filename) => {
    const exportableData = getExportableData(data, columns);
    const worksheet = XLSX.utils.json_to_sheet(exportableData);
    // A workbook is the container for one or more worksheets — similar to an Excel file.
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  /*
   * exportPDF — Generates a PDF document with a title and auto-sized table, then downloads it.
   * Uses jsPDF for the document and the jspdf-autotable plugin to render the table.
   * @param {Array}  data     - Raw data rows.
   * @param {Array}  columns  - Column definitions.
   * @param {string} filename - Output filename (without extension).
   */
  const exportPDF = (data, columns, filename) => {
    const doc = new jsPDF();
    // Extract only the column header labels for the table header row.
    const tableColumn = columns.filter(col => col.key).map(col => col.label);

    // Build a 2-D array of plain strings — one inner array per data row.
    const tableRows = data.map(row => {
      return columns.filter(col => col.key).map(col => {
        let val = row[col.key];
        if (col.exportRender) {
          val = col.exportRender(val, row);
        } else if (col.render) {
          const rendered = col.render(val, row);
          if (typeof rendered === 'string' || typeof rendered === 'number') {
            val = rendered;
          }
        }
        // Convert every cell to a string; use an empty string for null/undefined values.
        return val !== undefined && val !== null ? String(val) : '';
      });
    });

    // Add the report title at coordinates (x=14, y=15) in the PDF.
    doc.text(filename, 14, 15);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20, // Start the table just below the title text.
    });
    doc.save(`${filename}.pdf`);
  };

  return { exportData, isExporting };
};
