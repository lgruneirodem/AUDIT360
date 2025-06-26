import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TablasService {
  private apiUrl = 'http://127.0.0.1:8000/app/tablas-auditadas/';

  constructor(private http: HttpClient) {}

  getTablas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getFiltradas(params: any): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getLogs() {
    return this.http.get<any[]>(this.apiUrl);
  }
}