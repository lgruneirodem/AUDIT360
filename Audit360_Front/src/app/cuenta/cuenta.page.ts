import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule} from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.page.html',
  styleUrls: ['./cuenta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CuentaPage implements OnInit {
  
  multiLangEnabled = true;

  constructor(private translate: TranslateService) { }

  ngOnInit() {
  }

  onToggleLanguage(event: any) {
    this.multiLangEnabled = event.detail.checked;
    if (!this.multiLangEnabled) {
      this.translate.use('es'); // Fijar idioma por defecto
    } else {
      // Podrías recuperar idioma guardado o preguntar al usuario
      const preferred = localStorage.getItem('preferred_lang') || 'en';
      this.translate.use(preferred);
    }
    localStorage.setItem('multiLangEnabled', JSON.stringify(this.multiLangEnabled));
  }

  LanguageChange(lang: string) {
    localStorage.setItem('preferred_lang', lang);
    if (this.multiLangEnabled) {
      this.translate.use(lang);
    }
  }

}
