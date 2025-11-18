// calendar.service.ts
import { Injectable, inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { CalendarioAnual } from '../Interface/Calendar';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  private apiUrl = environment.auth0.apiUrl;

  getCalendarioCitas(idDoctor: number): Observable<CalendarioAnual> {
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

        return this.http.get<CalendarioAnual>(`${this.apiUrl}/dashboard/getCalendarioCitas`, {
          params,
          headers,
        });
      })
    );
  }
}
