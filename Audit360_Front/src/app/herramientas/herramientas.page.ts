import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-herramientas',
  templateUrl: './herramientas.page.html',
  styleUrls: ['./herramientas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HerramientasPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  exportarDatos() {
    alert('Simulación: exportación iniciada');
  }

  verConfiguracion() {
    alert('Simulación: mostrando configuración');
  }

  limpiarAuditorias() {
    alert('Simulación: logs limpiados');
  }

}
