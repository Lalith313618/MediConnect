import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Appointment } from '../../core/models/appointment.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './admin-appointments.component.html',
  styleUrl: './admin-appointments.component.css'
})
export class AdminAppointmentsComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  searchQuery: string = '';
  statusFilter: string = 'All';
  dateFilter: string = '';
  private appSub?: Subscription;

  constructor(
    private adminService: AdminService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadAppointments();
    }
    this.appSub = this.appointmentService.appointmentUpdated$.subscribe(() => {
      if (this.authService.isAdmin()) {
        this.loadAppointments();
      }
    });
  }

  ngOnDestroy(): void {
    this.appSub?.unsubscribe();
  }

  loadAppointments(): void {
    this.adminService
      .getAppointments({
        status: this.statusFilter !== 'All' ? this.statusFilter : undefined,
        date: this.dateFilter || undefined,
        search: this.searchQuery || undefined
      })
      .subscribe({
        next: (data) => {
          this.appointments = data || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'All';
    this.dateFilter = '';
    this.loadAppointments();
  }

  updateStatus(id: string, newStatus: string): void {
    this.appointmentService.updateAppointmentStatus(id, newStatus).subscribe({
      next: () => {
        this.toastService.success(`Appointment status updated to ${newStatus}`);
        this.loadAppointments();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Status override failed')
    });
  }

  getPatientName(app: Appointment): string {
    return (typeof app.patientId === 'object' && app.patientId.name) ? app.patientId.name : 'Patient';
  }

  getPatientEmail(app: Appointment): string {
    return (typeof app.patientId === 'object' && app.patientId.email) ? app.patientId.email : '';
  }

  getDoctorName(app: Appointment): string {
    if (typeof app.doctorId === 'object' && app.doctorId.userId) {
      const u = app.doctorId.userId as any;
      return u.name || 'Doctor';
    }
    return 'Dr. Doctor';
  }

  getDoctorSpec(app: Appointment): string {
    return typeof app.doctorId === 'object' ? app.doctorId.specialization : '';
  }
}
