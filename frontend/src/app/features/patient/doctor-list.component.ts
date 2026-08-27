import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DoctorService } from '../../core/services/doctor.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Doctor } from '../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.css'
})
export class DoctorListComponent implements OnInit {
  doctors: Doctor[] = [];
  allDoctors: Doctor[] = [];
  specializations: string[] = ['All'];
  searchQuery: string = '';
  selectedSpecialization: string = 'All';
  loading: boolean = true;
  errorMsg: string = '';

  // Modal Popup State
  showBookingModal: boolean = false;
  selectedDoctor: Doctor | null = null;
  bookingDate: string = '';
  bookingTime: string = '09:30 AM';
  bookingReason: string = '';
  bookingLoading: boolean = false;
  bookingSuccess: boolean = false;
  minDate: string = '';

  availableSlots: string[] = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM'
  ];

  constructor(
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    public authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.bookingDate = this.minDate;
  }

  ngOnInit(): void {
    this.loadDoctors(true);
  }

  loadDoctors(isInitial: boolean = false): void {
    if (isInitial || this.allDoctors.length === 0) {
      this.loading = true;
    }
    this.errorMsg = '';
    const specParam = (this.selectedSpecialization && this.selectedSpecialization !== 'All') ? this.selectedSpecialization : '';
    const queryParam = this.searchQuery ? this.searchQuery.trim().toLowerCase() : '';

    // Immediate instant client-side filtering if allDoctors already cached
    if (this.allDoctors.length > 0) {
      this.doctors = this.allDoctors.filter((doc) => {
        const name = this.getDocName(doc).toLowerCase();
        const spec = (doc.specialization || '').toLowerCase();
        const qual = (doc.qualification || '').toLowerCase();
        const bio = (doc.bio || '').toLowerCase();

        const matchesSpec = !specParam || spec === specParam.toLowerCase() || spec.includes(specParam.toLowerCase());
        const matchesQuery = !queryParam || (
          name.includes(queryParam) ||
          spec.includes(queryParam) ||
          qual.includes(queryParam) ||
          bio.includes(queryParam)
        );

        return matchesSpec && matchesQuery;
      });
      this.cdr.detectChanges();
    }

    const backendQuery = this.searchQuery ? this.searchQuery.trim() : '';

    this.doctorService.getDoctors(specParam, backendQuery).subscribe({
      next: (data) => {
        this.loading = false;
        const fetchedDocs = data || [];

        if (!specParam && !backendQuery) {
          this.allDoctors = fetchedDocs;
          this.doctors = fetchedDocs;
          this.extractSpecializations(fetchedDocs);
        } else {
          if (fetchedDocs.length > 0 || this.allDoctors.length === 0) {
            this.doctors = fetchedDocs;
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load doctors:', err);
        if (this.doctors.length === 0) {
          this.errorMsg = 'Could not fetch medical specialists from server. Please verify your connection or backend status.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  extractSpecializations(docs: Doctor[]): void {
    const specs = new Set<string>();
    specs.add('All');
    docs.forEach((d) => {
      if (d.specialization) specs.add(d.specialization);
    });
    this.specializations = Array.from(specs);
  }

  onSearchChange(): void {
    this.loadDoctors(false);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedSpecialization = 'All';
    this.loadDoctors(false);
  }

  getDocName(doc: Doctor | any): string {
    if (!doc) return 'Dr. Medical Specialist';
    if (doc.userId && typeof doc.userId === 'object' && doc.userId.name) {
      return doc.userId.name;
    }
    return doc.name || 'Dr. Medical Specialist';
  }

  openBookingModal(doc: Doctor): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.info('Please log in or register to book an appointment.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/patient/doctors' } });
      return;
    }

    if (!this.authService.isPatient() && !this.authService.isAdmin()) {
      this.toastService.warning('Only patients can book doctor visits.');
      return;
    }

    this.selectedDoctor = doc;
    this.showBookingModal = true;
    this.bookingSuccess = false;
    this.bookingLoading = false;
    this.bookingReason = '';
    this.bookingTime = '09:30 AM';
    const today = new Date();
    this.bookingDate = today.toISOString().split('T')[0];
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.selectedDoctor = null;
    this.bookingSuccess = false;
  }

  selectTimeSlot(slot: string): void {
    this.bookingTime = slot;
  }

  confirmBooking(): void {
    if (!this.selectedDoctor || !this.bookingDate || !this.bookingTime) {
      this.toastService.error('Please select both a date and time slot.');
      return;
    }

    this.bookingLoading = true;
    this.cdr.detectChanges();

    this.appointmentService
      .createAppointment({
        doctorId: this.selectedDoctor._id,
        appointmentDate: this.bookingDate,
        appointmentTime: this.bookingTime,
        reason: this.bookingReason || 'General Medical Consultation'
      })
      .subscribe({
        next: (res) => {
          this.bookingLoading = false;
          this.bookingSuccess = true;
          this.toastService.success(`Appointment successfully booked with ${this.getDocName(this.selectedDoctor!)}!`);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.bookingLoading = false;
          const msg = err.error?.message || 'Failed to book appointment. Please try another time slot.';
          this.toastService.error(msg);
          this.cdr.detectChanges();
        }
      });
  }

  goToMyAppointments(): void {
    this.closeBookingModal();
    this.router.navigate(['/patient/appointments']);
  }
}
