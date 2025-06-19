import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablasService} from '../services/tablas.service'

@Component({
  selector: 'app-tablas',
  templateUrl: 'tablas.page.html',
  styleUrls: ['tablas.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TablasPage {
  tablas: any[] = [];

  filtros: { [key: string]: boolean } = {
    audit_activa: false,
    trigger_insert: false,
    trigger_update: false,
    trigger_delete: false
  };
  constructor(private tablasService: TablasService) {}

  ngOnInit() {
    this.obtenerTablas();
  }

  obtenerTablas() {
    this.tablasService.getTablas().subscribe(data => {
      this.tablas = data;
    });
  }

  aplicarFiltros() {
    const params: any = {};
    for (const key in this.filtros) {
      if (this.filtros[key]) {
        params[key] = 'true';
      }
    }
    this.tablasService.getFiltradas(params).subscribe(data => {
      this.tablas = data;
    });
  }
}
