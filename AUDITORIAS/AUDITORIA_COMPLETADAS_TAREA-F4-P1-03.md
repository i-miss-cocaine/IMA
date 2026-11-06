# Auditoría TAREA-F4-P1-03 - Matriz dinámica de permisos

**Checkpoint:** C1.78 | **Rama:** NG_beta_0.0.0.1_work | **Sesión:** IMA-AUDIT-20261106-1138Z (inicio C1.71, abierta)

## Dictamen
**NO CUMPLE.** La matriz guarda rol, módulo, acción, permiso y ámbito, pero los cinco servicios autorizan solo por rol+acción. No existe interfaz de administración en los archivos UI revisados.

## Evidencia
- USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: getDynamicPermissionsForRole 1863-1894; getPermissionMatrix 1902-1932; savePermissionMatrix 1934-1985; validateRolePermission 1253-1305.
- ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; TASK y EXAM revisados en la misma rama.
- Los cinco getDynamicPermissionsForRole construyen matrix[rol][accion] desde columnas 0,2,3; descartan modulo (col.1) y ambito (col.4).
- savePermissionMatrix persiste modulo/ambito pero identifica filas por rol+accion. No valida catálogos ni impone guardia interna de rol; una concesión dinámica de savePermissionMatrix a un perfil no administrativo le permitiría editar toda la matriz.
- ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, developer.js y 11 dashboards revisados: sin llamadas a getPermissionMatrix/savePermissionMatrix ni editor.
- AUD-NG-160 ya cubre cache TTL 600, fallback a ROLE_PERMISSIONS e invalidación incorrecta/interservicio. No duplicar. Nuevo AUD-NG-221/TASK-501 para dimensiones, editor y UI. TASK-139 (documentos), AUD-NG-094 (informes) y TAREA-F4-P1-04 (RBAC/ABAC general) mantienen sus límites.
- Fuente original AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md no encontrada; alcance reconstruido desde completadas.md y código.
- Pruebas: inspección estática/manual; no se leyó la hoja real ni se ejecutaron endpoints, pruebas de matriz o invalidación de caché.

## Continuidad
75/183 identificadores auditados; 108 pendientes. Siguiente: TAREA-F4-P1-04 - política unificada RBAC/ABAC. Sin modificar código, completadas.md, ChangesLogs.txt ni metodología.
