import { Component, OnInit, Input, NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tabla-configuracion',
  templateUrl: './tabla-configuracion.component.html',
  styleUrls: ['./tabla-configuracion.component.scss'],
  imports: [ IonicModule,CommonModule, FormsModule]
})
export class TablaConfiguracionComponent  implements OnInit {
  private baseUrl = 'http://localhost:8000/app';
  @Input() tabla: string = '';


 
  filtroTabla: string = '';
  filtroEstado: string = '';
  filtroEsquema: string = '';
  esquemas: string[] = ['public', 'erp', 'core'];

  
 tablas: any[] = [
    {
      id: 1,
      name: 'users',
      schema: 'public',
      rows: 15420,
      status: 'ACTIVA',
      lastOp: 'INSERT',
      lastOpTime: new Date('2024-06-25T14:30:00'),
      alerta: null
    },
    {
      id: 2,
      name: 'products',
      schema: 'inventory',
      rows: 8950,
      status: 'ACTIVA',
      lastOp: 'UPDATE',
      lastOpTime: new Date('2024-06-25T16:45:00'),
      alerta: 'Alto número de modificaciones en las últimas 24h'
    }
 ]

  tablaFiltrada: any[] = [];
  isMobile = false;

  constructor(private dashboardService: DashboardService, private router: Router) {
     this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnInit() {
    this.aplicarFiltros();
  }

  // Detectar si es móvil
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  // Obtener color del estado
  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVA':
        return 'success';
      case 'INACTIVA':
        return 'danger';
      case 'CONFIGURANDO':
        return 'warning';
      default:
        return 'medium';
    }
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroTabla = '';
    this.filtroEsquema = '';
    this.aplicarFiltros();
  }

  // Acciones de la tabla
  configurarTabla(table: any) {
    console.log('Configurar tabla:', table);
    // Implementar lógica de configuración
  }

  verHistorial(table: any) {
    console.log('Ver historial:', table);
    // Implementar lógica de historial
  }

  verDatos(table: any) {
    console.log('Ver datos:', table);
    // Implementar lógica para ver datos
  }

  verDetalleTabla(table: any) {
    console.log('Ver detalle:', table);
    // Implementar lógica para ver detalle en móvil
  }

  mostrarMasAcciones(table: any) {
    // Implementar menú contextual con más acciones
    console.log('Más acciones:', table);
  }

  // Tu método existente aplicarFiltros()
  aplicarFiltros() {
    // ... tu lógica de filtros existente
  }

}
