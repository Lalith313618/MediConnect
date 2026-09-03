const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

dotenv.config({ path: __dirname + '/../.env' });

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mediconnect';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Ensure default Admin user exists without clearing existing records
    const adminExists = await User.findOne({ email: 'admin@mediconnect.com' });
    if (!adminExists) {
      await User.create({
        name: 'MediConnect Admin',
        email: 'admin@mediconnect.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '7648736763',
        dateOfBirth: '1985-04-12',
        gender: 'Male',
        address: '742 Evergreen Terrace, Healthcare Plaza, Suite 400'
      });
      console.log('Default Admin user created (admin@mediconnect.com / Admin@123).');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Seed check complete. Existing users, doctors, and appointments preserved.');

    
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error seeding data:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
