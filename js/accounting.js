/**
 * Controller for Accounting, Inventory, Assets & Maintenance Dashboard
 * New Generation Christian Academy / Bilingual School and Institute
 */

// ---------------------------------------------------------------------------
// [T-UX-12] [Fase 3: Experiencia de Usuario y Navegación Unificada] - CONSOLIDACIÓN DE PANELES DE CONTROL POR ROL Y DEPARTAMENTO
// Consolida la visualización de indicadores clave, métricas financieras y accesos operativos para el departamento de contabilidad y finanzas.
// ---------------------------------------------------------------------------
window.consolidateAccountingDashboardSummary = function(accountingData) {
    if (!accountingData) {
        return { totalRevenueFormatted: "L 0.00", totalExpensesFormatted: "L 0.00", netBalanceFormatted: "L 0.00", pendingInvoicesCount: 0 };
    }
    var revenue = typeof accountingData.totalRevenue === 'number' ? accountingData.totalRevenue : 0;
    var expenses = typeof accountingData.totalExpenses === 'number' ? accountingData.totalExpenses : 0;
    var net = revenue - expenses;
    var pendingCount = typeof accountingData.pendingInvoicesCount === 'number' ? accountingData.pendingInvoicesCount : 0;

    return {
        totalRevenueFormatted: "L " + revenue.toFixed(2),
        totalExpensesFormatted: "L " + expenses.toFixed(2),
        netBalanceFormatted: "L " + net.toFixed(2),
        pendingInvoicesCount: pendingCount
    };
};

document.addEventListener('DOMContentLoaded', function () {
  if (typeof window.initAccountingDashboard === 'function') {
    window.initAccountingDashboard();
  }
});

let currentAccountingTab = 'resumen';
let currentInventarioSubtab = 'kardex';

window.switchTab = function (tab) {
  currentAccountingTab = tab;
  const container = document.getElementById('contabilidad-panel-container');
  if (!container) return;

  if (tab === 'inventario') {
    renderInventarioModule(container);
  } else if (tab === 'compras') {
    renderComprasModule(container);
  } else if (tab === 'biblioteca') {
    renderBibliotecaModule(container);
  } else if (tab === 'diario') {
    renderDiarioModule(container);
  } else if (tab === 'payroll-adjustments') {
    renderPayrollAdjustmentsModule(container);
  } else if (tab === 'presupuestos') {
    renderPresupuestosModule(container);
  } else if (tab === 'descuentos') {
    renderDescuentosModule(container);
  } else if (tab === 'matricula') {
    renderEnrollmentBillingConfigurationModule(container);
  } else {
    renderResumenModule(container);
  }
};

window.initAccountingDashboard = function () {
  window.switchTab('resumen');
};

// ---------------------------------------------------------------------------
// MÓDULO DE INVENTARIO, ACTIVOS FIJOS Y MANTENIMIENTO (FASE 19)
// ---------------------------------------------------------------------------

function renderInventarioModule(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
        <h4 class="text-base font-black uppercase text-gray-800 flex items-center gap-2">
          <i class="fas fa-boxes text-blue-600"></i> Inventario, Activos Fijos & Mantenimiento (Fase 19)
        </h4>
        <div class="flex flex-wrap gap-2 text-xs font-bold uppercase">
          <button onclick="switchInventarioSubtab('kardex')" id="btn-sub-kardex" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-blue-600 text-white">Kardex</button>
          <button onclick="switchInventarioSubtab('almacenes')" id="btn-sub-almacenes" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Almacenes</button>
          <button onclick="switchInventarioSubtab('transferencias')" id="btn-sub-transferencias" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Transferencias</button>
          <button onclick="switchInventarioSubtab('solicitudes')" id="btn-sub-solicitudes" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Solicitudes & Entregas</button>
          <button onclick="switchInventarioSubtab('activos')" id="btn-sub-activos" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Activos Fijos</button>
          <button onclick="switchInventarioSubtab('mantenimiento')" id="btn-sub-mantenimiento" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Mantenimiento</button>
          <button onclick="switchInventarioSubtab('bajas')" id="btn-sub-bajas" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Bajas</button>
        </div>
      </div>

      <div id="inventario-subtab-container" class="space-y-4">
        <div class="text-center py-6 text-gray-400 text-xs font-bold uppercase">Cargando datos de inventario...</div>
      </div>
    </div>
  `;
  switchInventarioSubtab('kardex');
}

window.switchInventarioSubtab = function (subtab) {
  currentInventarioSubtab = subtab;
  ['kardex', 'almacenes', 'transferencias', 'solicitudes', 'activos', 'mantenimiento', 'bajas'].forEach(s => {
    const btn = document.getElementById(`btn-sub-${s}`);
    if (btn) {
      if (s === subtab) {
        btn.className = "px-3 py-1.5 rounded-xl transition-all shadow-sm bg-blue-600 text-white font-bold";
      } else {
        btn.className = "px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100 font-bold";
      }
    }
  });

  const subContainer = document.getElementById('inventario-subtab-container');
  if (!subContainer) return;

  if (subtab === 'kardex') renderKardexView(subContainer);
  else if (subtab === 'almacenes') renderAlmacenesView(subContainer);
  else if (subtab === 'transferencias') renderTransferenciasView(subContainer);
  else if (subtab === 'solicitudes') renderSolicitudesView(subContainer);
  else if (subtab === 'activos') renderActivosView(subContainer);
  else if (subtab === 'mantenimiento') renderMantenimientoView(subContainer);
  else if (subtab === 'bajas') renderBajasView(subContainer);
};

// --- SUB-VISTAS DE INVENTARIO ---

function renderKardexView(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <h5 class="font-black text-xs uppercase text-gray-800 mb-3"><i class="fas fa-plus-circle text-emerald-600"></i> Registrar Movimiento</h5>
        <form id="form-movimiento-kardex" onsubmit="handleMovimientoKardex(event)" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-gray-600 mb-1">Código de Ítem *</label>
            <input type="text" id="kdx-codigo" required class="w-full p-2 border border-gray-300 rounded-xl font-bold" placeholder="EJ: MAT-PAP-01">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Nombre de Ítem *</label>
            <input type="text" id="kdx-nombre" required class="w-full p-2 border border-gray-300 rounded-xl" placeholder="EJ: Papel Bond Tamaño Carta">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Tipo Movimiento</label>
            <select id="kdx-tipo" class="w-full p-2 border border-gray-300 rounded-xl">
              <option value="Entrada">Entrada (Compra / Recepción)</option>
              <option value="Salida">Salida (Consumo Operativo)</option>
              <option value="Devolucion">Devolución al Almacén</option>
              <option value="Baja">Baja / Deterioro</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-gray-600 mb-1">Cantidad *</label>
              <input type="number" step="0.01" id="kdx-cantidad" required class="w-full p-2 border border-gray-300 rounded-xl" placeholder="10">
            </div>
            <div>
              <label class="block font-bold text-gray-600 mb-1">Stock Mínimo</label>
              <input type="number" id="kdx-minimo" value="5" class="w-full p-2 border border-gray-300 rounded-xl">
            </div>
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Ubicación / Responsable</label>
            <input type="text" id="kdx-ubicacion" value="Bodega General" class="w-full p-2 border border-gray-300 rounded-xl">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Observaciones</label>
            <input type="text" id="kdx-obs" class="w-full p-2 border border-gray-300 rounded-xl">
          </div>
          <button type="submit" class="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all uppercase">
            Guardar Movimiento
          </button>
        </form>
      </div>

      <div class="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-list text-blue-600"></i> Historial Kardex de Existencias</h5>
          <button onclick="loadKardexData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
        </div>
        <div id="kardex-table-container" class="overflow-x-auto text-xs">
          <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando movimientos...</div>
        </div>
      </div>
    </div>
  `;
  loadKardexData();
}

// [TASK-019] [F19-Task01] - Carga y renderizado de existencias multialmacén e historial de Kardex
window.loadKardexData = function (filtroUbicacion) {
  const container = document.getElementById('kardex-table-container');
  if (!container) return;

  const payload = {};
  if (filtroUbicacion) payload.ubicacionResponsable = filtroUbicacion;

  fetchApi('ACCOUNTING', 'getInventoryKardex', payload)
    .then(res => {
      const items = (res && (res.kardex || res.data)) ? (res.kardex || res.data) : [];
      const resumenUbicaciones = (res && res.resumenPorUbicacion) ? res.resumenPorUbicacion : [];
      const resumenConsolidado = (res && res.resumenExistencias) ? res.resumenExistencias : [];

      if (items.length === 0 && resumenConsolidado.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay registros en el Kardex de inventario.</div>`;
        return;
      }

      let html = "";

      // 1. Tarjeta resumen de existencias multialmacén vs consolidado institucional
      if (resumenConsolidado.length > 0) {
        html += `
          <div class="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <h6 class="font-black text-[11px] text-blue-900 uppercase mb-2"><i class="fas fa-warehouse text-blue-600"></i> Resumen de Existencias por Almacén y Consolidado Institucional</h6>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        `;
        resumenConsolidado.forEach(item => {
          const ubs = item.ubicaciones || {};
          html += `
            <div class="bg-white p-2.5 rounded-lg border border-blue-100 shadow-sm">
              <div class="flex justify-between items-start">
                <span class="font-bold text-gray-800 text-xs">${item.itemNombre}</span>
                <span class="font-mono text-[10px] text-blue-600 bg-blue-100 px-1 rounded">${item.itemCodigo}</span>
              </div>
              <div class="mt-1 text-[11px] text-gray-600 space-y-0.5">
          `;
          Object.keys(ubs).forEach(ub => {
            html += `<div class="flex justify-between"><span>📍 ${ub}:</span><span class="font-bold">${ubs[ub]}</span></div>`;
          });
          html += `
              </div>
              <div class="mt-2 pt-1 border-t border-gray-100 flex justify-between font-black text-xs ${item.alertaStockMinimo ? 'text-rose-600' : 'text-emerald-700'}">
                <span>Total Institucional:</span>
                <span>${item.totalInstitucional} ${item.alertaStockMinimo ? '⚠️' : ''}</span>
              </div>
            </div>
          `;
        });
        html += `</div></div>`;
      }

      // 2. Tabla detallada de movimientos Kardex
      html += `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">Código</th>
              <th class="p-2">Ítem</th>
              <th class="p-2">Movimiento</th>
              <th class="p-2 text-right">Cant.</th>
              <th class="p-2 text-right">Stock Ant.</th>
              <th class="p-2 text-right">Stock Nuevo</th>
              <th class="p-2">Ubicación / Almacén</th>
              <th class="p-2">Observaciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      items.forEach(k => {
        const isBajo = k.stockNuevo <= k.stockMinimo;
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-blue-600">${k.itemCodigo}</td>
            <td class="p-2 font-bold text-gray-800">${k.itemNombre}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${k.tipoMovimiento.includes('Entrada') || k.tipoMovimiento === 'Devolucion' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${k.tipoMovimiento}</span></td>
            <td class="p-2 text-right font-bold">${k.cantidad}</td>
            <td class="p-2 text-right text-gray-500 font-mono">${k.stockAnterior !== undefined ? k.stockAnterior : '-'}</td>
            <td class="p-2 text-right font-black ${isBajo ? 'text-rose-600' : 'text-emerald-600'}">${k.stockNuevo} ${isBajo ? '⚠️' : ''}</td>
            <td class="p-2 text-gray-700 font-semibold">📍 ${k.ubicacionResponsable || 'Bodega General'}</td>
            <td class="p-2 text-gray-500 text-[11px] truncate max-w-[150px]">${k.observaciones || ''}</td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar Kardex: ${err.message}</div>`;
    });
};

window.handleMovimientoKardex = function (e) {
  e.preventDefault();
  const payload = {
    itemCodigo: document.getElementById('kdx-codigo').value,
    itemNombre: document.getElementById('kdx-nombre').value,
    tipoMovimiento: document.getElementById('kdx-tipo').value,
    cantidad: document.getElementById('kdx-cantidad').value,
    stockMinimo: document.getElementById('kdx-minimo').value,
    ubicacionResponsable: document.getElementById('kdx-ubicacion').value,
    observaciones: document.getElementById('kdx-obs').value
  };

  fetchApi('ACCOUNTING', 'recordInventoryMovement', payload)
    .then(res => {
      alert(res.message || "Movimiento registrado con éxito.");
      document.getElementById('form-movimiento-kardex').reset();
      loadKardexData();
    })
    .catch(err => alert("Error: " + err.message));
};

// --- ALMACENES & UBICACIONES ---

function renderAlmacenesView(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <h5 class="font-black text-xs uppercase text-gray-800 mb-3"><i class="fas fa-warehouse text-blue-600"></i> Registrar Ubicación / Almacén</h5>
        <form id="form-almacen" onsubmit="handleSaveAlmacen(event)" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-gray-600 mb-1">Nombre de Ubicación *</label>
            <input type="text" id="loc-nombre" required class="w-full p-2 border border-gray-300 rounded-xl" placeholder="EJ: Bodega de Ciencias">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Tipo de Área</label>
            <select id="loc-tipo" class="w-full p-2 border border-gray-300 rounded-xl">
              <option value="Bodega">Bodega</option>
              <option value="Laboratorio">Laboratorio</option>
              <option value="Aula">Aula</option>
              <option value="Oficina">Oficina</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Responsable (UserId / Empleado)</label>
            <input type="text" id="loc-responsable" class="w-full p-2 border border-gray-300 rounded-xl" placeholder="EJ: EMP-01">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Observaciones</label>
            <input type="text" id="loc-obs" class="w-full p-2 border border-gray-300 rounded-xl">
          </div>
          <button type="submit" class="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all uppercase">
            Guardar Ubicación
          </button>
        </form>
      </div>

      <div class="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-map-marker-alt text-emerald-600"></i> Catálogo de Ubicaciones Institucionales</h5>
          <button onclick="loadAlmacenesData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
        </div>
        <div id="almacenes-table-container" class="overflow-x-auto text-xs">
          <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando ubicaciones...</div>
        </div>
      </div>
    </div>
  `;
  loadAlmacenesData();
}

window.loadAlmacenesData = function () {
  const container = document.getElementById('almacenes-table-container');
  if (!container) return;

  fetchApi('ACCOUNTING', 'getWarehouseLocations', {})
    .then(res => {
      const ubs = (res && res.ubicaciones) ? res.ubicaciones : [];
      if (ubs.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay ubicaciones registradas.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">ID</th>
              <th class="p-2">Ubicación / Almacén</th>
              <th class="p-2">Tipo</th>
              <th class="p-2">Responsable</th>
              <th class="p-2">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      ubs.forEach(u => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-blue-600">${u.ubicacionId}</td>
            <td class="p-2 font-bold text-gray-800">${u.nombreUbicacion}</td>
            <td class="p-2 text-gray-500">${u.tipoArea}</td>
            <td class="p-2 text-gray-700 font-medium">${u.responsableUserId || 'Sin asignar'}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">${u.estado}</span></td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar almacenes: ${err.message}</div>`;
    });
};

window.handleSaveAlmacen = function (e) {
  e.preventDefault();
  const payload = {
    nombreUbicacion: document.getElementById('loc-nombre').value,
    tipoArea: document.getElementById('loc-tipo').value,
    responsableUserId: document.getElementById('loc-responsable').value,
    observaciones: document.getElementById('loc-obs').value
  };

  fetchApi('ACCOUNTING', 'manageWarehouseLocation', payload)
    .then(res => {
      alert(res.message || "Ubicación guardada con éxito.");
      document.getElementById('form-almacen').reset();
      loadAlmacenesData();
    })
    .catch(err => alert("Error: " + err.message));
};

// --- SOLICITUDES & ENTREGAS ---

function renderSolicitudesView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-200">
      <div class="flex justify-between items-center mb-4">
        <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-file-signature text-purple-600"></i> Solicitudes Internas de Materiales</h5>
        <button onclick="loadSolicitudesData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
      </div>
      <div id="solicitudes-table-container" class="overflow-x-auto text-xs">
        <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando solicitudes...</div>
      </div>
    </div>
  `;
  loadSolicitudesData();
}

window.loadSolicitudesData = function () {
  const container = document.getElementById('solicitudes-table-container');
  if (!container) return;

  fetchApi('ACCOUNTING', 'getMaterialRequisitions', {})
    .then(res => {
      const sols = (res && res.solicitudes) ? res.solicitudes : [];
      if (sols.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay solicitudes internas de materiales.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">ID Solicitud</th>
              <th class="p-2">Departamento</th>
              <th class="p-2">Solicitante</th>
              <th class="p-2">Motivo</th>
              <th class="p-2">Estado</th>
              <th class="p-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      sols.forEach(s => {
        const isPend = s.estadoAprobacion === 'PendienteAprobacion' || s.estadoAprobacion === 'Aprobada';
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-purple-600">${s.solicitudMatId}</td>
            <td class="p-2 font-bold text-gray-800">${s.departamento}</td>
            <td class="p-2 text-gray-600">${s.solicitanteUserId}</td>
            <td class="p-2 text-gray-500">${s.motivo || 'Consumo'}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.estadoAprobacion === 'Entregado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${s.estadoAprobacion}</span></td>
            <td class="p-2 text-right">
              ${isPend ? `<button onclick="handleEntregarSolicitud('${s.solicitudMatId}')" class="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-emerald-700">Entregar</button>` : `<span class="text-gray-400 text-[10px]">Entregado</span>`}
            </td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar solicitudes: ${err.message}</div>`;
    });
};

window.handleEntregarSolicitud = function (solId) {
  if (!confirm(`¿Confirmar la entrega física de los materiales para la solicitud ${solId}?`)) return;

  fetchApi('ACCOUNTING', 'deliverMaterialRequisition', { solicitudMatId: solId, entregadoPorUserId: 'Bodega' })
    .then(res => {
      alert(res.message || "Entrega de materiales procesada con éxito.");
      loadSolicitudesData();
    })
    .catch(err => alert("Error: " + err.message));
};

// --- ACTIVOS FIJOS & CUSTODIAS ---

function renderActivosView(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <h5 class="font-black text-xs uppercase text-gray-800 mb-3"><i class="fas fa-desktop text-indigo-600"></i> Registrar Activo Patrimonial</h5>
        <form id="form-activo" onsubmit="handleSaveActivo(event)" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-gray-600 mb-1">Código Patrimonial *</label>
            <input type="text" id="act-codigo" required class="w-full p-2 border border-gray-300 rounded-xl font-bold" placeholder="EJ: PAT-LAB-01">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Nombre del Activo *</label>
            <input type="text" id="act-nombre" required class="w-full p-2 border border-gray-300 rounded-xl" placeholder="EJ: Computadora All-in-One HP">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Categoría</label>
            <select id="act-categoria" class="w-full p-2 border border-gray-300 rounded-xl">
              <option value="Equipo Computacional">Equipo Computacional</option>
              <option value="Audiovisual">Audiovisual</option>
              <option value="Mobiliario">Mobiliario</option>
              <option value="Maquinaria">Maquinaria / Climatización</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Marca</label><input type="text" id="act-marca" class="w-full p-2 border border-gray-300 rounded-xl" placeholder="Marca">
          <label class="block font-bold text-gray-600 mb-1">Modelo</label><input type="text" id="act-serie" class="w-full p-2 border border-gray-300 rounded-xl" placeholder="Modelo">
          <label class="block font-bold text-gray-600 mb-1">Número de serie único</label><input type="text" id="act-numero-serie" class="w-full p-2 border border-gray-300 rounded-xl" placeholder="Número de serie">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Ubicación Actual</label>
            <input type="text" id="act-ubicacion" value="Laboratorio Cómputo 1" class="w-full p-2 border border-gray-300 rounded-xl">
          </div>
          <button type="submit" class="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all uppercase">
            Guardar Activo
          </button>
        </form>
      </div>

      <div class="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-landmark text-blue-600"></i> Inventario de Activos Patrimoniales</h5>
          <button onclick="loadActivosData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
        </div>
        <div id="activos-table-container" class="overflow-x-auto text-xs">
          <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando activos...</div>
        </div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML("beforeend",'<section class="mt-6 rounded-2xl border border-indigo-100 bg-white p-5 space-y-4"><div><h5 class="font-black text-sm">Depreciación y valor patrimonial</h5><p class="text-xs text-gray-500">Configura políticas por categoría, ficha financiera, mejoras capitalizables y calendario contable.</p></div><div class="grid md:grid-cols-3 gap-3"><label class="text-xs font-bold">Categoría contable<input id="asset-depr-category" class="mt-1 w-full rounded-lg border p-2" placeholder="Mobiliario"></label><label class="text-xs font-bold">Método<select id="asset-depr-method" class="mt-1 w-full rounded-lg border p-2"><option value="LineaRecta">Línea recta</option><option value="SaldoDecreciente">Saldo decreciente</option><option value="UnidadesProduccion">Unidades de producción</option></select></label><label class="text-xs font-bold">Vida útil (meses)<input id="asset-depr-life" type="number" min="1" class="mt-1 w-full rounded-lg border p-2" value="60"></label><label class="text-xs font-bold">Cuenta de activo<input id="asset-depr-account" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Cuenta depreciación acumulada<input id="asset-depr-accum" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Cuenta gasto depreciación<input id="asset-depr-expense" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Cuenta ganancia por baja<input id="asset-depr-gain" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Cuenta pérdida por baja<input id="asset-depr-loss" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Cuenta contrapartida de venta<input id="asset-depr-cash" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Residual (%)<input id="asset-depr-residual-pct" type="number" min="0" max="99.99" step="0.01" value="0" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Tasa anual (saldo decreciente)<input id="asset-depr-rate" type="number" min="0.01" max="0.99" step="0.01" value="0.2" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Unidades totales<input id="asset-depr-units" type="number" min="1" class="mt-1 w-full rounded-lg border p-2"></label></div><button type="button" onclick="saveAssetDeprPolicyUI()" class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Guardar política de categoría</button><div class="border-t pt-4"><h6 class="font-black text-xs">Ficha financiera del activo</h6><div class="grid md:grid-cols-4 gap-3 mt-2"><label class="text-xs font-bold">Activo ID / Código<input id="asset-depr-id" class="mt-1 w-full rounded-lg border p-2" placeholder="ACT-..."></label><label class="text-xs font-bold">Fecha puesta en servicio<input id="asset-depr-placed" type="date" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Costo capitalizado<input id="asset-depr-cost" type="number" min="0.01" step="0.01" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Valor residual (moneda)<input id="asset-depr-salvage" type="number" min="0" step="0.01" value="0" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Depreciación acumulada inicial<input id="asset-depr-opening" type="number" min="0" step="0.01" value="0" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Fecha corte de apertura<input id="asset-depr-cutoff" type="date" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Centro de costo<input id="asset-depr-cost-center" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Moneda<input id="asset-depr-currency" value="HNL" class="mt-1 w-full rounded-lg border p-2"></label></div><button type="button" onclick="saveAssetDeprProfileUI()" class="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white">Guardar ficha financiera</button><div class="mt-4 grid md:grid-cols-4 gap-2"><label class="text-xs font-bold">Fecha de mejora<input id="asset-improvement-date" type="date" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Descripción<input id="asset-improvement-description" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Importe capitalizable<input id="asset-improvement-amount" type="number" min="0.01" step="0.01" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Vida útil (meses)<input id="asset-improvement-life" type="number" min="1" class="mt-1 w-full rounded-lg border p-2"></label></div><button type="button" onclick="registerAssetImprovementUI()" class="mt-2 rounded-lg border px-4 py-2 text-xs font-bold">Registrar mejora capitalizable</button></div><div class="border-t pt-4"><h6 class="font-black text-xs">Cierre mensual y calendario</h6><div class="flex flex-wrap gap-2 items-end"><label class="text-xs font-bold">Período<input id="asset-depr-period" type="month" class="mt-1 rounded-lg border p-2"></label><label class="text-xs font-bold">Unidades utilizadas (si aplica)<input id="asset-depr-period-units" type="number" min="0" step="0.01" value="0" class="mt-1 rounded-lg border p-2"></label><button type="button" onclick="runAssetDeprUI(false)" class="rounded-lg bg-gray-700 px-4 py-2 text-xs font-bold text-white">Previsualizar</button><button type="button" onclick="runAssetDeprUI(true)" class="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Contabilizar período</button><button type="button" onclick="loadAssetDeprScheduleUI()" class="rounded-lg border px-4 py-2 text-xs font-bold">Actualizar calendario</button></div><div id="asset-depr-results" class="overflow-x-auto text-xs"></div></div></section>');
  loadActivosData();
}

window.loadActivosData = function () {
  const container=document.getElementById("activos-table-container");if(!container)return;
  fetchApi("ACCOUNTING","getAssetItems",{}).then(res=>{
    const items=res&&res.activos?res.activos:[];
    if(!items.length){container.innerHTML='<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay activos registrados.</div>';return;}
    const esc=escapePurchaseAssetHtml;
    let html='<table class="w-full text-left border-collapse"><thead><tr class="bg-gray-50 border-b text-gray-600 font-bold uppercase"><th class="p-2">Código</th><th class="p-2">Activo</th><th class="p-2">Serie</th><th class="p-2">Ubicación</th><th class="p-2">Custodio</th><th class="p-2">Adquisición</th><th class="p-2">Acciones</th></tr></thead><tbody class="divide-y divide-gray-100">';
    items.forEach(a=>{
      const acquisition=a.ordenCompraId?`<button onclick="viewAssetAcquisitionRecord(${purchaseAssetJsArg(a.activoId)})" class="px-2 py-1 bg-indigo-50 text-indigo-700 rounded font-bold text-[10px]">Ver expediente</button>`:"—";
      html+=`<tr><td class="p-2 font-mono font-bold text-indigo-600">${esc(a.codigoPatrimonial)}</td><td class="p-2 font-bold">${esc(a.nombre)}<div class="text-[10px] text-gray-500">${esc(a.categoria)}</div></td><td class="p-2">${esc(a.numeroSerie||a.serieModel)}</td><td class="p-2">${esc(a.ubicacionActual)}</td><td class="p-2">${esc(a.custodioUserId||"Sin custodio")}</td><td class="p-2">${acquisition}</td><td class="p-2 whitespace-nowrap"><button onclick="handleAsignarCustodia(${purchaseAssetJsArg(a.activoId)})" class="px-2 py-1 bg-blue-50 text-blue-600 rounded font-bold text-[10px]">Asignar</button>${a.custodioUserId||a.estado==="assigned"?` <button onclick="handleDevolverCustodia(${purchaseAssetJsArg(a.activoId)},${purchaseAssetJsArg(a.codigoPatrimonial)},${purchaseAssetJsArg(a.nombre)},${purchaseAssetJsArg(a.custodioUserId)})" class="px-2 py-1 bg-rose-50 text-rose-600 rounded font-bold text-[10px]">Devolver</button>`:""}</td></tr>`;
    });
    container.innerHTML=html+"</tbody></table>";
  }).catch(err=>{container.innerHTML='<div class="p-4 text-rose-600 font-bold text-center">Error al cargar activos: '+escapePurchaseAssetHtml(err.message)+'</div>';});
};
window.viewAssetAcquisitionRecord=function(activoId){
  fetchApi("ACCOUNTING","getAssetItems",{}).then(res=>{
    const asset=(res.activos||[]).find(item=>String(item.activoId)===String(activoId));if(!asset||!asset.ordenCompraId){alert("El activo no tiene un expediente de adquisición vinculado.");return;}
    const existing=document.getElementById("asset-acquisition-modal");if(existing)existing.remove();
    const modal=document.createElement("div");modal.id="asset-acquisition-modal";modal.className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-3";
    modal.innerHTML=`<div class="bg-white rounded-2xl p-5 max-w-xl w-full space-y-3"><div class="flex justify-between"><h3 class="font-black text-sm">Expediente de adquisición</h3><button onclick="document.getElementById('asset-acquisition-modal').remove()" class="text-xl">×</button></div>
      <dl class="grid grid-cols-2 gap-2 text-xs"><dt>Activo</dt><dd>${escapePurchaseAssetHtml(asset.nombre)}</dd><dt>Orden</dt><dd>${escapePurchaseAssetHtml(asset.ordenCompraId)}</dd><dt>Recepción</dt><dd>${escapePurchaseAssetHtml(asset.recepcionId)}</dd><dt>Proveedor</dt><dd>${escapePurchaseAssetHtml(asset.proveedorId)}</dd><dt>Factura</dt><dd>${escapePurchaseAssetHtml(asset.numeroFactura)}</dd><dt>Obligación</dt><dd>${escapePurchaseAssetHtml(asset.obligacionId)}</dd><dt>Fecha adquisición</dt><dd>${asset.fechaAdquisicion?new Date(asset.fechaAdquisicion).toLocaleDateString():"—"}</dd><dt>Costo de adquisición</dt><dd>${Number(asset.costoAdquisicion||0).toFixed(2)}</dd><dt>Número de serie</dt><dd>${escapePurchaseAssetHtml(asset.numeroSerie)}</dd></dl>
      <button onclick="openPurchaseReceiptRecord(${purchaseAssetJsArg(asset.recepcionId)})" class="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Ir a recepciones</button></div>`;
    document.body.appendChild(modal);
  }).catch(err=>alert("No se pudo abrir el expediente: "+(err.message||err)));
};

window.handleSaveActivo = function (e) {
  e.preventDefault();
  const payload = {
    codigoPatrimonial: document.getElementById('act-codigo').value,
    nombre: document.getElementById('act-nombre').value,
    categoria: document.getElementById('act-categoria').value,
    serieModel: document.getElementById('act-serie').value,
    numeroSerie: document.getElementById('act-numero-serie').value,
    marca: document.getElementById('act-marca').value,
    modelo: document.getElementById('act-serie').value,
    ubicacionActual: document.getElementById('act-ubicacion').value
  };

  fetchApi('ACCOUNTING', 'manageAssetItem', payload)
    .then(res => {
      alert(res.message || "Activo registrado con éxito.");
      document.getElementById('form-activo').reset();
      loadActivosData();
    })
    .catch(err => alert("Error: " + err.message));
};


window.saveAssetDeprPolicyUI=function(){
 const value=id=>document.getElementById(id).value;
 fetchApi("ACCOUNTING","saveAssetDepreciationPolicy",{categoria:value("asset-depr-category"),metodo:value("asset-depr-method"),vidaUtilMeses:Number(value("asset-depr-life")),valorResidualPorcentaje:Number(value("asset-depr-residual-pct")),tasaAnual:Number(value("asset-depr-rate")),unidadesTotales:Number(value("asset-depr-units")),cuentaActivo:value("asset-depr-account"),cuentaDepreciacionAcumulada:value("asset-depr-accum"),cuentaGastoDepreciacion:value("asset-depr-expense"),cuentaGananciaBaja:value("asset-depr-gain"),cuentaPerdidaBaja:value("asset-depr-loss"),cuentaEfectivoBaja:value("asset-depr-cash")}).then(()=>alert("Política de depreciación guardada.")).catch(e=>alert(e.message||String(e)));
};
window.saveAssetDeprProfileUI=function(){
 const value=id=>document.getElementById(id).value;
 fetchApi("ACCOUNTING","configureAssetDepreciationProfile",{activoId:value("asset-depr-id"),categoriaContable:value("asset-depr-category"),fechaPuestaFuncionamiento:value("asset-depr-placed"),fechaInicioDepreciacion:value("asset-depr-placed"),costoCapitalizado:Number(value("asset-depr-cost")),valorResidual:Number(value("asset-depr-salvage")),vidaUtilMeses:Number(value("asset-depr-life")),metodo:value("asset-depr-method"),tasaAnual:Number(value("asset-depr-rate")),cuentaActivo:value("asset-depr-account"),cuentaDepreciacionAcumulada:value("asset-depr-accum"),cuentaGastoDepreciacion:value("asset-depr-expense"),cuentaGananciaBaja:value("asset-depr-gain"),cuentaPerdidaBaja:value("asset-depr-loss"),cuentaEfectivoBaja:value("asset-depr-cash"),depreciacionAcumuladaInicial:Number(value("asset-depr-opening")),fechaCorteApertura:value("asset-depr-cutoff"),centroCosto:value("asset-depr-cost-center"),moneda:value("asset-depr-currency"),unidadesTotales:Number(value("asset-depr-units"))}).then(()=>{alert("Ficha financiera guardada.");loadAssetDeprScheduleUI();}).catch(e=>alert(e.message||String(e)));
};
window.registerAssetImprovementUI=function(){const value=id=>document.getElementById(id).value;fetchApi("ACCOUNTING","registerCapitalizableAssetImprovement",{activoId:value("asset-depr-id"),fechaCapitalizacion:value("asset-improvement-date"),descripcion:value("asset-improvement-description"),importe:Number(value("asset-improvement-amount")),vidaUtilMeses:Number(value("asset-improvement-life")),metodo:"LineaRecta"}).then(()=>{alert("Mejora capitalizable registrada.");loadAssetDeprScheduleUI();}).catch(e=>alert(e.message||String(e)));};
window.runAssetDeprUI=function(post){
 const value=id=>document.getElementById(id).value,host=document.getElementById("asset-depr-results");host.textContent="Procesando...";
 fetchApi("ACCOUNTING","calculateAssetDepreciation",{activoId:value("asset-depr-id"),periodo:value("asset-depr-period"),unidadesPeriodo:Number(value("asset-depr-period-units")),post:!!post}).then(result=>{
  host.innerHTML="";const title=document.createElement("p");title.className="font-bold my-2";title.textContent="Período "+result.periodo+" · Total "+result.totalDepreciacion;host.appendChild(title);
  (result.resultados||[]).forEach(r=>{const line=document.createElement("p");line.textContent=r.codigoPatrimonial+" · "+r.nombre+" · "+r.status+" · Depreciación "+r.depreciacionPeriodo+" · Valor neto "+r.valorNetoLibros+(r.asientoId?" · Asiento "+r.asientoId:"");host.appendChild(line);});
  if(post)loadAssetDeprScheduleUI();
 }).catch(e=>{host.textContent=e.message||String(e);});
};
window.loadAssetDeprScheduleUI=function(){
 const value=id=>document.getElementById(id).value,host=document.getElementById("asset-depr-results");if(!host)return;host.textContent="Cargando calendario...";
 fetchApi("ACCOUNTING","getAssetDepreciationSchedule",{activoId:value("asset-depr-id")}).then(result=>{
  host.innerHTML="";
  const addTitle=text=>{const h=document.createElement("h6");h.className="font-black mt-4 mb-2";h.textContent=text;host.appendChild(h);};
  const addTable=(headers,rows)=>{const table=document.createElement("table");table.className="w-full text-left border-collapse mb-3";const head=document.createElement("tr");headers.forEach(v=>{const th=document.createElement("th");th.className="border-b p-2";th.textContent=v;head.appendChild(th);});table.appendChild(head);rows.forEach(values=>{const tr=document.createElement("tr");values.forEach(v=>{const td=document.createElement("td");td.className="border-b p-2";td.textContent=String(v===undefined||v===null?"":v);tr.appendChild(td);});table.appendChild(tr);});host.appendChild(table);};
  const totals=document.createElement("p");totals.className="font-bold my-2";totals.textContent="Costo registrado "+result.totales.costo+" · Depreciación acumulada "+result.totales.depreciacionAcumulada+" · Valor neto "+result.totales.valorNeto+" · Totalmente depreciados "+result.totales.activosTotalmenteDepreciados;host.appendChild(totals);
  const rec=document.createElement("p");rec.className="text-xs my-2 "+(result.conciliacion.estado==="Conciliado"?"text-emerald-700":"text-amber-700");rec.textContent="Conciliación contable: "+result.conciliacion.estado+" · Registro "+result.conciliacion.depreciacionRegistrada+" · Libro mayor "+result.conciliacion.depreciacionEnLibroMayor+" · Diferencia "+result.conciliacion.diferencia;host.appendChild(rec);
  addTitle("Activos y vida útil");
  addTable(["Activo","Categoría","Costo","Residual","Acumulada","Valor neto","Vida transcurrida / restante","Mejoras","Fin estimado"],(result.activos||[]).map(x=>[x.activoId,x.categoria,x.costoCapitalizado,x.valorResidual,x.depreciacionAcumulada,x.valorNetoLibros,x.vidaUtilTranscurridaMeses+" / "+x.vidaUtilRestanteMeses+" meses",(x.mejorasCapitalizables||[]).length,String(x.fechaFinEstimada||"").slice(0,10)]));
  addTitle("Resumen anual");
  addTable(["Año","Depreciación","Períodos"],(result.resumenAnual||[]).map(x=>[x.anio,x.depreciacion,x.periodos]));
  addTitle("Calendario mensual");
  addTable(["Activo","Período","Método","Depreciación","Acumulada","Valor neto","Asiento","Estado"],(result.calendario||[]).map(r=>[r.activoId,r.periodo,r.metodo,r.depreciacionPeriodo,r.depreciacionAcumulada,r.valorNetoLibros,r.asientoId||"",r.estado]));
 }).catch(e=>{host.textContent=e.message||String(e);});
};

window.handleAsignarCustodia = function (activoId) {
  const custodio = prompt("Ingrese el UserId del custodio o empleado responsable (EJ: EMP-01):");
  if (!custodio) return;

  fetchApi('ACCOUNTING', 'assignAssetCustody', { activoId: activoId, custodioUserId: custodio })
    .then(res => {
      alert(res.message || "Custodia asignada correctamente.");
      loadActivosData();
    })
    .catch(err => alert("Error: " + err.message));
};

window.handleDevolverCustodia = function (activoId, codigoPatrimonial, nombre, custodioUserId) {
  const custodio = prompt(`Confirmar custodio que entrega el activo (${codigoPatrimonial} - ${nombre}):`, custodioUserId || "");
  if (!custodio) return;

  const receptor = prompt("UserId o nombre del responsable institucional que recibe el activo:", (window.currentUser && window.currentUser.userId) || "DIR-01");
  if (!receptor) return;

  const condicionPrompt = prompt("Condición física al reingreso (Nuevo, Bueno, Regular, Dañado, Incompleto, RequiereReparacion):", "Bueno");
  if (!condicionPrompt) return;

  const obs = prompt("Observaciones de la entrega / componentes o detalles:", "Devolución en orden y revisión conforme");

  fetchApi('ACCOUNTING', 'returnAssetCustody', {
    activoId: activoId,
    custodioUserId: custodio,
    recibidoPor: receptor,
    receptorUserId: receptor,
    estadoFisico: condicionPrompt,
    condicionRecepcion: condicionPrompt,
    observaciones: obs || "Recepción formal de custodia",
    ubicacionRecepcion: "Bodega General"
  })
    .then(res => {
      let msg = res.message || "Devolución registrada correctamente.";
      if (res.ordenMantenimientoId) {
        msg += `\nSe generó orden de mantenimiento: ${res.ordenMantenimientoId}`;
      }
      if (res.actaDevolucionId) {
        msg += `\nActa de Entrega-Recepción: ${res.actaDevolucionId}`;
      }
      alert(msg);
      loadActivosData();
    })
    .catch(err => alert("Error al devolver custodia: " + (err.message || err)));
};

// --- MANTENIMIENTO ---

function renderMantenimientoView(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <h5 class="font-black text-xs uppercase text-gray-800 mb-3"><i class="fas fa-tools text-amber-600"></i> Orden de Mantenimiento</h5>
        <form id="form-mantenimiento" onsubmit="handleSaveMantenimiento(event)" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-gray-600 mb-1">Activo / Ubicación Afecada *</label>
            <input type="text" id="mnt-activo" required class="w-full p-2 border border-gray-300 rounded-xl" placeholder="EJ: PAT-LAB-01 / Lab Cómputo">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Tipo Mantenimiento</label>
            <select id="mnt-tipo" class="w-full p-2 border border-gray-300 rounded-xl">
              <option value="Correctivo">Correctivo (Reparación de Falla)</option>
              <option value="Preventivo">Preventivo (Programado)</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Descripción de la Falla *</label>
            <textarea id="mnt-falla" required class="w-full p-2 border border-gray-300 rounded-xl" rows="2" placeholder="Describa el problema reportado..."></textarea>
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Prioridad</label>
            <select id="mnt-prioridad" class="w-full p-2 border border-gray-300 rounded-xl">
              <option value="Baja">Baja</option>
              <option value="Media" selected>Media</option>
              <option value="Alta">Alta / Urgente</option>
            </select>
          </div>
          <button type="submit" class="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all uppercase">
            Crear Orden
          </button>
        </form>
      </div>

      <div class="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-wrench text-amber-600"></i> Órdenes de Mantenimiento</h5>
          <button onclick="loadMantenimientoData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
        </div>
        <div id="mantenimiento-table-container" class="overflow-x-auto text-xs">
          <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando mantenimiento...</div>
        </div>
      </div>
    </div>
  `;
  loadMantenimientoData();
}

window.loadMantenimientoData = function () {
  const container = document.getElementById('mantenimiento-table-container');
  if (!container) return;

  fetchApi('ACCOUNTING', 'getMaintenanceOrders', {})
    .then(res => {
      const ords = (res && res.ordenes) ? res.ordenes : [];
      if (ords.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay órdenes de mantenimiento activas.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">ID Orden</th>
              <th class="p-2">Activo / Ubicación</th>
              <th class="p-2">Tipo</th>
              <th class="p-2">Descripción</th>
              <th class="p-2">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      ords.forEach(o => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-amber-600">${o.ordenMaintId}</td>
            <td class="p-2 font-bold text-gray-800">${o.activoIdUbicacion}</td>
            <td class="p-2 text-gray-500">${o.tipoMantenimiento}</td>
            <td class="p-2 text-gray-600">${o.descripcionFalla}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${o.estadoOrden === 'Resuelto' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${o.estadoOrden}</span></td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar mantenimientos: ${err.message}</div>`;
    });
};

window.handleSaveMantenimiento = function (e) {
  e.preventDefault();
  const payload = {
    activoIdUbicacion: document.getElementById('mnt-activo').value,
    tipoMantenimiento: document.getElementById('mnt-tipo').value,
    descripcionFalla: document.getElementById('mnt-falla').value,
    prioridad: document.getElementById('mnt-prioridad').value
  };

  fetchApi('ACCOUNTING', 'manageMaintenanceOrder', payload)
    .then(res => {
      alert(res.message || "Orden de mantenimiento creada con éxito.");
      document.getElementById('form-mantenimiento').reset();
      loadMantenimientoData();
    })
    .catch(err => alert("Error: " + err.message));
};

// --- BAJAS DE BIENES ---

function renderBajasView(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <h5 class="font-black text-xs uppercase text-gray-800 mb-3"><i class="fas fa-trash-alt text-rose-600"></i> Registrar Baja de Bien</h5>
        <form id="form-baja" onsubmit="handleSaveBaja(event)" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-gray-600 mb-1">Código / ID de Bien *</label>
            <input type="text" id="baj-codigo" required class="w-full p-2 border border-gray-300 rounded-xl font-bold" placeholder="EJ: PAT-LAB-01 / MAT-01">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Nombre de Bien</label>
            <input type="text" id="baj-nombre" class="w-full p-2 border border-gray-300 rounded-xl">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Tipo de Bien</label>
            <select id="baj-tipo" class="w-full p-2 border border-gray-300 rounded-xl">
              <option value="ActivoFijo">Activo Fijo Patrimonial</option>
              <option value="Inventario">Insumo / Material de Inventario</option>
            </select>
          </div>
          <div><label class="block font-bold text-gray-600 mb-1">Fecha efectiva de baja (cierre mensual para activos depreciables)</label><input type="date" id="baj-fecha" required class="w-full p-2 border border-gray-300 rounded-xl"></div><div><label class="block font-bold text-gray-600 mb-1">Valor de venta / recuperación</label><input type="number" min="0" step="0.01" value="0" id="baj-valor-venta" class="w-full p-2 border border-gray-300 rounded-xl"></div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Motivo de Baja *</label>
            <textarea id="baj-motivo" required class="w-full p-2 border border-gray-300 rounded-xl" rows="2" placeholder="Desuso, obsolescencia, daño irreparable..."></textarea>
          </div>
          <button type="submit" class="w-full py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all uppercase">
            Confirmar Baja
          </button>
        </form>
      </div>

      <div class="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-history text-rose-600"></i> Historial de Bajas Institucionales</h5>
          <button onclick="loadBajasData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
        </div>
        <div id="bajas-table-container" class="overflow-x-auto text-xs">
          <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando bajas...</div>
        </div>
      </div>
    </div>
  `;
  loadBajasData();
}

window.loadBajasData = function () {
  const container = document.getElementById('bajas-table-container');
  if (!container) return;

  fetchApi('ACCOUNTING', 'getAssetDisposals', {})
    .then(res => {
      const bjs = (res && res.bajas) ? res.bajas : [];
      if (bjs.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay registros de baja institucionales.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">ID Baja</th>
              <th class="p-2">Código Bien</th>
              <th class="p-2">Bien</th>
              <th class="p-2">Tipo</th>
              <th class="p-2">Motivo</th>
              <th class="p-2">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      bjs.forEach(b => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-rose-600">${b.bajaId}</td>
            <td class="p-2 font-mono font-bold text-gray-700">${b.bienIdCodigo}</td>
            <td class="p-2 font-bold text-gray-800">${b.nombreBien}</td>
            <td class="p-2 text-gray-500">${b.tipoBien}</td>
            <td class="p-2 text-gray-600">${b.motivoBaja}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">${b.estado}</span></td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar bajas: ${err.message}</div>`;
    });
};

window.handleSaveBaja = function (e) {
  e.preventDefault();
  const payload = {
    bienIdCodigo: document.getElementById('baj-codigo').value,
    nombreBien: document.getElementById('baj-nombre').value,
    tipoBien: document.getElementById('baj-tipo').value,
    motivoBaja: document.getElementById('baj-motivo').value,
    fechaBaja: document.getElementById('baj-fecha').value,
    valorVenta: Number(document.getElementById('baj-valor-venta').value || 0)
  };

  fetchApi('ACCOUNTING', 'registerAssetDisposal', payload)
    .then(res => {
      alert(res.message || "Baja registrada con éxito.");
      document.getElementById('form-baja').reset();
      loadBajasData();
    })
    .catch(err => alert("Error: " + err.message));
};

// --- OTROS MÓDULOS DEL PANEL CONTABLE ---

// [TASK-014] [F18-Task03] - Interfaz operativa completa del módulo de compras & proveedores
let currentComprasSubtab = 'solicitudes';

function renderComprasModule(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <!-- HEADER Y NAVEGACIÓN DE SUBPESTAÑAS -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
        <h4 class="text-base font-black uppercase text-gray-800 flex items-center gap-2">
          <i class="fas fa-shopping-cart text-purple-600"></i> Gestión de Compras & Proveedores (Fase 18)
        </h4>
        <div class="flex flex-wrap gap-2 text-xs font-bold uppercase">
          <button onclick="switchComprasSubtab('solicitudes')" id="btn-cmp-solicitudes" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-purple-600 text-white">Solicitudes</button>
          <button onclick="switchComprasSubtab('cotizaciones')" id="btn-cmp-cotizaciones" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Cotizaciones</button>
          <button onclick="switchComprasSubtab('ordenes')" id="btn-cmp-ordenes" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Órdenes de Compra</button>
          <button onclick="switchComprasSubtab('recepciones')" id="btn-cmp-recepciones" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Recepciones</button>
          <button onclick="switchComprasSubtab('threeway')" id="btn-cmp-threeway" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Three-Way Match</button>
          <button onclick="switchComprasSubtab('expediente')" id="btn-cmp-expediente" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Expediente 360°</button>
          <button onclick="switchComprasSubtab('proveedores')" id="btn-cmp-proveedores" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Proveedores</button>
        </div>
      </div>

      <!-- KPI METRICS SUMMARY -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="p-4 bg-purple-50 rounded-2xl border border-purple-100">
          <span class="text-xs uppercase font-bold text-purple-600 block">Solicitudes Pendientes</span>
          <span class="text-xl font-black text-purple-900" id="kpi-cmp-solicitudes">--</span>
        </div>
        <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <span class="text-xs uppercase font-bold text-blue-600 block">Órdenes por Entregar</span>
          <span class="text-xl font-black text-blue-900" id="kpi-cmp-ordenes">--</span>
        </div>
        <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <span class="text-xs uppercase font-bold text-amber-600 block">Entregas Parciales</span>
          <span class="text-xl font-black text-amber-900" id="kpi-cmp-parciales">--</span>
        </div>
        <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <span class="text-xs uppercase font-bold text-emerald-600 block">Conciliación 3-Vías</span>
          <span class="text-xl font-black text-emerald-900" id="kpi-cmp-conciliadas">Activa</span>
        </div>
      </div>

      <!-- CONTENEDOR DE SUBPESTAÑA DINÁMICA -->
      <div id="compras-subtab-container" class="space-y-4">
        <!-- Renderizado dinámico -->
      </div>
    </div>
  `;

  window.switchComprasSubtab('solicitudes');
}

window.switchComprasSubtab = function (subtab) {
  currentComprasSubtab = subtab;
  const tabs = ['solicitudes', 'cotizaciones', 'ordenes', 'recepciones', 'threeway', 'expediente', 'proveedores'];
  tabs.forEach(t => {
    const btn = document.getElementById(`btn-cmp-${t}`);
    if (btn) {
      if (t === subtab) {
        btn.className = "px-3 py-1.5 rounded-xl transition-all shadow-sm bg-purple-600 text-white";
      } else {
        btn.className = "px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100";
      }
    }
  });

  const subContainer = document.getElementById('compras-subtab-container');
  if (!subContainer) return;

  if (subtab === 'solicitudes') {
    renderComprasSolicitudesView(subContainer);
  } else if (subtab === 'cotizaciones') {
    renderComprasCotizacionesView(subContainer);
  } else if (subtab === 'ordenes') {
    renderComprasOrdenesView(subContainer);
  } else if (subtab === 'recepciones') {
    renderComprasRecepcionesView(subContainer);
  } else if (subtab === 'threeway') {
    renderComprasThreeWayView(subContainer);
  } else if (subtab === 'expediente') {
    renderComprasExpedienteView(subContainer);
  } else if (subtab === 'proveedores') {
    renderComprasProveedoresView(subContainer);
  }
};

function renderComprasExpedienteView(container){
  container.innerHTML='<div class="bg-white p-5 rounded-2xl border space-y-3"><h5 class="font-black text-sm">Expediente digital de adquisiciones · Trazabilidad 360°</h5><p class="text-xs text-gray-500">Buscar por solicitud, orden, factura o proveedor.</p><div class="flex gap-2"><input id="purchase-dossier-query" class="flex-1 p-3 border rounded-xl" placeholder="Número de solicitud, orden, factura o proveedor"><button onclick="searchPurchaseDossier()" class="px-4 py-3 bg-indigo-600 text-white rounded-xl">Buscar</button></div><div id="purchase-dossier-results"></div></div>';
}
window.registerPurchaseOrderConfirmationUI=function(orderId){const contactoProveedor=prompt("Nombre del contacto del proveedor");if(!contactoProveedor)return;const estadoConfirmacion=prompt("Estado: Confirmada, Rechazada o SolicitaCambios","Confirmada");if(!estadoConfirmacion)return;const canal=prompt("Canal: Correo, Portal, Telefono u Otro","Correo");if(!canal)return;const documentoUrl=prompt("Enlace HTTPS al correo o documento de confirmación (opcional)","")||"";const observaciones=prompt("Observaciones (opcional)","")||"";fetchBackendAccounting("recordPurchaseOrderConfirmation",{ordenCompraId:orderId,contactoProveedor,estadoConfirmacion,canal,documentoUrl,observaciones}).then(()=>{alert("Confirmación del proveedor registrada.");window.searchPurchaseDossier();}).catch(error=>alert("No se pudo registrar la confirmación: "+(error.message||error)));};
window.searchPurchaseDossier=function(){
  const query=document.getElementById("purchase-dossier-query").value.trim(),host=document.getElementById("purchase-dossier-results");if(!query||!host)return;host.textContent="Consultando...";
  fetchBackendAccounting("getPurchaseDossier",{query}).then(result=>{
    host.innerHTML="";
    (result.expedientes||[]).forEach(exp=>{
      const card=document.createElement("div");card.className="border rounded-xl p-4 my-3";
      const title=document.createElement("h6");title.className="font-black";title.textContent=exp.orden.ordenCompraId+" · "+exp.proveedor.nombre;card.appendChild(title);
      const m=exp.metricas||{},metrics=document.createElement("p");metrics.className="text-xs my-2";metrics.textContent="Pedidas "+m.cantidadPedida+" · Recibidas "+m.cantidadRecibida+" · Facturadas "+m.cantidadFacturada+" · Pendientes "+m.cantidadPendiente+" · Autorizado L "+m.importeAutorizado+" · Facturado L "+m.importeFacturado+" · Pagado L "+m.importePagado+" · Saldo L "+m.saldoPendiente;card.appendChild(metrics);const confirmationButton=document.createElement("button");confirmationButton.className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold";confirmationButton.textContent="Registrar confirmación del proveedor";confirmationButton.onclick=()=>window.registerPurchaseOrderConfirmationUI(exp.orden.ordenCompraId);card.appendChild(confirmationButton);
      (exp.timeline||[]).forEach(ev=>{const p=document.createElement("p");p.className="text-xs";p.textContent=ev.etapa+" · "+(ev.fecha?new Date(ev.fecha).toLocaleString():"Fecha no registrada")+" · "+ev.estado+" · "+ev.responsable;card.appendChild(p);});
      (exp.documentos||[]).forEach(doc=>{const a=document.createElement("a");a.href=doc.url;a.target="_blank";a.rel="noopener noreferrer";a.className="block text-xs text-indigo-600 underline";a.textContent=doc.nombre;card.appendChild(a);});
      if(exp.documentosRestringidos){const note=document.createElement("p");note.className="text-xs text-amber-700";note.textContent="Los enlaces documentales están restringidos para este rol.";card.appendChild(note);}
      (exp.facturas||[]).forEach(f=>{const p=document.createElement("p");p.className="text-xs";p.textContent="Factura "+f.numeroFactura+" · "+f.estadoPago+" · Total "+f.total+" · Pagado "+f.pagado+" · Saldo "+f.saldo;card.appendChild(p);});
      if(exp.adjudicacion){const a=document.createElement("p");a.className="text-xs";a.textContent="Adjudicación "+exp.adjudicacion.actaId+" · "+exp.adjudicacion.estado+" · "+exp.adjudicacion.justificacion;card.appendChild(a);}
      (exp.cotizaciones||[]).forEach(q=>{const p=document.createElement("p");p.className="text-xs";p.textContent="Cotización "+q.cotizacionId+" · "+q.estado+" · Total L "+q.precioTotal+" · Entrega "+q.plazoEntregaDias+" días · "+q.condicionesPago;card.appendChild(p);(q.detalle||[]).forEach(d=>{const line=document.createElement("p");line.className="text-xs pl-3";line.textContent="Partida "+d.itemId+" · "+d.descripcion+" · Solicitada "+d.cantidadSolicitada+" · Cotizada "+d.cantidadCotizada+" · Unitario L "+d.precioUnitario+" · Total L "+d.total+" · Cumplimiento "+d.especificacionesCumplidas;card.appendChild(line);});});
      (exp.cantidades||[]).forEach(q=>{const p=document.createElement("p");p.className="text-xs";p.textContent="Partida "+q.itemId+" · Pedida "+q.cantidadPedida+" · Recibida "+q.cantidadRecibida+" · Facturada "+q.cantidadFacturada+" · Pendiente "+q.cantidadPendiente;card.appendChild(p);});
      (exp.pagos||[]).forEach(pago=>{const p=document.createElement("p");p.className="text-xs";p.textContent="Pago "+pago.pagoRefId+" · "+pago.fecha+" · L "+pago.monto+" · "+pago.metodoPago+" · "+pago.referencia;card.appendChild(p);});
      (exp.asientos||[]).forEach(asiento=>{const p=document.createElement("p");p.className="text-xs";p.textContent="Asiento "+asiento.asientoId+" · "+asiento.fecha+" · "+asiento.descripcion+" · "+asiento.estado;card.appendChild(p);});
      host.appendChild(card);
    });
    if(!host.childElementCount)host.textContent="No se encontraron expedientes dentro del ámbito autorizado.";
  }).catch(error=>{host.textContent=error.message||String(error);});
};

function renderComprasSolicitudesView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h5 class="text-sm font-black uppercase text-gray-800">Solicitudes de Compra Institucionales</h5>
        <button onclick="openNewPurchaseRequestModal()" class="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-purple-700 shadow-sm flex items-center gap-2">
          <i class="fas fa-plus"></i> Nueva Solicitud
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-gray-700">
          <thead class="bg-gray-50 text-gray-500 uppercase font-black">
            <tr>
              <th class="p-3">ID Solicitud</th>
              <th class="p-3">Departamento</th>
              <th class="p-3">Justificación</th>
              <th class="p-3">Monto Est.</th>
              <th class="p-3">Estado</th>
              <th class="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody id="tbl-compras-solicitudes" class="divide-y divide-gray-100">
            <tr><td colspan="6" class="p-4 text-center text-gray-400">Cargando solicitudes de compra...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Cargar solicitudes de compra desde el backend
  fetchBackendAccounting('getPurchaseRequests', {})
    .then(res => {
      const tbody = document.getElementById('tbl-compras-solicitudes');
      const kpi = document.getElementById('kpi-cmp-solicitudes');
      if (!tbody) return;
      const list = res.solicitudes || [];
      if (kpi) kpi.innerText = list.filter(s => s.estadoAprobacion === 'PendienteAprobacion' || s.estadoAprobacion === 'Pendiente').length;

      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-400">No hay solicitudes de compra registradas.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map(s => `
        <tr class="hover:bg-gray-50">
          <td class="p-3 font-bold text-gray-900">${s.solicitudId}</td>
          <td class="p-3">${s.departamento || '-'}</td>
          <td class="p-3 max-w-xs truncate">${s.justificacion || '-'}</td>
          <td class="p-3 font-bold text-gray-900">L ${(parseFloat(s.montoEstimado || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="p-3"><span class="px-2 py-1 rounded-lg text-xs font-bold ${s.estadoAprobacion === 'Aprobada' ? 'bg-emerald-100 text-emerald-800' : (s.estadoAprobacion === 'Rechazada' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')}">${s.estadoAprobacion}</span></td>
          <td class="p-3 space-x-1">
            <button onclick="viewPurchaseRequestDetails('${s.solicitudId}')" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold text-[10px]">Detalle</button>
          </td>
        </tr>
      `).join('');
    })
    .catch(err => {
      const tbody = document.getElementById('tbl-compras-solicitudes');
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error al consultar solicitudes: ${err.message}</td></tr>`;
    });
}

function renderComprasCotizacionesView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h5 class="text-sm font-black uppercase text-gray-800">Cotizaciones & Cuadro Comparativo de Ofertas</h5>
      </div>
      <p class="text-xs text-gray-600">Registro de ofertas de proveedores, comparación de precios y adjudicación formal.</p>
      <div class="rounded-xl border border-gray-200 p-4 space-y-3"><h6 class="font-black text-xs uppercase text-gray-700">Registrar cotización detallada</h6><div class="grid md:grid-cols-4 gap-2"><label class="text-xs font-bold">Solicitud<input id="cmp-entry-request-id" class="mt-1 w-full rounded-lg border p-2" placeholder="REQ-CMP-..."></label><label class="text-xs font-bold">Proveedor ID<input id="cmp-entry-supplier-id" class="mt-1 w-full rounded-lg border p-2" placeholder="PRV-..."></label><label class="text-xs font-bold">Entrega (días)<input id="cmp-entry-delivery-days" type="number" min="0" value="5" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold">Vigencia<input id="cmp-entry-validity" value="30 días" class="mt-1 w-full rounded-lg border p-2"></label><label class="text-xs font-bold md:col-span-2">Condiciones de pago<input id="cmp-entry-payment-terms" value="Contado" class="mt-1 w-full rounded-lg border p-2"></label></div><button id="btn-cmp-entry-load" class="px-3 py-2 rounded-lg bg-gray-800 text-white text-xs font-bold">Cargar partidas de la solicitud</button><div id="cmp-entry-lines" class="space-y-2"></div></div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-gray-700">
          <thead class="bg-gray-50 text-gray-500 uppercase font-black">
            <tr>
              <th class="p-3">Cotización ID</th>
              <th class="p-3">Solicitud</th>
              <th class="p-3">Proveedor</th>
              <th class="p-3">Precio Ofertado</th>
              <th class="p-3">Plazo Entrega</th>
              <th class="p-3">Estado Selección</th>
            </tr>
          </thead>
          <tbody id="tbl-compras-cotizaciones" class="divide-y divide-gray-100">
            <tr><td colspan="6" class="p-4 text-center text-gray-400">Cargando cotizaciones...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-3"><div class="flex flex-wrap gap-2 items-end"><label class="text-xs font-bold text-gray-700 flex-1 min-w-48">ID de solicitud para comparar<input id="cmp-matrix-request-id" class="mt-1 w-full rounded-lg border border-gray-300 p-2" placeholder="REQ-CMP-..."></label><button id="btn-cmp-load-matrix" class="px-4 py-2 rounded-lg bg-purple-700 text-white text-xs font-bold">Comparar hasta 5 proveedores</button></div><div id="cmp-matrix-result" class="space-y-3 text-xs text-gray-700"></div></div>
    </div>
  `;

  const entryLoad=document.getElementById('btn-cmp-entry-load');if(entryLoad)entryLoad.addEventListener('click',()=>window.loadPurchaseQuotationEntry());
  const matrixButton=document.getElementById('btn-cmp-load-matrix');
  if(matrixButton)matrixButton.addEventListener('click',()=>window.loadPurchaseQuotationMatrix());
  const requestInput=document.getElementById('cmp-matrix-request-id');
  if(requestInput)requestInput.addEventListener('keydown',event=>{if(event.key==='Enter')window.loadPurchaseQuotationMatrix();});
  fetchBackendAccounting('getPurchaseQuotations', {})
    .then(res => {
      const tbody = document.getElementById('tbl-compras-cotizaciones');
      if (!tbody) return;
      const list = res.cotizaciones || [];
      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-400">No hay cotizaciones registradas.</td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(c => `
        <tr class="hover:bg-gray-50">
          <td class="p-3 font-bold text-gray-900">${c.cotizacionId}</td>
          <td class="p-3">${c.solicitudId}</td>
          <td class="p-3">${c.proveedorId}</td>
          <td class="p-3 font-bold text-gray-900">L ${(parseFloat(c.precioTotal || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="p-3">${c.plazoEntregaDias ? c.plazoEntregaDias + ' días' : '-'}</td>
          <td class="p-3"><span class="px-2 py-1 rounded-lg text-xs font-bold ${c.estadoSelection === 'Adjudicada' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}">${c.estadoSelection || 'Registrada'}</span></td>
        </tr>
      `).join('');
    })
    .catch(err => {
      const tbody = document.getElementById('tbl-compras-cotizaciones');
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error: ${err.message}</td></tr>`;
    });
}



window.loadPurchaseQuotationEntry=async function(){
 const requestId=document.getElementById('cmp-entry-request-id'),supplierId=document.getElementById('cmp-entry-supplier-id'),target=document.getElementById('cmp-entry-lines');
 if(!target||!String(requestId&&requestId.value||'').trim()||!String(supplierId&&supplierId.value||'').trim()){if(target)target.textContent='Ingrese la solicitud y el proveedor.';return;}
 target.textContent='Cargando partidas solicitadas...';
 try{const matrix=await fetchBackendAccounting('getPurchaseQuotationMatrix',{solicitudId:requestId.value.trim()});if(!matrix||matrix.status!=='success')throw new Error(matrix&&matrix.message||'No se pudo cargar la solicitud.');window.renderPurchaseQuotationEntry(matrix,target);}
 catch(error){target.textContent=error.message||'Error al cargar las partidas.';}
};
window.renderPurchaseQuotationEntry=function(matrix,target){
 target.replaceChildren();
 const addText=(parent,value,tag='div',cls='')=>{const el=document.createElement(tag);el.className=cls;el.textContent=String(value==null?'':value);parent.appendChild(el);return el;};
 if(matrix.adjudicada){addText(target,'La solicitud ya fue adjudicada; no admite nuevas cotizaciones.','div','text-amber-700 font-bold');return;}
 const tableWrap=document.createElement('div');tableWrap.className='overflow-x-auto';
 const table=document.createElement('table');table.className='min-w-full text-left text-[11px]';
 const header=document.createElement('tr');['Partida','Cantidad solicitada','Cantidad ofertada','Precio unitario','Descuento','Impuestos','Flete','Garantía','Cumplimiento técnico','Total'].forEach(v=>addText(header,v,'th','p-2 bg-gray-100'));table.appendChild(header);
 matrix.partidas.forEach(part=>{
  const tr=document.createElement('tr');tr.className='cmp-quote-line border-b';tr.dataset.itemId=part.itemId;
  addText(tr,part.descripcion+' · '+part.itemId,'td','p-2 font-bold');
  addText(tr,part.cantidadSolicitada+' '+part.unidad,'td','p-2');
  const makeInput=(type,value)=>{const input=document.createElement('input');input.type=type;input.value=String(value);input.className='w-24 rounded border p-1';if(type==='number'){input.min='0';input.step='0.01';}input.addEventListener('input',()=>window.updatePurchaseQuotationEntryTotal(tr));return input;};
  const qty=makeInput('number',part.cantidadSolicitada);qty.max=String(part.cantidadSolicitada);qty.dataset.field='cantidadCotizada';
  const unit=makeInput('number','0');unit.dataset.field='precioUnitario';
  const discount=makeInput('number','0');discount.dataset.field='descuento';
  const tax=makeInput('number','0');tax.dataset.field='impuestos';
  const freight=makeInput('number','0');freight.dataset.field='flete';
  [qty,unit,discount,tax,freight].forEach((input,index)=>{if(index===0){const cell=document.createElement('td');cell.className='p-2';cell.appendChild(input);tr.appendChild(cell);}else{const cell=document.createElement('td');cell.className='p-2';cell.appendChild(input);tr.appendChild(cell);}});
  const warrantyCell=document.createElement('td');warrantyCell.className='p-2';const warranty=document.createElement('input');warranty.className='w-28 rounded border p-1';warranty.placeholder='Garantía';warranty.dataset.field='garantia';warrantyCell.appendChild(warranty);tr.appendChild(warrantyCell);
  const complianceCell=document.createElement('td');complianceCell.className='p-2';const compliance=document.createElement('select');compliance.className='rounded border p-1';compliance.dataset.field='cumplimientoTecnico';[['','Evaluar'],['Cumple','Cumple'],['No cumple','No cumple'],['Parcial','Parcial']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;compliance.appendChild(o);});complianceCell.appendChild(compliance);tr.appendChild(complianceCell);
  const totalCell=document.createElement('td');totalCell.className='p-2 font-bold';totalCell.dataset.lineTotal='1';totalCell.textContent='L 0.00';tr.appendChild(totalCell);table.appendChild(tr);
 });
 tableWrap.appendChild(table);target.appendChild(tableWrap);
 const total=document.createElement('div');total.id='cmp-entry-grand-total';total.className='text-right font-black text-gray-800';total.textContent='Total ofertado: L 0.00';target.appendChild(total);
 const submit=document.createElement('button');submit.type='button';submit.className='px-4 py-2 rounded-lg bg-purple-700 text-white text-xs font-bold';submit.textContent='Registrar cotización';submit.addEventListener('click',()=>window.submitPurchaseQuotationEntry(matrix,target,submit));target.appendChild(submit);
};
window.updatePurchaseQuotationEntryTotal=function(row){
 const get=name=>Number(row.querySelector('[data-field="'+name+'"]').value||0),qty=get('cantidadCotizada'),unit=get('precioUnitario'),discount=get('descuento'),tax=get('impuestos'),freight=get('flete'),total=Math.round((qty*unit-discount+tax+freight)*100)/100;
 row.querySelector('[data-line-total]').textContent='L '+total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 const grand=[...document.querySelectorAll('#cmp-entry-lines [data-line-total]')].reduce((sum,cell)=>sum+Number(cell.closest('tr').querySelector('[data-field="cantidadCotizada"]').value||0)*Number(cell.closest('tr').querySelector('[data-field="precioUnitario"]').value||0)-Number(cell.closest('tr').querySelector('[data-field="descuento"]').value||0)+Number(cell.closest('tr').querySelector('[data-field="impuestos"]').value||0)+Number(cell.closest('tr').querySelector('[data-field="flete"]').value||0),0);
 const target=document.getElementById('cmp-entry-grand-total');if(target)target.textContent='Total ofertado: L '+Math.round(grand*100)/100;
};
window.submitPurchaseQuotationEntry=async function(matrix,target,button){
 const rows=[...target.querySelectorAll('.cmp-quote-line')],details=rows.map(row=>{const value=name=>row.querySelector('[data-field="'+name+'"]').value;return {itemId:row.dataset.itemId,cantidadCotizada:Number(value('cantidadCotizada')),precioUnitario:Number(value('precioUnitario')),descuento:Number(value('descuento')||0),impuestos:Number(value('impuestos')||0),flete:Number(value('flete')||0),garantia:value('garantia'),cumplimientoTecnico:value('cumplimientoTecnico'),especificacionesCumplidas:value('cumplimientoTecnico')==='Cumple'};});
 const total=Math.round(details.reduce((sum,line)=>sum+line.cantidadCotizada*line.precioUnitario-line.descuento+line.impuestos+line.flete,0)*100)/100;
 const payload={solicitudId:matrix.solicitud.solicitudId,proveedorId:document.getElementById('cmp-entry-supplier-id').value.trim(),precioTotal:total,detalleItems:details,plazoEntregaDias:Number(document.getElementById('cmp-entry-delivery-days').value||5),vigenciaOferta:document.getElementById('cmp-entry-validity').value.trim(),condicionesPago:document.getElementById('cmp-entry-payment-terms').value.trim()};
 button.disabled=true;button.textContent='Registrando...';
 try{const result=await fetchBackendAccounting('submitPurchaseQuotation',payload);if(!result||result.status!=='success')throw new Error(result&&result.message||result&&result.code||'No se pudo registrar la cotización.');const message=document.createElement('div');message.className='rounded-lg bg-emerald-50 text-emerald-800 p-2 font-bold';message.textContent='Cotización '+result.cotizacionId+' registrada. Total: L '+total.toFixed(2);target.appendChild(message);window.switchComprasSubtab('cotizaciones');}
 catch(error){const message=document.createElement('div');message.className='rounded-lg bg-red-50 text-red-700 p-2';message.textContent=error.message||'Error al registrar cotización.';target.appendChild(message);button.disabled=false;button.textContent='Registrar cotización';}
};

window.loadPurchaseQuotationMatrix=async function(){
 const requestInput=document.getElementById('cmp-matrix-request-id'),target=document.getElementById('cmp-matrix-result'),solicitudId=String(requestInput&&requestInput.value||'').trim();
 if(!target||!solicitudId){if(target)target.textContent='Ingrese el ID de una solicitud de compra.';return;}
 target.textContent='Cargando matriz comparativa...';
 try{const result=await fetchBackendAccounting('getPurchaseQuotationMatrix',{solicitudId:solicitudId});if(!result||result.status!=='success')throw new Error(result&&result.message||'No se pudo consultar la matriz.');window.renderPurchaseQuotationMatrix(result,target);}
 catch(error){target.textContent=error.message||'Error al consultar cotizaciones.';}
};
window.renderPurchaseQuotationMatrix=function(matrix,target){
 target.replaceChildren();
 const addText=(parent,value,tag='div',className='')=>{const el=document.createElement(tag);el.className=className;el.textContent=String(value==null?'':value);parent.appendChild(el);return el;};
 const money=value=>'L '+Number(value||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 addText(target,'Solicitud '+matrix.solicitud.solicitudId+' · '+matrix.solicitud.departamento+' · '+matrix.totalCotizaciones+' cotización(es)','div','font-bold text-gray-800');
 if(matrix.advertencia)addText(target,matrix.advertencia,'div','rounded-lg bg-amber-50 text-amber-800 p-2');
 if(matrix.adjudicada){addText(target,'Esta solicitud ya tiene acta de adjudicación '+matrix.actaId+'. La matriz muestra la instantánea aprobada y queda en modo consulta.','div','rounded-lg bg-emerald-50 text-emerald-800 p-2');const award=matrix.adjudicacion||{};addText(target,'Fecha: '+(award.fecha?new Date(award.fecha).toLocaleString():'-')+' · Monto adjudicado: '+money(award.montoAdjudicado),'div','font-bold text-gray-800');addText(target,'Responsables: '+(award.responsablesEvaluacion||[]).join(', '),'div','text-gray-700');addText(target,'Dictamen: '+(award.dictamen||''),'div','text-gray-700');addText(target,'Justificación: '+(award.justificacion||''),'div','text-gray-700');(award.ordenes||[]).forEach(order=>addText(target,'Orden '+order.ordenCompraId+' · Proveedor '+order.proveedorId+' · '+money(order.montoTotal),'div','text-gray-700'));(award.ofertasDescartadas||[]).forEach(offer=>addText(target,'Oferta descartada '+offer.cotizacionId+': '+offer.motivo,'div','text-amber-700'));}
 if(!matrix.cotizaciones.length){addText(target,'No hay cotizaciones registradas para esta solicitud.','div','text-gray-500');return;}
 const wrapper=document.createElement('div');wrapper.className='overflow-x-auto border border-gray-200 rounded-xl';
 const table=document.createElement('table');table.className='min-w-full text-left text-[11px]';
 const head=document.createElement('tr');['Partida solicitada','Cantidad',...matrix.cotizaciones.map(q=>(q.proveedorNombre||q.proveedorId)+' · '+q.cotizacionId+' · '+money(q.precioTotal)+' · '+q.plazoEntregaDias+' días · '+q.condicionesPago)].forEach(v=>addText(head,v,'th','p-2 bg-gray-100 border-b font-black text-gray-700'));table.appendChild(head);
 matrix.partidas.forEach(part=>{
  const tr=document.createElement('tr');tr.className='border-b align-top';addText(tr,part.descripcion+(part.especificaciones?' · '+part.especificaciones:''),'td','p-2 font-bold');addText(tr,part.cantidadSolicitada+' '+part.unidad,'td','p-2');
  part.ofertas.forEach(offer=>{
   const cell=document.createElement('td');cell.className='p-2 min-w-44 border-l align-top';
   if(offer.estadoOferta==='NO_COTIZADA'){addText(cell,'No cotizada','div','font-bold text-red-700');}
   else{
    addText(cell,offer.estadoOferta==='PARCIAL'?'Cotización parcial':'Cotización completa','div',offer.estadoOferta==='PARCIAL'?'font-bold text-amber-700':'font-bold text-gray-800');
    addText(cell,'Cantidad: '+offer.cantidadCotizada+' / '+offer.cantidadSolicitada);
    addText(cell,'Unitario: '+money(offer.precioUnitario));
    addText(cell,'Subtotal: '+money(offer.subtotal));
    addText(cell,'Descuento: '+money(offer.descuento)+' · Impuestos: '+money(offer.impuestos));
    addText(cell,'Flete: '+money(offer.flete)+' · Total: '+money(offer.total));
    addText(cell,'Garantía: '+(offer.garantia||'No indicada'));
    addText(cell,'Técnico: '+(offer.cumplimientoTecnico||'Sin dictamen'));
    addText(cell,offer.menorPrecio?'Menor costo unitario total':(offer.vigente?'':'Oferta vencida'),'div',offer.menorPrecio?'text-emerald-700 font-bold':'text-gray-500');
    if(!offer.vigente)addText(cell,'Oferta vencida','div','text-red-700 font-bold');if(!offer.proveedorActivo)addText(cell,'Proveedor inactivo','div','text-red-700 font-bold');
    const selectLabel=document.createElement('label');selectLabel.className='flex items-center gap-1 mt-2 font-bold';
    const check=document.createElement('input');check.type='checkbox';check.dataset.quoteId=offer.cotizacionId;check.dataset.itemId=part.itemId;check.disabled=matrix.adjudicada||!offer.vigente||!offer.proveedorActivo||!offer.especificacionesCumplidas;selectLabel.appendChild(check);selectLabel.appendChild(document.createTextNode('Adjudicar'));
    cell.appendChild(selectLabel);
    const qty=document.createElement('input');qty.type='number';qty.min='0.01';qty.max=String(offer.cantidadCotizada);qty.step='0.01';qty.value=String(Math.min(part.cantidadSolicitada,offer.cantidadCotizada));qty.className='mt-1 w-full rounded border p-1';qty.dataset.quoteId=offer.cotizacionId;qty.dataset.itemId=part.itemId;qty.disabled=check.disabled;addText(cell,'Cantidad a adjudicar','label','mt-1 text-gray-500');cell.appendChild(qty);
   }
   tr.appendChild(cell);
  });
  table.appendChild(tr);
 });
 wrapper.appendChild(table);target.appendChild(wrapper);
 if(matrix.adjudicada)return;
 const form=document.createElement('div');form.className='grid md:grid-cols-2 gap-2 rounded-xl border border-gray-200 p-3';
 const dictamen=document.createElement('textarea');dictamen.id='cmp-award-dictamen';dictamen.placeholder='Dictamen de evaluación (obligatorio)';dictamen.className='rounded-lg border p-2 min-h-20';
 const justification=document.createElement('textarea');justification.id='cmp-award-justification';justification.placeholder='Justificación de la decisión y excepciones al menor precio (obligatoria)';justification.className='rounded-lg border p-2 min-h-20';
 const rejected=document.createElement('textarea');rejected.id='cmp-award-rejection';rejected.placeholder='Motivo para descartar ofertas no seleccionadas (obligatorio)';rejected.className='rounded-lg border p-2 min-h-16 md:col-span-2';
 const responsible=document.createElement('input');responsible.id='cmp-award-responsibles';responsible.placeholder='Responsables de evaluación (IDs separados por coma; el usuario autenticado se agrega automáticamente)';responsible.className='rounded-lg border p-2 md:col-span-2';
 form.append(dictamen,justification,rejected,responsible);target.appendChild(form);
 const button=document.createElement('button');button.type='button';button.className='px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold';button.textContent='Emitir acta y generar órdenes por proveedor';button.addEventListener('click',async()=>{
  const selected=[...target.querySelectorAll('input[type="checkbox"][data-quote-id]:checked')],allocations=selected.map(check=>{const cell=check.closest('td'),qty=cell&&cell.querySelector('input[type="number"]');return {itemId:check.dataset.itemId,cotizacionId:check.dataset.quoteId,cantidadAdjudicada:Number(qty&&qty.value||0)};});
  const used=new Set(allocations.map(x=>x.cotizacionId)),rejections=matrix.cotizaciones.filter(q=>!used.has(q.cotizacionId)).map(q=>({cotizacionId:q.cotizacionId,motivo:rejected.value.trim()}));
  const payload={solicitudId:matrix.solicitud.solicitudId,adjudicaciones:allocations,dictamen:dictamen.value.trim(),justificacion:justification.value.trim(),responsablesEvaluacion:responsible.value.split(',').map(x=>x.trim()).filter(Boolean),ofertasDescartadas:rejections,idempotencyKey:'AWARD-'+matrix.solicitud.solicitudId+'-'+(window.crypto&&window.crypto.randomUUID?window.crypto.randomUUID():Date.now()+'-'+Math.random())};
  button.disabled=true;button.textContent='Registrando adjudicación...';
  try{const response=await fetchBackendAccounting('adjudicatePurchaseQuotations',payload);if(!response||response.status!=='success')throw new Error(response&&response.message||response&&response.code||'No se pudo adjudicar.');addText(target,'Acta '+response.actaId+' creada. Órdenes en borrador: '+response.ordenes.map(o=>o.ordenCompraId).join(', '),'div','rounded-lg bg-emerald-50 text-emerald-800 p-3 font-bold');window.loadPurchaseQuotationMatrix();}
  catch(error){addText(target,error.message||'Error al adjudicar.','div','rounded-lg bg-red-50 text-red-700 p-2');button.disabled=false;button.textContent='Emitir acta y generar órdenes por proveedor';}
 });
 target.appendChild(button);
};

function renderComprasOrdenesView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h5 class="text-sm font-black uppercase text-gray-800">Órdenes de Compra Emitidas</h5>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-gray-700">
          <thead class="bg-gray-50 text-gray-500 uppercase font-black">
            <tr>
              <th class="p-3">Orden ID</th>
              <th class="p-3">Proveedor</th>
              <th class="p-3">Monto Total</th>
              <th class="p-3">Fecha Entrega Est.</th>
              <th class="p-3">Estado Orden</th>
            </tr>
          </thead>
          <tbody id="tbl-compras-ordenes" class="divide-y divide-gray-100">
            <tr><td colspan="5" class="p-4 text-center text-gray-400">Cargando órdenes de compra...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  fetchBackendAccounting('getPurchaseOrders', {})
    .then(res => {
      const tbody = document.getElementById('tbl-compras-ordenes');
      const kpi = document.getElementById('kpi-cmp-ordenes');
      const kpiParcial = document.getElementById('kpi-cmp-parciales');
      if (!tbody) return;
      const list = res.ordenes || [];
      if (kpi) kpi.innerText = list.filter(o => o.estadoOrden !== 'RecibidaTotal' && o.estadoOrden !== 'Cancelada').length;
      if (kpiParcial) kpiParcial.innerText = list.filter(o => o.estadoOrden === 'RecibidaParcial').length;

      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400">No hay órdenes de compra registradas.</td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(o => `
        <tr class="hover:bg-gray-50">
          <td class="p-3 font-bold text-gray-900">${o.ordenId}</td>
          <td class="p-3">${o.proveedorId}</td>
          <td class="p-3 font-bold text-gray-900">L ${(parseFloat(o.montoTotal || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="p-3">${o.fechaEntregaEstimada ? new Date(o.fechaEntregaEstimada).toLocaleDateString() : '-'}</td>
          <td class="p-3">
            <span class="px-2 py-1 rounded-lg text-xs font-bold ${
              o.estadoOrden === 'RecibidaTotal' ? 'bg-emerald-100 text-emerald-800' :
              o.estadoOrden === 'RecibidaParcial' ? 'bg-amber-100 text-amber-800' :
              o.estadoOrden === 'Aprobada' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
            }">${o.estadoOrden}</span>
          </td>
        </tr>
      `).join('');
    })
    .catch(err => {
      const tbody = document.getElementById('tbl-compras-ordenes');
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error: ${err.message}</td></tr>`;
    });
}

function renderComprasRecepcionesView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3"><h5 class="text-sm font-black uppercase text-gray-800">Recepciones de Mercancía en Almacén</h5></div>
      <p class="text-xs text-gray-600">Entregas escalonadas, control de faltantes y capitalización de bienes duraderos recibidos conforme.</p>
      <div class="overflow-x-auto"><table class="w-full text-left text-xs text-gray-700">
        <thead class="bg-gray-50 text-gray-500 uppercase font-black"><tr><th class="p-3">Recepción ID</th><th class="p-3">Orden Compra</th><th class="p-3">Fecha</th><th class="p-3">Receptor</th><th class="p-3">Conformidad</th><th class="p-3">Activos</th></tr></thead>
        <tbody id="tbl-compras-recepciones" class="divide-y divide-gray-100"><tr><td colspan="6" class="p-4 text-center text-gray-400">Cargando recepciones...</td></tr></tbody>
      </table></div>
    </div>`;
  fetchBackendAccounting("getPurchaseReceipts",{}).then(res=>{
    const tbody=document.getElementById("tbl-compras-recepciones");if(!tbody)return;
    const list=res.recepciones||[];
    if(!list.length){tbody.innerHTML='<tr><td colspan="6" class="p-4 text-center text-gray-400">No hay recepciones físicas registradas.</td></tr>';return;}
    tbody.innerHTML=list.map(r=>`<tr class="hover:bg-gray-50" data-receipt-id="${escapePurchaseAssetHtml(r.recepcionId)}">
      <td class="p-3 font-bold text-gray-900">${escapePurchaseAssetHtml(r.recepcionId)}</td>
      <td class="p-3 font-semibold text-purple-700">${escapePurchaseAssetHtml(r.ordenCompraId)}</td>
      <td class="p-3">${r.fechaRecepcion?new Date(r.fechaRecepcion).toLocaleString():"-"}</td>
      <td class="p-3">${escapePurchaseAssetHtml(r.receptorUserId)}</td>
      <td class="p-3">${escapePurchaseAssetHtml(r.estadoConformidad)}</td>
      <td class="p-3">${r.estadoConformidad==="Conforme"?`<button onclick="openReceiptAssetRegistration(${purchaseAssetJsArg(r.recepcionId)})" class="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-bold">Registrar activos</button>`:"—"}</td>
    </tr>`).join("");
    if(window.pendingPurchaseReceiptFocus){const target=Array.from(tbody.querySelectorAll("[data-receipt-id]")).find(row=>row.dataset.receiptId===window.pendingPurchaseReceiptFocus);if(target){target.scrollIntoView({behavior:"smooth",block:"center"});window.pendingPurchaseReceiptFocus="";}}
  }).catch(err=>{const tbody=document.getElementById("tbl-compras-recepciones");if(tbody)tbody.innerHTML='<tr><td colspan="6" class="p-4 text-center text-red-500">Error: '+escapePurchaseAssetHtml(err.message)+'</td></tr>';});
}
function escapePurchaseAssetHtml(value){return String(value==null?"":value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function purchaseAssetJsArg(value){return JSON.stringify(String(value==null?"":value)).replace(/&/g,"\\u0026").replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/"/g,"&quot;");}
window.openReceiptAssetRegistration=function(recepcionId){
  fetchBackendAccounting("getPurchaseReceiptAssetCandidates",{recepcionId}).then(result=>{
    const candidates=(result.candidatos||[]).filter(item=>item.unidadesDisponibles>0);
    if(!candidates.length){alert("Esta recepción no tiene unidades capitalizables conformes pendientes de registrar.");return;}
    if(!result.facturasDisponibles||!result.facturasDisponibles.length){alert("No existe una factura de proveedor aprobada y conciliada vinculada a esta orden. Registre y concilie la factura antes de capitalizar.");return;}
    const rows=[];
    candidates.forEach(candidate=>{for(let i=0;i<Math.min(candidate.unidadesDisponibles,100);i++)rows.push({itemId:candidate.itemId,descripcion:candidate.descripcion,costo:candidate.costoUnitarioAdquisicion});});
    const modal=document.createElement("div");modal.id="receipt-asset-modal";modal.className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-3";
    const invoiceOptions=result.facturasDisponibles.map(invoice=>`<option value="${escapePurchaseAssetHtml(invoice.numeroFactura)}">${escapePurchaseAssetHtml(invoice.numeroFactura)} — ${escapePurchaseAssetHtml(invoice.estadoConciliacion)}</option>`).join("");
    const cards=rows.map((item,index)=>`<div data-asset-row data-item-id="${escapePurchaseAssetHtml(item.itemId)}" class="border rounded-xl p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
      <div class="md:col-span-4 text-xs font-bold">${escapePurchaseAssetHtml(item.descripcion)} · Partida ${escapePurchaseAssetHtml(item.itemId)} · Costo unitario ${Number(item.costo||0).toFixed(2)}</div>
      <label class="text-[10px] font-bold">Código patrimonial<input data-field="codigoPatrimonial" class="w-full mt-1 p-2 border rounded-lg" placeholder="PAT-0001"></label>
      <label class="text-[10px] font-bold">Número de serie<input data-field="numeroSerie" class="w-full mt-1 p-2 border rounded-lg" placeholder="Serie única"></label>
      <label class="text-[10px] font-bold">Categoría patrimonial<input data-field="categoriaPatrimonial" class="w-full mt-1 p-2 border rounded-lg" placeholder="Equipo computacional"></label>
      <label class="text-[10px] font-bold">Marca<input data-field="marca" class="w-full mt-1 p-2 border rounded-lg" placeholder="Marca"></label>
      <label class="text-[10px] font-bold">Modelo<input data-field="modelo" class="w-full mt-1 p-2 border rounded-lg" placeholder="Modelo"></label>
      <label class="text-[10px] font-bold">Ubicación inicial<input data-field="ubicacionActual" class="w-full mt-1 p-2 border rounded-lg" placeholder="Ubicación física"></label>
      <label class="text-[10px] font-bold md:col-span-2">Custodio inicial (opcional)<input data-field="custodioUserId" class="w-full mt-1 p-2 border rounded-lg" placeholder="UserId"></label>
    </div>`).join("");
    modal.innerHTML=`<div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto p-5 space-y-4">
      <div class="flex justify-between items-center"><h3 class="font-black text-sm uppercase">Capitalizar bienes recibidos</h3><button type="button" onclick="closeReceiptAssetModal()" class="text-xl text-gray-500">×</button></div>
      <p class="text-xs text-gray-600">Cada fila representa una unidad física. Las unidades incompletas se omiten; no se capitalizan consumibles, materiales ni artículos dañados.</p>
      <label class="block text-xs font-bold">Factura aprobada y conciliada *<select id="receipt-asset-invoice" class="w-full mt-1 p-2 border rounded-lg">${invoiceOptions}</select></label>
      <form id="receipt-asset-form" onsubmit="submitReceiptAssetRegistration(event,${purchaseAssetJsArg(recepcionId)})" class="space-y-3">${cards}
        <div class="flex justify-end gap-2"><button type="button" onclick="closeReceiptAssetModal()" class="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold">Cancelar</button><button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Registrar activos seleccionados</button></div>
      </form></div>`;
    document.body.appendChild(modal);
  }).catch(error=>alert("No se pudo consultar la recepción: "+(error.message||error)));
};
window.openPurchaseReceiptRecord=function(receiptId){window.pendingPurchaseReceiptFocus=String(receiptId||"");switchComprasSubtab("recepciones");};
window.closeReceiptAssetModal=function(){document.getElementById("receipt-asset-modal")?.remove();};
window.submitReceiptAssetRegistration=function(event,recepcionId){
  event.preventDefault();const rows=Array.from(document.querySelectorAll("#receipt-asset-form [data-asset-row]")),assets=[];
  for(const row of rows){
    const read=field=>row.querySelector('[data-field="'+field+'"]')?.value?.trim()||"";
    const values={codigoPatrimonial:read("codigoPatrimonial"),numeroSerie:read("numeroSerie"),categoriaPatrimonial:read("categoriaPatrimonial"),marca:read("marca"),modelo:read("modelo"),ubicacionActual:read("ubicacionActual"),custodioUserId:read("custodioUserId")};
    if(!Object.values(values).some(Boolean))continue;
    if(!values.codigoPatrimonial||!values.numeroSerie||!values.categoriaPatrimonial||!values.marca||!values.modelo||!values.ubicacionActual){alert("Complete todos los datos obligatorios de cada unidad seleccionada.");return;}
    assets.push({...values,itemId:row.dataset.itemId});
  }
  if(!assets.length){alert("Complete al menos una unidad.");return;}
  const payload={recepcionId,numeroFactura:document.getElementById("receipt-asset-invoice").value,activos:assets};
  const submit=document.querySelector("#receipt-asset-form button[type='submit']");if(submit)submit.disabled=true;
  fetchBackendAccounting("registerAssetsFromPurchaseReceipt",payload).then(result=>{alert(result.message||"Activos registrados.");closeReceiptAssetModal();switchComprasSubtab("recepciones");}).catch(error=>{if(submit)submit.disabled=false;alert("No se pudieron registrar los activos: "+(error.message||error));});
};

function renderComprasThreeWayView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h5 class="text-sm font-black uppercase text-gray-800">Conciliación Documental de Tres Vías (Three-Way Match)</h5>
      </div>
      <p class="text-xs text-gray-600">Validación cruzada entre Orden de Compra, Recepciones Físicas en Bodega y Factura Fiscal del Proveedor.</p>

      <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block text-[10px] font-bold uppercase text-gray-500 mb-1">Orden de Compra ID</label>
          <input type="text" id="inp-match-orden" placeholder="ORD-CMP-..." class="w-full text-xs p-2.5 rounded-lg border border-gray-300">
        </div>
        <div>
          <label class="block text-[10px] font-bold uppercase text-gray-500 mb-1">Número Factura Proveedor</label>
          <input type="text" id="inp-match-factura" placeholder="000-001-01-..." class="w-full text-xs p-2.5 rounded-lg border border-gray-300">
        </div>
        <div class="flex items-end">
          <button onclick="executeThreeWayMatchTest()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase rounded-lg shadow-sm">
            <i class="fas fa-check-double mr-1"></i> Ejecutar Conciliación
          </button>
        </div>
      </div>

      <div id="match-results-container" class="p-4 bg-purple-50 rounded-xl text-xs text-purple-900 font-semibold border border-purple-200">
        Ingrese el identificador de orden y factura para ejecutar el cotejo de 3 vías y detectar sobreprecios o cantidades no recibidas.
      </div>
    </div>
  `;
}

window.executeThreeWayMatchTest = function () {
  const ordId = document.getElementById('inp-match-orden')?.value.trim();
  const fctNum = document.getElementById('inp-match-factura')?.value.trim();
  const resBox = document.getElementById('match-results-container');
  if (!ordId || !fctNum) {
    alert("Por favor ingrese tanto el ID de la orden de compra como el número de factura.");
    return;
  }

  if (resBox) resBox.innerHTML = "Verificando Three-Way Match con el servidor...";

  fetchBackendAccounting('verifyThreeWayMatch', {
    ordenCompraId: ordId,
    facturaProveedor: {
      numeroFactura: fctNum,
      partidasFacturadas: [{ codigoItem: "ITEM-GEN", cantidad: 1, precioUnitario: 100 }]
    }
  })
  .then(res => {
    if (resBox) {
      resBox.innerHTML = `
        <div class="space-y-2">
          <div class="font-bold text-sm ${res.bloqueadoParaPago ? 'text-red-700' : 'text-emerald-700'}">
            Estado Conciliación: ${res.estadoConciliacion} (${res.bloqueadoParaPago ? 'BLOQUEADO PARA PAGO' : 'HABILITADO PARA PAGO'})
          </div>
          <p>${res.mensaje}</p>
        </div>
      `;
    }
  })
  .catch(err => {
    if (resBox) resBox.innerHTML = `<span class="text-red-600 font-bold">Error en verificación: ${err.message}</span>`;
  });
};

function renderComprasProveedoresView(container) {
  container.innerHTML=`<div class="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3"><h5 class="text-sm font-black uppercase text-gray-800">Directorio de proveedores</h5><button onclick="openNewSupplierModal()" class="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs">Registrar proveedor</button></div>
    <div class="overflow-x-auto"><table class="w-full text-left text-xs text-gray-700"><thead class="bg-gray-50 text-gray-500 uppercase font-black"><tr><th class="p-3">Proveedor / RTN</th><th class="p-3">Contactos</th><th class="p-3">Direcciones</th><th class="p-3">Condiciones</th><th class="p-3">Cuenta bancaria</th><th class="p-3">Estado</th><th class="p-3">Acciones</th></tr></thead><tbody id="tbl-compras-proveedores"><tr><td colspan="7" class="p-4 text-center text-gray-400">Cargando...</td></tr></tbody></table></div>
  </div>`;
  fetchBackendAccounting("getSuppliers",{}).then(res=>{
    const tbody=document.getElementById("tbl-compras-proveedores");if(!tbody)return;const list=res.proveedores||[];
    if(!list.length){tbody.innerHTML='<tr><td colspan="7" class="p-4 text-center text-gray-400">No hay proveedores registrados.</td></tr>';return;}
    tbody.innerHTML=list.map(p=>{const e=escapePurchaseAssetHtml,terms=p.condicionesComerciales,contactNames=(p.contactos||[]).map(c=>e(c.nombre)+(c.esPrincipal?" (principal)":"")).join("<br>"),addressNames=(p.direcciones||[]).map(a=>e(a.tipoDireccion)+": "+e(a.direccion)).join("<br>");return `<tr data-proveedor-id="${e(p.proveedorId)}" class="border-b hover:bg-gray-50"><td class="p-3"><b>${e(p.nombreProveedor)}</b><div class="text-gray-500">${e(p.proveedorId)} · RTN ${e(p.rtn)}</div></td><td class="p-3">${contactNames||"Sin contactos"}<div><button onclick="openSupplierContactModal('${e(p.proveedorId)}')" class="text-indigo-600 font-bold mt-1">+ Contacto</button></div></td><td class="p-3">${addressNames||"Sin direcciones"}</td><td class="p-3">${terms?e(String(terms.plazoCreditoDias))+" días · "+e(terms.moneda)+" · entrega "+e(String(terms.tiempoEntregaDias))+" días":"Sin condiciones"}</td><td class="p-3">${p.tieneCuentaBancaria?e(p.cuentaBancariaEnmascarada):"No registrada"}</td><td class="p-3"><span class="px-2 py-1 rounded bg-gray-100 font-bold">${e(p.estado)}</span></td><td class="p-3 whitespace-nowrap"><button onclick="viewSupplierBankAccount('${e(p.proveedorId)}')" class="text-indigo-600 font-bold">Ver cuenta</button> <button onclick="updateSupplierBankAccount(this.parentElement.parentElement.dataset.proveedorId)" class="text-indigo-600 font-bold">Actualizar cuenta</button></td></tr>`;}).join("");
  }).catch(err=>{const tbody=document.getElementById("tbl-compras-proveedores");if(tbody)tbody.innerHTML='<tr><td colspan="7" class="p-4 text-center text-red-500">Error: '+escapePurchaseAssetHtml(err.message)+'</td></tr>';});
}

function openNewPurchaseRequestModal() {
  const existing=document.getElementById("purchase-request-modal");if(existing)existing.remove();
  const modal=document.createElement("div");modal.id="purchase-request-modal";modal.className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-3";
  modal.innerHTML=`<div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-5 space-y-4">
    <div class="flex justify-between items-center"><h3 class="font-black text-sm uppercase">Nueva solicitud de compra</h3><button type="button" onclick="closePurchaseRequestModal()" class="text-gray-500 text-xl">×</button></div>
    <form id="purchase-request-form" onsubmit="submitNewPurchaseRequest(event)" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label class="text-xs font-bold">Departamento *<input id="purchase-request-department" required class="w-full mt-1 p-2 border rounded-lg" placeholder="Departamento solicitante"></label>
        <label class="text-xs font-bold">Centro de costo<input id="purchase-request-cost-center" class="w-full mt-1 p-2 border rounded-lg" placeholder="Centro de costo"></label>
        <label class="text-xs font-bold">Categoría general<input id="purchase-request-category" class="w-full mt-1 p-2 border rounded-lg" value="Bienes y suministros"></label>
      </div>
      <label class="block text-xs font-bold">Justificación *<textarea id="purchase-request-justification" required rows="2" class="w-full mt-1 p-2 border rounded-lg" placeholder="Motivo y necesidad de la compra"></textarea></label>
      <div class="flex justify-between items-center"><h4 class="font-black text-xs uppercase">Partidas solicitadas</h4><button type="button" onclick="addPurchaseRequestLine()" class="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">Agregar partida</button></div>
      <div id="purchase-request-lines" class="space-y-3"></div>
      <div class="flex justify-end gap-2"><button type="button" onclick="closePurchaseRequestModal()" class="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">Cancelar</button><button type="submit" class="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold">Guardar solicitud</button></div>
    </form></div>`;
  document.body.appendChild(modal);window.addPurchaseRequestLine();
}
window.closePurchaseRequestModal=function(){document.getElementById("purchase-request-modal")?.remove();};
window.addPurchaseRequestLine=function(){
  const host=document.getElementById("purchase-request-lines");if(!host)return;
  const row=document.createElement("div");row.className="purchase-request-line border rounded-xl p-3 grid grid-cols-1 md:grid-cols-6 gap-2";
  row.innerHTML=`<label class="text-[10px] font-bold">ID de partida *<input data-field="itemId" required class="w-full mt-1 p-2 border rounded-lg text-xs" placeholder="ITEM-001"></label>
    <label class="text-[10px] font-bold md:col-span-2">Descripción *<input data-field="descripcion" required class="w-full mt-1 p-2 border rounded-lg text-xs" placeholder="Descripción del bien"></label>
    <label class="text-[10px] font-bold">Unidad<input data-field="unidad" class="w-full mt-1 p-2 border rounded-lg text-xs" placeholder="Unidad"></label>
    <label class="text-[10px] font-bold">Cantidad *<input data-field="cantidad" type="number" min="0.01" step="0.01" value="1" required class="w-full mt-1 p-2 border rounded-lg text-xs"></label>
    <label class="text-[10px] font-bold">Precio estimado<input data-field="precioUnitario" type="number" min="0" step="0.01" value="0" class="w-full mt-1 p-2 border rounded-lg text-xs"></label>
    <label class="text-[10px] font-bold md:col-span-2">Clasificación de inventario *
      <select data-field="clasificacionInventario" required class="w-full mt-1 p-2 border rounded-lg text-xs">
        <option value="MaterialInventariable">Material inventariable</option><option value="Consumible">Consumible</option><option value="ActivoFijo">Bien capitalizable / Activo fijo</option>
      </select></label>
    <div class="md:col-span-4 flex items-end justify-end"><button type="button" onclick="this.closest('.purchase-request-line').remove()" class="px-3 py-2 text-rose-600 text-xs font-bold">Quitar partida</button></div>`;
  host.appendChild(row);
};
window.submitNewPurchaseRequest=function(event){
  event.preventDefault();
  const lines=Array.from(document.querySelectorAll("#purchase-request-lines .purchase-request-line")).map(row=>{
    const value=field=>row.querySelector('[data-field="'+field+'"]')?.value?.trim()||"";
    return {itemId:value("itemId"),descripcion:value("descripcion"),unidad:value("unidad"),cantidad:Number(value("cantidad")),precioUnitario:Number(value("precioUnitario")||0),clasificacionInventario:value("clasificacionInventario")};
  });
  if(!lines.length||lines.some(x=>!x.itemId||!x.descripcion||!Number.isFinite(x.cantidad)||x.cantidad<=0||!Number.isFinite(x.precioUnitario)||x.precioUnitario<0)){alert("Revise las partidas y sus cantidades.");return;}
  const itemIds=lines.map(x=>x.itemId.toUpperCase());if(new Set(itemIds).size!==itemIds.length){alert("Cada partida debe tener un ID único.");return;}
  const payload={departamento:document.getElementById("purchase-request-department").value.trim(),centroCosto:document.getElementById("purchase-request-cost-center").value.trim(),categoria:document.getElementById("purchase-request-category").value.trim(),justificacion:document.getElementById("purchase-request-justification").value.trim(),solicitanteUserId:(window.currentUser&&window.currentUser.userId)||"",detalleItems:lines,montoEstimado:lines.reduce((sum,x)=>sum+x.cantidad*x.precioUnitario,0)};
  if(!payload.departamento||!payload.justificacion){alert("Departamento y justificación son obligatorios.");return;}
  const submit=document.querySelector("#purchase-request-form button[type='submit']");if(submit)submit.disabled=true;
  fetchBackendAccounting("createPurchaseRequest",payload).then(result=>{alert(result.message||"Solicitud registrada.");closePurchaseRequestModal();switchComprasSubtab("solicitudes");}).catch(error=>{if(submit)submit.disabled=false;alert("No fue posible registrar la solicitud: "+(error.message||error));});
};

function viewPurchaseRequestDetails(solId) {
  alert(`Detalle de solicitud de compra ${solId} cargado.`);
}

function openNewSupplierModal() {
  const existing=document.getElementById("supplier-profile-modal");if(existing)existing.remove();
  const modal=document.createElement("div");modal.id="supplier-profile-modal";modal.className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-3";
  modal.innerHTML=`<div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto p-5 space-y-4">
    <div class="flex justify-between items-center"><h3 class="font-black text-sm uppercase">Registrar proveedor</h3><button type="button" onclick="closeSupplierProfileModal()" class="text-xl">×</button></div>
    <form id="supplier-profile-form" onsubmit="submitSupplierProfile(event)" class="space-y-4 text-xs">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label class="font-bold">Nombre comercial *<input id="supplier-name" required class="w-full p-2 border rounded-lg mt-1"></label>
        <label class="font-bold">RTN (14 dígitos) *<input id="supplier-rtn" required inputmode="numeric" pattern="[0-9]{14}" maxlength="14" class="w-full p-2 border rounded-lg mt-1"></label>
        <label class="font-bold">Rubro / servicio<input id="supplier-category" class="w-full p-2 border rounded-lg mt-1"></label>
        <label class="font-bold">Teléfono general<input id="supplier-phone" class="w-full p-2 border rounded-lg mt-1"></label>
        <label class="font-bold">Correo general<input id="supplier-email" type="email" class="w-full p-2 border rounded-lg mt-1"></label>
        <label class="font-bold">Estado<select id="supplier-status" class="w-full p-2 border rounded-lg mt-1"><option>Activo</option><option>EnEvaluacion</option><option>Inactivo</option><option>Suspendido</option></select></label>
      </div>
      <div class="border-t pt-3"><b>Contacto principal inicial</b><div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
        <input id="supplier-contact-name" class="p-2 border rounded-lg" placeholder="Nombre del contacto"><input id="supplier-contact-title" class="p-2 border rounded-lg" placeholder="Cargo"><input id="supplier-contact-phone" class="p-2 border rounded-lg" placeholder="Teléfono">
        <input id="supplier-contact-email" type="email" class="p-2 border rounded-lg" placeholder="Correo"><select id="supplier-contact-area" class="p-2 border rounded-lg"><option value="Ventas">Ventas</option><option value="Cobranzas">Cobranzas</option><option value="Soporte">Soporte</option><option value="Entregas">Entregas</option></select>
      </div></div>
      <div class="border-t pt-3"><b>Direcciones</b><div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        <label>Facturación fiscal<input id="supplier-billing-address" class="w-full p-2 border rounded-lg mt-1" placeholder="Dirección fiscal"></label>
        <label>Entrega de mercancía<input id="supplier-delivery-address" class="w-full p-2 border rounded-lg mt-1" placeholder="Dirección de entrega"></label>
        <input id="supplier-city" class="p-2 border rounded-lg" placeholder="Ciudad"><input id="supplier-department" class="p-2 border rounded-lg" placeholder="Departamento">
      </div></div>
      <div class="border-t pt-3"><b>Condiciones comerciales</b><div class="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
        <label>Crédito (días)<select id="supplier-credit" class="w-full p-2 border rounded-lg mt-1"><option value="0">Contado</option><option value="15">15</option><option value="30">30</option><option value="60">60</option></select></label>
        <label>Moneda<select id="supplier-currency" class="w-full p-2 border rounded-lg mt-1"><option>HNL</option><option>USD</option><option>EUR</option></select></label>
        <label>Descuento pronto pago %<input id="supplier-discount" type="number" min="0" max="100" step="0.01" value="0" class="w-full p-2 border rounded-lg mt-1"></label>
        <label>Días de descuento<input id="supplier-discount-days" type="number" min="0" value="0" class="w-full p-2 border rounded-lg mt-1"></label>
        <label>Entrega habitual (días)<input id="supplier-delivery-days" type="number" min="0" value="0" class="w-full p-2 border rounded-lg mt-1"></label>
      </div></div>
      <div class="border-t pt-3"><b>Cuenta bancaria (opcional; roles autorizados)</b><div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2"><input id="supplier-bank-name" class="p-2 border rounded-lg" placeholder="Banco"><select id="supplier-bank-type" class="p-2 border rounded-lg"><option value="Ahorro">Ahorro</option><option value="Corriente">Corriente</option></select><input id="supplier-bank-number" class="p-2 border rounded-lg" placeholder="Número de cuenta"><input id="supplier-bank-beneficiary" class="p-2 border rounded-lg" placeholder="Beneficiario"><input id="supplier-bank-reason" class="p-2 border rounded-lg" placeholder="Motivo documentado"><input id="supplier-bank-reference" class="p-2 border rounded-lg" placeholder="Referencia de autorización"></div><p class="text-[11px] text-gray-500 mt-1">La cuenta completa no se devuelve en el directorio ni se incluye en auditoría.</p></div>
      <div class="flex justify-end gap-2"><button type="button" onclick="closeSupplierProfileModal()" class="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button><button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold">Guardar proveedor</button></div>
    </form></div>`;
  document.body.appendChild(modal);
}
window.closeSupplierProfileModal=function(){document.getElementById("supplier-profile-modal")?.remove();};
window.submitSupplierProfile=function(event){
  event.preventDefault();const val=id=>document.getElementById(id).value.trim();
  const payload={nombreProveedor:val("supplier-name"),rtn:val("supplier-rtn"),rubroServicio:val("supplier-category"),telefono:val("supplier-phone"),email:val("supplier-email"),estado:val("supplier-status")};
  if(!/^\d{14}$/.test(payload.rtn)){alert("El RTN debe contener exactamente 14 dígitos.");return;}
  const btn=document.querySelector("#supplier-profile-form button[type='submit']");if(btn)btn.disabled=true;
  fetchBackendAccounting("registerSupplier",payload).then(async result=>{
    const id=result.proveedorId,contactName=val("supplier-contact-name");
    if(contactName)await fetchBackendAccounting("manageSupplierContact",{proveedorId:id,nombre:contactName,cargo:val("supplier-contact-title"),telefono:val("supplier-contact-phone"),email:val("supplier-contact-email"),area:val("supplier-contact-area"),esPrincipal:true});
    for(const [field,type] of [["supplier-billing-address","FacturacionFiscal"],["supplier-delivery-address","EntregaMercancia"]])if(val(field))await fetchBackendAccounting("manageSupplierAddress",{proveedorId:id,tipoDireccion:type,direccion:val(field),ciudad:val("supplier-city"),departamento:val("supplier-department"),pais:"Honduras",esPrincipal:true});
    await fetchBackendAccounting("manageSupplierCommercialTerms",{proveedorId:id,plazoCreditoDias:Number(val("supplier-credit")),moneda:val("supplier-currency"),descuentoProntoPagoPorcentaje:Number(val("supplier-discount")),diasDescuento:Number(val("supplier-discount-days")),tiempoEntregaDias:Number(val("supplier-delivery-days"))});
    if(val("supplier-bank-number"))await fetchBackendAccounting("manageSupplierBankAccount",{proveedorId:id,banco:val("supplier-bank-name"),tipoCuenta:val("supplier-bank-type"),numeroCuenta:val("supplier-bank-number"),beneficiario:val("supplier-bank-beneficiary"),motivoAutorizacion:val("supplier-bank-reason"),referenciaAutorizacion:val("supplier-bank-reference")});
    alert("Proveedor y perfil comercial guardados. ID: "+id);closeSupplierProfileModal();switchComprasSubtab("proveedores");
  }).catch(error=>{if(btn)btn.disabled=false;alert("No se completó el registro del proveedor: "+(error.message||error)+". Revise si el proveedor base ya fue guardado antes de reintentar.");});
};
window.openSupplierContactModal=function(proveedorId){
  const modal=document.createElement("div");modal.id="supplier-contact-modal";modal.className="fixed inset-0 z-[125] bg-black/60 flex items-center justify-center p-3";
  modal.innerHTML=`<form id="supplier-contact-form" class="bg-white rounded-2xl p-5 w-full max-w-xl space-y-3" onsubmit="submitSupplierContact(event,'${escapePurchaseAssetHtml(proveedorId)}')"><h3 class="font-black text-sm">Agregar contacto</h3><input id="supplier-extra-contact-name" required class="w-full p-2 border rounded-lg" placeholder="Nombre"><input id="supplier-extra-contact-title" class="w-full p-2 border rounded-lg" placeholder="Cargo"><input id="supplier-extra-contact-phone" required class="w-full p-2 border rounded-lg" placeholder="Teléfono"><input id="supplier-extra-contact-email" type="email" required class="w-full p-2 border rounded-lg" placeholder="Correo"><select id="supplier-extra-contact-area" class="w-full p-2 border rounded-lg"><option>Ventas</option><option>Cobranzas</option><option>Soporte</option><option>Entregas</option></select><label><input id="supplier-extra-contact-primary" type="checkbox"> Contacto principal</label><div class="flex justify-end gap-2"><button type="button" onclick="document.getElementById('supplier-contact-modal').remove()" class="px-3 py-2 bg-gray-100 rounded-lg">Cancelar</button><button class="px-3 py-2 bg-indigo-600 text-white rounded-lg">Guardar</button></div></form>`;
  document.body.appendChild(modal);
};
window.submitSupplierContact=function(event,id){event.preventDefault();const val=field=>document.getElementById(field).value.trim();fetchBackendAccounting("manageSupplierContact",{proveedorId:id,nombre:val("supplier-extra-contact-name"),cargo:val("supplier-extra-contact-title"),telefono:val("supplier-extra-contact-phone"),email:val("supplier-extra-contact-email"),area:val("supplier-extra-contact-area"),esPrincipal:document.getElementById("supplier-extra-contact-primary").checked}).then(()=>{document.getElementById("supplier-contact-modal")?.remove();switchComprasSubtab("proveedores");}).catch(error=>alert(error.message||error));};
window.updateSupplierBankAccount=function(id){const banco=prompt("Banco receptor");if(!banco)return;const tipoCuenta=prompt("Tipo de cuenta: Ahorro o Corriente");if(!tipoCuenta)return;const numeroCuenta=prompt("Número de cuenta");if(!numeroCuenta)return;const beneficiario=prompt("Beneficiario");if(!beneficiario)return;const motivoAutorizacion=prompt("Motivo documentado de la modificación (mínimo 10 caracteres)");if(!motivoAutorizacion)return;const referenciaAutorizacion=prompt("Referencia del documento de autorización");if(!referenciaAutorizacion)return;fetchBackendAccounting("manageSupplierBankAccount",{proveedorId:id,banco:banco,tipoCuenta:tipoCuenta,numeroCuenta:numeroCuenta,beneficiario:beneficiario,motivoAutorizacion:motivoAutorizacion,referenciaAutorizacion:referenciaAutorizacion}).then(()=>{alert("Cuenta actualizada; el historial anterior se conserva.");switchComprasSubtab("proveedores");}).catch(error=>alert("No se pudo actualizar la cuenta: "+(error.message||error)));};
window.viewSupplierBankAccount=function(proveedorId){fetchBackendAccounting("getSupplierBankAccount",{proveedorId}).then(result=>{const account=result.cuenta,modal=document.createElement("div");modal.className="fixed inset-0 z-[125] bg-black/60 flex items-center justify-center p-3";modal.innerHTML='<div class="bg-white rounded-2xl p-5 max-w-md w-full space-y-2"><h3 class="font-black">Cuenta bancaria protegida</h3><p class="text-xs">Banco: '+escapePurchaseAssetHtml(account.banco)+'</p><p class="text-xs">Tipo: '+escapePurchaseAssetHtml(account.tipoCuenta)+'</p><p class="text-xs">Cuenta: '+escapePurchaseAssetHtml(account.numeroCuenta)+'</p><p class="text-xs">Beneficiario: '+escapePurchaseAssetHtml(account.beneficiario)+'</p><button class="px-3 py-2 bg-gray-100 rounded-lg" onclick="this.closest(\'div.fixed\').remove()">Cerrar</button></div>';document.body.appendChild(modal);}).catch(error=>alert("Acceso no disponible: "+(error.message||error)));};


function renderBibliotecaModule(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
        <h4 class="text-base font-black uppercase text-gray-800 flex items-center gap-2">
          <i class="fas fa-book-reader text-indigo-600"></i> Biblioteca & Recursos Educativos (Fase 20)
        </h4>
        <div class="flex flex-wrap gap-2 text-xs font-bold uppercase">
          <button onclick="switchBibliotecaSubtab('libros')" id="btn-bib-libros" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-indigo-600 text-white">Catálogo & Ejemplares</button>
          <button onclick="switchBibliotecaSubtab('prestamos')" id="btn-bib-prestamos" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Préstamos</button>
          <button onclick="switchBibliotecaSubtab('reservas')" id="btn-bib-reservas" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Reservas</button>
          <button onclick="switchBibliotecaSubtab('incidencias')" id="btn-bib-incidencias" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Incidencias</button>
          <button onclick="switchBibliotecaSubtab('digitales')" id="btn-bib-digitales" class="px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100">Recursos Digitales</button>
        </div>
      </div>

      <div id="biblioteca-subtab-container" class="space-y-4">
        <div class="text-center py-6 text-gray-400 text-xs font-bold uppercase">Cargando biblioteca...</div>
      </div>
    </div>
  `;
  switchBibliotecaSubtab('libros');
}

window.switchBibliotecaSubtab = function (subtab) {
  currentBibliotecaSubtab = subtab;
  ['libros', 'prestamos', 'reservas', 'incidencias', 'digitales'].forEach(s => {
    const btn = document.getElementById(`btn-bib-${s}`);
    if (btn) {
      if (s === subtab) {
        btn.className = "px-3 py-1.5 rounded-xl transition-all shadow-sm bg-indigo-600 text-white font-bold";
      } else {
        btn.className = "px-3 py-1.5 rounded-xl transition-all shadow-sm bg-white text-gray-700 hover:bg-gray-100 font-bold";
      }
    }
  });

  const subContainer = document.getElementById('biblioteca-subtab-container');
  if (!subContainer) return;

  if (subtab === 'libros') renderLibrosView(subContainer);
  else if (subtab === 'prestamos') renderPrestamosBibView(subContainer);
  else if (subtab === 'reservas') renderReservasBibView(subContainer);
  else if (subtab === 'incidencias') renderIncidenciasBibView(subContainer);
  else if (subtab === 'digitales') renderDigitalesBibView(subContainer);
};

function renderLibrosView(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <h5 class="font-black text-xs uppercase text-gray-800 mb-3"><i class="fas fa-book text-indigo-600"></i> Registrar Obra / Ejemplar</h5>
        <form id="form-libro" onsubmit="handleSaveLibro(event)" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-gray-600 mb-1">Título de la Obra *</label>
            <input type="text" id="bib-titulo" required class="w-full p-2 border border-gray-300 rounded-xl font-bold" placeholder="EJ: Cien Años de Soledad">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Autor *</label>
            <input type="text" id="bib-autor" required class="w-full p-2 border border-gray-300 rounded-xl" placeholder="EJ: Gabriel García Márquez">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Código ISBN</label>
            <input type="text" id="bib-isbn" class="w-full p-2 border border-gray-300 rounded-xl" placeholder="EJ: 978-0307474728">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Categoría Temática</label>
            <input type="text" id="bib-categoria" value="Literatura" class="w-full p-2 border border-gray-300 rounded-xl">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Ubicación Física / Estante</label>
            <input type="text" id="bib-ubicacion" value="Estante A1" class="w-full p-2 border border-gray-300 rounded-xl">
          </div>
          <button type="submit" class="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all uppercase">
            Guardar en Catálogo
          </button>
        </form>
      </div>

      <div class="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-search text-indigo-600"></i> Catálogo Bibliográfico</h5>
          <button onclick="loadLibrosData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
        </div>
        <div id="libros-table-container" class="overflow-x-auto text-xs">
          <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando libros...</div>
        </div>
      </div>
    </div>
  `;
  loadLibrosData();
}

window.loadLibrosData = function () {
  const container = document.getElementById('libros-table-container');
  if (!container) return;

  // Consultar Obras Maestras normalizadas con disponibilidad consolidada (FRBR/RDA) [TASK-025]
  fetchApi('ACCOUNTING', 'getBibliographicWorks', {})
    .then(res => {
      const obras = (res && res.obras) ? res.obras : [];
      if (obras.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay obras registradas en el catálogo FRBR.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">Obra ID / ISBN</th>
              <th class="p-2">Título de Obra</th>
              <th class="p-2">Autores</th>
              <th class="p-2">Categoría</th>
              <th class="p-2">Copias Totales</th>
              <th class="p-2">Disponibles</th>
              <th class="p-2">Prestadas</th>
              <th class="p-2">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      obras.forEach(o => {
        const autoresStr = Array.isArray(o.autores) ? o.autores.join(', ') : o.autores;
        const total = (o.metricasEjemplares && o.metricasEjemplares.total) || 0;
        const avail = (o.metricasEjemplares && o.metricasEjemplares.available) || 0;
        const onLoan = (o.metricasEjemplares && o.metricasEjemplares.on_loan) || 0;
        const badgeColor = avail > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';

        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-indigo-700">${o.obraId}<div class="text-[10px] text-gray-400">${o.isbnCodigo || 'S/ISBN'}</div></td>
            <td class="p-2 font-bold text-gray-800">${o.titulo}${o.subtitulo ? ` <span class="font-normal text-gray-500 text-[11px]">(${o.subtitulo})</span>` : ''}</td>
            <td class="p-2 text-gray-600">${autoresStr}</td>
            <td class="p-2 text-gray-500">${o.categoria}</td>
            <td class="p-2 font-mono text-center font-bold text-gray-700">${total}</td>
            <td class="p-2 font-mono text-center font-bold text-emerald-600">${avail}</td>
            <td class="p-2 font-mono text-center font-bold text-amber-600">${onLoan}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeColor}">${avail > 0 ? 'En Existencia' : 'Agotado'}</span></td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar obras: ${err.message}</div>`;
    });
};

window.handleSaveLibro = function (e) {
  e.preventDefault();
  const payload = {
    titulo: document.getElementById('bib-titulo').value,
    autor: document.getElementById('bib-autor').value,
    isbnCodigo: document.getElementById('bib-isbn').value,
    categoria: document.getElementById('bib-categoria').value,
    ubicacionFisica: document.getElementById('bib-ubicacion').value
  };

  fetchApi('ACCOUNTING', 'manageLibraryBook', payload)
    .then(res => {
      alert(res.message || "Ejemplar bibliográfico registrado con éxito.");
      document.getElementById('form-libro').reset();
      loadLibrosData();
    })
    .catch(err => alert("Error: " + err.message));
};

window.handlePrestarLibro = function (ejemplarId) {
  const uId = prompt("Ingrese el UserId del prestatario (EJ: EST-01 / EMP-01):");
  if (!uId) return;

  fetchApi('ACCOUNTING', 'processLibraryLoan', { ejemplarId: ejemplarId, userId: uId, accion: 'Prestamo' })
    .then(res => {
      alert(res.message || "Préstamo registrado exitosamente.");
      loadLibrosData();
    })
    .catch(err => alert("Error: " + err.message));
};

window.handleReservarLibro = function (ejemplarId) {
  const uId = prompt("Ingrese el UserId para la reserva:");
  if (!uId) return;

  fetchApi('ACCOUNTING', 'reserveLibraryBook', { ejemplarId: ejemplarId, userId: uId })
    .then(res => {
      alert(res.message || "Reserva registrada con éxito.");
    })
    .catch(err => alert("Error: " + err.message));
};

function renderPrestamosBibView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-200">
      <div class="flex justify-between items-center mb-4">
        <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-exchange-alt text-indigo-600"></i> Registro de Préstamos Activos</h5>
        <button onclick="loadPrestamosBibData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
      </div>
      <div id="prestamos-table-container" class="overflow-x-auto text-xs">
        <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando préstamos...</div>
      </div>
    </div>
  `;
  loadPrestamosBibData();
}

window.loadPrestamosBibData = function () {
  const container = document.getElementById('prestamos-table-container');
  if (!container) return;

  fetchApi('ACCOUNTING', 'getLibraryLoans', {})
    .then(res => {
      const loans = (res && res.prestamos) ? res.prestamos : [];
      if (loans.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay préstamos activos.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">ID Préstamo</th>
              <th class="p-2">Ejemplar ID</th>
              <th class="p-2">Prestatario (UserId)</th>
              <th class="p-2">Fecha Préstamo</th>
              <th class="p-2">Devolución Prevista</th>
              <th class="p-2">Estado</th>
              <th class="p-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      loans.forEach(l => {
        const isActivo = l.estado === 'on_loan';
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-indigo-600">${l.prestamoId}</td>
            <td class="p-2 font-bold text-gray-800">${l.ejemplarId}</td>
            <td class="p-2 text-gray-600">${l.userId}</td>
            <td class="p-2 text-gray-500">${new Date(l.fechaPrestamo).toLocaleDateString()}</td>
            <td class="p-2 text-gray-500">${new Date(l.fechaDevolucionPrevista).toLocaleDateString()}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isActivo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">${l.estado}</span></td>
            <td class="p-2 text-right">
              ${isActivo ? `<button onclick="handleDevolverLibro('${l.ejemplarId}', '${l.userId}')" class="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] hover:bg-emerald-700 uppercase">Devolver</button>` : '<span class="text-gray-400 text-[10px]">Devuelto</span>'}
            </td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar préstamos: ${err.message}</div>`;
    });
};

window.handleDevolverLibro = function (ejemplarId, userId) {
  if (!confirm(`¿Confirmar recepción y devolución del ejemplar ${ejemplarId}?`)) return;

  fetchApi('ACCOUNTING', 'processLibraryLoan', { ejemplarId: ejemplarId, userId: userId, accion: 'Devolucion' })
    .then(res => {
      alert(res.message || "Devolución registrada.");
      loadPrestamosBibData();
    })
    .catch(err => alert("Error: " + err.message));
};

function renderReservasBibView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-200">
      <div class="flex justify-between items-center mb-4">
        <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-bookmark text-indigo-600"></i> Reservas & Lista de Espera</h5>
        <button onclick="loadReservasBibData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
      </div>
      <div id="reservas-table-container" class="overflow-x-auto text-xs">
        <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando reservas...</div>
      </div>
    </div>
  `;
  loadReservasBibData();
}

window.loadReservasBibData = function () {
  const container = document.getElementById('reservas-table-container');
  if (!container) return;

  fetchApi('ACCOUNTING', 'getLibraryReservations', {})
    .then(res => {
      const resv = (res && res.reservas) ? res.reservas : [];
      if (resv.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay reservas registradas.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">ID Reserva</th>
              <th class="p-2">Ejemplar ID</th>
              <th class="p-2">Usuario</th>
              <th class="p-2">Fecha Solicitud</th>
              <th class="p-2">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      resv.forEach(r => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-indigo-600">${r.reservaId}</td>
            <td class="p-2 font-bold text-gray-800">${r.ejemplarId}</td>
            <td class="p-2 text-gray-600">${r.userId}</td>
            <td class="p-2 text-gray-500">${new Date(r.fechaSolicitud).toLocaleDateString()}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">${r.estadoReserva}</span></td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar reservas: ${err.message}</div>`;
    });
};

function renderIncidenciasBibView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-200">
      <div class="flex justify-between items-center mb-4">
        <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-exclamation-triangle text-rose-600"></i> Incidencias Bibliotecarias (Daños / Pérdidas)</h5>
        <button onclick="loadIncidenciasBibData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
      </div>
      <div id="incidencias-table-container" class="overflow-x-auto text-xs">
        <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando incidencias...</div>
      </div>
    </div>
  `;
  loadIncidenciasBibData();
}

window.loadIncidenciasBibData = function () {
  const container = document.getElementById('incidencias-table-container');
  if (!container) return;

  fetchApi('ACCOUNTING', 'getLibraryIncidents', {})
    .then(res => {
      const incs = (res && res.incidencias) ? res.incidencias : [];
      if (incs.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay incidencias reportadas.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">ID Incidencia</th>
              <th class="p-2">Ejemplar ID</th>
              <th class="p-2">Usuario</th>
              <th class="p-2">Tipo</th>
              <th class="p-2">Descripción</th>
              <th class="p-2">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      incs.forEach(i => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-rose-600">${i.incidenciaId}</td>
            <td class="p-2 font-bold text-gray-800">${i.ejemplarId}</td>
            <td class="p-2 text-gray-600">${i.userId}</td>
            <td class="p-2 font-bold text-rose-700">${i.tipoIncidencia}</td>
            <td class="p-2 text-gray-600">${i.descripcion}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">${i.estado}</span></td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar incidencias: ${err.message}</div>`;
    });
};

function renderDigitalesBibView(container) {
  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-200">
      <div class="flex justify-between items-center mb-4">
        <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-cloud-download-alt text-indigo-600"></i> Recursos Educativos Digitales</h5>
        <button onclick="loadDigitalesBibData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
      </div>
      <div id="digitales-table-container" class="overflow-x-auto text-xs">
        <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando recursos digitales...</div>
      </div>
    </div>
  `;
  loadDigitalesBibData();
}

window.loadDigitalesBibData = function () {
  const container = document.getElementById('digitales-table-container');
  if (!container) return;

  fetchApi('ACCOUNTING', 'getDigitalResources', {})
    .then(res => {
      const recs = (res && res.recursos) ? res.recursos : [];
      if (recs.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay recursos digitales cargados.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">ID Recurso</th>
              <th class="p-2">Título</th>
              <th class="p-2">Autor / Editorial</th>
              <th class="p-2">Categoría</th>
              <th class="p-2 text-right">Enlace / Acceso</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      recs.forEach(r => {
        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-indigo-600">${r.recursoId}</td>
            <td class="p-2 font-bold text-gray-800">${r.titulo}</td>
            <td class="p-2 text-gray-600">${r.autorColaboradores}</td>
            <td class="p-2 text-gray-500">${r.categoria}</td>
            <td class="p-2 text-right">
              <a href="${r.formatoUrl}" target="_blank" class="px-2.5 py-1 bg-indigo-600 text-white rounded font-bold text-[10px] hover:bg-indigo-700 uppercase"><i class="fas fa-external-link-alt"></i> Abrir</a>
            </td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar recursos digitales: ${err.message}</div>`;
    });
};

function renderDiarioModule(container) {
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
      <h4 class="text-base font-black text-gray-800 uppercase flex items-center gap-2">
        <i class="fas fa-book text-emerald-600"></i> Libro Diario & Asientos Contables (Fase 14)
      </h4>
      <p class="text-xs text-gray-600">Consulta y registro de partidas dobles y asientos de cierre.</p>
    </div>
  `;
}


function renderPayrollAdjustmentsModule(container) {
  container.innerHTML = `
    <section class="space-y-5" aria-labelledby="payroll-adjustment-title">
      <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h4 id="payroll-adjustment-title" class="text-base font-black uppercase text-amber-900"><i class="fas fa-file-invoice-dollar"></i> Ajustes compensatorios de nómina</h4>
        <p class="mt-2 text-sm text-amber-900">Solo para planillas cerradas. El asiento original se conserva; el ajuste crea un nuevo asiento equilibrado y documentado. Requiere rol Contador o Administrador y ámbito de propiedad autorizado.</p>
      </div>
      <form id="payroll-adjustment-form" class="space-y-4" onsubmit="submitPayrollJournalAdjustment(event)">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label class="block text-xs font-bold uppercase text-gray-600">ID de planilla cerrada
            <input id="payroll-adjust-planilla" required maxlength="100" class="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm" placeholder="ID de planilla">
          </label>
          <label class="block text-xs font-bold uppercase text-gray-600">Referencia única del ajuste
            <input id="payroll-adjust-reference" required minlength="6" maxlength="80" pattern="[A-Za-z0-9_-]{6,80}" class="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm" placeholder="AJUSTE-2026-001">
          </label>
        </div>
        <label class="block text-xs font-bold uppercase text-gray-600">Motivo y soporte documental
          <textarea id="payroll-adjust-reason" required minlength="12" maxlength="500" rows="3" class="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm" placeholder="Explique la rectificación y su respaldo documental"></textarea>
        </label>
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <h5 class="text-xs font-black uppercase text-gray-700">Líneas contables del ajuste</h5>
            <button type="button" onclick="addPayrollAdjustmentLine()" class="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold uppercase">+ Agregar línea</button>
          </div>
          <div class="grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-gray-500">
            <span class="col-span-2">Cuenta</span><span class="col-span-4">Descripción</span><span class="col-span-2">Debe (L)</span><span class="col-span-2">Haber (L)</span><span class="col-span-2">Acción</span>
          </div>
          <div id="payroll-adjustment-lines" class="space-y-2"></div>
        </div>
        <div id="payroll-adjustment-status" role="status" aria-live="polite" class="min-h-5 text-sm text-gray-600"></div>
        <div class="flex flex-wrap justify-end gap-2">
          <button type="reset" onclick="resetPayrollAdjustmentLines()" class="rounded-xl border border-gray-300 bg-white px-4 py-3 text-xs font-bold uppercase">Limpiar</button>
          <button id="payroll-adjustment-submit" type="submit" class="rounded-xl bg-amber-600 px-5 py-3 text-xs font-black uppercase text-white hover:bg-amber-700">Registrar ajuste compensatorio</button>
        </div>
      </form>
    </section>`;
  window.resetPayrollAdjustmentLines();
}
window.addPayrollAdjustmentLine = function() {
  const container=document.getElementById("payroll-adjustment-lines");if(!container)return;
  const row=document.createElement("div");row.className="grid grid-cols-12 gap-2";row.setAttribute("data-payroll-adjustment-line","1");
  row.innerHTML='<input data-account class="col-span-2 min-w-0 rounded-lg border border-gray-300 p-2 text-sm" maxlength="20" placeholder="5101" aria-label="Código de cuenta"><input data-name class="col-span-4 min-w-0 rounded-lg border border-gray-300 p-2 text-sm" maxlength="120" placeholder="Descripción" aria-label="Descripción de cuenta"><input data-debit type="number" min="0" step="0.01" class="col-span-2 min-w-0 rounded-lg border border-gray-300 p-2 text-sm" placeholder="0.00" aria-label="Debe"><input data-credit type="number" min="0" step="0.01" class="col-span-2 min-w-0 rounded-lg border border-gray-300 p-2 text-sm" placeholder="0.00" aria-label="Haber"><button type="button" class="col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-[10px] font-bold uppercase text-rose-700" aria-label="Quitar línea">Quitar</button>';
  row.querySelector("button").addEventListener("click",()=>row.remove());container.appendChild(row);
};
window.resetPayrollAdjustmentLines = function() {
  const container=document.getElementById("payroll-adjustment-lines");if(!container)return;
  container.innerHTML="";window.addPayrollAdjustmentLine();window.addPayrollAdjustmentLine();
  const status=document.getElementById("payroll-adjustment-status");if(status)status.textContent="";
};
window.submitPayrollJournalAdjustment = async function(event) {
  if(event&&event.preventDefault)event.preventDefault();
  const status=document.getElementById("payroll-adjustment-status"),button=document.getElementById("payroll-adjustment-submit");
  const lines=Array.from(document.querySelectorAll("#payroll-adjustment-lines [data-payroll-adjustment-line]")).map(row=>({
    cuenta:row.querySelector("[data-account]").value.trim(),
    nombre:row.querySelector("[data-name]").value.trim(),
    debe:Number(row.querySelector("[data-debit]").value||0),
    haber:Number(row.querySelector("[data-credit]").value||0)
  }));
  if(lines.length<2||lines.some(x=>!x.cuenta||!x.nombre||!Number.isFinite(x.debe)||!Number.isFinite(x.haber)||x.debe<0||x.haber<0||(x.debe>0&&x.haber>0)||(x.debe===0&&x.haber===0))){
    if(status)status.textContent="Cada línea requiere cuenta, descripción y un importe positivo en Debe o Haber, nunca ambos.";return;
  }
  const debit=Math.round(lines.reduce((t,x)=>t+x.debe,0)*100)/100,credit=Math.round(lines.reduce((t,x)=>t+x.haber,0)*100)/100;
  if(Math.abs(debit-credit)>0.01){if(status)status.textContent="El ajuste no está cuadrado. Debe y Haber deben coincidir dentro de L 0.01.";return;}
  const payload={planillaId:document.getElementById("payroll-adjust-planilla").value.trim(),referenciaAjuste:document.getElementById("payroll-adjust-reference").value.trim(),motivo:document.getElementById("payroll-adjust-reason").value.trim(),lineas};
  if(!payload.planillaId||!payload.referenciaAjuste||payload.motivo.length<12){if(status)status.textContent="Complete la planilla, referencia única y motivo.";return;}
  if(button)button.disabled=true;if(status)status.textContent="Registrando ajuste y verificando el asiento original…";
  try{
    const result=await window.recordPayrollJournalAdjustment(payload);
    if(!result||result.status!=="success")throw new Error(result&&result.message||result&&result.code||"No fue posible registrar el ajuste.");
    if(status)status.textContent="Ajuste registrado: "+result.ajusteId+" · Asiento: "+result.asientoId+" · Asiento original conservado: "+result.asientoOriginalId;
  }catch(error){if(status)status.textContent=error&&error.message?error.message:"Error al registrar el ajuste.";}
  finally{if(button)button.disabled=false;}
};

function renderPresupuestosModule(container) {
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
      <h4 class="text-base font-black text-gray-800 uppercase flex items-center gap-2">
        <i class="fas fa-calculator text-indigo-600"></i> Control Presupuestario por Centro de Costo (Fase 14)
      </h4>
      <p class="text-xs text-gray-600">Monitoreo de ejecución presupuestaria anual e indicadores por área.</p>
    </div>
  `;
}


function enrollmentBillingEscapeHtml_(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderEnrollmentBillingConfigurationModule(container) {
  const currentYear = new Date().getFullYear();
  container.innerHTML = '<section class="space-y-5" aria-labelledby="enrollment-billing-title">' +
    '<div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-5"><h4 id="enrollment-billing-title" class="text-base font-black uppercase text-indigo-900"><i class="fas fa-sliders-h"></i> Configuración de cargos al matricular</h4>' +
    '<p class="text-sm text-indigo-900 mt-2">Guarda la política de cargos por año lectivo y grado. La aplicación automática de esta política al crear matrículas sigue en integración dentro de AUD-NG-129; guardar aquí no crea ni modifica cargos.</p></div>' +
    '<form id="enrollment-billing-load-form" class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">' +
    '<label class="text-xs font-bold text-gray-700">Año lectivo<input id="enrollment-billing-year" type="number" min="2000" max="2200" required value="' + currentYear + '" class="mt-1 w-full p-2.5 border border-gray-300 rounded-xl text-sm"></label>' +
    '<label class="text-xs font-bold text-gray-700">Grado<input id="enrollment-billing-grade" type="text" maxlength="80" required placeholder="Ej. Séptimo grado" class="mt-1 w-full p-2.5 border border-gray-300 rounded-xl text-sm"></label>' +
    '<div class="flex items-end"><button type="submit" class="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700">Consultar configuración</button></div></form>' +
    '<div id="enrollment-billing-feedback" role="status" aria-live="polite" class="text-sm text-gray-600"></div><div id="enrollment-billing-editor" class="hidden space-y-4"></div></section>';
  document.getElementById("enrollment-billing-load-form").addEventListener("submit", function(event) {
    event.preventDefault();
    window.loadEnrollmentBillingConfiguration();
  });
}

window.updateEnrollmentBillingModeUI = function() {
  const mode = document.getElementById("enrollment-billing-mode");
  const concept = document.getElementById("enrollment-billing-concept-wrap");
  if (mode && concept) concept.classList.toggle("hidden", mode.value !== "MATRICULA_ONLY");
};

window.loadEnrollmentBillingConfiguration = async function() {
  const year = String(document.getElementById("enrollment-billing-year").value || "").trim();
  const grade = String(document.getElementById("enrollment-billing-grade").value || "").trim();
  const feedback = document.getElementById("enrollment-billing-feedback");
  const editor = document.getElementById("enrollment-billing-editor");
  if (!year || !grade) {
    feedback.textContent = "Indica el año lectivo y el grado para consultar sus tarifas.";
    editor.classList.add("hidden");
    return;
  }
  feedback.textContent = "Consultando tarifas y configuración...";
  editor.classList.add("hidden");
  try {
    const response = await window.fetchApi("ACCOUNTING", "getEnrollmentBillingConfiguration", { anoLectivo: year, nivelGrado: grade });
    if (!response || response.status !== "success") throw new Error(response && (response.message || response.code) || "No fue posible consultar la configuración.");
    const tariffs = response.tarifas || [];
    const config = response.config || null;
    window.currentEnrollmentBillingConfiguration_ = { anoLectivo: year, nivelGrado: grade, tarifas: tariffs, config: config };
    const options = tariffs.map(function(t) {
      const label = (t.conceptoNombre || t.conceptoId) + " — L " + Number(t.montoTotal).toFixed(2) + " / " + Number(t.cuotasNum) + " cuota(s)";
      return '<option value="' + enrollmentBillingEscapeHtml_(t.conceptoId) + '">' + enrollmentBillingEscapeHtml_(label) + '</option>';
    }).join("");
    const summary = tariffs.length ? tariffs.map(function(t) {
      return '<li class="flex flex-wrap justify-between gap-2 border-b border-gray-100 py-2 text-sm"><span>' + enrollmentBillingEscapeHtml_(t.conceptoNombre || t.conceptoId) +
        '</span><span class="font-semibold">L ' + Number(t.montoTotal).toFixed(2) + ' · ' + Number(t.cuotasNum) + ' cuota(s)</span></li>';
    }).join("") : '<li class="text-sm text-amber-700 py-2">No hay tarifas activas para este grado y año lectivo.</li>';
    editor.innerHTML = '<form id="enrollment-billing-save-form" class="space-y-4 border border-gray-200 rounded-2xl p-5">' +
      '<div class="flex flex-wrap justify-between gap-2"><h5 class="font-black text-gray-900 uppercase text-sm">Regla de generación</h5><span class="text-xs text-gray-500">' +
      (config ? "Configuración existente" : "Sin configuración guardada") + '</span></div>' +
      '<label class="block text-xs font-bold text-gray-700">¿Qué cargos debe crear la matrícula?<select id="enrollment-billing-mode" required onchange="updateEnrollmentBillingModeUI()" class="mt-1 w-full p-3 border border-gray-300 rounded-xl text-sm bg-white">' +
      '<option value="MANUAL">Manual — no generar cargos automáticamente</option><option value="MATRICULA_ONLY">Solo el concepto de matrícula seleccionado</option>' +
      '<option value="ALL_ACTIVE_TARIFFS">Plan completo — todos los conceptos con tarifa activa</option></select></label>' +
      '<label id="enrollment-billing-concept-wrap" class="block text-xs font-bold text-gray-700">Tarifa / concepto de matrícula<select id="enrollment-billing-concept" class="mt-1 w-full p-3 border border-gray-300 rounded-xl text-sm bg-white">' +
      '<option value="">Selecciona una tarifa activa</option>' + options + '</select></label>' +
      '<div class="bg-gray-50 rounded-xl p-4"><h6 class="font-bold text-xs uppercase text-gray-700 mb-2">Tarifas activas disponibles</h6><ul class="divide-y divide-gray-100">' + summary + '</ul></div>' +
      '<p class="text-xs text-gray-500">El plan completo utiliza solo tarifas activas del año y grado seleccionados. Hasta finalizar la integración del motor, esta pantalla solo guarda la política: no activa ni genera cargos.</p>' +
      '<button type="submit" class="px-5 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase hover:bg-indigo-700">Guardar configuración</button></form>';
    document.getElementById("enrollment-billing-mode").value = config && config.modoGeneracion || "MANUAL";
    document.getElementById("enrollment-billing-concept").value = config && config.conceptoMatriculaId || "";
    window.updateEnrollmentBillingModeUI();
    document.getElementById("enrollment-billing-save-form").addEventListener("submit", function(event) {
      event.preventDefault();
      window.saveEnrollmentBillingConfiguration();
    });
    editor.classList.remove("hidden");
    feedback.textContent = "Configuración cargada. " + tariffs.length + " tarifa(s) activa(s) disponibles.";
  } catch (error) {
    feedback.textContent = "Error: " + String(error.message || error);
  }
};

window.saveEnrollmentBillingConfiguration = async function() {
  const context = window.currentEnrollmentBillingConfiguration_;
  const feedback = document.getElementById("enrollment-billing-feedback");
  if (!context) { feedback.textContent = "Primero consulta el año lectivo y el grado."; return; }
  const mode = document.getElementById("enrollment-billing-mode").value;
  const conceptId = document.getElementById("enrollment-billing-concept").value;
  if (mode === "MATRICULA_ONLY" && !conceptId) { feedback.textContent = "Selecciona una tarifa activa para el concepto de matrícula."; return; }
  feedback.textContent = "Guardando configuración...";
  try {
    const response = await window.fetchApi("ACCOUNTING", "saveEnrollmentBillingConfiguration", {
      anoLectivo: context.anoLectivo, nivelGrado: context.nivelGrado, modoGeneracion: mode,
      conceptoMatriculaId: mode === "MATRICULA_ONLY" ? conceptId : ""
    });
    if (!response || response.status !== "success") throw new Error(response && (response.message || response.code) || "No fue posible guardar la configuración.");
    feedback.textContent = "Política guardada: " + mode + ". Su aplicación automática se habilitará al completar la integración de AUD-NG-129.";
    await window.loadEnrollmentBillingConfiguration();
  } catch (error) {
    feedback.textContent = "Error: " + String(error.message || error);
  }
};

function renderDescuentosModule(container) {
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
      <h4 class="text-base font-black text-gray-800 uppercase flex items-center gap-2">
        <i class="fas fa-tags text-pink-600"></i> Reglas de Descuentos & Becas (Fase 15)
      </h4>
      <p class="text-xs text-gray-600">Administración de políticas de descuentos por hermano, becas y pronto pago.</p>
    </div>
  `;
}

function renderResumenModule(container) {
  container.innerHTML = `
    <div class="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
      <h4 class="text-base font-black text-gray-800 uppercase flex items-center gap-2">
        <i class="fas fa-chart-line text-blue-600"></i> Resumen Financiero & Balance Operativo
      </h4>
      <p class="text-xs text-gray-600">Consolidado institucional de ingresos, egresos, cuentas por cobrar y valorización de inventarios.</p>
    </div>
  `;
}


// [TASK-002] [F15-Task02] - Métodos clientes para simulación y generación masiva de mensualidades escolares
window.previewBatchMonthlyCharges = async function(payload) {
  try {
    return await window.callApi('ACCOUNTING', 'previewBatchMonthlyCharges', payload || {});
  } catch (error) {
    console.error('[ACCOUNTING] Error en simulación previa de mensualidades:', error);
    throw error;
  }
};

window.generateBatchMonthlyCharges = async function(payload) {
  try {
    return await window.callApi('ACCOUNTING', 'generateBatchMonthlyCharges', payload || {});
  } catch (error) {
    console.error('[ACCOUNTING] Error en generación masiva de mensualidades:', error);
    throw error;
  }
};


// [TASK-003] [F15-Task03] - Métodos clientes para anulaciones, reversión de pagos, notas de crédito y reembolsos
window.voidCharge = async function(payload) {
  try {
    return await window.callApi('ACCOUNTING', 'voidCharge', payload || {});
  } catch (error) {
    console.error('[ACCOUNTING] Error en anulación de cargo:', error);
    throw error;
  }
};

window.reversePayment = async function(payload) {
  try {
    return await window.callApi('ACCOUNTING', 'reversePayment', payload || {});
  } catch (error) {
    console.error('[ACCOUNTING] Error en reversión de pago:', error);
    throw error;
  }
};

window.issueFiscalCreditNote = async function(payload) {
  try {
    return await window.callApi('ACCOUNTING', 'issueFiscalCreditNote', payload || {});
  } catch (error) {
    console.error('[ACCOUNTING] Error en emisión de nota de crédito:', error);
    throw error;
  }
};

window.processPaymentRefund = async function(payload) {
  try {
    return await window.callApi('ACCOUNTING', 'processPaymentRefund', payload || {});
  } catch (error) {
    console.error('[ACCOUNTING] Error en procesamiento de reembolso:', error);
    throw error;
  }
};

// [TASK-179] Registrar ajustes compensatorios de planillas cerradas.
window.recordPayrollJournalAdjustment = async function(payload) {
  try {
    return await window.callApi('ACCOUNTING', 'recordPayrollJournalAdjustment', payload || {});
  } catch (error) {
    console.error('[ACCOUNTING] Error al registrar ajuste compensatorio de nómina:', error);
    throw error;
  }
};


// [TASK-006] [F16-Task03] - Método cliente para desvinculación laboral coordinada (Offboarding)
window.processEmployeeOffboarding = async function(payload) {
  try {
    return await window.callApi('ACCOUNTING', 'processEmployeeOffboarding', payload || {});
  } catch (error) {
    console.error('[ACCOUNTING] Error en desvinculación laboral coordinada:', error);
    throw error;
  }
};



// --- [TASK-021] [F19-Task03] TRANSFERENCIAS ENTRE ALMACENES ---

function renderTransferenciasView(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <h5 class="font-black text-xs uppercase text-gray-800 mb-3"><i class="fas fa-dolly text-blue-600"></i> Despachar Transferencia</h5>
        <form id="form-transferencia" onsubmit="handleSaveTransferencia(event)" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-gray-600 mb-1">Código del Artículo *</label>
            <input type="text" id="trf-codigo" required class="w-full p-2 border border-gray-300 rounded-xl" placeholder="EJ: MAT-PAP-01">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Nombre / Descripción</label>
            <input type="text" id="trf-nombre" class="w-full p-2 border border-gray-300 rounded-xl" placeholder="EJ: Resma Papel Bond Carta">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Cantidad a Transferir *</label>
            <input type="number" id="trf-cantidad" required step="1" min="1" class="w-full p-2 border border-gray-300 rounded-xl" placeholder="1">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Bodega / Ubicación Origen *</label>
            <input type="text" id="trf-origen" required class="w-full p-2 border border-gray-300 rounded-xl" placeholder="Bodega General">
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Bodega / Ubicación Destino *</label>
            <input type="text" id="trf-destino" required class="w-full p-2 border border-gray-300 rounded-xl" placeholder="Laboratorio de Cómputo 1">
          </div>
          <div class="flex items-center gap-2 pt-1">
            <input type="checkbox" id="trf-requiere-recepcion" checked class="rounded text-blue-600">
            <label for="trf-requiere-recepcion" class="font-bold text-gray-700 text-[11px]">Requiere confirmación física en destino (En Tránsito)</label>
          </div>
          <div>
            <label class="block font-bold text-gray-600 mb-1">Observaciones</label>
            <input type="text" id="trf-obs" class="w-full p-2 border border-gray-300 rounded-xl" placeholder="Motivo o referencia del traslado">
          </div>
          <button type="submit" class="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all uppercase">
            Emitir Transferencia
          </button>
        </form>
      </div>

      <div class="md:col-span-2 bg-white p-5 rounded-2xl border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h5 class="font-black text-xs uppercase text-gray-800"><i class="fas fa-exchange-alt text-indigo-600"></i> Historial y Seguimiento de Transferencias</h5>
          <button onclick="loadTransferenciasData()" class="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200"><i class="fas fa-sync"></i> Actualizar</button>
        </div>
        <div id="transferencias-table-container" class="overflow-x-auto text-xs">
          <div class="text-center py-6 text-gray-400 font-bold uppercase">Cargando transferencias...</div>
        </div>
      </div>
    </div>
  `;
  loadTransferenciasData();
}

window.loadTransferenciasData = function () {
  const container = document.getElementById('transferencias-table-container');
  if (!container) return;

  fetchApi('ACCOUNTING', 'getInventoryTransfers', {})
    .then(res => {
      const items = (res && res.transferencias) ? res.transferencias : [];
      if (items.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-gray-400 font-bold uppercase">No hay transferencias registradas.</div>`;
        return;
      }
      let html = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
              <th class="p-2">Lote TRF</th>
              <th class="p-2">Artículo</th>
              <th class="p-2 text-right">Despachado</th>
              <th class="p-2">Origen &rarr; Destino</th>
              <th class="p-2">Estado</th>
              <th class="p-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
      `;
      items.forEach(t => {
        let badgeClass = "bg-blue-100 text-blue-800";
        if (t.estadoTransferencia === "EnTransito") badgeClass = "bg-amber-100 text-amber-800";
        else if (t.estadoTransferencia === "RecibidaTotal") badgeClass = "bg-emerald-100 text-emerald-800";
        else if (t.estadoTransferencia === "RecibidaParcial") badgeClass = "bg-orange-100 text-orange-800";
        else if (t.estadoTransferencia === "Rechazada" || t.estadoTransferencia === "Cancelada") badgeClass = "bg-rose-100 text-rose-800";

        const accionBtn = (t.estadoTransferencia === "EnTransito")
          ? `<button onclick="handleRecibirTransferencia('${t.transferBatchId}', '${t.itemCodigo}', '${t.cantidadDespachada}', '${t.ubicacionDestino}')" class="px-2 py-1 bg-emerald-50 text-emerald-600 rounded font-bold text-[10px] hover:bg-emerald-100 uppercase">Recibir</button>`
          : `<span class="text-gray-400 font-bold text-[10px]">${t.cantidadRecibida || t.cantidadDespachada} rec.</span>`;

        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-2 font-mono font-bold text-indigo-600">${t.transferBatchId}</td>
            <td class="p-2"><span class="font-bold text-gray-800">${t.itemNombre || t.itemCodigo}</span> <span class="font-mono text-gray-400 text-[10px]">(${t.itemCodigo})</span></td>
            <td class="p-2 text-right font-mono font-bold">${t.cantidadDespachada}</td>
            <td class="p-2 text-gray-700 font-medium">${t.ubicacionOrigen} &rarr; ${t.ubicacionDestino}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}">${t.estadoTransferencia}</span></td>
            <td class="p-2 text-right">${accionBtn}</td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
      container.innerHTML = html;
    })
    .catch(err => {
      container.innerHTML = `<div class="p-4 text-rose-600 font-bold text-center">Error al cargar transferencias: ${err.message}</div>`;
    });
};

window.handleSaveTransferencia = function (e) {
  e.preventDefault();
  const payload = {
    itemCodigo: document.getElementById('trf-codigo').value,
    itemNombre: document.getElementById('trf-nombre').value,
    cantidad: document.getElementById('trf-cantidad').value,
    ubicacionOrigen: document.getElementById('trf-origen').value,
    ubicacionDestino: document.getElementById('trf-destino').value,
    requiereConfirmacionFisica: document.getElementById('trf-requiere-recepcion').checked,
    observaciones: document.getElementById('trf-obs').value
  };

  fetchApi('ACCOUNTING', 'transferInventoryStock', payload)
    .then(res => {
      alert(res.message || "Transferencia despachada con éxito.");
      document.getElementById('form-transferencia').reset();
      loadTransferenciasData();
      if (typeof loadKardexData === "function") loadKardexData();
    })
    .catch(err => alert("Error: " + err.message));
};

window.handleRecibirTransferencia = function (transferBatchId, itemCodigo, cantDespachada, uDestino) {
  const cantStr = prompt(`Confirmar unidades físicas recibidas en ${uDestino} (Despachadas: ${cantDespachada}):`, cantDespachada);
  if (cantStr === null) return;

  const cantRec = parseFloat(cantStr);
  if (isNaN(cantRec) || cantRec < 0) {
    alert("Cantidad recibida inválida.");
    return;
  }

  let justif = "";
  if (cantRec !== parseFloat(cantDespachada)) {
    justif = prompt("Especifique justificación de la discrepancia de recepción:") || "Diferencia de conteo en destino";
  }

  fetchApi('ACCOUNTING', 'confirmTransferReceipt', {
    transferBatchId: transferBatchId,
    cantidadRecibida: cantRec,
    justificacionDiscrepancia: justif,
    observaciones: "Recepción confirmada desde interfaz contable"
  })
    .then(res => {
      alert(res.message || "Recepción confirmada con éxito.");
      loadTransferenciasData();
      if (typeof loadKardexData === "function") loadKardexData();
    })
    .catch(err => alert("Error: " + err.message));
};
