# AUDITORÍA TÉCNICA - TAREA-F6-037: Seguridad, aislamiento y gestión centralizada de permisos (alcance ampliado)

- **Sesión:** IMA-AUDIT-20261107-2055Z-01 | **Checkpoint inicial:** C1.228 | **Rama:** NG_beta_0.0.0.1_work
- **HEAD de partida:** 813feb3285747cd73ed6f159e9125559ec45ce0e | **Fecha:** 2026-11-07
- **Estado en completadas.md:** [X] (se conserva como histórico)
- **Dictamen:** **NO CUMPLE**
- **Informe base:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-012.md
- **Relación:** F6-037 amplía F6-012 con CA-113..CA-120 y CA-161..CA-165; comparte el mismo bloque canónico de tareas.

## 1. Fuentes

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 3738-3770: F6-037 [X].
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 2179-2183: la evidencia histórica cita validateContextualAccess en ACADEMIC/USER/ACCOUNTING, pero no cubre todos los servicios, endpoints ni objetos.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes UTF-8, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD; F6-037 no aparece.
- El árbol inicial no contenía informe individual de F6-037.

## 2. Hallazgos ampliados

1. **Autenticación por servicio:** DEVELOPER admite authRole sin token; TASK/EXAM permiten consultas privadas en PUBLIC_ACTIONS; USER expone logoutUser sin credencial obligatoria. No todas las rutas validan identidad server-side.
2. **Separación de permisos:** existen ROLE_PERMISSIONS locales, pero el bypass de DEVELOPER y la ausencia de claims de audiencia/servicio no acreditan aislamiento completo. El multirol solo devuelve datos recibidos.
3. **IDOR:** getStudentTasks/getStudentExams aceptan identidad del payload cuando no hay claim; getExamResult devuelve resultados por entregaExamenId sin validar propietario.
4. **Secretos:** no se encontró clave privada literal en frontend y USER enmascara claves sensibles en payloads de logs; sin embargo, el fallback de DEVELOPER es derivable de una constante versionada y su verificador no consulta revocación/estado. No se afirma exposición literal de token en logs.
5. **Comandos:** executeOperationalCommand valida allowlist, pero no permiso individual por comando/ámbito/recurso; el resultado es sintético.
6. **Auditoría:** existen logs, pero algunos actores/roles se toman de authRole/actor del payload; la revocación no se propaga fiablemente entre proyectos.
7. **Revocación granular:** marcadores y matrices están en cachés de proyectos separados; no hay protocolo completo para revocar un servicio preservando accesos independientes.
8. **Pruebas:** no se encontraron pruebas de acceso no autorizado por navegador y solicitudes directas al backend.

## 3. Matriz de aceptación ampliada

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-113: cada microservicio valida autorización server-side | No cumple | bypass DEVELOPER, PUBLIC_ACTIONS sensibles y cliente sin token |
| CA-114: autorización no se hereda automáticamente entre servicios | Parcial | matrices locales, pero bypass authRole y sin audiencia/servicio en token |
| CA-115: manipular IDs no permite acceder a objetos ajenos | No cumple | IDOR getExamResult y consultas TASK/EXAM sin claim |
| CA-116: secretos no expuestos en frontend ni logs | Parcial | no hay clave literal en frontend; USER enmascara payload; fallback DEVELOPER derivable |
| CA-117: comandos administrativos requieren permisos específicos | No cumple | allowlist sin permiso por comando/ámbito/recurso |
| CA-118: cambios de acceso y operaciones sensibles quedan auditados | Parcial | logs parciales; algunos actores provienen del payload |
| CA-119: revocar un servicio sin invalidar innecesariamente otros | No cumple | revocación local USER sin alcance distribuido por servicio |
| CA-120: pruebas de seguridad desde navegador y backend directo | No cumple | no se hallaron suites ni evidencia dinámica |
| CA-161: varios roles por usuario sin duplicar identidad | No cumple | claim único y handler multirol sin persistencia |
| CA-162: permisos por área/subárea/servicio/módulo/operación | Parcial | assignRoleScope guarda ámbitos, sin integración completa en cada servicio |
| CA-163: coordinaciones ligadas a asignaturas/docentes/responsables | Parcial | área/AmbitoJSON presente; no se acredita enforcement completo por endpoint |
| CA-164: cambios de rol no conceden privilegios fuera del ámbito | No cumple | ABAC fail-open y bypass de rol DEVELOPER |
| CA-165: autorización en cada operación, no solo rol visual | No cumple | acciones públicas sensibles, spoofing y handlers sin ownership |

## 4. Reconciliación

Se amplían sin duplicar IDs: AUD-NG-001, AUD-NG-002, AUD-NG-086, AUD-NG-145, AUD-NG-221/TASK-501, AUD-NG-222/TASK-502 y AUD-NG-225/TASK-505. El informe base F6-012 contiene evidencias, SHAs y tareas completas.

## 5. Tareas ejecutables derivadas de los hallazgos

Se reutiliza el bloque canónico **F6-012-A01..A07** de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-012.md, sin crear tareas locales duplicadas:

1. **F6-012-A01:** ampliar autenticación DEVELOPER para CA-113/114/116: token obligatorio, claims de servicio, secreto no derivable y rechazo de authRole sin firma.
2. **F6-012-A02:** ampliar cierre de endpoints/IDOR para CA-115/165: ownership de tareas, entregas, exámenes, documentos y logout.
3. **F6-012-A03:** garantizar que cada petición protegida use identidad firmada y no el rol visual del dashboard.
4. **F6-012-A04:** cubrir CA-161..164: roles persistidos, vigencias, revocación por rol/servicio/módulo/ámbito y relaciones de coordinación verificadas.
5. **F6-012-A05:** denegar ante falta de scope, error de consulta o atributo no reconocido; validar recursos y comandos en cada microservicio.
6. **F6-012-A06:** cubrir CA-119 con evento por servicio, invalidación distribuida, reintentos y preservación de accesos independientes.
7. **F6-012-A07:** cubrir CA-117/118/120 con permisos por comando, actor derivado de claims, auditoría y pruebas desde navegador/HTTP directo.

Todas permanecen Pendientes. La marca [X] de F6-037 se conserva como dato histórico, no como certificación funcional.

## 6. Pruebas y límites

- **Ejecutadas:** revisión manual de los bloques y criterios del informe F6-012, búsqueda dirigida de UI/pruebas, SHAs y árbol Git.
- **No ejecutadas:** navegador, HTTP real, Apps Script, hojas productivas, revocación multi-deployment, ataques activos ni suites automatizadas.
- No se afirma que CA-113..CA-165 haya pasado pruebas dinámicas.

## 7. Cierre

- TAREA-F6-037: **NO CUMPLE**.
- Se conserva [X] en completadas.md como histórico.
- Bloque canónico compartido: F6-012-A01..A07.
- Siguiente auditoría: TAREA-F6-013 y TAREA-F6-038.
