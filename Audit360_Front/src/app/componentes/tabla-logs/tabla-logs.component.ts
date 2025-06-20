import { Component, OnInit, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabla-logs',
  templateUrl: './tabla-logs.component.html',
  styleUrls: ['./tabla-logs.component.scss'],
  imports: [ IonicModule,CommonModule, FormsModule]
})
export class TablaLogsComponent  implements OnInit {
  @Input() tabla: string = '';  // ✅ Esto es necesario
  constructor() { }

  ngOnInit() {}

}
