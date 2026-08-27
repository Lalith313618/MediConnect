import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-patients.component.html',
  styleUrl: './admin-patients.component.css'
})
export class AdminPatientsComponent implements OnInit {
  patients: User[] = [];
  searchQuery: string = '';
  loading = true;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.adminService.getPatients(this.searchQuery).subscribe({
      next: (data) => {
        this.patients = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.toastService.error(err.error?.message || 'Failed to load patients list.');
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    this.loadPatients();
  }
}
