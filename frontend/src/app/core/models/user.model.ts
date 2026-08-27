export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  createdAt?: string;
  token?: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  token: string;
}
