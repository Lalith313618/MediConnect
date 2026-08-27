const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mediconnect_jwt_super_secret_key_2026_health', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, dateOfBirth, gender, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Default allowed role for self-registration is patient (unless specifically admin creation)
    const userRole = role && ['patient', 'doctor'].includes(role) ? role : 'patient';

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: phone || '',
      role: userRole,
      dateOfBirth: dateOfBirth || '',
      gender: gender || '',
      address: address || ''
    });

    if (user) {
      if (user.role === 'doctor') {
        const defaultAvailability = [
          { day: 'Monday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
          { day: 'Tuesday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
          { day: 'Wednesday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
          { day: 'Thursday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] },
          { day: 'Friday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM'] }
        ];

        await Doctor.create({
          userId: user._id,
          specialization: req.body.specialization || 'General Medicine',
          qualification: req.body.qualification || 'MBBS',
          experience: req.body.experience || 1,
          consultationFee: req.body.consultationFee || 100,
          profileImage: req.body.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
          bio: req.body.bio || 'Medical professional providing healthcare services.',
          availability: defaultAvailability
        });
      }
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        createdAt: user.createdAt
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.dateOfBirth = req.body.dateOfBirth !== undefined ? req.body.dateOfBirth : user.dateOfBirth;
      user.gender = req.body.gender !== undefined ? req.body.gender : user.gender;
      user.address = req.body.address !== undefined ? req.body.address : user.address;

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

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        address: updatedUser.address,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};
