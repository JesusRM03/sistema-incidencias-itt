# Evidencia de la revisión

Fecha: 29 de octubre de 2026. Datos de prueba, sin padrón institucional.

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| Compilación y ESLint | Sin errores en la revisión | Código del cliente y API |
| Unitarias | 71 aprobadas | Incluye las 30 transiciones entre estados distintos |
| Integración | 42 aprobadas | API y MySQL 8.0.46 local |
| Navegador | 8 aprobadas | Chromium 141, tres anchos y flujos por rol |
| Accesibilidad automática | Sin infracciones en las cuatro vistas ensayadas | Acceso, resumen, registro y consulta; no es certificación WCAG completa |
| Carga breve, 10 000 registros | 50 sesiones, 343 solicitudes, 0 errores, p95 1.778 s | Diez segundos; requiere repetición formal de diez minutos |
| Carga breve, 20 000 registros | 50 sesiones, 242 solicitudes, 0 errores, p95 2.766 s | Diez segundos; requiere repetición formal de diez minutos |

En el destino debe repetirse la verificación con MySQL 8.4, HTTPS, cuenta de mínimos privilegios y navegadores de producción. Quedan pendientes ensayos con usuarios reales, cámara QR, Windows, disponibilidad durante cuatro semanas, restauración medida, espejo y equipamiento físico.

Las capturas y tablas de los Word corresponden a esta implementación. Las cuentas y los espacios mostrados son demostrativos. La matriz original conserva 30 RF, 14 RNF y 10 RD; un ensayo parcial aprobado no acredita todos los criterios de un requisito.
