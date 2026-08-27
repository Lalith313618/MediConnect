const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const getDashboardStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    const todaysAppointments = await Appointment.countDocuments({ appointmentDate: todayStr });
    const completedAppointments = await Appointment.countDocuments({ status: 'Completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'Cancelled' });
    const scheduledAppointments = await Appointment.countDocuments({ status: 'Scheduled' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'Confirmed' });

    const recentAppointments = await Appointment.find()
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name specialization' }
      })
      .sort({ createdAt: -1 })
      .limit(6);

    const recentPatients = await User.find({ role: 'patient' })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        todaysAppointments,
        completedAppointments,
        cancelledAppointments,
        scheduledAppointments,
        confirmedAppointments
      },
      recentAppointments,
      recentPatients
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'patient' };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const patients = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAdminDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'name email phone role address').sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAdminAppointments = async (req, res) => {
  try {
    const { status, date, doctorId, patientId, search } = req.query;
    let query = {};

    if (status && status !== 'All') query.status = status;
    if (date) query.appointmentDate = date;
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    let appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone dateOfBirth gender address')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .sort({ createdAt: -1 });

    if (search) {
      const regex = new RegExp(search, 'i');
      appointments = appointments.filter((app) => {
        const patientName = app.patientId?.name || '';
        const doctorName = app.doctorId?.userId?.name || '';
        const spec = app.doctorId?.specialization || '';
        return regex.test(patientName) || regex.test(doctorName) || regex.test(spec);
      });
    }

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getPatients,
  getAdminDoctors,
  getAdminAppointments
};
