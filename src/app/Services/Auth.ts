import { inject, Injectable } from '@angular/core';
import { LocalStorage } from '../Storage/localStorage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private localStorage = inject(LocalStorage);

  isLoggedIn(): boolean {
    return !!this.localStorage.getItem('access_token');
  }
}
