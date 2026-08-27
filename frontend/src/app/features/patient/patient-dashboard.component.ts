import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { Appointment } from '../../core/models/appointment.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css'
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  totalAppointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];
  nextAppointment: Appointment | null = null;
  completedCount = 0;
  cancelledCount = 0;
  private appSub?: Subscription;

  constructor(
    public authService: AuthService,
    private appointmentService: AppointmentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isPatient()) {
      this.fetchAppointments();
    }
    this.appSub = this.appointmentService.appointmentUpdated$.subscribe(() => {
      if (this.authService.isPatient()) {
        this.fetchAppointments();
      }
    });
  }

  ngOnDestroy(): void {
    this.appSub?.unsubscribe();
  }

  fetchAppointments(): void {
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.totalAppointments = data || [];
        this.upcomingAppointments = (data || []).filter(
          (a) => a.status === 'Scheduled' || a.status === 'Confirmed'
        );
        this.nextAppointment = this.upcomingAppointments.length > 0 ? this.upcomingAppointments[0] : null;
        this.completedCount = (data || []).filter((a) => a.status === 'Completed').length;
        this.cancelledCount = (data || []).filter((a) => a.status === 'Cancelled').length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  getDoctorName(app: Appointment | any): string {
    if (app && app.doctorId) {
      if (typeof app.doctorId === 'object') {
        if (app.doctorId.userId && typeof app.doctorId.userId === 'object' && app.doctorId.userId.name) {
          return app.doctorId.userId.name;
        }
        if (app.doctorId.name) return app.doctorId.name;
      }
    }
    return 'Dr. Medical Specialist';
  }

  getDoctorSpec(app: Appointment | any): string {
    if (app && app.doctorId && typeof app.doctorId === 'object') {
      return app.doctorId.specialization || 'Healthcare Specialist';
    }
    return 'Specialist';
  }

  getDoctorPhoto(app: Appointment | any): string {
    if (app && app.doctorId && typeof app.doctorId === 'object' && app.doctorId.profileImage) {
      return app.doctorId.profileImage;
    }
    return './doctors.png';
  }
}
