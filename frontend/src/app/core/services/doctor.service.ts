import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Doctor, DayAvailability } from '../models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private get apiUrl(): string {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:5000/api/doctors' : '/api/doctors';
  }

  private cacheMap = new Map<string, Doctor[]>();
  private doctorDetailCache = new Map<string, Doctor>();

  constructor(private http: HttpClient) {}

  clearCache(): void {
    this.cacheMap.clear();
    this.doctorDetailCache.clear();
  }

  getDoctors(specialization?: string, search?: string, forceRefresh = false): Observable<Doctor[]> {
    const key = `${specialization || 'All'}_${search || ''}`;
    if (this.cacheMap.has(key) && !forceRefresh) {
      let params = new HttpParams();
      if (specialization && specialization !== 'All' && specialization.trim() !== '') {
        params = params.set('specialization', specialization.trim());
      }
      if (search && search.trim() !== '') {
        params = params.set('search', search.trim());
      }
      this.http.get<Doctor[]>(this.apiUrl, { params }).subscribe({
        next: (data) => this.cacheMap.set(key, data)
      });
      return of(this.cacheMap.get(key)!);
    }

    let params = new HttpParams();
    if (specialization && specialization !== 'All' && specialization.trim() !== '') {
      params = params.set('specialization', specialization.trim());
    }
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<Doctor[]>(this.apiUrl, { params }).pipe(
      tap((doctors) => this.cacheMap.set(key, doctors))
    );
  }

  getDoctorById(id: string, forceRefresh = false): Observable<Doctor> {
    if (this.doctorDetailCache.has(id) && !forceRefresh) {
      this.http.get<Doctor>(`${this.apiUrl}/${id}`).subscribe({
        next: (doc) => this.doctorDetailCache.set(id, doc)
      });
      return of(this.doctorDetailCache.get(id)!);
    }
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`).pipe(
      tap((doc) => this.doctorDetailCache.set(id, doc))
    );
  }

  createDoctor(doctorData: any): Observable<Doctor> {
    return this.http.post<Doctor>(this.apiUrl, doctorData).pipe(
      tap(() => this.clearCache())
    );
  }

  updateDoctor(id: string, doctorData: any): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/${id}`, doctorData).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteDoctor(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }

  updateAvailability(id: string, availability: DayAvailability[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/availability`, { availability }).pipe(
      tap(() => this.clearCache())
    );
  }
}
