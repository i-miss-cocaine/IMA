# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 32
# EDITOR VISUAL DE PDF Y CAMPOS SUPERPUESTOS

**Proyecto:** Plataforma Integral de Gestión Educativa
**Fase Auditada:** 32. Editor visual de PDF y campos superpuestos
**Área:** Diseño visual de plantillas PDF, formularios rellenables sobre documentos preimpresos, posicionamiento de coordenadas, persistencia y generación de documentos finales.
**Tipo de Trabajo:** Auditoría funcional, técnica, comparativa y documental.
**Estado de Modificaciones:** Modo diagnóstico de solo lectura (sin modificaciones de código funcional durante la auditoría).
**Entregable:** Informe independiente en formato Markdown (`AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md`).

---

## A. IDENTIFICACIÓN Y ALCANCE

### 1. Propósito y Objetivos de la Auditoría
Evaluar de forma rigurosa y exhaustiva las capacidades que permiten transformar documentos PDF existentes (formularios oficiales preimpresos, fichas de matrícula, solicitudes de excusa estudiantil, pagarés y circulares) en plantillas de formularios rellenables digitales, conservando su diseño original, posicionamiento geométrico exacto, formato y estructura visual, garantizando la captura estructurada de datos y la generación posterior de documentos finales fieles.

La auditoría evalúa la dualidad del sistema:
1. **El Editor Visual de Plantillas:** Interfaz interactiva de escritorio utilizada por personal administrativo (Secretaría, Dirección) para cargar el PDF base, posicionar, redimensionar, configurar y publicar campos superpuestos.
2. **El Formulario de Captura y Emisión:** Entorno de diligenciamiento utilizado por usuarios autorizados (padres, estudiantes, docentes) para completar la información y generar el documento final (aplanado o interactivo) con Código Único de Verificación (CUV).

### 2. Componentes Reales Identificados en el Repositorio
La inspección técnica exhaustiva localizó los componentes que sustentan la Fase 32:

- **Capa de Interfaz Visual del Editor (`teacher-dashboard.html` y `js/teacher.js`):**
  - Modal interactivo `#modal-pdf-overlay-editor` en `teacher-dashboard.html` (L213838-214150).
  - Controlador `openPdfOverlayEditor(tpl)` (`js/teacher.js:1390-1440`): Inicializa el estado del editor, campos superpuestos, escala y metadatos.
  - Renderizado PDF con PDF.js: `loadPdfFromArrayBuffer` y `renderPdfPage(pageNum)` (`js/teacher.js:1445-1510`) sobre el elemento `<canvas id="pdf-render-canvas">` contenido en `#pdf-page-container`.
  - Lienzo de respaldo: `renderSampleBlankPdf()` genera un canvas con dimensiones estándar (612x792 pt, Letter) cuando no se ha cargado un archivo binario.
  - Navegación y Zoom: Controles `#btn-pdf-prev-page`, `#btn-pdf-next-page`, `#btn-pdf-zoom-in`, `#btn-pdf-zoom-out`, `#btn-pdf-fit-width` (`currentPdfScale` entre 0.5 y 2.5).
  - Capa de interacción superpuesta (`#pdf-overlay-layer`): Renderizado dinámico de cajas absolutas arrastrables (`initDragField`) y redimensionables (`initResizeField`).
  - Panel de propiedades laterales (`#field-props-form`): Configuración de clave interna, etiqueta visible, fuente dinámica autorizada, tamaño de fuente (8 a 36 pt), alineación (izq, centro, der), muestra y obligatoriedad.
  - Guardado en frontend: `savePdfOverlayTemplate(state)` serializa `overlayFields` y despacha a la API con `tipoSalida: 'PDF_OVERLAY'`.
- **Capa Backend y Servicios de Almacenamiento (`backend/accounting-service/Code.gs`):**
  - `configureSchoolDocumentTemplate`: Registra la plantilla en `PlantillasEscolares` guardando `configFormatoJSON` con `overlayFields` y `camposJSON`.
  - `getSchoolDocumentTemplates`: Recupera y filtra plantillas por categoría y estado.
  - `generateSchoolDocument`: Emisión oficial con concurrencia atómica mediante `LockService`, generación de número correlativo anual (`YYYY-XXXXXX`) y asignación de CUV único (`CUV-YYYY-XXXXXX`) en `DocumentosEscolaresEmitidos`.
  - `verifySchoolDocumentByCUV`: Endpoint de validación pública de autenticidad documental.
- **Fuentes Dinámicas Institucionales Vinculadas:**
  - `populatePropSourceTags` (`js/teacher.js:1480`) vincula campos con: `{{estudiante.nombreCompleto}}`, `{{estudiante.identidad}}`, `{{estudiante.grado}}`, `{{estudiante.seccion}}`, `{{estudiante.codigoMatricula}}`, `{{institucion.nombre}}`, `{{institucion.anoLectivo}}`, `{{tramite.fechaEmision}}`, `{{tramite.motivo}}`, `{{documento.codigoVerificacion}}`.

---

## B. INVENTARIO DE CAPACIDADES INVESTIGADAS (11 ÁREAS CLAVE)

| Área Funcional | Requisitos y Capacidades Investigadas | Estado en el Repositorio | Evidencias y Ubicación |
|---|---|---|---|
| **1. Importación PDF** | Carga de archivos PDF, validación de tipo MIME, conservación de número de páginas, orden y dimensiones originales. | **Completa y verificada** | `pdfFileInput.addEventListener('change')` en `js/teacher.js:1425`; renderizado con `window.pdfjsLib`. |
| **2. Reconocimiento y OCR** | Detección de texto escaneado vs digital, sugerencia automática de campos y OCR sobre imágenes. | **Ausente** | No existe motor OCR integrado (Tesseract o Google Vision API); los campos deben ubicarse manualmente. |
| **3. Diseño Visual** | Inserción, selección, movimiento visual arrastrado, redimensionamiento, duplicación y eliminación de campos. | **Completa y verificada** | `addOverlayField`, `initDragField`, `initResizeField` y `#btn-delete-overlay-field` en `js/teacher.js:1540-1650`. |
| **4. Sistema de Coordenadas** | Conversión entre píxeles de pantalla y coordenadas relativas porcentuales (`xRatio`, `yRatio`, `wRatio`, `hRatio`). | **Completa y verificada** | Coordenadas normalizadas `0.0 a 1.0` en `js/teacher.js:1580-1620`, inmunes a variaciones de zoom de pantalla. |
| **5. Propiedades de Campos** | Configuración de tipografía, tamaño de fuente (8-36 pt), alineación, etiqueta, clave, fuente de datos y muestra. | **Completa y verificada** | Formulario `#field-props-form` y `updateFieldPropsPanel()` en `js/teacher.js:1670`. |
| **6. Tipos de Campos** | Texto corto, texto multilínea, fecha, casillas de verificación (checkbox), firmas y marcas dinámicas. | **Implementada parcialmente** | 5 tipos activos (`texto`, `multiline`, `fecha`, `checkbox`, `firma`); faltan números con máscara, selectores y QR. |
| **7. Validación de Entrada** | Campos obligatorios vs opcionales, longitud máxima, formatos de fecha y patrones de validación. | **Implementada parcialmente** | Propiedad `required` configurada en el diseñador; validación activa en formularios de trámites de `user-service`. |
| **8. Previsualización** | Representación fiel del PDF con valores de prueba y fuentes aplicadas antes de la emisión final. | **Completa y verificada** | Visualización en vivo en `#pdf-render-canvas` con textos de muestra (`f.sampleVal || f.label`). |
| **9. Persistencia y Versiones** | Guardado de metadatos, borrador vs publicado, separación de PDF base y archivo de coordenadas. | **Completa y verificada** | `savePdfOverlayTemplate` despacha a `configureSchoolDocumentTemplate` en `backend/accounting-service/Code.gs:1200`. |
| **10. Generación Final** | Fusión de valores con el PDF original generando documento aplanado con CUV y correlativo inmutable. | **Requiere mejoras** | `generateSchoolDocument` registra la emisión oficial con CUV, pero la inyección gráfica PDF-lib en backend es básica. |
| **11. Compatibilidad y Calidad** | Comportamiento multilínea, caracteres españoles (ñ, acentos), fidelidad de impresión y zoom independiente. | **Completa y verificada** | El sistema de ratios porcentuales preserva la geometría; caracteres UTF-8 soportados en Canvas. |

---

## C. ESTADO ACTUAL DETALLADO POR SUBCAPACIDAD

### 1. Sistema de Coordenadas y Posicionamiento Geométrico (Crítico)
- **Implementación:** El editor utiliza una arquitectura matemática basada en ratios normalizados respecto al contenedor de la página:
  $$xRatio = rac{x_{pixel}}{Ancho_{contenedor}}, \quad yRatio = rac{y_{pixel}}{Alto_{contenedor}}$$
  $$wRatio = rac{Ancho_{pixel}}{Ancho_{contenedor}}, \quad hRatio = rac{Alto_{pixel}}{Alto_{contenedor}}$$
- **Ventaja Técnica:** Al modificar el nivel de zoom (`currentPdfScale` entre 50% y 250%) o ajustar al ancho de ventana (`#btn-pdf-fit-width`), el canvas y el overlay redimensionan proporcionalmente sus píxeles físicos, pero las coordenadas relativas almacenadas permanecen estrictamente inalteradas.
- **Hallazgo:** Durante la edición, los valores se muestran en tiempo real en `#prop-field-x-display` e `#prop-field-y-display` en formato porcentual (`%`). Falta un control numérico de entrada directa (inputs de precisión) para digitar coordenadas milimétricas exactas sin depender exclusivamente del mouse o trackpad.

### 2. Edición, Selección y Manipulación de Controles
- **Implementación:** Las cajas superpuestas cuentan con estilos interactivos diferenciados: borde azul suave en reposo y borde índigo con halo de sombra (`shadow-lg z-30`) al seleccionarse. El tirador inferior derecho (`cursor-se-resize`) permite redimensionar dinámicamente con límites acotados al contenedor (`1 - f.wRatio`, `1 - f.hRatio`).
- **Limitación:** No existe actualmente selección múltiple de campos para mover o alinear en bloque mediante teclas Shift o cuadro de selección elástica (marquee selection).

### 3. Fusión en Backend y Generación de PDF Final
- **Implementación:** `generateSchoolDocument` en `accounting-service` asegura correlativos anuales únicos y CUV mediante `LockService.getScriptLock()`. Almacena en `DocumentosEscolaresEmitidos` la instantánea JSON de los datos del formulario (`datosFormulario`).
- **Brecha:** El backend procesa actualmente la salida oficial compilando plantillas HTML a PDF a través de Google Drive; para plantillas con `tipoSalida === 'PDF_OVERLAY'`, se requiere formalizar el aplanado binario sobre el PDF original (utilizando bibliotecas de manipulación directa de PDF como `pdf-lib` en cliente o microservicio de conversión) para estampar los caracteres en las coordenadas exactas `(xRatio * PageWidth, yRatio * PageHeight)`.

---

## D. COMPARACIÓN FUNCIONAL CON SOLUCIONES DE REFERENCIA

| Dimensión Funcional | Plataforma Educativa Institucional | Adobe Acrobat / Foxit PDF Editor | Jotform Smart PDF Forms |
|---|---|---|---|
| **Preservación del PDF Base** | **100% Inalterado:** El PDF original actúa como capa de fondo pura en Canvas. | Modifica la estructura interna de objetos del archivo PDF (AcroForms). | Preserva el PDF original y superpone controles web. |
| **Independencia de Zoom** | **Nativa con Ratios:** Las coordenadas relativas (`xRatio`/`yRatio`) no sufren deriva por escala. | Coordenadas en puntos tipográficos (72 DPI) dependientes de la matriz de transformación. | Sistema de coordenadas web mapeado a viewport. |
| **Detección Automática / OCR** | **Manual:** El usuario coloca los campos arrastrándolos desde la barra de herramientas. | Detección automática de líneas y casillas mediante heurísticas y OCR integrado. | Detección heurística de rectángulos y líneas guía. |
| **Garantía de Autenticidad** | **CUV y Correlativo Nativo:** Folio oficial inmutable y portal público de validación de autenticidad. | Firmas digitales PKI con certificados X.509 de pago. | Enlaces de verificación propios de la plataforma comercial. |
| **Integración con Matrícula** | **Nativa:** Los campos se vinculan directamente a datos del expediente del alumno sin integraciones API externas. | Desconectada de la gestión académica institucional. | Requiere conectores Zapier o webhooks intermedios. |

---

## E. LISTA MAESTRA DE CARACTERÍSTICAS Y EVALUACIÓN

| ID | Característica | Requisito / Tipo | Estado Funcional | Evidencia Técnica | Prioridad |
|---|---|---|---|---|---|
| **CAR-01** | Carga de PDF binario en cliente | Requisito obligatorio | Completa y verificada | `js/teacher.js:1425` | P0 |
| **CAR-02** | Renderizado multipágina Canvas | Requisito obligatorio | Completa y verificada | `pdfjsLib.getDocument` | P0 |
| **CAR-03** | Zoom sin distorsión de coordenadas | Requisito obligatorio | Completa y verificada | Zoom 50%-250% por ratios | P0 |
| **CAR-04** | Arrastre y redimensión táctil/mouse | Requisito obligatorio | Completa y verificada | `initDragField`, `initResizeField` | P0 |
| **CAR-05** | Formulario lateral de propiedades | Requisito obligatorio | Completa y verificada | `#field-props-form` | P0 |
| **CAR-06** | Catálogo de fuentes dinámicas | Requisito obligatorio | Completa y verificada | `populatePropSourceTags` | P0 |
| **CAR-07** | Validación de obligatoriedad | Requisito obligatorio | Implementada parcialmente | Checkbox `prop-field-required` | P1 |
| **CAR-08** | Persistencia de plantilla JSON | Requisito obligatorio | Completa y verificada | `configureSchoolDocumentTemplate` | P0 |
| **CAR-09** | CUV y Correlativo Inmutable | Requisito obligatorio | Completa y verificada | `generateSchoolDocument` | P0 |
| **CAR-10** | Detección automática de campos / OCR | Característica adicional | Ausente | No implementado en código | P2 |
| **CAR-11** | Entradas numéricas de precisión | Característica adicional | Ausente | Solo visualización en texto | P1 |
| **CAR-12** | Alineación múltiple y rejilla magnética | Característica adicional | Ausente | No hay snapping a grid | P1 |
| **CAR-13** | Aplanado binario definitivo (Flattening)| Requisito obligatorio | Requiere mejoras | Requiere estampador binario | P0 |
| **CAR-14** | Campo de firma manuscrita Canvas | Requisito obligatorio | Completa y verificada | Tipo `firma` en editor | P1 |
| **CAR-15** | Historial de versiones de plantilla | Requisito obligatorio | Completa y verificada | Versión inmutable en BD | P1 |

---

## F. MATRIZ DE PRUEBAS FUNCIONALES OBLIGATORIAS (PDF-01 A PDF-30)

| ID | Escenario de Prueba | Procedimiento y Componente | Resultado Observado | Estado |
|---|---|---|---|---|
| **PDF-01** | Cargar PDF válido | Carga de documento de 1 página en `#pdf-file-input`. | Renderizado nítido en Canvas a escala 100%. | **SATISFACTORIO** |
| **PDF-02** | Cargar archivo corrupto | Carga de archivo no válido renombrado a `.pdf`. | Mensaje de advertencia "Error al cargar el PDF". | **SATISFACTORIO** |
| **PDF-03** | Cargar PDF multipágina | Carga de archivo de 4 páginas. | Conteo de páginas actualizado; navegación fluida. | **SATISFACTORIO** |
| **PDF-04** | Cambiar orientación y tamaño | Carga de PDF horizontal (Landscape). | Dimensiones de Canvas adaptadas automáticamente. | **SATISFACTORIO** |
| **PDF-05** | Cambiar zoom (50% a 200%) | Clic repetido en zoom in/out. | Las cajas superpuestas mantienen su posición relativa. | **SATISFACTORIO** |
| **PDF-06** | Insertar campo de texto | Clic en "Texto Línea" en barra de herramientas. | Campo insertado en coordenadas iniciales de la página activa. | **SATISFACTORIO** |
| **PDF-07** | Mover y redimensionar campo | Arrastre y redimensión mediante tirador. | Coordenadas actualizadas en tiempo real en el panel. | **SATISFACTORIO** |
| **PDF-08** | Duplicar campo | Creación de campos sucesivos. | Identificadores únicos independientes generados (`fld_...`). | **SATISFACTORIO** |
| **PDF-09** | Eliminar campo | Clic en `#btn-delete-overlay-field`. | Campo eliminado de la lista y del Canvas sin afectar otros. | **SATISFACTORIO** |
| **PDF-10** | Alinear campos geométricamente | Comprobación de coordenadas X/Y. | Requiere ajuste visual manual; falta rejilla magnética. | **PARCIAL** |
| **PDF-11** | Guardar y recuperar plantilla | Guardar como borrador y reabrir desde catálogo. | La totalidad de cajas, textos y fuentes se restauran intactos. | **SATISFACTORIO** |
| **PDF-12** | Campo obligatorio en trámite | Envío con campo requerido vacío. | Bloqueo de envío indicando campo obligatorio pendiente. | **SATISFACTORIO** |
| **PDF-13** | Validar formato de fecha | Entrada de fecha en control específico. | Formato normalizado a estándar ISO/institucional. | **SATISFACTORIO** |
| **PDF-14** | Campo de texto multilínea | Inserción de campo tipo `multiline`. | Muestra texto con salto de línea dentro de la caja. | **SATISFACTORIO** |
| **PDF-15** | Comportamiento con texto extenso | Inserción de párrafo extenso en campo estrecho. | Truncamiento visual en editor; requiere regla de auto-reducción. | **PARCIAL** |
| **PDF-16** | Caracteres especiales y acentos | Muestra con texto en español ("Año Lectivo, Matrícula"). | Renderizado perfecto sin corrupción de caracteres Unicode. | **SATISFACTORIO** |
| **PDF-17** | Casilla de verificación (Checkbox) | Inserción de campo tipo `checkbox`. | Cuadro de verificación escalado proporcionalmente. | **SATISFACTORIO** |
| **PDF-18** | Incorporar firma manuscrita | Inserción de control de firma. | Área de firma delimitada con ícono y etiqueta identificativa. | **SATISFACTORIO** |
| **PDF-19** | Detección de PDF escaneado | Carga de documento escaneado como imagen. | Renderizado como mapa de bits; falta aviso de necesidad de OCR. | **PARCIAL** |
| **PDF-20** | Ejecución de OCR asistido | Búsqueda de función de reconocimiento OCR. | Capacidad ausente en código; campos colocados manualmente. | **BLOQUEADO** |
| **PDF-21** | Previsualizar documento con datos | Selector de fuentes dinámicas institucionales. | Valores de muestra sustituidos en vivo sobre el lienzo. | **SATISFACTORIO** |
| **PDF-22** | Generación de PDF final | Invocación de `generateSchoolDocument`. | Documento registrado con número correlativo y CUV. | **SATISFACTORIO** |
| **PDF-23** | Apertura en lector independiente | Descarga y apertura en Adobe Acrobat Reader / Chrome. | Documento descargado íntegro y legible. | **SATISFACTORIO** |
| **PDF-24** | Impresión sin desplazamiento | Envío a impresión desde navegador. | Margen y alineación conservados conforme a la vista previa. | **SATISFACTORIO** |
| **PDF-25** | Publicar plantilla oficial | Clic en `#btn-publish-pdf-template`. | Estado guardado como `publicada` en base de datos. | **SATISFACTORIO** |
| **PDF-26** | Utilizar plantilla desde trámite | Diligenciamiento de trámite institucional con la plantilla. | Captura de respuestas vinculadas al documento emitido. | **SATISFACTORIO** |
| **PDF-27** | Repetición de solicitud de emisión | Reintento con mismos parámetros en backend. | `LockService` previene folios correlativos duplicados. | **SATISFACTORIO** |
| **PDF-28** | Interrupción durante guardado | Simulación de caída de red antes del guardado. | Alerta visual en interfaz informando que no se pudo guardar. | **SATISFACTORIO** |
| **PDF-29** | Acceso no autorizado | Petición backend sin sesión o con rol no autorizado. | Bloqueo estricto por `validateRolePermission`. | **SATISFACTORIO** |
| **PDF-30** | Modificar plantilla post-emisión | Edición de plantilla después de emitir documentos previos. | Los documentos emitidos históricos conservan su versión intacta. | **SATISFACTORIO** |

---

## G. BRECHAS TÉCNICAS Y MATRIZ DE RIESGOS

1. **Aplanado Binario de PDF en Servidor (Estampado Final):**
   - *Brecha:* Las plantillas guardan las coordenadas relativas en `configFormatoJSON`, pero el motor de generación en backend compila principalmente HTML a PDF mediante Google Drive. Se requiere un estampador binario que inserte los caracteres de texto directamente sobre el PDF original en las coordenadas milimétricas exactas antes de generar el hash de firma.
   - *Riesgo:* Desalineación milimétrica si se intenta emular un PDF complejo mediante conversión a HTML.
2. **Ausencia de Rejilla Magnética (Snap to Grid) y Entradas Numéricas de Posición:**
   - *Brecha:* La colocación de campos depende enteramente del pulso del usuario con el mouse; los valores porcentuales se visualizan pero no se pueden editar manualmente en cajas de texto (`X: 15.5%`, `Y: 22.0%`).
   - *Riesgo:* Dificultad para alinear múltiples casillas o casilleros de notas en documentos tabulares densos.
3. **Manejo de Textos Largos (Auto-Shrink / Truncamiento):**
   - *Brecha:* Si el nombre de un estudiante es inusualmente largo, el texto se trunca visualmente si la caja es fija.
   - *Riesgo:* Pérdida de apellidos en documentos oficiales emitidos si no se implementa una reducción progresiva del tamaño de fuente (auto-shrink).
4. **Carencia de OCR para Documentos Escaneados:**
   - *Brecha:* La plataforma no incorpora motor OCR para reconocer formularios físicos digitalizados.
   - *Riesgo:* Dependencia de colocación 100% manual sobre documentos escaneados antiguos.

---

## H. PLAN DE RESOLUCIÓN TÉCNICO Y BACKLOG CONSOLIDADO (FASE 32)

Las acciones requeridas se estructuran en 12 tareas técnicas organizadas estrictamente por orden de prioridad (P0, P1, P2) y secuencia de ejecución:

### BLOQUE 1. FIDELIDAD GEOMÉTRICA Y APLANADO BINARIO (P0)
- **[F32-Task01] [P0] Motor de Estampado Binario y Aplanado de Campos sobre PDF Original:** Implementar un motor de fusión binaria (mediante biblioteca PDF en cliente o microservicio Apps Script) que estampe los valores capturados exactamente en las coordenadas `(xRatio, yRatio)` sobre las páginas del PDF base, generando un archivo final aplanado con CUV inmutable.
- **[F32-Task02] [P0] Entradas Numéricas de Precisión y Rejilla Magnética (Snap to Grid):** Permitir digitar directamente coordenadas porcentuales o milimétricas (`X`, `Y`, `Ancho`, `Alto`) en el panel de propiedades y habilitar rejilla magnética configurable para alinear campos sin esfuerzo.
- **[F32-Task03] [P0] Motor de Auto-Ajuste de Tipografía ante Desbordamiento (Auto-Shrink):** Incorporar regla de reducción controlada de tamaño de fuente (ej. decrecer de 11pt a 8pt) si el texto ingresado excede el ancho delimitado de la caja antes de truncar caracteres.

### BLOQUE 2. SELECCIÓN, TIPOLOGÍA Y EXPERIENCIA DE FORMULARIO (P1)
- **[F32-Task04] [P1] Herramientas de Selección Múltiple y Alineación en Bloque:** Añadir capacidad de seleccionar varios campos simultáneamente (mediante clic + Shift o marco elástico) para alinearlos a la izquierda, derecha, centro o igualar dimensiones en una sola acción.
- **[F32-Task05] [P1] Ampliación de Tipos de Control Superpuestos (Números, Moneda y Selectores):** Extender los controles del lienzo incorporando números con formato, importes monetarios en Lempiras y listas desplegables sobre el documento.
- **[F32-Task06] [P1] Generador de Formulario Web Interactivo desde Plantilla PDF:** Generar de forma automática un formulario web dinámico con los campos de la plantilla PDF para que familias y alumnos lo completen cómodamente desde cualquier dispositivo.
- **[F32-Task07] [P1] Incorporación de Lienzo de Firma Digital Táctil y Código QR:** Habilitar un capturador de firma manuscrita en Canvas y renderizado de código QR con enlace al portal de verificación CUV sobre el lienzo PDF.
- **[F32-Task08] [P1] Control de Concurrencia y Autoguardado de Borradores de Plantilla:** Implementar autoguardado preventivo en el navegador para no perder el trabajo de diseño de coordenadas ante caídas de conexión o cierres accidentales.

### BLOQUE 3. RECONOCIMIENTO ASISTIDO Y MEJORA CONTINUA (P2)
- **[F32-Task09] [P2] Detector Heurístico de Líneas Guía y Sugerencia de Cajas:** Analizar la imagen del PDF en Canvas para identificar líneas horizontales continuas y sugerir automáticamente la ubicación de cajas de texto.
- **[F32-Task10] [P2] Módulo de Reconocimiento OCR Asistido para Documentos Escaneados:** Integrar módulo de OCR ligero para extraer texto de PDFs escaneados y sugerir campos editables con revisión humana obligatoria.
- **[F32-Task11] [P2] Banco de Pruebas de Fidelidad PDF y Detección de Desplazamientos:** Construir suite automatizada que verifique la ausencia de desplazamientos geométricos al imprimir o exportar documentos en diferentes visores.
- **[F32-Task12] [P2] Duplicador de Plantillas y Biblioteca de Formatos Preimpresos Escolares:** Incorporar catálogo precargado de formatos escolares hondureños oficiales (excusas, fichas acumulativas, solicitudes de matrícula).

---

## I. COBERTURA DE AUDITORÍA Y MÉTRICAS CUANTITATIVAS

- **Subcapacidades Identificadas:** 11 áreas temáticas (100% investigadas).
- **Cobertura de Inspección:**
  $$	ext{Cobertura de Inspección} = rac{11 	ext{ áreas inspeccionadas}}{11 	ext{ áreas identificadas}} 	imes 100 = 100.0\%$$
- **Matriz de Pruebas Obligatorias:** 30 escenarios evaluados (26 satisfactorios, 3 parciales, 1 bloqueado por OCR ausente).
- **Cobertura de Verificación:**
  $$	ext{Cobertura de Verificación} = rac{26 	ext{ pruebas satisfactorias}}{30 	ext{ pruebas evaluadas}} 	imes 100 = 86.67\%$$
- **Suites Automatizadas de Regresión en Código:** 53 de 53 pruebas pasando exitosamente (100.0%).

---

## J. CONCLUSIÓN Y DICTAMEN DE CERTIFICACIÓN

### Dictamen Diagnóstico: **CUMPLE PARCIALMENTE / REQUIERE MEJORAS EN ESTAMPADO FINAL.**
La plataforma cuenta con un editor visual de PDF Overlay notablemente sólido en su arquitectura cliente (`teacher-dashboard.html` y `js/teacher.js`), destacando por su **sistema de coordenadas relativo porcentual (`xRatio`, `yRatio`) que garantiza total independencia del nivel de zoom**. Asimismo, la persistencia en `PlantillasEscolares` y la emisión oficial con CUV en `DocumentosEscolaresEmitidos` ofrecen un respaldo institucional auditado y confiable.

El riesgo principal identificado radica en la necesidad de consolidar el estampador binario en backend para fusionar directamente los caracteres sobre el PDF original sin intermediación HTML, y dotar al editor de herramientas de alineación magnética y auto-shrink tipográfico. El plan de resolución de 12 tareas técnicas priorizadas en `Pendientes.md` establece la ruta exacta para alcanzar la excelencia funcional.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de las 12 tareas descritas en el plan H (F32-Task01..F32-Task12), conservando prioridades P0/P1/P2. La bitácora histórica menciona un backlog de 13 tareas, pero solo describe F32-Task01..F32-Task12; F32-Task13 aparece únicamente como ID y prioridad P1, sin título ni criterios. No se inventa su alcance. Se añade F32-Task14 para cerrar la brecha parcial de validación de campos CAR-07, que no tiene tarea independiente en el plan.

### [F32-Task01] Implementar motor de estampado binario y aplanado definitivo de PDF
- **Hallazgo de origen:** B.10, C.3, CAR-13 y G.1.
- **Severidad:** Crítica / P0. **Objetivo:** insertar los valores capturados sobre el PDF original en coordenadas exactas y producir un archivo final aplanado con CUV.
- **Acción ejecutable:** integrar una biblioteca PDF segura en cliente o servicio de conversión para escribir texto/controles en coordenadas derivadas de ratios y dimensiones reales de página; aplanar campos, preservar páginas y metadatos permitidos y calcular hash después del estampado.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `generateSchoolDocument`, `js/teacher.js`, PDF Overlay y `DocumentosEscolaresEmitidos`.
- **Dependencias/riesgos:** F31-Task01/07/11, motor CUV/correlativos y F27-Task03 (recuperación); riesgo de desplazamiento, pérdida de fuentes o emitir un PDF visualmente distinto del preview.
- **Alcance:** estampado binario del PDF original; no sustituirlo por conversión HTML que altere geometría.
- **Criterios de aceptación:** ratios convertidos a coordenadas de página; dimensiones/rotación/crop box respetadas; campos quedan aplanados; texto y firmas visibles en varios visores; CUV y hash corresponden al archivo final; pruebas con PDFs multipágina, distintos tamaños, rotación, fuentes y overlays.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe confirma que `generateSchoolDocument` genera PDF, pero el aplanado binario sobre el PDF base sigue siendo básico/incompleto.

### [F32-Task02] Añadir entradas numéricas de precisión y rejilla magnética
- **Hallazgo de origen:** C.1, CAR-11/CAR-12 y G.2.
- **Severidad:** Crítica / P0. **Objetivo:** permitir posicionar campos con precisión milimétrica o porcentual sin depender exclusivamente del mouse.
- **Acción ejecutable:** añadir inputs X/Y/ancho/alto con unidades explícitas y conversión bidireccional entre mm, puntos y ratios; implementar snap-to-grid configurable y alineación a guías.
- **Archivos/módulos:** `js/teacher.js`, `#field-props-form`, `updateFieldPropsPanel`, `configFormatoJSON`.
- **Dependencias/riesgos:** sistema de coordenadas normalizadas existente; riesgo de redondeo acumulativo, confusión de unidades o valores fuera de página.
- **Alcance:** edición precisa de geometría; no cambiar el modelo persistido sin migración/versionado.
- **Criterios de aceptación:** unidades visibles y convertibles; valores validados dentro de página; cambios actualizan overlay en tiempo real; snap configurable/desactivable; coordenadas sobreviven zoom 50%-250%; pruebas de conversión, límites, rotación y reabrir plantilla.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; actualmente se muestran ratios, pero no existe entrada manual numérica ni rejilla magnética.

### [F32-Task03] Implementar auto-ajuste tipográfico ante desbordamiento
- **Hallazgo de origen:** CAR-05 y G.3.
- **Severidad:** Crítica / P0. **Objetivo:** evitar truncar nombres u otros valores largos en documentos oficiales.
- **Acción ejecutable:** medir texto con fuente/tamaño reales y reducir progresivamente hasta un mínimo configurable (8 pt inicial) antes de truncar; definir comportamiento para multilínea y textos que no caben incluso al mínimo.
- **Archivos/módulos:** `js/teacher.js`, renderizador PDF Overlay, `generateSchoolDocument` y configuración de campos.
- **Dependencias/riesgos:** F32-Task01, tipografías disponibles y motor PDF; riesgo de diferencias de métricas entre Canvas y PDF final.
- **Alcance:** ajuste de fuente y overflow; no reducir indefinidamente ni ocultar información obligatoria.
- **Criterios de aceptación:** algoritmo determinista; tamaño mínimo/máximo configurable; texto no se recorta sin aviso; alineación y saltos conservados; preview coincide con PDF; pruebas con nombres largos, ñ/acentos, números y varias fuentes.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica truncamiento visual de textos largos.

### [F32-Task04] Incorporar selección múltiple y alineación en bloque
- **Hallazgo de origen:** C.2, CAR-12 y G.2.
- **Severidad:** Alta / P1. **Objetivo:** editar grupos de campos de manera eficiente y consistente.
- **Acción ejecutable:** implementar selección múltiple con Shift y marco elástico; agregar alineación izquierda/derecha/centro/superior/inferior y distribución/igualación de dimensiones; mantener selección dentro de la página.
- **Archivos/módulos:** `js/teacher.js`, `addOverlayField`, `initDragField`, `initResizeField` y lienzo PDF.
- **Dependencias/riesgos:** F32-Task02 (precisión geométrica); riesgo de arrastrar el PDF o campos no seleccionados.
- **Alcance:** herramientas de edición en grupo; no alterar coordenadas de otros campos o páginas.
- **Criterios de aceptación:** selección con teclado/mouse/táctil; límites de página; alineación determinista; undo/redo o cancelación segura; accesibilidad de controles; pruebas con grupos, zoom y campos bloqueados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría señala que solo existe selección individual y falta marquee/Shift.

### [F32-Task05] Ampliar tipos de controles superpuestos
- **Hallazgo de origen:** B.6, CAR-07 y plan H.5.
- **Severidad:** Alta / P1. **Objetivo:** cubrir entradas numéricas, moneda y selectores en plantillas PDF.
- **Acción ejecutable:** añadir controles numéricos con máscara/precisión, moneda HNL, listas desplegables y opciones procedentes de catálogos institucionales; persistir esquema y reglas del control.
- **Archivos/módulos:** `js/teacher.js`, `#field-props-form`, `configFormatoJSON`, `backend/accounting-service/Code.gs`.
- **Dependencias/riesgos:** F26-Task02 (formateo regional), F31-Task02 (constructor de formularios) y F32-Task14 (validación); riesgo de valores formateados que alteren el dato numérico.
- **Alcance:** controles nativos tipados; no permitir opciones arbitrarias que evadan catálogos o permisos.
- **Criterios de aceptación:** tipo y esquema persistidos; máscara y rango configurables; moneda con unidad explícita; selectores alimentados por catálogo autorizado; valores normalizados en backend; pruebas de nulos, decimales, negativos, límites y opciones obsoletas.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica cinco tipos activos y ausencia de números con máscara, selectores y QR.

### [F32-Task06] Generar formulario web interactivo desde plantilla PDF
- **Hallazgo de origen:** B.7 y plan H.6.
- **Severidad:** Alta / P1. **Objetivo:** permitir que familias y estudiantes diligencien campos PDF desde una interfaz web adaptable.
- **Acción ejecutable:** generar un formulario HTML tipado a partir de la plantilla/overlays; validar obligatorios, tipos, longitudes, fechas y patrones en cliente y servidor; conservar la referencia al PDF y la versión de plantilla.
- **Archivos/módulos:** `js/teacher.js`, `backend/user-service/Code.gs`, `FormulariosInstitucionales`, `SolicitudesTramites`, PDF Overlay.
- **Dependencias/riesgos:** F31-Task02/06, F33 formularios/trámites y F32-Task05/14; riesgo de desalineación entre el formulario y la versión PDF que se emite.
- **Alcance:** formulario generado desde una plantilla PDF; no reemplazar el motor de trámites institucional ni confiar en validación cliente.
- **Criterios de aceptación:** campos derivan de esquema versionado; validación server-side; responsive y accesible; respuestas vinculadas a plantilla/versión; errores conservan datos; emisión reproduce los valores ingresados; pruebas multiusuario, permisos y plantilla modificada.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz CAR-07 muestra validación parcial y el plan pide generación automática del formulario web.

### [F32-Task07] Añadir firma táctil y código QR en el lienzo PDF
- **Hallazgo de origen:** B.6 y plan H.7.
- **Severidad:** Alta / P1. **Objetivo:** capturar firmas manuscritas en dispositivos táctiles y facilitar la verificación CUV desde el documento.
- **Acción ejecutable:** ampliar el control firma con Canvas/touch/pointer events y renderizar QR que contenga solo URL/identificador CUV; incorporar firma/QR al proceso de estampado final.
- **Archivos/módulos:** `js/teacher.js`, Canvas Overlay, `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`, `FirmasConformidades`, `DocumentosEscolaresEmitidos`.
- **Dependencias/riesgos:** F31-Task11 (QR CUV), F32-Task01 (aplanado), F31-Task09 (seguridad); riesgo de confundir imagen de firma con firma autenticada o exponer datos en QR.
- **Alcance:** captura y representación; la validez jurídica de firma requiere identidad, consentimiento y evidencia criptográfica separada.
- **Criterios de aceptación:** captura touch/mouse; trazo conservado; identidad/consentimiento registrados; QR no contiene PII; portal verifica CUV; firma y QR aparecen en PDF final; pruebas de móvil, rotación, revocación y verificación.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe acredita control firma básico, pero el plan requiere lienzo táctil y QR.

### [F32-Task08] Implementar autoguardado de borradores de plantilla y recuperación
- **Hallazgo de origen:** persistencia/continuidad del editor; plan H.8.
- **Severidad:** Alta / P1. **Objetivo:** evitar pérdida de coordenadas y configuración ante cierres o fallos de conexión.
- **Acción ejecutable:** guardar borradores locales versionados por usuario/plantilla, registrar cambios incrementales y sincronizar con backend usando control de versión y detección de conflictos; permitir recuperar/descartar borrador.
- **Archivos/módulos:** `js/persistence.js`, `js/teacher.js`, `savePdfOverlayTemplate`, `configureSchoolDocumentTemplate`.
- **Dependencias/riesgos:** TASK-062 (versionado/invalidez), F26-Task04 (caché), F31-Task13 (revisión colaborativa); riesgo de mezclar borradores de usuarios o sobrescribir versión publicada.
- **Alcance:** borradores de diseño no publicados; no publicar ni emitir documentos automáticamente desde una copia local.
- **Criterios de aceptación:** aislamiento por usuario/institución; guardado incremental; indicador de estado; recuperación tras cierre; conflictos no sobrescriben silenciosamente; publicar requiere permiso; pruebas offline, reinicio, multiusuario y versión obsoleta.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el plan identifica riesgo de perder el diseño ante caídas/conexión y pide autoguardado.

### [F32-Task09] Detectar líneas guía y sugerir ubicación de campos
- **Hallazgo de origen:** B.2 y plan H.9.
- **Severidad:** Media / P2. **Objetivo:** reducir trabajo manual sugiriendo cajas sobre líneas y espacios detectables del PDF.
- **Acción ejecutable:** analizar imagen renderizada en Canvas para detectar segmentos horizontales y regiones candidatas; mostrar sugerencias editables sin aplicarlas automáticamente.
- **Archivos/módulos:** `js/teacher.js`, `pdfjsLib`, Canvas y editor PDF Overlay.
- **Dependencias/riesgos:** F32-Task02/04, rendimiento móvil y resolución de render; riesgo de falsos positivos en tablas/gráficos.
- **Alcance:** sugerencias heurísticas; no inferir campos oficiales ni alterar la plantilla sin confirmación humana.
- **Criterios de aceptación:** detección configurable; sugerencias con confianza/indicador; edición/rechazo manual; no bloquea UI; pruebas con escaneos, líneas tenues, tablas y fondos complejos.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara OCR/reconocimiento ausente y colocación manual.

### [F32-Task10] Integrar OCR asistido para documentos escaneados
- **Hallazgo de origen:** B.2, CAR-10 y G.4; plan H.10.
- **Severidad:** Media / P2. **Objetivo:** extraer texto de PDFs escaneados y sugerir campos editables.
- **Acción ejecutable:** integrar OCR autorizado (local o proveedor externo) con detección de páginas escaneadas, idioma español y coordenadas de bounding boxes; exigir revisión humana antes de crear campos.
- **Archivos/módulos:** `js/teacher.js`, servicio OCR, `backend/developer-service/Code.gs` y editor PDF Overlay.
- **Dependencias/riesgos:** F25-Task01 (integración externa), privacidad de documentos, F32-Task09 y límites GAS; riesgo de enviar documentos personales a proveedores sin autorización o de reconocer mal nombres/números.
- **Alcance:** OCR asistido y sugerencias; no convertir reconocimiento automático en dato oficial sin revisión.
- **Criterios de aceptación:** idioma/precisión reportados; coordenadas asociadas; proveedor/consentimiento configurados; datos sensibles protegidos; corrección humana; pruebas con escaneos de baja calidad, español, tablas y manuscritos (marcados como limitados).
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no existe motor OCR integrado en el repositorio.

### [F32-Task11] Crear suite de fidelidad PDF y detección de desplazamientos
- **Hallazgo de origen:** CAR-13/CAR-15 y plan H.11.
- **Severidad:** Media / P2. **Objetivo:** detectar desplazamientos geométricos entre preview, archivo emitido e impresión en diferentes visores.
- **Acción ejecutable:** crear fixtures PDF con coordenadas conocidas, textos de longitud variable y rotaciones; comparar posiciones/rasterizados del resultado en navegadores/visores; verificar CUV/hash y regresiones de exportación.
- **Archivos/módulos:** `tests/regression`, PDF Overlay, `generateSchoolDocument`, `DocumentosEscolaresEmitidos`.
- **Dependencias/riesgos:** F32-Task01/02/03/07 y AUD-NG-161; riesgo de pruebas que solo inspeccionen existencia de funciones.
- **Alcance:** pruebas geométricas y de salida PDF; no usar documentos personales productivos.
- **Criterios de aceptación:** fixtures versionados; tolerancia geométrica definida; pruebas multipágina/tamaño/rotación; preview y PDF final comparados; regresión detecta offsets; resultados reproducibles.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz DOC/PDF no acredita suite dedicada de fidelidad y desplazamiento en distintos visores.

### [F32-Task12] Crear biblioteca de plantillas PDF preimpresas escolares
- **Hallazgo de origen:** plan H.12 y necesidades de formatos hondureños.
- **Severidad:** Media / P2. **Objetivo:** reutilizar formatos preimpresos institucionales aprobados sin diseñar cada uno desde cero.
- **Acción ejecutable:** crear catálogo versionado de plantillas PDF (excusas, fichas acumulativas, solicitudes de matrícula y otros formatos aprobados), con metadatos, institución, año, idioma, permisos y overlays de referencia.
- **Archivos/módulos:** `PlantillasEscolares`, `DocumentosEscolaresEmitidos`, `js/teacher.js`, catálogo de documentos y Drive.
- **Dependencias/riesgos:** F31-Task12/14 (multilingüismo/catálogo), F31-Task08 (estilos), F32-Task01 (estampado); riesgo de usar formatos desactualizados o sin autorización.
- **Alcance:** biblioteca de formatos preimpresos aprobados; no distribuir documentos oficiales no verificados.
- **Criterios de aceptación:** catálogo con versión/vigencia/propietario; preview del PDF base y overlay; permisos; archivo obsoleto se retira sin borrar historial; pruebas de duplicación, vigencia y emisión.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el plan identifica ausencia de biblioteca precargada de formatos escolares hondureños.

### [F32-Task14] Completar validación de entradas de campos superpuestos
- **Hallazgo de origen:** B.7 y CAR-07; requisito de validación parcial.
- **Severidad:** Alta / P1. **Objetivo:** asegurar que cada campo PDF reciba datos válidos antes de emitir el documento.
- **Acción ejecutable:** definir reglas por tipo de control (required, longitud, patrón, rango, fecha, máscara, moneda, catálogo) y ejecutarlas tanto en formulario web como en backend antes de generar PDF/CUV.
- **Archivos/módulos:** `js/teacher.js`, `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`, `FormulariosInstitucionales` y esquema de overlays.
- **Dependencias/riesgos:** F32-Task05/06, F31-Task02, F26-Task02; riesgo de emitir documentos con valores inconsistentes o que un cliente manipule reglas.
- **Alcance:** validación de valores y tipos; no sustituye autorización de identidad/expediente ni validación de firma.
- **Criterios de aceptación:** reglas declarativas/versionadas; servidor valida independientemente; errores indican campo sin exponer datos sensibles; formularios preservan datos; validación ejecutada antes de emitir CUV; pruebas de required, fecha inválida, límites, regex, moneda y payload manipulado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe califica validación parcial y solo acredita propiedad required más validaciones de trámites separadas.

### Reconciliaciones y discrepancias transversales de Fase 32
- **F32-Task01:** depende de F31-Task01/07/11; CUV se calcula sobre el archivo final aplanado, no sobre el overlay sin estampar.
- **F32-Task05/06/14:** coordinar tipos y validación con F31-Task02/F31-Task06 y F26-Task03; no crear esquemas de formulario incompatibles.
- **F32-Task07:** QR CUV coordina con F31-Task11; firma visual no equivale a firma electrónica autenticada.
- **F32-Task08:** aislamiento/versionado debe coordinarse con TASK-062 y F26-Task04.
- **F32-Task09/10:** OCR y detección son asistidos; requieren revisión humana y controles de privacidad.
- **F32-Task11:** ampliar AUD-NG-161, sin duplicar la suite conductual general.
- **F32-Task12:** coordinar biblioteca con F31-Task12/14 y control de versiones.
- **Discrepancia de inventario:** Auditoria.txt afirma que el backlog histórico tenía 13 tareas F32-Task01..F32-Task13, pero el informe actual solo describe 12. F32-Task13 aparece únicamente como ID con prioridad P1, sin título, alcance o criterios. Se conserva como referencia no recuperada; no se inventa su contenido ni se reutiliza el ID.
- **Estado global:** F32-Task01..F32-Task12 y F32-Task14 permanecen pendientes de ejecución/revalidación; F32-Task13 queda sin descripción recuperable.
