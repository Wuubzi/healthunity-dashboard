import { Injectable, inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import {
  HorarioDoctorResponse,
  HorarioStatsResponse,
  SaveHorarioRequest,
} from '../Interface/Disponibilidad';

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  private apiUrl = environment.auth0.apiUrl;

  /**
   * Obtiene las estadísticas del horario del doctor
   */
  getHorarioStats(idDoctor: number): Observable<HorarioStatsResponse> {
    const params = new HttpParams().set('idDoctor', idDoctor.toString());

    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Auth no disponible en SSR'));
    }

    const auth = this.injector.get(AuthService);

    return auth.getAccessTokenSilently().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.get<HorarioStatsResponse>(`${this.apiUrl}/dashboard/getHorarioStats`, {
          params,
          headers,
        });
      })
    );
  }

  /**
   * Obtiene el horario completo del doctor
   */
  getHorarioDoctor(idDoctor: number): Observable<HorarioDoctorResponse> {
    const params = new HttpParams().set('idDoctor', idDoctor.toString());

    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Auth no disponible en SSR'));
    }

    const auth = this.injector.get(AuthService);

    return auth.getAccessTokenSilently().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.get<HorarioDoctorResponse>(`${this.apiUrl}/dashboard/getHorarioDoctor`, {
          params,
          headers,
        });
      })
    );
  }

  /**
   * Guarda el horario del doctor
   */
  saveHorarioDoctor(request: SaveHorarioRequest): Observable<HorarioDoctorResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Auth no disponible en SSR'));
    }

    const auth = this.injector.get(AuthService);

    return auth.getAccessTokenSilently().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        });

        return this.http.post<HorarioDoctorResponse>(
          `${this.apiUrl}/dashboard/saveHorarioDoctor`,
          request,
          {
            headers,
          }
        );
      })
    );
  }
}
