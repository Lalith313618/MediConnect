import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Appointment } from '../../core/models/appointment.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './doctor-appointments.component.html',
  styleUrl: './doctor-appointments.component.css'
})
export class DoctorAppointmentsComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  statusFilter: string = 'All';
  dateFilter: string = '';
  private appSub?: Subscription;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
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
    const filters: any = {};
    if (this.statusFilter !== 'All') filters.status = this.statusFilter;
    if (this.dateFilter) filters.date = this.dateFilter;

    this.appointmentService.getAppointments(filters).subscribe({
      next: (data) => {
        this.appointments = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  resetFilters(): void {
    this.statusFilter = 'All';
    this.dateFilter = '';
    this.loadAppointments();
  }

  onStatusChange(id: string, newStatus: string): void {
    this.appointmentService.updateAppointmentStatus(id, newStatus).subscribe({
      next: () => {
        this.toastService.success(`Appointment status updated to ${newStatus}`);
        this.loadAppointments();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Status update failed')
    });
  }

  getPatientName(app: Appointment): string {
    return (typeof app.patientId === 'object' && app.patientId.name) ? app.patientId.name : 'Patient';
  }

  getPatientEmail(app: Appointment): string {
    return (typeof app.patientId === 'object' && app.patientId.email) ? app.patientId.email : '';
  }

  getPatientPhone(app: Appointment): string {
    return (typeof app.patientId === 'object' && app.patientId.phone) ? app.patientId.phone : 'N/A';
  }

  getPatientDOB(app: Appointment): string {
    return (typeof app.patientId === 'object' && app.patientId.dateOfBirth) ? app.patientId.dateOfBirth : 'N/A';
  }

  getPatientGender(app: Appointment): string {
    return (typeof app.patientId === 'object' && app.patientId.gender) ? app.patientId.gender : 'Unspecified';
  }
}
