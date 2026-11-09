# Auditoría de tareas completadas: T-UX-25

- **Fecha:** 2026-11-06.
- **ID de sesión:** IMA-AUDIT-20261106-0254Z (inicio C1.63; sesión abierta).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama:** NG_beta_0.0.0.1_work.
- **HEAD de partida:** c1d1c1870e7019435034c48fa275053c4414740d.
- **Dictamen:** **NO CUMPLE**.

## Especificación
T-UX-25 figura [X] en completadas.md (SHA f57f1aef832e81e44fc4f7ec36a852d50e464676). Exige guardar preferencias útiles de visualización/consulta, mantener defaults institucionales y permitir restablecer preferencias.

## Evidencia técnica
### Modal y persistencia de usuario
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- openDashboardSettingsModal (1629-1667) muestra la pestaña personal y otras pestañas; las pestañas de proveedor/visual se ocultan por rol.
- loadUserSettingsInModal (1674-1700) llama getUserSettings y solo asigna categorías de notificaciones, canal externo y frecuencia.
- saveDashboardSettingsModal (2439-2498) solo recoge cuatro categorías, canal y frecuencia. No lee idioma, formato de fecha, tema, layout de widgets ni controles del panel de rol. No existe botón ni handler para restablecer preferencias individuales.
- renderRoleSettingsInModal (2214+) crea inputs/selects específicos por rol con valores hardcodeados. bindDashboardSettingsModalEvents solo enlaza cerrar/cancelar/guardar/tabs; saveDashboardSettingsModal no recoge los controles de rol. Al cerrar y reabrir, vuelven los defaults del HTML.
- El tab de identidad visual describe una propuesta de paleta institucional que requiere aprobación de Dirección; no es personalización visual individual.

### Backend y permisos
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- getUserSettings/saveUserSettings (7649-7735 aprox.) leen/escriben la hoja PreferenciasNotificacion y solo categorías/inAppEnabled/canal/frecuencia/fecha/autor. El objeto getUserSettings incluye uiTheme: "light" como default, pero no recupera ni guarda ese valor. No hay persistencia de layout, idioma, formato de fecha o widgets en estas funciones.
- ROLE_PERMISSIONS (920-990) concede getUserSettings/saveUserSettings a Administrador, Desarrollador y Director; Profesor, Estudiante, Secretaría, Contador, Empleado, Coordinador y otros roles no tienen esos permisos, aunque la pestaña personal se muestra en el modal.
- validateRolePermission (1245-1315) exige token firmado. fetchApi no transmite sessionToken/authToken/token (AUD-NG-001), por lo que la llamada de UI no llega al handler en el contrato actual. Aun resolviendo el token, la matriz de permisos sigue restringiendo los roles ordinarios.

### Vistas personalizadas
- AUD-NG-202/TASK-429 ya documenta que saveView/loadSavedView guarda únicamente filtros en localStorage bajo saved_views_{containerId}, sin aislamiento por usuario/rol/ámbito y sin conservar orden, página, búsqueda ni operaciones de gestión de vistas. Esa brecha no se duplica; se referencia como dependencia de la parte de vistas.
- TASK-422 define PreferenciasUsuario, herencia de defaults institucionales, persistencia por cuenta y botón de restablecer. Sigue pendiente y es el contenedor correcto para el alcance de T-UX-25.

## Reconciliación
- **AUD-NG-216 (MEDIO/P2):** la interfaz anuncia preferencias personales y por rol que no están persistidas ni se restauran, y la autorización del endpoint personal no incluye a todos los roles. Se incorpora como ampliación de TASK-422; no se crea tarea paralela.
- **AUD-NG-001:** transporte del token en fetchApi.
- **AUD-NG-202/TASK-429:** vistas guardadas de tablas.
- **TASK-430:** sistema visual general.
- TASK-422 conserva la precedencia entre preferencias personales e institucionales; se añade evidencia de T-UX-25 y criterios específicos de los controles actualmente estáticos.

## Dictamen por criterio
- Preferencias personales persistentes: **FAIL/PARCIAL** (solo parte de notificaciones, además API sin token).
- Defaults institucionales heredados: **FAIL/NO ACREDITADO**.
- Restablecer a defaults: **FAIL** (no existe control/handler).
- Personalización de vistas/widgets: **FAIL/PARCIAL** (controles por rol no se guardan; vistas de tabla solo filtros locales y no aislados).
- Separación entre preferencias personales y configuración institucional: **PARCIAL** (la paleta global se separa, pero los controles por rol no tienen persistencia/contrato claro).
- Acceso de roles ordinarios a preferencias personales: **FAIL** por ROLE_PERMISSIONS y falta de token.

## Pruebas y límites
Ejecutado: inspección estática/manual de modal, carga/guardado, renderizador por rol, ROLE_PERMISSIONS, handlers backend y backlog.
No ejecutado: sesiones con roles reales, persistencia real en Google Sheets, nuevo inicio de sesión, cambio de dispositivo, restauración de defaults ni suites automatizadas.

## Cierre
T-UX-25: **NO CUMPLE**. Nuevo AUD-NG-216 agregado como ampliación de TASK-422; no se crea tarea separada. Código/tests y completadas.md sin modificaciones. Progreso 66/183; 117 pendientes. Siguiente: T-UX-26 - Incorporar una vista de actividad reciente contextual.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-422] Ampliación: persistencia y gobierno de preferencias personales y por rol
- **Tipo:** tarea existente ampliada; no crear tarea paralela.
- **Hallazgo/severidad:** AUD-NG-216, MEDIO/P2; preferencias personales/por rol no se guardan/restauran, backend parcial y permisos incompletos.
- **Objetivo:** preferencias persistentes separadas de defaults institucionales, con autorización y restablecimiento.
- **Acción:** ampliar esquema versionado por usuario; persistir opciones soportadas (idioma, formato, tema y widgets definidos); enlazar controles de rol a carga/guardado o retirarlos; implementar reset a defaults; corregir permisos; resolver token mediante AUD-NG-001.
- **Archivos:** js/ui-common.js, backend/user-service/Code.gs, ROLE_PERMISSIONS y ajustes de dashboards.
- **Dependencias:** AUD-NG-001 (token), AUD-NG-202/TASK-429 (vistas guardadas), TASK-430 (sistema visual).
- **Alcance:** preferencias personales, herencia institucional, controles por rol, persistencia y reset; no incluye vistas guardadas de tablas.
- **Criterios:** preferencias sobreviven nuevo inicio/cambio de dispositivo; personales prevalecen sin alterar defaults institucionales; reset restaura defaults; cada control visible persiste o se identifica como no configurable; matriz de roles segura; identidad deriva del token; pruebas de persistencia/herencia/reset/roles.
- **Prioridad:** P2. **Estado:** conservar el de TASK-422.
- **Evidencia:** pendiente; no se probaron sesiones reales ni persistencia en Sheets.

