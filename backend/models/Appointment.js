const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    appointmentDate: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Appointment date is required']
    },
    appointmentTime: {
      type: String, // Format: e.g., "10:00 AM"
      required: [true, 'Appointment time is required']
    },
    reason: {
      type: String,
      default: 'General Consultation'
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Scheduled'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
