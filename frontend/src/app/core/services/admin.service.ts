import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Doctor } from '../models/doctor.model';
import { Appointment } from '../models/appointment.model';

export interface DashboardStats {
  stats: {
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    todaysAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    scheduledAppointments: number;
    confirmedAppointments: number;
  };
  recentAppointments: Appointment[];
  recentPatients: User[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private get apiUrl(): string {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api/admin' : '/api/admin';
  }

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
  }

  getPatients(search?: string): Observable<User[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<User[]>(`${this.apiUrl}/patients`, { params });
  }

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors`);
  }

  getAppointments(filters?: { status?: string; date?: string; search?: string }): Observable<Appointment[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.date) params = params.set('date', filters.date);
    if (filters?.search) params = params.set('search', filters.search);
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`, { params });
  }
}
