import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.redirectByRole(this.authService.currentUserValue?.role);
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  selectedRole: 'patient' | 'doctor' | 'admin' = 'patient';

  selectRole(role: 'patient' | 'doctor' | 'admin'): void {
    this.selectedRole = role;
    // Selection only changes role highlight; email and password are NOT pre-filled.
  }

  get f() {
    return this.loginForm.controls;
  }


  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.success(`Welcome back, ${res.name}!`);
        this.redirectByRole(res.role);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Login failed. Please check credentials.');
      }
    });
  }

  private redirectByRole(role?: string): void {
    if (role === 'patient') this.router.navigate(['/patient/dashboard']);
    else if (role === 'doctor') this.router.navigate(['/doctor/dashboard']);
    else if (role === 'admin') this.router.navigate(['/admin/dashboard']);
    else this.router.navigate(['/']);
  }
}
