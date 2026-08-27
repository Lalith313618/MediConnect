import { User } from './user.model';

export interface DayAvailability {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  slots: string[];
}

export interface Doctor {
  _id: string;
  userId: User | string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  profileImage: string;
  bio: string;
  availability: DayAvailability[];
  createdAt?: string;
}
