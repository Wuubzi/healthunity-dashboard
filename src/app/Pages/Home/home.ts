// dashboard.component.ts
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCalendarCheck,
  faUserGroup,
  faClock,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { DoctorProfile } from '../../Interface/Doctor';
import { SidebarService } from '../../Services/Sidebar';
import { HomeService } from '../../Services/Home';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DoctorStats, ProximaCita } from '../../Interface/Home';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private auth = isPlatformBrowser(this.platformId) ? inject(AuthService) : null;
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  private homeService = inject(HomeService);

  faCalendarCheck = faCalendarCheck;
  faUserGroup = faUserGroup;
  faClock = faClock;
  faChartLine = faChartLine;

  doctorProfile = signal<DoctorProfile | null>(null);
  isLoadingProfile = signal(true);
  doctorStats = signal<DoctorStats | null>(null);
  upcomingAppointments = signal<ProximaCita[]>([]);
  isLoadingData = signal(true);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId) && this.auth) {
      this.loadDoctorProfile();
    }
  }

  formatTime(hora: string): string {
    const [hours, minutes] = hora.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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

                // Cargar estadísticas y próximas citas
                this.loadDashboardData(profile.idDoctor);
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

                    // Cargar estadísticas y próximas citas
                    this.loadDashboardData(profile.idDoctor);
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

  private loadDashboardData(idDoctor: number) {
    this.isLoadingData.set(true);

    forkJoin({
      stats: this.homeService.getDoctorStats(idDoctor),
      citas: this.homeService.getProximasCitas(idDoctor),
    }).subscribe({
      next: ({ stats, citas }) => {
        this.doctorStats.set(stats);
        this.upcomingAppointments.set(citas);
        this.isLoadingData.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoadingData.set(false);
      },
    });
  }

  public goCitas() {
    this.router.navigate(['/citas']);
  }

  // Stats dinámicas basadas en los datos del backend
  get stats() {
    const statsData = this.doctorStats();
    if (!statsData) return [];

    return [
      {
        title: 'Citas Hoy',
        value: statsData.citasHoy.toString(),
        icon: faCalendarCheck,
        color: 'bg-blue-500',
        trend: statsData.citasHoy > 0 ? `${statsData.citasHoy} programadas` : 'Sin citas',
        trendUp: statsData.citasHoy > 0,
      },
      {
        title: 'Pacientes Totales',
        value: statsData.pacientesTotales.toString(),
        icon: faUserGroup,
        color: 'bg-green-500',
        trend: 'Pacientes atendidos',
        trendUp: true,
      },
      {
        title: 'Tasa de Asistencia',
        value: `${statsData.tasaAsistencia}%`,
        icon: faChartLine,
        color: 'bg-orange-500',
        trend: statsData.tasaAsistencia >= 80 ? 'Excelente' : 'Puede mejorar',
        trendUp: statsData.tasaAsistencia >= 80,
      },
    ];
  }
}
