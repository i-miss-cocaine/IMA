# Auditoría TAREA-F4-P1-05 - Gobierno de privacidad y derechos ARCO

**Checkpoint:** C1.80  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 5822b587306661631767749b03a0e8f9e4674003  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59)  
**ID operativo de sesión:** IMA-AUDIT-20261106-1338Z (inicio C1.79; abierta)  
**Fecha:** 2026-11-06

## Dictamen

**NO CUMPLE.** El backend permite registrar solicitudes de derechos de privacidad y cambiar su estado, pero no implementa un flujo end-to-end que ejecute acceso, rectificación, exportación, eliminación u oposición. Tampoco se encontró el panel ARCO anunciado en la política de privacidad.

## Alcance documental y limitaciones

completadas.md marca TAREA-F4-P1-05 como completada y la describe como incorporar un panel de gobierno de privacidad y gestión de derechos sobre datos (ARCO). Los archivos declarados son backend/user-service/Code.gs, politica-de-privacidad.html y js/ui-common.js. El documento fuente AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md no está presente en el árbol; el dictamen se limita a la descripción disponible y al código versionado.

## Evidencia backend

Archivo: backend/user-service/Code.gs  
SHA: 12079dd410aa6d8afbce55a4bc62a79dea605f9f

- submitPrivacyRightsRequest (1986-2025) valida callerId, tipoDerecho y motivo; admite ACCESO, RECTIFICACION, EXPORTACION, ELIMINACION y OPOSICION; agrega una fila a SolicitudesDerechosPrivacidad y emite PRIVACY_RIGHTS_REQUESTED.
- getPrivacyRightsRequests (2028-2072) devuelve solicitudes del callerId para roles no administrativos y todas las solicitudes para Administrador/Desarrollador. Permite filtros por userId, tipo y estado.
- updatePrivacyRightsRequestStatus (2075-2117) restringe la tramitación a Administrador/Desarrollador y acepta Enviada, En_Revision, Aprobada, Completada y Rechazada. Actualiza estado, respuesta, atendidoPor y fechaRespuesta y emite PRIVACY_RIGHTS_UPDATED.
- El esquema de la hoja no incluye subjectUserId distinto del solicitante, representante legal, relación con el titular, prueba de identidad/representación, responsable asignado, plazo de respuesta, datos afectados, decisión motivada ni evidencia del resultado.
- submitPrivacyRightsRequest siempre vincula la solicitud al usuario autenticado; no permite distinguir al tutor que solicita derechos en representación de un menor.
- updatePrivacyRightsRequestStatus permite establecer cualquiera de los estados admitidos sin validar transición desde el estado previo. No exige respuesta ni evidencia de cumplimiento al usar Completada.
- No se encontró lógica que ejecute exportación de datos, rectificación de registros, eliminación controlada, restricción/oposición al tratamiento o generación de un expediente portable. El sistema conserva una solicitud y su estado, no la ejecución del derecho.
- validateRolePermission (1259) permite submitPrivacyRightsRequest/getPrivacyRightsRequests antes de la matriz RBAC. Los handlers llaman getUserVerifiedRole (1146-1162), que verifica el token; submit exige callerId y getPrivacyRightsRequests filtra por callerId para roles no administrativos. Por tanto, se registra el bypass de matriz, pero no se afirma acceso anónimo a datos de solicitudes. updatePrivacyRightsRequestStatus no usa esa excepción y exige rol administrativo en el handler.

## Evidencia de interfaz

- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: no contiene llamadas ni panel ARCO; las únicas coincidencias de privacidad son texto genérico de FAQ.
- Se revisaron js/accounting.js, js/api.js, js/auth.js, js/config.js, js/data.js, js/developer.js, js/index-ui.js, js/secretary.js, js/student.js, js/teacher.js y js/ui-common.js; no se encontraron llamadas a submitPrivacyRightsRequest/getPrivacyRightsRequests/updatePrivacyRightsRequestStatus ni un flujo de UI ARCO.
- Se revisaron dashboard-cafeteria.html, dashboard-contabilidad.html, dashboard-coordinacion.html, dashboard-direccion.html, dashboard-recursos-humanos.html, dashboard-secretaria.html, dashboard-tienda.html, developer-dashboard.html, student-dashboard.html, teacher-dashboard.html e index.html; no se encontró un panel/formulario ARCO.

## Política de privacidad

Archivo: politica-de-privacidad.html  
SHA: 8854bae3021e1cdde288709e3fa411b3d6da20c7

- La sección 5 anuncia que estudiantes, tutores legales y empleados pueden ejercer sus derechos mediante un módulo institucional de Solicitudes de Privacidad. Ese módulo no se encontró en las interfaces revisadas.
- La página registra aceptación DOC-PRIV mediante fetchApi('ACCOUNTING','getPolicyAcceptances'/'recordPolicyAcceptance'); no llama las tres acciones ARCO de USER.
- La política agrupa Cancelación/Exportación como un único punto, aunque el backend maneja ELIMINACION y EXPORTACION como tipos separados.
- La política afirma que existe un motor automatizado de retención con plazos de 180, 30 y 730 días y conservación permanente. C1.77 ya constató que el motor no tiene triggers y no ejecuta varias categorías; mantener esta inconsistencia dentro de AUD-NG-146/TASK-499 y AUD-NG-220/TASK-500, sin duplicar.

## Reconciliación y nuevo hallazgo

No se encontró en Auditoria.txt ni Pendientes.md un hallazgo previo específico para SolicitudesDerechosPrivacidad.

**AUD-NG-223 (Alto/P1):** panel ARCO ausente y solicitudes sin ejecución efectiva de derechos.

**TASK-503:** implementar panel para titulares y administradores; distinguir titular y representante autorizado; verificar identidad/vínculo; registrar tipo de derecho, alcance, evidencia y plazos; establecer estados/transiciones controladas; ejecutar y documentar acceso/exportación, rectificación, eliminación (con legal hold), oposición/restricción; registrar decisión y evidencia; mantener aislamiento por titular y trazabilidad; probar casos de titular, tutor, empleado, administrador, solicitud no autorizada, legal hold, ejecución parcial y rechazo.

**Límites de reconciliación:** AUD-NG-145/146 y TASK-499/TASK-500 cubren bitácoras/retención/anonimización; AUD-NG-222/TASK-502 cubre política ABAC transversal. No duplicar.

## Pruebas y limitaciones

**Ejecutadas:** inspección estática/manual, búsqueda de símbolos en backend/scripts/dashboards y comparación de SHA.

**No ejecutadas:** HTTP, operaciones reales de acceso/exportación/rectificación/eliminación/oposición, verificación de representación legal, hojas productivas, despliegues Apps Script ni suites automatizadas. No se afirma cumplimiento jurídico; la revisión se limita a la implementación versionada.

## Continuidad

- Progreso: 77/183 identificadores auditados; 106 pendientes.
- Siguiente tarea: TAREA-F4-P1-06 - Fortalecer la trazabilidad mediante historial de cambios y auditoría de versiones.
- Archivos documentales modificados: Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt, Pendientes.md y este informe.
- Sin modificar: código fuente, completadas.md, ChangesLogs.txt, METODOLOGIA_DESARROLLO.md y politica-de-privacidad.html.
- Rama base sin cambios. GitHub reporta protected=false para NG_beta_0.0.0.1.
- Commit de cierre: el commit que contiene este checkpoint.
