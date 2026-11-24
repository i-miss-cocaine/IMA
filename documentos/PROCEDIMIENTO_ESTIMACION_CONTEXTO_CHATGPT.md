# Procedimiento de estimación de capacidad de una conversación de ChatGPT

**Fecha de registro inicial:** 2026-11-04  
**Contexto:** Auditorías y mantenimiento del repositorio IMA mediante ChatGPT y el conector de GitHub.

## 1. Qué cuota se está intentando evitar

Hay que distinguir dos límites diferentes:

- **Límite de uso del plan/modelo:** controla el acceso a determinados modelos o herramientas durante una ventana de uso. Depende del plan, modelo, herramienta y políticas vigentes.
- **Límite de contexto de una conversación:** limita la cantidad de información que el modelo puede mantener disponible dentro de un chat. Incluye instrucciones, mensajes, respuestas, código recuperado, resultados de herramientas y razonamiento. Cuando se llena, el chat puede dejar de aceptar nuevos mensajes aunque el uso general del chat de texto no se haya agotado.

La documentación oficial indica que el plan Gratis permite chats de texto cotidianos ilimitados sujetos a medidas de protección, pero mantiene límites separados para herramientas. También indica que no existe un número fijo de mensajes por conversación: el aviso de contexto lleno depende del volumen de contenido de ese chat. Por ello, no se debe confundir el agotamiento del contexto con el límite de mensajes del plan.

## 2. ¿Se puede calcular un número exacto de tareas?

**No con los datos disponibles.** ChatGPT no expone en esta conversación un contador verificable de tokens restantes ni una tarifa fija de contexto por tarea. El consumo cambia según:

- Tamaño y complejidad de los archivos inspeccionados.
- Cantidad de líneas y fragmentos de código recuperados.
- Número y extensión de resultados de GitHub.
- Profundidad del análisis y razonamiento requerido.
- Cantidad de historial que permanece dentro del chat.
- Herramientas y modelo utilizados.

Por tanto, asignar un número fijo de tareas por chat sería una estimación inventada y podría provocar una interrupción durante una operación documental.

## 3. Fórmula cuando existan mediciones reales

Si en el futuro se dispone de métricas reales de tokens disponibles y consumo medio por tarea, utilizar:

`T_{seguras}=\left\lfloor\frac{C_{disponible}-R}{C_{medio\ por\ tarea}}\right\rfloor`

Donde:

- `C_disponible`: tokens de contexto que realmente quedan disponibles para el trabajo (no el tamaño nominal total de la ventana).
- `R`: reserva de seguridad. Usar inicialmente el 30 % de `C_disponible` para instrucciones, resultados imprevistos y cierre seguro.
- `C_medio por tarea`: mediana observada del consumo de contexto de tareas comparables, medida con datos reales y no deducida únicamente del número de mensajes.

No aplicar la fórmula si falta cualquiera de esas mediciones. La ventana nominal no equivale al contexto libre, porque también la ocupan instrucciones, memoria y procesamiento interno.

## 4. Procedimiento conservador mientras no exista telemetría

1. Trabajar por módulos funcionales pequeños y con alcance delimitado.
2. Completar la inspección de un bloque antes de iniciar otro.
3. Guardar el avance documental en un commit independiente por bloque lógico, sin mezclar auditorías distintas.
4. Verificar el commit y la rama después de cada escritura.
5. Mantener un resumen de continuidad con tareas revisadas, archivos inspeccionados, hallazgos, referencias y siguiente paso.
6. No iniciar una modificación de archivo si no hay margen para inspeccionar el resultado y verificar que el contenido anterior se conservó.
7. Ante señales de contexto cercano al límite o pérdida de precisión, detener el trabajo en un punto seguro, registrar el estado y continuar en un chat nuevo con el resumen y las referencias de commits.

**Lote inicial recomendado para una auditoría nueva:** una tarea compleja o un pequeño grupo de tareas estrechamente relacionadas por commit. No es un límite matemático; es una política preventiva que deberá ajustarse con la experiencia registrada. No aumentar el lote hasta contar con varias ejecuciones completas sin interrupciones.

## 5. Registro empírico para calibración futura

Después de cada sesión de trabajo, anotar:

- Fecha y modelo/herramienta usados.
- Tareas terminadas y su complejidad (baja, media o alta).
- Archivos y volumen aproximado inspeccionado.
- Si hubo aviso de contexto lleno, límite de uso o interrupción.
- Punto exacto donde se guardó el último commit.
- Si el resumen permitió reanudar sin repetir ni perder trabajo.

Tras acumular varias sesiones comparables, calcular la mediana de tareas terminadas por lote y reducirla con una reserva de seguridad. La mediana histórica sirve solo como referencia operativa; no garantiza que una próxima tarea consuma lo mismo.

## 6. Fuentes oficiales consultadas el 2026-11-04

- ChatGPT Free Tier FAQ: https://help.openai.com/en/articles/9275245-chatgpt-free-tier-faq
- GPT-6 y otros modelos en ChatGPT: https://help.openai.com/en/articles/20001354-gpt-6-and-other-models-in-chatgpt
- Understanding ChatGPT and Codex usage limits: https://help.openai.com/en/articles/20001625-understanding-chatgpt-and-codex-usage-limits

**Conclusión:** no se declara un número exacto de tareas por conversación. La protección efectiva consiste en lotes pequeños, commits modulares verificados y un resumen de continuidad persistente.