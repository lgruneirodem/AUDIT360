import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
  },
  {
    path: 'historial',
    loadComponent: () => import('./historial/historial.page').then(m => m.HistorialPage),
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./configuracion/configuracion.page').then( m => m.ConfiguracionPage)
  },
  {
    path: 'exportar',
    loadComponent: () => import('./exportar/exportar.page').then( m => m.ExportarPage)
  },
  {
    path: 'notificaciones',
    loadComponent: () => import('./notificaciones/notificaciones.page').then( m => m.NotificacionesPage)
  },
  {
    path: 'cuenta',
    loadComponent: () => import('./cuenta/cuenta.page').then( m => m.CuentaPage)
  },
  {
    path: 'transacciones',
    loadComponent: () => import('./transacciones/transacciones.page').then( m => m.TransaccionesPage)
  },
  {
    path: 'herramientas',
    loadComponent: () => import('./herramientas/herramientas.page').then( m => m.HerramientasPage)
  },
];