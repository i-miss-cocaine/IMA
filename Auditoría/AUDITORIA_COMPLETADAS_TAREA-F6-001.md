# AUDITORÍA TÉCNICA - TAREA-F6-001: restricciones por permisos efectivos de controles de expedientes duplicados

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.217  
**Checkpoint de cierre:** C1.218  
**Sesión:** IMA-AUDIT-20261107-1911Z  
**Dictamen:** **NO CUMPLE**  
**Estado en completadas.md:** [X] Completado (se conserva el registro histórico; esta auditoría no modifica ese estado).

## 1. Continuidad, fuentes y alcance

### 1.1 Estado Git
- HEAD de trabajo verificado: ae5dea9f7d342df58a5db393e66691d8249f892e; árbol 9bec0cf1fe89fa172d2a9ee914066e0fdca67db9.
- Commit de partida: audit(C1.217): close F5-020 admission performance review; padre a858781cb4e2ee2e32e7e2d294a9c49473b68f28.
- HEAD de rama base NG_beta_0.0.0.1: 44d9891132332e692dbe2ba8602b41f50a508a59.
- Comparación: trabajo 285 commits adelante, 0 detrás; merge-base igual al HEAD base.
- C1.217 coincide con el HEAD real al iniciar.

### 1.2 Registros
- completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2474-2504: TAREA-F6-001 marcada [X]; se contrastaron sus ocho requisitos y CA-001..CA-007.
- Pendientes.md, SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: recuperado desde el blob Git de la propia rama. Tamaño del objeto: 1.803.672 bytes; contenido: 1.782.094 caracteres y 20.182 líneas; sin U+FFFD. No se encontró una entrada literal TAREA-F6-001 ni referencias literales a findDuplicateStudents/mergeStudentFiles. Se consultó por instrucción expresa de esta iteración, que prevalece sobre la exclusión general del archivo en la metodología; no se modificó.
- ChangesLogs.txt, SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff: sin entrada identificable de TAREA-F6-001.
- La tarea cita AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md como origen, pero la ruta no está en el árbol ni en el historial consultado.
- AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-001.md no existía en el árbol ni en el historial; este informe crea el registro individual faltante.
- Se corrige la continuidad: F5-020 es el último elemento de esa serie; la siguiente tarea existente es F6-001 y después de esta auditoría sigue TAREA-F6-002.

### 1.3 Archivos y funciones inspeccionados
- teacher-dashboard.html, SHA cbb9e6a272a7d8ad33f99727303305d950533e71, líneas 1464-1466.
- js/teacher.js, SHA c475fce5afcd28fca23e7b64398ad32b17773746, líneas 135-145, 7877-7944, 7999-8020 y 8293-8350.
- js/auth.js, SHA 8444dd085a3186106d2db7005b61ef934d3c22d8, líneas 146-157.
- js/api.js, SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, líneas 39-58 y 107-135.
- js/ui-common.js, SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 5030 y 5273-5295.
- backend/academic-service/Code.gs, SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5, líneas 168-243, 524-620, 671-681, 866-867, 10107-10208 y 10282-10330.
- backend/user-service/Code.gs, loginUser líneas 2510-2534.
- tests/regression/academic-grading-suite.js, SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
- tests/regression/modular-dashboard-suite.js, SHA 0495e1d526a872c33310935a003a83d924d34683.

## 2. Evidencia técnica

### 2.1 El modal/tab no está definido en el HTML docente inspeccionado
teacher-dashboard.html carga js/ui-common.js y js/teacher.js (1464-1466), pero no contiene #modal-student-file ni #tab-stfile-duplicates. openStudentFileModal obtiene #modal-student-file y retorna inmediatamente si no existe (js/teacher.js:7877-7880), antes de alcanzar renderStudentFileModalData y el gate F6-001 (7922-7935). js/ui-common.js solo tiene referencias auxiliares al ID; no construye el modal ni la pestaña. No se encontró una inclusión de fragmento que aporte ese marcado en teacher-dashboard.html. La existencia efectiva del control declarado por la tarea no queda demostrada en el árbol.

### 2.2 La lista frontend diverge de los permisos por acción
RoleCapabilities.canManageDuplicates es una lista estática que incluye Administrador, Director, Secretaría/Secretaria, Subdirector, Coordinador y Desarrollador (js/teacher.js:135-139). La misma capacidad unificada habilita detección y fusión.

La matriz estática ROLE_PERMISSIONS (Code.gs:168-243) indica:
- Administrador: comodín *.
- Director: findDuplicateStudents y mergeStudentFiles.
- Subdirector: findDuplicateStudents, sin mergeStudentFiles.
- Secretaria: findDuplicateStudents, sin mergeStudentFiles.
- Coordinador y Desarrollador: ninguna de las dos acciones en la matriz estática.
- Profesor: ninguna de las dos acciones en la matriz estática.

La UI no separa detección de fusión. Además acepta Secretaría con tilde, mientras que la clave estática es Secretaria sin tilde. La matriz dinámica puede cambiar el permiso estático: validateRolePermission consulta getDynamicPermissionsForRole antes del fallback ROLE_PERMISSIONS (Code.gs:524-620). No se dispuso de la hoja productiva MatrizPermisosRoles ni de delegaciones activas; no se afirma cuál es el permiso efectivo de cada cuenta en producción. La UI tampoco consulta esa fuente dinámica.

### 2.3 No se revalidan individualmente pestaña y acciones secundarias
renderStudentFileModalData oculta/muestra el botón y oculta el contenedor para usuarios no autorizados (js/teacher.js:7922-7935). switchStudentFileTab cambia la visibilidad de cualquier pestaña sin comprobar permisos (7999-8020). El listener de btn-scan-duplicates y los botones .btn-merge-student se registran/generan sin comprobación de RoleCapabilities dentro de cada handler (8295-8350). La barrera frontend depende de la clase hidden; el servidor sigue siendo la barrera final.

### 2.4 El token firmado no llega al servicio ACADEMIC
backend/user-service/Code.gs loginUser genera sessionToken y lo devuelve en el nivel superior y en data.sessionToken (2510-2534). js/auth.js construye userData sin copiar result.sessionToken ni result.data.sessionToken (146-157). js/api.js añade requesterUserId/requesterRole, pero no sessionToken/authToken/token al payload ni a una cabecera (39-58).

ACADEMIC validateRolePermission exige uno de esos tokens y rechaza si no se recibe (Code.gs:529-543). doPost valida antes del despacho y devuelve AUTH_PERMISSION_DENIED cuando falla (671-681). Por tanto, las llamadas protegidas de getStudentFile/findDuplicateStudents/mergeStudentFiles no reciben una credencial firmada por este flujo. Se revalida AUD-NG-001, ya documentado en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F4-P0-01.md; no se crea ID global duplicado.

### 2.5 Los contratos de detección/fusión no coinciden
- UI envía studentId, nombre e identificacion y espera res.data como arreglo (js/teacher.js:8304-8311). findDuplicateStudents recibe nombres, apellidos, identificacion, fechaNacimiento, email, telefono y solicitudId (Code.gs:10107-10119), y devuelve {status, duplicatesCount, candidates} (10207), no data como arreglo. fetchApi devuelve el JSON parseado sin transformar esa estructura (js/api.js:107-135).
- El backend expone id, coincidencia y nivelCoincidencia (Code.gs:10149-10159 y 10192-10203); la UI espera studentId/userId y motivoCoincidencia (js/teacher.js:8317-8325).
- La UI envía targetStudentId/sourceStudentId a mergeStudentFiles (js/teacher.js:8336-8339), pero el backend exige targetExpedienteId/sourceExpedienteId (Code.gs:10282-10293).

Estos defectos impiden acreditar CA-002. La detección y fusión existentes están marcadas como TAREA-F5-017 y TAREA-F6-019; la corrección debe coordinarse con esos elementos, sin duplicar su lógica.

### 2.6 Sesión y pruebas
currentUser se lee una sola vez al iniciar DOMContentLoaded (js/teacher.js:141-145). No se encontró listener storage/sessionchange ni revalidación del usuario antes de cada acción. Las suites inspeccionadas no contienen TAREA-F6-001, canManageDuplicates, findDuplicateStudents ni mergeStudentFiles.

## 3. Matriz de requisitos y criterios

| Requisito/criterio | Resultado | Evidencia |
|---|---|---|
| R1 / CA-001: Profesor no ve controles | Parcial | Profesor no está en la lista estática; DOM/modal no localizado y matriz dinámica real no consultada. |
| R2: identificar permiso efectivo antes de mostrar | No cumple | Allowlist local; no consulta matriz dinámica ni delegaciones. |
| R3 / CA-002: autorizados ven y usan controles | No cumple | Roles divergen; detección/fusión no separadas; token no propagado; contratos incompatibles; modal no localizado. |
| R4: reutilizar matriz sin divergencia | No cumple | RoleCapabilities no coincide con ROLE_PERMISSIONS por acción ni consulta matriz dinámica. |
| R5: proteger pestaña, diálogos y acciones secundarias | Parcial | Se oculta botón/contenedor, pero tab switch y handlers no revalidan. |
| R6 / CA-003: autorización servidor | Parcial | doPost valida; cliente no transmite token y matriz/delegaciones productivas no verificadas. |
| R7 / CA-005: no afectar otras funciones | Cumple en inspección estática | El bloque solo toca tab/contenido; no modifica búsqueda, datos personales, documentos o historial. Sin prueba funcional. |
| R8 / CA-004: actualizar sesión/usuario y fallar cerrado | No cumple | currentUser se captura una vez; no hay listener ni revalidación. |
| CA-006: escritorio y móvil | No verificable | No se encontró marcado del modal/tab y no se ejecutó navegador. |
| CA-007: pruebas de regresión | No cumple | Suites inspeccionadas sin casos F6-001. |

## 4. Hallazgos técnicos

### H1 - ALTO/P1: modal que contiene la pestaña no está presente en el HTML docente auditado
teacher-dashboard.html no declara #modal-student-file ni #tab-stfile-duplicates. openStudentFileModal retorna si falta el modal, antes de ejecutar el gate F6-001.

### H2 - ALTO/P1: RoleCapabilities diverge de permisos efectivos y no separa detección/fusión
La allowlist concede una capacidad unificada a roles con permisos distintos en ROLE_PERMISSIONS. La UI no consulta matriz dinámica ni delegaciones.

### H3 - CRÍTICO/P0: el flujo de sesión no entrega token firmado a ACADEMIC
loginUser emite token, pero auth.js lo descarta y api.js no lo transmite. validateRolePermission rechaza solicitudes sin token. Se amplía AUD-NG-001.

### H4 - ALTO/P1: contratos de detección y fusión incompatibles
La UI espera data/studentId/motivoCoincidencia y envía targetStudentId/sourceStudentId; backend retorna candidates/id/coincidencia y exige targetExpedienteId/sourceExpedienteId.

### H5 - MEDIO/P2: autorización frontend no se revalida ante cambio de sesión ni en cada acción
currentUser queda capturado; tab switch y handlers secundarios no vuelven a comprobar permisos.

### H6 - MEDIO/P2: no hay regresión específica de F6-001
Las suites revisadas no cubren visibilidad por rol, permisos separados, llamadas directas, cambio de sesión, contratos ni escritorio/móvil.

## 5. Dictamen

**NO CUMPLE.** Existe exclusión estática del rol Profesor en RoleCapabilities y ROLE_PERMISSIONS, y el dispatcher conserva autorización servidor. Sin embargo, la UI usa una lista local divergente, no refleja permisos efectivos por acción, no actualiza sesión, no protege cada acción secundaria, no se localizó el modal/tab en el HTML docente y los contratos de detección/fusión no coinciden. El token emitido por USER tampoco se conserva ni transmite desde este cliente, problema ya registrado por AUD-NG-001.

La marca [X] de completadas.md se conserva como dato histórico; esta auditoría no acredita que los criterios estén satisfechos. No se modificó el registro maestro ni se volvió a marcar la tarea como completada.

## 6. Pruebas ejecutadas y limitaciones

**Ejecutadas:** inspección manual de requisitos, roles, validador/dispatcher, emisión y transmisión de token, gate visual, tab switch, handlers, contratos, HTML, suites, árbol Git, historial de rutas y SHAs.

**No ejecutadas:** runtime Apps Script, HTTP real, lectura de MatrizPermisosRoles/delegaciones productivas, navegador, pruebas por rol, cambios de sesión, escritorio/móvil y suites automatizadas. No se modificaron ni consultaron datos productivos.

## 7. Tareas ejecutables derivadas de los hallazgos

Las tareas siguientes son locales a TAREA-F6-001. Se amplían tareas globales existentes cuando corresponde; no se crean IDs globales duplicados.

### F6-001-A01 - Sincronizar controles con permisos efectivos por acción
- **Hallazgos de origen:** H2.
- **Severidad:** Alto.
- **Objetivo:** que cada control visible corresponda al permiso efectivo de la acción.
- **Acción ejecutable:** derivar capacidades de la matriz vigente y delegaciones; separar findDuplicateStudents de mergeStudentFiles; normalizar el rol.
- **Archivos/módulos afectados:** js/teacher.js; backend/academic-service/Code.gs; mecanismo de permisos.
- **Dependencias y riesgos:** AUD-NG-221/TASK-501, ROLE_PERMISSIONS, MatrizPermisosRoles y delegaciones. No conceder permisos por nombre de puesto.
- **Alcance:** visibilidad/habilitación de detección y fusión; no ampliar permisos backend.
- **Criterios de aceptación:** UI y backend coinciden por rol/acción; Secretaría/Subdirección ven solo lo permitido; Coordinación/Desarrollo no ven acciones sin permiso; Profesor no ve ni ejecuta acciones salvo permiso explícito válido; fallo de consulta deniega visualmente.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-001-A02 - Revalidar usuario y permisos ante cambios de sesión
- **Hallazgos de origen:** H5.
- **Severidad:** Medio.
- **Objetivo:** impedir que una sesión anterior conserve controles administrativos.
- **Acción ejecutable:** centralizar estado autenticado; escuchar cambios reales de sesión/almacenamiento; invalidar vista/handlers al cerrar sesión; consultar permisos al mostrar y ejecutar; fallar cerrado ante rol/token ausente.
- **Archivos/módulos afectados:** js/auth.js; js/api.js; js/teacher.js; js/ui-common.js.
- **Dependencias y riesgos:** AUD-NG-001 y AUD-NG-160. requesterRole no sustituye token firmado.
- **Alcance:** estado de sesión del panel docente y controles de duplicados.
- **Criterios de aceptación:** cambio de usuario elimina controles previos sin recarga; cierre los elimina inmediatamente; token ausente/expirado no muestra controles; sesión nueva recalcula permisos.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-001-A03 - Aplicar autorización frontend a pestaña, detección y fusión
- **Hallazgos de origen:** H5.
- **Severidad:** Alto.
- **Objetivo:** impedir que un control secundario inicie una acción sin permiso vigente.
- **Acción ejecutable:** proteger switchStudentFileTab, btn-scan-duplicates y cada .btn-merge-student; deshabilitar/retirar acciones no permitidas; revalidar antes de fetchApi y limpiar resultados al cambiar usuario.
- **Archivos/módulos afectados:** js/teacher.js.
- **Dependencias y riesgos:** F6-001-A01; validateRolePermission y findDuplicateStudents/mergeStudentFiles. Frontend complementa, no sustituye, backend.
- **Alcance:** controles de duplicados; no bloquear búsqueda, edición personal, documentos o historial.
- **Criterios de aceptación:** usuario sin permiso no activa pestaña/escaneo/fusión; llamadas directas también son rechazadas; usuario autorizado conserva solo acciones permitidas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-001-A04 - Restaurar o conectar el marcado real del modal y la pestaña
- **Hallazgos de origen:** H1.
- **Severidad:** Alto.
- **Objetivo:** asegurar que el panel docente contenga el modal y los elementos usados por el controlador.
- **Acción ejecutable:** localizar el fragmento autorizado o incorporar el marcado faltante en teacher-dashboard.html; verificar IDs, botones y contenedores antes de enlazar handlers; eliminar el retorno silencioso por ausencia del modal.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js; js/ui-common.js si se mantiene generador compartido.
- **Dependencias y riesgos:** getStudentFile, formularios personales, documentos, tutores e historial. No duplicar IDs ni alterar pestañas autorizadas.
- **Alcance:** DOM del expediente/tab de duplicados; no rediseñar todo el dashboard.
- **Criterios de aceptación:** modal único y abrible; IDs consultados existen; tab se muestra según F6-001-A01; otras pestañas siguen funcionales.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-001-A05 - Alinear contratos de detección y fusión UI/backend
- **Hallazgos de origen:** H4.
- **Severidad:** Alto.
- **Objetivo:** que usuarios autorizados reciban candidatos y ejecuten fusión con IDs válidos.
- **Acción ejecutable:** unificar entrada/salida de findDuplicateStudents; consumir colección y campos reales; enviar targetExpedienteId/sourceExpedienteId con IDs de expediente; validar respuesta antes de renderizar botones.
- **Archivos/módulos afectados:** js/teacher.js; js/api.js si el contrato común lo requiere; backend/academic-service/Code.gs.
- **Dependencias y riesgos:** TAREA-F5-017, TAREA-F6-019, getStudentFile y ExpedientesEstudiantes. No duplicar sus lógicas internas.
- **Alcance:** contrato UI/API; no ampliar política de permisos.
- **Criterios de aceptación:** UI consume la colección devuelta; candidato contiene ID de expediente y criterio válidos; fusión envía ambos IDs exigidos; errores no se presentan como éxito; pruebas con fixtures reproducibles.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F6-001-A06 - Añadir regresión de autorización y experiencia de duplicados
- **Hallazgos de origen:** H1-H6.
- **Severidad:** Medio.
- **Objetivo:** evitar regresiones de visibilidad, autorización, sesión y contratos.
- **Acción ejecutable:** probar Profesor, Secretaria, Subdirector, Coordinador, Desarrollador, Director y Administrador; detección/fusión por separado; token ausente/expirado; matriz dinámica/delegación; cambio de sesión; llamada directa; contratos; modal y vista móvil/escritorio.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js o suite específica F6-001; js/teacher.js; backend/academic-service/Code.gs.
- **Dependencias y riesgos:** F6-001-A01..A05; AUD-NG-001; AUD-NG-160; AUD-NG-221/TASK-501. No usar solo aserciones textuales.
- **Alcance:** regresión de controles y contratos de duplicados.
- **Criterios de aceptación:** pruebas conductuales demuestran visibilidad por acción, denegación backend, invalidación de sesión, uso autorizado y ausencia de regresiones en otras pestañas.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### Reconciliación con tareas globales existentes
- **AUD-NG-001:** ampliada con evidencia de que getStudentFile/findDuplicateStudents/mergeStudentFiles tampoco reciben token desde este panel.
- **AUD-NG-160:** ampliada con actualización del estado de permisos del cliente al cambiar usuario/sesión.
- **AUD-NG-221 / TASK-501:** ampliada con sincronización de RoleCapabilities con permisos dinámicos por acción.
- **TAREA-F5-017 y TAREA-F6-019:** dependencias de detección y fusión; F6-001-A05 cubre integración de contrato, no duplica la lógica interna.

## 8. Cierre
- Dictamen: NO CUMPLE.
- Código fuente y tests: sin modificaciones.
- completadas.md: sin modificación; se conserva [X] histórico y se documenta el incumplimiento.
- Pendientes.md: consultado desde blob íntegro por instrucción expresa; sin modificación.
- ChangesLogs.txt: sin modificación porque no hubo cambio funcional.
- Rama base: sin modificaciones.
- Siguiente tarea: TAREA-F6-002, marcada [X] en completadas.md.

## 9. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2474-2504 (F6-001), 2505-2538 (F6-002).
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746.
- js/auth.js SHA 8444dd085a3186106d2db7005b61ef934d3c22d8.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- tests academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683.
- AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F4-P0-01.md (AUD-NG-001); AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F4-P1-03.md (AUD-NG-221/TASK-501); AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F4-P0-03.md (AUD-NG-160).
