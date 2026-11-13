# AUDITORÍA TÉCNICA - TAREA-F6-030: Microservicios administrativos y financieros (alcance ampliado)

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.221  
**Checkpoint de cierre:** C1.222  
**Sesión:** IMA-AUDIT-20261107-2030Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Alcance y relación con TAREA-F6-005
TAREA-F6-030 (completadas.md, líneas 3443-3516) repite el título de TAREA-F6-005 y añade requisitos funcionales y criterios CA-053..CA-060/CA-148..CA-150. Ambas tareas carecían de informe individual. Se auditaron conjuntamente porque comparten los mismos servicios y código; este informe mantiene la trazabilidad del ID F6-030 y utiliza el bloque canónico de tareas F6-005-A01..A06 definido en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-005.md. No se crean tareas duplicadas.

Fuentes:
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 3443-3516.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, recuperado íntegro (1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD).
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 2130-2136.
- Evidencia completa y SHAs de los servicios: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-005.md.

## 2. Verificación de requisitos ampliados

### A. Microservicio compartido Dirección/Secretaría
- Sí existen roles diferenciados en academic-service y user-service.
- initializeDirectionSecretaryDriveStructure (academic-service:4246-4278) crea New Generation/Direccion, Secretaria y Compartido_Direccion_Secretaria.
- La función no establece ACL ni permisos de usuario/rol/área. Tampoco utiliza un lock para evitar duplicación concurrente.
- La función está en el switch de doPost (línea 871), pero no figura en ROLE_PERMISSIONS; la afirmación de ChangesLogs de que se registró en ROLE_PERMISSIONS no coincide con el código.
- Las carpetas se crean bajo DriveApp.getRootFolder; no se valida propietario ni política de herencia.
**Dictamen:** CA-053 parcial; la existencia de carpetas no demuestra permisos diferenciados ni privacidad.

### B. Microservicio financiero-administrativo y subáreas
- Existe backend/accounting-service, con funciones para Contabilidad, Cobros, Facturación, Recibos, Cuentas por Pagar, Bancos, Inventarios, RRHH y Planillas.
- Todo reside en un único Code.gs de 17.740 líneas, un dispatcher y un contexto de ejecución. Las áreas no tienen límites de fallo ni almacenamiento independiente.
- initializeFinancialDriveStructure crea carpetas/subcarpetas, pero no configura ACL y las funciones de carga no utilizan la jerarquía creada.
- getParentDriveFolder puede caer al root de Drive. Comprobantes y documentos laborales se comparten con ANYONE_WITH_LINK.
- Las carpetas y acciones están hardcodeadas; no hay catálogo de subáreas que permita agregar una nueva por configuración.
**Dictamen:** CA-054 parcial; CA-055 parcial; CA-056, CA-057 y CA-059 no cumplen.

### C. Integridad, trazabilidad y roles múltiples
- createAdmissionCharge queda abierto desde la línea 2398, no implementa appendRow para cargos nuevos y el siguiente function declaration comienza en 2421.
- processPaymentReceipt no existe como función ni action. generatePaymentReceiptPDF devuelve JSON y no crea un PDF.
- createFiscalInvoice guarda reciboCajaId opcional sin validar el pago/recibo; recordStudentPayment conserva brechas de propiedad, saldo e idempotencia (AUD-NG-133).
- La sesión contiene un único role; manageUserMultiRolePermissions devuelve el payload sin persistirlo; las asignaciones de ámbito no se conectan al permiso contable.
- ACCOUNTING no tiene entrada estática para Secretaría; no se verificó una concesión dinámica. Pagos y facturas no conservan de forma fiable el actor y rol verificados.
**Dictamen:** CA-058 no cumple; CA-148 parcial; CA-149 y CA-150 no cumplen.

### D. Independencia ante fallos
La estructura de ejecución es un único servicio contable y un único dispatcher; la falla de compilación/ejecución del servicio puede afectar todos los módulos. No se ejecutaron pruebas de indisponibilidad selectiva ni se demostró recuperación independiente.
**Dictamen:** CA-060 no cumple.

## 3. Matriz de aceptación
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-053 | Parcial | Carpetas separadas, sin ACL; inicializador no está en ROLE_PERMISSIONS. |
| CA-054 | Parcial | Funciones por dominio, pero un único archivo/dispatcher/almacenamiento. |
| CA-055 | Parcial | getOrCreateFolder encuentra una coincidencia, pero no evita carreras ni limpia duplicados existentes. |
| CA-056 | No cumple | Documentos no se guardan en subcarpetas por área/subárea. |
| CA-057 | No cumple | ANYONE_WITH_LINK y ausencia de ACL. |
| CA-058 | No cumple | Referencias de factura/recibo no verificadas; PDF no generado. |
| CA-059 | No cumple | Subáreas hardcodeadas; no existe incorporación por configuración. |
| CA-060 | No cumple | Sin aislamiento operativo ni pruebas de fallos por módulo. |
| CA-148 | Parcial | Hay asignaciones de ámbitos, pero no se convierten en roles activos de sesión. |
| CA-149 | No cumple | La autorización contable no evalúa roles/subáreas activas independientes. |
| CA-150 | No cumple | Pagos/facturas no registran el contexto de autorización verificado. |

## 4. Tareas ejecutables derivadas de los hallazgos
Se reutiliza el bloque canónico F6-005-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-005.md:
1. F6-005-A01: reparar sintaxis y creación de cargos.
2. F6-005-A02: integrar transacción cargo/pago/factura/recibo.
3. F6-005-A03: aplicar privacidad y ACL a Drive.
4. F6-005-A04: integrar multirol, permisos de Secretaría y contexto verificado.
5. F6-005-A05: separar módulos y habilitar subáreas por configuración.
6. F6-005-A06: pruebas E2E de administración y finanzas.
Todas permanecen pendientes. No se crean IDs globales AUD-NG ni tareas locales duplicadas.

## 5. Cierre
- Dictamen TAREA-F6-030: NO CUMPLE.
- El estado [X] en completadas.md se conserva como registro histórico.
- El informe detallado y la evidencia de código están en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-005.md.
- Este archivo preserva la trazabilidad individual de F6-030 y sus criterios ampliados.
- No se modificó código ni se ejecutaron pruebas sobre datos productivos.
- Siguiente tarea secuencial: TAREA-F6-006 - Crear una plantilla de microservicio académico reutilizable para múltiples áreas.
