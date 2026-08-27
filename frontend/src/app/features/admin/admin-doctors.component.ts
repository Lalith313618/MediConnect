import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DoctorService } from '../../core/services/doctor.service';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { Doctor } from '../../core/models/doctor.model';

@Component({
  selector: 'app-admin-doctors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-doctors.component.html',
  styleUrl: './admin-doctors.component.css'
})
export class AdminDoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  showModal = false;
  isEditMode = false;
  selectedDoctorId: string | null = null;
  doctorForm!: FormGroup;
  submitting = false;
  loading = true;

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private adminService: AdminService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDoctors();
    this.route.queryParams.subscribe((params) => {
      if (params['action'] === 'add' || params['add'] === 'true') {
        this.openAddModal();
      }
    });
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

  loadDoctors(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.adminService.getDoctors().subscribe({
      next: (data) => {
        this.doctors = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.toastService.error(err.error?.message || 'Failed to fetch doctor directory.');
        this.cdr.detectChanges();
      }
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
        },
        error: (err) => {
          this.submitting = false;
          this.toastService.error(err.error?.message || 'Creation failed.');
        }
      });
    }
  }

  deleteDoctor(id: string): void {
    if (confirm('Are you sure you want to remove this doctor and their login account?')) {
      this.doctorService.deleteDoctor(id).subscribe({
        next: () => {
          this.toastService.success('Doctor removed from system.');
          this.loadDoctors();
        },
        error: (err) => this.toastService.error(err.error?.message || 'Delete failed.')
      });
    }
  }

  getDocName(doc: Doctor): string {
    return (typeof doc.userId === 'object' && doc.userId?.name) ? doc.userId.name : 'Dr. Doctor';
  }

  getDocEmail(doc: Doctor): string {
    return (typeof doc.userId === 'object' && doc.userId?.email) ? doc.userId.email : '';
  }
}
