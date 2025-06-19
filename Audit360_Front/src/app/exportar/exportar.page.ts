import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgChartsModule } from 'ng2-charts';
import { ExportarService } from '../services/exportar.service';
import { ChartConfiguration, ChartType } from 'chart.js';




@Component({
  selector: 'app-exportar',
  templateUrl: './exportar.page.html',
  styleUrls: ['./exportar.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,NgChartsModule]
})
export class ExportarPage implements OnInit {
  
  tabla: string = '';
  tipo: string = '';
  fechaInicio: string = '';     
  fechaFin: string = '';
  informes: any[] = [];
  resumen: string = '';
  detalleDatos: any[] = [];
  cargando: boolean = false;

  constructor(private exportarService: ExportarService){}
  
  ngOnInit() {
    this.exportarService.getInformesRecientes().subscribe(data => {
      this.informes = data;
    });
  }

  generarInforme() {
    if (!this.tabla || !this.tipo || !this.fechaInicio || !this.fechaFin) {
      alert('Todos los campos son obligatorios');
      return;
    }
  
    this.cargando = true;
  
    this.exportarService.getDatosinforme(this.tabla, this.fechaInicio, this.fechaFin).subscribe(
      (datos) => {
        const payload = {
          tabla: this.tabla,
          periodo: `${this.fechaInicio} - ${this.fechaFin}`,
          tipo: this.tipo,
          datos: datos
        };
  
        this.exportarService.generarInformeIA(payload).subscribe(
          (res) => {
            this.resumen = res.resumen;
            this.detalleDatos = datos;
            this.cargando = false;
          },
          (error) => {
            console.error('Error al generar el informe IA:', error);
            this.cargando = false;
          }
        );
      },
      (error) => {
        console.error('Error al obtener datos del informe:', error);
        this.cargando = false;
      }
    );
  }
  guardarInforme() {
    const payload = {
      tabla: this.tabla,
      periodo: `${this.fechaInicio} - ${this.fechaFin}`,
      resumen: this.resumen,
      datos: this.detalleDatos
    };

    this.exportarService.guardarInforme(payload).subscribe({
      next: () => {
        console.log('Informe guardado correctamente');
      },
      error: (err) => {
        console.error('Error al guardar:', err);
      }
    });
  }

  descargar(id: number) {
    this.exportarService.descargarPDF(id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

}