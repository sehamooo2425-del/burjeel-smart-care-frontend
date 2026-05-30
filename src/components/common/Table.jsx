/*
 * Table.jsx — A reusable data table used across the app to display lists
 * of patients, doctors, appointments, attendance records, and reports.
 *
 * It supports: row striping, hover highlighting, click-to-sort column headers,
 * per-row and select-all checkboxes, a loading state, an empty-data state,
 * and a compact mode for denser layouts. Column definitions can include a
 * custom `render` function for rich cell content (e.g. a Badge or a button).
 */

/*
 * Table props:
 *  - columns: array of { key, label, render? } — defines the table headers
 *    and how each cell value is displayed. If `render` is provided it is
 *    called as render(cellValue, rowObject, rowIndex).
 *  - data: array of row objects whose keys match the column `key` fields
 *  - loading: shows a "Loading..." row spanning all columns while true
 *  - selectable: adds a checkbox column for multi-row selection
 *  - selectedRows: array of selected row indices (controlled externally)
 *  - onSelectRow(index, checked): called when a single row checkbox changes
 *  - onSelectAll(checked): called when the header "select all" checkbox changes
 *  - sortable: enables clicking column headers to trigger sorting
 *  - onSort(columnKey): called with the key of the clicked column
 *  - sortColumn: key of the column currently sorted
 *  - sortOrder: 'asc' or 'desc' — determines which arrow icon to show
 *  - hover: adds a highlight on row mouse-over
 *  - striped: alternates the background colour of even/odd rows
 *  - compact: reduces cell padding for a denser table layout
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  sortable = false,
  onSort,
  sortColumn,
  sortOrder,
  hover = true,
  striped = true,
  compact = false,
}) {
  // Choose tighter or more generous cell padding based on the `compact` prop.
  const paddingClass = compact ? 'px-4 py-2' : 'px-6 py-4';

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-secondary-200">
      <table className="w-full">
        <thead className="bg-secondary-50 border-b border-secondary-200">
          <tr>
            {/* "Select all" checkbox column — only rendered when selectable is true */}
            {selectable && (
              <th className={`${paddingClass} text-left`}>
                <input
                  type="checkbox"
                  // Checked when every row in the current data set is selected.
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  checked={selectedRows.length === data.length && data.length > 0}
                  className="rounded border-secondary-300"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${paddingClass} text-left font-semibold text-secondary-700 cursor-pointer hover:bg-secondary-100 transition-colors`}
                // Only call onSort when the table has sorting enabled.
                onClick={() => sortable && onSort?.(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {/* Show an up or down arrow only on the currently sorted column */}
                  {sortable && sortColumn === column.key && (
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/*
           * Three mutually exclusive body states:
           * 1. Loading — a single full-width "Loading…" row
           * 2. Empty — a single full-width "No data available" row
           * 3. Normal — one <tr> per row object in `data`
           */}
          {loading ? (
            <tr>
              {/* colSpan covers all data columns plus the optional checkbox column */}
              <td colSpan={columns.length + (selectable ? 1 : 0)} className={`${paddingClass} text-center text-secondary-500`}>
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className={`${paddingClass} text-center text-secondary-500`}
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  border-b border-secondary-200 transition-colors
                  ${striped && rowIndex % 2 === 1 ? 'bg-secondary-50' : 'bg-white'}
                  ${hover ? 'hover:bg-primary-50' : ''}
                `}
              >
                {/* Per-row checkbox — only rendered when selectable is true */}
                {selectable && (
                  <td className={paddingClass}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(rowIndex)}
                      onChange={(e) => onSelectRow?.(rowIndex, e.target.checked)}
                      className="rounded border-secondary-300"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.key}`} className={`${paddingClass} text-secondary-900`}>
                    {/* If the column has a custom render function, call it;
                        otherwise just display the raw cell value */}
                    {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
