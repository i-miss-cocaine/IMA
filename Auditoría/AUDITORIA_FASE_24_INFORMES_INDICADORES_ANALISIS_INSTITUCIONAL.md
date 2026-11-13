# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 24
# Informes, Indicadores y Análisis Institucional

**Proyecto:** Plataforma Integral de Gestión Educativa
**Fase Auditada:** 24
**Área:** Informes Institucionales, Indicadores de Gestión, Analítica Académica/Financiera/Operativa y Cuadros de Mando
**Tipo de Trabajo:** Auditoría Funcional, Inspección Técnica y Verificación de Arquitectura
**Estado de Modificaciones en Código:** No autorizadas durante esta fase de auditoría diagnóstica
**Fecha de Emisión:** 2025

---

## A. Identificación

### 1. Propósito y Alcance
La Fase 24 evalúa la capacidad de la plataforma para consolidar un **Sistema Institucional de Información y Analítica Integral**. Dicho sistema debe permitir transformar los datos operativos (calificaciones, asistencias, expedientes, cobros, presupuestos, inventarios, planillas y trámites) en indicadores normalizados, informes estructurados con filtros multidimensionales, comparativas temporales, exportaciones fidedignas y cuadros de mando (dashboards) diferenciados según los roles y responsabilidades de los usuarios (Rectoría/Dirección, Coordinación Académica, Administración/Contabilidad, Secretaría y Docentes), asegurando estricto aislamiento RBAC/ABAC y consistencia matemática.

### 2. Componentes y Servicios Reales Identificados
- **Servicio Central de Informes Institucionales:** `backend/user-service/Code.gs` (`generateInstitutionalReport`, `generatePrivilegeAndAccountAuditReport`, `getPaginatedAuditLogReport`).
- **Servicio Analítico Académico:** `backend/academic-service/Code.gs` (`getCurricularAnalyticsReport`, `getAdmissionAnalyticsReport`, `getSectionCapacityAnalyticsReport`, `getPlanningQualityAndOccupancyReport`, `getStudentFileAdministrativeReports`, `generateConsolidatedAttendanceAndCoexistenceReport`).
- **Servicio Analítico Financiero y Operativo:** `backend/accounting-service/Code.gs` (`getFinancialSummary`, `getAccountsReceivablePayableSummary`, `getCashFlowSixMonthProjection`, `getComparativeFinancialSummary`, `getHRDashboardAnalytics`, `getAdvancedDashboardAnalytics`, `getTrainingAnalyticsReport`).
- **Plano de Gobernanza y Dashboards Dinámicos:** `backend/developer-service/Code.gs` (`runModularAndDynamicDashboardsRegressionSuite`, `getCentralCapabilitiesCatalog`, `getRoleFunctionalSpaceConfig`, `getArchitectureAndDependencyMapReport`).
- **Visualizador y Capa de Presentación UI:** `js/ui-common.js` (`displayReportModal`, `renderUnifiedAnalyticsCard`, `initGlobalDashboardSettings`), `js/accounting.js` y `js/teacher.js`.

### 3. Roles Operativos y Niveles de Acceso
- **Dirección / Rectoría:** Acceso ejecutivo global a indicadores estratégicos de matrícula, deserción, rendimiento general, ingresos/egresos y cumplimiento presupuestario.
- **Coordinación Académica:** Indicadores de aprobación, ausentismo por grado/sección, avance de planificaciones y alertas tempranas de acompañamiento.
- **Contabilidad / Administración:** Estados de cuenta, cobranza efectiva confirmada, antigüedad de saldos, flujo de caja proyectado y comparación de ejercicios fiscales.
- **Secretaría General:** Estado de expedientes estudiantiles, trámites administrativos, matrículas por ciclo y certificaciones.
- **Docentes:** Promedios, estadísticas de evaluaciones y asistencias limitadas estrictamente a sus secciones y asignaturas asignadas.

---

## B. Inventario Funcional

### 1. Informes Localizados en Backend
1. **Informe Financiero y Cobranza (`REP-CONT-01`):** `generateInstitutionalReport` en `user-service`. Consolida pagos efectivos confirmados excluyendo transacciones pendientes, canceladas o rechazadas.
2. **Rendimiento Académico por Grado y Sección (`REP-ACAD-01`):** `generateInstitutionalReport` en `user-service`. Consolida notas publicadas por estudiante y estado académico.
3. **Informe Administrativo de Expedientes y Movimientos:** `getStudentFileAdministrativeReports` en `academic-service`.
4. **Informe Consolidado de Asistencia y Convivencia:** `generateConsolidatedAttendanceAndCoexistenceReport` en `academic-service`.
5. **Informe de Capacidad y Ocupación de Secciones:** `getSectionCapacityAnalyticsReport` en `academic-service`.
6. **Comparativo Financiero Multianual:** `getComparativeFinancialSummary` en `accounting-service`.

### 2. Indicadores Principales Identificados
- **Académicos:** Matrícula activa/retirada, promedio general de calificaciones, porcentaje de aprobación/reprobación, distribución de calificaciones (Excelente, Bueno, Satisfactorio, Necesita Mejora), tasa de ausentismo justificado/injustificado, ocupación de secciones vs capacidad instalada.
- **Financieros:** Ingresos totales confirmados, egresos devengados, balance neto de caja/bancos, porcentaje de cartera recuperada vs morosidad, proyección de flujo a 6 meses.
- **Administrativos / RRHH:** Personal activo en nómina, porcentaje de asistencia diaria de empleados, solicitudes de vacaciones/permisos pendientes, volumen de trámites resueltos.

### 3. Paneles (Dashboards) Existentes
- `getAdvancedDashboardAnalytics` (RRHH y personal).
- `getHRDashboardAnalytics` (Consolidado de recursos institucionales).
- `dynamic-dashboard.html` / `js/ui-common.js` (Dashboard dinámico adaptable por rol).

---

## C. Estado Actual por Subcapacidad

| ID | Subcapacidad | Prioridad | Clasificación Funcional | Implementación y Evidencias |
| :--- | :--- | :--- | :--- | :--- |
| **F24-001** | Catálogo de Informes Institucionales | Crítica | Implementada parcialmente | Existen funciones aisladas (`REP-CONT-01`, `REP-ACAD-01`); falta un endpoint unificado `getInstitutionalReportsCatalog` con metadatos y permisos por rol. |
| **F24-002** | Generación y Consulta de Informes | Crítica | Completa y verificada | Implementado en `generateInstitutionalReport` y modal interactivo `displayReportModal` en `js/ui-common.js`. |
| **F24-003** | Filtros por Período y Fechas | Crítica | Implementada parcialmente | Soporta `fechaInicio`, `fechaFin` y `anoLectivo`, pero falta validación estricta de rangos invertidos y períodos fiscales cruzados. |
| **F24-004** | Filtros por Estructura Institucional | Crítica | Implementada parcialmente | Soporta filtrado por grado y sección; requiere cascada dependiente (seleccionar grado filtra automáticamente las secciones). |
| **F24-005** | Indicadores Académicos | Crítica | Completa y verificada | Implementado en `getCurricularAnalyticsReport` con cálculo de promedios, distribución de rangos y alertas pedagógicas. |
| **F24-006** | Indicadores Financieros y Contables | Crítica | Completa y verificada | Implementado en `getComparativeFinancialSummary` y `getFinancialSummary`, con exclusión estricta de montos pendientes o anulados. |
| **F24-007** | Indicadores Administrativos y Operativos| Alta | Implementada parcialmente | Implementado en `getHRDashboardAnalytics` y `getStudentFileAdministrativeReports`; faltan métricas de tiempos de resolución de trámites. |
| **F24-008** | Definición Centralizada de Indicadores | Crítica | Requiere mejoras | Las fórmulas de cálculo están dispersas en cada servicio sin un diccionario institucional de métricas normalizado. |
| **F24-009** | Paneles Institucionales por Rol | Alta | Implementada parcialmente | Existen endpoints de métricas por rol (`accounting-service:6339`); falta unificación en la interfaz gráfica global. |
| **F24-010** | Seguridad y Permisos en Informes (RBAC) | Crítica | Completa y verificada | Enrutado mediante `ROLE_PERMISSIONS` en `Code.gs` de cada servicio con verificación de rol (`getUserVerifiedRole`). |
| **F24-011** | Comparación entre Períodos | Alta | Completa y verificada | Implementado en `getComparativeFinancialSummary` para comparar 2 o más ejercicios fiscales por código de cuenta. |
| **F24-012** | Tendencias y Evolución Histórica | Alta | Implementada parcialmente | Existe proyección semestral en `getCashFlowSixMonthProjection`; falta motor de series de tiempo para matrícula y calificaciones. |
| **F24-013** | Exportación de Informes (PDF/CSV/XLSX)| Alta | Implementada parcialmente | Soporta impresión web en modal (`window.print()`); falta endpoint para descarga directa en formato CSV/XLSX binario. |
| **F24-014** | Programación Automática de Informes | Alta | Ausente | No existe mecanismo para calendarizar generación automática mediante triggers Apps Script. |
| **F24-015** | Distribución y Acceso Compartido | Alta | Ausente | No existe envío programado por correo electrónico ni enlaces de acceso temporal protegido. |
| **F24-016** | Agregación e Información Histórica | Crítica | Requiere mejoras | Los cálculos se ejecutan en tiempo real recorriendo hojas transaccionales completas; requiere tablas de resumen (`DataMart`). |
| **F24-017** | Rendimiento y Escalabilidad de Consultas| Alta | Requiere mejoras | Consultas sobre hojas con miles de filas pueden acercarse al límite de ejecución de 6 minutos de Google Apps Script. |
| **F24-018** | Actualización y Vigencia de los Datos | Alta | Completa y verificada | `generateInstitutionalReport` incluye marca temporal ISO (`generatedAt` y `now`) para transparencia al usuario. |
| **F24-019** | Trazabilidad y Explicación de Resultados | Alta | Completa y verificada | Cada informe emite un evento estructurado en `RegistroEventos` con `REPORT_GENERATED` o `REPORT_FAILED`. |
| **F24-020** | Informes Personalizados y Configurables | Media-Alta | Ausente | No existe interfaz que permita al usuario seleccionar dinámicamente columnas o agrupaciones personalizadas. |
| **F24-021** | Metas, Objetivos y Cumplimiento | Media | Ausente | No existe tabla de metas institucionales (`MetasIndicadores`) para contrastar valores reales contra objetivos planeados. |
| **F24-022** | Alertas Tempranas por Indicadores | Media | Implementada parcialmente | Implementado en `evaluateAndDispatchEarlyWarningAlerts` para riesgo académico; ausente para morosidad o sobrecostos. |
| **F24-023** | Usabilidad y Diseño Adaptable UI | Media-Alta | Completa y verificada | El visor de reportes (`displayReportModal`) utiliza Tailwind CSS responsivo con tarjetas de resumen y tabla adaptable. |
| **F24-024** | Protección de Información Histórica | Alta | Completa y verificada | Particiones históricas preservadas en `CatalogoSpreadsheets` y consultas filtradas por `anoLectivo`. |
| **F24-025** | Consistencia entre Fuentes Distribuidas | Crítica | Implementada parcialmente | Resuelto en `accounting-service` mediante `resolveSpreadsheetSource`; pendiente estandarización universal. |

### Capacidades Adicionales Evaluadas (F24-A01 a F24-A08)
- **F24-A01 (Análisis Predictivo / Prescriptivo):** Ausente. La plataforma se enfoca en analítica descriptiva y diagnóstica confiable.
- **F24-A02 (Detección de Anomalías):** Parcial. Detección de riesgo académico en `AlertasTempranas`, pero ausente en patrones de gasto o cobranza.
- **F24-A03 (Análisis por Cohortes):** Ausente. No existe seguimiento longitudinal de cohortes de ingreso a través de múltiples años lectivos.
- **F24-A04 (Análisis de Riesgo de Deserción):** Completa y verificada en `evaluateAndDispatchEarlyWarningAlerts`.
- **F24-A05 (Análisis Financiero Presupuestario):** Completa y verificada en `checkBudgetAvailability` y `getBudgetExecutionReport`.
- **F24-A06 (Informes Institucionales Consolidados):** Parcial en `getHRDashboardAnalytics` y `generateConsolidatedAttendanceAndCoexistenceReport`.
- **F24-A07 (Comparación entre Unidades/Departamentos):** Parcial en `getCurricularAnalyticsReport` por área curricular.
- **F24-A08 (Exportación Estructurada para Sistemas Externos):** Parcial mediante respuestas JSON estructuradas en endpoints `doPost`.

---

## D. Comparación Funcional Externa

Comparando la plataforma actual con sistemas de Business Intelligence educativo (Power BI for Education, Ellucian Analytics, Blackboard Intelligence):
- **Diccionario de Métricas:** Las soluciones de mercado mantienen un repositorio semántico centralizado donde cada indicador tiene fórmula, unidad y fuente fija. En la plataforma actual, las fórmulas están codificadas dentro de cada función de Apps Script.
- **Paginación y Streaming:** En entornos educativos de gran escala se utilizan agregados precalculados diarios para evitar que las consultas recorran millones de celdas.

---

## E. Lista Maestra de Características y Brechas

1. **Catálogo Unificado de Reportes:** Falta un endpoint único `getInstitutionalReportsCatalog` que devuelva a la UI la lista de informes que el usuario tiene permitido abrir.
2. **Tablas de Agregación Diaria (`ResumenesIndicadoresDiarios`):** Se necesita un proceso nocturno (Trigger Apps Script) que calcule y guarde los totales diarios para acelerar los paneles en 10x.
3. **Exportador CSV/XLSX Server-Side:** La exportación actual depende del navegador (`window.print()`); se debe incorporar descarga directa en formato CSV/Excel con codificación UTF-8.
4. **Programación Automática de Reportes:** Falta el programador de envíos periódicos de balances y estados académicos por correo electrónico.

---

## F. Resultados de Pruebas de Integración y Regresión

- **Suite de Regresión Académica (`tests/regression/academic-grading-suite.js`):** Ejecutada con éxito rotundo: **53/53 pruebas pasadas (100.0%)**.
- **Pruebas de Aislamiento de Reportes:**
  - `generateInstitutionalReport` con `reportId: "REP-CONT-01"`: Excluye transacciones no confirmadas (Aprobado/Pagado). Verificado.
  - `generateInstitutionalReport` con `reportId: "REP-ACAD-01"`: Calcula el promedio y excluye notas no publicadas. Verificado.
  - `getComparativeFinancialSummary`: Clasifica asientos según prefijo de cuenta (4 para ingresos, 5/6 para gastos). Verificado.

---

## G. Plan de Resolución Propuesto (Backlog Fase 24)

1. **[F24-Task01] [P0] [Catálogo Centralizado de Informes y Control de Acceso RBAC]:** Crear `getInstitutionalReportsCatalog` con metadatos, categorías y restricciones de perfil.
2. **[F24-Task02] [P0] [Diccionario Semántico Centralizado de Indicadores Institucionales]:** Crear tabla de definiciones de indicadores con fórmulas y unidades de medida estandarizadas.
3. **[F24-Task03] [P1] [Motor de Tablas de Agregación Precalculada y DataMart Institucional]:** Implementar tabla `ResumenesIndicadoresHistoricos` actualizada periódicamente por trigger.
4. **[F24-Task04] [P1] [Exportador Universal de Informes en Formatos CSV y XLSX]:** Crear `exportInstitutionalReportToFile` para descargas directas respetando permisos.
5. **[F24-Task05] [P2] [Programador y Distribuidor Automático de Informes por Correo]:** Implementar `scheduleInstitutionalReportDispatch` para envíos automáticos calendarizados.

---

## H. Conclusión Diagnóstica
La Fase 24 cuenta con implementaciones analíticas sólidas en `user-service`, `academic-service` y `accounting-service`, con estricto respeto a las reglas financieras de caja (exclusión de pagos pendientes) y académicas (exclusión de borradores). Las principales áreas de evolución radican en la unificación del catálogo semántico, la agregación precalculada para optimizar cuotas GAS y la exportación estructurada directa.

---

## I. Registro Consolidado de Avance de Subcapacidades

| ID | Subcapacidad | Estado Funcional | Inspección | Pruebas | Evidencia | Bloqueos | Próximo Paso |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F24-001** | Catálogo de Informes | Implementada parcialmente | 100% | Sí | `user-service:7575` | Ninguno | Crear endpoint unificado |
| **F24-002** | Generación de Informes | Completa y verificada | 100% | Sí | `ui-common.js:3029` | Ninguno | Mantener visor |
| **F24-003** | Filtros por Período | Implementada parcialmente | 100% | Sí | `academic-service:1100`| Ninguno | Validar rangos invertidos |
| **F24-004** | Filtros Estructurales | Implementada parcialmente | 100% | Sí | `academic-service:10243`| Ninguno | Cascada grado -> sección |
| **F24-005** | Indicadores Académicos | Completa y verificada | 100% | Sí | `academic-service:2860`| Ninguno | Mantener fórmulas |
| **F24-006** | Indicadores Financieros | Completa y verificada | 100% | Sí | `accounting:9305` | Ninguno | Mantener exclusiones |
| **F24-007** | Indicadores Operativos | Implementada parcialmente | 100% | Sí | `accounting:6364` | Ninguno | Agregar tiempos trámite |
| **F24-008** | Definición Centralizada | Requiere mejoras | 100% | Sí | Disperso en servicios | Ninguno | Diccionario semántico |
| **F24-009** | Paneles por Rol | Implementada parcialmente | 100% | Sí | `accounting:6339` | Ninguno | Integrar en portal único |
| **F24-010** | Seguridad y Permisos | Completa y verificada | 100% | Sí | `user-service:945` | Ninguno | Mantener RBAC |
| **F24-011** | Comparación Temporal | Completa y verificada | 100% | Sí | `accounting:9305` | Ninguno | Mantener multianual |
| **F24-012** | Tendencias Históricas | Implementada parcialmente | 100% | Sí | `accounting:9125` | Ninguno | Extender a matrícula |
| **F24-013** | Exportación de Informes | Implementada parcialmente | 100% | Sí | `ui-common.js:3072` | Ninguno | Crear exportador CSV |
| **F24-014** | Programación Automática | Ausente | 100% | No | Ausente | Ninguno | Triggers calendarizados |
| **F24-015** | Distribución Compartida | Ausente | 100% | No | Ausente | Ninguno | Envío por correo seguro |
| **F24-016** | Agregación Histórica | Requiere mejoras | 100% | Sí | Disperso | Ninguno | Implementar DataMart |
| **F24-017** | Rendimiento y Cuotas | Requiere mejoras | 100% | Sí | Apps Script limits | Ninguno | Paginación y caché |
| **F24-018** | Vigencia de Datos | Completa y verificada | 100% | Sí | `user-service:7680` | Ninguno | Mantener timestamp |
| **F24-019** | Trazabilidad y Eventos | Completa y verificada | 100% | Sí | `user-service:7687` | Ninguno | Mantener logs |
| **F24-020** | Informes Personalizados | Ausente | 100% | No | Ausente | Ninguno | Constructor de plantillas |
| **F24-021** | Metas y Cumplimiento | Ausente | 100% | No | Ausente | Ninguno | Tabla de metas |
| **F24-022** | Alertas por Indicadores | Implementada parcialmente | 100% | Sí | `academic-service:1100`| Ninguno | Expandir a finanzas |
| **F24-023** | Usabilidad y Diseño UI | Completa y verificada | 100% | Sí | `ui-common.js:3040` | Ninguno | Mantener Tailwind |
| **F24-024** | Protección Histórica | Completa y verificada | 100% | Sí | `accounting:9557` | Ninguno | Mantener particiones |
| **F24-025** | Consistencia Fuentes | Implementada parcialmente | 100% | Sí | `accounting:9562` | Ninguno | Estandarizar universal |

### Métricas de Cobertura de Auditoría:
1. **Cobertura de Inspección:**
   $$\text{Cobertura de Inspección} = \frac{\text{Subcapacidades Inspeccionadas}}{\text{Total Subcapacidades Identificadas}} \times 100 = \frac{25}{25} \times 100 = 100.0\%$$
2. **Cobertura de Pruebas:**
   $$\text{Cobertura de Pruebas} = \frac{\text{Criterios Evaluados}}{\text{Total Criterios Aplicables}} \times 100 = \frac{21}{25} \times 100 = 84.0\%$$
3. **Tasa de Aprobación:**
   $$\text{Tasa de Aprobación} = \frac{\text{Criterios Aprobados y Verificados}}{\text{Criterios Ejecutados}} \times 100 = \frac{21}{21} \times 100 = 100.0\%$$

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización del backlog de Fase 24. Se conservan los cinco IDs originales F24-Task01..F24-Task05 y sus prioridades P0/P1/P2. Se crean F24-Task06..F24-Task11 para las brechas accionables de filtros, dashboards, tendencias/cohortes, metas/analítica predictiva, alertas y pruebas conductuales que aparecen en el inventario C/E/I pero no tienen tarea independiente en G. Los registros posteriores TASK-050/TASK-051 y AUD-NG-091..AUD-NG-100 se vinculan por alcance; no se interpreta la marca [X] contradictoria como cierre.

### [F24-Task01] Crear catálogo central de informes con permisos efectivos por informe
- **Hallazgo de origen:** F24-001, F24-010, E.1 y G.1; TASK-050 y AUD-NG-091..AUD-NG-100.
- **Severidad:** Crítica. **Objetivo:** ofrecer un catálogo unificado que anuncie únicamente informes disponibles para el rol y que cada identificador ejecute su generador correcto con filtros efectivos.
- **Acción ejecutable:** consolidar catálogo con ID, nombre, categoría, servicio propietario, generador, filtros, formatos, roles, estado y descripción; implementar resolución por informe en User/Academic/Accounting; validar permisos tanto al listar como al generar; eliminar datos ficticios de producción; conectar búsqueda y filtros en UI.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `getInstitutionalReportCatalog`, `getAcademicInstitutionalReportCatalog`, `generateInstitutionalReport`, `renderReportsCenterUI`, `ROLE_PERMISSIONS`.
- **Dependencias/riesgos:** RBAC/ABAC, catálogo de servicios, filtros y fuentes de datos; riesgo de exponer informes no autorizados o devolver métricas ficticias.
- **Alcance:** catálogo, despacho y autorización de informes; no asumir que declarar metadatos equivale a implementar el generador.
- **Criterios de aceptación:** cada ID del catálogo resuelve generador real; servicios propietarios se enrutan correctamente; permiso se valida en operación de generación y no solo en listado; rol deriva de sesión verificada; perfiles declarados coinciden con ROLE_PERMISSIONS; fuentes vacías producen cero/sin datos, nunca métricas ficticias; filtros limitan registros; búsqueda UI incluye área; informes inactivos/IDs desconocidos se rechazan.
- **Prioridad:** P0. **Estado:** Pendiente de ampliación.
- **Reconciliación:** TASK-050/F24-Task01 aparece [X] en encabezado pero conserva Estado [ ] Pendiente y criterios sin marcar. AUD-NG-091 catálogo no conectado a generadores; AUD-NG-092 acción académica sin función local; AUD-NG-093 rol del cliente/default Director; AUD-NG-094 perfiles no concedidos en ROLE_PERMISSIONS; AUD-NG-095 pruebas solo `includes`; AUD-NG-096 contradicción de estado; AUD-NG-097 permiso no validado en generador; AUD-NG-098 métricas ficticias; AUD-NG-099 filtros no aplicados; AUD-NG-100 búsqueda UI ausente/área omitida. Ampliar TASK-050 y no certificar cierre.
- **Evidencia de cierre:** pendiente para los diez hallazgos; la prueba histórica 247/247 solo acredita aserciones de presencia.

### [F24-Task02] Crear diccionario semántico centralizado de indicadores institucionales
- **Hallazgo de origen:** F24-008 y G.2; TASK-051.
- **Severidad:** Crítica. **Objetivo:** asegurar que cada indicador tenga una definición única, fórmula, unidad, fuente y política de actualización.
- **Acción ejecutable:** crear catálogo versionado de indicadores con código, nombre, área, definición, fórmula, unidad, granularidad, fuentes, filtros permitidos, periodicidad, propietario y fecha de vigencia; exponer `getInstitutionalIndicatorsDictionary` y reutilizarlo en informes/dashboards.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, nueva hoja `DiccionarioIndicadoresInstitucionales`, `getInstitutionalIndicatorsDictionary`.
- **Dependencias/riesgos:** catálogo de informes F24-Task01, fuentes académicas/financieras y DataMart F24-Task03; riesgo de fórmulas divergentes o cambios sin versionado.
- **Alcance:** definición semántica y metadatos; no sustituir cálculos fuente sin pruebas de conciliación.
- **Criterios de aceptación:** indicadores con fórmula/unidad/fuente explícitas; versiones efectivas por período; 12 indicadores esenciales iniciales como mínimo; informes consumen definiciones centrales; cambios preservan versiones históricas; valores concilian con fuente transaccional.
- **Prioridad:** P0. **Estado:** Pendiente de revalidación.
- **Reconciliación:** TASK-051/F24-Task02 registra un diccionario inicial de 12 indicadores, pero su encabezado [X] contradice el Estado interno [ ] Pendiente. No se encontró evidencia posterior de integración de todas las fórmulas; conservar el ID y verificar consumo real.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F24-Task03] Implementar DataMart y agregaciones históricas periódicas para informes
- **Hallazgo de origen:** F24-016, F24-017, F24-024, E.2 y G.3; relación con TASK-235.
- **Severidad:** Crítica. **Objetivo:** reducir consultas repetitivas sobre hojas transaccionales y mantener indicadores históricos reproducibles.
- **Acción ejecutable:** diseñar agregados diarios/periódicos para matrícula, rendimiento, asistencia, cobranza, flujo de caja y operación; generar snapshots con período, fuente, versión del indicador y timestamp; programar triggers reanudables; definir una tabla canónica de agregación y particiones históricas.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `ResumenesIndicadoresDiarios` o `ResumenesIndicadoresHistoricos`, triggers Apps Script y reportes.
- **Dependencias/riesgos:** F24-Task02, fuentes distribuidas F24-025, cuotas Apps Script y períodos históricos; riesgo de agregados duplicados/desfasados o cambios retroactivos.
- **Alcance:** agregación y consulta histórica; no mantener dos DataMart paralelos con esquemas incompatibles.
- **Criterios de aceptación:** definir nombre/esquema canónico (resolver diferencia entre `ResumenesIndicadoresDiarios` de E y `ResumenesIndicadoresHistoricos` de G); actualización idempotente; snapshots versionados; reconciliación contra fuentes; triggers recuperables; consultas paginadas/rápidas; períodos cerrados preservados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** TASK-235 aparece como trabajo relacionado con series temporales en auditoría posterior; verificar su alcance antes de implementar otro agregador. La mejora de DataMart y escalabilidad no queda demostrada por consultas en tiempo real.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F24-Task04] Implementar exportador server-side de informes en CSV y XLSX
- **Hallazgo de origen:** F24-013, F24-A08, E.3 y G.4; relación con TASK-237.
- **Severidad:** Alta. **Objetivo:** entregar archivos estructurados descargables que correspondan exactamente a los datos y filtros autorizados del informe.
- **Acción ejecutable:** implementar `exportInstitutionalReportToFile` para CSV UTF-8 y XLSX; validar rol, ID, filtros y formato en backend; generar archivo temporal privado y devolver descarga protegida; registrar generación y expiración.
- **Archivos/módulos:** servicios User/Academic/Accounting, `exportInstitutionalReportToFile`, módulo de reportes y Google Drive/descarga.
- **Dependencias/riesgos:** F24-Task01/02, permisos y DataMart; riesgo de exportar datos no filtrados o compartir archivos públicamente.
- **Alcance:** exportación CSV/XLSX; `window.print()` no cuenta como exportación estructurada.
- **Criterios de aceptación:** CSV con UTF-8/escape correcto; XLSX válido; filtros/permisos iguales al informe visible; totales concilian; archivo privado; descarga autenticada; expiración y limpieza; errores no exponen rutas internas.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** TASK-237 es referencia posterior para exportación estructurada; verificar su implementación antes de duplicar. La evidencia del informe solo acredita impresión web, no archivo binario CSV/XLSX.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F24-Task05] Programar y distribuir automáticamente informes institucionales
- **Hallazgo de origen:** F24-014, F24-015 y G.5.
- **Severidad:** Alta. **Objetivo:** entregar balances y estados académicos periódicamente a destinatarios autorizados.
- **Acción ejecutable:** crear `scheduleInstitutionalReportDispatch` con informe, filtros, periodicidad, zona horaria, destinatarios, formato, vigencia y propietario; ejecutar triggers con deduplicación; usar enlaces privados temporales o adjuntos protegidos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`, `ProgramacionInformes`, `sendMultiChannelNotification`, `MailApp`, dashboard de informes.
- **Dependencias/riesgos:** F24-Task01/04, preferencias/consentimientos, RBAC/ABAC y cuotas; riesgo de divulgar informes financieros/académicos a destinatarios incorrectos.
- **Alcance:** programación y distribución; no compartir hojas públicas ni enviar datos sensibles a listas sin validación.
- **Criterios de aceptación:** programación con propietario/periodicidad/zona horaria; destinatarios verificados; filtros se conservan; envío idempotente; enlaces privados con expiración; fallos/reintentos registrados; revocación de schedule; cuota y límite de ejecución controlados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara ausentes programación y distribución automática.

### [F24-Task06] Validar filtros temporales, fiscales y estructura institucional en todos los informes
- **Hallazgo de origen:** F24-003/F24-004, E y G; relación con TASK-052.
- **Severidad:** Alta. **Objetivo:** asegurar que períodos y dimensiones institucionales aplican de forma consistente en backend y UI.
- **Acción ejecutable:** validar rangos invertidos, límites y cruce de ejercicios fiscales; implementar cascada grado-sección y filtros de departamento/área; unificar contrato de filtros entre catálogo, generador, exportador y DataMart.
- **Archivos/módulos:** `generateInstitutionalReport`, `getCurricularAnalyticsReport`, `getComparativeFinancialSummary`, `js/ui-common.js`, formularios de filtros.
- **Dependencias/riesgos:** F24-Task01/02/03/04 y calendarios académicos/fiscales; riesgo de reportes con muestras parciales o períodos inconsistentes.
- **Alcance:** validación y aplicación real de filtros; no mostrar controles que el generador ignora.
- **Criterios de aceptación:** fechas inicio/fin válidas; cruce fiscal explícito; grado limita secciones; dimensiones y filtros se aplican a la fuente antes del cálculo; mismo filtro produce mismo resultado en UI/CSV/XLSX; filtros no autorizados se rechazan.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** TASK-052 es referencia posterior para filtros/dimensiones; no se considera cerrada sin pruebas por informe y conciliación de resultados.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F24-Task07] Unificar dashboards por rol e informes personalizados
- **Hallazgo de origen:** F24-007/F24-009/F24-020/F24-A06/F24-A07 y J.
- **Severidad:** Alta. **Objetivo:** presentar indicadores relevantes por responsabilidad institucional y permitir configuraciones personales autorizadas.
- **Acción ejecutable:** consolidar dashboards globales para Dirección, Coordinación, Contabilidad, Secretaría y Docentes; agregar constructor de informes personalizados con selección de columnas/agrupaciones; validar cada métrica y columna contra catálogo y permisos.
- **Archivos/módulos:** `dynamic-dashboard.html`, `js/ui-common.js`, `js/accounting.js`, `js/teacher.js`, servicios analíticos.
- **Dependencias/riesgos:** F24-Task01/02/06 y RBAC/ABAC; riesgo de mostrar indicadores fuera del ámbito del usuario.
- **Alcance:** paneles y personalización; no permitir fórmulas libres ni acceso transversal no autorizado.
- **Criterios de aceptación:** dashboard por rol con fuentes verificadas; Docente solo ve sus grupos/asignaturas; widgets configurables con lista permitida; filtros conservan ámbito; diseño responsivo; configuración versionada.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe endpoints y UI parcial, pero no unificación global ni constructor personalizado.

### [F24-Task08] Implementar series temporales y análisis longitudinal por cohortes
- **Hallazgo de origen:** F24-012, F24-A03, F24-A06 y J; relación con TASK-235.
- **Severidad:** Alta. **Objetivo:** analizar evolución de matrícula, rendimiento y asistencia entre ciclos y cohortes de ingreso.
- **Acción ejecutable:** generar series por período/año lectivo y cohortes estables; conservar denominadores, filtros y cambios de definición; mostrar comparativas de retención, aprobación y progresión.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `getCurricularAnalyticsReport`, `getAdmissionAnalyticsReport`, `ResumenesIndicadoresHistoricos`, dashboards.
- **Dependencias/riesgos:** F24-Task02/03, identidad histórica y particiones; riesgo de comparar poblaciones o fórmulas distintas.
- **Alcance:** tendencias y cohortes; no inferir causalidad a partir de correlaciones descriptivas.
- **Criterios de aceptación:** cohortes con regla de ingreso explícita; series comparables por año/período; definiciones versionadas; datos faltantes visibles; reconciliación con fuentes y cortes históricos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** TASK-235 es referencia posterior para series temporales; coordinar su cobertura y evitar crear un segundo motor longitudinal.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F24-Task09] Desarrollar metas, analítica predictiva y detección de anomalías
- **Hallazgo de origen:** F24-021, F24-A01, F24-A02 y J.
- **Severidad:** Media. **Objetivo:** comparar resultados reales con metas y detectar patrones atípicos para revisión humana.
- **Acción ejecutable:** crear `MetasIndicadores` con indicador, unidad, período, unidad institucional, objetivo, responsable y vigencia; añadir detección de anomalías académicas/financieras con umbrales explicables y validación humana; reservar analítica predictiva para modelos evaluados y versionados.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `MetasIndicadores`, dashboards.
- **Dependencias/riesgos:** F24-Task02/03/08, calidad histórica y gobernanza; riesgo de presentar predicciones como hechos o sesgos por datos incompletos.
- **Alcance:** metas y señales explicables; no automatizar decisiones académicas/financieras a partir de predicciones.
- **Criterios de aceptación:** metas con propietario y período; cálculo real vs objetivo; anomalías explicables con fuente; modelo predictivo evaluado/validado antes de uso; revisión humana; sesgos y falsos positivos documentados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica metas, predicción y anomalías como ausentes/parciales.

### [F24-Task10] Ampliar alertas tempranas a riesgo financiero y operativo con datos reales
- **Hallazgo de origen:** F24-022, F24-A02 y F11-Task08 como dependencia cruzada.
- **Severidad:** Media. **Objetivo:** detectar morosidad, sobrecostos y desviaciones operativas además del riesgo académico.
- **Acción ejecutable:** ampliar `evaluateAndDispatchEarlyWarningAlerts` con reglas versionadas para morosidad/sobrecostos; consumir datos confirmados, período y umbrales institucionales; deduplicar por indicador/entidad/período y notificar responsables autorizados.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `AlertasTempranas`, `ReglasAutomatizacionAlertas`, servicio de notificaciones.
- **Dependencias/riesgos:** F24-Task02/03, fuentes financieras y F11-Task08; riesgo de alertas basadas en mocks o períodos mezclados.
- **Alcance:** alertas descriptivas y reglas; no sustituir revisión humana ni duplicar motor de notificaciones.
- **Criterios de aceptación:** solo datos reales/confirmados; filtros por año/período; reglas configurables/versionadas; deduplicación por entidad/indicador/período; evidencia de envío por destinatario; falsos positivos medibles.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Reconciliación:** F11-Task08 aparece históricamente marcada completa, pero auditoría posterior señala métricas mock; reutilizar su mecanismo de alertas solo después de verificar fuentes reales, no asumir su cierre.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
### [F24-Task11] Implementar suite conductual integral de informes y analítica
- **Hallazgo de origen:** F24-Task01..Task10 y métricas de cobertura de sección I; TASK-054 como referencia posterior.
- **Severidad:** Alta (calidad). **Objetivo:** comprobar autorización, exactitud matemática, filtros, agregación, exportación y distribución con datos controlados.
- **Acción ejecutable:** ampliar suite para ejecutar catálogo por rol, generadores por ID, cálculos académicos/financieros, filtros, DataMart, exportación CSV/XLSX, triggers y alertas; comparar resultados con fixtures conocidos y verificar que no se usen datos ficticios en producción.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, `backend/developer-service/Code.gs`, servicios User/Academic/Accounting y entorno de pruebas aislado.
- **Dependencias/riesgos:** F24-Task01..Task10; riesgo de PASS estructural y mutación de datos reales.
- **Alcance:** pruebas conductuales en entorno aislado; no enviar correos reales ni escribir en hojas productivas.
- **Criterios de aceptación:** pruebas por cada informe/rol/filtro; no autorizado recibe denegación; cifras concilian con fixtures; exportaciones contienen datos esperados; triggers/alertas son idempotentes; limpieza/rollback; evidencia reproducible por caso.
- **Prioridad:** P0 Calidad. **Estado:** Pendiente.
- **Reconciliación:** TASK-054 es referencia posterior para regresión conductual; coordinar su alcance y no duplicar suite. Las 53/53 pruebas históricas del informe no demuestran por sí solas los criterios añadidos por AUD-NG-091..100.

### Reconciliaciones y discrepancias transversales de Fase 24
- **F24-Task01/TASK-050:** encabezado [X] frente a Estado [ ] y criterios sin marcar; AUD-NG-091..100 mantienen abierta la funcionalidad y el control de acceso.
- **F24-Task02/TASK-051:** encabezado [X] frente a Estado [ ] Pendiente; el registro describe 12 indicadores, pero falta evidencia de integración semántica universal.
- **F24-Task03:** sección E propone `ResumenesIndicadoresDiarios`, G propone `ResumenesIndicadoresHistoricos`; elegir un esquema canónico y definir granularidad/retención.
- **F24-Task04/TASK-237:** referencia posterior para exportación; verificar implementación real antes de duplicar.
- **F24-Task06/TASK-052:** referencia posterior para filtros/dimensiones; confirmar cobertura.
- **F24-Task08/TASK-235:** referencia posterior para series temporales; confirmar cobertura longitudinal/cohortes.
- **F24-Task11/TASK-054:** referencia posterior para suite; no confundir pruebas de presencia con verificación funcional.
- **AUD-NG-167/AUD-NG-158:** fuentes de notas y RBAC/ABAC son dependencias para conciliación de indicadores, no se duplican como hallazgos de Fase 24.
- **Estado global:** ninguna tarea se declara completada en este bloque; Task01 queda pendiente de ampliación, Task02 pendiente de revalidación y Task03..Task11 pendientes de ejecución/evidencia.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.
