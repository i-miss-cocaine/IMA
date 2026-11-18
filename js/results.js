document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Validar acceso (Profesores siempre, estudiantes solo si es su resultado)
    const resultsContainer = document.getElementById('results-container');
    const urlParams = new URLSearchParams(window.location.search);
    const entregaExamenId = urlParams.get('entregaExamenId');
    const calificacionParam = urlParams.get('calificacion');

    async function loadResults() {
        // Caso A: Datos pasados directamente por URL (Legacy/Instantáneo) (A-26)
        if (calificacionParam) {
            try {
                const rawResultados = urlParams.get('resultados');
                const rawPreguntas = urlParams.get('preguntas');

                if (!rawResultados || !rawPreguntas) {
                    throw new Error("Faltan parámetros de resultados o preguntas en la URL.");
                }

                const resultados = JSON.parse(decodeURIComponent(rawResultados));
                const preguntas = JSON.parse(decodeURIComponent(rawPreguntas));
                renderResultsDirect(calificacionParam, resultados, preguntas);
                return;
            } catch (e) {
                console.error("Error al procesar parámetros de URL:", e);
                resultsContainer.innerHTML = `<p class="text-red-500">Error al cargar resultados directos: ${e.message}</p>`;
                return;
            }
        }

        // Caso B: Fetch desde API por entregaId
        if (!entregaExamenId) {
            resultsContainer.innerHTML = '<p class="text-red-500">No se proporcionó un ID de entrega de examen.</p>';
            return;
        }

        try {
            const result = await fetchApi('EXAM', 'getExamResult', { entregaExamenId, userId: currentUser.userId });

            if (result.status === 'success' && result.data) {
                renderResults(result.data);
            } else {
                // Si el estudiante intenta ver un examen que no es suyo, el backend debería denegarlo
                throw new Error(result.message || 'No se pudieron cargar los resultados.');
            }
        } catch (error) {
            resultsContainer.innerHTML = `<p class="text-red-500">Error al cargar los resultados: ${error.message}</p>`;
        }
    }

    function escapeResultHtml(value) {
        return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function formatExamAnswer(item) {
        const raw = item.respuestaEstudiante;
        if (item.tipo === 'termino_pareado' || item.tipo === 'seleccion_multiple' || item.tipo === 'ordenamiento') {
            try {
                const parsed = typeof raw === 'string' ? JSON.parse(raw || (item.tipo === 'termino_pareado' ? '{}' : '[]')) : raw;
                if (item.tipo === 'termino_pareado' && parsed && typeof parsed === 'object') {
                    return Object.entries(parsed).map(([concept, definition]) =>
                        'Concepto ' + (Number(concept) + 1) + ' → Definición ' + (Number(definition) + 1)).join(', ');
                }
                if (Array.isArray(parsed)) return parsed.join(' → ');
            } catch (_) { return raw || 'No respondida'; }
        }
        return raw || 'No respondida';
    }

    function renderResultsDirect(calificacion, resultados, preguntas) {
        let detailsHtml = '<div class="space-y-4">';
        resultados.forEach((res, index) => {
            // (A-27) Validación de existencia del objeto pregunta
            const pregunta = (preguntas || []).find(p => p.preguntaId === res.preguntaId);
            const bgColor = res.esCorrecta ? 'bg-green-100' : 'bg-red-100';
            const borderColor = res.esCorrecta ? 'border-green-500' : 'border-red-500';
            const textoPregunta = pregunta && pregunta.textoPregunta ? pregunta.textoPregunta : 'Pregunta no encontrada';

            detailsHtml += `
                <div class="p-4 rounded border ${borderColor} ${bgColor}">
                    <p class="font-bold">${index + 1}. ${escapeResultHtml(textoPregunta)}</p>
                    <p class="text-sm">Tu respuesta: <span class="font-mono">${escapeResultHtml(res.respuestaEstudiante || 'No respondida')}</span> ${res.esCorrecta ? '✅' : '❌'}</p>
                </div>
            `;
        });
        detailsHtml += '</div>';

        resultsContainer.innerHTML = `
            <p class="text-4xl font-bold text-center mb-6 text-blue-600">Calificación: ${escapeResultHtml(calificacion)}%</p>
            <hr class="my-6">
            <h3 class="text-xl font-bold mb-4">Detalle de Respuestas</h3>
            ${detailsHtml}
        `;
    }

    function renderResults(data) {
        const { calificacionTotal, resultadosDetallados, examenTitulo } = data;

        let detailsHtml = '<div class="space-y-4">';
        resultadosDetallados.forEach((item, index) => {
            const bgColor = item.esCorrecta ? 'bg-green-100' : (parseFloat(item.score) > 0 ? 'bg-yellow-50' : 'bg-red-100');
            const borderColor = item.esCorrecta ? 'border-green-500' : (parseFloat(item.score) > 0 ? 'border-yellow-500' : 'border-red-500');

            const displayAnswer = formatExamAnswer(item);

            detailsHtml += `
                <div class="p-4 rounded border ${borderColor} ${bgColor}">
                    <p class="font-semibold">Pregunta ${index + 1}: ${escapeResultHtml(item.texto)}</p>
                    <p>Respuesta: <span class="font-mono whitespace-pre-wrap">${escapeResultHtml(displayAnswer)}</span></p>
                    <p>Puntaje: <span class="font-bold">${escapeResultHtml(item.score)}</span></p>
                </div>
            `;
        });
        detailsHtml += '</div>';

        resultsContainer.innerHTML = `
            <h2 class="text-2xl font-bold text-center mb-2">Examen: ${escapeResultHtml(examenTitulo)}</h2>
            <p class="text-4xl font-bold text-center mb-6 text-blue-600">Calificación Final: ${escapeResultHtml(calificacionTotal)}%</p>
            <hr class="my-6">
            <h3 class="text-xl font-bold mb-4">Detalle de Respuestas</h3>
            ${detailsHtml}
        `;
    }

    loadResults();
});
