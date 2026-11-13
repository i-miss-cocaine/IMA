# Investigación de arquitectura universal multiinstitucional IMA

**Diseño:** TASK-694 · **Fecha:** 2026-11-10  
**Cobertura:** primera infancia, prebásica, básica, media, formación técnica, educación superior universitaria/no universitaria, educación adulta y continua.

## 1. Método y alcance
Se priorizó documentación oficial de producto, estándares y fuentes oficiales hondureñas. La muestra es representativa, no exhaustiva. Las páginas comerciales describen capacidades declaradas, no prueban arquitectura interna, seguridad o cumplimiento legal. La investigación no sustituye la inspección de código, esquemas y datos reales de IMA.

## 2. Plataformas investigadas

### Primera infancia
**Procare, Famly y brightwheel:** registro de niños/familias; admisión y listas de espera; aulas, grupos, turnos y capacidad; asistencia y entrada/salida; proporciones niño-personal; horarios de personal; actividades y currículo inicial; observaciones e hitos de desarrollo; contactos y recogidas autorizadas; salud, alergias, vacunas e incidentes; comunicación familiar; cobros, pagos y reportes; operación multi-centro.

**Implicación:** primera infancia no es simplemente un grado escolar. Hitos de desarrollo, asistencia por sesión, autorizaciones de recogida y salvaguarda son dominios propios. Salud y protección infantil requieren clasificación reforzada.

### K–12: prebásica, primaria, básica, secundaria y media
**PowerSchool, Infinite Campus, Skyward, Synergy SIS, eSchoolPLUS, SIMS, Arbor Education, Sentral, ManageBac, iSAMS, Ed-admin, openSIS, Gibbon y RosarioSIS.**

Capacidades comunes SIS: identidad y datos del estudiante; relaciones familiares; admisión, matrícula, reinscripción, traslado, retiro y promoción; centros/sedes, calendarios y años lectivos; niveles, grados, grupos, secciones, asignaturas, cursos y horarios; asignación docente; asistencia diaria y por periodo; evaluaciones, escalas, notas, boletines, expedientes, certificados e informes; portales y comunicación familiar.

openSIS documenta una secuencia de calendario, periodos, niveles, bloques horarios, cursos, secciones, horarios docentes y horarios de estudiantes antes de asistencia y calificación. Gibbon y RosarioSIS aportan referencias abiertas de gestión escolar y reportes por perfil. Infinite Campus ilustra la convergencia de SIS con servicios complementarios.

### Formación técnica y vocacional
**Frappe Education/ERPNext, openSIS y Open edX:** programas, módulos, cursos, cohortes y grupos; matrícula por programa/periodo; cursos obligatorios y electivos; cupos, instructores y horarios; competencias, resultados, rúbricas, prácticas y evidencias; certificados y microcredenciales; integración financiera.

IMA no debe asumir que todo programa tiene grados escolares o créditos universitarios: admitir horas, módulos, competencias y unidades configurables.

### Educación superior
**Workday Student, Ellucian Banner, Oracle PeopleSoft Campus Solutions, Anthology Student, Frappe Education/ERPNext y openSIS.**

Workday Student documenta base académica, captación/admisión, currículo/registro, expedientes, asesoría, ayuda financiera y finanzas estudiantiles. Ellucian Banner documenta admisión, inscripción, resultados, catálogo, programación, asesoría, auditoría de grado, planificación de programas, cuentas por cobrar y autoservicio. Frappe Education relaciona departamento, programa, curso, año/periodo, matrícula, grupo e instructor.

Capacidades: facultades/escuelas/departamentos/campus; programas, carreras, planes y versiones curriculares; cursos, créditos, prerrequisitos, equivalencias y electivos; periodos; oferta, secciones, cupos, horarios, docentes y matrículas; historial de intentos, notas, créditos, promedio y expediente; asesoría, avance y requisitos de graduación; prácticas, investigación, movilidad, becas, títulos y credenciales.

No todas las instituciones usan facultades, semestres, créditos o carreras. No deben ser campos obligatorios de la jerarquía organizativa general.

### LMS y ecosistemas
**Moodle, Canvas LMS, D2L Brightspace, Blackboard Learn y Open edX.**
- Moodle: roles/capacidades en contextos de sistema, usuario, categoría, curso, actividad y bloque.
- Canvas: cuentas raíz, subcuentas, cursos y secciones; administración restringible a subcuentas.
- Brightspace: unidades organizativas, roles, permisos y matrículas contextuales; tipos personalizados y cascada explícita.
- Blackboard: jerarquía institucional para facultades, departamentos, programas y cursos.
- Open edX: cursos, programas de grado, formación corporativa y aprendizaje a ritmo propio.

**Implicación:** SIS (registro oficial), LMS (enseñanza/actividad), ERP y portales son dominios complementarios. Integrarlos no significa duplicar autoridad de matrícula, identidad, nota final o expediente.

### Honduras
SACE, según la Secretaría de Educación, automatiza administración de centros, registro, matrícula, evaluación y promoción; abarca prebásica, básica, media y superior no universitaria, e involucra unidades centrales, direcciones departamentales/municipales/distritales, centros, docentes y padres. Es referencia de localización hondureña, no modelo universal.

### Otras referencias
Google Workspace for Education ofrece unidades organizativas con herencia y excepciones de configuración. Califik y Edboox/Edubox quedan como referencias de mercado de control escolar/documentación, sin evidencia pública suficiente sobre su autorización interna. Odoo y ERP son referencias de multiempresa y segregación de funciones, no sustitutos de SIS.

## 3. Estándares
- **CEDS P-20W:** organizaciones, personas y relaciones a lo largo de educación inicial, K–12, postsecundaria, adultos y fuerza laboral.
- **Ed-Fi:** especificación interoperable principalmente K–12: organizaciones, calendarios, matrículas, estudiantes, personal, asistencia, evaluaciones, cursos, secciones y programas. No es software ni base de datos; admite extensiones jurisdiccionales.
- **1EdTech OneRoster 1.2:** personas, membresías, cursos, clases y resultados K–12.
- **Edu-API:** organizaciones, cursos, inscripciones y resultados superiores; la página consultada lo marca Candidate Final Public, verificar estado/versión antes de fijar conformidad.
- **LTI:** lanzamiento e integración segura de herramientas.
- **CASE:** estándares, competencias, habilidades y rúbricas.
- **QTI:** ítems, pruebas y resultados.
- **CLR/Open Badges:** credenciales portables y verificables.
- **Caliper Analytics:** eventos y analítica de aprendizaje.

**Decisión:** adaptadores versionados y mappings explícitos; ningún estándar externo sustituye el modelo interno de IMA.

## 4. Modelo universal propuesto

### 4.1 Frontera multiinstitucional
Plataforma IMA → Tenant → grupo/consorcio institucional opcional → Institución → sedes/campus/centros → unidades organizativas configurables. Los contextos académicos (nivel, grado, programa, plan, curso, oferta, sección, cohorte y periodo) se mantienen separados.

Un tenant puede contener una o varias instituciones; una institución puede tener varias sedes. La frontera tenant no se infiere de departamento/campus. Compartir datos entre instituciones exige relación, finalidad, permisos explícitos, vigencia, auditoría y revocación.

### 4.2 Cuatro estructuras separadas
1. Organización administrativa: gobierno y responsabilidad.
2. Estructura académica: niveles, programas, facultades, carreras, planes, cursos y periodos.
3. Estructura de enseñanza: grupos, aulas, secciones, cohortes, sesiones y asignaciones.
4. Estructura física: campus, edificios, aulas, laboratorios y ubicaciones.

Se conectan con referencias tipadas, no se fusionan en un único árbol departamental.

### 4.3 Organización extensible
Modelo conceptual: OrganizationNode (tenant/institución, tipo, padre, código, nombre, estado y vigencia); OrganizationType (tipos configurables); OrganizationRelation (adscripción, colaboración, dependencia funcional, coordinación o equivalencia); OrganizationMembership (persona, unidad, función y vigencia). El árbol debe impedir ciclos. Las relaciones matriciales se representan separadamente; no producen herencia implícita de permisos.

### 4.4 Núcleo académico
AcademicCalendar, AcademicYear, AcademicTerm/Period, EducationLevel, GradeLevel, Program, Curriculum/StudyPlan y versión, Course/Subject, CourseOffering, Section/ClassGroup/Cohort, Schedule/Session, Student/Learner, ProgramEnrollment, CourseEnrollment, TeachingAssignment, Assessment, GradingScheme, Result/Outcome, AcademicRecord y Credential/Award.

No todos los perfiles usan todas las entidades; créditos, grados, competencias, horas y escalas son configurables.

### 4.5 Identidad y trayectoria
Separar persona/identidad de membresías y matrículas. Un aprendiz puede tener varios periodos, programas e instituciones; conservar transferencias, equivalencias y credenciales sin sobrescribir historia. Tutores, contactos de emergencia, autorizados para recoger menores y responsables financieros son relaciones distintas con permisos/vigencias propios.

### 4.6 Propiedad y autorización
Cada recurso sensible debe resolver tenant propietario, institución, unidad propietaria si aplica, contexto académico, clasificación y retención. La propiedad no se deduce del creador, departamento del actor, rol, grado, sección o ubicación del archivo.

Acceso = identidad verificada + membresía activa + rol/capacidad + ámbito vigente + operación + propietario + clasificación. Denegar por defecto; no confiar en IDs/roles enviados por cliente. Herencia con dirección y cascada explícitas; asignación en unidad hija no concede permisos al padre ni a unidades hermanas.

### 4.7 Configuración y perfiles
Capas: defaults de plataforma → tenant → institución → unidad → contexto académico/programa → preferencias personales. Cada clave declara tipo, ámbitos permitidos, herencia, override, restricciones, roles autorizados, validación, versión, vigencia y origen del valor efectivo. Aislamiento, seguridad mínima, privacidad, integridad, retención obligatoria y auditoría no pueden relajarse desde unidades inferiores.

Perfiles combinables como plantillas, no forks: EarlyYears, K12, TVET, HigherEducation y AdultLearning. Habilitar un perfil no concede permisos automáticamente.

### 4.8 Localización, privacidad y accesibilidad
Configurar país, idioma, zona horaria, calendario, moneda, formatos, niveles oficiales, escalas, unidades de crédito/horas, currículo, reportes y políticas legales. FERPA es ejemplo estadounidense, no norma universal. Las reglas dependen de jurisdicción y contrato. Datos de menores, salud, orientación y apoyo requieren clasificación reforzada y mínimo acceso necesario. WCAG 2.2 será referencia de accesibilidad web/móvil.

## 5. Dominios lógicos
Tenant & Institution Registry; Organization & Membership; Identity & Access; Academic Core; Learner Records; Learning & Assessment; Early Years Operations; Student Services; Finance & Administration; Integration Hub; Configuration & Policy; Reporting & Analytics.

Este mapa no ordena dividir inmediatamente el código en doce microservicios. Primero verificar fronteras, contratos y persistencia reales de IMA.

## 6. Aprovisionamiento institucional
1. Crear tenant y modo de aislamiento.
2. Crear instituciones e IDs estables.
3. Definir país, idioma, zona horaria, calendario y perfil normativo.
4. Seleccionar perfiles y módulos.
5. Crear sedes y unidades.
6. Configurar niveles/programas, periodos, cursos, grupos y evaluación.
7. Definir roles, capacidades, ámbitos y delegaciones.
8. Registrar personas, usuarios, membresías y relaciones familiares.
9. Configurar documentos, privacidad, clasificación, retención y reportes.
10. Configurar integraciones y mappings.
11. Importar a staging, conciliar, revisar y aprobar.
12. Probar aislamiento y aceptación antes de operar.

Cada paso debe ser versionado, idempotente, auditable y reanudable; no crear datos productivos ficticios ni asignaciones globales por defecto.

## 7. Perfiles y capacidades

| Dominio | Primera infancia | K–12 | Técnico/vocacional | Superior | Continua |
|---|---|---|---|---|---|
| Admisión/matrícula | Alta | Alta | Alta | Alta | Variable |
| Familia/tutores | Alta | Alta | Opcional | Opcional | Opcional |
| Estructura | Edades/hitos | Niveles/grados | Módulos/cohortes | Programas/planes | Trayectorias |
| Calendario | Sesiones/turnos | Año/periodos | Cohortes/módulos | Semestres u otros | Flexible |
| Asistencia | Diaria/sesión | Día/clase | Sesión/práctica | Curso/sesión | Variable |
| Evaluación | Desarrollo | Escalas/notas | Competencias | Créditos/resultados | Competencias |
| Credenciales | Reportes | Certificados | Certificación | Títulos/créditos | Badges |

Plantilla inicial; no obliga a activar todos los dominios.

## 8. Subplan UNI-S01…UNI-S10
Claves locales, no IDs globales. Cada unidad futura requiere auditoría, checkpoint, pruebas locales y commit propio.

1. **UNI-S01 Tenant, grupo e institución.** Depende de puertas PM-01/TASK-153. Entregable: entidades, IDs, estados, membresías y provisioning. Aceptación: sin acceso cruzado por IDs/endpoints/búsquedas/exportaciones; tenant con una o varias instituciones; lifecycle y retención definidos.
2. **UNI-S02 Organización configurable.** Depende S01, TASK-506/171/668. Entregable: tipos, nodos, relaciones y vigencias. Aceptación: colegio, red, universidad multicampus y centro técnico; tipos personalizados; ciclos rechazados; relaciones matriciales separadas; permisos sin cascada implícita.
3. **UNI-S03 Núcleo académico P-20W.** Depende S01/S02, AUD-NG-164/TASK-005. Entregable: calendarios, periodos, niveles, programas, planes, cursos, ofertas, grupos y secciones. Aceptación: no imponer estructura única; separar curso/oferta/sección/matrícula; múltiples calendarios y unidades.
4. **UNI-S04 Identidad y trayectoria.** Depende S01/S03, TASK-153/F29-TASK17. Entregable: persona, estudiante, tutores, matrículas, transferencias e historial. Aceptación: historia longitudinal preservada; tutores y autorizados distintos; ambigüedades no fusionadas automáticamente.
5. **UNI-S05 Autorización y propiedad.** Depende S01–S04, TASK-153/TASK-060/F8-TASK09/TASK-668. Entregable: RBAC/ABAC, ownership, clasificación y delegación. Aceptación: aislamiento y ownership en endpoints, búsquedas, archivos y exportaciones; ámbito vigente; denegación por defecto.
6. **UNI-S06 Configuración y herencia.** Depende S01/S02, TASK-060/F26-TASK01. Entregable: catálogo de claves, políticas, resolver, versiones y rollback. Aceptación: herencia determinista; seguridad no sobrescribible; overrides auditados; compatibilidad migrada y probada.
7. **UNI-S07 Currículo, evaluación y credenciales.** Depende S03/S04, AUD-NG-164. Entregable: escalas, rúbricas, competencias, resultados, créditos/horas y credenciales. Aceptación: unidades configurables; currículo versionado; historia/procedencia preservadas.
8. **UNI-S08 Perfiles educativos.** Depende S03/S06/S07. Entregable: plantillas EarlyYears/K12/TVET/HigherEducation/AdultLearning. Aceptación: combinables sin forks; módulos no crean datos ficticios ni permisos automáticos.
9. **UNI-S09 Interoperabilidad.** Depende S03/S04/S07 y FASE2-T04. Entregable: mappings y adaptadores versionados. Aceptación: estándares aplicados según caso; idempotencia, conciliación y ausencia de duplicados.
10. **UNI-S10 Gobierno, migración y certificación.** Depende S01–S09 y tareas F29. Entregable: privacidad, retención, accesibilidad, staging, rollback y matriz de pruebas. Aceptación: pruebas multi-tenant/perfil, IDOR, herencia, expiración, transferencias, migración/restauración y WCAG 2.2 como referencia.

**Puertas:** TASK-153/PM-01 antes de cambiar ownership/scopes; S01 antes de todas; S02 antes de fijar relaciones organizativas; S03 antes de módulos académicos; S04/S05 antes de migrar expedientes; S06 antes de overrides productivos; S07/S08 antes de perfiles; S09 antes de sincronización externa; S10 antes de pilotos.

Se reutilizan TASK-153, TASK-060, F26-TASK01, TASK-506, TASK-171, TASK-668, AUD-NG-164, TASK-005, F8-TASK09, FASE2-T04 y F29-TASK17. No se duplican IDs ni se declaran completadas.

## 9. Riesgos y límites
- Autoridad de catálogos y propiedad de expedientes sigue bloqueada en C1.403/T153-S01.
- No se inspeccionaron filas productivas de Sheets/Drive ni todos los contratos reales.
- No se elige partición física, base de datos, microservicios, despliegue ni migración sin inventario técnico.
- Legislación, residencia, retención, consentimiento, escalas, calendario y currículo dependen de país/institución.
- Verificar versiones de estándares antes de fijar conformidad.
- No prometer equivalencia total con proveedores ni implementar todo en una versión.

## 10. Fuentes oficiales
**Plataformas:**  
Microsoft SIS: https://learn.microsoft.com/en-us/microsoft-365/education/guide/1-reference/baseline-reference-sis  
Infinite Campus: https://www.infinitecampus.com/products/student-information-system  
Procare: https://www.procaresoftware.com/solutions/child-care-centers/early-childhood-education/  
Famly: https://www.famly.co/us/platform/enrollment-attendance  
brightwheel: https://mybrightwheel.com/childcare-centers/center-management/  
openSIS: https://help.opensis.com/portal/en/kb/articles/understanding-academic-structure-in-opensis  
Gibbon: https://docs.gibbonedu.org/  
RosarioSIS: https://www.rosariosis.org/documentation/  
Workday Student: https://doc.workday.com/admin-guide/en-us/student/setup-considerations--workday-student.html  
Ellucian Banner: https://www.ellucian.com/assets/en/solution-sheet/banner-student.pdf  
Frappe Education: https://docs.frappe.io/erpnext/education-module-in-erpnext  
Frappe enrollment: https://docs.frappe.io/education/program-enrollment  
Moodle: https://docs.moodle.org/dev/Roles  
Canvas permissions: https://documentation.instructure.com/doc/api/file.permissions.html  
Canvas hierarchy: https://community.instructure.com/en/kb/articles/661404-what-is-the-hierarchical-structure-for-canvas-accounts  
D2L roles: https://community.d2l.com/brightspace/kb/articles/4451-about-roles-and-permissions  
D2L org administration: https://community.d2l.com/brightspace/kb/articles/17019-about-org-administration  
Open edX: https://openedx.org/  
Google organizational units: https://support.google.com/edu/setup/answer/182537?hl=en  
SACE Honduras: https://www.sace.se.gob.hn/

**Estándares, privacidad y accesibilidad:**  
1EdTech: https://standards.1edtech.org/  
Edu-API: https://www.1edtech.org/standards/edu-api  
Versiones 1EdTech: https://www.1edtech.org/specifications  
CASE 1.1: https://www.imsglobal.org/spec/CASE/v1p1/impl  
Ed-Fi: https://docs.ed-fi.org/reference/data-exchange/data-standards/  
CEDS P-20W: https://ceds.ed.gov/datamodelnds.aspx  
FERPA: https://studentprivacy.ed.gov/faq/what-must-educational-agencies-or-institutions-do-ensure-only-school-officials-legitimate  
WCAG 2.2: https://www.w3.org/TR/WCAG22/

**Límite:** fuentes públicas no verifican código, seguridad ni contratos internos de todos los proveedores. El diseño se debe contrastar con código, datos, requisitos y políticas institucionales antes de implementar.


## 11. Subplan funcional asociado — TASK-695 / PLAN-IMA-001

El detalle de las 24 unidades UNI-U01…UNI-U24, sus requisitos, criterios de aceptación, dependencias, tareas existentes, brechas candidatas y señales de usuarios se registra en [PLAN-IMA-001_UNIDADES_FUNCIONALES.md](PLAN-IMA-001_UNIDADES_FUNCIONALES.md). Los IDs UNI son locales, no globales. No se crean tareas duplicadas; las brechas U01/U04/U07/U10/U22 requieren auditoría técnica antes de asignar nuevos IDs. TASK-153/T153-S01 conserva el bloqueo PM-01.
