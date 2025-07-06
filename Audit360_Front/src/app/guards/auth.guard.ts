import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.authService.getToken();

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    /*const payload = this.decodeToken(token);
    if (!payload || !payload.rol) {
      this.router.navigate(['/login']);
      return false;
    }*/
    /*const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      this.authService.logout(); // limpia token
      this.router.navigate(['/login']);
      return false;
    }

    // Si quieres limitar acceso por rol, descomenta esto:
    if (payload.rol !== 'ADMIN') {
      this.router.navigate(['/unauthorized']);
      return false;
     }*/

    return true;
  }
  

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}
