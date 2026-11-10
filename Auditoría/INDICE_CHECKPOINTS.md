# Índice central de checkpoints — IMA

Este índice localiza los checkpoints. Los cuerpos históricos permanecen íntegros en sus archivos originales. Los fragmentos Parte_01.txt a Parte_07.txt son recuperación del contexto original y no forman parte de la serie rotativa nueva.

## Estado actual
- Último checkpoint: **C1.374**
- Última sesión: `IMA-EXEC-20261109-1739Z-01`
- Archivo activo: `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt`
- Límite por archivo: **180.000 caracteres**
- Caracteres del archivo activo tras C1.374: **94148**
- Próxima parte rotativa: `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt`
- Rama de trabajo: `NG_beta_0.0.0.1_work`
- Baseline lógico válido: **C1.316** (`31262d5ccbfc46a5f87a5d0fc9c363b177283d9a`). C1.317–C1.365 se conservan, pero no se aceptan como evidencia de continuidad por corrección expresa del usuario.

## Registro de checkpoints

| ID | Sesión | Estado | Tarea / fase | Ubicación exacta | Líneas | Anterior | Commit |
|---|---|---|---|---|---:|---|---|
| C1.285 | IMA-GOV-20261109-0322Z-01 | Publicado | Gobierno documental / PM-00 | `Auditoría/Contexto_personal.txt` — sección C1.285 | 1508–1531 | C1.284 | `4cda8611c4d3c4aece4c7d80922cc4c14c920f5a` |
| C1.286 | IMA-GOV-20261109-0339Z-01 | Publicado | Gobierno documental / PM-00 | `Auditoría/Contexto_personal.txt` — sección C1.286 | 1547–1587 | C1.285 | `a77e9a6dc373a66e243d6287743139cea67e4c26` | 
| C1.287 | IMA-EXEC-20261109-0343Z-01 | Publicado en este commit | TASK-637 / PM-00 | `Auditoría/Contexto_personal.txt` — sección C1.287 | 1590–1632 | C1.286 | Este commit; SHA verificado externamente en el reporte de cierre |
| C1.288 | IMA-GOV-20261109-0355Z-01 | Publicado | Gobierno de estado / pruebas beta | `Auditoría/Contexto_personal.txt` — sección C1.288 | 1643–1674 | C1.287 | `0afe7fd3a9b9df974afc557063d40b787a7e1c30` |
| C1.289 | IMA-EXEC-20261109-0407Z-01 | Publicado | TASK-638 / PM-00 — auditoría parcial | `Auditoría/Contexto_personal.txt` — sección C1.289 | 1676–1736 | C1.288 | `57643c473df081aa57cdd8e5def542281f500000` |
| C1.290 | IMA-EXEC-20261109-0413Z-01 | Publicado | TASK-638 / PM-00 — páginas y portales, grupo 2 | `Auditoría/Contexto_personal.txt` — sección C1.290 | 1738–1788 | C1.289 | `b26169f8c0d4e729db152fa7910ec585bc28d5e5` |

| C1.291 | IMA-EXEC-20261109-0420Z-01 | Publicado | TASK-638 / PM-00 — cobertura HTML/HTM 101/101 | `Auditoría/Contexto_personal.txt` — sección C1.291 | 1790–1840 | C1.290 | `3694b763b78a1d400a4564dddcb6ebd3c0108ce9` |

| C1.292 | IMA-EXEC-20261109-0430Z-01 | Publicado | TASK-638 / PM-00 — inventario JS y dependencias runtime | Auditoría/Contexto_personal.txt — sección C1.292 | 1842–1892 | C1.291 | 32b8f5884dd24dbeaf1a3bf028eb7635ada592df |
| C1.293 | IMA-EXEC-20261109-1108Z-01 | Publicado | TASK-638 / PM-00 — CSS/GS/JSON y contratos | Auditoría/Contexto_personal.txt — sección C1.293 | 1895–1943 | C1.292 | fd73830144a9822369e4402076685928171908d6 |
| C1.294 | IMA-AUDIT-20261109-1140Z | Publicado | TASK-637 reauditoría / PM-00.3 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.294 | 55–128 | C1.293 | `00ffac159929fd65f1fc3a65e72509838df0cbde` |

- SHA del bloque normativo A–I de Parte_0003: `a434b8ac19bd40646e81c0a911c525e3cea9920f`.

## Reglas de mantenimiento
1. Agregar una fila por cada checkpoint, sin borrar ni reutilizar IDs.
2. Actualizar «Último checkpoint» y «Archivo activo» en el mismo commit que incorpora el checkpoint.
3. Al rotar, registrar la nueva parte, el SHA de su bloque normativo A–I y el rango exacto de líneas.
4. Auditoria.txt y changueslogs.txt deben apuntar a esta tabla mediante el ID exacto.
5. Los checkpoints anteriores a la adopción del índice son legado histórico; no inventar ubicaciones ni rangos retrospectivos. Indexarlos solo cuando puedan verificarse.


| C1.295 | IMA-AUDIT-20261109-1152Z | Publicado | TASK-637 corrección / PM-00.3 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.295 | 131–172 | C1.294 | `0edce6ae2721b1d839ef259dad7ea77962fe8ab3` |

| C1.296 | IMA-AUDIT-20261109-1152Z | Publicado | TASK-638 auditoría / PM-00 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.296 | 175–210 | C1.295 | 5bf51a6b0c12fd62edc42385c55976789d00a423 |
| C1.297 | IMA-AUDIT-20261109-1152Z | Publicado | TASK-638 auditoría / PM-00 — USER/ACADEMIC | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.297 | 212–237 | C1.296 | `103c02dc0ba31c0d3ceb2e5c5a39c1a747cc67f9` |

| C1.298 | IMA-AUDIT-20261109-1222Z-01 | Publicado en este commit | TASK-638 auditoría / PM-00 — TASK/EXAM | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.298 | 239–269 | C1.297 | Este commit; SHA a verificar externamente |

| C1.299 | IMA-AUDIT-20261109-1232Z-01 | Publicado | TASK-638 auditoría / PM-00 — autorización contextual TASK/EXAM | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.299 | 270–298 | C1.298 | `9e21a060922bc4c7d96d06c0098a48d643b32276` |
| C1.300 | IMA-GOV-20261109-1255Z-01 | Publicado | Gobernanza documental — auditoría única / IMA | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.300 | 302–344 | C1.299 | `650a3cccf1974afbc7d29f7d5d922a3f30bc1b1b` |
| C1.301 | IMA-EXEC-20261109-1305Z-01 | Publicado | TASK-638 completada / PM-00 — matriz integral de dependencias | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.301 | 347–395 | C1.300 | `aa5a85f9eaedec5f89963a15cd32e8ed5e6e45e6` |

| C1.302 | IMA-AUDIT-20261109-1339Z-01 | Publicado | TASK-639 completada / PM-00 — símbolos, redefiniciones y ciclos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.302 | 398–451 | C1.301 | `9ddafd273ccda4aeeb13e04fdb03a053a7556848` |
| C1.303 | IMA-DOCFIX-20261109-1344Z-01 | Publicado en este commit | Corrección documental del índice C1.302 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.303 | 454–490 | C1.302 | Este commit; SHA a verificar externamente |

| C1.304 | IMA-BLOCK-20261109-1350Z-01 | Publicado en este commit | Bloqueo de lectura del requisito original TASK-636 / PM-01 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.304 | 493–542 | C1.303 | Este commit; SHA a verificar externamente |

| C1.305 | IMA-EXEC-20261109-1435Z-01 | Publicado en este commit | Implementación parcial TASK-636 / PM-01 — token, tickets, noticias y automatización | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.305 | 545–600 | C1.304 | Este commit; SHA verificado tras publicación |

| C1.306 | IMA-EXEC-20261109-1450Z-01 | Publicado en este commit | Task-Service: claims, propiedad y filtrado de recursos; cierre destructivo bloqueado | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.306 | 603–663 | C1.305 | Este commit; SHA verificado tras publicación |

| C1.307 | IMA-EXEC-20261109-1455Z-01 | Preparado para commit único | TASK-636 / PM-01 — mutaciones Task-Service y conciliación de asignaciones | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.307 | 665–758 | C1.306 | Este commit; SHA verificado tras publicación |

| C1.308 | IMA-EXEC-20261109-1510Z-01 | Publicado en este commit | TASK-636 / PM-01 — propiedad de archivos, entregas y cargas reanudables | `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt` — sección C1.308 | 762–842 | C1.307 | Este commit; SHA verificado tras publicación |

| C1.309 | IMA-EXEC-20261109-1533Z-01 | Publicado en este commit | TASK-636 / PM-01 — capacidades públicas ACADEMIC y protección de archivos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.309 | 844–917 | C1.308 | Este commit; SHA a verificar externamente |

| C1.310 | IMA-EXEC-20261109-1533Z-02 | Publicado en este commit | TASK-636 / PM-01 — integración frontend de capacidades de admisión | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.310 | 920–978 | C1.309 | Este commit; SHA a verificar externamente |

| C1.311 | IMA-EXEC-20261109-1605Z-01 | Publicado en este commit | TASK-636 / PM-01 — bloqueo de cierre docente y auditoría backup/restore | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.311 | 981–1034 | C1.310 | Este commit; SHA verificado tras publicación |

| C1.312 | IMA-EXEC-20261109-1618Z-01 | Publicado en este commit | TASK-636 / PM-01 — protocolo dedicado de backup/restore, cierre aún bloqueado | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.312 | 1036–1105 | C1.311 | Este commit; SHA verificado tras publicación |

| C1.313 | IMA-EXEC-20261109-1635Z-01 | Publicado en este commit | TASK-636 / PM-01 — journal durable y recuperación de restore | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.313 | 1107–1162 | C1.312 | Este commit; SHA verificado tras publicación |

| C1.314 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-636 / PM-01 — confirmación explícita de recuperación | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.314 | 1164–1214 | C1.313 | Este commit; SHA verificado tras publicación |

| C1.315 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-636 / PM-01 — recuperación serializada e idempotencia Drive | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.315 | 1216–1282 | C1.314 | Este commit; SHA verificado tras publicación |

| C1.316 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-636 / PM-01 — contrato Node en CI; integración Apps Script bloqueada por falta de entorno aislado | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.316 | 1284–1339 | C1.315 | Este commit; SHA verificado tras publicación |

| C1.317 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-636 / PM-01 — continuidad verificada; integración Apps Script aislada bloqueada | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.317 | 1342–1403 | C1.316 | Este commit; SHA verificado tras publicación |

| C1.318 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — auditoría preimplementación; implementación pendiente | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.318 | 1406–1461 | C1.317 | Este commit; SHA verificado tras publicación |

| C1.319 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — respaldo Git histórico e implementación parcial | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.319 | 1464–1510 | C1.318 | Este commit; SHA verificado tras publicación |

| C1.320 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — caché IndexedDB y wrappers API cliente | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.320 | 1512–1546 | C1.319 | Este commit; SHA verificado tras publicación |

| C1.320 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — caché IndexedDB y wrappers API cliente | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.320 | 1512–1546 | C1.319 | C1.320 implementation d2b721a; test fix 0b891a5; CI 42667176023 PASS |
| C1.321 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — lecturas no mutantes y validación de destino | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.321 | 1553–1582 | C1.320 | 19eba80; CI 42667650780 PASS |

| C1.322 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — validadores de destino por esquemas verificados | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.322 | 1588–1615 | C1.321 | 6e4a934; CI 42668165457 PASS |

| C1.323 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — auditoría estática de escritores de destino | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.323 | 1622–1658 | C1.322 | Este commit; SHA verificado tras publicación |

| C1.324 | IMA-EXEC-20261109-1802Z-01 | Preparado para commit único | TASK-068 / PM-01 — validación integral del esquema destino; AUD-NG-380 corregido, AUD-NG-378 abierto | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.324 | 1662–1716 | C1.323 | Este commit; SHA verificado externamente tras publicación |

| C1.325 | IMA-EXEC-20261109-1802Z-01 | Preparado para commit único | TASK-068 / PM-01 — corrección del harness de validación de esquemas; AUD-NG-381 registrado | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.325 | 1720–1770 | C1.324 | Este commit; SHA verificado externamente tras publicación |

| C1.326 | IMA-EXEC-20261109-1802Z-01 | Preparado para commit único | TASK-068 / PM-01 — extractor determinista del test de esquemas; AUD-NG-381 abierto hasta CI | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.326 | 1774–1824 | C1.325 | Este commit; SHA verificado externamente tras publicación |

| C1.327 | IMA-EXEC-20261109-1802Z-01 | Preparado para commit único | TASK-068 / PM-01 — CI aprobado; AUD-NG-378 bloqueado por transporte/configuración externa | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.327 | 1828–1872 | C1.326 | Este commit; SHA verificado externamente tras publicación |

| C1.328 | IMA-EXEC-20261109-1909Z-01 | Preparado para commit único | TASK-068 / PM-01 — bloqueo AUD-NG-378 y recuperación del backlog de requisitos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.328 | 1875–1936 | C1.327 | Este commit; SHA verificado tras publicación |

| C1.329 | IMA-GOV-20261109-2154Z-01 | Publicado en este commit | Recuperación íntegra del backlog y norma de pruebas beta | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.329 | 61–104 | C1.328 | Este commit; SHA verificado tras publicación |

| C1.330 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Casos beta específicos TASK-636 y TASK-068 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.330 | 107–139 | C1.329 | Este commit; SHA verificado tras publicación |

| C1.331 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección de rumbo / reauditoría TASK-636 — C1.316 como baseline lógico; pruebas locales y beta diferidas | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.331 | 2 | C1.316 (último válido) | Este commit; SHA verificado tras publicación |

| C1.332 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección del harness local TASK-636; separadores VM deterministas | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.332 | 198 | C1.331 | Este commit; SHA verificado tras publicación |

| C1.333 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Extractor balanceado del contrato local TASK-636 tras fallo CI | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.333 | 212 | C1.332 | Este commit; SHA verificado tras publicación |

| C1.334 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Fixture Date creado en VM para contrato local TASK-636 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.334 | 225 | C1.333 | Este commit; SHA verificado tras publicación |

| C1.335 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección del contexto VM de Date en fixture snapshot TASK-636 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.335 | 238 | C1.334 | Este commit; SHA verificado tras publicación |

| C1.336 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — clasificación local conservadora de identidades | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.336 | 268 | C1.335 | Este commit; SHA verificado tras publicación |

| C1.337 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | CI TASK-636 aprobado; ajuste de formato de contrato TASK-068 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.337 | 282 | C1.336 | Este commit; SHA verificado tras publicación |

| C1.338 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | CI aprobado TASK-636 y TASK-068; writer de importación sigue como brecha local | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.338 | 307 | C1.337 | Este commit; SHA verificado tras publicación |

| C1.339 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — writers idempotentes por servicio propietario | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.339 | 346 | C1.316 (último válido) | Este commit; SHA verificado tras publicación |

| C1.340 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — corregir mock de hoja vacía; CI 42712140456 falló por doble encabezado en fixture | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.340 | 360 | C1.339 | Este commit; SHA verificado tras publicación |

| C1.341 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — transporte HMAC y orquestación de importación multi-servicio | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.341 | 391 | C1.340 | Este commit; SHA verificado tras publicación |

| C1.342 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Ajustar contrato estático: retirar expectativa obsoleta DESTINATION_WRITER_NOT_CONFIGURED | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.342 | 405 | C1.341 | Este commit; SHA verificado tras publicación |

| C1.343 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Aserciones de URL alineadas con route.urlProperty; fixtures HMAC ya superados | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.343 | 419 | C1.342 | Este commit; SHA verificado tras publicación |

| C1.344 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — snapshots Date tipados y pruebas sobre writers reales | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.344 | 434 | C1.343 | Este commit; SHA verificado tras publicación |

| C1.345 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Harness enlazado a writers reales USER/ACADEMIC; pruebas UPDATE/Date | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.345 | 448 | C1.344 | Este commit; SHA verificado tras publicación |

| C1.346 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Completar funciones encode/decode Date para snapshots en USER/ACADEMIC | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.346 | 462 | C1.345 | Este commit; SHA verificado tras publicación |

| C1.347 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corregir captura de hoja destino tras primera inserción en fixture | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.347 | 475 | C1.346 | Este commit; SHA verificado tras publicación |

| C1.348 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — mocks de orquestación, dos fuentes, idempotencia y compensación multi-fila | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.348 | 490 | C1.347 | Este commit; SHA verificado tras publicación |

| C1.349 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — veto de homónimos con identificación/código/fecha contradictorios | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.349 | 506 | C1.348 | Este commit; SHA verificado tras publicación |

| C1.350 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — consola de Secretaría para búsqueda/revisión e historial de identidades | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.350 | 526 | C1.349 | Este commit; SHA verificado tras publicación |

| C1.351 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — pruebas de referencias múltiples, relaciones y caché confirmada | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.351 | 544 | C1.350 | Este commit; SHA verificado tras publicación |

| C1.352 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección fixture relacional TASK-068: SPREADSHEET_ID y PersonaID de responsable | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.352 | 557 | C1.351 | Este commit; SHA verificado tras publicación |

| C1.353 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — RBAC explícito para búsqueda y vinculación de identidades | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.353 | 572 | C1.352 | Este commit; SHA verificado tras publicación |

| C1.354 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — motivo obligatorio server-side y prueba de vinculación auditable | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.354 | 587 | C1.353 | Este commit; SHA verificado tras publicación |

| C1.355 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección fixture linkPersonAccount: SPREADSHEET_ID VM | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.355 | 600 | C1.354 | Este commit; SHA verificado tras publicación |

| C1.356 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — reconciliación de claves y destinos de correspondencia | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.356 | 615 | C1.355 | Este commit; SHA verificado tras publicación |

| C1.357 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — escritores locales para empleado y curso en ACCOUNTING | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.357 | 631 | C1.356 | Este commit; SHA verificado tras publicación |

| C1.358 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Ajustar aserción del esquema de curso al literal canónico compacto | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.358 | 644 | C1.357 | Este commit; SHA verificado tras publicación |

| C1.359 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — UPDATE/compensación Date y dispatch local ACCOUNTING | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.359 | 658 | C1.358 | Este commit; SHA verificado tras publicación |

| C1.360 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — prueba real de registro, idempotencia, revisión, resolución e historial | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.360 | 671 | C1.359 | Este commit; SHA verificado tras publicación |

| C1.361 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — inicialización first-use de esquemas y búsqueda no mutante | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.361 | 685 | C1.360 | Este commit; SHA verificado tras publicación |

| C1.362 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — integridad académica/familiar/administrativa y auditoría read-only | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.362 | 699 | C1.361 | Este commit; SHA verificado tras publicación |

| C1.363 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Cierre TASK-068; BETA-FUNC-008 diferida; próxima TASK-636 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.363 | 728 | C1.362 | Este commit; SHA verificado tras publicación |

| C1.364 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-636 AUD-NG-370 — reconciliación segura de metadatos históricos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.364 | 744 | C1.363 | Este commit; SHA verificado tras publicación |

| C1.365 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-636 — rollback atómico de backfill y parseo VM del servicio | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.365 | 759 | C1.364 | Este commit; SHA verificado tras publicación |

| C1.366 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — aislamiento del estado de recuperación compensatoria | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.366 | 761–815 | C1.316 (último válido) | Este commit; SHA verificado tras publicación |

| C1.367 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — protección de referencias URL en versiones | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.367 | 818–872 | C1.366 | Este commit; SHA verificado tras publicación |

| C1.368 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — protección de audiencias públicas | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.368 | 875–927 | C1.367 | Este commit; SHA verificado tras publicación |

| C1.369 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — normalización de borradores en getPosts | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.369 | 930–977 | C1.368 | Este commit; SHA verificado tras publicación |

| C1.370 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — ajuste de expectativas del fixture getPosts | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.370 | 980–1018 | C1.369 | Este commit; SHA verificado tras publicación |

| C1.371 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — eliminación segura de proyectos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.371 | 1021–1070 | C1.370 | Este commit; SHA verificado tras publicación |

| C1.372 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — vigencia de asignaciones docentes en lecturas | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.372 | 1073–1121 | C1.371 | Este commit; SHA verificado tras publicación |

| C1.373 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — publicación vigente de posts y materiales | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.373 | 1124–1171 | C1.372 | Este commit; SHA verificado tras publicación |

| C1.374 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — dependencia del fixture getPosts | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.374 | 1174–1212 | C1.373 | Este commit; SHA verificado tras publicación |
