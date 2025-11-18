// sidebar.service.ts
import { Injectable, inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Observable, switchMap, throwError } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { DoctorProfile } from '../Interface/Doctor';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  private apiUrl = environment.auth0.apiUrl;

  getDoctorProfile(gmail: string): Observable<DoctorProfile> {
    const params = new HttpParams().set('gmailDoctor', gmail);

    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      // En SSR, retornar error o dato vacío
      return throwError(() => new Error('Auth no disponible en SSR'));
    }

    // Inyectar AuthService solo en el navegador
    const auth = this.injector.get(AuthService);

    // Obtener el token y hacer la petición
    return auth.getAccessTokenSilently().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.get<DoctorProfile>(`${this.apiUrl}/dashboard/getDoctorProfile`, {
          params,
          headers,
        });
      })
    );
  }

  saveDoctorId(idDoctor: number): void {
    localStorage.setItem('idDoctor', idDoctor.toString());
  }

  getDoctorId(): number | null {
    const id = localStorage.getItem('idDoctor');
    return id ? parseInt(id, 10) : null;
  }
}
