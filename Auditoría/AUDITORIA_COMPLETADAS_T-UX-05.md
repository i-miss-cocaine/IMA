# Auditoría de tareas completadas - T-UX-05

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 6781139d0250c301ca7d98e5c86d3bf266a54a00  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios)  
**Tarea:** T-UX-05 - Normalización Diacrítica Insensible a Tildes para Búsquedas y Filtros  
**Estado en completadas.md:** [X] Completada

## Dictamen

**CUMPLE.** La función global window.normalizeSearchString elimina las marcas diacríticas comunes mediante NFD, convierte a minúsculas y normaliza puntuación/espacios. El criterio concreto de aceptación se satisface: la consulta «matematica» se normaliza como «matematica» y el valor «Matemáticas» como «matematicas»; los filtros que comparan con indexOf encuentran la coincidencia.

El helper está definido en js/ui-common.js:2202-2212 y se utiliza en setupAdvancedTableFilters (2137-2150) y renderAdminTicketsUI (4094-4112). En este último caso, el campo de búsqueda se conecta a renderAdminTicketsUI mediante onkeyup y la función normaliza tanto la consulta como ticketId, nombreUsuario, areaFuncion y descripcion antes de comparar.

## Requisitos y aceptación

### Requisito
- window.normalizeSearchString(str) elimina marcas diacríticas usando normalización NFD y una expresión regular.

**Resultado:** Cumple. La función:
1. Devuelve cadena vacía para null/undefined.
2. Convierte el valor a string y a minúsculas.
3. Aplica normalize('NFD').
4. Elimina las marcas combinantes U+0300-U+036F.
5. Sustituye signos no alfanuméricos por espacios, colapsa espacios repetidos y recorta extremos.

### Criterio de aceptación
- La búsqueda «matematica» coincide con «Matemáticas».

**Resultado:** Cumple por el flujo de comparación real:
- normalizeSearchString('matematica') -> 'matematica'.
- normalizeSearchString('Matemáticas') -> 'matematicas'.
- 'matematicas'.indexOf('matematica') devuelve una coincidencia desde el índice 0.

La misma normalización se aplica simétricamente a consulta y registros en renderAdminTicketsUI y en el administrador genérico setupAdvancedTableFilters.

## Consumidores y pruebas

- js/ui-common.js:2137-2150: setupAdvancedTableFilters normaliza cada valor de filtro y cada valor del registro antes de compararlos con indexOf.
- js/ui-common.js:4094-4112: renderAdminTicketsUI normaliza el texto escrito y los campos ticketId, nombreUsuario, areaFuncion y descripcion. El input admin-ticket-search-input ejecuta renderAdminTicketsUI en onkeyup.
- js/ui-common.js:1885-1892: el caso UX-05 de runUXSuiteTests comprueba que «Matemáticas Rápídas» se convierta en «matematicas rapidas».
- La prueba UX-05 verifica la salida del normalizador, pero no ejecuta el flujo completo de búsqueda con un registro real ni comprueba filtros visuales. T-UX-10 es una tarea posterior que exige ampliar las pruebas de experiencia de usuario; esa cobertura se revisará cuando corresponda auditar T-UX-10.

## Reconciliación con tareas posteriores

- **T-UX-06:** el omnibox global utiliza el normalizador de servidor normalizeString en backend/user-service/Code.gs:841-844. searchGlobalOmnibox normaliza la consulta en su entrada y normaliza identificadores, nombres, correos, noticias y trámites antes de buscar. Esto extiende la búsqueda sin reemplazar el helper frontend.
- **T-UX-14:** amplía la búsqueda global y conserva el uso coherente de normalizeString en la consulta y los registros del servidor. No se encontró regresión respecto al criterio de T-UX-05.
- **T-UX-15:** setupAdvancedTableFilters utiliza normalizeSearchString para filtrar varios campos. El helper queda como dependencia directa del módulo de filtros avanzados.
- T-UX-05 aparece dos veces en completadas.md (definición completa y resumen); se contabiliza una sola vez.
- No se encontró en Pendientes.md una tarea específica que duplique la normalización frontend descrita por T-UX-05. Otras tareas de normalización de datos/importación tienen ámbitos distintos.

## Calidad y limitaciones

La implementación satisface el criterio español básico y es reutilizable. Hay límites que no invalidan la aceptación mínima:
- La expresión [^\w\s] usa la definición ASCII de \w; letras Unicode que no se descomponen a caracteres ASCII pueden convertirse en espacios.
- La función elimina la tilde de la ñ y la convierte en n. Esto es una decisión de búsqueda amplia, pero puede confluir palabras distintas en español y conviene mantenerlo como comportamiento consciente.
- La puntuación se sustituye por espacios, no se elimina sin dejar separador. Por ejemplo, una cadena con guion y otra sin guion pueden producir tokens distintos; el comentario de la función promete insensibilidad a puntuación más amplia que la que realmente ofrece.
- Algunos módulos mantienen normalizadores NFD locales para usos específicos (por ejemplo, grados, días de semana y nombres de archivo). No usan el helper compartido, por lo que la normalización no es universalmente centralizada.
- UX-05 comprueba el resultado del helper, pero no la búsqueda completa ni los casos Unicode/puntuación.

Estas observaciones son mejoras de alcance más amplio y no contradicen el requisito explícito de T-UX-05. No se crea un nuevo AUD-NG ni una nueva TASK en esta iteración.

## Contraste con tareas históricas

| Requisito / evidencia | Resultado |
|---|---|
| Función global normalizeSearchString | Cumple |
| Normalización NFD y eliminación de marcas diacríticas | Cumple |
| Conversión a minúsculas y normalización de espacios | Cumple |
| «matematica» encuentra «Matemáticas» mediante indexOf | Cumple |
| Uso en búsqueda real de tickets | Cumple |
| Uso en filtro multicampo compartido | Cumple en el componente definido |
| Prueba UX-05 de normalización | Existe; no ejecutada en esta auditoría |
| Prueba end-to-end de búsqueda | No queda acreditada por UX-05; se revisará en T-UX-10 |

## Pruebas y límites

- Inspección manual de js/ui-common.js:1885-1892, 2137-2150, 2201-2212 y 4090-4112.
- Inspección manual de backend/user-service/Code.gs:841-844 y 7980-8142 para reconciliar T-UX-06/T-UX-14.
- Revisión de T-UX-05, T-UX-06, T-UX-10, T-UX-14 y T-UX-15 en completadas.md.
- Inspección del backlog vigente para evitar duplicación.
- No se ejecutaron navegador, DOM real, pruebas automatizadas, consultas a Google Sheets ni servicios backend. El dictamen es estático/manual; no se declara una ejecución runtime.
- No se modificó código fuente ni se realizaron operaciones productivas.

## SHAs de respaldo

- js/ui-common.js: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- backend/user-service/Code.gs: 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- completadas.md: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- METODOLOGIA_DESARROLLO.md: 214e8221bd076c4e89012636c105bffd5ca36467.
- Pendientes.md recuperado del blob vigente del HEAD de trabajo: e050c03b97fc08916b878c34dcd5c247403d8c4b.

## Progreso y continuidad

- T-UX-05: CUMPLE.
- Nuevos hallazgos: ninguno.
- Nuevas tareas: ninguna.
- Progreso acumulado: **48/183 identificadores auditados; 135 pendientes**.
- Siguiente tarea: **T-UX-06 - Omnibox Unificado Multi-Entidad con Atajo Global Ctrl + K**.

## Tareas ejecutables derivadas de los hallazgos

**No hay tareas ejecutables nuevas derivadas de esta auditoría.**

- **Dictamen:** T-UX-05 cumple.
- **Hallazgos nuevos:** ninguno.
- **Acción:** no crear AUD-NG/TASK ni reabrir tareas por observaciones que el informe clasifica como mejoras de alcance más amplio y no contradictorias con el requisito auditado.
- **Criterios de cierre:** conservar el dictamen y las referencias existentes; cualquier mejora futura requiere evidencia y auditoría propia.
- **Estado:** Sin tareas nuevas en este informe.
