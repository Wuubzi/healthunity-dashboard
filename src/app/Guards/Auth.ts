import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const auth = inject(AuthService);

  return auth.isAuthenticated$.pipe(
    take(1),
    switchMap((isAuthenticated) => {
      if (!isAuthenticated) {
        auth.loginWithRedirect({
          appState: { target: state.url },
        });
        return of(false);
      }

      // 🔥 Obtener el token silenciosamente
      return auth.getAccessTokenSilently().pipe(
        map((token) => {
          console.log('🔥 TOKEN DESDE EL GUARD:', token);
          return true;
        })
      );
    })
  );
};
