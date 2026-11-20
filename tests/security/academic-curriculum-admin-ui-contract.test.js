"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("js/curriculum-admin.js", "utf8");
const dashboard = fs.readFileSync("dashboard-direccion.html", "utf8");
const window = { document:{ readyState:"loading", addEventListener(){} } };
vm.runInNewContext(source, { window, Object, String, Number, Array, Set, Promise, Error, FormData });
const api = window.IMACurriculumAdmin;
assert.equal(api.isActive({ isActive:true, estado:"Inactivo" }), true);
assert.equal(api.isActive({ estado:"Vigente" }), true);
assert.equal(api.isActive({ estado:"Inactiva" }), false);
const subject = api.buildSubjectPayload({
  nombreOficial:"Matemática", codigo:"mat-10", areaId:"AREA-MAT", programaId:"BTP",
  nivelEducativo:"Media", grado:"Décimo", idioma:"es", cargaHorariaRef:"5", creditos:"3",
  prerrequisitos:["asig-01","ASIG-02"]
});
assert.deepEqual(JSON.parse(JSON.stringify(subject)), {
  nombreOficial:"Matemática", codigo:"MAT-10", areaId:"AREA-MAT", programaId:"BTP",
  nivelEducativo:"Media", grado:"Décimo", idioma:"es", cargaHorariaRef:5, creditos:3,
  prerrequisitos:["ASIG-01","ASIG-02"]
});
const plan = api.buildPlanPayload({ nombre:"BTP Informática", version:"2.0", grado:"Décimo", vigenciaInicio:"2026-02-01", vigenciaFin:"2026-11-30" });
assert.equal(plan.estado, "Vigente");
assert.equal(plan.grado, "Décimo");
const relation = api.buildRelationPayload({ planId:"PLAN-1", grado:"Décimo" }, {
  asignaturaId:"asig-10", caracter:"Obligatoria", horasSemanales:"5", orden:"2"
});
assert.deepEqual(JSON.parse(JSON.stringify(relation)), {
  planId:"PLAN-1", asignaturaId:"ASIG-10", grado:"Décimo", caracter:"Obligatoria", horasSemanales:5, orden:2
});
const offer = api.buildOfferPayload({ anoId:"2026" }, { periodoId:"P1", anoId:"2026" }, { planId:"PLAN-1", grado:"Décimo" }, {
  asignaturaId:"ASIG-10", seccion:"A", capacidadMax:"35"
});
assert.deepEqual(JSON.parse(JSON.stringify(offer)), {
  anoId:"2026", periodoId:"P1", planId:"PLAN-1", asignaturaId:"ASIG-10", grado:"Décimo", seccion:"A", capacidadMax:35
});
assert.throws(() => api.buildOfferPayload({ anoId:"2026" }, { periodoId:"P2", anoId:"2027" }, { planId:"PLAN-1", grado:"Décimo" }, {
  asignaturaId:"ASIG-10", seccion:"A", capacidadMax:"35"
}), /no pertenece al año lectivo/);
assert.match(source, /textContent\s*=/, "rendering must use textContent for untrusted catalog values");
assert.match(source, /getStudyPlanSubjects/);
assert.match(source, /setStudyPlanSubjectStatus/);
assert.match(source, /function isPlanCurrent/);
assert.match(source, /subject\.grado.*plan\.grado/);
assert.match(source, /createSubjectCatalogItem/);
assert.match(source, /createStudyPlanSubject/);
assert.match(source, /createAcademicOffer/);
assert.match(dashboard, /id="btn-open-curriculum-admin"/);
assert.match(dashboard, /id="modal-curriculum-admin"/);
assert.match(dashboard, /id="form-curriculum-subject"/);
assert.match(dashboard, /id="form-curriculum-plan"/);
assert.match(dashboard, /id="form-curriculum-relation"/);
assert.match(dashboard, /id="form-curriculum-offer"/);\nassert.match(dashboard, /name="idioma" required/);\nassert.match(dashboard, /name="cargaHorariaRef"[^>]*required/);\nassert.match(dashboard, /name="creditos"[^>]*required/);
console.log("Academic curriculum admin UI contract: payloads, active states, plan links and safe rendering PASS.");
