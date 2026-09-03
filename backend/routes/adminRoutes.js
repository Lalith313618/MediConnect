const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPatients,
  deletePatient,
  getAdminDoctors,
  getAdminAppointments
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/patients', getPatients);
router.delete('/patients/:id', deletePatient);
router.get('/doctors', getAdminDoctors);
router.get('/appointments', getAdminAppointments);

module.exports = router;
