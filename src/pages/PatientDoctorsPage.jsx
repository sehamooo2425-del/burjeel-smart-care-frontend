/*
 * PatientDoctorsPage.jsx
 * This page is visible to patients. It lists all the doctors registered in the hospital
 * so that a patient can browse specialties and send a booking message through the chat system.
 */

import { useState, useEffect, useContext } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FiUser, FiMessageSquare } from 'react-icons/fi';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AlertContext } from '../contexts/AlertContext';

export default function PatientDoctorsPage() {
  // doctors holds the list of all users with the role "doctor".
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useContext(AlertContext);
  const navigate = useNavigate();

  /*
   * Runs once on mount. Calls the auth/users endpoint with a role filter
   * to fetch only doctors (not admins or patients).
   */
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/users?role=doctor');
        setDoctors(res);
      } catch (err) {
        showError('Failed to fetch doctors list');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [showError]);

  // Sends a pre-written appointment request message to the selected doctor via the chat API,
  // then navigates to the chat page so the patient can continue the conversation.
  const handleBookAppointment = async (doctor) => {
    try {
      const messageText = `Hi Dr. ${doctor.username}, I would like to book an appointment with you. Please let me know your availability.`;

      // Post the message directly to the chat API so it appears in the chat thread.
      await api.post('/chat/messages/', {
        receiver_id: doctor.user_id,
        message_text: messageText
      });

      // Redirect to the chat page after sending so the patient can follow up.
      navigate('/patient/chat');
    } catch (err) {
      showError('Failed to initiate appointment request');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading doctors...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 mb-2">Our Doctors</h1>
        <p className="text-secondary-600">Find and book an appointment with our specialists</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {doctors.length > 0 ? doctors.map((doctor) => (
          <Card key={doctor.user_id} className="flex flex-col items-center text-center">
            <div className="w-24 h-24 mb-4 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-4 border-primary-50">
              {doctor.profile_picture_url ? (
                <img src={doctor.profile_picture_url} alt={doctor.username} className="w-full h-full object-cover" />
              ) : (
                <FiUser className="text-primary-600" size={40} />
              )}
            </div>
            <h3 className="text-xl font-bold text-secondary-900 mb-1">Dr. {doctor.username}</h3>
            <p className="text-sm text-primary-600 mb-1">
              <span className="font-bold text-secondary-700">Specialty:</span> <span className="font-semibold">{doctor.specialty || 'General Practitioner'}</span>
            </p>
            <p className="text-sm text-secondary-500 mb-6">
              <span className="font-bold text-secondary-700">Department:</span> {doctor.department || 'General Medicine'}
            </p>
            
            <Button 
              variant="primary" 
              fullWidth 
              icon={FiMessageSquare}
              onClick={() => handleBookAppointment(doctor)}
            >
              Book Appointment
            </Button>
          </Card>
        )) : (
          <div className="col-span-full">
            <Card>
              <p className="text-secondary-500 text-center py-8">No doctors found in the system.</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
