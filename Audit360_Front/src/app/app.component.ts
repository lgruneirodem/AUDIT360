import { Component } from '@angular/core';
//import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {EnvironmentInjector, inject } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { PerfilService } from './services/perfil.service';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { triangle, ellipse, square } from 'ionicons/icons';
import { closeOutline, homeOutline, analyticsOutline, settingsOutline,menuOutline,downloadOutline,buildOutline,cardOutline } from 'ionicons/icons';



@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [/*IonApp, IonRouterOutlet,*/ IonicModule, CommonModule, RouterModule],
})
export class AppComponent {
  usuario: any = {};
  constructor(private menuCtrl: MenuController, private perfilService: PerfilService) {
    addIcons({ triangle, ellipse, square,
      'close-outline': closeOutline,
      'home-outline':homeOutline,
      'analytics-outline':analyticsOutline,
      'settings-outline' : settingsOutline,
      'menu-outline': menuOutline,
      'download-outline': downloadOutline,
      'build-outline': buildOutline,
      'card-outline' : cardOutline
    });
  }
  ngOnInit() {
    this.perfilService.getUsuario(1).subscribe(data => {
      this.usuario = data;
    });
  }
  
}
