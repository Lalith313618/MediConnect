import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

import { LandingComponent } from './features/landing/landing.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';

import { PatientDashboardComponent } from './features/patient/patient-dashboard.component';
import { DoctorListComponent } from './features/patient/doctor-list.component';
import { DoctorDetailComponent } from './features/patient/doctor-detail.component';
import { MyAppointmentsComponent } from './features/patient/my-appointments.component';
import { PatientProfileComponent } from './features/patient/patient-profile.component';

import { DoctorDashboardComponent } from './features/doctor/doctor-dashboard.component';
import { DoctorAppointmentsComponent } from './features/doctor/doctor-appointments.component';
import { DoctorAvailabilityComponent } from './features/doctor/doctor-availability.component';
import { DoctorProfileComponent } from './features/doctor/doctor-profile.component';

import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { AdminDoctorsComponent } from './features/admin/admin-doctors.component';
import { AdminPatientsComponent } from './features/admin/admin-patients.component';
import { AdminAppointmentsComponent } from './features/admin/admin-appointments.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: 'patient/dashboard',
    component: PatientDashboardComponent,
    canActivate: [authGuard, roleGuard(['patient'])]
  },
  {
    path: 'patient/doctors',
    component: DoctorListComponent,
    canActivate: [authGuard, roleGuard(['patient'])]
  },
  {
    path: 'patient/doctors/:id',
    component: DoctorDetailComponent,
    canActivate: [authGuard, roleGuard(['patient'])]
  },
  {
    path: 'patient/appointments',
    component: MyAppointmentsComponent,
    canActivate: [authGuard, roleGuard(['patient'])]
  },
  {
    path: 'patient/profile',
    component: PatientProfileComponent,
    canActivate: [authGuard, roleGuard(['patient'])]
  },

  {
    path: 'doctor/dashboard',
    component: DoctorDashboardComponent,
    canActivate: [authGuard, roleGuard(['doctor'])]
  },
  {
    path: 'doctor/appointments',
    component: DoctorAppointmentsComponent,
    canActivate: [authGuard, roleGuard(['doctor'])]
  },
  {
    path: 'doctor/availability',
    redirectTo: 'doctor/dashboard'
  },
  {
    path: 'doctor/profile',
    component: DoctorProfileComponent,
    canActivate: [authGuard, roleGuard(['doctor'])]
  },

  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  {
    path: 'admin/doctors',
    component: AdminDoctorsComponent,
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  {
    path: 'admin/patients',
    component: AdminPatientsComponent,
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  {
    path: 'admin/appointments',
    component: AdminAppointmentsComponent,
    canActivate: [authGuard, roleGuard(['admin'])]
  },

  { path: '**', redirectTo: '' }
];
