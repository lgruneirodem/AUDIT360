import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },

  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'historial',
    loadComponent: () => import('./historial/historial.page').then(m => m.HistorialPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./configuracion/configuracion.page').then( m => m.ConfiguracionPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'exportar',
    loadComponent: () => import('./exportar/exportar.page').then( m => m.ExportarPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'notificaciones',
    loadComponent: () => import('./notificaciones/notificaciones.page').then( m => m.NotificacionesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'cuenta',
    loadComponent: () => import('./cuenta/cuenta.page').then( m => m.CuentaPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'transacciones',
    loadComponent: () => import('./transacciones/transacciones.page').then( m => m.TransaccionesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'herramientas',
    loadComponent: () => import('./herramientas/herramientas.page').then( m => m.HerramientasPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'gestion-usuarios',
    loadComponent: () => import('./gestion-usuarios/gestion-usuarios.page').then( m => m.GestionUsuariosPage),
    canActivate: [AuthGuard],

  },

  {
    path: '**',
    redirectTo: '/login'
  },
  
  

];