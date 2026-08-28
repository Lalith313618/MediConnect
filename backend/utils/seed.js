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
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});

    console.log('Cleared existing records.');

    const adminUser = await User.create({
      name: 'MediConnect Admin',
      email: 'admin@mediconnect.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '7648736763',
      dateOfBirth: '1985-04-12',
      gender: 'Male',
      address: '742 Evergreen Terrace, Healthcare Plaza, Suite 400'
    });

    const patientUser = await User.create({
      name: 'John Doe',
      email: 'john.doe@mediconnect.com',
      password: 'Patient@123',
      role: 'patient',
      phone: '9834637263',
      dateOfBirth: '1990-08-15',
      gender: 'Male',
      address: '123 Health Ave, Suite 101, New York, NY'
    });

    const doctorUsersData = [
      {
        name: 'Dr. Sarah Jenkins',
        email: 'dr.jenkins@mediconnect.com',
        password: 'Doctor@123',
        phone: '7283462834',
        specialization: 'Cardiology',
        qualification: 'MD, FACC, Harvard Medical School',
        experience: 14,
        consultationFee: 150,
        profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
        bio: 'Senior Cardiologist specializing in preventive cardiology, heart failure management, and advanced echocardiography with over 14 years of clinical experience.'
      },
      {
        name: 'Dr. Michael Carter',
        email: 'dr.carter@mediconnect.com',
        password: 'Doctor@123',
        phone: '9846723462',
        specialization: 'Neurology',
        qualification: 'MBBS, MD (Neurology), Johns Hopkins',
        experience: 12,
        consultationFee: 180,
        profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
        bio: 'Board-certified Neurologist with expertise in stroke prevention, movement disorders, migraine therapy, and neurological diagnostics.'
      },
      {
        name: 'Dr. Robert Patel',
        email: 'dr.patel@mediconnect.com',
        password: 'Doctor@123',
        phone: '7326482346',
        specialization: 'Dermatology',
        qualification: 'MD, DNB (Dermatology)',
        experience: 11,
        consultationFee: 140,
        profileImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
        bio: 'Expert Dermatologist providing comprehensive care for skin conditions, laser therapy, acne management, and cosmetic dermatology.'
      },
      {
        name: 'Dr. Amanda Vance',
        email: 'dr.vance@mediconnect.com',
        password: 'Doctor@123',
        phone: '8372648746',
        specialization: 'Orthopedics',
        qualification: 'MS (Orthopedics), FRCS',
        experience: 16,
        consultationFee: 160,
        profileImage: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&auto=format&fit=crop&q=80',
        bio: 'Orthopedic Surgeon specializing in joint replacement surgery, sports injuries, fracture management, and arthroscopic procedures.'
      }
    ];

    const doctorsCreated = [];
    const defaultAvailability = [
      { day: 'Monday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'] },
      { day: 'Tuesday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'] },
      { day: 'Friday', slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'] }
    ];

    for (const dData of doctorUsersData) {
      const u = await User.create({
        name: dData.name,
        email: dData.email,
        password: dData.password,
        role: 'doctor',
        phone: dData.phone,
        address: 'MediConnect Medical Center, Wing B'
      });

      const d = await Doctor.create({
        userId: u._id,
        specialization: dData.specialization,
        qualification: dData.qualification,
        experience: dData.experience,
        consultationFee: dData.consultationFee,
        profileImage: dData.profileImage,
        bio: dData.bio,
        availability: defaultAvailability
      });

      doctorsCreated.push(d);
    }

    console.log('Seeding completed successfully!');
    console.log('\n--- Credentials Summary ---');
    console.log('ADMIN: admin@mediconnect.com / Admin@123');
    console.log('PATIENT: john.doe@mediconnect.com / Patient@123');
    console.log('DOCTOR: dr.jenkins@mediconnect.com / Doctor@123');

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
