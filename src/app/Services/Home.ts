// home.service.ts
import { Injectable, inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { DoctorStats, ProximaCita } from '../Interface/Home';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  private apiUrl = environment.auth0.apiUrl;

  getDoctorStats(idDoctor: number): Observable<DoctorStats> {
    const params = new HttpParams().set('idDoctor', idDoctor.toString());

    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
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

        return this.http.get<DoctorStats>(`${this.apiUrl}/dashboard/getStats`, {
          params,
          headers,
        });
      })
    );
  }

  getProximasCitas(idDoctor: number): Observable<ProximaCita[]> {
    const params = new HttpParams().set('idDoctor', idDoctor.toString());

    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
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

        return this.http.get<ProximaCita[]>(`${this.apiUrl}/dashboard/getProximasCitas`, {
          params,
          headers,
        });
      })
    );
  }
}
