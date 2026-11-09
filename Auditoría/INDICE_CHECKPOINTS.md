# Índice central de checkpoints — IMA

Este índice localiza los checkpoints. Los cuerpos históricos permanecen íntegros en sus archivos originales. Los fragmentos Parte_01.txt a Parte_07.txt son recuperación del contexto original y no forman parte de la serie rotativa nueva.

## Estado actual
- Último checkpoint: **C1.328**
- Última sesión: `IMA-EXEC-20261109-1909Z-01`
- Archivo activo: `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt`
- Límite por archivo: **180.000 caracteres**
- Caracteres del archivo activo tras C1.324: **156832**
- Próxima parte rotativa: `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt`
- Rama de trabajo: `NG_beta_0.0.0.1_work`

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
