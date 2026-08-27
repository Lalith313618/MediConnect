import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../core/services/doctor.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Doctor, DayAvailability } from '../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-availability.component.html',
  styleUrl: './doctor-availability.component.css'
})
export class DoctorAvailabilityComponent implements OnInit {
  doctor: Doctor | null = null;
  saving = false;

  daysList: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  availability: DayAvailability[] = [];

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.doctorService.getDoctorById(currentUser._id).subscribe({
        next: (doc) => {
          this.doctor = doc;
          this.availability = doc.availability || [];
        },
        error: (err) => console.error(err)
      });
    }
  }

  isDayActive(day: string): boolean {
    return this.availability.some((a) => a.day === day);
  }

  toggleDay(day: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.isDayActive(day)) {
        this.availability.push({
          day,
          slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM']
        });
      }
    } else {
      this.availability = this.availability.filter((a) => a.day !== day);
    }
  }

  getSlots(day: string): string[] {
    const dayConfig = this.availability.find((a) => a.day === day);
    return dayConfig ? dayConfig.slots : [];
  }

  addSlot(day: string, slotText: string): void {
    if (!slotText.trim()) return;
    const dayConfig = this.availability.find((a) => a.day === day);
    if (dayConfig && !dayConfig.slots.includes(slotText.trim())) {
      dayConfig.slots.push(slotText.trim());
    }
  }

  removeSlot(day: string, slotIdx: number): void {
    const dayConfig = this.availability.find((a) => a.day === day);
    if (dayConfig) {
      dayConfig.slots.splice(slotIdx, 1);
    }
  }

  saveAvailability(): void {
    if (!this.doctor) return;
    this.saving = true;

    this.doctorService.updateAvailability(this.doctor._id, this.availability).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success('Working availability updated successfully!');
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err.error?.message || 'Failed to update availability.');
      }
    });
  }
}
