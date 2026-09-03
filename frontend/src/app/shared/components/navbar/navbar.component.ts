import { Component, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  get currentPath(): string {
    const raw = this.router.url || (typeof window !== 'undefined' ? window.location.pathname : '');
    return raw.split('?')[0];
  }

  isLandingPage(): boolean {
    return this.currentPath === '/';
  }

  isAuthPage(): boolean {
    const path = this.currentPath;
    return path === '/login' || path === '/register';
  }

  isDashboardPage(): boolean {
    const path = this.currentPath;
    if (path.startsWith('/patient') || path.startsWith('/doctor') || path.startsWith('/admin')) {
      return true;
    }
    if (this.authService.isLoggedIn() && path !== '/' && path !== '/login' && path !== '/register') {
      return true;
    }
    return false;
  }
}
