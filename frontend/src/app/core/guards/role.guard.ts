import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (expectedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUserValue;

    if (user && expectedRoles.includes(user.role)) {
      return true;
    }
    if (user) {
      if (user.role === 'patient') router.navigate(['/patient/dashboard']);
      else if (user.role === 'doctor') router.navigate(['/doctor/dashboard']);
      else if (user.role === 'admin') router.navigate(['/admin/dashboard']);
      else router.navigate(['/']);
    } else {
      router.navigate(['/login']);
    }

    return false;
  };
};
