import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  selectedRole: 'patient' | 'doctor' = 'patient';

  rawImageSource: string | null = null;
  zoomLevel = 100;
  offsetX = 0;
  offsetY = 0;
  showImageAdjuster = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  selectRole(role: 'patient' | 'doctor'): void {
    if (this.selectedRole === role) return;
    this.selectedRole = role;
    this.rawImageSource = null;
    this.showImageAdjuster = false;
    this.initForm();
  }

  initForm(): void {
    if (this.selectedRole === 'patient') {
      this.registerForm = this.fb.group({
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        phone: [''],
        dateOfBirth: [''],
        gender: [''],
        address: ['']
      });
    } else {
      this.registerForm = this.fb.group({
        doctorAccessCode: ['', [Validators.required]],
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        phone: [''],
        specialization: ['', [Validators.required]],
        qualification: ['MBBS, MD'],
        experience: [5],
        consultationFee: [500],
        profileImage: [''],
        bio: ['']
      });
    }
  }

  get f() {
    return this.registerForm.controls;
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
    this.registerForm.patchValue({ profileImage: '' });
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
      this.registerForm.patchValue({ profileImage: dataUrl });
      this.cdr.detectChanges();
    };
    img.onerror = () => {
      this.registerForm.patchValue({ profileImage: this.rawImageSource });
      this.cdr.detectChanges();
    };
    img.src = this.rawImageSource;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = './doctors.png';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = {
      ...this.registerForm.value,
      role: this.selectedRole
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.success(`Account created successfully! Welcome ${res.name}`);
        if (res.role === 'doctor') {
          this.router.navigate(['/doctor/dashboard']);
        } else {
          this.router.navigate(['/patient/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Registration failed. Please check inputs.');
        this.cdr.detectChanges();
      }
    });
  }
}
