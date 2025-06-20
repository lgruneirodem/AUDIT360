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


  filtroOperacion: string = '';
  filtroTabla: string = '';
  filtroEstado: string = '';
  filtroEsquema: string = '';
  esquemas: string[] = ['public', 'erp', 'core'];

  

  tablaOriginal = [
  { name: 'users', rows: 1234, status: 'ACTIVA', lastOp: 'hace 2 min', alerta: 'Alta actividad', esquema: 'erp' },
  { name: 'products', rows: 856, status: 'ACTIVA', lastOp: 'hace 15 min', esquema: 'erp' },
  { name: 'orders', rows: 3421, status: 'ACTIVA', lastOp: 'hace 1 min', alerta: 'Actividad sospechosa', esquema: 'erp' },
  { name: 'inventory', rows: 567, status: 'INACTIVA', lastOp: '-', esquema: 'core' },
  { name: 'payments', rows: 2134, status: 'CONFIGURANDO', lastOp: '-', alerta: 'En proceso', esquema: 'public' }
  ];

  tablaFiltrada = [...this.tablaOriginal];

  constructor(private dashboardService: DashboardService, private router: Router) { }

  ngOnInit() {
    this.aplicarFiltros();
  }

    aplicarFiltros() {
    this.dashboardService.getTablaResumen(this.filtroTabla, this.filtroOperacion).subscribe(
      (res: any[]) => {
        this.tablaFiltrada = res;
        console.log('Resumen recibido:', res);
      },
      (err) => {
        console.error('Error al cargar resumen:', err);
        this.tablaFiltrada = [];
      }
    );
  }

}
