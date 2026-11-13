# Auditoría técnica - TAREA-F5-009: vinculación familiar y permisos granulares por tutor

**Checkpoint:** C1.203  
**Sesión operativa:** IMA-AUDIT-20261107-0325Z (ID operativo, no ID nativo de ChatGPT)  
**Inicio:** C1.202 | **Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work | **HEAD:** 24edc263bcc271942f0b4c0bb4dbfb94c7ec9b03  
**Árbol:** c90737a3fe668cdd7369e7245679cc5a42f86c38 (971 entradas; truncated=false)  
**Rama base protegida:** NG_beta_0.0.0.1, SHA 44d9891132332e692dbe2ba8602b41f50a508a59 (sin cambios)  
**Dictamen:** **NO CUMPLE**

## 1. Búsqueda documental y fuentes

Se buscaron en árbol e historial las rutas AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-009.md, AUDITORIAS/AUDITORIA_TAREA-F5-009.md, AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md y AUDITORIAS/AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md. Ninguna existe en el árbol y las consultas de historial devolvieron listas vacías. Esta auditoría se realiza desde cero.

**Requisitos:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2090-2128. La tarea está [X] Completada, con 15 puntos y 10 criterios [x]. Se verificaron todos contra el código.

**Historial:** ChangesLogs.txt SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9, líneas 1834-1841, declara TOK-UUID de siete días, correo, duplicados, revocación, permisos y UI. Es registro histórico, no prueba funcional.

**Origen citado:** HALLAZGOS-F5-P0-02 y AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md, Subcapacidad 5.7/Brecha P0-02. HALLAZGOS-F5-P0-02 no aparece en Auditoria.txt actual (SHA a3fd7367b6159175c4a6db1277ac68d13ac0958a) y el informe de fase no existe en árbol/historial. No se reconstruye por conjetura.

**Pendientes.md:** fetch por ruta devuelve contenido vacío; el blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c se recuperó por fetch_blob (1.782.094 caracteres, 20.182 líneas). No contiene F5-009 directo ni HALLAZGOS-F5-P0-02. Sí contiene dependencias relacionadas AUD-NG-036, AUD-NG-105, AUD-NG-123, AUD-NG-136, AUD-NG-001, AUD-NG-145, AUD-NG-161, AUD-NG-234/TASK-514, AUD-NG-232/TASK-512 y AUD-NG-233/TASK-513. Se amplían sin duplicar identificadores globales.

## 2. Evidencia inspeccionada

| Archivo | SHA | Rangos |
|---|---|---|
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | esquema 874-883; roles 922-982; getUserVerifiedRole 1146-1161; validateContextualAccess 1213-1248; dispatch 1423-1428; invitaciones 3334-3440; revocación/permisos 3442-3477; getGuardianStudents 3480-3578; getGuardianApplicants 3582-3625 |
| backend/academic-service/Code.gs | daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc | roles 227-240; validateContextualAccess 465-521; dispatch 723; conversión 2156-2316; getStudentFile 2510-2580; asistencia 9638-9680; timeline 9843-9850; documentos 10708-10730; relaciones legacy 10432-10565; validador aislado 13114-13253 |
| js/secretary.js | 08a81266957b4c18cc25f8ba6749eac30a8f2c2c | carga vínculo 184-185; UI 1043-1070 y 1164-1185 |
| dashboard-secretaria.html | fa0d8c23aace24a6acab2d4956398a7f5e1309b8 | contenedor modal de tutores |
| js/student.js | e2888cea60322e49a40b89adadb8010489605dcc | búsqueda de aceptación/invitación, sin coincidencias |
| student-dashboard.html | 6379ea0ed39d71b89747a0280bb925fdf12202c1 | sin flujo visible de aceptación |
| login.html | 3b2e1e8d12a90552ac7b7d584294463a3e8e8f15 | sin flujo visible de aceptación |
| js/api.js / js/auth.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 / 8444dd085a3186106d2db7005b61ef934d3c22d8 | transporte y conservación de token; AUD-NG-001 |
| tests/regression/academic-grading-suite.js | 3433b707edd4a2f35c68368a3172932adc2a3b32 | sin pruebas específicas de familia |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | sin pruebas específicas de familia |

## 3. Hallazgos

### H1 - CRÍTICO/P0: IDOR en endpoints académicos concedidos a roles familiares
Padre/Tutor/Responsable tienen permiso para getStudentFile, getStudentTimeline, getStudentDocuments y getStudentAttendanceSummary (ROLE_PERMISSIONS 227-240). ACADEMIC validateContextualAccess (465-521) no comprueba relación familiar. getStudentFile (2510-2580) busca por expedienteId/userId/código del payload y devuelve expediente, matrículas, tutores, documentos y movimientos sin validar vínculo. getStudentDocuments (10708-10730) acepta expedienteId/solicitudId y, sin filtros, no restringe el conjunto. getStudentAttendanceSummary (9638-9680) acepta cualquier userId. getStudentTimeline delega en getStudentFile. validateAcademicResponsibilityAndScopeAccess existe como acción independiente (dispatch 723), pero no se integra en esos endpoints y consulta tablas legacy, no RelacionesFamiliares. **Impacto:** consulta potencial de expedientes/documentos/asistencia ajenos al alterar IDs. Ampliar AUD-NG-105, AUD-NG-123 y AUD-NG-136.

### H2 - CRÍTICO/P0: rutas alternativas activan vínculos sin aceptación
convertAdmissionToStudent (2156-2316) busca una cuenta por coincidencia del email declarado y, si existe, inserta una relación Verificada sin token aceptado ni autorización explícita de esa cuenta. saveStudentGuardian (10468-10549) escribe en RelacionesEstudianteTutor y por defecto deja accesoPortal=true. Ambas eluden invitación/aceptación. Ampliar AUD-NG-232/TASK-512 y AUD-NG-233/TASK-513.

### H3 - CRÍTICO/P0: el correo del aceptante es opcional y cliente-controlado
acceptLinkInvitation (3374-3440) compara userEmail solo si llega en payload; no obtiene el correo desde la cuenta asociada a _verifiedUserId ni lo compara con claims firmados. Omitir userEmail omite el control; falsificarlo con el correo invitado lo satisface. ROLE_PERMISSIONS habilita también acceptLinkInvitation para Estudiante y Alumno. Ampliar AUD-NG-001 y AUD-NG-232/TASK-512.

### H4 - ALTO/P1: invitación por solicitud sola puede crear relación sin expediente
createLinkInvitation acepta solicitudId sin expedienteId y guarda solicitudId en row[8]. La UI envía expedienteId || "" antes de la conversión. acceptLinkInvitation usa solo row[1] como targetExpedienteId e ignora row[8]; tampoco valida correspondencia solicitud/expediente/emailContacto. Coordinar F5-012 y AUD-NG-232/TASK-512.

### H5 - ALTO/P1: consumo de token/deduplicación no atómicos
acceptLinkInvitation lee Activa, busca duplicado y marca Utilizada antes de appendRow. No hay LockService ni reserva atómica. Dos ejecuciones pueden pasar la lectura y crear dos relaciones; un fallo tras marcar Utilizada consume el token sin completar el vínculo. createLinkInvitation no evita invitaciones activas duplicadas. Ampliar AUD-NG-234/TASK-514 y AUD-NG-161.

### H6 - ALTO/P1: no existe revocación de invitaciones pendientes
revokeFamilyLink solo revoca una relación creada. No hay acción para cambiar una invitación Activa a Revocada; un token emitido por error permanece utilizable hasta expirar. Coordinar AUD-NG-232/TASK-512 y AUD-NG-145.

### H7 - CRÍTICO/P0: permisos granulares no están activos ni cubren los dominios requeridos
En USER Code.gs solo aparece la referencia GRANULAR_FAMILY_PERMISSIONS_ENABLED en 1236-1237; no existe declaración en el servicio. El guard solo se activa si vale exactamente true. Incluso activado, verifica solo permisoFinanciero para acciones Payment/Finance/Account. No aplica permisoAcademico, permisoDocumental ni permisoAsistencia, ni separación general lectura/escritura/transacción o controles específicos de notas, excusas y salidas. Ampliar AUD-NG-105/123/136.

### H8 - ALTO/P1: administración de permisos/revocación incompleta en RBAC y UI
updateFamilyLinkPermissions (3463-3477) escribe JSON sin validar claves/tipos/actor y no registra evento. No aparece en RBAC estático de Director/Subdirector/Secretaría (941-960); revokeFamilyLink tampoco está concedida allí. La UI muestra tutores y emite tokens, pero no administra permisos ni revocaciones. Ampliar AUD-NG-036/145/161.

### H9 - ALTO/P1: esquema de hojas y fuentes de relación divergentes
USER define RelacionesFamiliares con ocho encabezados (874), pero acceptLinkInvitation escribe nueve columnas. InvitacionesVinculacion se define con ocho encabezados (883), mientras createLinkInvitation escribe diez; conversión escribe ocho y no incluye solicitudId/permisos. Coexisten RelacionesFamiliares, RelacionesEstudianteTutor y referencias legacy RelacionesTutores/TutoresEstudiantes. getGuardianStudents solo consulta legacy si no obtuvo ninguna relación en la tabla principal; no fusiona fuentes ni comprueba accesoPortal en fallback. Ampliar AUD-NG-105/136/232.

### H10 - ALTO/P1: validateContextualAccess USER llama al verificador familiar sin sessionToken
validateContextualAccess (1213-1248) llama getGuardianStudents con _verifiedUserId/_verifiedRole, pero omite sessionToken. getGuardianStudents exige token mediante getUserVerifiedRole (1146-1161), por lo que la llamada anidada falla y deniega relaciones válidas cuando hay targetStudentId distinto del usuario. Si falta targetStudentId, no se comprueba relación. Ampliar AUD-NG-001/036.

### H11 - ALTO/P1: getGuardianApplicants no exige vínculo verificado
getGuardianApplicants (3582-3625) filtra por emailContacto coincidente o substring del UID en nombreResponsable; no exige relación activa en RelacionesFamiliares ni invitación aceptada. Coordinar F5-012 y ampliar AUD-NG-036.

### H12 - ALTO/P1: no se encontró interfaz familiar de aceptación ni entrega completa
La UI de Secretaría muestra el token mediante alert (secretary.js 1164-1185). No se encontró invocación/formulario de aceptación en student.js, student-dashboard.html o login.html. La conversión que crea invitación para tutor sin cuenta solo escribe la fila; no envía notificación ni entrega token en esa ruta. Coordinar F5-011/F5-012.

### H13 - ALTO/P1: bitácora incompleta
createLinkInvitation, acceptLinkInvitation y revokeFamilyLink generan eventos; updateFamilyLinkPermissions no registra actor ni estado anterior/nuevo. La expiración cambia estado sin evento y conversión/ruta legacy no registra específicamente el cambio y su autorización. Ampliar AUD-NG-145.

### H14 - ALTO/P1: suites sin pruebas conductuales familiares
academic-grading-suite.js y modular-dashboard-suite.js no contienen casos de invitación, aceptación, revocación, permisos, vínculo cruzado, expiración, token reusado, concurrencia o IDOR familiar. Ampliar AUD-NG-161.

## 4. Matriz de los 15 puntos de alcance

| # | Requisito | Resultado |
|---:|---|---|
| 1 | Toda vinculación exige invitación o autorización verificada | NO |
| 2 | Separar responsable declarado, relación verificada y cuenta activa | PARCIAL |
| 3 | Token TOK-UUID de un uso, siete días y revocación remota | PARCIAL |
| 4 | Vincular invitación a solicitud/expediente/email específico | NO |
| 5 | Aceptante coincide con email invitado o autorización | NO |
| 6 | Neutralizar vínculos duplicados | PARCIAL |
| 7 | Modelo N:M limpio | PARCIAL |
| 8 | Permisos individuales académico/financiero/documental/asistencia | NO |
| 9 | Personalizar notas, pagos, excusas y salidas | NO |
| 10 | Separar lectura de escritura/transacción | NO |
| 11 | Validar parentesco/vínculo en servidor | NO |
| 12 | Revocación inmediata en siguientes peticiones | PARCIAL |
| 13 | Bitácora completa de cambios | PARCIAL |
| 14 | No crear cuentas solo desde texto del formulario | PARCIAL |
| 15 | Conversión transfiere tutor a invitación sin pérdida | PARCIAL |

## 5. Criterios de aceptación

1. Personal no concede acceso sin verificación: NO (H2).
2. Tokens expirados, revocados o usados se rechazan: PARCIAL (expirado/usado sí; revocación pendiente no; consumo no atómico).
3. Token no vincula estudiante distinto: NO (H3-H4).
4. Duplicados neutralizados: PARCIAL (búsqueda secuencial, sin lock).
5. Dos tutores pueden tener permisos distintos: NO (JSON sin enforcement).
6. Revocación bloquea acceso inmediato: PARCIAL (no transversal a ACADEMIC/legacy).
7. Alterar ID se rechaza: NO (H1/H10).
8. Conversión transfiere tutor a invitación sin pérdida: NO (H2/H4/H12).
9. Historial completo por cambio: NO (H13).
10. Autorización server-side en cada endpoint familiar: NO (H1/H7/H10/H11).

## 6. Tareas derivadas

Subtareas locales a F5-009; no crear IDs globales duplicados:

- **F5-009-A01 - Modelo único de relación verificada:** unificar tablas; separar responsable declarado, invitación, cuenta y vínculo activo; eliminar activación sin consentimiento. Ampliar AUD-NG-105, AUD-NG-232/TASK-512 y AUD-NG-233/TASK-513.
- **F5-009-A02 - Invitación segura e idempotente:** correo desde identidad firmada; validar solicitud/expediente/email; corregir invitación con solicitud sola; lock/consumo atómico, deduplicación y revocación pendiente. Ampliar AUD-NG-001/036/234/TASK-514/161.
- **F5-009-A03 - Autorización contextual transversal:** comprobar relación activa y alcance por recurso en cada endpoint USER/ACADEMIC; impedir consultas globales e IDs arbitrarios. Ampliar AUD-NG-036/105/123/136 y coordinar F5-012.
- **F5-009-A04 - Motor de permisos granulares:** configuración fail-closed; permisos académico/financiero/documental/asistencia; lectura/escritura y capacidades concretas. Ampliar AUD-NG-105/123/136.
- **F5-009-A05 - Administración de vínculos/permisos:** RBAC explícito, UI de permisos/revocación, validación y motivo. Ampliar AUD-NG-036/145/161.
- **F5-009-A06 - Experiencia familiar:** formulario autenticado de aceptación y entrega por canal configurado. Coordinar F5-011/F5-012.
- **F5-009-A07 - Trazabilidad append-only:** actor, entidad, cambios, motivo, expiración, revocación y correlación. Ampliar AUD-NG-145.
- **F5-009-A08 - Pruebas conductuales:** dos familias/tutores, IDs alterados, email omitido/falsificado, tokens expirados/revocados/reusados, concurrencia, fallos parciales y permisos por dominio. Ampliar AUD-NG-161.

## 7. Pruebas y limitaciones

**Ejecutado:** inspección estática/manual, búsqueda de callsites, RBAC, esquemas, conversión, UI, suites, árbol/historial, completadas.md, ChangesLogs.txt, Pendientes.md por blob y metodología.

**No ejecutado:** Apps Script runtime, HTTP, Sheets/Drive productivo, cuentas familiares reales, navegador, correo/push, concurrencia real, fallos inyectados, despliegue ni suites automatizadas. No se afirma reproducción dinámica.

**Código y pruebas no modificados:** esta iteración pertenece a Auditoría/documentación; las correcciones corresponden a una fase posterior.

## 8. Dictamen

**TAREA-F5-009: NO CUMPLE.** Hay componentes parciales (token UUID de siete días, endpoint de aceptación, búsqueda secuencial de duplicados y algunos eventos), pero no se acredita consentimiento verificable, aislamiento por relación, autorización por recurso, permisos granulares efectivos, revocación transversal ni trazabilidad completa.
