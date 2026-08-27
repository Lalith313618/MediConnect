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
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css'
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  totalAppointments: Appointment[] = [];
  todaysAppointments: Appointment[] = [];
  todayDateStr = new Date().toISOString().split('T')[0];
  completedCount = 0;
  scheduledCount = 0;
  private appSub?: Subscription;

  constructor(
    public authService: AuthService,
    private appointmentService: AppointmentService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isDoctor()) {
      this.loadAppointments();
    }
    this.appSub = this.appointmentService.appointmentUpdated$.subscribe(() => {
      if (this.authService.isDoctor()) {
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
        const fetched = data || [];
        this.totalAppointments = fetched;
        this.todaysAppointments = fetched.filter((a) => a.appointmentDate === this.todayDateStr);
        this.completedCount = fetched.filter((a) => a.status === 'Completed').length;
        this.scheduledCount = fetched.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed').length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  updateStatus(id: string, newStatus: string): void {
    this.appointmentService.updateAppointmentStatus(id, newStatus).subscribe({
      next: () => {
        this.toastService.success(`Appointment status updated to ${newStatus}`);
        this.loadAppointments();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Status update failed')
    });
  }

  getPatientName(app: Appointment): string {
    if (typeof app.patientId === 'object') {
      return app.patientId.name || 'Patient';
    }
    return 'Patient User';
  }

  getPatientPhone(app: Appointment): string {
    if (typeof app.patientId === 'object' && app.patientId.phone) {
      return app.patientId.phone;
    }
    return 'N/A';
  }
}
