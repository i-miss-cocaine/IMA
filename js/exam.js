document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
    if (!currentUser) { window.location.href = 'login.html'; return; }

    const examTitleEl = document.getElementById('exam-title');
    const questionsContainer = document.getElementById('questions-container');
    const examForm = document.getElementById('exam-form');
    const timerEl = document.getElementById('timer');

    const urlParams = new URLSearchParams(window.location.search);
    const examenId = urlParams.get('examenId');
    let originalQuestions = [];
    const STORAGE_KEY = `exam_progress_${currentUser.userId}_${examenId}`;

    /**
     * Tarea 2: Implementación de Fisher-Yates para barajado robusto.
     */
    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // --- Lógica del Examen ---
    async function loadExam() {
        const startOverlay = document.getElementById('start-exam-overlay');
        const startBtn = document.getElementById('start-exam-btn');
        let timeLimitFromApi = 0;

        // REQ: Asegurar sesión activa e integridad de datos (v4.0)
        if (!currentUser || !currentUser.userId || !examenId) {
            alert("Acceso no autorizado o ID de examen faltante. Regrese al portal.");
            window.location.href = "login.html";
            return;
        }

        if (window.GamesAdapter) window.GamesAdapter.showLoading(true);

        try {
            // Apuntar al microservicio de exámenes
            const result = await fetchApi('EXAM', 'getExamQuestions', { examenId, userId: currentUser.userId });
            if (result.status === 'success' && result.data) {
                const { titulo, tiempoLimite, preguntas } = result.data;
                if (examTitleEl) examTitleEl.textContent = titulo;
                timeLimitFromApi = tiempoLimite;

                // Se asigna un array vacío por defecto si la propiedad 'preguntas' no existe.
                originalQuestions = preguntas || [];

                if (originalQuestions.length > 0 && questionsContainer) {
                    questionsContainer.innerHTML = originalQuestions.map(renderQuestion).join('');

                    // REQ: Restauración automática de progreso (v4.0)
                    loadProgress();

                    // Escuchar cambios para autoguardado en tiempo real
                    questionsContainer.addEventListener('input', () => {
                        console.log("[IMA-EXAM] Detectado cambio en respuesta. Autoguardando...");
                        saveProgress();
                    });

                    // Soporte para cambios en radio/checkbox que a veces no disparan 'input' en todos los browsers
                    questionsContainer.addEventListener('change', saveProgress);
                } else {
                    questionsContainer.innerHTML = '<p class="text-gray-500">Este examen no tiene preguntas actualmente.</p>';
                    const submitBtn = document.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.style.display = 'none';
                }

                // Habilitar botón de inicio solo si cargó correctamente (A-24)
                if (startBtn) {
                    // Si ya hay progreso, cambiar texto del botón
                    if (localStorage.getItem(STORAGE_KEY)) {
                        startBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Continuar Examen';
                    }

                    startBtn.addEventListener('click', () => {
                        if (startOverlay) startOverlay.classList.add('hidden');
                        if (timeLimitFromApi) startTimer(timeLimitFromApi);
                        requestFullScreen();
                    });
                }
            } else { throw new Error(result.message); }
        } catch (error) {
            if (questionsContainer) questionsContainer.innerHTML = `<p class="text-red-500 text-center py-10 font-bold">Error al cargar el examen: ${error.message}</p>`;
            // Si falla la carga, mostramos un botón de reintento o volvemos
            if (startBtn) {
                startBtn.textContent = "Volver al Dashboard";
                startBtn.classList.replace('bg-blue-600', 'bg-gray-600');
                startBtn.addEventListener('click', () => {
                    window.location.href = 'student-dashboard.html';
                });
            }
        } finally {
            if (window.GamesAdapter) window.GamesAdapter.showLoading(false);
        }
    }

    function escapeQuestionHtml(value) {
        return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function renderQuestion(question, index) {
        const questionId = question.preguntaId || `q_${index}`;
        const questionType = question.tipo;
        const questionText = escapeQuestionHtml(question.texto);
        let options = question.opciones || {};

        // Manejar el caso donde las opciones lleguen como string JSON (defensivo)
        if (typeof options === 'string') {
            try { options = JSON.parse(options); } catch (e) { options = {}; }
        }

        let optionsHtml = '';

        switch (questionType) {
            case 'opcion_multiple':
            case 'verdadero_falso':
                optionsHtml = Object.entries(options).map(([key, value]) => {
                    const inputValue = (questionType === 'verdadero_falso') ? value : key;
                    return `
                        <label class="block p-2 rounded hover:bg-gray-100">
                            <input type="radio" name="question_${questionId}" value="${escapeQuestionHtml(inputValue)}" class="mr-2">
                            ${escapeQuestionHtml(value)}
                        </label>
                    `;
                }).join('');
                break;
            case 'completacion':
            case 'respuesta_breve':
                optionsHtml = `<input type="text" name="question_${questionId}" class="w-full p-2 border rounded" placeholder="Escribe tu respuesta aquí">`;
                break;
            case 'termino_pareado':
                if (Array.isArray(options.concepts) && Array.isArray(options.definitions)) {
                    optionsHtml = options.concepts.map((concept, conceptIndex) => `
                        <label class="block p-2">
                            <span class="block font-medium mb-1">${conceptIndex + 1}. ${escapeQuestionHtml(concept)}</span>
                            <select name="question_${questionId}_match_${conceptIndex}" class="w-full p-2 border rounded">
                                <option value="">Selecciona una definición</option>
                                ${options.definitions.map((definition, definitionIndex) => `<option value="${definitionIndex}">${escapeQuestionHtml(definition)}</option>`).join('')}
                            </select>
                        </label>`).join('');
                }
                break;
            case 'seleccion_multiple':
                optionsHtml = Object.entries(options).filter(([, value]) => String(value || '').trim()).map(([key, value]) => `
                    <label class="block p-2 rounded hover:bg-gray-100">
                        <input type="checkbox" name="question_${questionId}" value="${escapeQuestionHtml(key)}" class="mr-2">
                        ${escapeQuestionHtml(value)}
                    </label>`).join('');
                break;
            case 'respuesta_extensa':
                optionsHtml = `<textarea name="question_${questionId}" rows="6" class="w-full p-3 border rounded" placeholder="Escribe tu respuesta..."></textarea>`;
                break;
            case 'numerica':
                optionsHtml = `<input type="number" step="any" name="question_${questionId}" class="w-full p-2 border rounded" placeholder="Ingresa un valor numérico">`;
                break;
            case 'ordenamiento':
                if (Array.isArray(options.items)) {
                    optionsHtml = options.items.map((item, itemIndex) => `
                        <label class="block p-2">
                            <span class="block mb-1">${escapeQuestionHtml(item)}</span>
                            <select name="question_${questionId}_order_${itemIndex}" class="w-full p-2 border rounded">
                                <option value="">Posición</option>
                                ${options.items.map((_, position) => `<option value="${position}">${position + 1}</option>`).join('')}
                            </select>
                        </label>`).join('');
                }
                break;
        }

        return `
            <div class="p-6 border-b question-block" data-question-id="${questionId}" data-question-type="${questionType}">
                <p class="font-semibold text-lg mb-4">${index + 1}. ${questionText}</p>
                <div class="space-y-3">
                    ${optionsHtml}
                </div>
            </div>
        `;
    }

    function saveProgress() {
        const progress = {};
        const questionBlocks = document.querySelectorAll('.question-block');
        questionBlocks.forEach(block => {
            const qId = block.dataset.questionId;
            const qType = block.dataset.questionType;

            if (qType === 'opcion_multiple' || qType === 'verdadero_falso') {
                const selected = block.querySelector(`input[name="question_${qId}"]:checked`);
                if (selected) progress[qId] = selected.value;
            } else if (qType === 'completacion' || qType === 'respuesta_breve') {
                const input = block.querySelector(`input[name="question_${qId}"]`);
                if (input) progress[qId] = input.value;
            } else if (qType === 'termino_pareado') {
                const inputs = block.querySelectorAll(`select[name^="question_${qId}_match_"]`);
                const pairs = {};
                inputs.forEach(input => { if (input.value !== '') pairs[input.name.split('_match_')[1]] = Number(input.value); });
                if (Object.keys(pairs).length) progress[qId] = pairs;
            } else if (qType === 'seleccion_multiple') {
                progress[qId] = Array.from(block.querySelectorAll(`input[name="question_${qId}"]:checked`)).map(input => input.value);
            } else if (qType === 'respuesta_extensa' || qType === 'numerica') {
                const input = block.querySelector(`[name="question_${qId}"]`);
                if (input) progress[qId] = input.value;
            } else if (qType === 'ordenamiento') {
                const inputs = block.querySelectorAll(`select[name^="question_${qId}_order_"]`);
                const order = {};
                inputs.forEach(input => { if (input.value !== '') order[input.name.split('_order_')[1]] = Number(input.value); });
                if (Object.keys(order).length) progress[qId] = order;
            }
        });

        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...currentData,
            answers: progress,
            lastUpdate: Date.now()
        }));
    }

    function loadProgress() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        try {
            const { answers } = JSON.parse(saved);
            if (!answers) return;

            Object.entries(answers).forEach(([qId, value]) => {
                const block = document.querySelector(`.question-block[data-question-id="${qId}"]`);
                if (!block) return;
                const qType = block.dataset.questionType;

                if (qType === 'opcion_multiple' || qType === 'verdadero_falso') {
                    const input = block.querySelector(`input[name="question_${qId}"][value="${value}"]`);
                    if (input) input.checked = true;
                } else if (qType === 'completacion' || qType === 'respuesta_breve') {
                    const input = block.querySelector(`input[name="question_${qId}"]`);
                    if (input) input.value = value;
                } else if (qType === 'termino_pareado') {
                    Object.entries(value).forEach(([conceptIndex, definitionIndex]) => {
                        const input = block.querySelector(`select[name="question_${qId}_match_${conceptIndex}"]`);
                        if (input) input.value = String(definitionIndex);
                    });
                } else if (qType === 'seleccion_multiple') {
                    (Array.isArray(value) ? value : []).forEach(key => {
                        const input = Array.from(block.querySelectorAll(`input[name="question_${qId}"]`)).find(item => item.value === key);
                        if (input) input.checked = true;
                    });
                } else if (qType === 'respuesta_extensa' || qType === 'numerica') {
                    const input = block.querySelector(`[name="question_${qId}"]`);
                    if (input) input.value = value;
                } else if (qType === 'ordenamiento') {
                    Object.entries(value).forEach(([itemIndex, position]) => {
                        const input = block.querySelector(`select[name="question_${qId}_order_${itemIndex}"]`);
                        if (input) input.value = String(position);
                    });
                }
            });
        } catch (e) {
            console.error("Error cargando progreso:", e);
        }
    }

    async function submitExam(isBlocked) {
        const submitBtn = document.querySelector('button[type="submit"]');
        const respuestas = [];
        const questionBlocks = document.querySelectorAll('.question-block');

        if (window.GamesAdapter) {
            window.GamesAdapter.recordAction({
                action: 'submit_exam_attempt',
                examenId: examenId,
                isBlocked: isBlocked
            });
        }

        questionBlocks.forEach(block => {
            const preguntaId = block.dataset.questionId;
            const preguntaTipo = block.dataset.questionType;
            let respuestaEstudiante = '';

            switch (preguntaTipo) {
                case 'opcion_multiple':
                case 'verdadero_falso':
                    const selectedOption = block.querySelector(`input[name="question_${preguntaId}"]:checked`);
                    if (selectedOption) {
                        respuestaEstudiante = selectedOption.value;
                    }
                    break;
                case 'completacion':
                case 'respuesta_breve':
                    const inputField = block.querySelector(`input[name="question_${preguntaId}"]`);
                    if (inputField) {
                        respuestaEstudiante = inputField.value.trim();
                    }
                    break;
                case 'termino_pareado': {
                    const inputs = block.querySelectorAll(`select[name^="question_${preguntaId}_match_"]`);
                    const pairs = {};
                    inputs.forEach(input => { if (input.value !== '') pairs[input.name.split('_match_')[1]] = Number(input.value); });
                    respuestaEstudiante = JSON.stringify(pairs);
                    break;
                }
                case 'seleccion_multiple':
                    respuestaEstudiante = JSON.stringify(Array.from(block.querySelectorAll(`input[name="question_${preguntaId}"]:checked`)).map(input => input.value));
                    break;
                case 'respuesta_extensa': {
                    const input = block.querySelector(`[name="question_${preguntaId}"]`);
                    respuestaEstudiante = input ? input.value.trim() : '';
                    break;
                }
                case 'numerica': {
                    const input = block.querySelector(`[name="question_${preguntaId}"]`);
                    respuestaEstudiante = input ? input.value : '';
                    break;
                }
                case 'ordenamiento': {
                    const inputs = block.querySelectorAll(`select[name^="question_${preguntaId}_order_"]`);
                    const order = {};
                    inputs.forEach(input => { if (input.value !== '') order[input.name.split('_order_')[1]] = Number(input.value); });
                    respuestaEstudiante = JSON.stringify(order);
                    break;
                }
            }
            respuestas.push({ preguntaId, respuestaEstudiante });
        });

        // Detener si es un bloqueo y no hay respuestas (p.ej. el estudiante no empezó)
        if (isBlocked && respuestas.length === 0) {
            window.location.href = 'student-dashboard.html';
            return;
        }

        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        try {
            const payload = { examenId, userId: currentUser.userId, respuestas, estado: isBlocked ? 'Bloqueado' : 'Entregado' };

            // Backup call to Analytics as per requirement
            fetchApi('USER', 'recordAnalytics', {
                userId: currentUser.userId,
                action: 'exam_submit',
                payload: { examenId, questionCount: respuestas.length, isBlocked }
            }).catch(() => {});

            const result = await fetchApi('EXAM', 'submitExam', payload);

            if (result.status === 'success' && result.data) {
                 // Limpiar autoguardado tras entrega exitosa
                 localStorage.removeItem(STORAGE_KEY);
                 // Redirigir al dashboard del estudiante
                 window.location.href = 'student-dashboard.html';
            } else {
                throw new Error(result.message || "Error al enviar el examen.");
            }
        } catch (error) {
            alert(`Error al enviar el examen: ${error.message}`);
        } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    }

    function startTimer(durationMinutes) {
        if (!durationMinutes || !timerEl) return;

        let timeRemaining;
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

        if (savedData.endTime) {
            const now = Date.now();
            timeRemaining = Math.max(0, Math.floor((savedData.endTime - now) / 1000));
        } else {
            timeRemaining = durationMinutes * 60;
            const endTime = Date.now() + (timeRemaining * 1000);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                ...savedData,
                endTime: endTime
            }));
        }

        const updateTimerDisplay = () => {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (timeRemaining <= 60) {
                timerEl.classList.add('text-red-600', 'animate-pulse');
            }
        };

        updateTimerDisplay();

        const timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert('El tiempo ha terminado. El examen se enviará automáticamente.');
                submitExam(true);
            }
        }, 1000);
    }

    function requestFullScreen() {
        const docEl = document.documentElement;
        const request = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;

        if (request) {
            request.call(docEl).catch(err => {
                console.log(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }

        // Protecciones contra salida accidental (A-25)
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                const submitBtn = document.querySelector('button[type="submit"]');
                // Verificar explícitamente que no haya un envío en curso
                if (submitBtn && !submitBtn.disabled && !submitBtn.classList.contains('btn-loading')) {
                    alert('Has salido del modo pantalla completa. Por seguridad, el examen se enviará automáticamente.');
                    submitExam(true);
                }
            }
        });
    }

    examForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // REQ: Confirmación de entrega (v3.3)
        if (confirm("¿Estás seguro de que deseas finalizar tu examen? Esta acción no se puede deshacer.")) {
            await submitExam(false);
        }
    });

    loadExam();
});
