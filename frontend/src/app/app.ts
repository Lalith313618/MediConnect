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

  showSidebar(): boolean {
    if (!this.authService.isLoggedIn()) return false;
    const url = (this.currentUrl || '').split('?')[0];
    if (url === '/' || url === '' || url === '/login' || url === '/register') {
      return false;
    }
    return true;
  }
}

export { AppComponent as App };
