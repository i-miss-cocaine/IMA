(function () {
  "use strict";
  function byId(id) { return document.getElementById(id); }
  function node(tag, className, value) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined && value !== null) element.textContent = String(value);
    return element;
  }
  function formatPct(value) {
    return value === null || value === undefined ? "Sin datos" : Number(value).toFixed(1) + "%";
  }
  function formatMinutes(value) {
    return value === null || value === undefined ? "Sin datos" : Number(value).toFixed(1) + " min";
  }
  function card(label, value, detail) {
    var item = node("section", "rounded-2xl border border-slate-200 bg-white p-4");
    item.appendChild(node("p", "text-[10px] font-black uppercase tracking-wide text-slate-500", label));
    item.appendChild(node("p", "mt-1 text-2xl font-black text-slate-900", value));
    if (detail) item.appendChild(node("p", "mt-1 text-[10px] text-slate-500", detail));
    return item;
  }
  function renderBars(host, title, rows, key, formatter) {
    var section = node("section", "rounded-2xl border border-slate-200 bg-white p-4 space-y-3");
    section.appendChild(node("h4", "text-xs font-black uppercase text-slate-800", title));
    if (!rows.length) {
      section.appendChild(node("p", "text-xs text-slate-400", "No hay viajes para los filtros seleccionados."));
      host.appendChild(section);
      return;
    }
    rows.forEach(function (row) {
      var value = row[key];
      var line = node("div", "space-y-1");
      var header = node("div", "flex items-center justify-between gap-3 text-[11px]");
      header.appendChild(node("span", "font-bold text-slate-700", row.nombreRuta + " · " + row.jornada));
      var detail = value === null || value === undefined ? "Sin datos" : formatter(value);
      if (key === "ocupacionPromedioPct" && row.sobrecapacidadDetectada) detail += " · sobrecapacidad";
      header.appendChild(node("span", "font-black text-slate-900 text-right", detail));
      line.appendChild(header);
      var track = node("div", "h-2.5 rounded-full bg-slate-100 overflow-hidden");
      var bar = node("div", "h-full rounded-full bg-cyan-700");
      var width = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, Number(value)));
      bar.style.width = width + "%";
      track.appendChild(bar);
      line.appendChild(track);
      line.appendChild(node("p", "text-[10px] text-slate-400", "Viajes analizados: " + row.viajes +
        (key === "ocupacionPromedioPct" ? " · abordajes: " + row.abordajesReales + " · estimaciones: " + row.ocupacionesEstimadas : "")));
      section.appendChild(line);
    });
    host.appendChild(section);
  }
  function renderUnavailable(host, title, detail) {
    var section = node("section", "rounded-2xl border border-amber-200 bg-amber-50 p-4");
    section.appendChild(node("h4", "text-xs font-black uppercase text-amber-900", title));
    section.appendChild(node("p", "mt-1 text-xs text-amber-800", detail));
    host.appendChild(section);
  }

  window.openTransportEfficiencyModal = function () {
    var modal = byId("modal-transport-efficiency-analytics");
    if (!modal) return;
    modal.classList.remove("hidden");
    window.loadTransportEfficiencyMetrics();
  };

  window.loadTransportEfficiencyMetrics = async function () {
    var host = byId("transport-efficiency-results");
    if (!host) return;
    host.replaceChildren(node("p", "p-6 text-center text-slate-400 text-xs font-bold uppercase", "Consultando indicadores..."));
    var payload = {
      fechaDesde: byId("transport-metrics-from").value,
      fechaHasta: byId("transport-metrics-to").value,
      rutaId: byId("transport-metrics-route").value.trim(),
      jornada: byId("transport-metrics-journey").value
    };
    Object.keys(payload).forEach(function (key) { if (!payload[key]) delete payload[key]; });
    try {
      var result = await window.fetchApi("ACCOUNTING", "getTransportEfficiencyMetrics", payload);
      if (!result || result.status !== "success") {
        host.replaceChildren(node("p", "p-5 rounded-xl bg-red-50 text-red-700 text-xs font-bold", result && result.message || "No fue posible consultar los indicadores."));
        return;
      }
      var summary = result.resumen || {};
      var metrics = Array.isArray(result.rutas) ? result.rutas : [];
      host.replaceChildren();
      var cards = node("div", "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2");
      cards.appendChild(card("Ocupación promedio", formatPct(summary.ocupacionPromedioPct), "Viajes con capacidad: " + (summary.viajesConOcupacion || 0)));
      cards.appendChild(card("Puntualidad", formatPct(summary.puntualidadPct), "Viajes evaluados: " + (summary.viajesPuntualidadEvaluados || 0)));
      cards.appendChild(card("Duración promedio", formatMinutes(summary.duracionPromedioMinutos), "Viajes evaluados: " + (summary.viajesDuracionEvaluados || 0)));
      cards.appendChild(card("Viajes analizados", summary.viajesAnalizados || 0, "Según el rango y filtros seleccionados"));
      host.appendChild(cards);
      renderBars(host, "Ocupación por ruta y jornada", metrics, "ocupacionPromedioPct", formatPct);
      renderBars(host, "Puntualidad por ruta y jornada", metrics, "puntualidadPct", formatPct);
      var duration = node("section", "rounded-2xl border border-slate-200 bg-white p-4");
      duration.appendChild(node("h4", "text-xs font-black uppercase text-slate-800 mb-3", "Duración promedio por ruta"));
      metrics.forEach(function (row) {
        duration.appendChild(node("p", "py-1 text-xs text-slate-700 border-b border-slate-100",
          row.nombreRuta + " · " + row.jornada + ": " + formatMinutes(row.duracionPromedioMinutos)));
      });
      host.appendChild(duration);
      var unavailable = result.indicadoresNoDisponibles || {};
      var cost = unavailable.costoOperativoPorEstudiante || {};
      var demand = unavailable.demandaGeograficaSinCobertura || {};
      renderUnavailable(host, "Costo operativo por estudiante · sin datos", cost.motivo || "No hay una fuente verificable de costos.");
      renderUnavailable(host, "Demanda geográfica sin cobertura · sin datos", demand.motivo || "No hay solicitudes georreferenciadas ni regla de cobertura.");
    } catch (error) {
      host.replaceChildren(node("p", "p-5 rounded-xl bg-red-50 text-red-700 text-xs font-bold", error && error.message || "Error de comunicación."));
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    var refresh = byId("btn-refresh-transport-metrics");
    if (refresh) refresh.addEventListener("click", window.loadTransportEfficiencyMetrics);
  });
})();