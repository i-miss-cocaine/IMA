# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 37

**Fase:** 37 — Aislamiento de datos y asignación por departamento
**Área:** Enrutamiento de datos, segregación de almacenamiento por dominio/área, interoperabilidad controlada, permisos contextuales (ABAC), prevención de escrituras cruzadas y catálogo central de fuentes.
**Fecha de Evaluación:** 2026-10-31
**Estado General:** Implementada Parcialmente con Brechas en Resolución Declarativa de Destino y Compartición Mínima

---

## A. IDENTIFICACIÓN Y ALCANCE

### 1. Propósito y Objetivos
Determinar si las importaciones, registros y operaciones de consulta/actualización se dirigen al departamento y módulo correctos, y si las relaciones entre departamentos se resuelven sin mezclar registros ni conceder permisos indebidos. La auditoría evalúa el aislamiento en dos dimensiones:
- **Aislamiento Operativo:** Cada departamento conserva sus propios registros, hojas/archivos, operaciones y responsabilidades.
- **Interoperabilidad Controlada:** Los departamentos pueden referenciar datos de otras áreas mediante identificadores estables sin adquirir acceso general a los registros de origen ni exponer datos confidenciales innecesarios.

### 2. Alcance Previsto y Efectivo
- **Resolución Central de Destinos:** Verificación de cómo se determina la hoja/archivo receptor en operaciones de escritura e importación masiva.
- **Aislamiento Operativo Departamental:** Separación entre Secretaría (académico/matrículas), Contabilidad (financiero/pagos), Recursos Humanos (laboral) y Dirección.
- **Catálogo Central de Spreadsheets y Fuentes:** Inspección de `CatalogoSpreadsheets`, `registerSpreadsheetSource` y `resolveSpreadsheetSource`.
- **Permisos Granulares y Contextuales:** Inspección de `ROLE_PERMISSIONS`, `getUserVerifiedRole` y validación en servidor contra elusión cliente.
- **Compartición Mínima de Información:** Comprobación de que consultas cruzadas expongan únicamente campos indispensables.
- **Trazabilidad y Prevención de Escrituras Cruzadas:** Registro de operaciones interdepartamentales y protección ante concurrencia.

---

## B. INVENTARIO TÉCNICO ENCONTRADO

| Componente | Archivo / Ubicación | Función Principal | Estado / Hallazgo |
|---|---|---|---|
| Control Central de Permisos RBAC | `backend/user-service/Code.gs` (L925, L1192) | `ROLE_PERMISSIONS`, `validateRolePermission`, `getUserVerifiedRole` | Implementado y estricto. Valida roles y rechaza acciones no autorizadas con código `UNAUTHORIZED_ACCESS_ATTEMPT`. |
| Catálogo de Fuentes Distribuidas | `backend/accounting-service/Code.gs` (L9505-L9592) | `registerSpreadsheetSource`, `resolveSpreadsheetSource`, `getSpreadsheetCatalog` | Permite mapear dominios (`Secretaria`, `Contabilidad`, `Academico`) y años lectivos a IDs de Google Sheets específicos. |
| Ingesta con Mapeo de Destino | `backend/accounting-service/Code.gs` (L10167, L10203) | `validateImportPreview`, `importDataWithColumnMapping` | Recibe `destinoModulo` desde el cliente sin validación de correspondencia estricta contra la entidad real. |
| Aislamiento de Consultas Familiares | `backend/user-service/Code.gs` (L4950) | `getStudentAbsenceJustifications` | Verifica vinculación efectiva padre-hijo mediante `getGuardianStudents` (rechaza con 403 accesos ajenos). |
| Aislamiento de Casos de Bienestar | `backend/academic-service/Code.gs` (L102) | `validateStudentWelfareAccess` | Aislamiento estricto de notas de orientación psicológica ante docentes y administrativos. |
| Frontend de Importación | `teacher-dashboard.html` / `js/teacher.js` | `#excel-target-module`, `btn-submit-excel-import` | Selector manual con opciones estáticas (`Docentes`, `Secretaria`, `Contabilidad`). |

---

## C. ESTADO FUNCIONAL ACTUAL POR SUBCAPACIDAD (F37-01 A F37-12)

### F37-01. Resolución central del destino de los datos
- **Estado:** Implementada Parcialmente.
- **Implementación Real:** `resolveSpreadsheetSource` permite consultar la hoja física en `CatalogoSpreadsheets` según dominio y año lectivo.
- **Brecha Crítica:** En el importador (`importDataWithColumnMapping`), el destino se toma directamente del string `destinoModulo` enviado por el frontend sin validar en el servidor si la estructura del archivo coincide semánticamente con ese módulo o si el usuario tiene privilegios en dicho destino.

### F37-02. Aislamiento operativo por departamento y módulo
- **Estado:** Requiere Mejoras.
- **Implementación Real:** La mayoría de servicios operan sobre una única `SPREADSHEET_ID` central con hojas separadas (`MatriculasEstudiantes`, `CargosEstudiante`, `Usuarios`, etc.).
- **Brechas:** Aunque existen hojas separadas, consultas en módulos como Contabilidad pueden acceder a datos generales de alumnos sin que exista un filtro de vistas que restrinja columnas no financieras.

### F37-03. Separación entre identificadores centrales y registros departamentales
- **Estado:** Completa y Verificada.
- **Implementación Real:** Se utiliza `personaId` / `estudianteId` como identificador institucional estable, mientras las matrículas usan `matriculaId` y los pagos usan `pagoId` / `movimientoId`. Los cambios en nombres o correos no rompen las claves foráneas.

### F37-04. Catálogo central de referencias y relaciones autorizadas
- **Estado:** Implementada Parcialmente.
- **Implementación Real:** Existe `CatalogoSpreadsheets` para fuentes de datos, pero no existe un catálogo declarativo formal de relaciones interdepartamentales que defina qué campos de la entidad `Estudiante` son visibles para `Contabilidad` o `Transporte`.

### F37-05. Permisos granulares y autorización por contexto
- **Estado:** Completa y Verificada en Backend.
- **Implementación Real:** `validateRolePermission` comprueba el token y rol verificado en cada llamada RPC en `doPost`. Manipular parámetros en el cliente no permite saltar la lista blanca `ROLE_PERMISSIONS`.

### F37-06. Importaciones con identificación del tipo de información y destino
- **Estado:** Requiere Mejoras.
- **Brecha Crítica:** Si un usuario de Contabilidad carga un archivo con formato de matrículas y selecciona `destinoModulo: "Secretaría"`, el backend actual no bloquea la operación si el usuario tiene permiso de importación en el servicio. Falta comprobación estricta de coherencia entre el rol del usuario, el contenido del archivo y el módulo destino.

### F37-07. Resolución de referencias durante las importaciones
- **Estado:** Ausente en Importador Actual.
- **Brechas:** `importDataWithColumnMapping` no valida si las referencias foráneas (matrículas, cuentas) existen previamente en su departamento propietario antes de registrarlas en el destino.

### F37-08. Compartición mínima de información entre departamentos
- **Estado:** Defectuosa.
- **Brechas:** Las consultas interdepartamentales suelen retornar la fila completa de la hoja (vía `getValues()`) o el objeto completo sin aplicar máscaras de campos mínimos (principio de menor privilegio y privacidad de datos).

### F37-09. Integridad de las operaciones y prevención de escrituras cruzadas
- **Estado:** Implementada Parcialmente.
- **Implementación Real:** Existen bloqueos con `LockService` en generadores de ID y matrículas, pero el importador carece de un validador que impida a dos importaciones simultáneas escribir datos desalineados en hojas compartidas.

### F37-10. Trazabilidad de movimientos de datos entre módulos
- **Estado:** Completa y Verificada.
- **Implementación Real:** `logStructuredEvent` audita con módulo, acción, nivel, código, usuario y rol en la bitácora central `RegistroEventos`.

### F37-11. Administración de destinos, departamentos y relaciones
- **Estado:** Implementada Parcialmente.
- **Implementación Real:** `registerSpreadsheetSource` permite registrar nuevas hojas en `CatalogoSpreadsheets`, pero no hay consola de administración de reglas de compartición entre departamentos.

### F37-12. Diagnóstico, recuperación y supervisión
- **Estado:** Ausente.
- **Brechas:** No existe un reporte o diagnóstico que detecte registros huérfanos o escritos en hojas erróneas tras importaciones fallidas.

---

## D. ARQUITECTURA REAL DE AISLAMIENTO

```
+-----------------------------------------------------------------------------------+
|                           CLIENTE (Frontend Web)                                  |
|   Dashboard Secretaría      Dashboard Contabilidad      Dashboard Recursos Humanos |
+-----------------------------------------------------------------------------------+
                                         |
                       Llamadas RPC (fetchApi / doPost)
                                         v
+-----------------------------------------------------------------------------------+
|                        GATEWAY DE SEGURIDAD (GAS doPost)                          |
|   getUserVerifiedRole() -> validateRolePermission(action, payload) -> ROLE_PERMS  |
+-----------------------------------------------------------------------------------+
                                         |
            +----------------------------+----------------------------+
            v                                                         v
+------------------------+                               +--------------------------+
|  user / academic       |                               |    accounting-service    |
|  - Matriculas          |                               |  - Cargos / Pagos        |
|  - Expedientes         |                               |  - CatalogoSpreadsheets  |
|  - Bienestar / Notas   |                               |  - AuditoriaMigraciones  |
+------------------------+                               +--------------------------+
            |                                                         |
            +----------------------------+----------------------------+
                                         v
+-----------------------------------------------------------------------------------+
|                  ALMACENAMIENTO CENTRAL (Google Sheets / Drive)                   |
|  - Hojas Operativas: MatriculasEstudiantes, CargosEstudiante, Usuarios, etc.     |
|  - Hoja de Enrutamiento: CatalogoSpreadsheets (dominioArea, anoLectivo, SS_ID)    |
|  - Hoja de Bitácora: RegistroEventos (Trazabilidad y auditoría estructurada)      |
+-----------------------------------------------------------------------------------+
```

---

## E. COMPARACIÓN DE CAPACIDADES

- **Moodle (Roles & Contextos):** Asignación de permisos según el contexto institucional (categoría, curso, bloque) impidiendo que un profesor de una asignatura modifique datos de otra.
- **Odoo (Multi-company & Record Rules):** Reglas de dominio que filtran automáticamente registros por `department_id` o `company_id` en cada consulta ORM sin depender del desarrollador.
- **Plataforma Educativa Actual:** Posee un sólido RBAC en backend y catálogo de spreadsheets para distribución multi-archivo, pero adolece de filtrado automático de columnas a nivel de consulta y validación de coherencia en la asignación de destinos de importación.

---

## F. LISTA MAESTRA DE CARACTERÍSTICAS (CAR-F37)

| ID | Característica | Prioridad | Estado Funcional | Acción Recomendada |
|---|---|---|---|---|
| F37-01 | Resolución central de destinos | P0 | Implementada Parcialmente | Enrutamiento declarativo en backend sin confiar en frontend |
| F37-02 | Aislamiento operativo departamental | P0 | Requiere Mejoras | Vistas departamentales aisladas en consultas |
| F37-03 | Identificadores centrales inmutables | P0 | Completa y Verificada | Mantener `personaId` / `estudianteId` como puente estable |
| F37-04 | Catálogo de relaciones autorizadas | P0 | Implementada Parcialmente | Crear `CatalogoRelacionesInterdepartamentales` |
| F37-05 | Permisos contextuales por ámbito | P0 | Completa y Verificada | Consolidar validación de sede en `validateRolePermission` |
| F37-06 | Importación con destino forzado | P0 | Requiere Mejoras | Comprobar coherencia rol-entidad-archivo antes de escribir |
| F37-07 | Resolución de referencias en ingesta | P0 | Ausente | Validar existencia previa de referencias foráneas |
| F37-08 | Compartición mínima de campos | P0 | Defectuosa | Filtro de máscara de campos (proyección de atributos) |
| F37-09 | Integridad y prevención escrituras cruzadas | P0 | Implementada Parcialmente | Atomicidad con LockService en persistencia cruzada |
| F37-10 | Trazabilidad de movimientos de datos | P0 | Completa y Verificada | Bitácora estructurada en `RegistroEventos` |
| F37-11 | Administración de destinos y relaciones | P1 | Implementada Parcialmente | Consola administrativa para Dirección |
| F37-12 | Diagnóstico y recuperación de desvíos | P1 | Ausente | Algoritmo de detección de registros desalineados |

---

## G. RESULTADOS DE LA MATRIZ DE PRUEBAS FUNCIONALES (PT-F37-01 A PT-F37-32)

| ID | Escenario | Resultado Esperado | Resultado Observado | Estado |
|---|---|---|---|---|
| **PT-F37-01** | Importar matrículas desde Secretaría | Llega a destino académico | Procesado por módulo académico | **Aprobado** |
| **PT-F37-02** | Importar pagos desde Contabilidad | Llega a destino financiero | Registrado en bitácora financiera | **Aprobado** |
| **PT-F37-03** | Archivo financiero con cabeceras similares a matrícula | No se asigna erróneamente | Falta validación semántica de contenido | **Requiere Mejoras** |
| **PT-F37-04** | Enviar destino manipulado desde frontend | Backend rechaza destino incompatible | Backend toma string sin validar autorización de área | **No Aprobado** |
| **PT-F37-05** | Importar entidad sin destino configurado | Operación falla de forma controlada | Error de clave no manejado limpiamente | **Requiere Mejoras** |
| **PT-F37-06** | Dos destinos posibles para entidad | Exige selección explícita | Asume el primer destino encontrado | **No Aprobado** |
| **PT-F37-07** | Renombrado de hoja en Sheets | No escribe en destino incorrecto | Búsqueda por nombre de hoja falla con excepción | **Aprobado** |
| **PT-F37-08** | Consultar pagos desde Secretaría | Solo devuelve resumen autorizado | Endpoint financiero bloqueado por RBAC | **Aprobado** |
| **PT-F37-09** | Consultar datos académicos desde Contabilidad | No expone calificaciones completas | Puede consultar expediente completo si invoca endpoint | **No Aprobado** |
| **PT-F37-10** | Consultar RRHH sin permiso | Acceso denegado en backend | Bloqueado con error 403 por `ROLE_PERMISSIONS` | **Aprobado** |
| **PT-F37-11** | Pago relacionado con matrícula válida | Referencia queda vinculada | Vinculado por `estudianteId` | **Aprobado** |
| **PT-F37-12** | Pago con matrícula inexistente | Operación se rechaza | No valida existencia de matrícula previa | **No Aprobado** |
| **PT-F37-13** | Pago con matrícula no autorizada | Rechazo sin revelar datos | No valida ámbito institucional de la matrícula | **No Aprobado** |
| **PT-F37-14** | Dos estudiantes con nombres iguales | No se confunden por identificador | Identificadores únicos independientes | **Aprobado** |
| **PT-F37-15** | Modificar nombre de estudiante | Relaciones financieras intactas | Relaciones basadas en ID inmutable se conservan | **Aprobado** |
| **PT-F37-16** | Usuario lectura intenta editar | Backend bloquea edición | Bloqueado por lista blanca de acciones permitidas | **Aprobado** |
| **PT-F37-17** | Revocar permisos durante sesión | Operación posterior denegada | Token revalidado contra base en operaciones críticas | **Aprobado** |
| **PT-F37-18** | Solicitud directa a servicio protegido | Backend aplica restricciones | `doPost` ejecuta `validateRolePermission` | **Aprobado** |
| **PT-F37-19** | Columnas obligatorias ausentes | Error antes de guardar | Valida presencia de campo clave | **Aprobado** |
| **PT-F37-20** | Referencias ambiguas en importación | Filas quedan en revisión | No detecta ambigüedad relacional | **No Aprobado** |
| **PT-F37-21** | Cancelar en previsualización | No escribe registros | Sin efectos colaterales | **Aprobado** |
| **PT-F37-22** | Repetir importación completada | No genera duplicados | Genera registros duplicados en Sheets | **No Aprobado** |
| **PT-F37-23** | Interrupción durante escritura | Sin registros parciales corruptos | Inserción por appendRow puede quedar truncada | **Requiere Mejoras** |
| **PT-F37-24** | Dos importaciones simultáneas | No mezclan destinos | LockService serializa ejecuciones | **Aprobado** |
| **PT-F37-25** | Consultar referencias compartidas | Solo devuelve campos mínimos | Retorna objeto completo de la entidad | **No Aprobado** |
| **PT-F37-26** | Archivar entidad con pagos | Registros financieros intactos | Registros contables se conservan | **Aprobado** |
| **PT-F37-27** | Crear nuevo destino o departamento | Destinos existentes intactos | Registro en `CatalogoSpreadsheets` es aditivo | **Aprobado** |
| **PT-F37-28** | Desactivar destino | Bloquea escrituras sin borrar histórico | Marcado como inactive en catálogo | **Aprobado** |
| **PT-F37-29** | Historial de movimientos interdepartamentales | Identifica origen, destino y actor | Registrado en `RegistroEventos` | **Aprobado** |
| **PT-F37-30** | Usuario ordinario intenta alterar bitácora | Modificación rechazada | Bitácora protegida contra escritura ordinaria | **Aprobado** |
| **PT-F37-31** | Diagnosticar registro en destino incorrecto | Identifica destino esperado y real | Función de diagnóstico ausente | **No Aprobado** |
| **PT-F37-32** | Corregir registro mal asignado | Conserva identidad y relaciones | Función de reasignación asistida ausente | **No Aprobado** |

---

## H. HALLAZGOS Y RIESGOS

1. **Riesgo de Manipulación de Destino en Importaciones (P0):**
   - El endpoint `importDataWithColumnMapping` acepta el parámetro `destinoModulo` directamente del cliente sin validar si el usuario autenticado tiene jurisdicción sobre dicho departamento ni cotejar la estructura del archivo contra el esquema del módulo.
2. **Exposición Innecesaria de Datos Académicos en Finanzas (P0):**
   - Al consultar datos de estudiantes para facturación, las llamadas devuelven registros con información que no es pertinente para el departamento de Contabilidad (teléfonos de emergencia, tutores legales secundarios, observaciones).
3. **Ausencia de Validación Relacional en Transacciones (P0):**
   - Es posible registrar pagos o cargos asociados a un código de matrícula arbitrario sin que el sistema compruebe si la matrícula existe activamente en el ciclo académico corriente.

---

## I. PLAN DE RESOLUCIÓN PRIORIZADO

### Bloque P0: Enrutamiento Declarativo, Validación Foránea y Proyección Mínima de Campos
1. **[F37-Task01] Enrutamiento declarativo central de destinos de datos y blindaje de importación:**
   - Implementar un motor de resolución en backend que determine el destino según la entidad, el rol verificado y el departamento institucional, rechazando destinos incompatibles solicitados por el cliente.
2. **[F37-Task02] Catálogo de proyecciones y compartición mínima de información (Máscara de Atributos):**
   - Definir vistas de campos autorizados para consultas interdepartamentales (ej. Contabilidad solo recibe: `estudianteId`, `nombreCompleto`, `grado`, `seccion`, `estadoMatricula`).
3. **[F37-Task03] Validador relacional estricto de referencias interdepartamentales:**
   - Validar obligatoriamente la existencia y vigencia de entidades foráneas (matrículas, cuentas) antes de permitir la creación de registros dependientes.
4. **[F37-Task04] Prevención de escrituras cruzadas e idempotencia en operaciones departamentales:**
   - Incorporar claves de idempotencia compuestas por `departamento + entidad + operacionId` para serializar escrituras en hojas compartidas.

### Bloque P1: Diagnóstico, Supervisión y Catálogo Administrativo
5. **[F37-Task05] Herramienta de diagnóstico de coherencia departamental y registros desalineados:**
   - Algoritmo que identifique registros huérfanos o ubicados en hojas no correspondientes a su departamento propietario.
6. **[F37-Task06] Consola de administración de destinos, fuentes y relaciones interdepartamentales:**
   - Interfaz en panel de Dirección para supervisar y configurar el enrutamiento de datos entre sedes y departamentos.

---

## J. COBERTURA CUANTITATIVA Y CONCLUSIÓN

- **Total de Subcapacidades Evaluadas:** 12 (F37-01 a F37-12)
- **Inspección de Código y Repositorio:** 100%
- **Pruebas de la Matriz Funcional Ejecutadas:** 32 (PT-F37-01 a PT-F37-32)
- **Distribución de Estados Funcionales:**
  - *Completa y Verificada:* 3 (25.0%)
  - *Implementada Parcialmente:* 5 (41.7%)
  - *Requiere Mejoras:* 2 (16.6%)
  - *Defectuosa:* 1 (8.3%)
  - *Ausente:* 1 (8.4%)
- **Cobertura de Verificación Satisfactoria:** 59.4% (19/32 pruebas aprobadas)
- **Dictamen:** **NO APROBADA PARA CERTIFICACIÓN FINAL** debido a la falta de validación server-side del destino solicitado en importaciones, la exposición excesiva de atributos en consultas interdepartamentales y la ausencia de validación previa de referencias foráneas en transacciones financieras.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de las seis tareas descritas en el plan I (F37-Task01..F37-Task06), conservando sus prioridades visibles. Se añaden F37-Task09 y F37-Task10 para cubrir la reasignación asistida de registros mal dirigidos (PT-F37-32) y la automatización de la matriz de pruebas de aislamiento. Auditoria.txt registra ocho tareas históricas, pero no contiene descripciones para F37-Task07/08; no se inventan. Se documenta además la diferencia de prioridad de F37-Task05 entre el informe y la bitácora.

### [F37-Task01] Implementar enrutamiento declarativo server-side de destinos de datos
- **Hallazgo de origen:** F37-01/F37-06; PT-F37-03/04/05/06; CAR-F37-01/CAR-F37-06.
- **Severidad:** Crítica / P0. **Objetivo:** resolver el destino según entidad, rol verificado y departamento, sin confiar en el destino solicitado por el frontend.
- **Acción ejecutable:** crear motor declarativo que reciba entidad/tipo de información y contexto verificado; resuelva Spreadsheet/hoja/ámbito desde catálogo; valide que esquema de columnas, rol y departamento coincidan; rechace destinos ambiguos o no autorizados.
- **Archivos/módulos:** `backend/accounting-service/Code.gs` (`importDataWithColumnMapping`, `resolveSpreadsheetSource`, `CatalogoSpreadsheets`), `backend/developer-service/Code.gs`, `js/teacher.js`, `excel-target-module`.
- **Dependencias/riesgos:** F35-Task17 (esquemas importables), F35-ID-Task02/07 (formatos/ámbitos y catálogo), F29-Task17 (roles/privacidad); riesgo de escritura cruzada o exposición de datos entre áreas.
- **Alcance:** enrutamiento y autorización de destino en backend; no aceptar `destinoModulo` como autoridad ni usar la primera hoja coincidente.
- **Criterios de aceptación:** destino derivado/validado server-side; esquema de entidad coincide; rol y departamento autorizados; destinos múltiples exigen selección explícita validada; falta de configuración falla de forma controlada; pruebas de payload manipulado, destino incompatible, módulo no autorizado y sedes.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría confirma que `destinoModulo` llega del cliente sin cotejo semántico ni jurisdiccional.

### [F37-Task02] Crear catálogo de proyecciones y máscaras mínimas de atributos interdepartamentales
- **Hallazgo de origen:** F37-02/F37-04/F37-08; PT-F37-09/25; CAR-F37-02/CAR-F37-04/CAR-F37-08.
- **Severidad:** Crítica / P0. **Objetivo:** compartir solo los atributos necesarios para la operación del departamento receptor.
- **Acción ejecutable:** crear `CatalogoRelacionesInterdepartamentales` con entidad origen/destino, campos permitidos, propósito, rol, ámbito y vigencia; aplicar proyección server-side en consultas; bloquear retornos de filas completas cuando exista máscara.
- **Archivos/módulos:** servicios User/Academic/Accounting/Developer, `CatalogoRelacionesInterdepartamentales`, consultas de estudiantes, expedientes y pagos.
- **Dependencias/riesgos:** F30-Task02 (integridad relacional), AUD-NG-158 (ABAC), F29-Task17 (privacidad); riesgo de exposición de teléfonos, tutores secundarios, bienestar u observaciones no pertinentes.
- **Alcance:** minimización de campos y relaciones autorizadas; no sustituir RBAC ni asumir que ocultar columnas en frontend protege datos.
- **Criterios de aceptación:** proyecciones versionadas por propósito/departamento; campos se filtran en backend; Contabilidad recibe solo datos mínimos de matrícula; campos sensibles excluidos por defecto; pruebas de endpoints directos, cambio de rol y manipulación de filtros.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-F37-09/25 detectan acceso a expediente completo y retorno de objetos sin máscara.

### [F37-Task03] Validar estrictamente referencias foráneas interdepartamentales
- **Hallazgo de origen:** F37-07; PT-F37-12/13/20; CAR-F37-07.
- **Severidad:** Crítica / P0. **Objetivo:** impedir cargos/pagos y registros dependientes asociados a matrículas/cuentas inexistentes o fuera del ámbito.
- **Acción ejecutable:** validar existencia, estado, propietario departamental, institución y periodo de cada referencia antes de escribir; rechazar referencias ambiguas/inactivas y devolver errores no reveladores.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `recordStudentPayment`, `CargosEstudiante`, `MatriculasEstudiantes`, `CatalogoSpreadsheets`.
- **Dependencias/riesgos:** F25-Task03, F29-Task01/02/07, F30-Task02; riesgo de cargo huérfano, fraude o fuga de existencia de datos de otra sede.
- **Alcance:** validación de referencias y ámbito; no aceptar IDs arbitrarios ni depender solo de coincidencia por estudianteId.
- **Criterios de aceptación:** referencia existe y está activa; periodo/sede/propietario coinciden; autorización se verifica en backend; referencias ambiguas se bloquean; prueba cubre matrícula inexistente, ajena, vencida y válida.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-F37-12/13 fallan porque el backend no valida existencia ni ámbito de matrícula.

### [F37-Task04] Prevenir escrituras cruzadas con idempotencia por departamento y entidad
- **Hallazgo de origen:** F37-09; PT-F37-22/23/24; CAR-F37-09.
- **Severidad:** Crítica / P0. **Objetivo:** impedir duplicados, mezcla de destinos y escrituras parciales en importaciones simultáneas.
- **Acción ejecutable:** incorporar clave compuesta departamento+entidad+operacionId, LockService/serialización por ámbito y registro durable de estado; validar destino de nuevo al confirmar; diseñar compensación para fallos parciales.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `importDataWithColumnMapping`, `AuditoriaMigraciones`, `CatalogoSpreadsheets`, colas de importación.
- **Dependencias/riesgos:** F35-Task04/08, F25-Task05, F29-Task09, AUD-NG-006; riesgo de locks globales excesivos o idempotencia que colisione entre sedes.
- **Alcance:** persistencia cruzada y reintentos; no considerar LockService por sí solo como transacción distribuida ni como validación de destino.
- **Criterios de aceptación:** clave idempotente por operación/ámbito; destino inmutable tras preview; lock o mecanismo equivalente; reintentos no duplican; escritura parcial se detecta y compensa; pruebas de dos imports simultáneos, replay y timeout.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-F37-22 muestra duplicados y PT-F37-23 admite escritura truncada en caso de interrupción.

### [F37-Task05] Diagnosticar registros huérfanos y desalineados entre departamentos
- **Hallazgo de origen:** F37-12; PT-F37-31; CAR-F37-12.
- **Severidad:** Alta / P1 según el plan I. **Objetivo:** identificar registros almacenados en un destino distinto del propietario esperado y relaciones huérfanas.
- **Acción ejecutable:** implementar escaneo de integridad que compare entidad, ámbito, catálogo de destino y relaciones; generar informe con ubicación real/esperada, origen de escritura, impacto y prioridad; permitir exportar hallazgos.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `CatalogoSpreadsheets`, `RegistroEventos`, `AuditoriaMigraciones` y servicios Academic/Accounting.
- **Dependencias/riesgos:** F37-Task01/02/03, F30-Task02, F29-Task18; riesgo de marcar como error un registro histórico válido o reparar sin preservar relaciones.
- **Alcance:** diagnóstico y reporte; la reparación se ejecuta solo mediante F37-Task09 y aprobación.
- **Criterios de aceptación:** escaneo de todas las áreas; destino esperado/real; referencias huérfanas y duplicados diferenciados; evidencia/correlationId; exportación de resultados; pruebas de hoja incorrecta, referencia rota y registro histórico legítimo.
- **Prioridad:** P1 en el plan I; la bitácora histórica asigna P0 a Task05. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-F37-31 confirma que no existe diagnóstico de registros mal asignados.

### [F37-Task06] Crear consola administrativa de destinos, fuentes y relaciones interdepartamentales
- **Hallazgo de origen:** F37-04/F37-11; CAR-F37-04/CAR-F37-11.
- **Severidad:** Alta / P1. **Objetivo:** permitir a Dirección administrar destinos, relaciones y reglas de compartición sin modificar código.
- **Acción ejecutable:** ampliar `CatalogoSpreadsheets` con relaciones, propietario, ámbito, estado y política de proyección; crear consola para crear/editar/desactivar destinos y revisar dependencias; validar cambios con preview y aprobación.
- **Archivos/módulos:** `backend/accounting-service/Code.gs` (`registerSpreadsheetSource`, `resolveSpreadsheetSource`, `getSpreadsheetCatalog`), `backend/developer-service/Code.gs`, dashboard Dirección.
- **Dependencias/riesgos:** F35-ID-Task02/07, F26-Task01/05, F37-Task01/02; riesgo de cambios de catálogo que redirijan escrituras o amplíen acceso.
- **Alcance:** administración de destinos y relaciones; no permitir que usuarios ordinarios cambien fuentes ni que se borren referencias históricas.
- **Criterios de aceptación:** roles administrativos; cambios versionados; preview de impacto; desactivación no destructiva; validación de destino/relación; pruebas de acceso, sede, rollback y concurrencia.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe registro técnico de Spreadsheet, pero no consola para administrar reglas de compartición.

### [F37-Task09] Implementar reasignación asistida de registros ubicados en destinos incorrectos
- **Hallazgo de origen:** PT-F37-32; F37-12 y CAR-F37-12.
- **Severidad:** Alta / P1. **Objetivo:** corregir desvíos detectados sin perder identidad, referencias ni trazabilidad.
- **Acción ejecutable:** crear flujo de reasignación que valide origen/destino, construya plan de movimiento, conserve ID interno, actualice referencias dependientes, genere snapshot y registre aprobación; no mover automáticamente registros ambiguos.
- **Archivos/módulos:** servicios Developer/Academic/Accounting, `CatalogoSpreadsheets`, `CorrespondenciaIdentificadores`, `RegistroEventos` y `AuditoriaMigraciones`.
- **Dependencias/riesgos:** F37-Task05/06, F29-Task01/04/07, F35-ID-Task05/08/09; riesgo de duplicar/eliminar el registro o romper relaciones.
- **Alcance:** reparación controlada de destino; no ejecutar movimientos productivos sin preview, respaldo y autorización.
- **Criterios de aceptación:** preview muestra filas/relaciones afectadas; ID estable conservado; movimiento idempotente; referencias reconciliadas; snapshot/rollback; actor y motivo registrados; pruebas de destino erróneo, referencias múltiples y conflicto.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-F37-32 falla porque no existe función de reasignación asistida.

### [F37-Task10] Automatizar pruebas de aislamiento y enrutamiento interdepartamental
- **Hallazgo de origen:** PT-F37-01..PT-F37-32; fallos de destino, proyección, referencias, idempotencia y diagnóstico.
- **Severidad:** Alta / P1. **Objetivo:** prevenir regresiones en límites entre departamentos y servicios.
- **Acción ejecutable:** ampliar AUD-NG-161 con fixtures multiinstitución/departamento, roles, esquemas, destinos, referencias y concurrencia; verificar que los endpoints devuelvan solo campos permitidos y que escrituras fuera de ámbito se rechacen.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, servicios User/Academic/Accounting/Developer, entorno de pruebas aislado.
- **Dependencias/riesgos:** F37-Task01..Task09, AUD-NG-161; riesgo de contaminar datos reales o de aprobar pruebas estructurales sin validar efectos.
- **Alcance:** pruebas conductuales aisladas; no usar hojas productivas ni enviar notificaciones reales.
- **Criterios de aceptación:** 32 escenarios reproducibles; fixtures con dos sedes/departamentos; pruebas positivas/negativas; no fuga de campos; escrituras idempotentes; limpieza/rollback; evidencia por escenario y versión.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz de 32 pruebas contiene fallos funcionales que deben convertirse en regresiones automatizadas.

### Reconciliaciones y discrepancias transversales de Fase 37
- **F37-Task01:** destino lo resuelve el servidor; el selector del cliente solo expresa intención y nunca autoriza.
- **F37-Task02:** las máscaras complementan RBAC/ABAC; no lo sustituyen ni permiten consultar filas completas.
- **F37-Task03:** coordinar referencias con F25-Task03/F29-Task01 y F30-Task02.
- **F37-Task04:** coordinar idempotencia con F35-Task04/F25-Task05 y AUD-NG-006; no confundir lock con transacción distribuida.
- **F37-Task05/09:** diagnóstico identifica; reasignación repara. Son acciones separadas para evitar cambios automáticos inseguros.
- **F37-Task06:** consola consume catálogo y relaciones, no mantiene un segundo catálogo de spreadsheets.
- **Discrepancia histórica:** Auditoria.txt registra ocho tareas F37-Task01..F37-Task08 (P0 01-05; P1 06-08), mientras el informe I solo describe F37-Task01..F37-Task06. No se recuperó descripción de Task07/08; no se inventan. Se conserva la diferencia de prioridad de Task05 (P1 en informe, P0 en bitácora).
- **Subcapacidades completas preservadas:** F37-03/F37-05/F37-10; no se reejecutaron pruebas.
- **Estado global:** F37-Task01..F37-Task06 y F37-Task09..F37-Task10 permanecen pendientes; F37-Task07/08 quedan como IDs históricos sin descripción recuperable.
