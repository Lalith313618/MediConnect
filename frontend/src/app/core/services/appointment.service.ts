import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, of, tap } from 'rxjs';
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private get apiUrl(): string {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api/appointments' : '/api/appointments';
  }
  private appointmentUpdatedSource = new Subject<void>();
  public appointmentUpdated$ = this.appointmentUpdatedSource.asObservable();

  private cacheMap = new Map<string, Appointment[]>();

  constructor(private http: HttpClient) {}

  clearCache(): void {
    this.cacheMap.clear();
  }

  notifyAppointmentUpdated(): void {
    this.clearCache();
    this.appointmentUpdatedSource.next();
  }

  createAppointment(data: {
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    reason?: string;
    patientId?: string;
  }): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, data).pipe(
      tap(() => this.notifyAppointmentUpdated())
    );
  }

  getAppointments(filters?: { status?: string; date?: string; doctorId?: string; patientId?: string }, forceRefresh = false): Observable<Appointment[]> {
    const key = JSON.stringify(filters || {});
    if (this.cacheMap.has(key) && !forceRefresh) {
      let params = new HttpParams();
      if (filters?.status) params = params.set('status', filters.status);
      if (filters?.date) params = params.set('date', filters.date);
      if (filters?.doctorId) params = params.set('doctorId', filters.doctorId);
      if (filters?.patientId) params = params.set('patientId', filters.patientId);

      this.http.get<Appointment[]>(this.apiUrl, { params }).subscribe({
        next: (apps) => this.cacheMap.set(key, apps)
      });
      return of(this.cacheMap.get(key)!);
    }

    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.date) params = params.set('date', filters.date);
    if (filters?.doctorId) params = params.set('doctorId', filters.doctorId);
    if (filters?.patientId) params = params.set('patientId', filters.patientId);

    return this.http.get<Appointment[]>(this.apiUrl, { params }).pipe(
      tap((apps) => this.cacheMap.set(key, apps))
    );
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  updateAppointmentStatus(id: string, status: string, reason?: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, { status, reason }).pipe(
      tap(() => this.notifyAppointmentUpdated())
    );
  }

  cancelAppointment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.notifyAppointmentUpdated())
    );
  }
}
