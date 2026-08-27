const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/database');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

dotenv.config();

const clearDB = async () => {
  try {
    await connectDB();
    console.log('Clearing all collections in MediConnect DB...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    console.log('✅ Database cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing database:', err);
    process.exit(1);
  }
};

clearDB();
