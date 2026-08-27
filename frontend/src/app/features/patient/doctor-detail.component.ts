import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DoctorService } from '../../core/services/doctor.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ToastService } from '../../core/services/toast.service';
import { Doctor } from '../../core/models/doctor.model';
import { Appointment } from '../../core/models/appointment.model';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './doctor-detail.component.html',
  styleUrl: './doctor-detail.component.css'
})
export class DoctorDetailComponent implements OnInit {
  doctor: Doctor | null = null;
  doctorId: string = '';
  minDate: string = new Date().toISOString().split('T')[0];
  selectedDate: string = this.minDate;
  selectedDayName: string = '';
  selectedTime: string = '';
  reason: string = '';
  submitting = false;

  availableTimeSlots: { time: string; isBooked: boolean }[] = [];
  existingAppointmentsForDate: Appointment[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.doctorId = this.route.snapshot.params['id'];
    this.fetchDoctorDetails();
  }

  fetchDoctorDetails(): void {
    this.doctorService.getDoctorById(this.doctorId).subscribe({
      next: (doc) => {
        this.doctor = doc;
        this.onDateChange();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error('Doctor not found');
        this.router.navigate(['/patient/doctors']);
        this.cdr.detectChanges();
      }
    });
  }

  onDateChange(): void {
    this.selectedTime = '';
    if (!this.selectedDate || !this.doctor) return;

    const dateObj = new Date(this.selectedDate + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.selectedDayName = days[dateObj.getDay()];

    const dayConfig = this.doctor.availability.find((a) => a.day === this.selectedDayName);
    const configuredSlots = dayConfig ? dayConfig.slots : [];

    this.appointmentService
      .getAppointments({ doctorId: this.doctor._id, date: this.selectedDate })
      .subscribe({
        next: (apps) => {
          const bookedTimes = apps
            .filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed')
            .map((a) => a.appointmentTime);

          this.availableTimeSlots = configuredSlots.map((time) => ({
            time,
            isBooked: bookedTimes.includes(time)
          }));
          this.cdr.detectChanges();
        },
        error: () => {
          this.availableTimeSlots = configuredSlots.map((time) => ({ time, isBooked: false }));
          this.cdr.detectChanges();
        }
      });
  }

  selectSlot(time: string): void {
    this.selectedTime = time;
  }

  bookAppointment(): void {
    if (!this.doctor || !this.selectedDate || !this.selectedTime) return;

    this.submitting = true;
    this.cdr.detectChanges();

    this.appointmentService
      .createAppointment({
        doctorId: this.doctor._id,
        appointmentDate: this.selectedDate,
        appointmentTime: this.selectedTime,
        reason: this.reason || 'General Consultation'
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.success('Appointment booked successfully!');
          this.router.navigate(['/patient/appointments']);
        },
        error: (err) => {
          this.submitting = false;
          this.toastService.error(err.error?.message || 'Failed to book appointment.');
          this.cdr.detectChanges();
        }
      });
  }

  getDocName(): string {
    if (this.doctor && typeof this.doctor.userId === 'object') {
      return this.doctor.userId.name;
    }
    return 'Dr. Medical Specialist';
  }
}
