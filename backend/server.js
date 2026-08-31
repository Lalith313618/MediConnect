const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorMiddleware');
const seedData = require('./utils/seed');
const User = require('./models/User');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error.message);
    res.status(500).json({
      message: `Database connection failed: ${error.message}`,
      error: error.message
    });
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/auth', require('./routes/authRoutes'));

app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/doctors', require('./routes/doctorRoutes'));

app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/appointments', require('./routes/appointmentRoutes'));

app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => {
  res.json({
    message: 'MediConnect API Server Running Smoothly',
    status: 'Healthy',
    timestamp: new Date()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MediConnect Backend is healthy'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MediConnect Backend is healthy'
  });
});

app.get('/api/seed', async (req, res) => {
  try {
    await seedData();
    res.json({
      message: 'Database seeded successfully with sample accounts and data!'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Seeding failed',
      error: error.message
    });
  }
});

app.get('/seed', async (req, res) => {
  try {
    await seedData();
    res.json({
      message: 'Database seeded successfully with sample accounts and data!'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Seeding failed',
      error: error.message
    });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `\n🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'
      } mode`
    );
    console.log(`📱 Network access: http://192.168.1.144:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `\n❌ Port ${PORT} is already in use. Please stop any process using port ${PORT} or change PORT in .env.`
      );
    } else {
      console.error('Server error:', error);
    }
  });
}

module.exports = app;