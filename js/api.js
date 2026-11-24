/**
 * [REQ-DOC-012] Helper unificado para realizar llamadas a los microservicios.
 * Utiliza la constante SERVICE_URLS definida en js/config.js.
 * Maneja correctamente los headers y la respuesta para evitar errores de CORS
 * con Google Apps Script, propagando contexto de usuario para RBAC del servidor.
 * @param {string} service - El nombre del servicio (ej. 'USER', 'TASK', 'ACADEMIC', 'EXAM').
 * @param {string} action - La acción a ejecutar en el servicio.
 * @param {object} payload - Los datos para la acción.
 * @returns {Promise<object>} La respuesta del servicio parseada como JSON.
 */
var API_RESPONSE_VERSION = "1.0.0";

function createApiClientCorrelationId() {
  return "REQ-" + Date.now() + "-" + Math.floor(Math.random() * 1000000000);
}

function apiClientPublicMessage(code) {
  var messages = {
    AUTH_PERMISSION_DENIED: "No tiene permisos para realizar esta acción.",
    UNAUTHORIZED_ACCESS_ATTEMPT: "No tiene permisos para realizar esta acción.",
    ROLE_NOT_ALLOWED: "No tiene permisos para realizar esta acción.",
    VERIFIED_IDENTITY_REQUIRED: "Debe iniciar sesión para continuar.",
    RESOURCE_NOT_FOUND: "El recurso solicitado no está disponible.",
    INVALID_PAYLOAD: "Los datos enviados no son válidos.",
    VALIDATION_ERROR: "Los datos enviados no son válidos.",
    SERVICE_URL_MISSING: "La configuración del servicio no está disponible.",
    API_VERSION_REQUIRED: "El servicio respondió con una versión de contrato no compatible.",
    API_VERSION_MISMATCH: "El servicio respondió con una versión de contrato no compatible.",
    INVALID_API_ENVELOPE: "El servicio devolvió una respuesta incompatible.",
    INVALID_JSON_RESPONSE: "El servicio devolvió una respuesta inválida.",
    HTML_RESPONSE: "El servicio devolvió una página web en lugar de datos.",
    HTTP_ERROR: "No fue posible completar la solicitud.",
    DEPENDENCY_UNAVAILABLE: "El servicio no está disponible temporalmente.",
    NETWORK_ERROR: "No fue posible conectar con el servicio.",
    REQUEST_TIMEOUT: "El servicio tardó demasiado en responder.",
    INTERNAL_ERROR: "No fue posible completar la solicitud."
  };
  return messages[String(code || "INTERNAL_ERROR")] || "No fue posible completar la solicitud.";
}

function createApiClientError(code, message, isFallback, correlationId, extraMeta) {
  var now = new Date().toISOString();
  var requestId = correlationId || createApiClientCorrelationId();
  var safeCode = String(code || "INTERNAL_ERROR");
  var safeMessage = message || apiClientPublicMessage(safeCode);
  var meta = Object.assign({ timestamp: now, correlationId: requestId }, extraMeta || {});
  return {
    apiVersion: API_RESPONSE_VERSION,
    status: "error",
    error: { code: safeCode, message: safeMessage, details: null },
    code: safeCode,
    message: safeMessage,
    isFallback: !!isFallback,
    meta: meta,
    timestamp: now,
    correlationId: requestId
  };
}

function normalizeApiClientResponse(parsed, service, action, correlationId) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return createApiClientError("INVALID_API_ENVELOPE", null, true, correlationId);
  }
  var serviceName = String(service || "").toUpperCase();
  var requiresVersion = serviceName === "ACADEMIC" || serviceName === "ACCOUNTING";
  var versioned = parsed.apiVersion === API_RESPONSE_VERSION;
  if (parsed.apiVersion && !versioned) {
    return createApiClientError("API_VERSION_MISMATCH", null, true, correlationId);
  }
  if (requiresVersion && !versioned) {
    return createApiClientError("API_VERSION_REQUIRED", null, true, correlationId);
  }
  if (parsed.status !== "success" && parsed.status !== "error") {
    return createApiClientError("INVALID_API_ENVELOPE", null, true, correlationId);
  }

  if (versioned) {
    var meta = parsed.meta;
    if (!meta || typeof meta !== "object" || !meta.timestamp || !meta.correlationId) {
      return createApiClientError("INVALID_API_ENVELOPE", null, true, correlationId);
    }
    if (parsed.status === "success" && !Object.prototype.hasOwnProperty.call(parsed, "data")) {
      return createApiClientError("INVALID_API_ENVELOPE", null, true, correlationId);
    }
    if (parsed.status === "error") {
      if (!parsed.error || typeof parsed.error !== "object" || !parsed.error.code || !parsed.error.message) {
        return createApiClientError("INVALID_API_ENVELOPE", null, true, correlationId);
      }
      return Object.assign({}, parsed, {
        code: parsed.error.code,
        message: parsed.error.message,
        isFallback: false
      });
    }
    return Object.assign({}, parsed, { isFallback: false });
  }

  if (parsed.status === "success") {
    var legacyData = parsed.data;
    if (legacyData === undefined) {
      legacyData = {};
      var reserved = ["status", "apiVersion", "meta", "timestamp", "correlationId", "code", "message", "error", "isFallback"];
      Object.keys(parsed).forEach(function(key) {
        if (reserved.indexOf(key) === -1) legacyData[key] = parsed[key];
      });
      if (Object.keys(legacyData).length === 0) {
        return createApiClientError("INVALID_API_ENVELOPE", null, true, correlationId);
      }
    }
    var legacyMeta = {
      timestamp: parsed.timestamp || new Date().toISOString(),
      correlationId: parsed.correlationId || correlationId || createApiClientCorrelationId(),
      legacyAdapter: true
    };
    return Object.assign({}, parsed, {
      apiVersion: API_RESPONSE_VERSION,
      data: legacyData,
      meta: legacyMeta,
      correlationId: legacyMeta.correlationId,
      isFallback: false,
      legacyAdapter: true
    });
  }

  var legacyCode = parsed.code || "INTERNAL_ERROR";
  return createApiClientError(legacyCode, apiClientPublicMessage(legacyCode), false, correlationId, { legacyAdapter: true });
}

function showApiToast(title, message, kind) {
  if (typeof document === "undefined" || !document.body) return;
  var toast = document.createElement("div");
  toast.className = kind === "auth"
    ? "fixed top-6 left-1/2 -translate-x-1/2 bg-red-800 text-white px-6 py-3 rounded-2xl shadow-2xl z-[10000] flex items-center gap-3 border border-red-500"
    : "fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-[9999] flex items-center gap-4 border border-red-400/30";
  var heading = document.createElement("p");
  heading.className = "text-[10px] font-black uppercase tracking-widest";
  heading.textContent = String(title || "Aviso");
  var detail = document.createElement("p");
  detail.className = "text-xs font-medium";
  detail.textContent = String(message || "No fue posible completar la solicitud.");
  var close = document.createElement("button");
  close.type = "button";
  close.className = "bg-white text-red-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase";
  close.textContent = "Cerrar";
  close.addEventListener("click", function() {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  });
  toast.appendChild(heading);
  toast.appendChild(detail);
  toast.appendChild(close);
  document.body.appendChild(toast);
  setTimeout(function() {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 8000);
}

function fetchApi(service, action, payload, retryCount, options) {
  // La primera petición autenticada espera la configuración regional validada del servicio USER.
  if (action !== "resolveHierarchicalConfiguration" && window.IMARegionalFormatters &&
      typeof window.loadRegionalFormattingSettings === "function" && !window.__regionalSettingsLoaded) {
    var storedUser = null;
    try {
      var rawRegionalUser = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
      if (rawRegionalUser) storedUser = JSON.parse(rawRegionalUser);
    } catch (_) {}
    if (storedUser && storedUser.sessionToken) {
      return window.loadRegionalFormattingSettings().then(function() {
        return fetchApi(service, action, payload, retryCount, options);
      });
    }
  }
  var MAX_RETRIES = 2;
  retryCount = retryCount || 0;
  options = options || {};
  if (options.serviceId && !options.resolvedEndpointUrl && service !== "DEVELOPER") {
    var requestedServiceId = String(options.serviceId).trim();
    return fetchApi("DEVELOPER", "resolveServiceEndpoint", { serviceId: requestedServiceId, action: action }, 0, { silentAuthError: true })
      .then(function(resolution) {
        if (!resolution || resolution.status !== "success" || !resolution.endpointUrl) return createApiClientError(resolution && resolution.code || "SERVICE_NOT_AVAILABLE", null, false, createApiClientCorrelationId());
        return fetchApi(service, action, payload, 0, Object.assign({}, options, { resolvedEndpointUrl: resolution.endpointUrl }));
      });
  }
  var correlationId = createApiClientCorrelationId();
  var urls = window.SERVICE_URLS || (typeof SERVICE_URLS !== "undefined" ? SERVICE_URLS : {});
  var selectedUrl = options.resolvedEndpointUrl || urls[service];
  if (!selectedUrl) {
    console.error('URL para el servicio "' + service + '" no encontrada.');
    return Promise.resolve(createApiClientError("SERVICE_URL_MISSING", null, true, correlationId));
  }
  var url = selectedUrl;

  // Se conserva el timeout existente; su configuración y ciclo de vida pertenecen a AUD-NG-007.
  var controller = null;
  var signal = null;
  if (typeof AbortController !== "undefined") {
    controller = new AbortController();
    signal = controller.signal;
  }
  var timeoutId = null;
  if (controller) {
    timeoutId = setTimeout(function() { controller.abort(); }, 60000);
  }

  var currentUser = null;
  try {
    var rawUser = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
    if (rawUser) currentUser = JSON.parse(rawUser);
  } catch (_) {}

  var enrichedPayload = payload && typeof payload === "object" && !Array.isArray(payload)
    ? Object.assign({}, payload)
    : {};
  var authBootstrapActions = ["loginUser", "registerUser", "requestPasswordRecovery", "resetPassword"];
  if (authBootstrapActions.indexOf(action) === -1) {
    if (currentUser && currentUser.sessionToken) {
      enrichedPayload.sessionToken = currentUser.sessionToken;
      delete enrichedPayload.authToken;
      delete enrichedPayload.token;
      if (currentUser.userId) enrichedPayload.requesterUserId = currentUser.userId;
      else delete enrichedPayload.requesterUserId;
      if (currentUser.rol) enrichedPayload.requesterRole = currentUser.rol;
      else delete enrichedPayload.requesterRole;
    } else {
      delete enrichedPayload.sessionToken;
      delete enrichedPayload.authToken;
      delete enrichedPayload.token;
      delete enrichedPayload.requesterUserId;
      delete enrichedPayload.requesterRole;
    }
  }

  var fetchOptions = {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: action, payload: enrichedPayload, correlationId: correlationId })
  };
  if (signal) fetchOptions.signal = signal;
  if (options.priority) fetchOptions.priority = options.priority;

  if (options.store && options.onUpdate && window.PersistenceManager) {
    window.PersistenceManager.get(options.store, options.key).then(function(cached) {
      if (cached && (cached.data || cached.allHistory || Array.isArray(cached))) {
        var cleanCached = cached;
        if (cached.data !== undefined && !cached.allHistory) cleanCached = cached.data;
        if (action.indexOf("get") === 0 && cleanCached === undefined) cleanCached = [];
        options.onUpdate(cleanCached);
      }
    }).catch(function(error) {
      console.warn("[API-CACHE] Error en lectura previa:", error);
    });
  }

  return fetch(url, fetchOptions).then(function(response) {
    if (timeoutId) clearTimeout(timeoutId);
    var contentType = response.headers && response.headers.get ? response.headers.get("content-type") || "" : "";
    return response.text().then(function(responseText) {
      if (contentType.toLowerCase().indexOf("text/html") !== -1) {
        var htmlError = createApiClientError("HTML_RESPONSE", null, true, correlationId, { httpStatus: response.status });
        showApiToast("Respuesta inválida", "El servicio " + service + " devolvió HTML en lugar de datos.", "network");
        return htmlError;
      }
      var parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (_) {
        var jsonError = createApiClientError("INVALID_JSON_RESPONSE", null, true, correlationId, { httpStatus: response.status });
        showApiToast("Respuesta inválida", "El servicio " + service + " devolvió JSON inválido.", "network");
        return jsonError;
      }
      var normalized = normalizeApiClientResponse(parsed, service, action, correlationId);
      if (!response.ok) {
        if (normalized.status === "error") {
          normalized.meta.httpStatus = response.status;
          return normalized;
        }
        return createApiClientError(response.status >= 500 ? "DEPENDENCY_UNAVAILABLE" : "HTTP_ERROR", null, true, correlationId, { httpStatus: response.status });
      }
      if (normalized.status === "error") {
        if (normalized.code === "AUTH_PERMISSION_DENIED" && !options.silentAuthError) {
          showApiToast("Acceso denegado", normalized.message, "auth");
        } else if (normalized.isFallback) {
          showApiToast("Respuesta inválida", normalized.message, "network");
        }
        return normalized;
      }
      if (options.store && window.PersistenceManager) {
        window.PersistenceManager.reconcile(options.store, normalized, options.onUpdate, options.key);
      }
      return normalized;
    });
  }).catch(function(error) {
    console.error("Intento " + (retryCount + 1) + " fallido para " + service + "/" + action + ":", error);
    var errorMessage = String(error && error.message || "");
    if (retryCount < MAX_RETRIES &&
        (errorMessage.indexOf("fetch") !== -1 || errorMessage.indexOf("Network") !== -1 || errorMessage.indexOf("Failed") !== -1)) {
      var delay = 1000 * (retryCount + 1);
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve(fetchApi(service, action, payload, retryCount + 1, options));
        }, delay);
      });
    }
    var code = error && (error.name === "AbortError" || error.name === "TimeoutError") ? "REQUEST_TIMEOUT" : "NETWORK_ERROR";
    var failure = createApiClientError(code, null, true, correlationId);
    showApiToast("Error de conexión", "El servicio " + service + " no está disponible. No se devolverán datos vacíos como si fueran válidos.", "network");
    return failure;
  });
}


// [TASK-047] Llamadas a servicios personales mediante resolución central por ServiceID.
window.fetchRegisteredServiceApi = function(serviceId, action, payload, options) {
  var normalizedId = String(serviceId || "").trim();
  if (!normalizedId) return Promise.resolve(createApiClientError("SERVICE_ID_INVALID", null, true));
  return fetchApi("REGISTERED", action, payload || {}, 0, Object.assign({}, options || {}, { serviceId: normalizedId }));
};

/**
 * REQ-EXP-017: Health Check Ping-Pong para Monitoreo de Microservicios
 * Realiza una solicitud real midiendo latencia de ida y vuelta (round-trip).
 * @param {string} service - Nombre del servicio ('USER', 'ACADEMIC', 'TASK', 'EXAM')
 * @returns {Promise<object>} Estado de salud { service, status, latencyMs, state, message }
 */
window.checkMicroserviceHealth = function(service) {
    var startTime = Date.now();
    return fetchApi(service, 'ping', {}, 0, { timeout: 6000 })
        .then(function(res) {
            var latency = Date.now() - startTime;
            var isOnline = res && res.status === 'success' && !res.isFallback;
            var state = 'Fuera de línea';
            if (isOnline) {
                state = latency < 2000 ? 'En línea' : 'Degradado';
            }
            return {
                service: service,
                status: res.status || 'error',
                latencyMs: latency,
                state: state,
                isFallback: !!res.isFallback,
                timestamp: new Date().toISOString(),
                message: res.message || (isOnline ? 'Operativo' : 'Sin respuesta válida')
            };
        })
        .catch(function(err) {
            var latency = Date.now() - startTime;
            return {
                service: service,
                status: 'error',
                latencyMs: latency,
                state: 'Fuera de línea',
                isFallback: true,
                timestamp: new Date().toISOString(),
                message: err.message || 'Error de red'
            };
        });
};

/**
 * Ejecuta health checks simultáneos en todos los microservicios configurados
 * @returns {Promise<Array<object>>}
 */
window.checkAllMicroservicesHealth = function() {
    var services = ['USER', 'ACADEMIC', 'TASK', 'EXAM'];
    var checks = services.map(function(s) {
        return window.checkMicroserviceHealth(s);
    });
    return Promise.all(checks);
};

/**
 * SISTEMA DE LOGS ESTRUCTURADOS CLIENTE (REQ-EXP-018)
 * Registra eventos técnicos estructurados con sanitización de credenciales.
 */
window.logStructuredEvent = function(service, severidad, funcion, codigoError, detalles) {
    var sService = service || 'USER';
    var sSev = severidad || 'INFO';
    var sFunc = funcion || 'client_operation';
    var sCode = codigoError || '';

    // Sanitización local preventiva
    var safeDetails = detalles;
    if (typeof safeDetails === 'object') {
        try {
            var str = JSON.stringify(safeDetails);
            safeDetails = str.replace(/"(?:password|contrasena|pin|token|secret)":\s*"[^"]*"/gi, '"$1":"[REDACTED]"');
        } catch (_) {}
    }

    var payload = {
        severidad: sSev,
        servicio: sService,
        funcion: sFunc,
        codigoError: sCode,
        detalles: safeDetails
    };

    return window.fetchApi(sService, 'recordStructuredLog', payload)
        .catch(function(err) {
            console.warn('[LogStructuredEvent] No se pudo persistir log:', err.message);
        });
};

/**
 * GESTIÓN DE COPIAS DE SEGURIDAD, RESTAURACIÓN Y MANTENIMIENTO (REQ-EXP-019)
 */
window.createBackup = function(service, tipo) {
    var targetService = (service || 'USER').toUpperCase();
    var payload = {
        servicio: targetService,
        tipo: tipo || 'MANUAL'
    };
    return window.fetchApi(targetService === 'ACADEMIC' ? 'ACADEMIC' : 'USER', 'createSpreadsheetBackup', payload);
};

window.getBackupsList = function(filters) {
    return window.fetchApi('USER', 'getBackupsList', filters || {});
};

window.restoreBackup = function(backupId, confirmationToken) {
    return window.fetchApi('USER', 'restoreSpreadsheetBackup', {
        backupId: backupId,
        confirmationToken: confirmationToken
    });
};

window.runMaintenance = function(options) {
    return window.fetchApi('USER', 'runSystemMaintenance', options || {});
};

/**
 * GESTIÓN DE GUÍAS DE ESTUDIO FORMATIVAS (REQ-DOC-001)
 */
window.saveStudyGuide = function(guideData) {
    return window.fetchApi('ACADEMIC', 'createOrUpdateStudyGuide', guideData || {});
};

window.getStudyGuides = function(filters) {
    return window.fetchApi('ACADEMIC', 'getStudyGuides', filters || {});
};

window.toggleStudyGuideStatus = function(guideId, status) {
    return window.fetchApi('ACADEMIC', 'toggleStudyGuideStatus', {
        id_guia: guideId,
        status: status
    });
};

/**
 * EXPORTACIÓN DOCUMENTAL COMPRIMIDA POR AÑO LECTIVO (REQ-DOC-010)
 */
window.exportSchoolYearArchive = function(anio, options) {
    options = options || {};
    return window.fetchApi('ACADEMIC', 'exportSchoolYearArchive', {
        anio: anio,
        parcial: options.parcial,
        tipoRecurso: options.tipoRecurso
    });
};

/**
 * ASISTENCIA ESTUDIANTIL Y RENDIMIENTO INTEGRAL (REQ-DOC-011)
 */
window.recordStudentAttendance = function(payload) {
    return window.fetchApi('ACADEMIC', 'recordStudentAttendance', payload || {});
};

window.getStudentAttendanceSummary = function(payload) {
    return window.fetchApi('ACADEMIC', 'getStudentAttendanceSummary', payload || {});
};

/**
 * TASK-068: wrappers de correspondencia de identidades.
 * Las validaciones de sesión, rol e institución se ejecutan en el backend.
 */
window.findPersonMatches = function(payload) { return window.fetchApi('USER', 'findPersonMatches', payload || {}); };
window.linkPersonAccount = function(payload) { return window.fetchApi('USER', 'linkPersonAccount', payload || {}); };
window.registerLegacyIdentifierMapping = function(payload) {
    return window.fetchApi('USER', 'registerLegacyIdentifierMapping', payload || {});
};
window.resolveInternalIdFromLegacy = function(payload) {
    return window.fetchApi('USER', 'resolveInternalIdFromLegacy', payload || {});
};
window.resolveLegacyIdFromInternal = function(payload) {
    return window.fetchApi('USER', 'resolveLegacyIdFromInternal', payload || {});
};
window.resolveUserByLegacyId = function(payload) {
    return window.fetchApi('USER', 'resolveUserByLegacyId', payload || {});
};
window.reviewLegacyIdentifierMapping = function(payload) {
    return window.fetchApi('USER', 'reviewLegacyIdentifierMapping', payload || {});
};
window.getIdentityDecisionHistory = function(payload) {
    return window.fetchApi('USER', 'getIdentityDecisionHistory', payload || {});
};



/**
 * Carga REGIONAL_SETTINGS mediante el resolver USER. La respuesta se valida
 * de nuevo en IMARegionalFormatters; si no existe configuración, se conservan
 * los defaults sin bloquear el inicio de sesión ni las peticiones normales.
 */
window.loadRegionalFormattingSettings = function() {
  if (window.__regionalSettingsLoaded) {
    return Promise.resolve({ status: "cached", settings: window.IMARegionalFormatters.getSettings() });
  }
  if (window.__regionalSettingsPromise) return window.__regionalSettingsPromise;
  if (!window.IMARegionalFormatters) return Promise.resolve({ status: "unavailable" });

  var currentUser = null;
  try {
    var rawUser = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
    if (rawUser) currentUser = JSON.parse(rawUser);
  } catch (_) {}
  if (!currentUser || !currentUser.sessionToken) {
    return Promise.resolve({ status: "unauthenticated", settings: window.IMARegionalFormatters.getSettings() });
  }

  window.__regionalSettingsPromise = Promise.resolve()
    .then(function() {
      return fetchApi("USER", "resolveHierarchicalConfiguration", { clave: "REGIONAL_SETTINGS" }, 0, { silentAuthError: true });
    })
    .then(function(response) {
      var data = response && response.data && typeof response.data === "object" ? response.data : response;
      if (data && data.status === "success" && data.valor && typeof data.valor === "object") {
        var applied = window.IMARegionalFormatters.setSettings(data.valor);
        window.__regionalSettingsLoaded = true;
        return { status: "success", settings: applied, source: data.origenEfectivo || "GLOBAL", version: data.version || null };
      }
      window.__regionalSettingsLoaded = true;
      return { status: "fallback", code: data && data.code || "REGIONAL_SETTINGS_UNAVAILABLE", settings: window.IMARegionalFormatters.getSettings() };
    })
    .catch(function(error) {
      window.__regionalSettingsLoaded = true;
      return { status: "fallback", error: error && error.message || "REGIONAL_SETTINGS_UNAVAILABLE", settings: window.IMARegionalFormatters.getSettings() };
    });
  return window.__regionalSettingsPromise;
};
