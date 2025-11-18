import { Injectable, inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { CitasPageResponse, ResponseDTO } from '../Interface/Citas';

@Injectable({ providedIn: 'root' })
export class CitasService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  private apiUrl = environment.auth0.apiUrl;

  /**
   * Obtiene las citas paginadas del doctor
   */
  getCitasPaginadas(
    idDoctor: number,
    page: number = 0,
    size: number = 10,
    estado?: string
  ): Observable<CitasPageResponse> {
    let params = new HttpParams()
      .set('idDoctor', idDoctor.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    if (estado && estado.trim() !== '' && estado !== 'all') {
      params = params.set('estado', estado);
    }

    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Auth no disponible en SSR'));
    }

    const auth = this.injector.get(AuthService);

    return auth.getAccessTokenSilently().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.get<CitasPageResponse>(`${this.apiUrl}/dashboard/getCitas`, {
          params,
          headers,
        });
      })
    );
  }

  /**
   * Cancela una cita
   */
  cancelarCita(idCita: number): Observable<ResponseDTO> {
    const params = new HttpParams().set('idCita', idCita.toString());

    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Auth no disponible en SSR'));
    }

    const auth = this.injector.get(AuthService);

    return auth.getAccessTokenSilently().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.put<ResponseDTO>(`${this.apiUrl}/citas/cancelarCitas`, null, {
          params,
          headers,
        });
      })
    );
  }

  /**
   * Completa una cita
   */
  completarCita(idCita: number): Observable<ResponseDTO> {
    const params = new HttpParams().set('idCita', idCita.toString());

    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Auth no disponible en SSR'));
    }

    const auth = this.injector.get(AuthService);

    return auth.getAccessTokenSilently().pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        return this.http.put<ResponseDTO>(`${this.apiUrl}/citas/completarCitas`, null, {
          params,
          headers,
        });
      })
    );
  }
}
