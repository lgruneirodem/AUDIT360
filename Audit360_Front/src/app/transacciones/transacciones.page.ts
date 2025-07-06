import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { ToastController, AlertController } from '@ionic/angular';
import { RollbackService } from '../services/rollback.service';


@Component({
  selector: 'app-transacciones',
  templateUrl: './transacciones.page.html',
  styleUrls: ['./transacciones.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,]
})
export class TransaccionesPage implements OnInit {
  rollbacks: any[] = [];
  solicitudes: any[] = [];
  flujoTransaccion: any[] = [];
  comparacion: any[] = [];
  nuevaSolicitud = {
    transaction_id: '', // Cambiar de id_transaccion a transaction_id
    table_name: '',  
    motivo: ''
  };
  filtroActivo: string = 'all'; // Filtro activo
  solicitudesFiltradas: any[] = []; // Lista filtrada
  userRol: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient, private rollbackService: RollbackService,private toastController: ToastController,private alertController: AlertController) { }

  ngOnInit() {

    const token = localStorage.getItem('access_token');
    if (token) {
      const payload: any = jwtDecode(token);
      this.userRol = payload.rol; // Asegúrate de que tu backend lo incluya
    }

    this.cargarSolicitudes();
    this.cargarRollbacksEjecutados();
  }
  // Cambiar filtro cuando se selecciona una pestaña
  cambiarFiltro(event: any) {
    this.filtroActivo = event.detail.value;
    this.aplicarFiltro();
  }

  // Aplicar filtro a las solicitudes
  aplicarFiltro() {
    if (this.filtroActivo === 'all') {
      this.solicitudesFiltradas = [...this.solicitudes];
    } else {
      this.solicitudesFiltradas = this.solicitudes.filter(
        solicitud => solicitud.status === this.filtroActivo
      );
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    this.solicitudesFiltradas.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  async presentToast(message: string, color: string = 'success') {
  const toast = await this.toastController.create({
    message,
    duration: 2000,
    color,
    position: 'bottom'
  });
  await toast.present();
}

  solicitarRollback() {
    // Validar que todos los campos requeridos estén llenos
    if (!this.nuevaSolicitud.transaction_id || !this.nuevaSolicitud.table_name || !this.nuevaSolicitud.motivo) {
      this.presentToast('Por favor, completa todos los campos', 'warning');
      return;
    }

    this.isLoading = true;
    this.rollbackService.enviarSolicitud(this.nuevaSolicitud).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.presentToast('Solicitud enviada exitosamente');
          // Limpiar el formulario
          this.nuevaSolicitud = { transaction_id: '', table_name: '', motivo: '' };
          // Recargar las solicitudes para mostrar la nueva
          this.cargarSolicitudes();
        } else {
          this.presentToast('Error al enviar solicitud', 'danger');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error:', error);
        this.presentToast('Error al enviar solicitud', 'danger');
      }
    });
  }


cargarSolicitudes() {
    this.isLoading = true;
    this.rollbackService.getSolicitudes().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.solicitudes = res.data;
          console.log('Solicitudes cargadas:', this.solicitudes);
        } else {
          this.presentToast('Error al cargar solicitudes', 'danger');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error cargando solicitudes:', error);
        this.presentToast('Error al cargar solicitudes', 'danger');
      }
    });
  }

aprobar(id: number) {
    this.rollbackService.aprobarRollback(id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.presentToast('Rollback aprobado exitosamente');
          this.cargarSolicitudes(); // Recargar para ver el cambio de estado
        } else {
          this.presentToast('Error al aprobar rollback', 'danger');
        }
      },
      error: (error) => {
        console.error('Error aprobando rollback:', error);
        this.presentToast('Error al aprobar rollback', 'danger');
      }
    });
  }

// Nueva función para cargar rollbacks ejecutados
  cargarRollbacksEjecutados() {
    this.rollbackService.getRollbacksEjecutados().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.rollbacks = res.data;
        }
      },
      error: (error) => {
        console.error('Error cargando rollbacks ejecutados:', error);
      }
    });
  }

  // Función para ejecutar rollback después de aprobarlo
  ejecutarRollback(id: number) {
    this.rollbackService.ejecutarRollback(id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.presentToast('Rollback ejecutado exitosamente');
          this.cargarSolicitudes();
          this.cargarRollbacksEjecutados();
        } else {
          this.presentToast('Error al ejecutar rollback', 'danger');
        }
      },
      error: (error) => {
        console.error('Error ejecutando rollback:', error);
        this.presentToast('Error al ejecutar rollback', 'danger');
      }
    });
  }

  // Función para rechazar rollback
  rechazar(id: number) {
    this.rollbackService.rechazarRollback(id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.presentToast('Rollback rechazado');
          this.cargarSolicitudes();
        } else {
          this.presentToast('Error al rechazar rollback', 'danger');
        }
      },
      error: (error) => {
        console.error('Error rechazando rollback:', error);
        this.presentToast('Error al rechazar rollback', 'danger');
      }
    });
  }

  // Función helper para mostrar el nombre completo del usuario
  getNombreCompleto(userRequest: any): string {
    if (userRequest && userRequest.full_name) {
      return userRequest.full_name;
    }
    if (userRequest && userRequest.nombre && userRequest.apellido) {
      return `${userRequest.nombre} ${userRequest.apellido}`;
    }
    return 'Usuario desconocido';
  }

  // Función helper para formatear fechas
  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-ES');
  }

  // Funciones adicionales para el template

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'EXECUTED': return 'primary';
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      case 'EXECUTED': return 'Ejecutado';
      default: return status;
    }
  }

  puedeGestionar(): boolean {
    return true;
    //this.userRol === 'ADMIN';
  }
  //Función para ver detalles (modal o página de detalle)
  async verDetalle(solicitud: any) {
    const alert = await this.alertController.create({
      header: 'Detalles del Rollback',
      message: `
        <strong>ID:</strong> ${solicitud.transaction_id}<br>
        <strong>Tabla:</strong> ${solicitud.table_name}<br>
        <strong>Estado:</strong> ${this.getStatusText(solicitud.status)}<br>
        <strong>Solicitado por:</strong> ${this.getNombreCompleto(solicitud.user_request)}<br>
        <strong>Fecha:</strong> ${solicitud.created_at_formatted || this.formatearFecha(solicitud.created_at)}<br>
        ${solicitud.approved_by ? `<strong>Procesado por:</strong> ${this.getNombreCompleto(solicitud.approved_by)}<br>` : ''}
        ${solicitud.approved_at ? `<strong>Fecha proceso:</strong> ${solicitud.approved_at_formatted || this.formatearFecha(solicitud.approved_at)}<br>` : ''}
        <br><strong>Motivo:</strong><br>${solicitud.motivo}
      `,
      buttons: ['Cerrar']
    });

    await alert.present();
  }


  getConteoEstados(): any {
   if (!this.solicitudes || this.solicitudes.length === 0) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        executed: 0
      };
    }

    return {
      total: this.solicitudes.length,
      pending: this.solicitudes.filter(s => s.status === 'PENDING').length,
      approved: this.solicitudes.filter(s => s.status === 'APPROVED').length,
      rejected: this.solicitudes.filter(s => s.status === 'REJECTED').length,
      executed: this.solicitudes.filter(s => s.status === 'EXECUTED').length
    };
  }

  // Función para actualizar una solicitud específica después de una acción
  actualizarSolicitud(id: number, nuevosDatos: any) {
    const index = this.solicitudes.findIndex(s => s.id === id);
    if (index !== -1) {
      this.solicitudes[index] = { ...this.solicitudes[index], ...nuevosDatos };
      this.aplicarFiltro(); // Re-aplicar filtro
    }
  }

  // Función para refrescar datos
  async refrescarDatos(event?: any) {
    this.cargarSolicitudes();
    if (event) {
      event.target.complete();
    }
  }
}
