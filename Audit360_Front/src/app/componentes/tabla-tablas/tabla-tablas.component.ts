import { Component, OnInit, Input } from '@angular/core';
import { AlertController, IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';


@Component({
  selector: 'app-tabla-tablas',
  templateUrl: './tabla-tablas.component.html',
  styleUrls: ['./tabla-tablas.component.scss'],
  imports: [ IonicModule,CommonModule, FormsModule]
})
export class TablaTablasComponent  implements OnInit {
  private baseUrl = 'http://localhost:8000/app';
  @Input() tabla: string = '';

  //=======================================
  //              PRUEBAS AUDIT
  //=======================================

    // Variables para la prueba
    tablasDisponibles: any[] = [];
    tablasSeleccionadas: string[] = [];
    tablasPersonalizadas: string = '';
    tablas: any[] = [];
    tablaFiltrada: any[] = [];
    
    // Estados
    isLoading = false;
    isMobile = false;
    resultado: any = null;
    mostrarResultado = false;

    showActivarAuditoriaModal = false;
    // Estados del modal: 'initial', 'processing', 'success', 'error'
    modalState: 'initial' | 'processing' | 'success' | 'error' = 'initial';
    // Datos del formulario
    auditForm = {
      tableName: ''
    };

    // Control de formulario
    formTouched = false;
    // Respuesta del backend para mostrar estadísticas
    auditResponse: any = null;
    // Mensaje de error específico
    auditErrorMessage: string = '';


 

  // ========================================
  // PROPIEDADES MODAL CONFIGURACIÓN GENERAL
  // ========================================
  showEditModal = false;
  selectedTableConfig: any = null; // Para configuración
  editForm = {
    name: '',
    schema: 'public',
    type: 'table',
    description: '',
    status: 'ACTIVA',
    rowLimit: 0,
    backupPriority: 'medium',
    autoBackup: true,
    enableAudit: false,
    dataRetention: 365,
    compression: 'none',
    customIndexes: ''
  };



  constructor(private alertController: AlertController,
    private dashboardService:DashboardService,
    private loadingController: LoadingController,
    private toastController: ToastController ) {}

  ngOnInit() {
    
    this.loadFakeData();
   

    //prueba
    //this.cargarTablasDisponibles();
  }

  // ========================================
  // DATOS FALSOS PARA TESTING
  // ========================================
  loadFakeData() {
    this.tablas = [
      {
        name: 'users',
        schema: 'public',
        type: 'table',
        description: 'Tabla principal de usuarios del sistema',
        columns: 8,
        rows: 15678,
        status: 'ACTIVA',
        lastModified: '2025-01-15T10:30:00Z',
        lastOp: 'INSERT',
        rowLimit: 0,
        backupPriority: 'high',
        autoBackup: true,
        enableAudit: true,
        dataRetention: 365,
        compression: 'gzip',
        customIndexes: 'email_idx, created_at_idx'
      },
      {
        name: 'products',
        schema: 'public',
        type: 'table',
        description: 'Catálogo de productos disponibles',
        columns: 8,
        rows: 4523,
        status: 'ACTIVA',
        lastModified: '2025-01-10T14:20:00Z',
        lastOp: 'UPDATE',
        rowLimit: 0,
        backupPriority: 'medium',
        autoBackup: true,
        enableAudit: false,
        dataRetention: 730,
        compression: 'lz4',
        customIndexes: 'sku_idx, category_idx, price_idx'
      },
      {
        name: 'orders',
        schema: 'public',
        type: 'table',
        description: 'Registro de órdenes y transacciones',
        columns: 7,
        rows: 89234,
        status: 'ACTIVA',
        lastModified: '2025-01-18T09:15:00Z',
        lastOp: 'INSERT',
        rowLimit: 0,
        backupPriority: 'high',
        autoBackup: true,
        enableAudit: true,
        dataRetention: 2555,
        compression: 'gzip',
        customIndexes: 'user_id_idx, order_date_idx, status_idx'
      },
      {
        name: 'audit_logs',
        schema: 'admin',
        type: 'table',
        description: 'Logs de auditoría del sistema',
        columns: 6,
        rows: 234567,
        status: 'ACTIVA',
        lastModified: '2025-01-19T16:45:00Z',
        lastOp: 'INSERT',
        rowLimit: 1000000,
        backupPriority: 'low',
        autoBackup: false,
        enableAudit: false,
        dataRetention: 90,
        compression: 'gzip',
        customIndexes: 'timestamp_idx, user_id_idx'
      },
      {
        name: 'temp_import',
        schema: 'public',
        type: 'table',
        description: 'Tabla temporal para importación de datos',
        columns: 3,
        rows: 0,
        status: 'INACTIVA',
        lastModified: '2024-11-15T08:00:00Z',
        lastOp: 'TRUNCATE',
        rowLimit: 50000,
        backupPriority: 'low',
        autoBackup: false,
        enableAudit: false,
        dataRetention: 30,
        compression: 'none',
        customIndexes: '',
        alerta: 'Tabla sin uso por 60+ días'
      }
    ];
  }

  getTableColumns(tableName: string): any[] {
    const structures: { [key: string]: any[] } = {
      'users': [
        { name: 'id', type: 'INTEGER', length: null, isNullable: false, defaultValue: 'AUTO_INCREMENT' },
        { name: 'email', type: 'VARCHAR', length: 255, isNullable: false, defaultValue: null },
        { name: 'username', type: 'VARCHAR', length: 50, isNullable: false, defaultValue: null },
        { name: 'password_hash', type: 'VARCHAR', length: 255, isNullable: false, defaultValue: null },
        { name: 'first_name', type: 'VARCHAR', length: 100, isNullable: true, defaultValue: null },
        { name: 'last_name', type: 'VARCHAR', length: 100, isNullable: true, defaultValue: null },
        { name: 'is_active', type: 'BOOLEAN', length: null, isNullable: false, defaultValue: 'true' },
        { name: 'created_at', type: 'TIMESTAMP', length: null, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
      ],
      'products': [
        { name: 'id', type: 'INTEGER', length: null, isNullable: false, defaultValue: 'AUTO_INCREMENT' },
        { name: 'sku', type: 'VARCHAR', length: 50, isNullable: false, defaultValue: null },
        { name: 'name', type: 'VARCHAR', length: 200, isNullable: false, defaultValue: null },
        { name: 'description', type: 'TEXT', length: null, isNullable: true, defaultValue: null },
        { name: 'price', type: 'DECIMAL', length: '10,2', isNullable: false, defaultValue: '0.00' },
        { name: 'category_id', type: 'INTEGER', length: null, isNullable: true, defaultValue: null },
        { name: 'stock_quantity', type: 'INTEGER', length: null, isNullable: false, defaultValue: '0' },
        { name: 'metadata', type: 'JSON', length: null, isNullable: true, defaultValue: null }
      ],
      'orders': [
        { name: 'id', type: 'INTEGER', length: null, isNullable: false, defaultValue: 'AUTO_INCREMENT' },
        { name: 'user_id', type: 'INTEGER', length: null, isNullable: false, defaultValue: null },
        { name: 'order_number', type: 'VARCHAR', length: 50, isNullable: false, defaultValue: null },
        { name: 'total_amount', type: 'DECIMAL', length: '10,2', isNullable: false, defaultValue: '0.00' },
        { name: 'status', type: 'VARCHAR', length: 20, isNullable: false, defaultValue: 'pending' },
        { name: 'order_date', type: 'TIMESTAMP', length: null, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
        { name: 'uuid', type: 'UUID', length: null, isNullable: false, defaultValue: null }
      ],
      'audit_logs': [
        { name: 'id', type: 'INTEGER', length: null, isNullable: false, defaultValue: 'AUTO_INCREMENT' },
        { name: 'user_id', type: 'INTEGER', length: null, isNullable: true, defaultValue: null },
        { name: 'action', type: 'VARCHAR', length: 100, isNullable: false, defaultValue: null },
        { name: 'table_name', type: 'VARCHAR', length: 100, isNullable: false, defaultValue: null },
        { name: 'record_id', type: 'INTEGER', length: null, isNullable: true, defaultValue: null },
        { name: 'timestamp', type: 'TIMESTAMP', length: null, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
      ],
      'temp_import': [
        { name: 'id', type: 'INTEGER', length: null, isNullable: false, defaultValue: 'AUTO_INCREMENT' },
        { name: 'raw_data', type: 'TEXT', length: null, isNullable: true, defaultValue: null },
        { name: 'imported_at', type: 'TIMESTAMP', length: null, isNullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
      ]
    };

    return structures[tableName] || [
      { name: 'id', type: 'INTEGER', length: null, isNullable: false, defaultValue: 'AUTO_INCREMENT' }
    ];
  }

  getTableData(tableName: string): any[] {
    const data: { [key: string]: any[] } = {
      'users': [
        { id: 1, email: 'juan@email.com', username: 'juan123', first_name: 'Juan', last_name: 'Pérez', is_active: true, created_at: '2024-01-15T10:30:00' },
        { id: 2, email: 'maria@email.com', username: 'maria456', first_name: 'María', last_name: 'García', is_active: true, created_at: '2024-01-16T14:20:00' }
      ],
      'products': [
        { id: 1, sku: 'PROD001', name: 'Laptop Gaming', description: 'Laptop para gaming de alta gama', price: 1299.99, category_id: 1, stock_quantity: 15 },
        { id: 2, sku: 'PROD002', name: 'Mouse Inalámbrico', description: 'Mouse ergonómico inalámbrico', price: 49.99, category_id: 2, stock_quantity: 50 }
      ]
    };

    return data[tableName] || [];
  }

 


  // Abrir el modal
  openActivarAuditoriaModal() {
    this.showActivarAuditoriaModal = true;
    this.modalState = 'initial';
    this.auditForm.tableName = '';
    this.formTouched = false;
  }

  // Cerrar el modal
  closeActivarAuditoriaModal() {
    this.showActivarAuditoriaModal = false;
    this.modalState = 'initial';
    this.auditForm.tableName = '';
    this.formTouched = false;
  }

  // Limpiar formulario
  limpiarFormulario() {
    this.auditForm.tableName = '';
    this.formTouched = false;
  }
  // Reintentar activación
  reintentar() {
    this.modalState = 'initial';
    this.formTouched = false;
  }

  //PRUEBA CREACION AUDITORIA
  
  // Cargar tablas desde el backend
  async cargarTablasDisponibles() {
    const loading = await this.loadingController.create({
      message: 'Cargando tablas...'
    });
    await loading.present();

    this.dashboardService.obtenerTablasDisponibles().subscribe({
      next: (response) => {
        this.tablasDisponibles = response || [];
        loading.dismiss();
        console.log('Tablas disponibles:', this.tablasDisponibles);
      },
      error: (error) => {
        console.error('Error cargando tablas:', error);
        loading.dismiss();
        this.mostrarToast('Error cargando tablas', 'danger');
      }
    });
  }

  // Toggle selección de tabla
  toggleTabla(tabla: string) {
    const index = this.tablasSeleccionadas.indexOf(tabla);
    if (index > -1) {
      this.tablasSeleccionadas.splice(index, 1);
    } else {
      this.tablasSeleccionadas.push(tabla);
    }
  }

  // Verificar si tabla está seleccionada
  isSeleccionada(tabla: string): boolean {
    return this.tablasSeleccionadas.includes(tabla);
  }

  // Prueba rápida con tabla predefinida
  async pruebaRapida() {
    const alert = await this.alertController.create({
      header: '🚀 Prueba Rápida',
      message: 'Esta prueba creará auditoría para una tabla de ejemplo.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Ejecutar Prueba',
          handler: () => {
            this.ejecutarPruebaRapida();
          }
        }
      ]
    });

    await alert.present();
  }
  
  private async ejecutarPruebaRapida() {
    const loading = await this.loadingController.create({
      message: '🧪 Ejecutando prueba...',
      spinner: 'crescent'
    });
    await loading.present();

    this.dashboardService.probarAuditoria().subscribe({
      next: (response) => {
        loading.dismiss();
        this.resultado = response;
        this.mostrarResultado = true;
        console.log('Resultado prueba rápida:', response);
        
        if (response.resultado?.success) {
          this.mostrarToast('✅ Prueba exitosa!', 'success');
        } else {
          this.mostrarToast('❌ Prueba falló', 'warning');
        }
      },
      error: (error) => {
        loading.dismiss();
        console.error('Error en prueba rápida:', error);
        this.mostrarToast('Error en la prueba', 'danger');
      }
    });
  }

    // Crear auditoría con tablas seleccionadas
  async crearAuditoriaSeleccionadas() {
    if (this.tablasSeleccionadas.length === 0) {
      this.mostrarToast('Selecciona al menos una tabla', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: '⚡ Crear Auditoría',
      message: `¿Crear auditoría automática para estas tablas?
      
      📋 Tablas: ${this.tablasSeleccionadas.join(', ')}
      
      🔧 Se ejecutarán automáticamente todos los triggers.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear Auditoría',
          handler: () => {
            this.ejecutarCreacionAuditoria(this.tablasSeleccionadas);
          }
        }
      ]
    });

    await alert.present();
  }

   // Crear auditoría con tablas personalizadas
  async crearAuditoriaPersonalizada() {
    if (!this.tablasPersonalizadas.trim()) {
      this.mostrarToast('Escribe al menos una tabla', 'warning');
      return;
    }

    // Convertir string a array
    const tablas = this.tablasPersonalizadas
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const alert = await this.alertController.create({
      header: '📝 Auditoría Personalizada',
      message: `¿Crear auditoría para estas tablas personalizadas?
      
      📋 Tablas: ${tablas.join(', ')}`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: () => {
            this.ejecutarCreacionAuditoria(tablas);
          }
        }
      ]
    });

    await alert.present();
  }

  private async ejecutarCreacionAuditoria(tablas: string[]) {
    const loading = await this.loadingController.create({
      message: '⚡ Creando auditoría automática...',
      spinner: 'crescent'
    });
    await loading.present();

    this.isLoading = true;

    this.dashboardService.crearAuditoriaAutomatica(tablas).subscribe({
      next: (response) => {
        loading.dismiss();
        this.isLoading = false;
        this.resultado = response;
        this.mostrarResultado = true;
        
        console.log('Resultado creación:', response);

        if (response.success) {
          this.mostrarResultadoExitoso(response);
        } else {
          this.mostrarResultadoError(response);
        }
      },
      error: (error) => {
        loading.dismiss();
        this.isLoading = false;
        console.error('Error creando auditoría:', error);
        this.mostrarToast('Error del servidor', 'danger');
        
        // Mostrar detalles del error
        this.resultado = {
          success: false,
          error: error.error?.detail || error.message || 'Error desconocido',
          error_details: error
        };
        this.mostrarResultado = true;
      }
    });
  }

  private async mostrarResultadoExitoso(response: any) {
    const stats = response.estadisticas;
    
    const alert = await this.alertController.create({
      header: '🎉 ¡Éxito!',
      message: `Auditoría creada correctamente:
      
      📊 Triggers ejecutados: ${stats?.triggers_ejecutados || 0}
      📋 Tablas procesadas: ${stats?.tablas_procesadas?.length || 0}`,
      buttons: ['Genial!']
    });

    await alert.present();
    this.mostrarToast('✅ Auditoría creada exitosamente!', 'success');
  }

  private async mostrarResultadoError(response: any) {
    const alert = await this.alertController.create({
      header: '❌ Error',
      message: `No se pudo crear la auditoría:
      
      🔥 Error: ${response.error}`,
      buttons: ['Entendido']
    });

    await alert.present();
    this.mostrarToast('❌ Error en la creación', 'danger');
  }

  // Limpiar resultado
  limpiarResultado() {
    this.resultado = null;
    this.mostrarResultado = false;
  }

  // Limpiar selecciones
  limpiarSelecciones() {
    this.tablasSeleccionadas = [];
    this.tablasPersonalizadas = '';
  }

  // Mostrar toast
  private async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  // Copiar resultado al clipboard
  async copiarResultado() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(this.resultado, null, 2));
      this.mostrarToast('📋 Resultado copiado', 'success');
    } catch (error) {
      console.error('Error copiando:', error);
    }
  }


}
