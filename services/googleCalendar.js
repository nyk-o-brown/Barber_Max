import { google } from 'googleapis';
import { getQuery, runQuery } from '../database/init.js';

const calendar = google.calendar('v3');

export class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Get authorization URL
  getAuthUrl() {
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
  }

  // Exchange authorization code for tokens
  async handleCallback(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Save tokens to database
      const expiresAt = tokens.expiry_date;
      await runQuery(
        `INSERT INTO google_auth (accessToken, refreshToken, expiresAt, scope)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
         accessToken = excluded.accessToken,
         refreshToken = excluded.refreshToken,
         expiresAt = excluded.expiresAt`,
        [
          tokens.access_token,
          tokens.refresh_token,
          expiresAt,
          'https://www.googleapis.com/auth/calendar'
        ]
      );

      return { success: true, tokens };
    } catch (error) {
      console.error('Error handling Google callback:', error);
      throw error;
    }
  }

  // Load stored tokens
  async loadStoredTokens() {
    try {
      const auth = await getQuery('SELECT * FROM google_auth ORDER BY id DESC LIMIT 1');
      if (auth) {
        this.oauth2Client.setCredentials({
          access_token: auth.accessToken,
          refresh_token: auth.refreshToken,
          expiry_date: auth.expiresAt
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading stored tokens:', error);
      return false;
    }
  }

  // Create a calendar event from appointment
  async createEvent(appointment) {
    try {
      // Ensure we have valid credentials
      const hasTokens = await this.loadStoredTokens();
      if (!hasTokens) {
        throw new Error('No Google Calendar authentication found. Please authenticate first.');
      }

      const startDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (appointment.duration || 60) * 60000);

      const event = {
        summary: `${appointment.clientName} - Barber Appointment`,
        description: `Services: ${appointment.services}\nBarber: ${appointment.barber}\nLocation: ${appointment.location}\nNotes: ${appointment.notes || 'N/A'}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Africa/Nairobi'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Africa/Nairobi'
        },
        attendees: [
          {
            email: appointment.clientEmail,
            displayName: appointment.clientName
          }
        ],
        location: appointment.location,
        conferenceData: {
          createRequest: {
            requestId: `appointment-${appointment.id}`
          }
        }
      };

      const response = await calendar.events.insert({
        auth: this.oauth2Client,
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'eventCreator'
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  }

  // Update a calendar event
  async updateEvent(googleEventId, appointment) {
    try {
      const hasTokens = await this.loadStoredTokens();
      if (!hasTokens) {
        throw new Error('No Google Calendar authentication found.');
      }

      const startDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (appointment.duration || 60) * 60000);

      const event = {
        summary: `${appointment.clientName} - Barber Appointment`,
        description: `Services: ${appointment.services}\nBarber: ${appointment.barber}\nLocation: ${appointment.location}\nNotes: ${appointment.notes || 'N/A'}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Africa/Nairobi'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Africa/Nairobi'
        },
        attendees: [
          {
            email: appointment.clientEmail,
            displayName: appointment.clientName
          }
        ],
        location: appointment.location
      };

      const response = await calendar.events.update({
        auth: this.oauth2Client,
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId: googleEventId,
        resource: event,
        sendUpdates: 'eventCreator'
      });

      return response.data;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  }

  // Delete a calendar event
  async deleteEvent(googleEventId) {
    try {
      const hasTokens = await this.loadStoredTokens();
      if (!hasTokens) {
        throw new Error('No Google Calendar authentication found.');
      }

      await calendar.events.delete({
        auth: this.oauth2Client,
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId: googleEventId,
        sendUpdates: 'eventCreator'
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw error;
    }
  }

  // Get available time slots
  async getAvailableSlots(date, duration = 60) {
    try {
      const hasTokens = await this.loadStoredTokens();
      if (!hasTokens) {
        throw new Error('No Google Calendar authentication found.');
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(9, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(18, 0, 0, 0);

      const response = await calendar.freebusy.query({
        auth: this.oauth2Client,
        resource: {
          timeMin: startOfDay.toISOString(),
          timeMax: endOfDay.toISOString(),
          items: [{ id: process.env.GOOGLE_CALENDAR_ID || 'primary' }]
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }
}

export default new GoogleCalendarService();
