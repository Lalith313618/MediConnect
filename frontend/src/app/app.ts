import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'MediConnect';
  isSidebarOpen = false;
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

  showSidebar(): boolean {
    if (!this.authService.isLoggedIn()) return false;
    const path = this.currentUrl || (typeof window !== 'undefined' ? window.location.pathname : '');
    const url = path.split('?')[0];
    if (url === '/' || url === '/login' || url === '/register') {
      return false;
    }
    return true;
  }
}

export { AppComponent as App };
