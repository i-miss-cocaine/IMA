
# Contrato de política de referencias interdepartamentales

**Tarea:** PM-01 / TASK-153; diseño técnico puro para la política de aislamiento y referencias compartidas.  
**Estado:** motor de decisión y contrato sintético implementados; sin callsites productivos, configuración real ni cambios de datos.

## Configuración institucional

La configuración se carga desde ConfiguracionInstitucional en el servidor, filtrada por InstitutionID. El cliente no puede enviar ni sobrescribir la política.

- Clave: POLITICA_ESTRICTA_AISLAMIENTO_DEPARTAMENTAL.
- Valores: BLOQUEO_TOTAL_CROSS_DEPARTAMENTO y PERMITIR_REFERENCIA_SOLO_LECTURA_INTERDEPARTAMENTAL.
- Ausencia de clave: BLOQUEO_TOTAL_CROSS_DEPARTAMENTO.
- Valor desconocido o configuración de otro tenant: denegación.

## Contexto confiable requerido

evaluateDepartmentReferenceAccess_ recibe:
- actorContext: identidad verificada, UserID, MembershipID, RoleID, InstitutionID y activeDepartmentId derivados de la sesión/membresía vigentes. La excepción institucional requiere institutionWide=true e institutionWideAuthorized=true emitidos por autorización del servidor.
- resourceOwnership: referencia verificada por el servidor con InstitutionID, DepartmentID propietario, ResourceType y ResourceID. No se acepta propietario del payload.
- institutionalConfig: configuración institucional ya resuelta por tenant.
- referenceGrants: filas actuales de la tabla de concesiones.
- operation, requestedFields, requestedDocumentIds y reloj now del servidor.

La función es pura y no sustituye autenticación, RBAC, comprobación de responsabilidad/capacidad ni autorización normal del recurso. Toda decisión positiva conserva requiresStandardAuthorization=true.

## Política

1. Mismo departamento: la política interdepartamental no bloquea; el consumidor continúa con los permisos normales.
2. Alcance institucional: solo se admite con autorización institucional explícita y verificada; no se infiere por nombre de rol.
3. Cruce de departamentos con política estricta: denegado, incluso si se aporta una concesión.
4. Cruce con política permisiva: únicamente READ_REFERENCE y una concesión activa, exacta, no revocada y vigente. No se permiten READ_METADATA, READ_CONTENT, DOWNLOAD, CREATE, EDIT, DELETE, APPROVE, SIGN, SHARE, REVOKE, EXPORT ni READ_HISTORY.

## Esquema propuesto DepartmentReferenceGrants

InstitutionID, GrantID, ResourceType, ResourceID, OwnerDepartmentID, TargetDepartmentID, AllowedFieldsJSON, AllowedDocumentIDsJSON, AuthorizedBy, AuthorizedAt, ValidFrom, ExpiresAt, Status, RevokedAt y RevokedBy.

- La concesión se liga a un único tenant, recurso, departamento propietario y departamento destino.
- AuthorizedBy y AuthorizedAt son obligatorios.
- ValidFrom y ExpiresAt son obligatorios; el intervalo efectivo es ValidFrom <= now < ExpiresAt.
- Status debe ser ACTIVE y RevokedAt debe estar vacío.
- AllowedFieldsJSON debe contener campos explícitos; AllowedDocumentIDsJSON limita documentos individuales. No se acepta wildcard.
- Una concesión duplicada para el mismo ámbito falla por ambigüedad.
- Cada uso vuelve a comprobar la fila vigente; no se reutiliza una autorización cacheada.

## Auditoría

La función devuelve auditEvent con actor, membresía, rol, institución, departamentos, recurso, operación, decisión, motivo, GrantID, AuthorizedBy, campos/documentos solicitados y timestamp. El consumidor debe persistir este evento antes de exponer el contenido; la función no escribe bitácoras ni datos.

## Evidencia y límites

El contrato sintético prueba default estricto, mismo departamento, alcance institucional autorizado/no autorizado, tenant y ownership verificados, recurso exacto, operaciones denegadas, allowlists de campos/documentos, concesión ausente/duplicada/inactiva/revocada/futura/vencida, autor, vigencia, configuración no vinculada, auditoría y reloj.

No se crea ConfiguracionInstitucional ni DepartmentReferenceGrants en Sheets, no se leen datos productivos y no se habilita acceso real. La integración en cada consumidor y la persistencia de auditoría requieren una fase posterior de TASK-153.


### Reglas adicionales de seguridad del contrato

- La tabla DepartmentReferenceGrants solo puede escribirse mediante un endpoint administrativo del servidor con RBAC explícito; nunca desde el cliente. La función consumidora confía únicamente en snapshots cargados por el servidor.
- El auditEvent registra los campos y documentos solicitados incluso en denegación. La respuesta de denegación no devuelve las allowlists completas; el consumidor conserva el evento y no entrega contenido antes de persistirlo.


## Evidencia de implementación C1.684
- `backend/user-service/Code.gs` contiene `evaluateDepartmentReferenceAccess_`, función pura sin lecturas/escrituras ni efectos laterales.
- `tests/security/department-reference-policy.test.js` cubre 28 escenarios: default estricto, mismo departamento, alcance institucional explícito, tenant, ownership, operaciones, allowlists, concesiones ausentes/duplicadas/inactivas/revocadas/futuras/vencidas, autor y vigencia, wildcard, configuración inválida, auditoría de denegaciones y requisito de autorización estándar.
- Department Scope CI run 43420632732: SUCCESS, Node.js 24.22.2. El paso `Run interdepartmental reference policy contract` y la sintaxis de los seis servicios finalizaron correctamente.
- No existen todavía callsites productivos ni persistencia real de `DepartmentReferenceGrants`, configuración institucional o auditEvent. El helper no habilita por sí solo ningún acceso; la integración y persistencia previas a la entrega de contenido son obligatorias.
