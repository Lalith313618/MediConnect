import { User } from './user.model';
import { Doctor } from './doctor.model';

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Appointment {
  _id: string;
  patientId: User | string;
  doctorId: Doctor | string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: AppointmentStatus;
  createdAt?: string;
  updatedAt?: string;
}
