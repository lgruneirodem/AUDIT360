import { Component, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
//import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {EnvironmentInjector, inject } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { PerfilService } from './services/perfil.service';
import { HttpClientModule,  HttpClient } from '@angular/common/http';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
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
  showSideMenu: boolean = false;
  private routesWithoutMenu = ['/login'];

  constructor(private menuCtrl: MenuController, private perfilService: PerfilService, private router: Router) {
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

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateMenuVisibility(event.url);
      });

    // Verificar ruta inicial
    this.updateMenuVisibility(this.router.url);
  }

  initializeApp() {
    // Verificar autenticación al iniciar la app
    this.checkAuthentication();
  }

  private updateMenuVisibility(url: string) {
    // Ocultar menu si estamos en login
    this.showSideMenu = !this.routesWithoutMenu.includes(url);
  }

  private checkAuthentication() {
    const token = localStorage.getItem('userToken');
    const currentUrl = this.router.url;
    
    // Si no hay token y no estamos en login, redirigir a login
    if (!token && !this.routesWithoutMenu.includes(currentUrl)) {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
    
    // Si hay token y estamos en login, redirigir al dashboard
    if (token && currentUrl === '/login') {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }

  // Función para logout (puedes llamarla desde el menu)
  logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('rememberUser');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  // Función para obtener el nombre del usuario
  getUserName(): string {
    const email = localStorage.getItem('userEmail');
    return email ? email.split('@')[0] : 'Usuario';
  }
}
