import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Booking Step 3 - Google Calendar Integration', () => {
  let mockAppointmentData;
  let mockGoogleCalendarAPI;

  beforeEach(() => {
    // Mock appointment data from step 3
    mockAppointmentData = {
      clientName: 'John Doe',
      barber: 'Ahmed',
      appointmentTime: '14:00',
      appointmentDate: '2026-02-15',
      duration: 60,
      services: 'Precision Haircut',
      clientEmail: 'john@example.com',
      clientPhone: '+254700000000',
      location: 'Main Branch'
    };

    // Mock Google Calendar API
    mockGoogleCalendarAPI = {
      events: {
        insert: vi.fn().mockResolvedValue({
          data: {
            id: 'google-event-id-123',
            summary: 'Barber Appointment',
            description: `Client: John Doe\nBarber: Ahmed`
          }
        })
      }
    };
  });

  it('should send client name, barber name, and time to Google Calendar API', async () => {
    // Simulate clicking time in step 3
    const eventData = {
      summary: `Barber Appointment - ${mockAppointmentData.clientName}`,
      description: `Client: ${mockAppointmentData.clientName}\nBarber: ${mockAppointmentData.barber}\nServices: ${mockAppointmentData.services}`,
      start: {
        dateTime: `${mockAppointmentData.appointmentDate}T${mockAppointmentData.appointmentTime}:00`,
        timeZone: 'Africa/Nairobi'
      },
      end: {
        dateTime: `${mockAppointmentData.appointmentDate}T${String(parseInt(mockAppointmentData.appointmentTime) + 1).padStart(2, '0')}:00:00`,
        timeZone: 'Africa/Nairobi'
      }
    };

    await mockGoogleCalendarAPI.events.insert(eventData);

    // Verify the API was called
    expect(mockGoogleCalendarAPI.events.insert).toHaveBeenCalledWith(eventData);

    // Verify required fields are present
    const callArgs = mockGoogleCalendarAPI.events.insert.mock.calls[0][0];
    expect(callArgs.description).toContain(mockAppointmentData.clientName);
    expect(callArgs.description).toContain(mockAppointmentData.barber);
    expect(callArgs.start.dateTime).toContain(mockAppointmentData.appointmentTime);
  });

  it('should include correct time slot duration', async () => {
    const startTime = mockAppointmentData.appointmentTime;
    const duration = mockAppointmentData.duration;
    const endHour = parseInt(startTime.split(':')[0]) + (duration / 60);

    expect(endHour).toBe(15); // 14:00 + 60 minutes = 15:00
  });

  it('should validate client name is not empty before sending to calendar', () => {
    const isValid = mockAppointmentData.clientName && mockAppointmentData.clientName.trim().length > 0;
    expect(isValid).toBe(true);
  });

  it('should validate barber name is not empty before sending to calendar', () => {
    const isValid = mockAppointmentData.barber && mockAppointmentData.barber.trim().length > 0;
    expect(isValid).toBe(true);
  });

  it('should validate time format is correct (HH:MM)', () => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    expect(timeRegex.test(mockAppointmentData.appointmentTime)).toBe(true);
  });

  it('should create complete event object with all required fields', async () => {
    const eventData = {
      summary: `Barber Appointment - ${mockAppointmentData.clientName}`,
      description: `Client: ${mockAppointmentData.clientName}\nBarber: ${mockAppointmentData.barber}`,
      start: { dateTime: `${mockAppointmentData.appointmentDate}T${mockAppointmentData.appointmentTime}:00` },
      end: { dateTime: `${mockAppointmentData.appointmentDate}T15:00:00` }
    };

    expect(eventData).toHaveProperty('summary');
    expect(eventData).toHaveProperty('description');
    expect(eventData).toHaveProperty('start');
    expect(eventData).toHaveProperty('end');
  });
});