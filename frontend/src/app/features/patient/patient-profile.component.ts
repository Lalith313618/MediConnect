import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-profile.component.html',
  styleUrl: './patient-profile.component.css'
})
export class PatientProfileComponent implements OnInit {
  profileForm!: FormGroup;
  user: User | null = null;
  saving = false;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;

    this.profileForm = this.fb.group({
      name: [this.user?.name || '', [Validators.required]],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      phone: [this.user?.phone || ''],
      dateOfBirth: [this.user?.dateOfBirth || ''],
      gender: [this.user?.gender || ''],
      address: [this.user?.address || '']
    });
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.saving = true;
    this.cdr.detectChanges();

    const payload = { ...this.profileForm.value };
    if (!payload.password || payload.password.trim() === '') {
      delete payload.password;
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.saving = false;
        this.user = this.authService.currentUserValue;
        this.toastService.success('Profile & login info updated successfully!');
        this.profileForm.patchValue({ password: '' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err.error?.message || 'Failed to update profile.');
        this.cdr.detectChanges();
      }
    });
  }
}
