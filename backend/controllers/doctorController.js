const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const getDoctors = async (req, res) => {
  try {
    const { specialization, search } = req.query;
    let query = {};

    if (specialization && specialization !== 'All' && specialization.trim() !== '') {
      query.specialization = { $regex: specialization.trim(), $options: 'i' };
    }

    let doctors = await Doctor.find(query).populate('userId', 'name email phone role address').lean();

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      doctors = doctors.filter((doc) => {
        const docName = (doc.userId && typeof doc.userId === 'object' && doc.userId.name)
          ? doc.userId.name
          : (doc.name || '');
        const docEmail = (doc.userId && typeof doc.userId === 'object' && doc.userId.email)
          ? doc.userId.email
          : (doc.email || '');
        const docSpec = doc.specialization || '';
        const docQual = doc.qualification || '';
        const docBio = doc.bio || '';

        return (
          searchRegex.test(docName) ||
          searchRegex.test(docEmail) ||
          searchRegex.test(docSpec) ||
          searchRegex.test(docQual) ||
          searchRegex.test(docBio)
        );
      });
    }

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    // Note: :id could be doctorId or userId
    let doctor = await Doctor.findById(req.params.id).populate('userId', 'name email phone role address');
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: req.params.id }).populate('userId', 'name email phone role address');
    }

    if (!doctor) {
      const userDoc = await User.findById(req.params.id);
      if (userDoc && userDoc.role === 'doctor') {
        const defaultAvailability = [
          { day: 'Monday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
          { day: 'Tuesday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
          { day: 'Wednesday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
          { day: 'Thursday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
          { day: 'Friday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] }
        ];

        const createdDoc = await Doctor.create({
          userId: userDoc._id,
          specialization: 'General Medicine',
          qualification: 'MBBS',
          experience: 1,
          consultationFee: 100,
          profileImage: '',
          bio: 'Medical professional registered on MediConnect.',
          availability: defaultAvailability
        });
        doctor = await Doctor.findById(createdDoc._id).populate('userId', 'name email phone role address');
      }
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create doctor (Admin only)
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      qualification,
      experience,
      consultationFee,
      profileImage,
      bio,
      availability
    } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({ message: 'Name, email, password, and specialization are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user with doctor role
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: 'doctor'
    });

    const defaultAvailability = [
      { day: 'Monday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
      { day: 'Tuesday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
      { day: 'Friday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] }
    ];

    const doctor = await Doctor.create({
      userId: user._id,
      specialization,
      qualification: qualification || 'MBBS, MD',
      experience: experience || 5,
      consultationFee: consultationFee || 500,
      profileImage: profileImage || '',
      bio: bio || 'Dedicated medical professional providing modern quality healthcare.',
      availability: availability || defaultAvailability
    });

    const populatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'name email phone role address');
    res.status(201).json(populatedDoctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update doctor details
// @route   PUT /api/doctors/:id
// @access  Private (Doctor / Admin)
const updateDoctor = async (req, res) => {
  try {
    let doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: req.params.id });
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor record not found' });
    }

    // Check authorization: User updating must be Admin or the Doctor themselves
    if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this doctor profile' });
    }

    // Update user info if name, email, phone, or password provided
    if (req.body.name || req.body.email || req.body.phone !== undefined || req.body.password) {
      const user = await User.findById(doctor.userId);
      if (user) {
        if (req.body.name) user.name = req.body.name;
        if (req.body.phone !== undefined) user.phone = req.body.phone;

        if (req.body.email && req.body.email.trim().toLowerCase() !== user.email) {
          const emailExists = await User.findOne({ email: req.body.email.trim().toLowerCase() });
          if (emailExists && emailExists._id.toString() !== user._id.toString()) {
            return res.status(400).json({ message: 'User with this email already exists' });
          }
          user.email = req.body.email.trim().toLowerCase();
        }

        if (req.body.password && req.body.password.trim().length >= 6) {
          user.password = req.body.password.trim();
        }

        await user.save();
      }
    }

    doctor.specialization = req.body.specialization || doctor.specialization;
    doctor.qualification = req.body.qualification || doctor.qualification;
    doctor.experience = req.body.experience !== undefined ? req.body.experience : doctor.experience;
    doctor.consultationFee = req.body.consultationFee !== undefined ? req.body.consultationFee : doctor.consultationFee;
    if (req.body.profileImage !== undefined) {
      doctor.profileImage = req.body.profileImage;
    }
    doctor.bio = req.body.bio || doctor.bio;

    if (req.body.availability) {
      doctor.availability = req.body.availability;
    }

    await doctor.save();
    const updatedDoctor = await Doctor.findById(doctor._id).populate('userId', 'name email phone role address');

    res.json(updatedDoctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete doctor (Admin only)
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res) => {
  try {
    let doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: req.params.id });
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Delete associated User account and Doctor record
    await User.findByIdAndDelete(doctor.userId);
    await Doctor.findByIdAndDelete(doctor._id);

    // Delete all appointments linked to this doctor
    await Appointment.deleteMany({ doctorId: doctor._id });

    res.json({ message: 'Doctor, user account, and all associated appointments removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update doctor availability
// @route   PUT /api/doctors/:id/availability
// @access  Private (Doctor / Admin)
const updateAvailability = async (req, res) => {
  try {
    let doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      doctor = await Doctor.findOne({ userId: req.params.id });
    }

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update availability' });
    }

    const { availability } = req.body;
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ message: 'Availability array is required' });
    }

    doctor.availability = availability;
    await doctor.save();

    res.json({ message: 'Availability updated successfully', availability: doctor.availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateAvailability
};
