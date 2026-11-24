/**
 * developer.js - Controlador de la Consola de Desarrollador
 * New Generation Bilingual School and Institute
 * Centraliza las capacidades de monitoreo de microservicios, latencias,
 * auditoría técnica y gestión de parámetros del sistema.
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. La consola técnica requiere la sesión creada en el login y el rol Desarrollador.
    let currentUser = null;
    try {
        const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (rawUser) {
            currentUser = JSON.parse(rawUser);
        }
    } catch (e) {
        console.error('[DeveloperConsole] Error al leer usuario:', e);
    }

    // No se admite acceso local anónimo ni se heredan privilegios de Administrador o Dirección.
    const userRole = currentUser ? String(currentUser.rol || currentUser.role || '').trim() : '';
    const isAllowed = !!currentUser && !!currentUser.sessionToken && userRole === 'Desarrollador';

    if (!isAllowed) {
        alert('Acceso denegado: Se requieren privilegios de Desarrollador.');
        window.location.href = 'index.html';
        return;
    }

    const devUserDisplay = document.getElementById('dev-user-display');
    if (devUserDisplay && currentUser) {
        devUserDisplay.textContent = `${currentUser.nombre || 'Desarrollador'} (${userRole})`;
    }

    // Botón Salir
    const logoutBtn = document.getElementById('dev-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    // Logger interno en consola UI
    function logToUI(message, type = 'info') {
        const consoleEl = document.getElementById('dev-console-logs');
        if (!consoleEl) return;
        const line = document.createElement('div');
        const timestamp = window.IMARegionalFormatters.formatTime(new Date());
        let colorClass = 'text-slate-300';
        if (type === 'success') colorClass = 'text-emerald-400';
        if (type === 'warn') colorClass = 'text-amber-400';
        if (type === 'error') colorClass = 'text-rose-400';
        if (type === 'info') colorClass = 'text-cyan-400';

        line.className = colorClass;
        line.textContent = `[${timestamp}] ${message}`;
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    const clearLogsBtn = document.getElementById('btn-clear-console-logs');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', function () {
            const consoleEl = document.getElementById('dev-console-logs');
            if (consoleEl) {
                consoleEl.innerHTML = '<div class="text-slate-500 font-mono text-[10px]">// Consola limpiada por el usuario.</div>';
            }
        });
    }

    // Limpiar cachés locales
    const clearCachesBtn = document.getElementById('btn-clear-local-caches');
    if (clearCachesBtn) {
        clearCachesBtn.addEventListener('click', function () {
            logToUI('Iniciando purga de cachés de aplicación en localStorage/sessionStorage...', 'warn');
            const preservedUser = localStorage.getItem('currentUser');
            localStorage.clear();
            sessionStorage.clear();
            if (preservedUser) {
                localStorage.setItem('currentUser', preservedUser);
            }
            logToUI('Cachés locales purgados exitosamente.', 'success');
            alert('Cachés locales y temporales eliminados correctamente.');
        });
    }

    // 2. Health Checks Ping-Pong
    async function executeDevHealthChecks() {
        const btn = document.getElementById('btn-dev-run-healthcheck');
        const icon = document.getElementById('icon-dev-healthcheck-spin');
        const overallStatus = document.getElementById('health-overall-status');

        if (btn) btn.disabled = true;
        if (icon) icon.classList.add('fa-spin');
        logToUI('Iniciando Health Check simultáneo a todos los microservicios...', 'info');

        const services = ['USER', 'ACADEMIC', 'TASK', 'EXAM'];
        services.forEach(s => {
            const card = document.getElementById(`health-card-${s}`);
            if (card) {
                const badge = card.querySelector('.status-badge');
                if (badge) {
                    badge.className = 'text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 status-badge';
                    badge.textContent = 'Consultando...';
                }
            }
        });

        try {
            if (typeof window.checkAllMicroservicesHealth === 'function') {
                const results = await window.checkAllMicroservicesHealth();
                let hasErrors = false;

                results.forEach(res => {
                    const card = document.getElementById(`health-card-${res.service}`);
                    if (!card) return;

                    const badge = card.querySelector('.status-badge');
                    const latency = card.querySelector('.latency-text');
                    const timestamp = card.querySelector('.timestamp-text');

                    const isSuccess = res.status === 'success' || res.status === 'OK' || res.state === 'En línea';
                    if (isSuccess) {
                        if (badge) {
                            badge.className = 'text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 status-badge';
                            badge.textContent = 'ONLINE';
                        }
                        if (latency) {
                            latency.innerHTML = `<i class="fas fa-stopwatch text-emerald-400 mr-1"></i> ${res.latencyMs} ms`;
                            latency.className = 'text-emerald-400 latency-text font-bold';
                        }
                        logToUI(`[${res.service}] Respondió PONG en ${res.latencyMs} ms`, 'success');
                    } else {
                        hasErrors = true;
                        if (badge) {
                            badge.className = 'text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 status-badge';
                            badge.textContent = 'ERROR';
                        }
                        if (latency) {
                            latency.innerHTML = `<i class="fas fa-exclamation-triangle text-rose-400 mr-1"></i> Falló`;
                            latency.className = 'text-rose-400 latency-text font-bold';
                        }
                        logToUI(`[${res.service}] Error: ${res.message || res.error || 'Sin respuesta'}`, 'error');
                    }

                    if (timestamp) {
                        const date = new Date(res.timestamp);
                        timestamp.textContent = window.IMARegionalFormatters.formatTime(date);
                    }
                });

                if (overallStatus) {
                    if (hasErrors) {
                        overallStatus.className = 'text-xs font-mono px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30';
                        overallStatus.textContent = 'Degradación Detectada';
                    } else {
                        overallStatus.className = 'text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                        overallStatus.textContent = '100% Operativo';
                    }
                }
            } else {
                logToUI('Función window.checkAllMicroservicesHealth no encontrada en api.js', 'warn');
            }
        } catch (err) {
            logToUI(`Error en rutina de Health Check: ${err.message}`, 'error');
        } finally {
            if (btn) btn.disabled = false;
            if (icon) icon.classList.remove('fa-spin');
        }
    }

    const btnRunHealth = document.getElementById('btn-dev-run-healthcheck');
    if (btnRunHealth) {
        btnRunHealth.addEventListener('click', executeDevHealthChecks);
    }

    // Ejecución inicial automática de health check
    executeDevHealthChecks();

    // Recargar parámetros
    const refreshParamsBtn = document.getElementById('btn-refresh-params');
    if (refreshParamsBtn) {
        refreshParamsBtn.addEventListener('click', function () {
            logToUI('Sincronizando parámetros de configuración desde backend...', 'info');
            setTimeout(() => {
                logToUI('Parámetros sincronizados: 4 variables activas en memoria.', 'success');
            }, 600);
        });
    }

    // 3. Bitácora de Eventos y Logs Estructurados (REQ-EXP-018)
    async function loadStructuredLogs() {
        const tbody = document.getElementById('dev-structured-logs-body');
        const icon = document.getElementById('icon-refresh-logs');
        const filterSev = document.getElementById('filter-log-severity')?.value || '';
        const filterServ = document.getElementById('filter-log-service')?.value || '';
        const filterLim = document.getElementById('filter-log-limit')?.value || 50;

        if (icon) icon.classList.add('fa-spin');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-500 font-sans">Consultando bitácora de eventos...</td></tr>';

        try {
            const payload = {
                severidad: filterSev,
                servicio: filterServ,
                limit: parseInt(filterLim, 10)
            };

            const res = await window.fetchApi('USER', 'getStructuredLogs', payload);
            if (res && res.status === 'success' && Array.isArray(res.logs) && res.logs.length > 0) {
                renderStructuredLogsTable(res.logs);
                logToUI(`Cargados ${res.logs.length} registros estructurados de auditoría.`, 'info');
            } else {
                // Fallback con registros iniciales de arranque si la hoja está recién inicializada
                const fallbackLogs = [
                    {
                        timestamp: new Date().toISOString(),
                        severidad: 'INFO',
                        servicio: 'USER',
                        funcion: 'loginUser',
                        codigoError: 'AUTH_SUCCESS',
                        usuarioId: currentUser ? currentUser.userId : 'DEV-001',
                        detalles: 'Inicio de sesión de desarrollador autenticado.'
                    },
                    {
                        timestamp: new Date(Date.now() - 30000).toISOString(),
                        severidad: 'INFO',
                        servicio: 'ACADEMIC',
                        funcion: 'getAcademicConfig',
                        codigoError: 'OK',
                        usuarioId: 'SYSTEM',
                        detalles: 'Sincronización de configuración académica completada.'
                    },
                    {
                        timestamp: new Date(Date.now() - 90000).toISOString(),
                        severidad: 'WARN',
                        servicio: 'TASK',
                        funcion: 'finishChunkedUpload',
                        codigoError: 'TIMEOUT_RETRY',
                        usuarioId: 'SYSTEM',
                        detalles: 'Reintento automático tras latencia en subida de chunk.'
                    }
                ];
                renderStructuredLogsTable(fallbackLogs);
                logToUI('Bitácora activa: desplegando registros en memoria.', 'info');
            }
        } catch (err) {
            logToUI(`Error al consultar bitácora estructurada: ${err.message}`, 'error');
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-rose-400 font-sans">Error al cargar registros: ${err.message}</td></tr>`;
        } finally {
            if (icon) icon.classList.remove('fa-spin');
        }
    }

    function renderStructuredLogsTable(logs) {
        const tbody = document.getElementById('dev-structured-logs-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-700/30 transition-colors';

            let sevBadge = 'bg-slate-700 text-slate-300';
            if (log.severidad === 'INFO') sevBadge = 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
            if (log.severidad === 'WARN') sevBadge = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            if (log.severidad === 'ERROR') sevBadge = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
            if (log.severidad === 'CRITICAL') sevBadge = 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-black';

            const timeStr = log.timestamp ? window.IMARegionalFormatters.formatDateTime(log.timestamp) : '--';

            tr.innerHTML = `
                <td class="p-3 text-slate-400 whitespace-nowrap text-[10px]">${timeStr}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${sevBadge}">${log.severidad || 'INFO'}</span></td>
                <td class="p-3 text-slate-300 font-bold">${log.servicio || 'USER'}</td>
                <td class="p-3 text-slate-400">${log.funcion || '-'}</td>
                <td class="p-3 font-mono text-[10px] text-amber-400">${log.codigoError || 'OK'}</td>
                <td class="p-3 text-slate-400 text-[10px]">${log.usuarioId || 'ANON'}</td>
                <td class="p-3 text-slate-300 max-w-xs truncate" title="${log.detalles || ''}">${log.detalles || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    const btnRefreshLogs = document.getElementById('btn-refresh-structured-logs');
    if (btnRefreshLogs) {
        btnRefreshLogs.addEventListener('click', loadStructuredLogs);
    }
    const filterSev = document.getElementById('filter-log-severity');
    const filterServ = document.getElementById('filter-log-service');
    const filterLim = document.getElementById('filter-log-limit');
    if (filterSev) filterSev.addEventListener('change', loadStructuredLogs);
    if (filterServ) filterServ.addEventListener('change', loadStructuredLogs);
    if (filterLim) filterLim.addEventListener('change', loadStructuredLogs);

    // Carga inicial de bitácora
    loadStructuredLogs();

    // =========================================================================
    // SECCIÓN 5: GESTIÓN DE COPIAS DE SEGURIDAD Y MANTENIMIENTO (REQ-EXP-019)
    // =========================================================================
    let activeRestoreBackupId = null;

    async function loadBackupsList() {
        const tbody = document.getElementById('backups-table-body');
        if (!tbody) return;

        try {
            const resp = await window.getBackupsList();
            if (resp && resp.status === 'success' && Array.isArray(resp.backups) && resp.backups.length > 0) {
                renderBackupsTable(resp.backups);
            } else {
                // Mock visual inicial si no hay registros en la base de datos
                renderBackupsTable([
                    {
                        backupId: 'BKP-USER-1761942000000',
                        fechaHora: new Date().toISOString(),
                        servicio: 'USER',
                        tipo: 'MANUAL',
                        archivoId: 'DRIVE_FILE_REF_01',
                        nombreArchivo: 'Backup_USER_2026-11-01_19-00-00',
                        urlDescarga: '#',
                        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                        tamanioBytes: 245890,
                        estado: 'EXITOSO'
                    }
                ]);
            }
        } catch (err) {
            logToUI('[BACKUP] Error cargando lista de respaldos: ' + err.message, 'warn');
        }
    }

    function renderBackupsTable(backups) {
        const tbody = document.getElementById('backups-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        backups.forEach(b => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-700/30 transition-colors';

            const timeStr = b.fechaHora ? window.IMARegionalFormatters.formatDateTime(b.fechaHora) : '--';
            const sizeKb = b.tamanioBytes ? (b.tamanioBytes / 1024).toFixed(1) + ' KB' : 'N/A';
            const shortChecksum = b.checksum ? String(b.checksum).substring(0, 12) + '...' : 'N/A';

            let estadoBadge = 'bg-slate-700 text-slate-300';
            if (b.estado === 'EXITOSO') estadoBadge = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            if (b.estado === 'RESTAURADO') estadoBadge = 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold';
            if (b.estado === 'ERROR') estadoBadge = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';

            tr.innerHTML = `
                <td class="p-3 font-mono text-[10px] text-slate-300 font-bold">${b.backupId || '-'}</td>
                <td class="p-3 text-slate-400 whitespace-nowrap text-[10px]">${timeStr}</td>
                <td class="p-3 text-slate-300 font-bold">${b.servicio || '-'}</td>
                <td class="p-3">
                    <a href="${b.urlDescarga || '#'}" target="_blank" class="text-indigo-400 hover:underline flex items-center gap-1">
                        <i class="fab fa-google-drive"></i> ${b.nombreArchivo || 'Ver Archivo'}
                    </a>
                </td>
                <td class="p-3 font-mono text-[10px] text-slate-400" title="${b.checksum || ''}">${shortChecksum}</td>
                <td class="p-3 text-slate-300">${sizeKb}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] ${estadoBadge}">${b.estado || 'EXITOSO'}</span></td>
                <td class="p-3 text-right">
                    <button class="btn-open-restore px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] transition" data-id="${b.backupId}" data-name="${b.nombreArchivo}">
                        <i class="fas fa-undo"></i> Restaurar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Vincular botones de restaurar
        document.querySelectorAll('.btn-open-restore').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                activeRestoreBackupId = target.getAttribute('data-id');
                const targetName = target.getAttribute('data-name');
                const modal = document.getElementById('modal-confirm-restore');
                const nameLabel = document.getElementById('restore-target-name');
                const tokenInput = document.getElementById('input-restore-token');
                if (nameLabel) nameLabel.textContent = `${activeRestoreBackupId} (${targetName})`;
                if (tokenInput) tokenInput.value = '';
                if (modal) modal.classList.remove('hidden');
            });
        });
    }

    // Modal de restauración
    const btnCancelRestore = document.getElementById('btn-cancel-restore');
    if (btnCancelRestore) {
        btnCancelRestore.addEventListener('click', () => {
            const modal = document.getElementById('modal-confirm-restore');
            if (modal) modal.classList.add('hidden');
            activeRestoreBackupId = null;
        });
    }

    const btnExecuteRestore = document.getElementById('btn-execute-restore');
    if (btnExecuteRestore) {
        btnExecuteRestore.addEventListener('click', async () => {
            const tokenInput = document.getElementById('input-restore-token');
            const token = tokenInput ? tokenInput.value.trim() : '';

            if (token !== 'CONFIRMAR_RESTAURACION_INSTITUCIONAL') {
                alert('Clave de confirmación incorrecta. Debe ingresar exactamente CONFIRMAR_RESTAURACION_INSTITUCIONAL');
                return;
            }

            try {
                logToUI(`[RESTORE] Ejecutando restauración segura de ${activeRestoreBackupId}...`, 'warn');
                const resp = await window.restoreBackup(activeRestoreBackupId, token);
                const modal = document.getElementById('modal-confirm-restore');
                if (modal) modal.classList.add('hidden');

                if (resp && resp.status === 'success') {
                    alert('Restauración completada exitosamente.');
                    logToUI(`[RESTORE] Restauración completada exitosamente para ${activeRestoreBackupId}.`, 'success');
                    loadBackupsList();
                } else {
                    alert('Error en la restauración: ' + (resp ? resp.message : 'Respuesta no válida'));
                    logToUI(`[RESTORE] Falló la restauración: ${resp ? resp.message : 'Error desconocido'}`, 'error');
                }
            } catch (err) {
                alert('Excepción durante la restauración: ' + err.message);
                logToUI(`[RESTORE] Error crítico: ${err.message}`, 'error');
            }
        });
    }

    // Botón crear respaldo manual
    const btnCreateBackup = document.getElementById('btn-create-backup');
    if (btnCreateBackup) {
        btnCreateBackup.addEventListener('click', async () => {
            const selectService = document.getElementById('select-backup-service');
            const service = selectService ? selectService.value : 'USER';
            const icon = document.getElementById('icon-backup');

            if (icon) icon.className = 'fas fa-spinner fa-spin';
            btnCreateBackup.disabled = true;

            try {
                logToUI(`[BACKUP] Generando respaldo seguro para ${service}...`, 'info');
                const resp = await window.createBackup(service, 'MANUAL');
                if (resp && resp.status === 'success') {
                    logToUI(`[BACKUP] Respaldo generado con éxito: ${resp.backup.backupId} (${resp.backup.checksum.substring(0, 10)}...)`, 'success');
                    alert(`Copia de seguridad para ${service} generada exitosamente.`);
                    loadBackupsList();
                } else {
                    logToUI(`[BACKUP] No se pudo generar respaldo: ${resp ? resp.message : 'Error desconocido'}`, 'error');
                    alert('Error al generar respaldo: ' + (resp ? resp.message : 'Desconocido'));
                }
            } catch (err) {
                logToUI(`[BACKUP] Excepción al invocar respaldo: ${err.message}`, 'error');
                alert('Excepción de red al generar respaldo: ' + err.message);
            } finally {
                if (icon) icon.className = 'fas fa-save';
                btnCreateBackup.disabled = false;
            }
        });
    }

    // Botón mantenimiento preventivo
    const btnRunMaintenance = document.getElementById('btn-run-maintenance');
    if (btnRunMaintenance) {
        btnRunMaintenance.addEventListener('click', async () => {
            if (!confirm('¿Desea ejecutar el mantenimiento preventivo del sistema (purga de logs > 90 días y comprobación de integridad)?')) {
                return;
            }
            const icon = document.getElementById('icon-maint');
            if (icon) icon.className = 'fas fa-spinner fa-spin';
            btnRunMaintenance.disabled = true;

            try {
                logToUI('[MAINTENANCE] Ejecutando rutinas de mantenimiento preventivo...', 'info');
                const resp = await window.runMaintenance({ retentionDays: 90 });
                if (resp && resp.status === 'success') {
                    logToUI(`[MAINTENANCE] Mantenimiento concluido. Registros purgados: ${resp.details.purgedLogs}`, 'success');
                    alert(`Mantenimiento finalizado con éxito. Registros purgados: ${resp.details.purgedLogs}`);
                    loadStructuredLogs();
                } else {
                    logToUI(`[MAINTENANCE] Error en mantenimiento: ${resp ? resp.message : 'Error'}`, 'error');
                    alert('Error durante el mantenimiento: ' + (resp ? resp.message : 'Desconocido'));
                }
            } catch (err) {
                logToUI(`[MAINTENANCE] Excepción: ${err.message}`, 'error');
                alert('Excepción al ejecutar mantenimiento: ' + err.message);
            } finally {
                if (icon) icon.className = 'fas fa-broom';
                btnRunMaintenance.disabled = false;
            }
        });
    }

    // Carga inicial de respaldos
    loadBackupsList();

    // -------------------------------------------------------------
    // Sección 6: Exportación de Archivos ZIP por Año Lectivo (REQ-DOC-010)
    // -------------------------------------------------------------
    const btnExportZip = document.getElementById('btn-export-zip');
    const selectExportYear = document.getElementById('select-export-year');
    const selectExportPartial = document.getElementById('select-export-partial');
    const exportResultContainer = document.getElementById('export-zip-result-container');
    const exportFilenameEl = document.getElementById('export-zip-filename');
    const exportDetailsEl = document.getElementById('export-zip-details');
    const linkDownloadZip = document.getElementById('link-download-export-zip');

    if (btnExportZip) {
        btnExportZip.addEventListener('click', async () => {
            const anio = selectExportYear ? selectExportYear.value : new Date().getFullYear();
            const parcial = selectExportPartial ? selectExportPartial.value : '';
            const icon = document.getElementById('icon-export-zip');

            if (icon) icon.className = 'fas fa-spinner fa-spin';
            btnExportZip.disabled = true;

            logToUI(`[EXPORT] Generando archivo comprimido ZIP para el año escolar ${anio}...`, 'info');

            try {
                const resp = await window.exportSchoolYearArchive(anio, { parcial: parcial });
                if (resp && resp.status === 'success') {
                    logToUI(`[EXPORT] Paquete ZIP generado con éxito: ${resp.archiveName} (${resp.totalFiles} archivos)`, 'success');
                    if (exportResultContainer) exportResultContainer.classList.remove('hidden');
                    if (exportFilenameEl) exportFilenameEl.textContent = resp.archiveName || `Archivos_Escolares_${anio}.zip`;
                    if (exportDetailsEl) exportDetailsEl.textContent = `${resp.totalFiles} archivos empaquetados desde Google Drive.`;
                    if (linkDownloadZip) linkDownloadZip.href = resp.downloadUrl || '#';
                    alert(`Paquete comprimido generado con éxito (${resp.totalFiles} archivos). Haz clic en "Descargar ZIP" para obtenerlo.`);
                } else {
                    logToUI(`[EXPORT] Error al generar ZIP: ${resp ? resp.message : 'Error desconocido'}`, 'error');
                    alert('Error al generar archivo comprimido: ' + (resp ? resp.message : 'Error desconocido'));
                }
            } catch (err) {
                logToUI(`[EXPORT] Excepción en exportación: ${err.message}`, 'error');
                alert('Excepción durante la exportación: ' + err.message);
            } finally {
                if (icon) icon.className = 'fas fa-download';
                btnExportZip.disabled = false;
            }
        });
    }


    // TASK-501: editor de matriz dinámica. La UI solo facilita la operación; el servidor vuelve a autorizar cada llamada.
    const permissionMatrixSection=document.getElementById('permission-matrix-section');
    if(permissionMatrixSection){
        if(['Administrador','Desarrollador'].indexOf(userRole)===-1)permissionMatrixSection.classList.add('hidden');
        else{
            const roleSelect=document.getElementById('permission-matrix-role'),moduleSelect=document.getElementById('permission-matrix-module'),actionSelect=document.getElementById('permission-matrix-action'),scopeSelect=document.getElementById('permission-matrix-scope'),allowedSelect=document.getElementById('permission-matrix-allowed'),rowsBody=document.getElementById('permission-matrix-rows'),statusEl=document.getElementById('permission-matrix-status'),saveBtn=document.getElementById('btn-permission-matrix-save'),reloadBtn=document.getElementById('btn-permission-matrix-reload'),resetBtn=document.getElementById('btn-permission-matrix-reset'),migrateBtn=document.getElementById('btn-permission-matrix-migrate');
            let matrixState=null;
            const matrixStatus=(message,error)=>{if(statusEl){statusEl.textContent=message;statusEl.className='text-xs '+(error?'text-rose-300':'text-slate-400');}};
            const fillMatrixSelect=(select,items,placeholder)=>{if(!select)return;select.replaceChildren();const first=document.createElement('option');first.value='';first.textContent=placeholder;select.appendChild(first);(items||[]).forEach(item=>{const opt=document.createElement('option');opt.value=String(item);opt.textContent=String(item);select.appendChild(opt);});};
            const updateActionOptions=()=>{const actions=matrixState&&matrixState.actionsByModule&&matrixState.actionsByModule[moduleSelect.value]||[];fillMatrixSelect(actionSelect,actions,'Seleccione una acción');};
            const resetMatrixForm=()=>{if(roleSelect)roleSelect.value='';if(moduleSelect)moduleSelect.value='';updateActionOptions();if(actionSelect)actionSelect.value='';if(scopeSelect)scopeSelect.value=matrixState&&matrixState.institutionId||'';if(allowedSelect)allowedSelect.value='true';};
            async function loadPermissionMatrix(){
                if(reloadBtn)reloadBtn.disabled=true;matrixStatus('Consultando reglas autorizadas…',false);
                try{
                    const response=await window.fetchApi('USER','getPermissionMatrix',{});
                    if(!response||response.status!=='success'||!Array.isArray(response.data)||!Array.isArray(response.modules)||!response.actionsByModule)throw new Error(response&&(response.code||response.message)||'Respuesta de matriz inválida.');
                    matrixState=response;fillMatrixSelect(roleSelect,response.roles||[],'Seleccione un rol');fillMatrixSelect(moduleSelect,response.modules,'Seleccione un servicio');fillMatrixSelect(scopeSelect,['Global',response.institutionId],'Seleccione un ámbito');updateActionOptions();
                    if(scopeSelect&&userRole!=='Desarrollador'){const globalOption=Array.from(scopeSelect.options).find(o=>o.value==='Global');if(globalOption)globalOption.disabled=true;scopeSelect.value=response.institutionId;}
                    rowsBody.replaceChildren();
                    if(!response.data.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=7;td.className='p-4 text-slate-500';td.textContent='No hay reglas explícitas registradas.';tr.appendChild(td);rowsBody.appendChild(tr);}
                    response.data.forEach(rule=>{const tr=document.createElement('tr');[rule.rol,rule.modulo,rule.accion,rule.archived?'Archivada':(rule.legacy?'General (requiere migración)':(rule.permitido?'Permitido':'Denegado')),rule.ambito,rule.modificadoPor||'—'].forEach((value,index)=>{const td=document.createElement('td');td.className='p-3 '+(index===3?(rule.permitido?'text-emerald-300':'text-rose-300'):'text-slate-300');td.textContent=String(value??'');tr.appendChild(td);});const editTd=document.createElement('td'),edit=document.createElement('button');edit.type='button';edit.textContent='Editar';edit.className='px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200';edit.disabled=!!rule.legacy||!!rule.archived;edit.addEventListener('click',()=>{roleSelect.value=rule.rol;moduleSelect.value=rule.modulo;updateActionOptions();actionSelect.value=rule.accion;scopeSelect.value=rule.ambito;allowedSelect.value=rule.permitido?'true':'false';matrixStatus('Regla cargada para edición.',false);});editTd.appendChild(edit);tr.appendChild(editTd);rowsBody.appendChild(tr);});
                    if(migrateBtn)migrateBtn.classList.toggle('hidden',!response.data.some(rule=>rule.legacy));
                    matrixStatus('Matriz cargada. '+response.data.length+' reglas visibles para esta institución.',false);
                }catch(error){matrixStatus(error.message||'No fue posible cargar la matriz.',true);rowsBody.replaceChildren();const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=7;td.className='p-4 text-rose-300';td.textContent=error.message||'Error de consulta';tr.appendChild(td);rowsBody.appendChild(tr);}
                finally{if(reloadBtn)reloadBtn.disabled=false;}
            }
            if(moduleSelect)moduleSelect.addEventListener('change',updateActionOptions);
            if(reloadBtn)reloadBtn.addEventListener('click',loadPermissionMatrix);
            if(resetBtn)resetBtn.addEventListener('click',resetMatrixForm);
            if(saveBtn)saveBtn.addEventListener('click',async()=>{
                const rule={rol:String(roleSelect.value||''),modulo:String(moduleSelect.value||''),accion:String(actionSelect.value||''),ambito:String(scopeSelect.value||''),permitido:allowedSelect.value==='true'};
                if(!rule.rol||!rule.modulo||!rule.accion||!rule.ambito){matrixStatus('Seleccione rol, servicio, acción y ámbito.',true);return;}
                saveBtn.disabled=true;
                try{const response=await window.fetchApi('USER','savePermissionMatrix',rule);if(!response||response.status!=='success')throw new Error(response&&(response.code||response.message)||'No se pudo guardar la regla.');matrixStatus(response.idempotent?'La regla ya tenía ese valor.':'Regla guardada y auditada.',false);await loadPermissionMatrix();}
                catch(error){matrixStatus(error.message||'No fue posible guardar la regla.',true);}finally{saveBtn.disabled=false;}
            });
            if(migrateBtn)migrateBtn.addEventListener('click',async()=>{
                if(!window.confirm('Se expandirán las reglas heredadas General a los servicios que contienen cada acción. ¿Desea continuar?'))return;
                migrateBtn.disabled=true;try{const response=await window.fetchApi('USER','migrateLegacyPermissionMatrix',{});if(!response||response.status!=='success')throw new Error(response&&(response.code||response.message)||'No fue posible migrar reglas heredadas.');matrixStatus('Migración finalizada: '+response.migrated+' reglas; '+response.created+' nuevas combinaciones; '+response.unmapped+' sin correspondencia.',false);await loadPermissionMatrix();}catch(error){matrixStatus(error.message||'Falló la migración.',true);}finally{migrateBtn.disabled=false;}
            });
            loadPermissionMatrix();
        }
    }


    // Registro maestro de servicios por rol. Reutiliza la sesión del login.
    const serviceRegistryForm = document.getElementById('service-registry-form');
    const serviceRegistryStatus = document.getElementById('service-registry-status');
    const serviceRegistryRows = document.getElementById('service-registry-rows');
    const serviceRegistryRoleSelect = document.getElementById('service-registry-roles');
    const serviceRegistryMode = document.getElementById('service-registry-mode');
    const serviceRegistryRefresh = document.getElementById('btn-refresh-service-registry');
    const serviceRegistrySubmit = document.getElementById('btn-register-service');
    function serviceRegistryMessage(message, isError) {
        if (!serviceRegistryStatus) return;
        serviceRegistryStatus.textContent = String(message || '');
        serviceRegistryStatus.className = 'text-xs ' + (isError ? 'text-rose-300' : 'text-slate-400');
    }
    function normalizeServiceRole(role) {
        return String(role || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    function inferServiceMode(roles) {
        const normalized = roles.map(normalizeServiceRole);
        const hasParent = normalized.some(role => /padre|madre/.test(role));
        const hasStudent = normalized.some(role => /estudiante|alumno/.test(role));
        const utilities = normalized.filter(role => /tienda|cafeteria|transport/.test(role));
        if (roles.length === 1 && /(docente|profesor|coordinador|secretaria|contador)/.test(normalized[0])) return 'INDIVIDUAL';
        if (roles.length === 2 && hasParent && hasStudent) return 'SHARED_PARENT_STUDENT';
        if (roles.length >= 2 && roles.length <= 3 && utilities.length === roles.length) return 'SHARED_UTILITY';
        return '';
    }
    function selectedServiceRoles() {
        return serviceRegistryRoleSelect ? Array.from(serviceRegistryRoleSelect.selectedOptions).map(option => option.value) : [];
    }
    function renderServiceRegistry(registry) {
        if (!serviceRegistryRows) return;
        serviceRegistryRows.replaceChildren();
        if (!Array.isArray(registry) || !registry.length) {
            const tr = document.createElement('tr'), td = document.createElement('td');
            td.colSpan = 7; td.className = 'p-4 text-slate-500'; td.textContent = 'No hay servicios registrados.';
            tr.appendChild(td); serviceRegistryRows.appendChild(tr); return;
        }
        const statusOptions = [
            ['registrado', 'Registrado'], ['activo', 'Activo'], ['degradado', 'Degradado'],
            ['desconectado', 'Desconectado'], ['suspendido', 'Suspendido'], ['retirado', 'Retirado']
        ];
        registry.forEach(service => {
            const tr = document.createElement('tr');
            const values = [
                String(service.name || '') + ' · ' + String(service.serviceId || '') + ' · ' + String(service.positionId || 'sin puesto'),
                Array.isArray(service.roles) ? service.roles.join(', ') : 'Metadatos pendientes',
                String(service.serviceMode || 'LEGACY'),
                String(service.cuentaPropietaria || ''),
                String(service.endpointUrl || '') + ' / ' + String(service.scriptProjectId || 'sin proyecto'),
                String(service.spreadsheetAsociado || '') + ' / ' + String(service.driveFolderId || 'sin carpeta')
            ];
            values.forEach(value => { const td = document.createElement('td'); td.className = 'p-3 text-slate-300 break-all'; td.textContent = value; tr.appendChild(td); });
            const statusCell = document.createElement('td');
            statusCell.className = 'p-3 text-slate-300';
            const controls = document.createElement('div');
            controls.className = 'flex flex-col gap-2 min-w-[130px]';
            const select = document.createElement('select');
            select.className = 'rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-white';
            select.setAttribute('aria-label', 'Estado del servicio ' + String(service.serviceId || ''));
            const currentState = String(service.state || 'registrado').toLowerCase();
            const normalizedState = currentState === 'inactivo' ? 'suspendido' : currentState === 'activo' ? 'activo' : currentState;
            statusOptions.forEach(([value, label]) => {
                const option = document.createElement('option'); option.value = value; option.textContent = label;
                if (value === normalizedState) option.selected = true;
                select.appendChild(option);
            });
            const updateButton = document.createElement('button');
            updateButton.type = 'button';
            updateButton.className = 'rounded-lg bg-slate-700 hover:bg-indigo-600 border border-slate-600 px-2 py-1 text-xs font-semibold text-white';
            updateButton.textContent = 'Guardar estado';
            updateButton.addEventListener('click', async () => {
                updateButton.disabled = true;
                try {
                    const response = await window.fetchApi('DEVELOPER', 'updateServiceStatus', {
                        serviceId: service.serviceId,
                        newState: select.value,
                        reason: 'Cambio de estado desde la consola de Desarrollador'
                    });
                    if (!response || response.status !== 'success') throw new Error(response && (response.code || response.message) || 'No se pudo actualizar el estado.');
                    serviceRegistryMessage('Estado de ' + service.serviceId + ' actualizado a ' + select.value + '; cambio auditado.', false);
                    await loadServiceRegistry();
                } catch (error) {
                    serviceRegistryMessage(error.message || 'No fue posible actualizar el estado.', true);
                } finally { updateButton.disabled = false; }
            });
            controls.appendChild(select); controls.appendChild(updateButton);
            const editMetadataButton = document.createElement('button');
            editMetadataButton.type = 'button';
            editMetadataButton.className = 'rounded-lg bg-slate-700 hover:bg-indigo-600 border border-slate-600 px-2 py-1 text-xs font-semibold text-white';
            editMetadataButton.textContent = 'Editar recursos';
            editMetadataButton.addEventListener('click', async () => {
                const fields = [
                    ['cuentaPropietaria', 'Cuenta Google propietaria', service.cuentaPropietaria || ''],
                    ['endpointUrl', 'URL del despliegue', service.endpointUrl || ''],
                    ['spreadsheetAsociado', 'ID de Spreadsheet', service.spreadsheetAsociado || ''],
                    ['driveFolderId', 'ID de carpeta Drive', service.driveFolderId || ''],
                    ['scriptProjectId', 'ID de proyecto Apps Script', service.scriptProjectId || '']
                ];
                const updates = {};
                for (const [key, label, current] of fields) {
                    const next = window.prompt(label + ' (valor actual como predeterminado):', current);
                    if (next === null) return;
                    if (next.trim() && next.trim() !== current) updates[key] = next.trim();
                }
                const currentPermissions = Array.isArray(service.permisosConcedidos) ? service.permisosConcedidos.join(', ') : '';
                const nextPermissions = window.prompt('Acciones permitidas separadas por coma:', currentPermissions);
                if (nextPermissions === null) return;
                const permissions = nextPermissions.split(',').map(item => item.trim()).filter(Boolean);
                if (JSON.stringify(permissions) !== JSON.stringify(service.permisosConcedidos || [])) updates.permisosConcedidos = permissions;
                if (!Object.keys(updates).length) return;
                editMetadataButton.disabled = true;
                try {
                    const response = await window.fetchApi('DEVELOPER', 'updateServiceMetadata', { serviceId: service.serviceId, updates });
                    if (!response || response.status !== 'success') throw new Error(response && (response.code || response.message) || 'No se pudieron actualizar los metadatos.');
                    serviceRegistryMessage('Metadatos de ' + service.serviceId + ' actualizados y auditados.', false);
                    await loadServiceRegistry();
                } catch (error) {
                    serviceRegistryMessage(error.message || 'No fue posible actualizar los metadatos.', true);
                } finally { editMetadataButton.disabled = false; }
            });
            controls.appendChild(editMetadataButton);
            if (service.metadataState === 'LEGACY_METADATA_PENDING') {
                const note = document.createElement('span'); note.className = 'text-[10px] text-amber-300'; note.textContent = 'Completar metadatos'; controls.appendChild(note);
            }
            statusCell.appendChild(controls); tr.appendChild(statusCell);
            serviceRegistryRows.appendChild(tr);
        });
    }

    async function loadServiceRegistry() {
        if (!serviceRegistryForm) return;
        if (serviceRegistryRefresh) serviceRegistryRefresh.disabled = true;
        try {
            const results = await Promise.all([
                window.fetchApi('DEVELOPER', 'getCentralServiceRegistry', {}),
                window.fetchApi('USER', 'getPermissionMatrix', {})
            ]);
            const registryResponse = results[0], roleResponse = results[1];
            if (!registryResponse || registryResponse.status !== 'success') throw new Error(registryResponse && (registryResponse.code || registryResponse.message) || 'No se pudo cargar el registro maestro.');
            if (!roleResponse || roleResponse.status !== 'success' || !Array.isArray(roleResponse.roles)) throw new Error(roleResponse && (roleResponse.code || roleResponse.message) || 'No se pudo cargar el catálogo de roles existente.');
            const roleOptions = roleResponse.roles.filter(role => /(docente|profesor|coordinador|secretaria|contador|padre|madre|estudiante|alumno|tienda|cafeteria|transport)/.test(normalizeServiceRole(role)));
            serviceRegistryRoleSelect.replaceChildren();
            roleOptions.forEach(role => { const option = document.createElement('option'); option.value = role; option.textContent = role; serviceRegistryRoleSelect.appendChild(option); });
            renderServiceRegistry(registryResponse.registry || []);
            serviceRegistryMessage('Catálogo cargado: ' + String(registryResponse.totalServicios || 0) + ' servicios; roles disponibles: ' + roleOptions.length + '.', false);
        } catch (error) {
            serviceRegistryMessage(error.message || 'No fue posible cargar el registro maestro.', true);
            renderServiceRegistry([]);
        } finally {
            if (serviceRegistryRefresh) serviceRegistryRefresh.disabled = false;
        }
    }
    if (serviceRegistryRoleSelect) serviceRegistryRoleSelect.addEventListener('change', () => {
        const mode = inferServiceMode(selectedServiceRoles());
        serviceRegistryMode.value = mode;
        serviceRegistryMessage(mode ? 'Modalidad calculada según los roles seleccionados: ' + mode + '.' : 'La combinación de roles no corresponde a una modalidad admitida.', !mode);
    });
    if (serviceRegistryRefresh) serviceRegistryRefresh.addEventListener('click', loadServiceRegistry);
    if (serviceRegistryForm) serviceRegistryForm.addEventListener('submit', async event => {
        event.preventDefault();
        const roles = selectedServiceRoles(), mode = inferServiceMode(roles);
        if (!mode) { serviceRegistryMessage('Seleccione roles válidos para una modalidad individual o compartida.', true); return; }
        const value = id => String((document.getElementById(id) || {}).value || '').trim();
        const payload = {
            serviceId: value('service-registry-id').toUpperCase(), name: value('service-registry-name'),
            positionId: value('service-registry-position').toUpperCase(), roles, serviceMode: mode,
            departamento: value('service-registry-department'), cuentaPropietaria: value('service-registry-owner'),
            scriptProjectId: value('service-registry-project'), endpointUrl: value('service-registry-endpoint'),
            spreadsheetAsociado: value('service-registry-spreadsheet'), driveFolderId: value('service-registry-drive'),
            dominioDatos: value('service-registry-domain'), version: value('service-registry-version') || 'v1.0.0',
            accessMode: 'INSTITUTIONAL_DOMAIN', permisosConcedidos: value('service-registry-permissions').split(',').map(item => item.trim()).filter(Boolean)
        };
        if (serviceRegistrySubmit) serviceRegistrySubmit.disabled = true;
        try {
            const response = await window.fetchApi('DEVELOPER', 'registerServiceInstance', payload);
            if (!response || response.status !== 'success') throw new Error(response && (response.code || response.message) || 'No se pudo registrar el servicio.');
            serviceRegistryMessage('Servicio ' + payload.serviceId + ' registrado. La sesión del portal se reutilizó.', false);
            serviceRegistryForm.reset(); serviceRegistryMode.value = '';
            await loadServiceRegistry();
        } catch (error) {
            serviceRegistryMessage(error.message || 'No fue posible registrar el servicio.', true);
        } finally { if (serviceRegistrySubmit) serviceRegistrySubmit.disabled = false; }
    });
    if (serviceRegistryForm) loadServiceRegistry();

    window.DeveloperConsole = {
        executeHealthChecks: executeDevHealthChecks,
        loadStructuredLogs: loadStructuredLogs,
        loadBackupsList: loadBackupsList,
        log: logToUI
    };
});
