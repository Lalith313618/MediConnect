import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Doctor, DayAvailability } from '../models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = 'http://localhost:5000/api/doctors';

  constructor(private http: HttpClient) {}

  getDoctors(specialization?: string, search?: string): Observable<Doctor[]> {
    let params = new HttpParams();
    if (specialization && specialization !== 'All' && specialization.trim() !== '') {
      params = params.set('specialization', specialization.trim());
    }
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<Doctor[]>(this.apiUrl, { params });
  }

  getDoctorById(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`);
  }

  createDoctor(doctorData: any): Observable<Doctor> {
    return this.http.post<Doctor>(this.apiUrl, doctorData);
  }

  updateDoctor(id: string, doctorData: any): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.apiUrl}/${id}`, doctorData);
  }

  deleteDoctor(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  updateAvailability(id: string, availability: DayAvailability[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/availability`, { availability });
  }
}
