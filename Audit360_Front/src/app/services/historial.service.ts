import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private baseUrl = 'http://127.0.0.1:8000/app';


  constructor(private http: HttpClient) { }

  getHistorial(filtros?: any): Observable<any> {
    let params = new HttpParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params = params.set(key, filtros[key]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/historial/`, { params });
  }

  getActividadPorPeriodo(agrupar = 'dia', fecha_inicio?: string, fecha_fin?: string): Observable<any> {
    let params = new HttpParams().set('agrupar', agrupar);

    if (fecha_inicio && fecha_fin) {
      params = params.set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    }

    return this.http.get(`${this.baseUrl}/actividad-periodo/`, { params });
  }
}
