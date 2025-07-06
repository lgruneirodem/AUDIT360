import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RollbackService {
  private apiUrl = 'http://localhost:8000/app/rollback';  // Ajustar a tu endpoint real

  constructor(private http: HttpClient,  private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  enviarSolicitud(data: any) {
    return this.http.post(`${this.apiUrl}/create/`, data);
  }

  getSolicitudes() {
    return this.http.get(`${this.apiUrl}/list/`);
  }

  aprobarRollback(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve/${requestId}/`, {});
  }

  // Obtener solicitudes con filtros
  getSolicitudesConFiltros(filtros?: {
    status?: string;
    table_name?: string;
    user_id?: number;
  }): Observable<any> {
    let params = '';
    if (filtros) {
      const paramArray: string[] = [];
      if (filtros.status) paramArray.push(`status=${filtros.status}`);
      if (filtros.table_name) paramArray.push(`table_name=${filtros.table_name}`);
      if (filtros.user_id) paramArray.push(`user_id=${filtros.user_id}`);
      
      if (paramArray.length > 0) {
        params = '?' + paramArray.join('&');
      }
    }

    return this.http.get(`${this.apiUrl}/list/${params}`, { 
      headers: this.getHeaders() 
    });
  }

  // Obtener detalles de una solicitud específica
  getSolicitudDetalle(requestId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${requestId}/`, { 
      headers: this.getHeaders() 
    });
  }

  // Rechazar solicitud de rollback
  rechazarRollback(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reject/${requestId}/`, {}, { 
      headers: this.getHeaders() 
    });
  }

  // Ejecutar rollback (después de aprobado)
  ejecutarRollback(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/execute/${requestId}/`, {}, { 
      headers: this.getHeaders() 
    });
  }

  // Obtener rollbacks ejecutados
  getRollbacksEjecutados(): Observable<any> {
    return this.http.get(`${this.apiUrl}/executions/`, { 
      headers: this.getHeaders() 
    });
  }

  // Obtener mis solicitudes (para usuarios no admin)
  getMisSolicitudes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-requests/`, { 
      headers: this.getHeaders() 
    });
  }

  // Rollback directo (función original)
  rollbackDirecto(transactionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/direct/${transactionId}/`, {}, { 
      headers: this.getHeaders() 
    });
  }

  // Funciones de utilidad para el frontend

  // Obtener estadísticas de rollbacks
  getEstadisticas(): Observable<any> {
    return this.getSolicitudes();
  }

  // Verificar si el usuario puede aprobar (es admin)
  puedeAprobar(): boolean {
    const userRole = this.authService.getUserRole();
    return userRole === 'ADMIN';
  }

  // Filtrar solicitudes por estado
  filtrarPorEstado(solicitudes: any[], estado: string): any[] {
    return solicitudes.filter(s => s.status === estado);
  }

  // Obtener conteo por estado
  getConteoEstados(solicitudes: any[]): any {
    return {
      pending: solicitudes.filter(s => s.status === 'PENDING').length,
      approved: solicitudes.filter(s => s.status === 'APPROVED').length,
      rejected: solicitudes.filter(s => s.status === 'REJECTED').length,
      executed: solicitudes.filter(s => s.status === 'EXECUTED').length,
      total: solicitudes.length
    };
  }

  // Validar datos de solicitud antes de enviar
  validarSolicitud(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.transaction_id || data.transaction_id.trim() === '') {
      errors.push('ID de transacción es requerido');
    }
    
    if (!data.table_name || data.table_name.trim() === '') {
      errors.push('Nombre de tabla es requerido');
    }
    
    if (!data.motivo || data.motivo.trim() === '') {
      errors.push('Motivo es requerido');
    }
    
    if (data.motivo && data.motivo.length < 10) {
      errors.push('El motivo debe tener al menos 10 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

}