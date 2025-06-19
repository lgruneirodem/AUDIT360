import { Component,OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js'
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HistorialService } from '../services/historial.service';

Chart.register(...registerables);

@Component({
  selector: 'app-historial',
  templateUrl: 'historial.page.html',
  styleUrls: ['historial.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HistorialPage implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  chart!: Chart;

  historial: any[] = [];
  filtroTabla: string = '';
  tablasUnicas: string[] = [];
  historialOriginal: any[] = [];

  constructor(private historialService: HistorialService) {}

  ngOnInit() {
    this.cargarHistorial();
  }
  ngAfterViewInit() {
    this.cargarGrafico(); // Aquí es seguro acceder al canvas
  }

  cargarHistorial() {
    this.historialService.getHistorial().subscribe(
      data => {
        this.historial = data;
        console.log('Historial cargado:', this.historial);
      },
      error => {
        console.error('Error al cargar historial:', error);
      }
    );
  }
  filtrarPorTabla() {
    if (this.filtroTabla) {
      this.historial = this.historialOriginal.filter(item => item.nom_tabla === this.filtroTabla);
    } else {
      this.historial = [...this.historialOriginal];
    }
  }
  getEstadoColor(estado: string): 'success' | 'warning' | 'danger' {
    return estado === 'danger' ? 'danger' :
           estado === 'warning' ? 'warning' : 'success';
  }

  cargarGrafico(agrupar: string = 'dia') {
    this.historialService.getActividadPorPeriodo(agrupar).subscribe(data => {
      const labels = data.map((item: any) => item.periodo);
      const valores = data.map((item: any) => item.total);

      if (this.chart) {
        this.chart.destroy(); // Destruye el gráfico anterior si existe
      }

      this.chart = new Chart(this.chartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Cambios por ' + agrupar,
              data: valores,
              backgroundColor: 'rgba(60, 166, 166, 0.6)',
              borderRadius: 6,
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
      console.log('Datos recibidos para gráfica:', data);
    });
  }
}