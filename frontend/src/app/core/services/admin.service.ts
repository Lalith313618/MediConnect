import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
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
    if (typeof window !== 'undefined') {

      const hostname = window.location.hostname;
      const port = window.location.port;

      // Local development
      // PC:     http://localhost:4200
      // Mobile: http://192.168.1.144:4200
      //
      // In both cases, connect to backend on port 5000.
      if (port === '4200') {
        return `${window.location.protocol}//${hostname}:5000/api/admin`;
      }
    }

    // Production / deployed version
    return '/api/admin';
  }

  private cache = {
    stats: null as DashboardStats | null,
    doctors: null as Doctor[] | null,
    patientsMap: new Map<string, User[]>(),
    appointmentsMap: new Map<string, Appointment[]>()
  };

  constructor(private http: HttpClient) { }

  clearCache(): void {
    this.cache.stats = null;
    this.cache.doctors = null;
    this.cache.patientsMap.clear();
    this.cache.appointmentsMap.clear();
  }

  getDashboardStats(
    forceRefresh = false
  ): Observable<DashboardStats> {

    if (this.cache.stats && !forceRefresh) {

      this.http
        .get<DashboardStats>(
          `${this.apiUrl}/dashboard`
        )
        .subscribe({
          next: (data) => {
            this.cache.stats = data;
          }
        });

      return of(this.cache.stats);
    }

    return this.http
      .get<DashboardStats>(
        `${this.apiUrl}/dashboard`
      )
      .pipe(
        tap((data) => {
          this.cache.stats = data;
        })
      );
  }

  getPatients(
    search?: string,
    forceRefresh = false
  ): Observable<User[]> {

    const key = search || '__all__';

    if (
      this.cache.patientsMap.has(key) &&
      !forceRefresh
    ) {

      let params = new HttpParams();

      if (search) {
        params = params.set(
          'search',
          search
        );
      }

      this.http
        .get<User[]>(
          `${this.apiUrl}/patients`,
          { params }
        )
        .subscribe({
          next: (data) => {
            this.cache.patientsMap.set(
              key,
              data
            );
          }
        });

      return of(
        this.cache.patientsMap.get(key)!
      );
    }

    let params = new HttpParams();

    if (search) {
      params = params.set(
        'search',
        search
      );
    }

    return this.http
      .get<User[]>(
        `${this.apiUrl}/patients`,
        { params }
      )
      .pipe(
        tap((data) => {
          this.cache.patientsMap.set(
            key,
            data
          );
        })
      );
  }

  getDoctors(
    forceRefresh = false
  ): Observable<Doctor[]> {

    if (
      this.cache.doctors &&
      !forceRefresh
    ) {

      this.http
        .get<Doctor[]>(
          `${this.apiUrl}/doctors`
        )
        .subscribe({
          next: (data) => {
            this.cache.doctors = data;
          }
        });

      return of(this.cache.doctors);
    }

    return this.http
      .get<Doctor[]>(
        `${this.apiUrl}/doctors`
      )
      .pipe(
        tap((data) => {
          this.cache.doctors = data;
        })
      );
  }

  getAppointments(
    filters?: {
      status?: string;
      date?: string;
      search?: string;
    },
    forceRefresh = false
  ): Observable<Appointment[]> {

    const key = JSON.stringify(
      filters || {}
    );

    if (
      this.cache.appointmentsMap.has(key) &&
      !forceRefresh
    ) {

      let params = new HttpParams();

      if (filters?.status) {
        params = params.set(
          'status',
          filters.status
        );
      }

      if (filters?.date) {
        params = params.set(
          'date',
          filters.date
        );
      }

      if (filters?.search) {
        params = params.set(
          'search',
          filters.search
        );
      }

      this.http
        .get<Appointment[]>(
          `${this.apiUrl}/appointments`,
          { params }
        )
        .subscribe({
          next: (data) => {
            this.cache.appointmentsMap.set(
              key,
              data
            );
          }
        });

      return of(
        this.cache.appointmentsMap.get(key)!
      );
    }

    let params = new HttpParams();

    if (filters?.status) {
      params = params.set(
        'status',
        filters.status
      );
    }

    if (filters?.date) {
      params = params.set(
        'date',
        filters.date
      );
    }

    if (filters?.search) {
      params = params.set(
        'search',
        filters.search
      );
    }

    return this.http
      .get<Appointment[]>(
        `${this.apiUrl}/appointments`,
        { params }
      )
      .pipe(
        tap((data) => {
          this.cache.appointmentsMap.set(
            key,
            data
          );
        })
      );
  }
}