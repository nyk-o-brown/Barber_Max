// Frontend integration helper for Barber Max Appointments
// This file can be imported in your booking pages

const API_BASE_URL = 'http://localhost:5000/api';

export class BarberAppointmentAPI {
  
  // Create a new appointment
  static async createAppointment(appointmentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Get all appointments
  static async getAppointments() {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  // Get single appointment
  static async getAppointment(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }

  // Update appointment
  static async updateAppointment(id, appointmentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Delete appointment
  static async deleteAppointment(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  // Get available time slots
  static async getAvailableSlots(date, duration = 60) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/appointments/available/${date}?duration=${duration}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  }

  // Get Google Calendar auth URL
  static async getGoogleAuthUrl() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google/url`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting auth URL:', error);
      throw error;
    }
  }

  // Handle Google Calendar callback
  static async handleGoogleCallback(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error handling Google callback:', error);
      throw error;
    }
  }

  // Check authentication status
  static async checkAuthStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking auth status:', error);
      throw error;
    }
  }

  // Sync appointment to Google Calendar
  static async syncToCalendar(appointmentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/sync-calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing appointment:', error);
      throw error;
    }
  }
}

export default BarberAppointmentAPI;
