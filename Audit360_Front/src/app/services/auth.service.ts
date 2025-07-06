import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
private apiUrl = 'http://localhost:8000/app/token/';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { email, password });
  }


  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getNewAccessToken(): Observable<any> {
    const refresh = localStorage.getItem('refresh_token');
    return this.http.post(`${this.apiUrl}refresh/`, { refresh });
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
 
  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.rol || null;
    } catch {
      return null;
    }
  }


  logout() {
    localStorage.removeItem('access_token');
  }
}
