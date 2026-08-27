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
  currentUrl = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.urlAfterRedirects || event.url;
    });
  }

  isLandingPage(): boolean {
    const url = (this.currentUrl || '').split('?')[0];
    return url === '/' || url === '';
  }

  isAuthPage(): boolean {
    const url = (this.currentUrl || '').split('?')[0];
    return url === '/login' || url === '/register';
  }

  isDashboardPage(): boolean {
    const url = (this.currentUrl || '').split('?')[0];
    return url.startsWith('/patient') || url.startsWith('/doctor') || url.startsWith('/admin');
  }
}
