import express from 'express';
import { body, validationResult } from 'express-validator';
import { runQuery, getQuery, allQuery } from '../database/init.js';
import googleCalendarService from '../services/googleCalendar.js';

const router = express.Router();

// Validation middleware
const appointmentValidation = [
  body('clientName').trim().notEmpty().withMessage('Client name is required'),
  body('clientEmail').isEmail().withMessage('Valid email is required'),
  body('clientPhone').optional().trim(),
  body('services').notEmpty().withMessage('At least one service is required'),
  body('barber').notEmpty().withMessage('Barber selection is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
];

// Create appointment and sync with Google Calendar
router.post('/', appointmentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      clientName,
      clientEmail,
      clientPhone,
      services,
      barber,
      location,
      appointmentDate,
      appointmentTime,
      duration = 60,
      notes
    } = req.body;

    // Insert appointment into database
    const result = await runQuery(
      `INSERT INTO appointments (
        clientName, clientEmail, clientPhone, services, barber, 
        location, appointmentDate, appointmentTime, duration, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientName,
        clientEmail,
        clientPhone,
        typeof services === 'string' ? services : JSON.stringify(services),
        typeof barber === 'string' ? barber : JSON.stringify(barber),
        typeof location === 'string' ? location : JSON.stringify(location),
        appointmentDate,
        appointmentTime,
        duration,
        notes || null,
        'pending'
      ]
    );

    const appointmentId = result.id;
    let googleEventId = null;

    // Try to sync with Google Calendar
    try {
      const appointment = {
        id: appointmentId,
        clientName,
        clientEmail,
        clientPhone,
        services: typeof services === 'string' ? services : JSON.stringify(services),
        barber: typeof barber === 'string' ? barber : JSON.stringify(barber),
        location: typeof location === 'string' ? location : JSON.stringify(location),
        appointmentDate,
        appointmentTime,
        duration,
        notes: notes || ''
      };

      const event = await googleCalendarService.createEvent(appointment);
      googleEventId = event.id;

      // Update appointment with Google Event ID
      await runQuery(
        'UPDATE appointments SET googleEventId = ?, status = ? WHERE id = ?',
        [googleEventId, 'confirmed', appointmentId]
      );
    } catch (calendarError) {
      console.error('Google Calendar sync error:', calendarError.message);
      // Appointment is still created but not synced with calendar
      // Client can retry sync later
    }

    const appointmentData = await getQuery('SELECT * FROM appointments WHERE id = ?', [appointmentId]);

    res.status(201).json({
      success: true,
      message: googleEventId ? 'Appointment created and synced with Google Calendar' : 'Appointment created (Calendar sync pending)',
      appointment: appointmentData,
      googleEventId: googleEventId || null
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment', details: error.message });
  }
});

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await allQuery(
      'SELECT * FROM appointments ORDER BY appointmentDate DESC, appointmentTime DESC'
    );

    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await getQuery('SELECT * FROM appointments WHERE id = ?', [id]);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Update appointment
router.put('/:id', appointmentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      clientName,
      clientEmail,
      clientPhone,
      services,
      barber,
      location,
      appointmentDate,
      appointmentTime,
      duration = 60,
      notes
    } = req.body;

    // Check if appointment exists
    const existingAppointment = await getQuery('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update in database
    await runQuery(
      `UPDATE appointments SET
        clientName = ?, clientEmail = ?, clientPhone = ?, services = ?,
        barber = ?, location = ?, appointmentDate = ?, appointmentTime = ?,
        duration = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        clientName,
        clientEmail,
        clientPhone,
        typeof services === 'string' ? services : JSON.stringify(services),
        typeof barber === 'string' ? barber : JSON.stringify(barber),
        typeof location === 'string' ? location : JSON.stringify(location),
        appointmentDate,
        appointmentTime,
        duration,
        notes || null,
        id
      ]
    );

    // Update Google Calendar event if it exists
    if (existingAppointment.googleEventId) {
      try {
        const appointment = {
          id,
          clientName,
          clientEmail,
          clientPhone,
          services: typeof services === 'string' ? services : JSON.stringify(services),
          barber: typeof barber === 'string' ? barber : JSON.stringify(barber),
          location: typeof location === 'string' ? location : JSON.stringify(location),
          appointmentDate,
          appointmentTime,
          duration,
          notes: notes || ''
        };

        await googleCalendarService.updateEvent(existingAppointment.googleEventId, appointment);
      } catch (calendarError) {
        console.error('Google Calendar update error:', calendarError.message);
      }
    }

    const updatedAppointment = await getQuery('SELECT * FROM appointments WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment', details: error.message });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await getQuery('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Delete from Google Calendar if synced
    if (appointment.googleEventId) {
      try {
        await googleCalendarService.deleteEvent(appointment.googleEventId);
      } catch (calendarError) {
        console.error('Google Calendar deletion error:', calendarError.message);
      }
    }

    // Delete from database
    await runQuery('DELETE FROM appointments WHERE id = ?', [id]);

    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment', details: error.message });
  }
});

// Get available time slots
router.get('/available/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { duration = 60 } = req.query;

    const availability = await googleCalendarService.getAvailableSlots(date, parseInt(duration));

    res.json({
      success: true,
      date,
      availability
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      error: 'Failed to fetch available slots',
      details: error.message
    });
  }
});

// Retry Google Calendar sync for an appointment
router.post('/:id/sync-calendar', async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await getQuery('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Try to create/update event
    try {
      if (appointment.googleEventId) {
        await googleCalendarService.updateEvent(appointment.googleEventId, appointment);
      } else {
        const event = await googleCalendarService.createEvent(appointment);
        await runQuery(
          'UPDATE appointments SET googleEventId = ? WHERE id = ?',
          [event.id, id]
        );
      }

      res.json({
        success: true,
        message: 'Calendar sync successful',
        googleEventId: appointment.googleEventId
      });
    } catch (syncError) {
      throw syncError;
    }
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({
      error: 'Failed to sync calendar',
      details: error.message
    });
  }
});

export default router;
