import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-transacciones',
  templateUrl: './transacciones.page.html',
  styleUrls: ['./transacciones.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TransaccionesPage implements OnInit {
  rollbacks: any[] = [];
  solicitudes: any[] = [];
  flujoTransaccion: any[] = [];
  comparacion: any[] = [];
  nuevaSolicitud = {
    id_transaccion: null,
    motivo: ''
  };

  private baseUrl = 'http://localhost:8000/app';
  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.cargarRollbacks();
    this.cargarSolicitudes();
  }
 
   cargarRollbacks() {
    this.http.get<any[]>('/api/rollbacks-ejecutados/').subscribe(
      data => this.rollbacks = data,
      err => console.error('Error al cargar rollbacks', err)
    );
  }

  cargarSolicitudes() {
    this.http.get<any[]>('/api/solicitudes-rollback/').subscribe(
      data => this.solicitudes = data,
      err => console.error('Error al cargar solicitudes', err)
    );
  }

  solicitarRollback() {
    this.http.post('/api/solicitar-rollback/', this.nuevaSolicitud).subscribe(
      res => {
        alert('Solicitud enviada correctamente');
        this.nuevaSolicitud = { id_transaccion: null, motivo: '' };
        this.cargarSolicitudes();
      },
      err => alert(err.error?.error || 'Error al enviar solicitud')
    );
  }

  /*verDetalleSolicitud(solicitud: any) {
    const id = solicitud.id_transaccion;

    // Comparación de estados (old vs new)
    this.http.get(`/api/comparacion-estados/${id}/`).subscribe(
      data => this.comparacion = data,
      err => console.error('Error en comparación', err)
    );

    // Flujo de transacción
    this.http.get(`/api/flujo-transaccion/${id}/`).subscribe(
      data => this.flujoTransaccion = data,
      err => console.error('Error en flujo', err)
    );
  }*/
}
