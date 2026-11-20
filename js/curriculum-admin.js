(function (global) {
    "use strict";
    const doc = global.document;
    const state = { ready:false, areas:[], subjects:[], plans:[], years:[], periods:[], offers:[], relations:[], catalogRevision:null, loadToken:0, relationToken:0, offerRelationToken:0 };

    function isActive(record) {
        if (!record) return false;
        if (Object.prototype.hasOwnProperty.call(record, "isActive")) return record.isActive === true;
        return ["activo", "vigente", "active", "enabled"].includes(String(record.estado || "").trim().toLowerCase());
    }
    function numberOrEmpty(value) {
        return value === "" || value === null || value === undefined ? "" : Number(value);
    }
    function buildSubjectPayload(values) {
        return {
            nombreOficial:String(values.nombreOficial || "").trim(),
            codigo:String(values.codigo || "").trim().toUpperCase(),
            areaId:String(values.areaId || "").trim(),
            programaId:String(values.programaId || "").trim(),
            nivelEducativo:String(values.nivelEducativo || "").trim(),
            grado:String(values.grado || "").trim(),
            idioma:String(values.idioma || "").trim(),
            cargaHorariaRef:numberOrEmpty(values.cargaHorariaRef),
            creditos:numberOrEmpty(values.creditos),
            prerrequisitos:Array.isArray(values.prerrequisitos) ? values.prerrequisitos.map(value => String(value).trim().toUpperCase()) : []
        };
    }
    function buildPlanPayload(values) {
        return {
            nombre:String(values.nombre || "").trim(),
            version:String(values.version || "1.0").trim(),
            grado:String(values.grado || "").trim(),
            vigenciaInicio:String(values.vigenciaInicio || "").trim(),
            vigenciaFin:String(values.vigenciaFin || "").trim(),
            estado:"Vigente"
        };
    }
    function buildRelationPayload(plan, values) {
        if (!plan || !plan.planId || !plan.grado) throw new Error("Seleccione un plan vigente con grado definido.");
        return {
            planId:String(plan.planId),
            asignaturaId:String(values.asignaturaId || "").trim().toUpperCase(),
            grado:String(plan.grado),
            caracter:String(values.caracter || "").trim(),
            horasSemanales:Number(values.horasSemanales),
            orden:values.orden === "" || values.orden === undefined ? 0 : Number(values.orden)
        };
    }
    function buildOfferPayload(year, period, plan, values) {
        if (!year || !period || !plan) throw new Error("Seleccione año, período y plan vigentes.");
        if (String(period.anoId) !== String(year.anoId)) throw new Error("El período no pertenece al año lectivo seleccionado.");
        return {
            anoId:String(year.anoId),
            periodoId:String(period.periodoId),
            planId:String(plan.planId),
            asignaturaId:String(values.asignaturaId || "").trim().toUpperCase(),
            grado:String(plan.grado || ""),
            seccion:String(values.seccion || "").trim(),
            capacidadMax:Number(values.capacidadMax)
        };
    }
    function byId(id) { return doc.getElementById(id); }
    function setStatus(message, isError) {
        const target = byId("curriculum-admin-status");
        if (!target) return;
        target.textContent = String(message || "");
        target.className = isError ? "text-xs font-semibold text-red-600" : "text-xs font-semibold text-slate-600";
    }
    function call(action, payload) {
        const client = global.fetchApi;
        if (typeof client !== "function") return Promise.reject(new Error("El cliente API no está disponible."));
        return Promise.resolve(client("ACADEMIC", action, payload || {})).then(response => {
            if (!response || response.status !== "success") {
                const message = response && (response.message || (response.error && response.error.message));
                throw new Error(message || ("No se pudo completar " + action + "."));
            }
            return response;
        });
    }
    function option(select, value, label) {
        const item = doc.createElement("option");
        item.value = String(value || "");
        item.textContent = String(label || "");
        select.appendChild(item);
    }
    function populate(selectId, items, valueKey, labelFn, placeholder, filterFn) {
        const select = byId(selectId);
        if (!select) return;
        const previous = select.value;
        select.innerHTML = "";
        option(select, "", placeholder);
        (items || []).filter(item => !filterFn || filterFn(item)).forEach(item => option(select, item[valueKey], labelFn(item)));
        if ((items || []).some(item => String(item[valueKey]) === String(previous) && (!filterFn || filterFn(item)))) select.value = previous;
    }
    function appendCell(row, value) {
        const cell = doc.createElement("td");
        cell.className = "p-2 border-b border-slate-100 text-slate-700";
        cell.textContent = value === null || value === undefined ? "" : String(value);
        row.appendChild(cell);
    }
    function clearBody(bodyId, colspan, message) {
        const body = byId(bodyId);
        if (!body) return null;
        body.innerHTML = "";
        const row = doc.createElement("tr"), cell = doc.createElement("td");
        cell.colSpan = colspan;
        cell.className = "p-3 text-center text-slate-400";
        cell.textContent = message;
        row.appendChild(cell);
        body.appendChild(row);
        return body;
    }
    function subjectById(id) {
        return state.subjects.find(subject => String(subject.asignaturaId).toUpperCase() === String(id || "").toUpperCase());
    }
    function planById(id) {
        return state.plans.find(plan => String(plan.planId) === String(id || ""));
    }
    function renderTables() {
        const subjectsBody = byId("curriculum-subjects-body");
        if (subjectsBody) {
            subjectsBody.innerHTML = "";
            if (!state.subjects.length) clearBody("curriculum-subjects-body", 7, "No hay asignaturas en el ámbito autorizado.");
            state.subjects.forEach(subject => {
                const row = doc.createElement("tr");
                appendCell(row, subject.codigo);
                appendCell(row, subject.nombreOficial);
                appendCell(row, [subject.areaAcademica || subject.areaId, subject.departmentId].filter(Boolean).join(" / "));
                appendCell(row, subject.programaId);
                appendCell(row, [subject.grado, subject.idioma].filter(Boolean).join(" / "));
                appendCell(row, [subject.creditos, Array.isArray(subject.prerrequisitos) ? subject.prerrequisitos.length : 0].join(" / "));
                appendCell(row, subject.estado);
                subjectsBody.appendChild(row);
            });
        }
        const plansBody = byId("curriculum-plans-body");
        if (plansBody) {
            plansBody.innerHTML = "";
            if (!state.plans.length) clearBody("curriculum-plans-body", 5, "No hay planes registrados.");
            state.plans.forEach(plan => {
                const row = doc.createElement("tr");
                appendCell(row, plan.nombre);
                appendCell(row, plan.version);
                appendCell(row, plan.grado);
                appendCell(row, plan.vigencia || [plan.vigenciaInicio, plan.vigenciaFin].filter(Boolean).join(" - "));
                appendCell(row, plan.estado);
                plansBody.appendChild(row);
            });
        }
        const offersBody = byId("curriculum-offers-body");
        if (offersBody) {
            offersBody.innerHTML = "";
            if (!state.offers.length) clearBody("curriculum-offers-body", 5, "No hay ofertas académicas registradas.");
            state.offers.forEach(offer => {
                const subject = subjectById(offer.asignaturaId), plan = planById(offer.planId);
                const row = doc.createElement("tr");
                appendCell(row, [offer.anoId, offer.periodoId].filter(Boolean).join(" / "));
                appendCell(row, [offer.grado, offer.seccion].filter(Boolean).join(" / "));
                appendCell(row, subject ? subject.nombreOficial : offer.asignaturaId);
                appendCell(row, plan ? plan.nombre : offer.planId);
                appendCell(row, offer.capacidadMax);
                appendCell(row, offer.estado);
                offersBody.appendChild(row);
            });
        }
    }
    function renderRelations() {
        const body = byId("curriculum-relations-body");
        if (!body) return;
        body.innerHTML = "";
        if (!state.relations.length) { clearBody("curriculum-relations-body", 6, "El plan no tiene relaciones registradas."); return; }
        state.relations.forEach(relation => {
            const subject = subjectById(relation.asignaturaId);
            const row = doc.createElement("tr");
            appendCell(row, subject ? subject.nombreOficial : relation.asignaturaId);
            appendCell(row, relation.caracter);
            appendCell(row, relation.horasSemanales);
            appendCell(row, relation.orden);
            appendCell(row, relation.estado);
            const actionCell = doc.createElement("td");
            actionCell.className = "p-2 border-b border-slate-100";
            const button = doc.createElement("button");
            button.type = "button";
            button.className = "text-[10px] font-bold underline text-indigo-700";
            button.textContent = relation.estado === "Activo" ? "Desactivar" : "Reactivar";
            button.addEventListener("click", () => setRelationStatus(relation, relation.estado === "Activo" ? "Inactivo" : "Activo"));
            actionCell.appendChild(button);
            row.appendChild(actionCell);
            body.appendChild(row);
        });
    }
    function renderFormOptions() {
        populate("curriculum-subject-area", state.areas, "areaId", area => area.name + " (" + area.code + ")", "Seleccione área", isActive);
        populate("curriculum-subject-prerequisites", state.subjects, "asignaturaId", subject => subject.codigo + " — " + subject.nombreOficial, "Sin prerrequisitos", isActive);
        populate("curriculum-relation-plan", state.plans, "planId", plan => plan.nombre + " · " + plan.grado + " · v" + plan.version, "Seleccione plan vigente", plan => String(plan.estado || "Vigente") === "Vigente");
        populate("curriculum-relation-subject", state.subjects, "asignaturaId", subject => subject.codigo + " — " + subject.nombreOficial, "Seleccione asignatura activa", isActive);
        populate("curriculum-offer-year", state.years, "anoId", year => year.nombre || year.anoId, "Seleccione año lectivo", isActive);
        populate("curriculum-offer-plan", state.plans, "planId", plan => plan.nombre + " · " + plan.grado, "Seleccione plan vigente", plan => String(plan.estado || "Vigente") === "Vigente");
        updatePeriods();
        const relationPlan = byId("curriculum-relation-plan");
        const offerPlan = byId("curriculum-offer-plan");
        if (relationPlan && relationPlan.value) loadPlanRelations(relationPlan.value);
        if (offerPlan && offerPlan.value) loadOfferPlanSubjects(offerPlan.value);
    }
    function updatePeriods() {
        const yearSelect = byId("curriculum-offer-year");
        const yearId = yearSelect && yearSelect.value;
        const periods = state.periods.filter(period => isActive(period) && String(period.anoId) === String(yearId));
        populate("curriculum-offer-period", periods, "periodoId", period => period.nombre || period.periodoId, "Seleccione período activo");
    }
    async function loadPlanRelations(planId) {
        const token = ++state.relationToken;
        if (!planId) { state.relations = []; renderRelations(); return; }
        try {
            const response = await call("getStudyPlanSubjects", { planId:planId, includeInactive:true });
            if (token !== state.relationToken) return;
            state.relations = response.data || [];
            renderRelations();
        } catch (error) {
            if (token === state.relationToken) setStatus(error.message, true);
        }
    }
    async function loadOfferPlanSubjects(planId) {
        const token = ++state.offerRelationToken;
        const select = byId("curriculum-offer-subject");
        const grade = byId("curriculum-offer-grade");
        const plan = planById(planId);
        if (grade) grade.textContent = plan ? "Grado del plan: " + plan.grado : "El grado se toma del plan seleccionado.";
        if (!select) return;
        populate("curriculum-offer-subject", [], "asignaturaId", item => item.nombreOficial, "Seleccione asignatura vinculada");
        if (!planId) return;
        try {
            const response = await call("getStudyPlanSubjects", { planId:planId });
            if (token !== state.offerRelationToken) return;
            const linked = (response.data || []).map(relation => subjectById(relation.asignaturaId)).filter(subject => subject && isActive(subject));
            populate("curriculum-offer-subject", linked, "asignaturaId", subject => subject.codigo + " — " + subject.nombreOficial, "Seleccione asignatura vinculada");
        } catch (error) {
            if (token === state.offerRelationToken) setStatus(error.message, true);
        }
    }
    async function loadAll() {
        const token = ++state.loadToken;
        state.ready = false;
        setStatus("Sincronizando catálogo, planes, períodos y ofertas...", false);
        try {
            const results = await Promise.all([
                call("getInstitutionalCatalog", { catalogType:"ALL_INSTITUTIONAL_CATALOGS" }),
                call("getStudyPlans", {}),
                call("getAcademicYears", {}),
                call("getAcademicPeriods", {}),
                call("getAcademicOffers", {})
            ]);
            if (token !== state.loadToken) return false;
            const catalog = results[0];
            if (catalog.schemaVersion !== "1.0.0" || !catalog.data ||
                !Array.isArray(catalog.data.areasCurricularesMetadata) ||
                !Array.isArray(catalog.data.asignaturasMetadata) ||
                !Array.isArray(catalog.data.departamentosAcademicosMetadata) ||
                !Array.isArray(results[1].data) || !Array.isArray(results[2].data) ||
                !Array.isArray(results[3].data) || !Array.isArray(results[4].data)) {
                throw new Error("El servidor devolvió un contrato curricular incompleto.");
            }
            state.areas = catalog.data.areasCurricularesMetadata;
            state.subjects = catalog.data.asignaturasMetadata;
            state.plans = results[1].data;
            state.years = results[2].data;
            state.periods = results[3].data;
            state.offers = results[4].data;
            state.catalogRevision = Number(catalog.catalogRevision);
            state.ready = Number.isSafeInteger(state.catalogRevision);
            if (!state.ready) throw new Error("La revisión del catálogo institucional no es válida.");
            renderFormOptions();
            renderTables();
            setStatus("Catálogo sincronizado · revisión " + state.catalogRevision + " · " + state.subjects.length + " asignaturas · " + state.plans.length + " planes.", false);
            return true;
        } catch (error) {
            if (token === state.loadToken) {
                state.ready = false;
                setStatus(error.message || "No se pudo sincronizar el catálogo curricular.", true);
            }
            return false;
        }
    }
    async function setRelationStatus(relation, status) {
        if (!state.ready) { setStatus("Actualice el catálogo antes de modificar relaciones.", true); return; }
        try {
            await call("setStudyPlanSubjectStatus", { relId:relation.relId, estado:status });
            await loadAll();
            const planSelect = byId("curriculum-relation-plan");
            if (planSelect && planSelect.value) await loadPlanRelations(planSelect.value);
            setStatus("Estado de relación actualizado; el historial se conserva.", false);
        } catch (error) { setStatus(error.message, true); }
    }
    function valuesFromForm(form) {
        const data = {};
        Array.from(new FormData(form).entries()).forEach(([key, value]) => { data[key] = value; });
        return data;
    }
    function bindSubmit(formId, handler) {
        const form = byId(formId);
        if (!form) return;
        form.addEventListener("submit", async event => {
            event.preventDefault();
            if (!state.ready) { setStatus("No hay un catálogo autoritativo disponible; no se guardó ningún cambio.", true); return; }
            const button = form.querySelector('button[type="submit"]');
            if (button && button.disabled) return;
            if (button) button.disabled = true;
            try {
                await handler(form);
            } catch (error) {
                setStatus(error.message || "No se pudo guardar el registro.", true);
            } finally {
                if (button) button.disabled = false;
            }
        });
    }
    function bindForms() {
        bindSubmit("form-curriculum-subject", async form => {
            const values = valuesFromForm(form);
            values.prerrequisitos = Array.from(byId("curriculum-subject-prerequisites").selectedOptions).map(item => item.value);
            await call("createSubjectCatalogItem", buildSubjectPayload(values));
            form.reset();
            const refreshed = await loadAll();
            setStatus(refreshed ? "Asignatura registrada y catálogo actualizado." : "Asignatura registrada; no se pudo actualizar la vista.", !refreshed);
        });
        bindSubmit("form-curriculum-plan", async form => {
            await call("createStudyPlan", buildPlanPayload(valuesFromForm(form)));
            form.reset();
            const refreshed = await loadAll();
            setStatus(refreshed ? "Plan registrado y catálogo actualizado." : "Plan registrado; no se pudo actualizar la vista.", !refreshed);
        });
        bindSubmit("form-curriculum-relation", async form => {
            const values = valuesFromForm(form);
            const plan = planById(values.planId || byId("curriculum-relation-plan").value);
            const payload = buildRelationPayload(plan, {
                asignaturaId:byId("curriculum-relation-subject").value,
                caracter:byId("curriculum-relation-character").value,
                horasSemanales:byId("curriculum-relation-hours").value,
                orden:byId("curriculum-relation-order").value
            });
            await call("createStudyPlanSubject", payload);
            const planId = plan.planId;
            byId("curriculum-relation-subject").value = "";
            byId("curriculum-relation-hours").value = "";
            byId("curriculum-relation-order").value = "0";
            const refreshed = await loadAll();
            if (byId("curriculum-relation-plan")) byId("curriculum-relation-plan").value = planId;
            await loadPlanRelations(planId);
            setStatus(refreshed ? "Asignatura vinculada al plan." : "Relación guardada; no se pudo actualizar la vista.", !refreshed);
        });
        bindSubmit("form-curriculum-offer", async form => {
            const year = state.years.find(item => String(item.anoId) === String(byId("curriculum-offer-year").value) && isActive(item));
            const period = state.periods.find(item => String(item.periodoId) === String(byId("curriculum-offer-period").value) && isActive(item));
            const plan = planById(byId("curriculum-offer-plan").value);
            const subjectId = byId("curriculum-offer-subject").value;
            const relationResponse = await call("getStudyPlanSubjects", { planId:plan && plan.planId });
            if (!(relationResponse.data || []).some(item => String(item.asignaturaId).toUpperCase() === String(subjectId).toUpperCase() && item.estado === "Activo")) {
                throw new Error("La asignatura no tiene una relación activa con el plan seleccionado.");
            }
            const payload = buildOfferPayload(year, period, plan, {
                asignaturaId:subjectId,
                seccion:byId("curriculum-offer-section").value,
                capacidadMax:byId("curriculum-offer-capacity").value
            });
            await call("createAcademicOffer", payload);
            form.reset();
            const refreshed = await loadAll();
            setStatus(refreshed ? "Oferta académica registrada." : "Oferta registrada; no se pudo actualizar la vista.", !refreshed);
        });
    }
    function init() {
        const open = byId("btn-open-curriculum-admin"), close = byId("btn-close-curriculum-admin");
        const modal = byId("modal-curriculum-admin");
        if (open && modal) open.addEventListener("click", () => { modal.classList.remove("hidden"); loadAll(); });
        if (close && modal) close.addEventListener("click", () => modal.classList.add("hidden"));
        const refresh = byId("btn-refresh-curriculum-admin");
        if (refresh) refresh.addEventListener("click", loadAll);
        const relationPlan = byId("curriculum-relation-plan");
        if (relationPlan) relationPlan.addEventListener("change", () => loadPlanRelations(relationPlan.value));
        const offerPlan = byId("curriculum-offer-plan");
        if (offerPlan) offerPlan.addEventListener("change", () => loadOfferPlanSubjects(offerPlan.value));
        const offerYear = byId("curriculum-offer-year");
        if (offerYear) offerYear.addEventListener("change", updatePeriods);
        bindForms();
    }
    global.IMACurriculumAdmin = {
        isActive:isActive,
        buildSubjectPayload:buildSubjectPayload,
        buildPlanPayload:buildPlanPayload,
        buildRelationPayload:buildRelationPayload,
        buildOfferPayload:buildOfferPayload,
        refresh:loadAll
    };
    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
    else init();
})(window);
