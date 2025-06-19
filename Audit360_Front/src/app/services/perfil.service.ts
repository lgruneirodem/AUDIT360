import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  private baseUrl = 'http://localhost:8000/app';

  constructor(private http: HttpClient) { }

  getUsuario(id: number) {
    return this.http.get<any>(`${this.baseUrl}/usuarios/${id}/`);
  }

  
  actualizarUsuario(id: number, datos: any) {
    return this.http.put<any>(`${this.baseUrl}/usuarios/${id}/`, datos);
  }
}
