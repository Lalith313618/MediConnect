const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

module.exports = router;
