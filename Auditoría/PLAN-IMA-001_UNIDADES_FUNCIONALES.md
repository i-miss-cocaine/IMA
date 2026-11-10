# PLAN-IMA-001 — Requisitos funcionales universales por unidad

**Tarea global:** TASK-695 · PM-02 · P0 · Diseño documental. **Arquitectura base:** TASK-694.  
**IDs locales:** UNI-U01…UNI-U24; no son IDs globales.  
**Objetivo:** especificar una plataforma configurable/multiinstitucional desde primera infancia hasta educación superior y operación institucional. Reutilizar/ampliar tareas existentes; crear nuevas solo después de auditoría técnica.

## Opiniones de usuarios: señales y respuestas de diseño

Las opiniones consultadas son cualitativas, no estadísticas representativas:
- SIS/K–12: demasiados clics, interfaces lentas, sincronización SIS/LMS frágil, discrepancias de notas y aplicaciones duplicadas. Respuesta: fuente oficial por dato, sync idempotente, historial de cálculo, conciliación y regresión por período. [PowerSchool](https://www.reddit.com/r/AskTeachers/comments/1l805ln/), [cambio de SMS](https://www.reddit.com/r/Teachers/comments/1nhrpbb), [notas](https://www.reddit.com/r/Teachers/comments/1q6to3s/), [aplicaciones](https://www.reddit.com/r/Teachers/comments/1vxfwad/).
- Superior: costo de SIS y esfuerzo de migración; portales lentos en selección de cursos. Respuesta: exportación completa, migración reversible, pruebas de carga y avance curricular explicable. [SIS/costo](https://www.reddit.com/r/highereducation/comments/1x5nspu/), [selección](https://www.reddit.com/r/uoguelph/comments/1uqal5j/).
- LMS: navegación confusa, clics excesivos, gradebook difícil, vista docente/estudiante discordante y problemas de entregas/notificaciones. Respuesta: plantillas, vista espejo, preview, bitácora de entregas, recuperación y accesibilidad. [Brightspace](https://www.reddit.com/r/Professors/comments/1vedo1p/), [gradebook](https://www.reddit.com/r/Professors/comments/1r9ydoc/), [Moodle](https://www.reddit.com/r/Professors/comments/1wuavm2/), [Canvas](https://www.reddit.com/r/rmit/comments/1wvd47q/).
- Primera infancia: presión por fotos y documentación, mensajes constantes y papeleo externo (vacunas/licencias/sustituciones). Respuesta: captura diferida/lotes, plantillas y horarios de comunicación. [brightwheel](https://www.reddit.com/r/ECEProfessionals/comments/1d6s113/), [papelería](https://www.reddit.com/r/ECEProfessionals/comments/1tynuot/), [Procare](https://www.reddit.com/r/ECEProfessionals/comments/12qmtl1/).
- Transporte/horarios: rutas imposibles y planificación manual costosa. Respuesta: restricciones duras/blandas, buffers, explicación de conflictos y aprobación humana. [rutas](https://www.reddit.com/r/SchoolBusDrivers/comments/1vl599i/), [ruteo](https://www.reddit.com/r/SchoolBusDrivers/comments/1wwe927/), [horarios](https://www.reddit.com/r/Teachers/comments/1kel0sd/).
- Biblioteca/trámites: migración de ILS por soporte, formularios rígidos y carga administrativa. Respuesta: exportación completa, validación, campos condicionales y “No aplica”. [ILS](https://www.reddit.com/r/librarians/comments/1octn7k/), [carga docente](https://www.reddit.com/r/Teachers/comments/1iovuj1), [comunicación](https://www.reddit.com/r/Teachers/comments/1vtndy9/).

No hubo muestra suficiente para generalizar opiniones sobre ERP/contabilidad, RR. HH. o analítica. Se requiere entrevista institucional antes de priorizar UX en esos dominios.

## Paquetes, requisitos y criterios de aceptación

### UNI-U01 — Tenants, instituciones y sedes
**Requisitos:** tenant como frontera de seguridad; instituciones/sedes subordinadas; grupos opcionales; estado, país, zona horaria, módulos y contexto explícito en sesión/API.  
**Aceptación:** dos tenants aislados; toda lectura/escritura/búsqueda/archivo/export/job exige tenant; IDs manipulados no cruzan datos; suspensión bloquea operaciones sin borrar historia.  
**Dependencias/tareas:** TASK-694, TASK-153, F29-TASK17, F37-TASK10. **Brecha candidata:** registro y aislamiento runtime no cubiertos por migración de roles solamente.

### UNI-U02 — Organización institucional
**Requisitos:** tipos configurables; árboles y relaciones matriciales separados; membresías vigentes; jerarquía versionada; herencia explícita.  
**Aceptación:** soporta estructuras distintas; ciclos rechazados; relaciones funcionales no conceden permisos; cambios no reasignan owners históricos.  
**Dependencias/tareas:** U01; TASK-506/171/668, F16-TASK01, T153-S01/S02. Ampliar.

### UNI-U03 — Admisiones
**Requisitos:** aspirantes, solicitudes, documentos/consentimiento, entrevistas, estados, cupos, listas de espera, deduplicación y conversión a estudiante.  
**Aceptación:** transiciones inválidas rechazadas; reintentos no duplican; decisiones/listas auditadas; cupos atómicos; conversión idempotente a expediente/matrícula.  
**Dependencias/tareas:** U01/U05/U06/U20; TAREA-F5-002/005/007/008/010/011/012/013, F35-TASK03, TASK-086, AUD-NG-129. Reutilizar/ampliar.

### UNI-U04 — Primera infancia
**Requisitos:** salas/grupos, edades, capacidad, ratios niño-personal por jurisdicción, turnos, check-in/out, autorizados, salud/alergias/vacunas, incidentes, comidas/descanso y reportes diarios.  
**Aceptación:** capacidad/ratio bloqueados salvo excepción auditada; recogida solo por autorizados vigentes; salud limitada por rol; captura por lotes/diferida sin obligación de foto; cierre concilia menores.  
**Dependencias/tareas:** U01/U05/U13/U14/U16/U20. **Brecha:** TASK-029/032 tratan transporte, no cuidado infantil.

### UNI-U05 — Expediente y trayectoria longitudinal
**Requisitos:** persona/rol aprendiz, expediente por institución, matrículas por programa/período, transferencias, documentos, historial y procedencia; deduplicación asistida.  
**Aceptación:** transferencia conserva referencias; no fusionar por nombre; origen/actor/fecha por dato; rectificaciones preservan historia; acceso valida owner y ámbito.  
**Dependencias/tareas:** U01/U03/U06/U07/U13/U20; TASK-153/071, F9-TASK07, F29-TASK17, TAREA-F6-019/020/024, TASK-406. Ampliar sin saltar bloqueo TASK-153.

### UNI-U06 — Calendario y núcleo académico
**Requisitos:** calendarios independientes; años/períodos/niveles/grados/programas; planes versionados; curso/asignatura, oferta, sección y vigencia.  
**Aceptación:** calendarios simultáneos/interperíodo; cambios curriculares no reescriben cohortes; curso/oferta/sección separados; matrícula valida fechas, cupos y prerrequisitos.  
**Dependencias/tareas:** U01/U02; AUD-NG-164, TASK-005, TAREA-08, TASK-517/390/613/614, AUD-NG-129. Ampliar.

### UNI-U07 — Formación técnica/superior y credenciales
**Requisitos:** programas, planes, créditos/horas configurables, módulos, competencias, resultados, prerrequisitos, equivalencias, prácticas, tesis y graduación.  
**Aceptación:** créditos/horas no hardcodeados; avance usa versión del plan de cohorte; equivalencias aprobadas/trazables; auditoría explica pendientes; credenciales verificables.  
**Dependencias/tareas:** U05/U06/U11/U20; AUD-NG-164, F9-TASK12, TASK-613/614/195. **Brecha:** degree audit y credenciales superiores.

### UNI-U08 — Horarios y recursos
**Requisitos:** disponibilidad docente/laboral, aulas/capacidad/equipamiento, grupos, sesiones, restricciones, buffers, preferencias, sustituciones y simulación.  
**Aceptación:** backend bloquea colisiones duras; explica restricciones imposibles; vista previa antes/después; confirmación previa; revalida matrícula y conserva historia.  
**Dependencias/tareas:** U02/U06/U07; TAREA-F7-IMP-01/02/04/06/07, TASK-173/533/534/555/605/617/521/522/527. Reutilizar.

### UNI-U09 — Asistencia
**Requisitos:** estados configurables; registro individual/masivo/offline; justificación/autorización; corrección auditada; alertas; sync con expediente/transporte/bienestar.  
**Aceptación:** reintentos no duplican; correcciones conservan autor/motivo/valor previo; docente ve su ámbito; ausencia no es nota cero; conflictos sync visibles.  
**Dependencias/tareas:** U05/U06/U08/U13; F10-TASK03/04/05/06, TASK-105, AUD-NG-122, F34-TASK01, TASK-263, F10-TASK16. Ampliar por perfil.

### UNI-U10 — LMS
**Requisitos:** cursos/secciones, contenidos, actividades, entregas/versiones, foros, rúbricas, feedback, multimedia, progreso, accesibilidad y OneRoster/LTI.  
**Aceptación:** vista estudiante coincide con publicación docente; entrega conserva versión/fecha/evidencia; recuperación no pierde trabajo; notas no duplican SIS; navegación accesible por teclado/lector.  
**Dependencias:** U05/U06/U08/U11/U22. **Brecha:** TASK-131 y recursos docentes no equivalen a LMS completo.

### UNI-U11 — Evaluación y calificaciones
**Requisitos:** esquemas versionados, categorías/pesos, evaluaciones, rúbricas, moderación, recuperación, actas, publicación, rectificación y sync.  
**Aceptación:** cálculo reproducible; pesos incompletos no publican; escalas nuevas no mutan actas cerradas; rectificación conserva autor/motivo/valor previo; regresión por período/vista.  
**Dependencias/tareas:** U06/U07/U10; F9-TASK03/04/05/06/10/12, AUD-NG-165/166/167, TASK-216/217/071/552/553. Reutilizar.

### UNI-U12 — Bienestar y orientación
**Requisitos:** expediente sensible separado; consentimiento/base legal; acceso por caso; asignación/vigencia profesional; notas confidenciales; retención/escalamiento.  
**Aceptación:** solo personal asignado/autorizado accede; auditoría sin contenido sensible en logs; revocación efectiva; agregados no reidentifican casos.  
**Dependencias/tareas:** U01/U05/U13/U20; F10-TASK01/07/08/09/10/13, F11-TASK01/06/07, AUD-NG-383. Reutilizar; AUD-NG-383 abierto.

### UNI-U13 — Familias y tutores
**Requisitos:** tutor legal, responsable financiero, emergencia, autorizado de recogida y contacto como relaciones separadas; vigencia, custodia/consentimiento, restricciones y portal multiestudiante.  
**Aceptación:** revocación elimina acceso; adulto ve estudiantes/campos autorizados; no inferir tutoría por apellidos; custodia compartida soportada; cambios auditados.  
**Dependencias/tareas:** U01/U05/U04/U14; TAREA-F5-012/018, TASK-032/030. Ampliar relaciones universales.

### UNI-U14 — Comunicación
**Requisitos:** eventos, plantillas, destinatarios por relación vigente, canales, acuses, preferencias, quiet hours, digest, urgencias y límites de frecuencia.  
**Aceptación:** reintentos no duplican; estado por destinatario/canal; avisos no críticos respetan horario; emergencias con política especial; docente no queda disponible 24/7.  
**Dependencias/tareas:** U01/U13/U20; F11-TASK03/04, F10-TASK12/13, F34-TASK02/06, TASK-108/199/227/316, TASK-163/194. Reutilizar.

### UNI-U15 — Finanzas del estudiante
**Requisitos:** tarifas versionadas, cargos por período/concepto, becas/exoneraciones vigentes, abonos, reembolsos, conciliación y cuenta por estudiante/contrato.  
**Aceptación:** cobros idempotentes; saldo desde movimientos confirmados; beca solo período válido; reversión trazable; históricos no mutan sin autorización.  
**Dependencias/tareas:** U03/U05/U06/U17; TASK-002/084/086/129/159/161/167/200, F11-TASK15, F29-TASK02, F30-TASK03, TASK-088. Reutilizar.

### UNI-U16 — Recursos humanos
**Requisitos:** candidato, expediente, contratos, cargos, áreas, jornada, asignaciones, sustituciones, asistencia laboral, nómina y offboarding.  
**Aceptación:** vigencias/contratos validados; responsabilidades no elevan privilegios; salida revoca acceso/cierra asignaciones sin borrar historia; conflictos detectados.  
**Dependencias/tareas:** U01/U02/U08; TASK-004/006/169/172/173/367, F16-TASK01/02/03/06/07/10, TASK-490. Reutilizar.

### UNI-U17 — ERP, compras e inventario
**Requisitos:** centros de costo, presupuesto, requisiciones/aprobaciones, órdenes/recepciones/facturas, kardex, activos, segregación de funciones y asientos.  
**Aceptación:** conciliación de tres vías antes del pago; segregación aprobar/pagar; movimientos idempotentes; stock negativo solo por regla; asientos cerrados no se sobrescriben.  
**Dependencias/tareas:** U01/U02/U15/U20; TASK-017/019/072/073/080/086/179/180/181/182/184/185/186/188/189/190, F18/F19, AUD-NG-046…054. Reutilizar/ampliar aislamiento tenant.

### UNI-U18 — Biblioteca
**Requisitos:** obra separada de ejemplar/licencia; catalogación, préstamos, renovaciones, reservas, multas, adquisiciones, OPAC y recursos digitales.  
**Aceptación:** concurrencia impide doble préstamo; renovación respeta reservas; migración conserva IDs/metadatos; usuario ve su historial; bajas auditadas.  
**Dependencias/tareas:** U01/U05/U06/U20; TASK-023/024/025/026/027/193/195/382, F20-TASK02/06/09/10/13. Reutilizar; añadir portabilidad ILS.

### UNI-U19 — Transporte y servicios
**Requisitos:** rutas/días/turnos, capacidad, horarios realistas, buffers, geografía, accesibilidad, abordaje/descenso, incidentes, autorizados y cobros.  
**Aceptación:** no sobrecupo; tiempos configurables; menores conciliados al salir; rutas simuladas/aprobadas; avisos solo a responsables relacionados.  
**Dependencias/tareas:** U04/U05/U08/U13/U14/U15; TASK-029…036/196/197/199/201/202/204/206/208/209/384/385/391, F21. Reutilizar.

### UNI-U20 — Documentos y trámites
**Requisitos:** catálogo, clasificación/sensibilidad, plantillas versionadas, borradores, validación condicional, firmas, acuses, retención, archivo y exportación.  
**Aceptación:** documento conserva versión/hash; original inmutable; firma atribuida a identidad verificada; permiso por expediente/operación; exportación filtrada y auditada.  
**Dependencias/tareas:** U01/U05/U12/U13/U15; TASK-091…108/132…156/212…215/288…318, F22/F31/F33/F40. Reutilizar.

### UNI-U21 — Analítica
**Requisitos:** diccionario semántico, fuente oficial, fórmula/versionado, dimensiones temporales/académicas, cohortes, calidad, filtros y privacidad.  
**Aceptación:** indicador muestra fuente/fórmula/período; huecos no son cero; cohortes no comparables separadas; filtros autorizados; resultados históricos reproducibles.  
**Dependencias/tareas:** U05/U06/U09/U11/U15/U17; TASK-051/235/285/391/397/406/407/408/488, TAREA-17, F11-TASK17, F24-TASK06/07. Ampliar P-20W.

### UNI-U22 — Interoperabilidad
**Requisitos:** modelo canónico, adaptadores versionados, mappings, OAuth/credenciales, sync incremental, idempotencia, cola de errores, conciliación, import/export y trazabilidad.  
**Aceptación:** OneRoster/Edu-API/LTI no alteran modelo canónico; reintentos no duplican; conflictos en cuarentena; mapping reproducible; pruebas de conformidad para endpoints soportados.  
**Dependencias/tareas:** U01/U05/U06/U10/U11/U15; FASE2-T04, F25-TASK03/05, F29-TASK07/09/13, F35-TASK01/03/06/07, TASK-077/269/390/394/412/415/424. **Brecha parcial:** adaptadores estándar no acreditados por importación SACE/sync genérico.

### UNI-U23 — Configuración, localización y perfiles
**Requisitos:** catálogo de claves/ámbitos, precedencia, versionado, idioma, zona, moneda, formatos, calendario, escalas/unidades y perfiles combinables EarlyYears/K12/TVET/HigherEducation/AdultLearning.  
**Aceptación:** resolver devuelve valor/procedencia; override prohibido se rechaza; seguridad/privacidad no se debilitan; cambios con vigencia; perfil no concede permisos.  
**Dependencias/tareas:** U01/U02/U06/U07; TASK-060, F26-TASK01, TASK-084/161/176/422. Ampliar precedencia a tenant/institución/sede/programa; Honduras no es estándar global.

### UNI-U24 — Gobierno de datos y migración
**Requisitos:** inventario, clasificación, calidad, deduplicación, mappings, staging, simulación, lotes reanudables, conciliación, respaldo, rollback, retención, privacidad, accesibilidad y aprobación.  
**Aceptación:** lote no publica sin aprobación; conteos/relaciones concilian; rollback restaura datos/relaciones; reanudación idempotente; excepciones auditadas.  
**Dependencias/tareas:** U01–U23, especialmente U05/U20/U22; TASK-072/077/080/275/276/344/345/432/438, F29-TASK07/09/11/13/14/16, TASK-151/152, F25-TASK05. Reutilizar.

## Brechas candidatas y decisión

U01: runtime tenant (auditar); U04: cuidado infantil (nueva tarea tras auditoría); U07: créditos/degree audit/credenciales superiores (auditar); U10: LMS completo (auditar); U22: adaptadores OneRoster/Edu-API/LTI (auditar). U13: ampliar relaciones familiares. No se declara ausencia por una búsqueda textual.

## Requisitos transversales y puertas

1. Tenant/institución y procedencia en entidades aplicables; no inferir relaciones.
2. Autorización server-side y fail-closed en lecturas, escrituras, búsquedas, archivos, exports, jobs y webhooks.
3. Auditoría sin secretos ni contenido confidencial.
4. Idempotencia, concurrencia, versionado, paginación y recuperación por lotes.
5. WCAG 2.2 AA como objetivo sujeto a pruebas, no conformidad declarada.
6. Protección/minimización/retención de datos sensibles según jurisdicción.
7. APIs versionadas/adaptadores; integración no define semántica interna.
8. Localización por institución; Honduras es perfil jurisdiccional.
9. Pruebas negativas multi-tenant, roles, vigencia, owner, archivo, revocación y huérfanos.
10. Perfiles configurables sin forks ni permisos implícitos.

- Gate A: resolver PM-00/PM-01 y TASK-153/T153-S01; no alterar ownership/scopes sin fuente institucional aprobada.
- Gate B: auditar código, esquemas, APIs, pantallas, pruebas, datos y consumidores; clasificar Existente/Parcial/Ausente/No verificable.
- Gate C: U01/U02/U23 antes de multiinstitución; U05/U06 antes de admisión/matrícula; U07/U10/U11 antes de perfiles avanzados; U22 antes de sync externo; U24 antes de migración/piloto.
- Gate D: una unidad por iteración/commit; pruebas unitarias, contrato, integración, seguridad, regresión y evidencia funcional.
- Gate E: piloto sandbox, datos sintéticos, consentimiento, rollback, responsables y salida medible.

**Resultado:** TASK-695 completa diseño/reconciliación documental inicial. No es implementación ni certificación. Las 24 unidades permanecen sin implementar.
