# AUDITORÍA TÉCNICA - TAREA-F6-040: Validar rendimiento, capacidad y recuperación de la arquitectura completa (alcance ampliado)

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.231  
**Checkpoint de cierre:** C1.232  
**Sesión operativa:** IMA-AUDIT-20261107-2134Z-01 (no es ID nativo de ChatGPT)  
**HEAD auditado:** 585a6a797c781fbbb1b22cca8a52a6fa07e02ae9  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

> F6-040 repite el objetivo de F6-015 y amplía sus criterios con CA-136..CA-144 y CA-170..CA-173. Se emite informe individual, pero comparte el bloque canónico de tareas derivadas con F6-015.

## 1. Continuidad y fuentes

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F6-040 [X], criterios CA-136..CA-144/CA-170..CA-173.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff: describe la suite de DEVELOPER como prueba integral multi-servicio, resiliencia y multirol; la implementación solo ejecuta cinco llamadas secuenciales y no verifica esos resultados.
- No existía informe individual F6-040. Se omite el informe previo inexistente y se audita directamente.
- F6-015 y F6-040 comparten la suite y el objetivo; el bloque de tareas correctivas se mantiene único para evitar duplicaciones.
- Archivos, SHAs y funciones auditadas: ver sección 2 del informe F6-015, que es referencia técnica complementaria.

## 2. Hallazgos ampliados

1. **Instancias académicas aisladas no probadas:** no existe prueba de creación de una nueva instancia real, comparación de configuración/recursos ni carga sobre instancias existentes.
2. **Aislamiento de fallos no demostrado:** el health check devuelve PASS/HEALTHY sintético; no simula indisponibilidad ni comprueba operación de servicios no dependientes.
3. **Diagnóstico parcial:** getOperationalCapacityMetrics agrupa eventos y promedios de una bitácora; no asegura captura completa de errores de Drive/Sheets ni correlación distribuida de peticiones.
4. **Idempotencia no universal:** algunos flujos tienen deduplicación y locks, pero fetchApi reintenta POST sin clave estable; los mecanismos de pago y lotes dependen de claves/dedupe opcionales o lógicos y no prueban concurrencia con pérdida de respuesta.
5. **Recuperación e integridad no confiables:** checksum aceptado por presencia, restore sin rollback transaccional acreditado y conciliación limitada a dos hojas con resultado success aunque existan inconsistencias.
6. **Métricas sin prueba reproducible:** el tiempo de la suite es una duración total secuencial, no una campaña versionada con dataset, concurrencia, repeticiones, percentiles y umbrales.
7. **Límites operativos no identificados:** no se consulta ni contrasta cuota efectiva de GAS, Sheets, Drive o servicios externos; detección de cuotas basada en texto de logs.
8. **Regresión post-migración ausente:** no hay evidencia de snapshots funcionales pre/post, comparación de contratos y permisos, ni navegación E2E de dashboards.
9. **Multirol superficial:** se llama una función de asignación con usuario sintético y dos roles; no se verifica una identidad real única, aislamiento de permisos ni propagación a todos los dispatchers.
10. **Cambios de configuración/despliegue no verificados:** no se prueba que cambios de endpoint, instancia o responsabilidad mantengan accesibles consumidores preexistentes.

## 3. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-136: nueva instancia sin modificar las existentes | No cumple | Sin prueba de aprovisionamiento/aislamiento. |
| CA-137: caída de servicio no bloquea operaciones independientes | No cumple | No se inyectan fallos; health check sintético. |
| CA-138: fallos de comunicación/almacenamiento diagnosticables | Parcial | Bitácora y agrupación textual de errores existen, pero cobertura y correlación no se acreditan. |
| CA-139: reintentos no duplican operaciones idempotentes | Parcial | Dedupe local en algunos flujos; no existe clave obligatoria/atómica uniforme en fetchApi y servicios. |
| CA-140: integridad antes/después de recuperación | No cumple | Conciliación parcial; checksum defectuoso; restore no transaccional. |
| CA-141: métricas provienen de pruebas reproducibles | No cumple | No hay dataset/carga/iteraciones/percentiles/artefactos. |
| CA-142: límites operativos identificados | No cumple | Sin medición de cuotas reales ni umbrales sustentados. |
| CA-143: funciones existentes verificadas tras migración | No cumple | No se encontró regresión E2E pre/post migración. |
| CA-144: no cerrar fase con errores críticos sin resolver | No cumple | Persisten riesgos críticos de integridad, recuperación e idempotencia; marca histórica [X] no demuestra cierre técnico. |
| CA-170: varios roles desde identidad institucional única | No cumple | Caso sintético de asignación; no verifica identidad ni uso end-to-end. |
| CA-171: permisos por rol sin privilegios heredados | No cumple | No prueba matriz efectiva en dispatchers de cada servicio. |
| CA-172: flujos multi-servicio preservan comunicación/datos/permisos | No cumple | Sin integración E2E ni inyección de fallos. |
| CA-173: cambios no dejan funciones inaccesibles | No cumple | Sin verificación de consumidores y dashboards antes/después. |

**Dictamen F6-040: NO CUMPLE.**

## 4. Tareas derivadas

**Bloque canónico compartido con F6-015:** F6-003-A01..A09, F6-009-A03/A06 y F6-011-A01..A06, además de AUD-NG-006/133/161. Ampliaciones específicas:
- CA-136/137/172/173: aislamiento de instancia, contrato de dependencias y pruebas de continuidad se integran en F6-003-A03/A04/A07/A09 y F6-009-A06.
- CA-138/142: telemetría de fallos, cuotas y límites verificables se integran en F6-009-A03.
- CA-139: idempotencia atómica y repetición segura se integran en F6-003-A03/A06/A08 y AUD-NG-006/133/161.
- CA-140/144: restore transaccional, reconciliación bloqueante y criterios de no cierre se integran en F6-011-A01..A04/A06.
- CA-141/143: benchmark reproducible y regresión post-migración se integran en F6-003-A01/A02/A07/A09 y F6-013-A05/A07.
- CA-170/171: identidad y permisos efectivos multirol se integran en F6-003-A07 y F6-012-A01..A07.
Todas las tareas permanecen **Pendientes**. No se crean IDs duplicados ni se cambia completadas.md.

## 5. Pruebas y límites

- Ejecutadas: inspección estática/manual de suites, recuperación, contratos, permisos, frontend, logs, locks, métricas y SHAs.
- No ejecutadas: runtime Apps Script, OAuth, HTTP, navegador, despliegues, carga, concurrencia, fallos inyectados, restauración productiva, Drive/Sheets productivas ni E2E.
- No se modificó código ni datos productivos.

## 6. Cierre

- TAREA-F6-040: **NO CUMPLE**.
- La marca [X] histórica se conserva.
- F6-040 amplía F6-015 y comparte el bloque canónico de tareas derivadas.
- Informe complementario: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-015.md.
