# SISTEMA INTEGRAL DE REPORTE Y SEGUIMIENTO DE INCIDENCIAS EN INFRAESTRUCTURA DEL INSTITUTO TECNOLÓGICO DE TOLUCA

Prototipo académico desarrollado con React, Vite y Tailwind CSS para simular el registro, consulta, asignación y seguimiento de incidencias de infraestructura dentro del Instituto Tecnológico de Toluca.

El sistema no usa backend ni base de datos real. Toda la persistencia se guarda de forma simulada en `localStorage` del navegador.

## Tecnologías

- React
- Vite
- Tailwind CSS
- React Router DOM
- Recharts
- Lucide React
- localStorage

## Instalación y ejecución

```bash
npm install
npm run dev
```

Para generar una versión de producción:

```bash
npm run build
```

Para revisar reglas de código:

```bash
npm run lint
```

## Usuarios de prueba

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@ittoluca.edu.mx | admin123 |
| Técnico | tecnico@ittoluca.edu.mx | tecnico123 |
| Alumno | alumno@ittoluca.edu.mx | alumno123 |
| Docente | docente@ittoluca.edu.mx | docente123 |

## Funcionalidades implementadas

- Inicio de sesión y registro de usuarios simulados.
- Validación de navegación y permisos por rol.
- Registro de nuevas incidencias por Alumno y Docente.
- Listado de incidencias filtrado según el rol del usuario.
- Vista detallada de incidencia con ID, tipo, prioridad, ubicación, descripción, fecha, reportante, técnico, estado e historial.
- Asignación de técnico por Administrador.
- Cambio de estado y comentarios de avance por Administrador o Técnico asignado.
- Historial con responsable, fecha, estado y comentario.
- Notificaciones simuladas guardadas en localStorage.
- Notificaciones marcables como leídas.
- Reportes administrativos con tarjetas resumen, gráficas y tabla de incidencias recientes.
- Panel de administración con usuarios registrados, conteo por rol, limpieza de datos y reinicio demo.
- Datos demo iniciales sin duplicarse al recargar.
- Diseño oscuro moderno con colores institucionales, logo ITT y mapa del Instituto Tecnológico de Toluca.

## Estados de incidencia

- Pendiente
- En proceso
- En revisión
- Resuelto
- Cerrado
- Cancelado

El Técnico sigue transiciones controladas para evitar cambios ilógicos. El Administrador puede intervenir directamente cuando sea necesario.

## Pruebas manuales sugeridas

1. Login: inicia sesión con cada usuario de prueba y confirma que el sidebar cambia según el rol.
2. Registro de incidencia: entra como Alumno o Docente, abre Nueva incidencia, completa el formulario y verifica el mensaje de éxito.
3. Asignación de técnico: entra como Administrador, abre una incidencia pendiente y asigna el técnico.
4. Cambio de estado: entra como Técnico, abre una incidencia asignada, selecciona un estado permitido y agrega comentario.
5. Notificaciones: revisa la pantalla Notificaciones y marca avisos como leídos.
6. Reportes: entra como Administrador y valida tarjetas, gráficas por estado/tipo/edificio/prioridad y tabla reciente.
7. Validación de roles: intenta acceder como Alumno o Técnico a `/reportes` o `/administracion`; el sistema debe regresar al Dashboard.
8. Limpieza demo: entra como Administrador, abre Administración, usa Limpiar incidencias y Reiniciar datos demo confirmando los diálogos.

## Notas académicas

Este proyecto mantiene la arquitectura de prototipo solicitada. No incluye MySQL, Firebase, API REST ni backend. Los datos pueden reiniciarse desde el panel de Administración o limpiando el localStorage del navegador.
