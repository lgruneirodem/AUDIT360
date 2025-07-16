from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApproveRollbackAPIView, CreateRollbackRequestAPIView, CustomTokenObtainPairView, DashboardTablaView, ExecuteRollbackAPIView, GestionAuditoriaAPIView, HistorialViewSet, ListRollbackRequestsAPIView
from .views import ActividadPorPeriodoView
from .views import DashboardResumenView
from .views import TablaAuditadaListView
from .views import GenerarInformeIaAPIView,InformePDFAPIView,InformeRecienteAPIView,DatosInformeAPIView,GuardarInformeAPIView,UsuarioDetalleAPIView,SystemLogAPIView,CrearAuditoriaView,CrearAuditoriaAutomaticaAPIView, ProbarAuditoriaAPIView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


router = DefaultRouter()
router.register(r'historial', HistorialViewSet, basename='historial')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('actividad-periodo/', ActividadPorPeriodoView.as_view()),
    path('dashboard-resumen/', DashboardResumenView.as_view()),
    path('gestion-auditoria/', GestionAuditoriaAPIView.as_view()),
    path('logs/', SystemLogAPIView.as_view(), name='logs-por-rol'),
    path('crear-auditoria/', CrearAuditoriaView.as_view(), name='crear-auditoria'),
    path('tabla-resumen/', DashboardTablaView.as_view()),
    path('rollback/ExecuteRollbackAPIView/<int:id_transaccion>/',  ExecuteRollbackAPIView.as_view(), name='ejecutar'),
    path('rollback/create/', CreateRollbackRequestAPIView.as_view()),
    path('rollback/list/', ListRollbackRequestsAPIView.as_view()),
    path('rollback/approve/<int:request_id>/', ApproveRollbackAPIView.as_view()),
    path('tablas-auditadas/', TablaAuditadaListView.as_view(), name='listar_tablas_auditadas'),
    path('generar-informeIA/', GenerarInformeIaAPIView.as_view()),
    path('informes/<int:pk>/pdf/', InformePDFAPIView.as_view(), name='informe_pdf'),
    path('informes-recientes/', InformeRecienteAPIView.as_view(), name='informes_recientes'),
    path('datos-informe/', DatosInformeAPIView.as_view(), name='datos_auditoria'),
    path('guardar-informe/', GuardarInformeAPIView.as_view(), name='guardar_informe'),
    path('usuarios/<int:pk>/', UsuarioDetalleAPIView.as_view(), name='usuario_detalle'),
    path('auditoria/crear/', CrearAuditoriaAutomaticaAPIView.as_view(), name='crear-auditoria'),
    path('auditoria/probar/', ProbarAuditoriaAPIView.as_view(), name='probar-auditoria'),

]