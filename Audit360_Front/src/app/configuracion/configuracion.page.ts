import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { PerfilService } from '../services/perfil.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,HttpClientModule,RouterModule]
})
export class ConfiguracionPage implements OnInit {

  usuario: any = {};
  modoEdicion = false;

  constructor(private perfilService:PerfilService ) { }

  ngOnInit() {
    this.perfilService.getUsuario(1).subscribe(data => {
      this.usuario = data;
    });
  }

  guardar() {
    this.perfilService.actualizarUsuario(1, this.usuario).subscribe(() => {
      this.modoEdicion = false;
    });
  }
}
