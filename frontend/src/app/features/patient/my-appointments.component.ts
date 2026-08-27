import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Appointment } from '../../core/models/appointment.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './my-appointments.component.html',
  styleUrl: './my-appointments.component.css'
})
export class MyAppointmentsComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  tabs = ['All Appointments', 'Upcoming', 'Completed', 'Cancelled'];
  selectedTab = 'All Appointments';
  private appSub?: Subscription;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isPatient() || this.authService.isAdmin()) {
      this.loadAppointments();
    }
    this.appSub = this.appointmentService.appointmentUpdated$.subscribe(() => {
      if (this.authService.isPatient() || this.authService.isAdmin()) {
        this.loadAppointments();
      }
    });
  }

  ngOnDestroy(): void {
    this.appSub?.unsubscribe();
  }

  loadAppointments(): void {
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.appointments = data || [];
        this.filterAppointments();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  setTab(tab: string): void {
    this.selectedTab = tab;
    this.filterAppointments();
    this.cdr.detectChanges();
  }

  filterAppointments(): void {
    if (this.selectedTab === 'Upcoming') {
      this.filteredAppointments = this.appointments.filter(
        (a) => a.status === 'Scheduled' || a.status === 'Confirmed'
      );
    } else if (this.selectedTab === 'Completed') {
      this.filteredAppointments = this.appointments.filter((a) => a.status === 'Completed');
    } else if (this.selectedTab === 'Cancelled') {
      this.filteredAppointments = this.appointments.filter((a) => a.status === 'Cancelled');
    } else {
      this.filteredAppointments = [...this.appointments];
    }
  }

  cancelAppointment(id: string): void {
    if (confirm('Are you sure you want to cancel this appointment visit?')) {
      this.appointmentService.cancelAppointment(id).subscribe({
        next: () => {
          this.toastService.success('Appointment visit cancelled.');
          this.loadAppointments();
        },
        error: (err) => this.toastService.error(err.error?.message || 'Cancellation failed.')
      });
    }
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
