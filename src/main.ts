import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideAuth0 } from '@auth0/auth0-angular';
import { environment } from './environments/environment';
import { mergeApplicationConfig } from '@angular/core';

const isBrowser = typeof window !== 'undefined';

const auth0Config = isBrowser
  ? mergeApplicationConfig(appConfig, {
      providers: [
        provideAuth0({
          domain: environment.auth0.domain,
          clientId: environment.auth0.clientId,
          authorizationParams: {
            redirect_uri: window.location.origin,
            audience: environment.auth0.audiencie,
            scope: 'openid profile email offline_access',
          },
          // Configuración para mantener la sesión persistente
          useRefreshTokens: true,
          cacheLocation: 'localstorage',

          // Configuración del interceptor HTTP
          httpInterceptor: {
            allowedList: [],
          },
        }),
      ],
    })
  : appConfig;

bootstrapApplication(App, auth0Config).catch((err) => console.error(err));
