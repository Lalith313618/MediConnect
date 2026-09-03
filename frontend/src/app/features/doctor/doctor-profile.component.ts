import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DoctorService } from '../../core/services/doctor.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Doctor } from '../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css'
})
export class DoctorProfileComponent implements OnInit {
  doctor: Doctor | null = null;
  doctorForm!: FormGroup;
  loading = true;
  saving = false;
  errorMsg = '';

  rawImageSource: string | null = null;
  zoomLevel = 100;
  offsetX = 0;
  offsetY = 0;
  showImageAdjuster = false;

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
          this.rawImageSource = doc.profileImage || null;
          this.showImageAdjuster = !!doc.profileImage;
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
      consultationFee: [doc.consultationFee || 500],
      profileImage: [doc.profileImage || ''],
      bio: [doc.bio || '']
    });
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
