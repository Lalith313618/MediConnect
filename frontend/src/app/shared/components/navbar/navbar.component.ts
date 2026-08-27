import { Component, EventEmitter, Output } from '@angular/core';
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
  currentUrl = typeof window !== 'undefined' ? window.location.pathname : '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.updateUrl();
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.urlAfterRedirects || event.url;
    });
  }

  private updateUrl(): void {
    if (this.router.url && this.router.url !== '/') {
      this.currentUrl = this.router.url;
    } else if (typeof window !== 'undefined' && window.location.pathname) {
      this.currentUrl = window.location.pathname;
    }
  }

  isLandingPage(): boolean {
    const path = this.currentUrl || (typeof window !== 'undefined' ? window.location.pathname : '');
    const url = path.split('?')[0];
    return url === '/';
  }

  isAuthPage(): boolean {
    const path = this.currentUrl || (typeof window !== 'undefined' ? window.location.pathname : '');
    const url = path.split('?')[0];
    return url === '/login' || url === '/register';
  }

  isDashboardPage(): boolean {
    const path = this.currentUrl || (typeof window !== 'undefined' ? window.location.pathname : '');
    const url = path.split('?')[0];
    if (url.startsWith('/patient') || url.startsWith('/doctor') || url.startsWith('/admin')) {
      return true;
    }
    if (this.authService.isLoggedIn() && url !== '/' && url !== '/login' && url !== '/register') {
      return true;
    }
    return false;
  }
}
