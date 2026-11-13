
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


## Evidencia de configuración institucional C1.685
- Se incorporó `ConfiguracionInstitucional` con esquema exacto `InstitutionID`, `ConfigKey`, `ConfigValue`, `UpdatedBy`, `UpdatedAt`; la clave es `POLITICA_ESTRICTA_AISLAMIENTO_DEPARTAMENTAL`.
- `getDepartmentReferencePolicy_` filtra por InstitutionID, no crea hojas y aplica `BLOQUEO_TOTAL_CROSS_DEPARTAMENTO` cuando falta hoja/clave; esquema incompatible, duplicados o valores desconocidos fallan cerrados.
- `getDepartmentReferencePolicy` y `setDepartmentReferencePolicy` están conectados al dispatcher `doPost`. Exigen sesión verificada y permisos dinámicos; la escritura exige `institutionWide` derivado del scope servidor, usa ScriptLock y deriva tenant del contexto, nunca del payload. El setter permite reparar un valor inválido con autorización.
- `tests/security/department-reference-policy-storage.test.js`: 20 escenarios PASS. Department Scope CI run 43421342354 SUCCESS (Node.js 24.22.2), junto con 28 escenarios del evaluador y sintaxis de servicios.
- No se ha creado ni modificado una hoja de producción; la prueba usa mocks. No hay UI administrativa, `DepartmentReferenceGrants`, ni consumidores productivos todavía.


## Evidencia de administración de concesiones C1.686
- Se añadió `DepartmentReferenceGrants` con encabezados estrictos `InstitutionID`, `GrantID`, `ResourceType`, `ResourceID`, `OwnerDepartmentID`, `TargetDepartmentID`, `AllowedFieldsJSON`, `AllowedDocumentIDsJSON`, `AuthorizedBy`, `AuthorizedAt`, `ValidFrom`, `ExpiresAt`, `Status`, `RevokedAt`, `RevokedBy`.
- Endpoints USER `createDepartmentReferenceGrant`, `getDepartmentReferenceGrants` y `revokeDepartmentReferenceGrant` conectados a `doPost`. Las mutaciones requieren identidad verificada, permiso dinámico y ámbito institucional autenticado; el tenant nunca se acepta desde el payload.
- La creación valida ownership único ACTIVE en `ResourceOwnership`, departamento destino con asignación activa en `AsignacionesAmbitosRoles`, allowlists sin wildcard/duplicados, ventana temporal y duplicados activos. Create/revoke usan `ScriptLock`.
- La autorización de auditoría se registra antes de la mutación; fallo del log bloquea escritura/revocación. Revocación idempotente y append-only; regrant crea nueva fila/GrantID sin borrar historial.
- `tests/security/department-reference-grant-admin.test.js`: 26 escenarios PASS. Department Scope CI run 43423152036 SUCCESS, Node.js 24.22.2; además 28 escenarios evaluator, 20 policy storage, ResourceOwnership ABAC y syntax-check de servicios/clientes.
- Las pruebas usan mocks; no se creó ni modificó hoja de producción. Sin UI administrativa, callsites consumidores ni auditoría persistida de cada lectura compartida previa a entrega de contenido, el acceso cross-departamento permanece sin habilitar.


## Evidencia de auditoría durable y autorización de lectura C1.687
- Se añadió `appendDepartmentReferenceAuditEvent_`: valida encabezados exactos de `LogsSistema`, genera ID único y verifica que exactamente una fila con ese ID quedó persistida. No usa `logStructuredEvent` para operaciones críticas porque esa función absorbe excepciones.
- `createDepartmentReferenceGrant` y `revokeDepartmentReferenceGrant` registran autorización antes de mutar; si falla la escritura previa, la mutación se cancela. La escritura posterior se reporta mediante `auditCompletionRecorded`.
- `authorizeDepartmentReferenceRead` deriva actor/membresía/institución/departamento del contexto de sesión; exige `readDepartmentReference`; obtiene ownership, política y grants desde almacenamiento tenant-scoped; evalúa `READ_REFERENCE`; persiste ALLOW/DENY antes de responder. No devuelve contenido; devuelve solo campos/documentos solicitados cuando están autorizados y `requiresStandardAuthorization:true`.
- `tests/security/department-reference-read-authorization.test.js`: 23 escenarios PASS. `tests/security/department-reference-grant-admin.test.js`: 26 escenarios PASS. Department Scope CI run 43423969896 SUCCESS (Node.js 24.22.2), con 20 policy storage, 28 evaluator, ABAC y sintaxis Apps Script/clientes.
- **Corrección de evidencia C1.686:** el primer intento de auditoría usaba `logStructuredEvent`, que absorbe errores. C1.687 lo reemplaza por append directo fail-closed y prueba el fallo de persistencia. No se debe interpretar C1.686 por sí solo como garantía de auditoría durable.
- No hay callsites consumidores, transporte interservicio dedicado ni UI administrativa; el endpoint no entrega contenido y no habilita por sí solo referencias productivas. Sin hojas reales ni datos de producción.


## Evidencia de consumidor ACCOUNTING C1.690
- Se integró getEmployeeDocuments con authorizeDepartmentReferenceRead en USER para el recurso EXPEDIENTE_LABORAL. Solo entra al flujo de referencia cuando la autorización ordinaria devuelve RESOURCE_SCOPE_DENIED, existe un expediente laboral único y hay documentos explícitos únicos.
- No hay fallback para listados generales, errores de identidad/ownership/esquema ni roles de autoservicio Empleado/Trabajador/Personal. Se conserva el flujo same-department y self-service original.
- Campos de referencia allowlisted: categoriaDoc, fechaCarga y estadoVisibilidad; DocumentoID se devuelve como identificador del elemento. Se excluyen tituloDocumento, ArchivoUrl, CargadoPor, Observaciones, expedienteId, enlaces y contenido.
- El sobre ACCOUNTING→USER es HMAC-SHA256, destino/acción exactos, HTTPS, secret >=32 caracteres y activeDepartmentId opcional firmado. USER valida identidad, permiso, tenant, contexto activo, ResourceOwnership EXPEDIENTE_LABORAL, política, grant y auditoría durable antes de responder; requiere autorización estándar adicional del consumidor.
- tests/security/accounting-department-reference-consumer.test.js: 29 escenarios PASS local en Node.js v22.16.0, incluyendo HMAC, allowlist, denegación, no enumeración, self-service, mismo departamento, contexto activo, errores de transporte/HTTP/JSON, duplicados, ownership y requestId. node --check PASS sobre las funciones exactas extraídas y el test; el test contiene parseo del Code.gs completo para el runner.
- Workflow Department Scope y workflow aislado incluyen el contrato ACCOUNTING y parseo Node 24. No se dispone de status/check observable para los commits nuevos; no se declara CI PASS.
- BETA-FUNC-064 queda Pendiente beta. No se desplegaron servicios ni se configuraron secretos ni se modificaron hojas productivas.

### Corrección C1.691 — intención explícita del consumidor ACADEMIC
- El fallback de referencias de getStudentDocuments solo puede ejecutarse si el request contiene referenceRequestedFields o referenceDocumentIds. Una consulta ordinaria sin esos campos conserva la denegación RESOURCE_SCOPE_DENIED; una intención explícita malformada se rechaza como DEPARTMENT_REFERENCE_REQUEST_INVALID.
- El contrato de regresión departmental-resource-access se ejecuta en el workflow aislado junto con los consumidores ACADEMIC y ACCOUNTING.
