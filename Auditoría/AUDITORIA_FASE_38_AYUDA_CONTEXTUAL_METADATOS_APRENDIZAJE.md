# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 38

**Fase:** 38 — Ayuda contextual, metadatos y aprendizaje de la interfaz
**Área:** Experiencia de usuario, orientación contextual, metadatos de interfaz, accesibilidad (WCAG 2.2 AA), guías interactivas y persistencia de preferencias de usuario.
**Fecha de Evaluación:** 2026-10-31
**Estado General:** Implementada Parcialmente con Brechas en Tooltips Nativos, Catálogo Central de Metadatos y Sincronización Server-Side

---

## A. IDENTIFICACIÓN Y ALCANCE

### 1. Propósito y Objetivos
Auditar integralmente el sistema de ayuda contextual, metadatos y orientación de usuarios en la Plataforma Integral de Gestión Educativa.
La evaluación abarca la ayuda contextual inmediata (tooltips/popovers), las instrucciones visibles permanentes en formularios, la orientación de primera visita (onboarding/tours guiados), el catálogo central de metadatos de interfaz y la persistencia de preferencias de usuario entre sesiones y dispositivos.

### 2. Componentes Reales Encontrados en Repositorio
- **Controlador de Guías Interactivas:** `js/ui-common.js` (L2503-L2630: `startInteractiveGuide`, `navigateGuideStep`, `closeInteractiveGuide`).
- **Modal de Asistencia y Preguntas Frecuentes:** `js/ui-common.js` (L3085-L3170: `openContextualHelpModal`, `startGuidedTourAction`).
- **Catálogo Backend de Guías Contextuales:** `backend/user-service/Code.gs` (L7345-L7390: `getHelpGuidesCatalog(payload)`).
- **Tooltips Básicos Nativos HTML:** Uso disperso del atributo estándar `title="..."` en botones de tablas y barras de navegación en `teacher-dashboard.html`, `js/secretary.js`, `js/teacher.js`, etc.

---

## B. ESTADO ACTUAL E INVENTARIO FUNCIONAL

| Mecanismo de Ayuda | Ubicación en Código | Implementación Real | Estado / Hallazgo |
|---|---|---|---|
| Guías Paso a Paso (Tours) | `js/ui-common.js` | `window.startInteractiveGuide` | Implementada para `studentSubmission` y `teacherReview`. Renderiza ventana flotante (`#interactive-guide-box`) en esquina inferior derecha. |
| Modal Central de Asistencia | `js/ui-common.js` | `window.openContextualHelpModal` | Modal interactivo con FAQ institucional (JyP Solutions) y lista de guías según rol. |
| Catálogo de Guías Backend | `backend/user-service/Code.gs` | `getHelpGuidesCatalog` | Devuelve guías por rol (`gradebook`, `plantillas`, `tareas`) en array estático en memoria. |
| Tooltips de Campo / Controles | Varios archivos | Atributos `title="..."` | Rudimentario. Depende del navegador, inaccesible en móviles/táctil y sin posicionamiento adaptable. |
| Catálogo Central de Metadatos | - | No existe tabla/JSON central | Ausente. No hay catálogo con claves estables (`field_id`, `min`, `max`, `ejemplo`). |
| Persistencia de Preferencias | `js/ui-common.js` | `localStorage.getItem('guide_progress_' + tourKey)` | Almacenamiento local exclusivo. No se sincroniza con el servidor ni entre dispositivos. |

---

## C. EVALUACIÓN DETALLADA POR SUBCAPACIDAD (F38-01 A F38-14)

### F38-01. Cobertura de ayuda en elementos de interfaz
- **Estado:** Implementada Parcialmente.
- **Evidencia:** Existen atributos `title` en botones clave de acción (aprobar, rechazar, previsualizar) y modales de ayuda para secciones principales.
- **Brechas:** Los campos de entrada (inputs, selects, fechas) en formularios extensos de matrícula, calificaciones e importaciones carecen de explicaciones contextuales enriquecidas.

### F38-02. Presentación y comportamiento de ventanas flotantes
- **Estado:** Requiere Mejoras.
- **Evidencia:** La ventana `#interactive-guide-box` se ubica fijamente en `fixed bottom-6 right-6`.
- **Brechas:** No existe un componente de tooltip flotante adaptativo que calcule coordenadas respecto al elemento objetivo (sin cálculo de colisión con bordes del viewport o scroll).

### F38-03. Accesibilidad y mecanismos alternativos de consulta (WCAG 2.2 AA)
- **Estado:** Defectuosa.
- **Brechas:**
  1. Los atributos `title` no se activan mediante navegación por foco de teclado (`Tab`) ni son legibles en pantallas táctiles (smartphones/tablets).
  2. No se asocian semánticamente mediante `aria-describedby` al elemento del formulario.
  3. No se cierran con la tecla `Escape`.

### F38-04. Descripciones completas de campos y controles
- **Estado:** Requiere Mejoras.
- **Evidencia:** Los modales de tours explican tareas generales en 4 pasos.
- **Brechas:** No se documentan límites de tamaño de archivo, formatos aceptados ni consecuencias de acciones destructivas junto al campo de entrada.

### F38-05. Catálogo central de metadatos y claves estables
- **Estado:** Ausente.
- **Brechas:** No existe una tabla o archivo JSON centralizado que mapee claves estables (`METADATA_KEYS`) a descripciones, ejemplos y formatos esperados. Los textos están dispersos en HTML y JS.

### F38-06. Estructura de metadatos, traducciones y versiones
- **Estado:** Ausente.
- **Brechas:** No existe soporte para versionado de contenidos de ayuda ni mecanismos de reserva de idioma (i18n).

### F38-07. Reutilización y consistencia de ayudas
- **Estado:** Requiere Mejoras.
- **Brechas:** Formularios equivalentes en diferentes dashboards definen textos de ayuda o placeholders independientes sin compartir definiciones comunes.

### F38-08. Consejos de primera visita y orientación progresiva
- **Estado:** Implementada Parcialmente.
- **Evidencia:** `startInteractiveGuide` permite guardar el progreso del tour y cerrarlo con el botón "Omitir" o "Finalizar".
- **Brechas:** No se dispara automáticamente en la primera visita real del usuario ni distingue entre usuarios nuevos y recurrentes.

### F38-09. Preferencias de ayuda y persistencia por usuario
- **Estado:** Defectuosa (Solo Local).
- **Evidencia:** Guarda en `localStorage.setItem('guide_progress_' + tourKey, stepIdx)`.
- **Brecha Crítica:** Si el usuario accede desde otro dispositivo o borra la caché del navegador, las guías se reinician. No se persisten las preferencias en el perfil de usuario del backend.

### F38-10. Consulta y restablecimiento desde preferencias
- **Estado:** Implementada Parcialmente.
- **Evidencia:** `openContextualHelpModal` permite reabrir las guías paso a paso desde el menú de soporte.
- **Brechas:** No existe una opción en el panel de configuración de usuario para "Restablecer todos los consejos de primera visita".

### F38-11. Ayudas generales e instrucciones específicas por rol
- **Estado:** Completa y Verificada.
- **Evidencia:** `getHelpGuidesCatalog` en `user-service/Code.gs` filtra las guías devueltas según el rol verificado (`Profesor` vs `Estudiante`).

### F38-12. Ayuda especializada para funciones avanzadas
- **Estado:** Implementada Parcialmente.
- **Evidencia:** Guía detallada para el diseñador visual de plantillas (`GUIDE-TEMPLATES-DESIGN`).
- **Brechas:** Falta orientación especializada en conciliación bancaria, cierre de año lectivo e importaciones masivas.

### F38-13. Advertencias críticas y confirmaciones independientes
- **Estado:** Completa y Verificada.
- **Evidencia:** Operaciones críticas (ej. eliminar bloques de horario o cerrar hilos) utilizan diálogos modales obligatorios independientes del sistema de tutoriales.

### F38-14. Rendimiento, disponibilidad y tolerancia a fallos
- **Estado:** Completa y Verificada.
- **Evidencia:** La carga de guías es asíncrona y, ante fallos de conexión, la interfaz muestra un fallback con las preguntas frecuentes sin bloquear la operativa del dashboard.

---

## D. MATRIZ MAESTRA DE AUDITORÍA Y CARACTERÍSTICAS (CAR-F38)

| ID | Característica | Prioridad | Estado Funcional | Acción Recomendada |
|---|---|---|---|---|
| F38-01 | Cobertura de ayuda en elementos UI | P0 | Implementada Parcialmente | Extender atributos a todos los campos de formulario |
| F38-02 | Presentación de ventanas flotantes | P0 | Requiere Mejoras | Motor de tooltips con Popper/Tippy o cálculo nativo de viewport |
| F38-03 | Accesibilidad WCAG 2.2 AA (Teclado/Táctil) | P0 | Defectuosa | Soporte `Tab`, `Escape`, `aria-describedby` e interacción táctil |
| F38-04 | Descripciones completas y formatos | P0 | Requiere Mejoras | Enriquecer textos con ejemplos válidos y límites |
| F38-05 | Catálogo central de metadatos | P0 | Ausente | Crear estructura JSON/Hoja `MetadatosInterfaz` |
| F38-06 | Versionado y traducciones | P1 | Ausente | Incorporar versionado semántico de textos de ayuda |
| F38-07 | Reutilización y consistencia | P0 | Requiere Mejoras | Consumir metadatos desde un único repositorio |
| F38-08 | Consejos de primera visita | P1 | Implementada Parcialmente | Disparador automático ante primer inicio de sesión |
| F38-09 | Persistencia server-side por usuario | P0 | Defectuosa | Guardar estado en tabla `PreferenciasUsuario` |
| F38-10 | Restablecimiento de consejos | P1 | Implementada Parcialmente | Botón de reseteo en modal de opciones de usuario |
| F38-11 | Segmentación de ayuda por rol | P0 | Completa y Verificada | Mantener filtrado por `getUserVerifiedRole` |
| F38-12 | Ayuda en funciones avanzadas | P1 | Implementada Parcialmente | Redactar guías para conciliación e importador |
| F38-13 | Advertencias críticas independientes | P0 | Completa y Verificada | Preservar diálogos obligatorios de confirmación |
| F38-14 | Rendimiento y tolerancia a fallos | P1 | Completa y Verificada | Mantener caché local y llamadas diferidas |

---

## E. RESULTADOS DE LA MATRIZ DE PRUEBAS FUNCIONALES (PT-F38-01 A PT-F38-25)

| ID | Escenario | Resultado Esperado | Resultado Observado | Estado |
|---|---|---|---|---|
| **PT-F38-01** | Ayuda contextual básica | Muestra descripción de campo | Tooltips estándar `title` en botones | **Requiere Mejoras** |
| **PT-F38-02** | Componentes dinámicos | Ayuda en controles inyectados | Nuevos elementos no inicializan tooltips | **No Aprobado** |
| **PT-F38-03** | Posicionamiento en bordes | Burbuja permanece en viewport | Ventana fija en esquina derecha; no contextual a campo | **No Aprobado** |
| **PT-F38-04** | Navegación con teclado | Abrir con foco `Tab` y cerrar con `Esc` | Atributo `title` no abre con Tab en la mayoría de navegadores | **No Aprobado** |
| **PT-F38-05** | Accesibilidad lector pantalla | Anuncia `aria-describedby` | Atributos ARIA ausentes en campos | **No Aprobado** |
| **PT-F38-06** | Interacción táctil en móvil | Tocar icono abre ayuda | En móvil no hay hover; `title` no se activa | **No Aprobado** |
| **PT-F38-07** | Correspondencia de validaciones | Instrucciones coinciden con backend | Límites no están expresados junto al input | **Requiere Mejoras** |
| **PT-F38-08** | Claves del catálogo | Resuelve claves estables | Claves estables no implementadas | **No Aprobado** |
| **PT-F38-09** | Reutilización de textos | Mismo texto en múltiples vistas | Textos repetidos y dispersos en código | **No Aprobado** |
| **PT-F38-10** | Traducciones y reservas | Idioma alternativo o reserva | Solo español disponible | **No Aplicable** |
| **PT-F38-11** | Versiones de metadatos | Actualización no reinicia tour | No existe versionado de guías | **No Aprobado** |
| **PT-F38-12** | Primera visita automática | Tour inicia automáticamente | Requiere clic explícito en botón de ayuda | **Requiere Mejoras** |
| **PT-F38-13** | Reingreso no repetitivo | No repite consejo descartado | Guarda progreso en localStorage | **Aprobado** |
| **PT-F38-14** | Consulta posterior de guía | Acceso desde menú de ayuda | Disponible en `openContextualHelpModal` | **Aprobado** |
| **PT-F38-15** | Restablecimiento de consejos | Resetea solo ámbito solicitado | No existe botón de restablecimiento | **No Aprobado** |
| **PT-F38-16** | Persistencia entre dispositivos | Sincroniza estado descartado | No sincroniza; solo existe en localStorage | **No Aprobado** |
| **PT-F38-17** | Aislamiento entre usuarios | Cuentas distintas no mezclan tour | Mezcladas si comparten el mismo navegador | **No Aprobado** |
| **PT-F38-18** | Personalización por rol | Guías distintas profesor/alumno | `getHelpGuidesCatalog` filtra por rol verificado | **Aprobado** |
| **PT-F38-19** | Función avanzada explicada | Advierte consecuencias | Modales de plantillas explican inmutabilidad | **Aprobado** |
| **PT-F38-20** | Advertencia crítica obligatoria | Diálogo aparece tras cerrar tour | Confirmaciones modales permanecen activas | **Aprobado** |
| **PT-F38-21** | Fallo del catálogo | Fallback y registro de error | Muestra FAQ si falla backend | **Aprobado** |
| **PT-F38-22** | Fallo de sincronización | Estado coherente | Fallo no afecta operativa del dashboard | **Aprobado** |
| **PT-F38-23** | Rendimiento y carga | Carga diferida sin bloqueo | Tour se inyecta en DOM bajo demanda | **Aprobado** |
| **PT-F38-24** | Consistencia entre módulos | Textos coherentes | Preguntas frecuentes unificadas en `ui-common.js` | **Aprobado** |
| **PT-F38-25** | Compatibilidad de versiones | Metadatos antiguos no rompen | Estructura tolerante a campos vacíos | **Aprobado** |

---

## F. PLAN DE RESOLUCIÓN PRIORIZADO

### Bloque P0: Componente de Tooltip Accesible, Catálogo Central y Persistencia en Servidor
1. **[F38-Task01] Componente universal de tooltip flotante y adaptativo (WCAG 2.2 AA):**
   - Implementar en `js/ui-common.js` un renderizador accesible de tooltips flotantes que soporte: activación por hover y foco de teclado (`Tab`), cierre con `Escape`, enlace semántico `aria-describedby`, reposicionamiento automático ante colisiones con bordes de pantalla y activación táctil explícita en dispositivos móviles.
2. **[F38-Task02] Catálogo centralizado de metadatos de campos y descripciones de interfaz:**
   - Crear el repositorio de metadatos en backend (`user-service/Code.gs`: `getUIMetadataCatalog`) y caché en cliente con claves estables (`METADATA_KEYS`), definiendo para cada campo: etiqueta visible, descripción breve, ejemplo de valor válido, obligatoriedad y límites.
3. **[F38-Task03] Persistencia en servidor de preferencias y estado de aprendizaje por usuario:**
   - Crear endpoints `saveUserHelpPreferences` y `getUserHelpPreferences` en `user-service/Code.gs` y persistir en la hoja `PreferenciasUsuario` el estado de guías y consejos descartados, garantizando aislamiento entre usuarios y sincronización multidispositivo.
4. **[F38-Task04] Instrucciones permanentes y advertencias de riesgo en formularios críticos:**
   - Integrar textos de ayuda permanentes junto a campos con formatos complejos (fechas, DNI, importes) y garantizar que las confirmaciones de operaciones destructivas o financieras permanezcan siempre activas e independientes de los consejos descartados.

### Bloque P1: Onboarding Progresivo, Restablecimiento y Funciones Avanzadas
5. **[F38-Task05] Motor de orientación de primera visita y disparador automático no invasivo:**
   - Detectar automáticamente el primer ingreso del usuario a cada módulo para presentar el tour guiado de forma no invasiva, con opción de descarte inmediato y registro en servidor.
6. **[F38-Task06] Consola de restablecimiento y reconsulta de guías desde el perfil de usuario:**
   - Añadir en el modal de configuración de usuario un panel para consultar el catálogo de guías y permitir el restablecimiento individual o global de consejos descartados.
7. **[F38-Task07] Ampliación de guías especializadas para módulos administrativos y financieros:**
   - Desarrollar guías interactivas paso a paso para la conciliación bancaria, el importador inteligente de Excel/CSV y la emisión oficial de documentos con CUV.

---

## G. COBERTURA CUANTITATIVA Y CONCLUSIÓN

### 1. Fórmulas y Métricas Independientes de Cobertura
- **Cobertura de Inspección:**
  $$\frac{\text{Subcapacidades inspeccionadas (14)}}{\text{Total subcapacidades identificadas (14)}} \times 100 = 100.0\%$$
- **Cobertura de Ejecución:**
  $$\frac{\text{Pruebas ejecutadas (24)}}{\text{Total pruebas planificadas (25)}} \times 100 = 96.0\% \quad (\text{1 prueba No Aplicable por idioma único})$$
- **Cobertura de Verificación Satisfactoria:**
  $$\frac{\text{Pruebas aprobadas satisfactoriamente (11)}}{\text{Total pruebas aplicables (24)}} \times 100 = 45.8\%$$

### 2. Distribución de Estados Funcionales
- *Completa y Verificada:* 3 (21.4%)
- *Implementada Parcialmente:* 5 (35.7%)
- *Requiere Mejoras:* 3 (21.4%)
- *Defectuosa:* 2 (14.3%)
- *Ausente:* 1 (7.2%)

### 3. Dictamen Final
**NO APROBADA PARA CERTIFICACIÓN FINAL** debido a la dependencia de tooltips nativos `title` inaccesibles para teclado y dispositivos táctiles, la persistencia en `localStorage` no sincronizada con el servidor y la carencia de un catálogo central de metadatos de interfaz con claves estables.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de las siete tareas descritas en el plan F (F38-Task01..F38-Task07), conservando prioridades P0/P1. Se añade F38-Task12 para la brecha de versionado e internacionalización de metadatos (F38-06/CAR-F38-06), no cubierta como tarea independiente en el plan. Auditoria.txt registra un backlog histórico de 11 IDs, pero no describe F38-Task08..F38-Task11; no se inventa su alcance.

### [F38-Task01] Implementar tooltip universal, adaptativo y accesible (WCAG 2.2 AA)
- **Hallazgo de origen:** F38-01/F38-02/F38-03; CAR-F38-01/CAR-F38-02/CAR-F38-03.
- **Severidad:** Crítica / P0. **Objetivo:** proporcionar ayuda contextual operable por mouse, teclado y tacto, con posicionamiento correcto en cualquier viewport.
- **Acción ejecutable:** crear componente reusable en `js/ui-common.js` con activación hover/focus/touch, `aria-describedby`, foco visible, cierre Escape, gestión de scroll/colisiones y posicionamiento adaptativo.
- **Archivos/módulos:** `js/ui-common.js`, componentes de formularios, dashboards y `#interactive-guide-box`.
- **Dependencias/riesgos:** F28-Task04/05 (accesibilidad/móvil), TASK-129/TASK-130; riesgo de tooltip inaccesible, bloqueo de controles o superposición fuera de pantalla.
- **Alcance:** tooltips y ayudas breves; no reemplazar modales obligatorios de confirmación ni esconder información crítica en hover.
- **Criterios de aceptación:** teclado Tab/foco; Escape cierra; touch abre/cierra explícitamente; asociación ARIA; posicionamiento sin clipping; contraste y foco; pruebas con teclado, lector de pantalla, móvil, zoom y scroll.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; los atributos title no funcionan adecuadamente con teclado ni tacto y no hay motor flotante adaptativo.

### [F38-Task02] Crear catálogo central de metadatos y descripciones de campos
- **Hallazgo de origen:** F38-04/F38-05/F38-07; CAR-F38-04/CAR-F38-05/CAR-F38-07.
- **Severidad:** Crítica / P0. **Objetivo:** mantener definiciones consistentes y reutilizables de etiquetas, ejemplos, formatos y límites de campos.
- **Acción ejecutable:** crear catálogo `MetadatosInterfaz` o JSON versionado con claves estables `METADATA_KEYS`; exponer `getUIMetadataCatalog`; incluir etiqueta, descripción, ejemplo válido, formato, obligatoriedad, límites y mensajes de error; sustituir textos duplicados en HTML/JS por consumo del catálogo.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `getUIMetadataCatalog`, `MetadatosInterfaz`, `js/ui-common.js`, formularios de matrícula/calificaciones/importación.
- **Dependencias/riesgos:** F26-Task01/02 (configuración/locales), F30-Task12 (manuales); riesgo de claves inestables o de mostrar reglas diferentes entre dashboards.
- **Alcance:** metadatos de interfaz y ayuda; no convertir el catálogo en fuente de autorización ni permitir HTML/JS arbitrario.
- **Criterios de aceptación:** claves estables; esquema tipado; campos equivalentes consumen misma definición; ejemplos/límites visibles; validación de referencias de claves; caché versionada; pruebas de cobertura, campo desconocido y fallback.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no existe catálogo central y las ayudas están dispersas en HTML/JS.

### [F38-Task03] Persistir preferencias y progreso de ayuda en servidor por usuario
- **Hallazgo de origen:** F38-09; CAR-F38-09.
- **Severidad:** Crítica / P0. **Objetivo:** sincronizar progreso de guías y consejos descartados entre dispositivos sin mezclar usuarios.
- **Acción ejecutable:** crear `PreferenciasUsuario` y endpoints `saveUserHelpPreferences`/`getUserHelpPreferences`; almacenar tourKey, step, descartado, versión, timestamp y usuario derivado de sesión; resolver conflictos con versión.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `PreferenciasUsuario`, `js/ui-common.js`, `startInteractiveGuide`.
- **Dependencias/riesgos:** TASK-062 (versionado/consistencia), F26-Task04 (invalidación), identidad de sesión verificada; riesgo de guardar preferencias bajo ID enviado por cliente.
- **Alcance:** preferencias de ayuda y progreso; no guardar datos sensibles ni bloquear el uso de la plataforma si el servicio de preferencias falla.
- **Criterios de aceptación:** usuario derivado del token; aislamiento server-side; sincronización multidispositivo; control de versión; fallback local no autoritativo; fallos no bloquean dashboard; pruebas dos usuarios/dispositivos, caché borrada y concurrencia.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el progreso solo se guarda en localStorage y se pierde al cambiar de dispositivo o borrar caché.

### [F38-Task04] Añadir instrucciones permanentes y advertencias de riesgo junto a campos críticos
- **Hallazgo de origen:** F38-01/F38-04 y requisito de mantener confirmaciones independientes; CAR-F38-01/CAR-F38-04/CAR-F38-13.
- **Severidad:** Crítica / P0. **Objetivo:** explicar formatos, límites y consecuencias antes de que el usuario introduzca datos o ejecute operaciones sensibles.
- **Acción ejecutable:** añadir ayuda inline para fechas, DNI, importes, adjuntos y campos complejos; mostrar formatos válidos, tamaño/tipo máximo, ejemplos y advertencias; mantener confirmaciones destructivas/financieras en componentes independientes.
- **Archivos/módulos:** formularios de matrícula, calificaciones, importaciones, pagos, horarios y `js/ui-common.js`.
- **Dependencias/riesgos:** F38-Task02, F31-Task02/09, F35-Task02/16 del importador; riesgo de que un consejo descartado suprima una confirmación obligatoria.
- **Alcance:** información persistente y contextual; no convertir advertencias en texto opcional ni sustituir validaciones de backend.
- **Criterios de aceptación:** límites/formato junto al campo; ejemplo válido; advertencias visibles para acciones críticas; descartes de tutorial no afectan confirmaciones; pruebas de accesibilidad, formato inválido y usuario recurrente.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; campos extensos carecen de límites/ejemplos y la ayuda no está uniformemente asociada a controles.

### [F38-Task05] Implementar onboarding de primera visita no invasivo
- **Hallazgo de origen:** F38-08; CAR-F38-08.
- **Severidad:** Alta / P1. **Objetivo:** orientar a usuarios nuevos por módulo sin interrumpir el trabajo ni repetir tours descartados.
- **Acción ejecutable:** detectar primer acceso por usuario/módulo; iniciar tour solo cuando el usuario esté listo; permitir posponer/omitir; persistir estado con F38-Task03 y respetar versión del tour.
- **Archivos/módulos:** `js/ui-common.js`, `startInteractiveGuide`, dashboards y `PreferenciasUsuario`.
- **Dependencias/riesgos:** F38-Task03, F38-Task01; riesgo de mostrar tour repetidamente o interferir con tareas urgentes.
- **Alcance:** onboarding contextual; no bloquear acceso a módulos ni mostrar guías irrelevantes al rol.
- **Criterios de aceptación:** detección de primera visita real; segmentación por rol/módulo; posponer/omitir; progreso sincronizado; frecuencia controlada; pruebas usuario nuevo/recurrente, cambio de rol y tour actualizado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el tour existe, pero no se activa automáticamente ni distingue usuarios nuevos/recurrentes.

### [F38-Task06] Crear panel de consulta y restablecimiento de guías desde preferencias
- **Hallazgo de origen:** F38-10; CAR-F38-10.
- **Severidad:** Alta / P1. **Objetivo:** permitir que el usuario vuelva a consultar guías o restablezca consejos descartados.
- **Acción ejecutable:** añadir en preferencias una sección para listar guías disponibles por rol, abrirlas y restablecer progreso individual o global con confirmación; persistir cambios en servidor.
- **Archivos/módulos:** `js/ui-common.js`, `openContextualHelpModal`, panel de preferencias y `backend/user-service/Code.gs`.
- **Dependencias/riesgos:** F38-Task02/03, RBAC por rol; riesgo de resetear preferencias de otro usuario o perder el progreso al guardar.
- **Alcance:** consulta/reset de ayuda; no modificar otras preferencias de usuario.
- **Criterios de aceptación:** catálogo filtrado por rol; reset individual/global; confirmación clara; estado sincronizado server-side; pruebas de permisos, reset, cancelación y multi-dispositivo.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; se pueden reabrir guías desde soporte, pero no existe control de restablecimiento en preferencias.

### [F38-Task07] Ampliar guías especializadas para procesos administrativos y financieros
- **Hallazgo de origen:** F38-12; CAR-F38-12.
- **Severidad:** Alta / P1. **Objetivo:** orientar tareas complejas que requieren secuencias y controles específicos.
- **Acción ejecutable:** crear guías para conciliación bancaria, importador Excel/CSV, emisión de documentos CUV, cierre de año lectivo y procesos administrativos; vincularlas a controles/contexto de cada módulo.
- **Archivos/módulos:** `js/ui-common.js`, catálogo de guías `getHelpGuidesCatalog`, dashboards Contabilidad/Dirección/Docencia y documentación operativa.
- **Dependencias/riesgos:** F30-Task12 (manuales), F35-Task09 (asistente importador), F31-Task01/07 (documentos); riesgo de guías obsoletas o instrucciones incompatibles con permisos.
- **Alcance:** guías paso a paso; no sustituir manuales completos ni habilitar acciones fuera del rol.
- **Criterios de aceptación:** guías por rol/módulo; pasos probados por responsable; versión/fecha; links contextuales; errores frecuentes y recuperación; pruebas con usuarios representativos y cambios de interfaz.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe guía para diseñador de plantillas, pero faltan conciliación bancaria, cierre de año e importaciones masivas.

### [F38-Task12] Implementar versionado semántico e internacionalización del catálogo de ayuda
- **Hallazgo de origen:** F38-06 y CAR-F38-06; ausencia de versiones y fallback de idioma.
- **Severidad:** Media / P1. **Objetivo:** mantener ayudas traducibles y compatibles con versiones distintas de la interfaz.
- **Acción ejecutable:** ampliar `MetadatosInterfaz` con locale, versión, vigencia, fallback y estado; sincronizar claves entre idiomas y validar que toda versión de UI tenga catálogo compatible.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `MetadatosInterfaz`, `js/ui-common.js`, configuración regional.
- **Dependencias/riesgos:** F38-Task02, F26-Task02 (locale), F31-Task12 (plantillas multilingües); riesgo de traducir incorrectamente términos legales o dejar textos desfasados.
- **Alcance:** español/inglés inicial y versionado de contenidos; no traducir automáticamente mensajes legales críticos sin revisión.
- **Criterios de aceptación:** locale y fallback explícitos; versión de catálogo vinculada a versión de UI; claves faltantes detectadas; traducciones revisadas; cambios históricos preservados; pruebas de fallback, versión obsoleta y cambio de idioma.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; F38-06 se marca ausente por falta de versionado e internacionalización.

### Reconciliaciones y discrepancias transversales de Fase 38
- **F38-Task01:** coordinar accesibilidad con F28-Task04/05 y TASK-129/TASK-130; tooltip no debe sustituir labels ni ayudas permanentes.
- **F38-Task02/12:** mantener un único catálogo de metadatos, con claves estables, versiones y locales; no duplicar textos en HTML/JS.
- **F38-Task03/05/06:** preferencias de usuario y onboarding comparten persistencia; un único modelo server-side y fallback local no autoritativo.
- **F38-Task04:** las confirmaciones de operaciones destructivas/financieras permanecen independientes y obligatorias.
- **F38-Task07:** coordinar manuales con F30-Task12 y guías de importación/documentos F35/F31; evitar instrucciones contradictorias.
- **Discrepancia histórica:** Auditoria.txt registra 11 IDs F38-Task01..F38-Task11 (P0 01/02/04/05, P1 03/06..10, P2 11), mientras el informe vigente describe F38-Task01..F38-Task07. No se recuperaron descripciones de Task08..Task11; no se inventan ni se consulta Pendientes.md.
- **Subcapacidades completas preservadas:** F38-11/F38-13/F38-14; no se reejecutaron pruebas.
- **Estado global:** F38-Task01..F38-Task07 y F38-Task12 permanecen pendientes; F38-Task08..Task11 quedan como referencias históricas sin descripción recuperable.
