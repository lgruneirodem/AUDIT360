import { Component, OnInit, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-tabla-logs',
  templateUrl: './tabla-logs.component.html',
  styleUrls: ['./tabla-logs.component.scss'],
  imports: [ IonicModule,CommonModule, FormsModule]
})
export class TablaLogsComponent  implements OnInit {
  @Input() tabla: string = '';  // ✅ Esto es necesario
  // Variables de control
  tabActiva: string = 'logs';
  loading: boolean = false;
  isMobile: boolean = false;
  filtrosExpandidos: boolean = false;
  Math = Math;

  // Filtros
  filtroActivo: string = '';
  filtros = {
    tipo: [],
    severidad: [],
    tablaProceso: '',
    fechaDesde: '',
    fechaHasta: ''
  };

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 20;
  totalLogs: number = 0;
  totalPaginas: number = 0;

  // Filtros rápidos
  filtrosRapidos = [
    { value: 'criticos', label: 'Críticos', icon: 'alert-circle-outline', color: 'danger' },
    { value: 'errores', label: 'Errores', icon: 'close-circle-outline', color: 'warning' },
    { value: 'hoy', label: 'Hoy', icon: 'today-outline', color: 'primary' },
    { value: 'integracion', label: 'Integración', icon: 'sync-outline', color: 'secondary' },
    { value: 'auditoria', label: 'Auditoría', icon: 'shield-outline', color: 'success' }
  ];
   // Datos de logs (simulando datos reales)
  logs = [
    {
      id: 1,
      timestamp: new Date('2025-06-19T14:25:00'),
      tipo: 'Trigger Error',
      tablaProceso: 'users',
      mensaje: 'Error al escribir en tabla de auditoría: conexión perdida',
      severidad: 'CRITICO',
      detalles: {
        error_code: 'DB_CONNECTION_LOST',
        affected_rows: 0,
        query: 'INSERT INTO audit_users...',
        stack_trace: 'SQLException: Connection timeout...'
      }
    },
    {
      id: 2,
      timestamp: new Date('2025-06-19T14:20:15'),
      tipo: 'Integration',
      tablaProceso: 'Django Sync',
      mensaje: '5 nuevas tablas detectadas en la aplicación',
      severidad: 'INFO',
      detalles: {
        new_tables: ['user_profiles', 'notifications', 'settings', 'logs', 'cache'],
        source: 'django_app_v2.3',
        auto_audit_enabled: true
      }
    }]

  // Estadísticas
  stats = {
    criticos: 3,
    advertencias: 12,
    info: 45,
    exitosos: 234
  };
  
  logsFiltrados: any[] = [];

  constructor(private logService: DashboardService) { 
    this.checkScreenSize();
    this.inicializarDatos();
  }

  ngOnInit() {
    this.logService.getLogs().subscribe(data => this.logs = data);
    window.addEventListener('resize', () => this.checkScreenSize());
    this.inicializarDatos();
    this.cargarLogs();
  }

  // Inicializar datos
  inicializarDatos() {
    this.logsFiltrados = [...this.logs];
    this.totalLogs = this.logs.length;
    this.calcularPaginacion();
  }

  // Detectar si es móvil
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  // Cambiar pestaña
  cambiarTab(event: any) {
    this.tabActiva = event.detail.value;
  }

  // Toggle filtros expandidos
  toggleFiltros() {
    this.filtrosExpandidos = !this.filtrosExpandidos;
  }

  // Aplicar filtro rápido
  aplicarFiltroRapido(filtro: string) {
    this.filtroActivo = this.filtroActivo === filtro ? '' : filtro;
    
    let logsFiltrados = [...this.logs];
    
    switch (filtro) {
      case 'criticos':
        logsFiltrados = this.logs.filter(log => log.severidad === 'CRITICO');
        break;
      case 'errores':
        logsFiltrados = this.logs.filter(log => 
          log.severidad === 'CRITICO' || log.severidad === 'ALTO'
        );
        break;
      case 'hoy':
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        logsFiltrados = this.logs.filter(log => log.timestamp >= hoy);
        break;
      case 'integracion':
        logsFiltrados = this.logs.filter(log => log.tipo === 'Integration');
        break;
      case 'auditoria':
        logsFiltrados = this.logs.filter(log => log.tipo === 'Audit Setup');
        break;
      default:
        logsFiltrados = [...this.logs];
    }
    
    if (this.filtroActivo === '') {
      logsFiltrados = [...this.logs];
    }
    
    this.logsFiltrados = logsFiltrados;
    this.totalLogs = logsFiltrados.length;
    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  // Aplicar filtros avanzados
  aplicarFiltros() {
    let resultado = [...this.logs];
    
    // Filtro por tipo
    /*if (this.filtros.tipo.length > 0) {
      resultado = resultado.filter(log => this.filtros.tipo.includes(log.tipo));
    }
    
    // Filtro por severidad
    if (this.filtros.severidad.length > 0) {
      resultado = resultado.filter(log => this.filtros.severidad.includes(logs.severidad));
    }*/
    
    // Filtro por tabla/proceso
    if (this.filtros.tablaProceso) {
      resultado = resultado.filter(log => 
        log.tablaProceso.toLowerCase().includes(this.filtros.tablaProceso.toLowerCase())
      );
    }
    
    // Filtro por fecha
    if (this.filtros.fechaDesde) {
      const fechaDesde = new Date(this.filtros.fechaDesde);
      resultado = resultado.filter(log => log.timestamp >= fechaDesde);
    }
    
    this.logsFiltrados = resultado;
    this.totalLogs = resultado.length;
    this.paginaActual = 1;
    this.calcularPaginacion();
    this.filtrosExpandidos = false;
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.filtros = {
      tipo: [],
      severidad: [],
      tablaProceso: '',
      fechaDesde: '',
      fechaHasta: ''
    };
    this.filtroActivo = '';
    this.logsFiltrados = [...this.logs];
    this.totalLogs = this.logs.length;
    this.paginaActual = 1;
    this.calcularPaginacion();
  }

  // Calcular paginación
  calcularPaginacion() {
    this.totalPaginas = Math.ceil(this.totalLogs / this.itemsPorPagina);
  }

  // Cambiar página
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      // Aquí podrías cargar datos del servidor si es necesario
    }
  }

  // Ordenar por campo
  ordenarPor(campo: string) {
    this.logsFiltrados.sort((a, b) => {
      if (campo === 'timestamp') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return a[campo] > b[campo] ? 1 : -1;
    });
  }

  // Obtener color del badge por tipo
  getTipoBadgeColor(tipo: string): string {
    switch (tipo) {
      case 'Trigger Error':
        return 'danger';
      case 'Integration':
        return 'primary';
      case 'Audit Setup':
        return 'success';
      case 'System':
        return 'medium';
      case 'Warning':
        return 'warning';
      default:
        return 'medium';
    }
  }

  // Obtener color de severidad
  getSeveridadColor(severidad: string): string {
    switch (severidad) {
      case 'CRITICO':
        return 'danger';
      case 'ALTO':
        return 'warning';
      case 'INFO':
        return 'primary';
      case 'EXITO':
        return 'success';
      default:
        return 'medium';
    }
  }

  // Obtener icono de severidad
  getSeveridadIcon(severidad: string): string {
    switch (severidad) {
      case 'CRITICO':
        return 'alert-circle';
      case 'ALTO':
        return 'warning';
      case 'INFO':
        return 'information-circle';
      case 'EXITO':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  }

  // Acciones de la barra de herramientas
  actualizarLogs() {
    this.loading = true;
    // Simular carga de datos
    setTimeout(() => {
      this.cargarLogs();
      this.loading = false;
    }, 1500);
  }

  verificarEstadoIntegracion() {
    console.log('Verificando estado de integración...');
    // Implementar lógica de verificación
  }

  limpiarLogsAntiguos() {
    console.log('Limpiando logs antiguos...');
    // Implementar lógica de limpieza
  }

  // Acciones de logs
  verDetalles(log: any) {
    console.log('Ver detalles del log:', log);
    // Implementar modal o navegación a detalles
  }

  verDetallesCompletos(log: any) {
    console.log('Ver detalles completos:', log);
    // Implementar vista completa del log
  }

  reintentarAccion(log: any) {
    console.log('Reintentar acción para:', log);
    // Implementar lógica de reintento
  }

  revisarTablas(log: any) {
    console.log('Revisar tablas para:', log);
    // Implementar navegación a gestión de tablas
  }

  // Cargar logs (simular llamada al servicio)
  cargarLogs() {
  this.loading = true;
    this.logService.getLogs().subscribe({
      next: (data) => {
        this.logs = data;
        this.logsFiltrados = [...data];
        this.calcularEstadisticas();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // Calcular estadísticas
  calcularEstadisticas() {
    this.stats = {
      criticos: this.logs.filter(log => log.severidad === 'CRITICO').length,
      advertencias: this.logs.filter(log => log.severidad === 'ALTO').length,
      info: this.logs.filter(log => log.severidad === 'INFO').length,
      exitosos: this.logs.filter(log => log.severidad === 'EXITO').length
    };
  }

  // Métodos utilitarios
  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  truncarTexto(texto: string, limite: number = 100): string {
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }

  // Obtener logs paginados
  get logsPaginados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.logsFiltrados.slice(inicio, fin);
  }

  // Método para exportar logs
  exportarLogs(formato: 'CSV' | 'JSON' | 'EXCEL') {
    console.log(`Exportando logs en formato ${formato}`);
    // Implementar lógica de exportación
  }

  // Auto-refresh (opcional)
  iniciarAutoRefresh(intervalo: number = 30000) {
    setInterval(() => {
      if (!this.loading) {
        this.cargarLogs();
      }
    }, intervalo);
  }
}