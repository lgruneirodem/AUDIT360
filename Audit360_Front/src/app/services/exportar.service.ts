import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ExportarService {
  private baseUrl = 'http://localhost:8000/app';

  constructor(private http: HttpClient) {}

  getInformesRecientes() {
    return this.http.get<any[]>(`${this.baseUrl}/informes-recientes/`);
  }
  
  getDatosinforme(tabla: string, fechaInicio: string, fechaFin: string) {
    return this.http.post<any[]>(`${this.baseUrl}/datos-informe/`, {
      tabla,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });
  }
  
  guardarInforme(payload: any) {
    return this.http.post(`${this.baseUrl}/guardar-informe/`, payload);
  }
  
  generarInformeIA(payload: any) {
    return this.http.post<any>(`${this.baseUrl}/generar-informeIA/`, payload);
  }

  descargarPDF(id: number) {
    return this.http.get(`${this.baseUrl}/informes/${id}/pdf/`, {
      responseType: 'blob'
    });
  }
}
