import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  imports: [ IonicModule,CommonModule],
})
export class DashboardPage implements OnInit {
  
  private baseUrl = 'http://localhost:8000/app';
  summary: { label: string, count: number }[] = [];
  
  filtroOperacion: string = '';
  filtroTabla: string = '';

  tablaFiltrada: any[] = [];

  constructor(private dashboardService: DashboardService, private router: Router) {}

  ngOnInit() {
    this.aplicarFiltros();
    this.dashboardService.getResumen().subscribe(data => {
      this.summary = this.mapResumenToSummary(data);
  
      /*if (data.Recientes > 250) {
        console.warn('¡Alerta! Se detectaron muchas operaciones recientes.');
      }*/
    });
  }
  
  // 🔧 Mapeador: transforma backend -> frontend visual
  mapResumenToSummary(resumen: any): { label: string, count: number }[] {
    return [
      { label: 'Insert', count: resumen.Insert },
      { label: 'Update', count: resumen.Update },
      { label: 'Delete', count: resumen.Delete },
      { label: 'Rollback', count: resumen.Rollback },
      { label: 'Errores', count: resumen.Errores },
    ];
  }
  
  irAHistorial(tipo: string) {
    // Opcional: transforma "Insert" → I, "Update" → U, etc.
    const codigos: any = {
      Insert: 'I',
      Update: 'U',
      Delete: 'D',
      Rollback: 'R'
    };
  
    const filtro = codigos[tipo] || '';
  
    // Navega a historial con query params
    this.router.navigate(['/historial'], { queryParams: { tipo: filtro } });
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

  getAuditIcon(status: string): string {
    switch (status) {
      case 'ok':
        return '✔';
      case 'neutral':
        return '–';
      case 'fail':
        return '✖';
      default:
        return '';
    }
  }
}
