import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tabla-logs',
  templateUrl: './tabla-logs.component.html',
  styleUrls: ['./tabla-logs.component.scss'],
})
export class TablaLogsComponent  implements OnInit {
  @Input() tabla: string = '';  // ✅ Esto es necesario
  constructor() { }

  ngOnInit() {}

}
