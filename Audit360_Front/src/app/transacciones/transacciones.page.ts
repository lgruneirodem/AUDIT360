import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-transacciones',
  templateUrl: './transacciones.page.html',
  styleUrls: ['./transacciones.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TransaccionesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  showAlerta = false;

  transacciones = [
    {
      fecha: '05/05/2025 14:20',
      usuario: 'laura_admin',
      tipo: 'Update',
      tabla: 'animador',
      id: 101
    },
    {
      fecha: '04/05/2025 18:42',
      usuario: 'sistemas',
      tipo: 'Delete',
      tabla: 'usuario',
      id: 102
    },
    {
      fecha: '03/05/2025 10:15',
      usuario: 'jorge_analista',
      tipo: 'Insert',
      tabla: 'actividad',
      id: 103
    }
  ];

  simularRollback(transaccion: any) {
    console.log('🌀 Simulando rollback de la transacción', transaccion.id);
    this.showAlerta = true;
  }

}
