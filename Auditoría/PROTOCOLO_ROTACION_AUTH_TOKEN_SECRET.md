# Protocolo de rotación de AUTH_TOKEN_SECRET

## 1. Alcance

Aplica a los proyectos Apps Script de IMA que prestan los servicios USER, ACADEMIC, ACCOUNTING, TASK y EXAM. Cada entorno (desarrollo, pruebas y producción) debe usar su propio secreto. Los cinco servicios de un mismo entorno deben compartir exactamente el mismo valor.

## 2. Reglas de seguridad

- Generar al menos 32 bytes aleatorios con un generador criptográficamente seguro; preferir 32 bytes codificados en Base64URL (43 caracteres sin padding).
- Guardar el valor únicamente en **Project Settings → Script Properties**, con la clave exacta `AUTH_TOKEN_SECRET`.
- No incluir el secreto en Git, código fuente, hojas de cálculo, formularios, tickets, registros ni mensajes.
- No reutilizar el secreto entre entornos.
- No usar `SPREADSHEET_ID`, correos, nombres de proyecto ni otros identificadores públicos como fallback.
- Si la propiedad falta, no puede leerse o tiene menos de 32 caracteres, el servicio debe fallar cerrado. No se debe crear un fallback temporal.

## 3. Rotación coordinada con invalidación de sesiones

La implementación actual utiliza una sola clave activa por entorno y no admite una ventana de doble firma. Por tanto, la rotación debe realizarse coordinadamente y provoca la invalidación de los tokens de sesión e interservicio firmados con la clave anterior.

1. Programar una ventana de mantenimiento y detener temporalmente login y operaciones protegidas.
2. Generar un nuevo secreto con un CSPRNG. Registrar únicamente identificador de versión, fecha y responsable operativo; nunca registrar el valor.
3. Actualizar `AUTH_TOKEN_SECRET` en Script Properties de los cinco proyectos del mismo entorno con exactamente el mismo valor.
4. Confirmar en cada proyecto que la propiedad existe y tiene al menos 32 caracteres. No imprimir ni copiar el valor a logs.
5. Ejecutar las pruebas de configuración y verificación en los cinco servicios. Confirmar que un token firmado con la clave nueva es aceptado y uno firmado con la clave anterior es rechazado.
6. Reabrir login y operaciones protegidas. Los usuarios deberán autenticarse de nuevo; los envelopes interservicio previos también quedan invalidados.
7. Registrar el resultado operativo sin incluir secretos, tokens completos ni datos personales.

## 4. Manejo de una rotación parcial

Si uno o más proyectos no reciben el nuevo valor, mantener detenidas las operaciones protegidas hasta alinear los cinco servicios. No habilitar un fallback ni aceptar simultáneamente claves no documentadas. La recuperación consiste en completar la actualización coordinada y repetir las pruebas.

No restaurar la clave anterior como rollback rutinario: eso podría revalidar tokens que se pretendían invalidar. Cualquier reversión excepcional requiere análisis de incidente, autorización operativa y una nueva invalidación coordinada.

## 5. Comprobación previa a producción

- [ ] Los cinco proyectos tienen `AUTH_TOKEN_SECRET` configurado.
- [ ] Los valores corresponden a la misma versión de clave dentro del entorno.
- [ ] No hay secretos en código, Git, hojas ni logs.
- [ ] Un token nuevo funciona en los cinco servicios.
- [ ] Un token anterior falla en los cinco servicios.
- [ ] La ausencia o longitud insuficiente de la propiedad produce fallo cerrado.
- [ ] Se documentó la ventana, versión y resultado, sin guardar el secreto.

## 6. Límites de la evidencia

Las pruebas automatizadas del repositorio simulan Script Properties, firma HMAC, cache y hoja de usuarios. No sustituyen la verificación de los valores reales en los cinco proyectos Apps Script durante cada despliegue o rotación.
