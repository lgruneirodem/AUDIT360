import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8000/app';

  constructor(private http: HttpClient) {}

  getResumen() {
    return this.http.get(`${this.apiUrl}/dashboard-resumen/`);
  }

  getTablaResumen(filtroTabla: string = '', filtroOperacion: string = '') {
    const params: any = {};
    if (filtroTabla) params.tabla = filtroTabla;
    if (filtroOperacion) params.operacion = filtroOperacion;
  
    return this.http.get<any[]>(`${this.apiUrl}/gestion-auditoria/`, { params });
  }

  getGestionAuditoria(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/gestion-auditoria/`);
  }

  getLogs() {
    return this.http.get<any[]>(`${this.apiUrl}/logs/`);
  }
  // Crear auditoría automática
  crearAuditoriaAutomatica(tablas: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/auditoria/crear/`, {
      tablas: tablas
    });
  }

  // Prueba rápida
  probarAuditoria(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auditoria/probar/`);
  }

  // Obtener tablas disponibles
  obtenerTablasDisponibles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/gestion-auditoria/`);
  }

  /*activarAuditoria(tabla: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/activar-auditoria/`, { tabla });
  }*/
}
