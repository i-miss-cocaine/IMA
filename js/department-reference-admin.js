(function(global) {
    "use strict";

    var POLICY_STRICT = "BLOQUEO_TOTAL_CROSS_DEPARTAMENTO";
    var POLICY_READ_ONLY = "PERMITIR_REFERENCIA_SOLO_LECTURA_INTERDEPARTAMENTAL";
    var loadSequence = 0;

    function parseCsvList(value, label) {
        var raw = String(value || "").trim();
        if (!raw) throw new Error((label || "La lista") + " es obligatoria.");
        var items = raw.split(",").map(function(item) { return item.trim(); });
        var seen = Object.create(null);
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item || item.indexOf("*") !== -1) throw new Error((label || "La lista") + " contiene un valor vacío o comodín.");
            if (seen[item]) throw new Error((label || "La lista") + " contiene valores duplicados.");
            seen[item] = true;
        }
        return items;
    }

    function buildGrantPayload(values) {
        values = values || {};
        var resourceType = String(values.resourceType || "").trim().toUpperCase();
        var resourceId = String(values.resourceId || "").trim();
        var targetDepartmentId = String(values.targetDepartmentId || "").trim();
        var allowedFields = parseCsvList(values.allowedFields, "Los campos permitidos");
        var allowedDocumentIds = parseCsvList(values.allowedDocumentIds, "Los documentos permitidos");
        var validFrom = new Date(values.validFrom || "");
        var expiresAt = new Date(values.expiresAt || "");
        if (!/^[A-Z0-9_-]{2,80}$/.test(resourceType)) throw new Error("El tipo de recurso no es válido.");
        if (!resourceId || resourceId.length > 200) throw new Error("El ID del recurso no es válido.");
        if (!targetDepartmentId || targetDepartmentId.length > 200) throw new Error("El departamento destino no es válido.");
        if (isNaN(validFrom.getTime()) || isNaN(expiresAt.getTime()) || validFrom.getTime() >= expiresAt.getTime()) {
            throw new Error("La vigencia debe tener fechas válidas y la expiración debe ser posterior al inicio.");
        }
        return {
            resourceType: resourceType,
            resourceId: resourceId,
            targetDepartmentId: targetDepartmentId,
            allowedFields: allowedFields,
            allowedDocumentIds: allowedDocumentIds,
            validFrom: validFrom.toISOString(),
            expiresAt: expiresAt.toISOString()
        };
    }

    function buildPolicyPayload(value) {
        var policy = String(value || "").trim();
        if (policy !== POLICY_STRICT && policy !== POLICY_READ_ONLY) throw new Error("La política seleccionada no es válida.");
        return { value: policy };
    }

    function byId(id) { return document.getElementById(id); }

    function setStatus(message, kind) {
        var node = byId("department-reference-admin-status");
        if (!node) return;
        node.textContent = message;
        node.className = "p-3 rounded-xl border text-xs " + (kind === "error"
            ? "bg-rose-50 border-rose-200 text-rose-800"
            : kind === "warning" ? "bg-amber-50 border-amber-200 text-amber-900"
            : kind === "info" ? "bg-slate-50 border-slate-200 text-slate-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-800");
    }

    function errorMessage(result) {
        var code = result && result.code ? String(result.code) : "REQUEST_FAILED";
        var messages = {
            AUTH_PERMISSION_DENIED: "Falta el permiso dinámico requerido para esta operación (lectura o administración de política/concesiones).",
            INSTITUTION_WIDE_SCOPE_REQUIRED: "Se requiere un ámbito institucional autorizado.",
            VERIFIED_IDENTITY_REQUIRED: "La sesión no tiene una identidad verificada.",
            DEPARTMENT_REFERENCE_POLICY_LOCK_TIMEOUT: "La configuración está ocupada; vuelve a intentar.",
            DEPARTMENT_REFERENCE_GRANT_LOCK_TIMEOUT: "La administración de concesiones está ocupada; vuelve a intentar.",
            DEPARTMENT_REFERENCE_GRANT_ALREADY_ACTIVE: "Ya existe una concesión activa para ese recurso y departamento.",
            DEPARTMENT_REFERENCE_TARGET_NOT_ACTIVE: "El departamento destino no tiene una asignación activa.",
            RESOURCE_OWNERSHIP_UNVERIFIED: "No se pudo verificar la propiedad del recurso.",
            DEPARTMENT_REFERENCE_GRANT_SCHEMA_MISMATCH: "El esquema de concesiones no coincide con el contrato esperado."
        };
        return (messages[code] || "No se pudo completar la operación.") + " (" + code + ")";
    }

    function api(action, payload) {
        if (typeof global.fetchApi !== "function") return Promise.reject(new Error("El cliente USER no está disponible."));
        return global.fetchApi("USER", action, payload || {});
    }

    function clearNode(node) {
        while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function textNode(parent, tag, value, className) {
        var node = document.createElement(tag);
        node.textContent = String(value === undefined || value === null ? "" : value);
        if (className) node.className = className;
        parent.appendChild(node);
        return node;
    }

    function displayList(value) {
        if (Array.isArray(value)) return value.join(", ");
        if (typeof value === "string") {
            try { var parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.join(", "); } catch (_) {}
            return value;
        }
        return "";
    }

    function formatDate(value) {
        if (!value) return "—";
        var date = new Date(value);
        return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
    }

    function renderGrants(grants) {
        var container = byId("department-reference-grants-list");
        if (!container) return;
        clearNode(container);
        if (!Array.isArray(grants) || grants.length === 0) {
            textNode(container, "p", "No hay concesiones registradas para esta institución.", "text-xs text-slate-400 italic");
            return;
        }
        grants.forEach(function(grant) {
            var card = document.createElement("article");
            card.className = "border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3";
            var details = document.createElement("div");
            details.className = "min-w-0 space-y-1";
            textNode(details, "p", String(grant.resourceType || "") + " · " + String(grant.resourceId || ""), "text-xs font-black text-slate-800 break-all");
            textNode(details, "p", "Propietario: " + String(grant.ownerDepartmentId || "—") + " → Destino: " + String(grant.targetDepartmentId || "—"), "text-[11px] text-slate-600");
            textNode(details, "p", "Campos: " + displayList(grant.allowedFields) + " · Documentos: " + displayList(grant.allowedDocumentIds), "text-[11px] text-slate-600 break-words");
            textNode(details, "p", "Vigencia: " + formatDate(grant.validFrom) + " — " + formatDate(grant.expiresAt) + " · Estado: " + String(grant.status || "—"), "text-[10px] text-slate-500");
            textNode(details, "p", "Autorizó: " + String(grant.authorizedBy || "—") + " · Fecha: " + formatDate(grant.authorizedAt), "text-[10px] text-slate-500");
            card.appendChild(details);
            if (String(grant.status || "").toUpperCase() === "ACTIVE" && grant.grantId) {
                var revoke = document.createElement("button");
                revoke.type = "button";
                revoke.className = "shrink-0 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black uppercase";
                revoke.textContent = "Revocar";
                revoke.addEventListener("click", function() { revokeGrant(String(grant.grantId), revoke); });
                card.appendChild(revoke);
            }
            container.appendChild(card);
        });
    }

    async function load() {
        var sequence = ++loadSequence;
        setStatus("Consultando política y concesiones de la institución…", "info");
        try {
            var results = await Promise.all([
                api("getDepartmentReferencePolicy", {}),
                api("getDepartmentReferenceGrants", {})
            ]);
            if (sequence !== loadSequence) return null;
            var policyResult = results[0], grantsResult = results[1], errors = [];
            if (policyResult && policyResult.status === "success") {
                var select = byId("department-reference-policy");
                if (select) select.value = policyResult.value === POLICY_READ_ONLY ? POLICY_READ_ONLY : POLICY_STRICT;
                var source = byId("department-reference-policy-source");
                if (source) source.textContent = "Institución: " + String(policyResult.institutionId || "—") + " · Origen: " + String(policyResult.source || "—") + " · Actualizada: " + formatDate(policyResult.updatedAt);
            } else errors.push(errorMessage(policyResult));
            if (grantsResult && grantsResult.status === "success") renderGrants(grantsResult.data || []);
            else errors.push(errorMessage(grantsResult));
            setStatus(errors.length ? errors.join(" ") : "Política y concesiones cargadas. El bloqueo total permanece activo salvo configuración institucional explícita.", errors.length ? "error" : "success");
            return errors.length === 0;
        } catch (error) {
            if (sequence !== loadSequence) return null;
            setStatus(error.message || "No se pudo consultar la configuración.", "error");
            return false;
        }
    }

    async function savePolicy() {
        var button = byId("btn-save-department-reference-policy");
        if (button) button.disabled = true;
        try {
            var select = byId("department-reference-policy");
            var result = await api("setDepartmentReferencePolicy", buildPolicyPayload(select && select.value));
            if (!result || result.status !== "success") throw new Error(errorMessage(result));
            var refreshed = await load();
            setStatus(refreshed === false ? "La política se guardó, pero no se pudo actualizar la vista." : (result.unchanged ? "La política seleccionada ya estaba vigente." : "Política institucional actualizada."), refreshed === false ? "warning" : "success");
        } catch (error) { setStatus(error.message, "error"); }
        finally { if (button) button.disabled = false; }
    }

    async function createGrant(event) {
        if (event && event.preventDefault) event.preventDefault();
        var button = byId("btn-create-department-reference-grant");
        if (button) button.disabled = true;
        try {
            var payload = buildGrantPayload({
                resourceType: byId("department-reference-resource-type").value,
                resourceId: byId("department-reference-resource-id").value,
                targetDepartmentId: byId("department-reference-target-department").value,
                allowedFields: byId("department-reference-allowed-fields").value,
                allowedDocumentIds: byId("department-reference-allowed-documents").value,
                validFrom: byId("department-reference-valid-from").value,
                expiresAt: byId("department-reference-expires-at").value
            });
            var result = await api("createDepartmentReferenceGrant", payload);
            if (!result || result.status !== "success") throw new Error(errorMessage(result));
            var form = byId("department-reference-grant-form");
            if (form) form.reset();
            var refreshed = await load();
            var warning = result.auditCompletionRecorded === false || refreshed === false;
            setStatus(result.auditCompletionRecorded === false
                ? "La concesión se guardó, pero no se confirmó el evento de auditoría posterior. Revisa LogsSistema."
                : refreshed === false ? "La concesión se creó, pero no se pudo actualizar la vista." : "Concesión creada y autorización previa registrada.", warning ? "warning" : "success");
        } catch (error) { setStatus(error.message, "error"); }
        finally { if (button) button.disabled = false; }
    }

    async function revokeGrant(grantId, button) {
        if (typeof global.confirm === "function" && !global.confirm("¿Revocar esta concesión? El historial se conservará.")) return;
        if (button) button.disabled = true;
        try {
            var result = await api("revokeDepartmentReferenceGrant", { grantId: grantId });
            if (!result || result.status !== "success") throw new Error(errorMessage(result));
            var refreshed = await load();
            var warning = result.auditCompletionRecorded === false || refreshed === false;
            setStatus(result.auditCompletionRecorded === false
                ? "La concesión fue revocada, pero no se confirmó el evento de auditoría posterior. Revisa LogsSistema."
                : refreshed === false ? "La concesión se revocó, pero no se pudo actualizar la vista." : "Concesión revocada; el historial permanece conservado.", warning ? "warning" : "success");
        } catch (error) { setStatus(error.message, "error"); }
        finally { if (button) button.disabled = false; }
    }

    function bind() {
        var openButton = byId("btn-department-reference-admin");
        var modal = byId("modal-department-reference-admin");
        var closeButton = byId("btn-close-department-reference-admin");
        var policyButton = byId("btn-save-department-reference-policy");
        var grantForm = byId("department-reference-grant-form");
        var refreshButton = byId("btn-refresh-department-reference-grants");
        if (openButton) openButton.addEventListener("click", function() { if (modal) modal.classList.remove("hidden"); load(); });
        if (closeButton) closeButton.addEventListener("click", function() { if (modal) modal.classList.add("hidden"); });
        if (policyButton) policyButton.addEventListener("click", savePolicy);
        if (grantForm) grantForm.addEventListener("submit", createGrant);
        if (refreshButton) refreshButton.addEventListener("click", load);
    }

    global.DepartmentReferenceAdmin = {
        constants: { POLICY_STRICT: POLICY_STRICT, POLICY_READ_ONLY: POLICY_READ_ONLY },
        parseCsvList: parseCsvList,
        buildGrantPayload: buildGrantPayload,
        buildPolicyPayload: buildPolicyPayload,
        load: load,
        renderGrants: renderGrants
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
    else bind();
})(window);
