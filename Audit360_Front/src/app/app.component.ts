import { Component, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from '../app/app.component';
//import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {EnvironmentInjector, inject } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { PerfilService } from './services/perfil.service';
import { HttpClientModule,  HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { triangle, ellipse, square } from 'ionicons/icons';
import { closeOutline, homeOutline, analyticsOutline, settingsOutline,menuOutline,downloadOutline,buildOutline,cardOutline } from 'ionicons/icons';



export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      HttpClientModule,
      TranslateModule.forRoot({
        defaultLanguage: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
}).catch(err => console.error(err));
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [/*IonApp, IonRouterOutlet,*/ IonicModule, CommonModule, RouterModule],
})
export class AppComponent {
  usuario: any = {};
  constructor(private menuCtrl: MenuController, private perfilService: PerfilService, private translate: TranslateService) {
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

    translate.addLangs(['es', 'en']);
    translate.setDefaultLang('es');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang?.match(/es|en/) ? browserLang : 'es');
  }
  ngOnInit() {
    this.perfilService.getUsuario(1).subscribe(data => {
      this.usuario = data;
    });

    
  }
  
}
