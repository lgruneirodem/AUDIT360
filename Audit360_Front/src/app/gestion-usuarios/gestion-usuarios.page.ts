import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,  FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';


@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.page.html',
  styleUrls: ['./gestion-usuarios.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule,ReactiveFormsModule]
})
export class GestionUsuariosPage implements OnInit {

  userForm!: FormGroup;
  users: any[] = [];
  filteredUsers: any[] = [];
  
  // Modal y estados
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentUser: any = null;
  
  // Filtros
  searchTerm = '';
  filterStatus = 'all';
  
  // Vista previa de avatar
  previewAvatar = '';
  showPassword = false;
  
  // Toast y alertas
  showToast = false;
  toastMessage = '';
  toastColor: 'success' | 'danger' | 'warning' = 'success';
  
  showAlert = false;
  alertHeader = '';
  alertMessage = '';
  alertButtons: any[] = [];
  userRol: string = '';

  constructor(private authService: AuthService, private router: Router, private formBuilder: FormBuilder) { 
    this.initializeForm();
    this.loadMockUsers();
  }

  ngOnInit() {
    this.filterUsers();
    
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload: any = jwtDecode(token);
      this.userRol = payload.rol; // Asegúrate de que tu backend lo incluya
      console.log('Rol decodificado:', payload.rol);
    }
  }

   private initializeForm() {
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: ['', Validators.required],
      department: [''],
      status: ['active'],
      password: ['', [Validators.required, Validators.minLength(8)]],
      sendCredentials: [true]
    });
  }

  private loadMockUsers() {
    // Datos de ejemplo - en una app real esto vendría de una API
    this.users = [
      {
        id: '1',
        name: 'María González',
        email: 'maria.gonzalez@audit360.com',
        phone: '+34 123 456 789',
        role: 'admin',
        department: 'audit',
        status: 'active',
        avatar: 'assets/avatars/maria.jpg',
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2024-03-10T09:30:00')
      },
      {
        id: '2',
        name: 'Carlos Ruiz',
        email: 'carlos.ruiz@audit360.com',
        phone: '+34 987 654 321',
        role: 'auditor',
        department: 'audit',
        status: 'active',
        avatar: 'assets/avatars/carlos.jpg',
        createdAt: new Date('2024-02-01'),
        lastLogin: new Date('2024-03-09T14:15:00')
      },
      {
        id: '3',
        name: 'Ana López',
        email: 'ana.lopez@audit360.com',
        role: 'analyst',
        department: 'finance',
        status: 'pending',
        createdAt: new Date('2024-03-01')
      },
      {
        id: '4',
        name: 'Pedro Martín',
        email: 'pedro.martin@audit360.com',
        phone: '+34 555 123 456',
        role: 'viewer',
        department: 'operations',
        status: 'inactive',
        createdAt: new Date('2024-01-20'),
        lastLogin: new Date('2024-02-28T16:45:00')
      }
    ];
  }

  // Getters para estadísticas
  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter(user => user.status === 'active').length;
  }

  get pendingUsers(): number {
    return this.users.filter(user => user.status === 'pending').length;
  }

  // Funciones de filtrado
  filterUsers() {
    let filtered = [...this.users];

    // Filtrar por texto de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === this.filterStatus);
    }

    this.filteredUsers = filtered;
  }

  // Funciones del modal
  openCreateUserModal() {
    this.isEditing = false;
    this.currentUser = null;
    this.previewAvatar = '';
    this.userForm.reset();
    this.userForm.patchValue({ status: 'active', sendCredentials: true });
    
    // Habilitar campo de contraseña para nuevos usuarios
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.isModalOpen = true;
  }

  editUser(user: any) {
    this.isEditing = true;
    this.currentUser = user;
    this.previewAvatar = user.avatar || '';
    
    // Llenar formulario con datos del usuario
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      department: user.department || '',
      status: user.status
    });
    
    // Deshabilitar campo de contraseña para edición
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditing = false;
    this.currentUser = null;
    this.userForm.reset();
    this.previewAvatar = '';
    this.showPassword = false;
  }

  // Funciones de usuarios
  async saveUser() {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formData = this.userForm.value;
      
      if (this.isEditing && this.currentUser) {
        // Actualizar usuario existente
        const index = this.users.findIndex(u => u.id === this.currentUser.id);
        if (index !== -1) {
          this.users[index] = {
            ...this.users[index],
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            department: formData.department,
            status: formData.status,
            avatar: this.previewAvatar || this.users[index].avatar
          };
        }
        
        this.showToastMessage('Usuario actualizado correctamente', 'success');
      } else {
        // Crear nuevo usuario
        const newUser = {
          id: this.generateId(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
          status: formData.status,
          avatar: this.previewAvatar,
          createdAt: new Date()
        };
        
        this.users.unshift(newUser);
        
        // Simular envío de credenciales si está marcado
        if (formData.sendCredentials) {
          this.showToastMessage('Usuario creado y credenciales enviadas por correo', 'success');
        } else {
          this.showToastMessage('Usuario creado correctamente', 'success');
        }
      }
      
      this.filterUsers();
      this.closeModal();
      
    } catch (error) {
      console.error('Error saving user:', error);
      this.showToastMessage('Error al guardar el usuario', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async confirmDelete(user: any) {
    this.alertHeader = 'Confirmar eliminación';
    this.alertMessage = `¿Estás seguro de que quieres eliminar al usuario "${user.name}"? Esta acción no se puede deshacer.`;
    this.alertButtons = [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        handler: () => {
          this.deleteUser(user);
        }
      }
    ];
    this.showAlert = true;
  }

  private deleteUser(user: any) {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users.splice(index, 1);
      this.filterUsers();
      this.showToastMessage('Usuario eliminado correctamente', 'success');
    }
  }

  // Funciones auxiliares
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  private showToastMessage(message: string, color: 'success' | 'danger' | 'warning') {
    this.toastMessage = message;
    this.toastColor = color;
    this.showToast = true;
  }

  // Funciones de UI
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  selectAvatar() {
    // En una implementación real, aquí abrirías un selector de archivos
    // Por ahora simulamos la selección
    const avatars = [
      'assets/avatars/avatar1.png',
      'assets/avatars/avatar2.png',
      'assets/avatars/avatar3.png',
      'assets/avatars/avatar4.png'
    ];
    
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    this.previewAvatar = randomAvatar;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  getRoleText(role: string): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'auditor':
        return 'Auditor';
      case 'analyst':
        return 'Analista';
      case 'viewer':
        return 'Visualizador';
      default:
        return role;
    }
  }

  getDepartmentText(department: string): string {
    switch (department) {
      case 'audit':
        return 'Auditoría';
      case 'finance':
        return 'Finanzas';
      case 'it':
        return 'Tecnología';
      case 'hr':
        return 'Recursos Humanos';
      case 'operations':
        return 'Operaciones';
      default:
        return department || 'Sin asignar';
    }
  }

  // Función para logout (mantiene la funcionalidad del sidebar)


  // Función para reenviar credenciales
  async resendCredentials(user: any) {
    this.alertHeader = 'Reenviar credenciales';
    this.alertMessage = `¿Quieres reenviar las credenciales de acceso a ${user.email}?`;
    this.alertButtons = [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Enviar',
        handler: () => {
          // Simular envío de credenciales
          this.showToastMessage('Credenciales reenviadas correctamente', 'success');
        }
      }
    ];
    this.showAlert = true;
  }

  // Función para resetear contraseña
  async resetPassword(user: any) {
    this.alertHeader = 'Resetear contraseña';
    this.alertMessage = `¿Quieres generar una nueva contraseña temporal para ${user.name}?`;
    this.alertButtons = [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Resetear',
        handler: () => {
          // Simular reset de contraseña
          this.showToastMessage('Contraseña reseteada y enviada por correo', 'success');
        }
      }
    ];
    this.showAlert = true;
  }

  // Función para exportar usuarios
  exportUsers() {
    // Simular exportación
    const csvData = this.users.map(user => ({
      Nombre: user.name,
      Email: user.email,
      Teléfono: user.phone || '',
      Rol: this.getRoleText(user.role),
      Departamento: this.getDepartmentText(user.department || ''),
      Estado: this.getStatusText(user.status),
      'Fecha creación': user.createdAt.toLocaleDateString(),
      'Último acceso': user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Nunca'
    }));
    
    console.log('Exportando usuarios:', csvData);
    this.showToastMessage('Lista de usuarios exportada', 'success');
  }
  
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
