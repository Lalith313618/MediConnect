import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService, DashboardStats } from '../../core/services/admin.service';
import { DoctorService } from '../../core/services/doctor.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Doctor } from '../../core/models/doctor.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, StatusBadgeComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  data: DashboardStats | null = null;
  doctors: Doctor[] = [];
  loading = true;
  error: string | null = null;

  showModal = false;
  isEditMode = false;
  selectedDoctorId: string | null = null;
  doctorForm!: FormGroup;
  submitting = false;
  private appSub?: Subscription;

  constructor(
    private adminService: AdminService,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.authService.isAdmin()) {
      this.loadDashboard();
      this.loadDoctors();
    }
    this.appSub = this.appointmentService.appointmentUpdated$.subscribe(() => {
      if (this.authService.isAdmin()) {
        this.loadDashboard();
        this.loadDoctors();
      }
    });
  }

  ngOnDestroy(): void {
    this.appSub?.unsubscribe();
  }

  initForm(): void {
    this.doctorForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      specialization: ['', [Validators.required]],
      qualification: ['MBBS, MD'],
      experience: [5],
      consultationFee: [150],
      bio: ['']
    });
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Admin Dashboard Error:', err);
        this.error = err?.error?.message || 'Failed to load dashboard data. Please check connection.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (res) => {
        this.doctors = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Load Doctors Error:', err)
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedDoctorId = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(doc: Doctor): void {
    this.isEditMode = true;
    this.selectedDoctorId = doc._id;
    this.doctorForm = this.fb.group({
      specialization: [doc.specialization, [Validators.required]],
      qualification: [doc.qualification || 'MBBS, MD'],
      experience: [doc.experience || 5],
      consultationFee: [doc.consultationFee || 150],
      bio: [doc.bio || '']
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveDoctor(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    if (this.isEditMode && this.selectedDoctorId) {
      this.doctorService.updateDoctor(this.selectedDoctorId, this.doctorForm.value).subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.success('Doctor details updated successfully!');
          this.closeModal();
          this.loadDoctors();
          this.loadDashboard();
        },
        error: (err) => {
          this.submitting = false;
          this.toastService.error(err.error?.message || 'Update failed.');
        }
      });
    } else {
      this.doctorService.createDoctor(this.doctorForm.value).subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.success('Doctor account created successfully!');
          this.closeModal();
          this.loadDoctors();
          this.loadDashboard();
        },
        error: (err) => {
          this.submitting = false;
          this.toastService.error(err.error?.message || 'Creation failed.');
        }
      });
    }
  }

  deleteDoctor(id: string): void {
    if (confirm('Are you sure you want to remove this doctor?')) {
      this.doctorService.deleteDoctor(id).subscribe({
        next: () => {
          this.toastService.success('Doctor removed successfully.');
          this.loadDoctors();
          this.loadDashboard();
        },
        error: (err) => this.toastService.error(err.error?.message || 'Delete failed.')
      });
    }
  }

  getPatientName(app: any): string {
    return app.patientId?.name || 'Patient';
  }

  getDoctorName(app: any): string {
    return app.doctorId?.userId?.name || 'Doctor';
  }

  getDocName(doc: Doctor): string {
    return (typeof doc.userId === 'object' && doc.userId?.name) ? doc.userId.name : 'Dr. Doctor';
  }

  getDocEmail(doc: Doctor): string {
    return (typeof doc.userId === 'object' && doc.userId?.email) ? doc.userId.email : '';
  }
}
