import { Component, OnInit, Input } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tabla-tablas',
  templateUrl: './tabla-tablas.component.html',
  styleUrls: ['./tabla-tablas.component.scss'],
  imports: [ IonicModule,CommonModule, FormsModule]
})
export class TablaTablasComponent  implements OnInit {
  private baseUrl = 'http://localhost:8000/app';
  @Input() tabla: string = '';
// ========================================
  // PROPIEDADES GENERALES
  // ========================================
  isMobile = false;
  tablas: any[] = [];
  tablaFiltrada: any[] = [];

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

  // ========================================
  // PROPIEDADES MODAL EDITAR DATOS
  // ========================================
  showEditDataModal = false;
  selectedTableData: any = null; // Para datos
  editingRecord: any = null;
  recordForm: any = {};
  showSQLPreview = false;
  formErrors: { [key: string]: string } = {};

  constructor(private alertController: AlertController) {}

  ngOnInit() {
    this.detectMobile();
    this.loadFakeData();
    this.filtrarTablas();
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

  // ========================================
  // FUNCIONES GENERALES
  // ========================================
  detectMobile() {
    this.isMobile = window.innerWidth < 768;
  }

  filtrarTablas() {
    this.tablaFiltrada = [...this.tablas];
  }

  getStatusColor(status: string): string {
    return status === 'ACTIVA' ? 'success' : 'danger';
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  // ========================================
  // FUNCIONES MODAL CONFIGURACIÓN GENERAL
  // ========================================

  // Abrir modal para NUEVA tabla
  nuevaTabla() {
    console.log('Abriendo modal para NUEVA tabla');
    this.selectedTableConfig = null; // Nueva tabla
    this.resetEditForm();
    this.showEditModal = true;
  }

  // Abrir modal para CONFIGURAR tabla existente
  configurarTabla(table: any) {
    console.log('Configuración general de tabla:', table);
    this.selectedTableConfig = table; // Tabla existente
    this.loadTableConfigIntoForm(table);
    this.showEditModal = true;
  }

  // Cargar configuración de tabla en formulario
  loadTableConfigIntoForm(table: any) {
    this.editForm = {
      name: table.name || '',
      schema: table.schema || 'public',
      type: table.type || 'table',
      description: table.description || '',
      status: table.status || 'ACTIVA',
      rowLimit: table.rowLimit || 0,
      backupPriority: table.backupPriority || 'medium',
      autoBackup: table.autoBackup !== false,
      enableAudit: table.enableAudit || false,
      dataRetention: table.dataRetention || 365,
      compression: table.compression || 'none',
      customIndexes: table.customIndexes || ''
    };
  }

  // Cerrar modal de configuración
  closeEditModal() {
    this.showEditModal = false;
    this.selectedTableConfig = null;
    this.resetEditForm();
  }

  // Resetear formulario de configuración
  resetEditForm() {
    this.editForm = {
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
  }

  // Guardar configuración de tabla
  async saveChanges() {
    try {
      if (!this.editForm.name.trim()) {
        await this.presentAlert('Error', 'El nombre de la tabla es obligatorio');
        return;
      }

      const nombreExiste = this.tablas.some(t => 
        t.name.toLowerCase() === this.editForm.name.toLowerCase() && 
        (!this.selectedTableConfig || t.name !== this.selectedTableConfig.name)
      );
      
      if (nombreExiste) {
        await this.presentAlert('Error', 'Ya existe una tabla con ese nombre');
        return;
      }

      console.log('Guardando configuración:', this.editForm);
      
      if (this.selectedTableConfig) {
        // ACTUALIZAR tabla existente
        const index = this.tablas.findIndex(t => t.name === this.selectedTableConfig.name);
        if (index !== -1) {
          this.tablas[index] = {
            ...this.tablas[index],
            ...this.editForm,
            lastModified: new Date().toISOString(),
            lastOp: 'CONFIG UPDATED'
          };
        }
        await this.presentAlert('Éxito', 'Configuración de tabla actualizada correctamente');
      } else {
        // CREAR nueva tabla
        const newTable = {
          ...this.editForm,
          columns: 1, // Inicia con columna ID
          rows: 0,
          lastModified: new Date().toISOString(),
          lastOp: 'CREATED'
        };
        this.tablas.push(newTable);
        await this.presentAlert('Éxito', 'Nueva tabla creada correctamente');
      }

      this.closeEditModal();
      this.filtrarTablas();
      
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      await this.presentAlert('Error', 'No se pudieron guardar los cambios');
    }
  }

  // Eliminar tabla desde configuración
  async deleteTable() {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar permanentemente la tabla "${this.selectedTableConfig?.name}"? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.tablas = this.tablas.filter(t => t.name !== this.selectedTableConfig?.name);
            this.filtrarTablas();
            this.closeEditModal();
            this.presentAlert('Éxito', 'Tabla eliminada correctamente');
          }
        }
      ]
    });

    await alert.present();
  }

  // ========================================
  // FUNCIONES MODAL EDITAR DATOS
  // ========================================

  // Abrir modal para NUEVO registro
  editarTabla(table: any) {
    console.log('Abriendo modal para NUEVO registro en tabla:', table);
    this.selectedTableData = table;
    this.editingRecord = null; // Nuevo registro
    this.resetRecordForm();
    this.showSQLPreview = false;
    this.showEditDataModal = true;
  }

  // Abrir modal para EDITAR registro específico
  editarRegistro(table: any, record: any) {
    console.log('Editando registro específico:', record);
    this.selectedTableData = table;
    this.editingRecord = record; // Registro existente
    this.loadRecordIntoForm(record);
    this.showSQLPreview = false;
    this.showEditDataModal = true;
  }

  // Cerrar modal de datos
  closeEditDataModal() {
    this.showEditDataModal = false;
    this.selectedTableData = null;
    this.editingRecord = null;
    this.recordForm = {};
    this.formErrors = {};
    this.showSQLPreview = false;
  }

  // Resetear formulario de datos (para nuevo registro)
  resetRecordForm() {
    this.recordForm = {};
    this.formErrors = {};
    
    const columns = this.getTableColumns(this.selectedTableData?.name);
    columns.forEach(column => {
      if (column.defaultValue && column.defaultValue !== 'AUTO_INCREMENT' && column.defaultValue !== 'CURRENT_TIMESTAMP') {
        this.recordForm[column.name] = column.defaultValue;
      } else {
        this.recordForm[column.name] = null;
      }
    });
  }

  // Cargar registro existente en formulario
  loadRecordIntoForm(record: any) {
    this.recordForm = { ...record };
    this.formErrors = {};
  }

  // Obtener placeholder para campo
  getPlaceholder(column: any): string {
    const placeholders: { [key: string]: string } = {
      'VARCHAR': `Ingresa ${column.name}`,
      'TEXT': `Describe ${column.name}`,
      'INTEGER': 'Número entero',
      'BIGINT': 'Número grande',
      'DECIMAL': 'Número decimal',
      'JSON': '{"clave": "valor"}',
      'UUID': 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    };
    
    return placeholders[column.type] || `Ingresa ${column.name}`;
  }

  // Generar UUID
  generateUUID(fieldName: string) {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    this.recordForm[fieldName] = uuid;
  }

  // Validar formulario de datos
  isFormValid(): boolean {
    this.formErrors = {};
    const columns = this.getTableColumns(this.selectedTableData?.name);
    let isValid = true;

    columns.forEach(column => {
      const value = this.recordForm[column.name];
      
      if (!column.isNullable && (value === null || value === undefined || value === '')) {
        if (column.name !== 'id' || !this.editingRecord) {
          this.formErrors[column.name] = 'Este campo es obligatorio';
          isValid = false;
        }
      }
      
      if (column.length && value && value.length > column.length) {
        this.formErrors[column.name] = `Máximo ${column.length} caracteres`;
        isValid = false;
      }
      
      if (column.name === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          this.formErrors[column.name] = 'Email inválido';
          isValid = false;
        }
      }
      
      if (column.type === 'JSON' && value) {
        try {
          JSON.parse(value);
        } catch (e) {
          this.formErrors[column.name] = 'JSON inválido';
          isValid = false;
        }
      }
    });

    return isValid;
  }

  // Obtener error de campo
  getFieldError(fieldName: string): string {
    return this.formErrors[fieldName] || '';
  }

  // Generar SQL para los datos
  generateDataSQL(): string {
    const tableName = this.selectedTableData?.name || 'tabla';
    const columns = this.getTableColumns(tableName);
    
    if (this.editingRecord) {
      // UPDATE - Registro existente
      const setClauses: string[] = [];
      
      columns.forEach(column => {
        if (column.name !== 'id') {
          const value = this.recordForm[column.name];
          const formattedValue = this.formatSQLValue(value, column.type);
          setClauses.push(`${column.name} = ${formattedValue}`);
        }
      });
      
      return `UPDATE ${tableName}\nSET ${setClauses.join(',\n    ')}\nWHERE id = ${this.recordForm.id};`;
    } else {
      // INSERT - Nuevo registro
      const columnNames: string[] = [];
      const values: string[] = [];
      
      columns.forEach(column => {
        if (column.name !== 'id') {
          columnNames.push(column.name);
          const value = this.recordForm[column.name];
          values.push(this.formatSQLValue(value, column.type));
        }
      });
      
      return `INSERT INTO ${tableName} (${columnNames.join(', ')})\nVALUES (${values.join(', ')});`;
    }
  }

  // Formatear valor para SQL
  formatSQLValue(value: any, type: string): string {
    if (value === null || value === undefined || value === '') {
      return 'NULL';
    }
    
    switch (type) {
      case 'VARCHAR':
      case 'TEXT':
      case 'UUID':
        return `'${value.toString().replace(/'/g, "''")}'`;
      case 'INTEGER':
      case 'BIGINT':
      case 'DECIMAL':
        return value.toString();
      case 'BOOLEAN':
        return value === true || value === 'true' ? 'TRUE' : 'FALSE';
      case 'DATE':
      case 'TIMESTAMP':
        return `'${value}'`;
      case 'JSON':
        return `'${JSON.stringify(value)}'`;
      default:
        return `'${value}'`;
    }
  }

  // Copiar SQL al portapapeles
  async copySQLToClipboard() {
    const sql = this.generateDataSQL();
    
    try {
      await navigator.clipboard.writeText(sql);
      await this.presentAlert('Éxito', 'SQL copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar:', error);
      await this.presentAlert('Error', 'No se pudo copiar el SQL');
    }
  }

  // Guardar registro (INSERT o UPDATE)
  async saveRecord() {
    try {
      if (!this.isFormValid()) {
        await this.presentAlert('Error', 'Por favor corrige los errores en el formulario');
        return;
      }

      console.log('Guardando registro:', this.recordForm);
      console.log('SQL generado:', this.generateDataSQL());
      
      if (this.editingRecord) {
        // UPDATE registro existente
        await this.presentAlert('Éxito', `Registro actualizado correctamente en ${this.selectedTableData?.name}`);
      } else {
        // INSERT nuevo registro
        if (this.selectedTableData) {
          const tableIndex = this.tablas.findIndex(t => t.name === this.selectedTableData.name);
          if (tableIndex !== -1) {
            this.tablas[tableIndex].rows += 1;
            this.tablas[tableIndex].lastModified = new Date().toISOString();
            this.tablas[tableIndex].lastOp = 'INSERT';
          }
        }
        await this.presentAlert('Éxito', `Nuevo registro creado en ${this.selectedTableData?.name}`);
      }

      this.closeEditDataModal();
      this.filtrarTablas();
      
    } catch (error) {
      console.error('Error al guardar registro:', error);
      await this.presentAlert('Error', 'No se pudo guardar el registro');
    }
  }

  // Eliminar registro
  async deleteRecord() {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            console.log('Eliminando registro:', this.editingRecord);
            
            if (this.selectedTableData) {
              const tableIndex = this.tablas.findIndex(t => t.name === this.selectedTableData.name);
              if (tableIndex !== -1 && this.tablas[tableIndex].rows > 0) {
                this.tablas[tableIndex].rows -= 1;
                this.tablas[tableIndex].lastModified = new Date().toISOString();
                this.tablas[tableIndex].lastOp = 'DELETE';
              }
            }
            
            await this.presentAlert('Éxito', 'Registro eliminado correctamente');
            this.closeEditDataModal();
            this.filtrarTablas();
          }
        }
      ]
    });

    await alert.present();
  }

  // ========================================
  // FUNCIONES DE BOTONES ADICIONALES
  // ========================================

  verDatos(table: any) {
    console.log('Ver datos de tabla:', table.name);
    const data = this.getTableData(table.name);
    let message = `Datos de ${table.name}:\n\n`;
    
    if (data.length > 0) {
      data.slice(0, 3).forEach((record, index) => {
        message += `Registro ${index + 1}:\n`;
        Object.keys(record).forEach(key => {
          message += `  ${key}: ${record[key]}\n`;
        });
        message += '\n';
      });
      
      if (data.length > 3) {
        message += `... y ${data.length - 3} registros más`;
      }
    } else {
      message += 'No hay datos para mostrar';
    }
    
    this.presentAlert('Datos de la Tabla', message);
  }

  auditarTabla() {
    console.log('Auditando tabla...');
    this.presentAlert('Auditoría', 'Iniciando proceso de auditoría...');
  }

  eliminarTabla() {
    console.log('Eliminando tabla...');
    this.presentAlert('Eliminar', 'Funcionalidad de eliminación directa');
  }

  verDetalleTabla(table: any) {
    console.log('Ver detalle de tabla:', table.name);
    this.presentAlert('Detalle', `Detalle de la tabla: ${table.name}`);
  }

  verHistorial(table: any) {
    console.log('Ver historial de tabla:', table.name);
    this.presentAlert('Historial', `Historial de la tabla: ${table.name}`);
  }

  limpiarFiltros() {
    console.log('Limpiando filtros...');
    this.filtrarTablas();
  }

  onResize() {
    this.detectMobile();
  }

}
