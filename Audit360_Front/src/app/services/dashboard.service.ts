import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = 'http://localhost:8000/app';

  constructor(private http: HttpClient) {}

  getResumen() {
    return this.http.get(`${this.baseUrl}/dashboard-resumen/`);
  }

  getTablaResumen(filtroTabla: string = '', filtroOperacion: string = '') {
    const params: any = {};
    if (filtroTabla) params.tabla = filtroTabla;
    if (filtroOperacion) params.operacion = filtroOperacion;
  
    return this.http.get<any[]>(`${this.baseUrl}/tabla-resumen/`, { params });
  }
}
