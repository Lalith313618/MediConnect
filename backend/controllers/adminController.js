const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// Clean up any orphaned appointments where patient or doctor was deleted
const cleanOrphanedAppointments = async () => {
  try {
    const validUserIds = await User.distinct('_id');
    const validDoctorIds = await Doctor.distinct('_id');

    await Appointment.deleteMany({
      $or: [
        { patientId: { $nin: validUserIds } },
        { doctorId: { $nin: validDoctorIds } }
      ]
    });
  } catch (error) {
    console.error('Error cleaning orphaned appointments:', error);
  }
};

const getDashboardStats = async (req, res) => {
  try {
    await cleanOrphanedAppointments();
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todaysAppointments,
      completedAppointments,
      cancelledAppointments,
      scheduledAppointments,
      confirmedAppointments,
      recentAppointments,
      recentPatients
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ appointmentDate: todayStr }),
      Appointment.countDocuments({ status: 'Completed' }),
      Appointment.countDocuments({ status: 'Cancelled' }),
      Appointment.countDocuments({ status: 'Scheduled' }),
      Appointment.countDocuments({ status: 'Confirmed' }),
      Appointment.find()
        .populate('patientId', 'name email phone')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name specialization' }
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      User.find({ role: 'patient' })
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

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

    const patients = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const user = await User.findById(patientId);

    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Delete doctor profile if user was also a doctor
    const doctorProfile = await Doctor.findOne({ userId: patientId });
    if (doctorProfile) {
      await Appointment.deleteMany({ doctorId: doctorProfile._id });
      await Doctor.findByIdAndDelete(doctorProfile._id);
    }

    // Delete all appointments created by this patient
    await Appointment.deleteMany({ patientId: patientId });

    // Delete User document
    await User.findByIdAndDelete(patientId);

    res.json({ message: 'Patient account and all associated appointments removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'name email phone role address').sort({ createdAt: -1 }).lean();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminAppointments = async (req, res) => {
  try {
    await cleanOrphanedAppointments();
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
      .sort({ createdAt: -1 })
      .lean();

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
  deletePatient,
  getAdminDoctors,
  getAdminAppointments
};
