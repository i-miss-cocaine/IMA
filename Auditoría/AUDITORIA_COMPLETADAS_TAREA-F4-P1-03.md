# Auditoría TAREA-F4-P1-03 - Matriz dinámica de permisos

**Checkpoint:** C1.78 | **Rama:** NG_beta_0.0.0.1_work | **Sesión:** IMA-AUDIT-20261106-1138Z (inicio C1.71, abierta)

## Dictamen
**NO CUMPLE.** La matriz guarda rol, módulo, acción, permiso y ámbito, pero los cinco servicios autorizan solo por rol+acción. No existe interfaz de administración en los archivos UI revisados.

## Evidencia
- USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: getDynamicPermissionsForRole 1863-1894; getPermissionMatrix 1902-1932; savePermissionMatrix 1934-1985; validateRolePermission 1253-1305.
- ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; TASK y EXAM revisados en la misma rama.
- Los cinco getDynamicPermissionsForRole construyen matrix[rol][accion] desde columnas 0,2,3; descartan modulo (col.1) y ambito (col.4).
- savePermissionMatrix persiste modulo/ambito pero identifica filas por rol+accion. No valida catálogos ni impone guardia interna de rol; una concesión dinámica de savePermissionMatrix a un perfil no administrativo le permitiría editar toda la matriz.
- ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, developer.js y 11 dashboards revisados: sin llamadas a getPermissionMatrix/savePermissionMatrix ni editor.
- AUD-NG-160 ya cubre cache TTL 600, fallback a ROLE_PERMISSIONS e invalidación incorrecta/interservicio. No duplicar. Nuevo AUD-NG-221/TASK-501 para dimensiones, editor y UI. TASK-139 (documentos), AUD-NG-094 (informes) y TAREA-F4-P1-04 (RBAC/ABAC general) mantienen sus límites.
- Fuente original AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md no encontrada; alcance reconstruido desde completadas.md y código.
- Pruebas: inspección estática/manual; no se leyó la hoja real ni se ejecutaron endpoints, pruebas de matriz o invalidación de caché.

## Continuidad
75/183 identificadores auditados; 108 pendientes. Siguiente: TAREA-F4-P1-04 - política unificada RBAC/ABAC. Sin modificar código, completadas.md, ChangesLogs.txt ni metodología.


## Tareas ejecutables derivadas de los hallazgos

> Normalización documental conforme a AUDITORIA_REGLA_REGISTRO_HALLAZGOS_TAREAS_C1.112.md. Se conserva el dictamen **NO CUMPLE**, la evidencia y los estados históricos de `completadas.md`. Las tareas siguientes no declaran implementada la matriz ni corregida la autorización.

### [AUD-NG-160] Restablecer vigencia e invalidación coherente de la caché de permisos dinámicos (ampliación, ALTO/P1)

- **Hallazgo de origen:** TAREA-F4-P1-03, sección «Evidencia» y «Reconciliación de hallazgos»; AUD-NG-160. Los cinco servicios cachean `dynamic_permissions_matrix` con TTL de 600 segundos; USER invalida su propia clave al guardar la matriz, mientras los otros cuatro servicios purgan claves distintas (`perm_matrix_<role>` / `dynamic_perms_<role>`) y no la clave efectivamente utilizada. Una modificación puede mantener decisiones de autorización obsoletas hasta el vencimiento de la caché.
- **Severidad:** Alto (P1).
- **Objetivo:** impedir que cambios, revocaciones o correcciones de permisos sigan autorizando con una matriz obsoleta en cualquiera de los cinco servicios.
- **Acción ejecutable:**
  1. Definir un contrato único de clave, versión y TTL para la matriz dinámica consumida por USER, ACADEMIC, ACCOUNTING, TASK y EXAM; evitar nombres divergentes entre lectura e invalidación.
  2. Hacer que toda escritura aprobada de la matriz incremente una versión o invalide de forma verificable la caché de los cinco servicios. La invalidación debe alcanzar la clave real `dynamic_permissions_matrix`, no alias que ningún lector consulta.
  3. Si la propagación inmediata no puede confirmarse, comprobar una versión autoritativa antes de autorizar o aplicar un fallback explícito de denegación para permisos cuya vigencia no pueda demostrarse. No mantener silenciosamente privilegios antiguos durante el TTL.
  4. Separar los fallos de caché de una ausencia legítima de permiso: no convertir indisponibilidad, error de lectura o dato malformado en autorización por fallback permisivo.
  5. Registrar versión anterior/nueva, servicio destino, resultado de invalidación y fallos sin incluir tokens ni datos personales innecesarios.
  6. Añadir pruebas de cambio y revocación de permisos con caché caliente/fría, cinco servicios, propagación fallida, expiración, reintento y concurrencia; demostrar que el permiso antiguo deja de autorizar dentro del SLA definido.
- **Archivos/módulos afectados:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`; mecanismo compartido de eventos/invalidación de seguridad si se utiliza.
- **Dependencias y riesgos:** AUD-NG-005 mantiene la propagación de estado/revocación; AUD-NG-160 conserva vigencia de rol, fallback y cachés; AUD-NG-221/TASK-501 define la matriz multidimensional. No duplicar la política contextual general de AUD-NG-222/TASK-502. Riesgo de escalada o persistencia de privilegios si se confía en cachés locales o en fallbacks permisivos.
- **Alcance:** ampliación de AUD-NG-160 limitada a la frescura, versionado, fallback e invalidación de la matriz dinámica entre servicios. No sustituye la revocación de sesiones ni implementa por sí sola las dimensiones de rol/módulo/acción/ámbito.
- **Criterios de aceptación:** (1) los cinco servicios leen la misma versión lógica de matriz; (2) una modificación o revocación invalida o hace obsoleta de forma comprobable la versión previa en todos los servicios; (3) ninguna ruta de purga apunta exclusivamente a claves que los lectores no utilizan; (4) ante fuente no disponible no se concede un permiso dinámico no verificable; (5) pruebas con caché caliente/fría demuestran la retirada del privilegio dentro del SLA acordado; (6) fallos y confirmaciones quedan trazados sin secretos.
- **Prioridad:** P1.
- **Estado:** Pendiente (ampliación derivada; no se verificó ejecución runtime).
- **Evidencia de cierre:** pendiente; adjuntar pruebas por servicio, evidencia de invalidación/versionado y commit de implementación al cerrar.

### [AUD-NG-221 / TASK-501] Aplicar la matriz dinámica por rol, módulo, acción y ámbito, con administración protegida (ALTO/P1)

- **Hallazgo de origen:** TAREA-F4-P1-03, dictamen y evidencia; registro existente AUD-NG-221/TASK-501 en `AUDITORIAS/Auditoria.txt` y dependencias en `AUDITORIAS/MapaDependencias.md`. La persistencia conserva módulo y ámbito, pero los cinco servicios construyen y aplican permisos únicamente por rol+acción; el upsert colisiona por rol+acción; `savePermissionMatrix` no impone una guardia administrativa interna; no se encontró editor ni llamadas de UI para administrar la matriz.
- **Severidad:** Alto (P1).
- **Objetivo:** hacer que cada decisión dinámica corresponda a la combinación exacta de rol, módulo, acción y ámbito, y permitir su administración únicamente a identidades autorizadas.
- **Acción ejecutable:**
  1. Definir y validar el esquema canónico de `MatrizPermisosRoles` (rol, módulo, acción, permiso y ámbito), con catálogos permitidos y reglas explícitas para valores globales; rechazar filas incompletas, desconocidas o ambiguas.
  2. Cambiar la identidad lógica de cada registro y el upsert para que distinga la combinación rol+módulo+acción+ámbito. Impedir que guardar un permiso para un módulo o ámbito sobrescriba otra combinación que comparte rol y acción.
  3. Actualizar `getDynamicPermissionsForRole` y los validadores consumidores en USER, ACADEMIC, ACCOUNTING, TASK y EXAM para evaluar todas las dimensiones. El módulo y el ámbito del recurso deben derivarse/validarse en el backend, no aceptarse como autoridad del cliente.
  4. Definir precedencia inequívoca entre permisos explícitos, denegaciones y reglas predeterminadas; aplicar denegación por defecto cuando no exista una coincidencia válida o el contexto requerido no pueda verificarse. Evitar que la matriz dinámica se convierta en bypass de la autorización contextual.
  5. Proteger `savePermissionMatrix` dentro del propio handler: derivar la identidad desde claims verificados, comprobar privilegio administrativo específico y rechazar llamadas directas no autorizadas aunque el router o la UI hayan omitido el control.
  6. Incorporar una interfaz de administración accesible solo a perfiles autorizados para consultar, crear, modificar y retirar combinaciones; mostrar rol, módulo, acción, permiso y ámbito, validar entradas y reflejar errores/confirmaciones del backend.
  7. Registrar cambios con actor verificado, valores anteriores/nuevos, fecha y resultado; no exponer información sensible ni permitir que el editor otorgue al operador privilegios que no está autorizado a delegar.
  8. Añadir pruebas de colisiones/upsert, aislamiento entre módulos y ámbitos, permisos concedidos/denegados, catálogo inválido, acceso directo a `savePermissionMatrix`, privilegios administrativos, cinco servicios, integración UI y cachés.
- **Archivos/módulos afectados:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`; `js/ui-common.js`, `developer.js` y dashboard autorizado que se determine tras revisar los puntos de entrada reales; hoja `MatrizPermisosRoles`.
- **Dependencias y riesgos:** AUD-NG-160 para versión, fallback e invalidación; AUD-NG-222/TASK-502 para política contextual RBAC/ABAC común; TASK-139 para permisos documentales; AUD-NG-094 para permisos de informes. Mantener separados los alcances de estos registros. Riesgo de escalada horizontal/vertical, colisión de permisos o autorización excesiva si se omite cualquiera de las dimensiones o se confía en datos del cliente.
- **Alcance:** implementación de la matriz multidimensional, persistencia sin colisiones, guardia administrativa del endpoint y editor UI. No sustituye el motor contextual general de P1-04 ni los controles específicos de documentos e informes.
- **Criterios de aceptación:** (1) dos filas que difieren en módulo o ámbito coexisten sin sobrescribirse; (2) cada servicio aplica rol+módulo+acción+ámbito a la operación y recurso reales; (3) no hay autorización por coincidencia parcial rol+acción cuando faltan dimensiones requeridas; (4) un usuario no administrador no puede modificar la matriz invocando directamente el endpoint; (5) la UI solo permite administrar a perfiles autorizados y valida todas las dimensiones; (6) denegaciones, errores de catálogo y contextos incompletos fallan de forma segura; (7) los cambios se auditan y se propagan conforme a AUD-NG-160; (8) pruebas automatizadas y de integración cubren los cinco servicios y el editor sin depender solo de presencia de símbolos.
- **Prioridad:** P1.
- **Estado:** Pendiente (el dictamen original permanece NO CUMPLE; no se ejecutó implementación ni runtime).
- **Evidencia de cierre:** pendiente; incorporar resultados de pruebas, evidencia de UI y endpoints protegidos, y commit de implementación al cerrar.

### Reconciliación de alcance

- AUD-NG-160 se amplía exclusivamente en frescura, fallback y propagación/invalidez de caché; no se crea un ID alternativo.
- AUD-NG-221/TASK-501 conserva el alcance de dimensiones de la matriz, guardia del editor y UI; no se crea un duplicado.
- AUD-NG-222/TASK-502 (TAREA-F4-P1-04) conserva la política contextual RBAC/ABAC general y fail-closed.
- TASK-139 conserva permisos documentales; AUD-NG-094 conserva permisos de informes.
- No se modifica el dictamen, la descripción ni el estado [X] histórico de `completadas.md`; la marca histórica no se interpreta como evidencia runtime de cumplimiento.
- No se modifica `Pendientes.md` ni se trasladan tareas a un registro externo.
