import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, StatusBadgeComponent],
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

  rawImageSource: string | null = null;
  zoomLevel = 100;
  offsetX = 0;
  offsetY = 0;
  showImageAdjuster = false;

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
      consultationFee: [500],
      profileImage: [''],
      bio: ['']
    });
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getDashboardStats(true).subscribe({
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
    this.doctorService.getDoctors(undefined, undefined, true).subscribe({
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
    this.rawImageSource = null;
    this.zoomLevel = 100;
    this.offsetX = 0;
    this.offsetY = 0;
    this.showImageAdjuster = false;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(doc: Doctor): void {
    this.isEditMode = true;
    this.selectedDoctorId = doc._id;
    this.rawImageSource = doc.profileImage || null;
    this.zoomLevel = 100;
    this.offsetX = 0;
    this.offsetY = 0;
    this.showImageAdjuster = !!doc.profileImage;
    this.doctorForm = this.fb.group({
      specialization: [doc.specialization, [Validators.required]],
      qualification: [doc.qualification || 'MBBS, MD'],
      experience: [doc.experience || 5],
      consultationFee: [doc.consultationFee || 500],
      profileImage: [doc.profileImage || ''],
      bio: [doc.bio || '']
    });
    this.showModal = true;
  }

  imageUrlInput = '';

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.rawImageSource = e.target.result as string;
        this.imageUrlInput = '';
        this.zoomLevel = 100;
        this.offsetX = 0;
        this.offsetY = 0;
        this.showImageAdjuster = true;
        this.renderAdjustedImage();
      };
      reader.readAsDataURL(file);
    }
  }

  onUrlInput(url: string): void {
    this.imageUrlInput = url;
    if (url && url.trim().length > 5) {
      this.rawImageSource = url.trim();
      this.showImageAdjuster = true;
      this.renderAdjustedImage();
    } else if (!url) {
      this.clearImage();
    }
  }

  onAdjustmentChange(): void {
    this.renderAdjustedImage();
  }

  resetAdjustments(): void {
    this.zoomLevel = 100;
    this.offsetX = 0;
    this.offsetY = 0;
    this.renderAdjustedImage();
  }

  clearImage(): void {
    this.rawImageSource = null;
    this.imageUrlInput = '';
    this.showImageAdjuster = false;
    this.zoomLevel = 100;
    this.offsetX = 0;
    this.offsetY = 0;
    this.doctorForm.patchValue({ profileImage: '' });
  }

  renderAdjustedImage(): void {
    if (!this.rawImageSource) return;

    const img = new Image();
    if (this.rawImageSource.startsWith('http://') || this.rawImageSource.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const targetSize = 400;
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const baseScale = Math.max(targetSize / img.width, targetSize / img.height);
      const zoomMultiplier = this.zoomLevel / 100;
      const finalScale = baseScale * zoomMultiplier;

      const drawWidth = img.width * finalScale;
      const drawHeight = img.height * finalScale;

      const baseDrawX = (targetSize - drawWidth) / 2;
      const baseDrawY = (targetSize - drawHeight) / 2;

      const shiftX = (this.offsetX / 100) * (drawWidth / 2);
      const shiftY = (this.offsetY / 100) * (drawHeight / 2);

      const finalX = baseDrawX + shiftX;
      const finalY = baseDrawY + shiftY;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetSize, targetSize);
      ctx.drawImage(img, finalX, finalY, drawWidth, drawHeight);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      this.doctorForm.patchValue({ profileImage: dataUrl });
      this.cdr.detectChanges();
    };
    img.onerror = () => {
      this.doctorForm.patchValue({ profileImage: this.rawImageSource });
      this.cdr.detectChanges();
    };
    img.src = this.rawImageSource;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = './doctors.png';
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
