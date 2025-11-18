import { Component, signal, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from '../../Interface/Sidebar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '@auth0/auth0-angular';
import { faHouse, faCalendarCheck, faCalendar, faClock } from '@fortawesome/free-regular-svg-icons';
import { SidebarService } from '../../Services/Sidebar';
import { DoctorProfile } from '../../Interface/Doctor';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private auth = isPlatformBrowser(this.platformId) ? inject(AuthService) : null;
  private sidebarService = inject(SidebarService);

  isCollapsed = signal(false);
  doctorProfile = signal<DoctorProfile | null>(null);
  isLoadingProfile = signal(true);

  menuItems: MenuItem[] = [
    {
      icon: faHouse,
      label: 'Inicio',
      route: '/',
    },
    {
      icon: faCalendarCheck,
      label: 'Mis Citas',
      route: '/citas',
    },
    {
      icon: faCalendar,
      label: 'Calendario',
      route: '/calendario',
    },
    {
      icon: faClock,
      label: 'Disponibilidad',
      route: '/disponibilidad',
    },
  ];

  ngOnInit() {
    if (isPlatformBrowser(this.platformId) && this.auth) {
      this.loadDoctorProfile();
    }
  }

  private loadDoctorProfile() {
    if (this.auth) {
      this.auth.idTokenClaims$.subscribe({
        next: (claims) => {
          const email = claims?.email;

          if (email) {
            console.log('Email found:', email);
            this.sidebarService.getDoctorProfile(email).subscribe({
              next: (profile) => {
                this.doctorProfile.set(profile);
                this.sidebarService.saveDoctorId(profile.idDoctor);
                this.isLoadingProfile.set(false);
              },
              error: (error) => {
                console.error('Error loading doctor profile:', error);
                this.isLoadingProfile.set(false);
              },
            });
          } else {
            // Fallback: intentar con user$
            this.auth?.user$.subscribe((user) => {
              const userEmail = user?.email;

              if (userEmail) {
                this.sidebarService.getDoctorProfile(userEmail).subscribe({
                  next: (profile) => {
                    this.doctorProfile.set(profile);
                    this.sidebarService.saveDoctorId(profile.idDoctor);
                    this.isLoadingProfile.set(false);
                  },
                  error: (error) => {
                    console.error('Error loading doctor profile:', error);
                    this.isLoadingProfile.set(false);
                  },
                });
              } else {
                console.error('No email found in claims or user');
                this.isLoadingProfile.set(false);
              }
            });
          }
        },
        error: (error) => {
          console.error('Error getting ID token claims:', error);
          this.isLoadingProfile.set(false);
        },
      });
    }
  }

  toggleSidebar() {
    this.isCollapsed.update((value) => !value);
  }

  logout() {
    if (this.auth) {
      localStorage.clear();
      this.auth.logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    }
  }

  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
