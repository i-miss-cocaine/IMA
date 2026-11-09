# Reauditoría focalizada TASK-068 — C1.349

- Baseline lógico: C1.316 (`31262d5ccbfc46a5f87a5d0fc9c363b177283d9a`); rama autorizada `NG_beta_0.0.0.1_work`.
- CI anterior: run 42713903042 completed/success para el contrato de identidad y TASK-030 transport access scope.
- Hallazgo: el clasificador podía conservar coincidencia por identificación exacta aun cuando fecha de nacimiento o código institucional presentes fueran contradictorios.
- Corrección: veto conservador si identificación, código institucional o fecha de nacimiento están presentes en ambos registros y difieren.
- Pruebas locales añadidas: mismo nombre + identificación distinta; mismo nombre + fecha distinta; identificación exacta con fecha contradictoria.
- Estado TASK-068: En ejecución. Pendiente verificar cobertura local de caché IndexedDB, múltiples referencias confirmadas y relaciones académicas/familiares/administrativas. BETA-FUNC-008 permanece Pendiente beta.
- No se ejecutó Apps Script, Sheets, HTTP ni deployment real.
