import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';
import { Router } from '@angular/router';
import { DoctorService } from './doctor.service';
import { AdminService } from './admin.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private get apiUrl(): string {
    if (typeof window !== 'undefined') {

      const hostname = window.location.hostname;
      const port = window.location.port;

      if (port === '4200') {
        return `${window.location.protocol}//${hostname}:5000/api/auth`;
      }
    }

    return '/api/auth';
  }

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private doctorService: DoctorService,
    private adminService: AdminService
  ) {
    const savedUser = localStorage.getItem('mediconnect_user');
    const savedToken = localStorage.getItem('mediconnect_token');

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        if (!savedToken && parsedUser.token) {
          localStorage.setItem(
            'mediconnect_token',
            parsedUser.token
          );
        }

        this.currentUserSubject.next(parsedUser);

      } catch (e) {
        localStorage.removeItem('mediconnect_user');
        localStorage.removeItem('mediconnect_token');
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    const t = localStorage.getItem('mediconnect_token');

    if (t) {
      return t;
    }

    return this.currentUserValue?.token || null;
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/register`,
        userData
      )
      .pipe(
        tap((res) => this.handleAuthResponse(res))
      );
  }

  login(
    credentials: {
      email: string;
      password: string;
      role?: string;
    }
  ): Observable<AuthResponse> {

    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/login`,
        credentials
      )
      .pipe(
        tap((res) => this.handleAuthResponse(res))
      );
  }

  getProfile(): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/profile`)
      .pipe(
        tap((user) => {

          const current = this.currentUserSubject.value;

          if (current) {

            const updated = {
              ...current,
              ...user
            };

            this.currentUserSubject.next(updated);

            localStorage.setItem(
              'mediconnect_user',
              JSON.stringify(updated)
            );
          }
        })
      );
  }

  updateProfile(profileData: any): Observable<User> {
    return this.http
      .put<User>(
        `${this.apiUrl}/profile`,
        profileData
      )
      .pipe(
        tap((updatedUser) => {
          this.updateUserSession(updatedUser);
        })
      );
  }

  updateUserSession(updatedUser: Partial<User>): void {

    const current = this.currentUserSubject.value;

    const newUserState = {
      ...current,
      ...updatedUser
    };

    if (updatedUser.token) {
      localStorage.setItem(
        'mediconnect_token',
        updatedUser.token
      );
    }

    this.currentUserSubject.next(
      newUserState as User
    );

    localStorage.setItem(
      'mediconnect_user',
      JSON.stringify(newUserState)
    );
  }

  logout(): void {
    localStorage.removeItem('mediconnect_token');
    localStorage.removeItem('mediconnect_user');

    this.doctorService.clearCache();
    this.adminService.clearCache();

    this.currentUserSubject.next(null);

    this.router.navigate(['/']);
  }

  private handleAuthResponse(res: AuthResponse): void {
    this.doctorService.clearCache();
    this.adminService.clearCache();

    if (res && res.token) {
      // Save token
      localStorage.setItem(
        'mediconnect_token',
        res.token
      );

      // Create user object
      const user: User = {
        _id: res._id,
        name: res.name,
        email: res.email,
        role: res.role,
        phone: res.phone,
        dateOfBirth: res.dateOfBirth,
        gender: res.gender,
        address: res.address,
        token: res.token
      };

      // Save user
      localStorage.setItem(
        'mediconnect_user',
        JSON.stringify(user)
      );

      // Update current user
      this.currentUserSubject.next(user);
    }
  }

  isLoggedIn(): boolean {
    return !!this.token && !!this.currentUserValue;
  }

  isPatient(): boolean {
    return this.currentUserValue?.role === 'patient';
  }

  isDoctor(): boolean {
    return this.currentUserValue?.role === 'doctor';
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }
}