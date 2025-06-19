import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tabla-configuracion',
  templateUrl: './tabla-configuracion.component.html',
  styleUrls: ['./tabla-configuracion.component.scss'],
})
export class TablaConfiguracionComponent  implements OnInit {

  @Input() tabla: string = '';
  constructor() { }

  ngOnInit() {}

}
