import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  const token = authService.token;

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRoute = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');
      if (error.status === 401 && !isAuthRoute) {
        toastService.error(error.error?.message || 'Session expired or unauthorized. Please log in again.');
        authService.logout();
      } else if (error.status === 403) {
        toastService.error(error.error?.message || 'Access denied. You do not have permission for this action.');
      }
      return throwError(() => error);
    })
  );
};
