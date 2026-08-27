import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DoctorService } from '../../core/services/doctor.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Doctor } from '../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css'
})
export class DoctorProfileComponent implements OnInit {
  doctor: Doctor | null = null;
  doctorForm!: FormGroup;
  loading = true;
  saving = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    public authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.doctorService.getDoctorById(user._id).subscribe({
        next: (doc) => {
          this.doctor = doc;
          this.loading = false;
          this.initForm(doc);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.errorMsg = 'Failed to load doctor profile credentials.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  initForm(doc: Doctor): void {
    const docName = (typeof doc.userId === 'object' && doc.userId?.name) ? doc.userId.name : '';
    const docEmail = (typeof doc.userId === 'object' && doc.userId?.email) ? doc.userId.email : '';
    const docPhone = (typeof doc.userId === 'object' && doc.userId?.phone) ? doc.userId.phone : '';

    this.doctorForm = this.fb.group({
      name: [docName, [Validators.required]],
      email: [docEmail, [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      phone: [docPhone],
      specialization: [doc.specialization, [Validators.required]],
      qualification: [doc.qualification || ''],
      experience: [doc.experience || 5],
      consultationFee: [doc.consultationFee || 100],
      profileImage: [doc.profileImage || ''],
      bio: [doc.bio || '']
    });
  }

  onSubmit(): void {
    if (!this.doctor || this.doctorForm.invalid) return;

    this.saving = true;
    this.cdr.detectChanges();

    const payload = { ...this.doctorForm.value };
    if (!payload.password || payload.password.trim() === '') {
      delete payload.password;
    }

    this.doctorService.updateDoctor(this.doctor._id, payload).subscribe({
      next: (updatedDoc) => {
        this.saving = false;
        this.doctor = updatedDoc;

        const docUser = typeof updatedDoc.userId === 'object' ? updatedDoc.userId : null;
        if (docUser) {
          this.authService.updateUserSession({
            name: docUser.name,
            email: docUser.email,
            phone: docUser.phone
          });
        }

        this.toastService.success('Doctor credentials & login info updated successfully!');
        this.doctorForm.patchValue({ password: '' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err.error?.message || 'Failed to update credentials.');
        this.cdr.detectChanges();
      }
    });
  }
}
