const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPatients,
  getAdminDoctors,
  getAdminAppointments
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/patients', getPatients);
router.get('/doctors', getAdminDoctors);
router.get('/appointments', getAdminAppointments);

module.exports = router;
