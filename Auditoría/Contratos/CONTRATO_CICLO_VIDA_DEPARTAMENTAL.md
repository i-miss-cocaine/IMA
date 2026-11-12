
# Contrato de identidad y ciclo de vida de departamentos

**Tarea:** PM-01 / TASK-153 / T153-S01-3 (incremento técnico neutral).  
**Estado:** validador puro y pruebas sintéticas; no define semántica institucional ni escribe datos.

## Principios de identidad

- DepartmentID es estable e inmutable. Nombre y código visible pueden cambiar sin reemplazar la identidad.
- Código externo siempre lleva namespace; los códigos activos no colisionan dentro del mismo namespace.
- La jerarquía permite unidades raíz sin ParentDepartmentID; los padres referenciados deben existir y estar activos, y no puede formarse un ciclo.
- Estados y transiciones son configurables por institución/dominio mediante una configuración aprobada. El motor no impone un catálogo institucional de estados.
- Cada evento de ciclo de vida tiene EventID, DepartmentID, tipo, fecha efectiva, actor, motivo y aprobación/referencia cuando la regla lo exige.

## Eventos soportados por el contrato

- RENAME: cambia nombre, conserva DepartmentID y registra antes/después.
- CHANGE_CODE: cambia código/namespace sin perder el valor histórico.
- CHANGE_PARENT: cambia padre; permite dejar una unidad sin padre, pero no referencias inexistentes/inactivas ni ciclos.
- Transiciones de estado configuradas: desactivar/reactivar, cerrar/reabrir, fusionar y dividir. El motor verifica estado origen y destino según reglas aprobadas.
- MERGE: el ID de origen permanece como registro histórico y referencia el ID destino activo. No se reasigna automáticamente la propiedad de recursos.
- SPLIT: el ID original permanece como histórico; se devuelven propuestas de nuevos IDs únicos. No se crean registros ni se reparten recursos automáticamente.

## Historial e idempotencia

La tabla propuesta DepartmentIdentityHistory registra InstitutionID, Domain, EventID, DepartmentID, EventType, EffectiveAt, ChangedBy, ApprovedBy, ApprovalReference, Reason, before/after, RelatedDepartmentIDs y firma del evento.

- El snapshot y el historial deben llegar prefiltrados por institución/dominio; el validador exige una declaración de ámbito verificado y rechaza filas históricas de otro tenant/dominio.
- EventID repetido con firma idéntica es idempotente; mismo EventID con contenido distinto o duplicado ambiguo se rechaza.
- Los eventos nuevos deben seguir el orden temporal de la identidad; fechas inválidas, futuras o fuera de la vigencia del registro se rechazan.
- Cada cambio produce una propuesta de nextRecord e historyRow; no realiza escrituras. El consumidor debe persistir historial y estado en una transacción/flujo atómico separado.

## Límites

El contrato no elige estados institucionales, tipos de unidad, fuente canónica ni dueño del dato. No crea IDs reales, no ejecuta fusiones/divisiones, no modifica propietarios ni migra expedientes. Las decisiones y aprobación institucionales de S01-0/S01-2/S01-4/S01-7 siguen pendientes. El motor solo prepara reglas configurables para validación futura.



## Validaciones adicionales de C1.649

- La configuración de reglas requiere versión y referencia de aprobación; ambas quedan registradas en cada fila histórica.
- El snapshot se acepta solo con scope verificado por servidor (InstitutionID y Domain coincidentes); cada fila de historial también debe pertenecer al mismo scope.
- EventID repetido con la misma firma es idempotente; una firma diferente, duplicidad ambigua o evento fuera de orden se rechaza.
- En este incremento no se aceptan eventos futuros para aplicación inmediata. Los eventos futuros programados requieren un contrato separado de activación temporal.
- Los estados/transiciones son parámetros aprobados; no se fijan valores institucionales en el motor.
