// State management
let state = {
    clients: [],
    movements: [],
    churn: [],
    stats: {},
    selectedDays: 30,
};

// DOM Elements
const app = document.getElementById('app');

// API Base URL
const API_BASE_URL = localStorage.getItem('apiBase') || '';

// Flags
let isLoading = false;
let isInitialized = false;
let charts = {};

// Initialize app
function initApp() {
    if (isInitialized) return;
    isInitialized = true;

    const path = (location.pathname || '').toLowerCase();
    if (path.endsWith('/index.html') || path === '/' || path === '') {
        renderLoading();
        fetchAllData();
    }
}

function bootstrapMockData() {
    state.clients = [
        { status: 'Activo' },
        { status: 'Activo' },
        { status: 'En riesgo' },
        { status: 'Perdido' },
        { status: 'Nuevo' },
        { status: 'Activo' },
        { status: 'Perdido' },
        { status: 'En seguimiento' },
    ];

    const today = new Date();
    const daysAgo = (n) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

    state.movements = [
        { type: 'Venta', date: daysAgo(2), value: 15000, contact: 'Cliente A' },
        { type: 'Venta', date: daysAgo(5), value: 22000, contact: 'Cliente B' },
        { type: 'Venta', date: daysAgo(10), value: 18000, contact: 'Cliente C' },
        { type: 'Venta', date: daysAgo(15), value: 35000, contact: 'Cliente A' },
        { type: 'Venta', date: daysAgo(20), value: 9000, contact: 'Cliente D' },
        { type: 'Venta', date: daysAgo(25), value: 12000, contact: 'Cliente E' },
        { type: 'Venta', date: daysAgo(28), value: 8000, contact: 'Cliente F' },
    ];

    state.churn = [
        { clasificacion: '1.1', facturacion_total: 120000 },
        { clasificacion: '1.2', facturacion_total: 80000 },
        { clasificacion: '2.1', facturacion_total: 60000 },
        { clasificacion: '2.2', facturacion_total: 30000 },
        { clasificacion: '4.1', facturacion_total: 15000 },
    ];

    state.stats = {
        clientes_sin_contacto_30d: 5,
    };
}

function refreshMockData() {
    bootstrapMockData();
    renderDashboard();
}

// Bootstrap
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Render loading
function renderLoading() {
    app.innerHTML = `
        <main class="flex-grow bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div class="flex items-center justify-center h-96">
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-moss-500 border-t-transparent"></div>
                        <p class="mt-6 text-lg text-gray-600 font-medium">Cargando dashboard...</p>
                    </div>
                </div>
            </div>
        </main>
    `;
}

// Safe fetch with error handling
async function safeFetch(path) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return null;
    }

    try {
        const url = `${API_BASE_URL}${path}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            console.error(`Ruta ${path} devolvió no-JSON`);
            return null;
        }

        if (!response.ok) {
            console.error(`Error ${response.status} en ${path}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`Error en fetch ${path}:`, error);
        return null;
    }
}

// Fetch all data
async function fetchAllData() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const [stats, clients, movements, churn] = await Promise.all([
            safeFetch('/stats'),
            safeFetch('/clientes/'),
            safeFetch('/movimientos/'),
            safeFetch('/churn/')
        ]);

        state.stats = stats || {};
        state.clients = clients || [];
        state.movements = movements || [];
        state.churn = churn || [];

        renderDashboard();
    } catch (error) {
        console.error('Error crítico:', error);
        renderError('Error al cargar los datos. Por favor, recarga la página.');
    } finally {
        isLoading = false;
    }
}

// Render error
function renderError(message) {
    app.innerHTML = `
        <main class="flex-grow bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                    <div class="flex items-center">
                        <svg class="h-6 w-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h3 class="text-lg font-semibold text-red-800">Error</h3>
                            <p class="mt-1 text-sm text-red-700">${message}</p>
                            <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                                Recargar página
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    `;
}

// Format helpers
function fmtMoney(v) {
    if (v == null || v === undefined) return '-';
    const n = Number(v);
    if (isNaN(n)) return '-';
    return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

function fmtNumber(v) {
    if (v == null || v === undefined) return '-';
    const n = Number(v);
    if (isNaN(n)) return '-';
    return n.toLocaleString('es-AR');
}

// Calculate KPIs usando churn (último pedido y facturación_total) y movements para totales
function calculateKPIs(days) {
    const movements = state.movements || [];
    const churn = state.churn || [];
    const s = state.stats || {};

    const periodDays = typeof days === 'number' && days > 0 ? days : 30;
    const now = new Date();
    const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Filtrar churn por último pedido dentro del período
    const churnPeriodo = churn.filter(c => {
        if (!c.ultimo_pedido) return false;
        const d = new Date(c.ultimo_pedido);
        return d >= cutoff;
    });

    // Clientes = cantidad de contactos con churn en el período
    const totalClientes = churnPeriodo.length;
    const clientesActivos = churnPeriodo.filter(c => (c.clasificacion || '').startsWith('1.')).length;
    const clientesPerdidos = churnPeriodo.filter(c => (c.clasificacion || '').startsWith('2.')).length;
    const sinContacto30d = s.clientes_sin_contacto_30d || 0;

    // Financieros
    const ventas = movements.filter(m => m.type === 'Venta');
    const ingresosTotales = ventas.reduce((sum, m) => sum + Number(m.value || 0), 0);

    // Ventas período = suma de facturación_total de churn en ese período
    const ingresosPeriodo = churnPeriodo.reduce((sum, c) => sum + Number(c.facturacion_total || 0), 0);
    const pedidosPeriodo = churnPeriodo.reduce((sum, c) => sum + Number(c.cantidad_pedidos || 0), 0);
    const ticketPromedio = pedidosPeriodo > 0 ? ingresosPeriodo / pedidosPeriodo : 0;

    // Churn KPIs globales
    const churnFacturacionTotal = churn.reduce((sum, c) => sum + Number(c.facturacion_total || 0), 0);
    const churnClientesNuevos = churn.filter(c => (c.clasificacion || '').startsWith('4.')).length;

    return {
        totalClientes,
        clientesActivos,
        clientesPerdidos,
        sinContacto30d,
        ingresosTotales,
        ingresosPeriodo,
        pedidosPeriodo,
        ticketPromedio,
        churnFacturacionTotal,
        churnClientesNuevos
    };
}

// Render dashboard estilo Tartalo (sin productos en stock)
function renderDashboard(days = 30) {
    state.selectedDays = typeof days === 'number' && days > 0 ? days : 30;
    const kpis = calculateKPIs(state.selectedDays);
    const churn = state.churn || [];

    // Top clientes por facturación usando churn filtrado por período (ultimo_pedido)
    const now = new Date();
    const cutoff = new Date(now.getTime() - state.selectedDays * 24 * 60 * 60 * 1000);

    const churnPeriodo = churn.filter(c => {
        if (!c.ultimo_pedido) return false;
        const d = new Date(c.ultimo_pedido);
        return d >= cutoff;
    });

    const topClientes = churnPeriodo
        .map(c => ({
            nombre: c.contacto || '(sin contacto)',
            facturacion: Number(c.facturacion_total || 0),
        }))
        .sort((a, b) => b.facturacion - a.facturacion)
        .slice(0, 30);

    app.innerHTML = `
        <main class="flex-grow bg-gray-100 pb-8">
            <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

                <!-- Caja superior como Tartalo -->
                <div class="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
                    <h1 class="text-lg font-semibold text-gray-800">Dashboard</h1>
                    <div class="flex items-center gap-2 text-sm">
                        <label class="text-gray-600" for="days-top">Período:</label>
                        <select id="days-top" name="days" class="border border-gray-300 rounded px-2 py-1 text-sm">
                            ${[7, 15, 30, 60, 90].map(d => `
                                <option value="${d}" ${d === state.selectedDays ? 'selected' : ''}>Últimos ${d} días</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <!-- Tarjetas KPI estilo Tartalo (sin productos en stock) -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
                        <p class="text-gray-500">Clientes</p>
                        <h3 class="text-2xl font-bold text-gray-800 mt-1">${fmtNumber(kpis.totalClientes)}</h3>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
                        <p class="text-gray-500">Ventas (últimos ${state.selectedDays} días)</p>
                        <h3 class="text-2xl font-bold text-gray-800 mt-1">${fmtMoney(kpis.ingresosPeriodo)}</h3>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
                        <p class="text-gray-500">Margen promedio (últimos ${state.selectedDays} días)</p>
                        <h3 class="text-2xl font-bold text-gray-800 mt-1">${kpis.ticketPromedio ? fmtMoney(kpis.ticketPromedio) : '-'}</h3>
                    </div>
                </div>

                <!-- Acciones rápidas estilo Tartalo -->
                <div class="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Acciones rápidas</h2>
                    <div id="quick-actions" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
                        <a href="/Clientes" class="quick-action px-4 py-3 rounded border border-emerald-500 text-emerald-700 bg-white text-center transition">Clientes</a>
                        <a href="/tablero" class="quick-action px-4 py-3 rounded border border-emerald-500 text-emerald-700 bg-white text-center transition">Tabla de control</a>
                        <a href="/churn-view" class="quick-action px-4 py-3 rounded border border-emerald-500 text-emerald-700 bg-white text-center transition">Churn</a>
                        <a href="/Difusiones" class="quick-action px-4 py-3 rounded border border-emerald-500 text-emerald-700 bg-white text-center transition">Difusiones</a>
                        <a href="/Clientes" class="quick-action px-4 py-3 rounded border border-emerald-500 text-emerald-700 bg-white text-center transition">Nuevo contacto</a>
                    </div>
                </div>

                <!-- Gráfico de ventas últimos días -->
                <div id="card-ventas" class="bg-white rounded-lg shadow p-6 mb-8 w-full">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-800">Ventas (últimos ${state.selectedDays} días)</h2>
                    </div>
                    <div class="h-72 w-full" style="width:100%">
                        <canvas id="chartIngresos"></canvas>
                    </div>
                </div>

                <!-- Top clientes por facturación (últimos días) -->
                <div class="bg-white rounded-lg shadow p-6 mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-800">Top clientes por facturación (últimos ${state.selectedDays} días)</h2>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                    <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Facturación</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${topClientes.length === 0 ? `
                                    <tr>
                                        <td colspan="2" class="px-4 py-3 text-sm text-gray-500 text-center">No hay datos de clientes para el período seleccionado.</td>
                                    </tr>
                                ` : topClientes.map(item => `
                                    <tr>
                                        <td class="px-4 py-2 text-sm text-gray-800">${item.nombre}</td>
                                        <td class="px-4 py-2 text-sm text-gray-800 text-right">${fmtMoney(item.facturacion)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `;

    setTimeout(() => {
        // Estilos fuertes para hover/focus de acciones rápidas (evita conflictos de Tailwind/otros)
        let qaStyle = document.getElementById('qa-style');
        if (!qaStyle) {
            qaStyle = document.createElement('style');
            qaStyle.id = 'qa-style';
            qaStyle.textContent = `
                a.quick-action:hover, a.quick-action:focus { 
                  background-color: #10b981 !important; 
                  color: #ffffff !important; 
                }
            `;
            document.head.appendChild(qaStyle);
        }

        renderCharts(state.selectedDays);
        feather.replace();

        const sel = document.getElementById('days-top');
        if (sel) {
            sel.addEventListener('change', () => {
                const newDays = parseInt(sel.value || '30', 10) || 30;
                renderDashboard(newDays);
            });
        }

        // Hover/focus de acciones rápidas controlado por JS
        const quickButtons = document.querySelectorAll('.quick-action');
        quickButtons.forEach(btn => {
            const baseBg = '#ffffff';
            const baseColor = '#047857'; // verde
            const hoverBg = '#10b981';   // emerald-500
            const hoverColor = '#ffffff'; // blanco

            function setBase() {
                btn.style.backgroundColor = baseBg;
                btn.style.color = baseColor;
            }
            function setHover() {
                btn.style.backgroundColor = hoverBg;
                btn.style.color = hoverColor;
            }

            setBase();
            btn.style.cursor = 'pointer';
            btn.addEventListener('mouseenter', setHover);
            btn.addEventListener('mouseleave', setBase);
            btn.addEventListener('focus', setHover);
            btn.addEventListener('blur', setBase);
        });

        // No expandir tarjeta: mantener mismo ancho que el resto
    }, 50);
}

// Render charts with interactive hover
function renderCharts(days) {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está cargado');
        return;
    }

    const clients = state.clients || [];
    const movements = state.movements || [];
    const churn = state.churn || [];

    // Destruir gráficos anteriores
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    charts = {};

    // 1. Clientes por Estado
    const clientesPorEstado = {};
    clients.forEach(c => {
        const estado = c.status || 'Sin estado';
        clientesPorEstado[estado] = (clientesPorEstado[estado] || 0) + 1;
    });

    const ctxClientes = document.getElementById('chartClientesEstado');
    if (ctxClientes && Object.keys(clientesPorEstado).length > 0) {
        charts.clientes = new Chart(ctxClientes.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(clientesPorEstado),
                datasets: [{
                    data: Object.values(clientesPorEstado),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(107, 142, 35, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverBorderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percent}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });

        // Recalcular en resize del viewport
        window.addEventListener('resize', () => {
            try { charts.ingresos && charts.ingresos.resize(); } catch(_) {}
        });
    }

    // 2. Churn por Clasificación
    const churnPorClasificacion = {};
    churn.forEach(c => {
        const clasif = c.clasificacion || 'Sin clasificación';
        churnPorClasificacion[clasif] = (churnPorClasificacion[clasif] || 0) + 1;
    });

    const ctxChurn = document.getElementById('chartChurn');
    if (ctxChurn && Object.keys(churnPorClasificacion).length > 0) {
        charts.churn = new Chart(ctxChurn.getContext('2d'), {
            type: 'pie',
            data: {
                labels: Object.keys(churnPorClasificacion),
                datasets: [{
                    data: Object.values(churnPorClasificacion),
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',  // Verde - Activos
                        'rgba(239, 68, 68, 0.8)',   // Rojo - Perdidos
                        'rgba(245, 158, 11, 0.8)', // Amarillo - Nuevos
                        'rgba(59, 130, 246, 0.8)',  // Azul
                        'rgba(107, 142, 35, 0.8)'   // Moss
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverBorderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percent}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }

    // 3. Ingresos últimos N días (según período)
    const ahora = new Date();
    const periodDays = typeof days === 'number' && days > 0 ? days : (state.selectedDays || 30);
    const cutoff = new Date(ahora.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const ingresosPorDia = {};
    
    movements
        .filter(m => {
            if (!m.date || m.type !== 'Venta') return false;
            const fecha = new Date(m.date);
            return fecha >= cutoff;
        })
        .forEach(m => {
            const fecha = new Date(m.date);
            const key = fecha.toISOString().slice(0, 10);
            ingresosPorDia[key] = (ingresosPorDia[key] || 0) + Number(m.value || 0);
        });

    const diasOrdenados = Object.keys(ingresosPorDia).sort();
    const labelsIngresos = diasOrdenados.map(d => {
        const fecha = new Date(d + 'T00:00:00');
        return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    });
    const valoresIngresos = diasOrdenados.map(d => ingresosPorDia[d]);

    const ctxIngresos = document.getElementById('chartIngresos');
    if (ctxIngresos && valoresIngresos.length > 0) {
        // Forzar el canvas a ocupar el 100% del ancho del contenedor
        const parent = ctxIngresos.parentElement;
        if (parent) {
            parent.style.width = '100%';
            parent.style.display = '';
            parent.style.justifyContent = '';
            parent.style.alignItems = '';
        }
        ctxIngresos.style.display = 'block';
        // Ocupa todo el ancho disponible del contenedor
        ctxIngresos.style.width = '100%';
        ctxIngresos.style.maxWidth = '';
        ctxIngresos.style.margin = '0';
        // Fijar tamaño explícito para evitar canvas chico
        const available = parent ? parent.clientWidth : ctxIngresos.clientWidth;
        const w = available || 800;
        ctxIngresos.width = w;
        ctxIngresos.height = 420; // más alto para dar mayor presencia horizontal

        charts.ingresos = new Chart(ctxIngresos.getContext('2d'), {
            type: 'line',
            data: {
                labels: labelsIngresos,
                datasets: [{
                    label: 'Ingresos',
                    data: valoresIngresos,
                    borderColor: 'rgba(107, 142, 35, 1)',
                    backgroundColor: 'rgba(107, 142, 35, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgba(107, 142, 35, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                return `Ingresos: ${fmtMoney(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return fmtMoney(value);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        offset: false,
                        ticks: { maxRotation: 0, autoSkip: true },
                        grid: { display: false }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // 4. Top 10 Clientes
    const facturacionPorCliente = {};
    movements
        .filter(m => m.type === 'Venta' && m.contact)
        .forEach(m => {
            const contacto = (m.contact || '').trim();
            if (!facturacionPorCliente[contacto]) {
                facturacionPorCliente[contacto] = 0;
            }
            facturacionPorCliente[contacto] += Number(m.value || 0);
        });

    const topClientes = Object.entries(facturacionPorCliente)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const ctxTopClientes = document.getElementById('chartTopClientes');
    if (ctxTopClientes && topClientes.length > 0) {
        charts.topClientes = new Chart(ctxTopClientes.getContext('2d'), {
            type: 'bar',
            data: {
                labels: topClientes.map(([name]) => name.length > 20 ? name.substring(0, 20) + '...' : name),
                datasets: [{
                    label: 'Facturación',
                    data: topClientes.map(([, value]) => value),
                    backgroundColor: 'rgba(107, 142, 35, 0.8)',
                    borderColor: 'rgba(107, 142, 35, 1)',
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(107, 142, 35, 1)',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                return `Facturación: ${fmtMoney(context.parsed.x)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return fmtMoney(value);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Render tables
function renderTables() {
    const clients = state.clients || [];
    const churn = state.churn || [];

    // Tabla: Clientes por Estado
    const clientesPorEstado = {};
    clients.forEach(c => {
        const estado = c.status || 'Sin estado';
        clientesPorEstado[estado] = (clientesPorEstado[estado] || 0) + 1;
    });

    const totalClientes = clients.length;
    const tableClientes = document.getElementById('tableClientesEstado');
    if (tableClientes) {
        const rows = Object.entries(clientesPorEstado)
            .sort((a, b) => b[1] - a[1])
            .map(([estado, cantidad]) => {
                const porcentaje = totalClientes > 0 ? ((cantidad / totalClientes) * 100).toFixed(1) : '0';
                return `
                    <tr class="stat-card">
                        <td class="px-4 py-3 text-sm font-medium text-gray-900">${estado}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">${cantidad}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">
                            <div class="flex items-center gap-2">
                                <span>${porcentaje}%</span>
                                <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                                    <div class="bg-moss-500 h-2 rounded-full" style="width: ${porcentaje}%"></div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        tableClientes.innerHTML = rows || '<tr><td colspan="3" class="px-4 py-3 text-sm text-gray-500 text-center">No hay datos</td></tr>';
    }

    // Tabla: Análisis de Churn
    const churnPorClasificacion = {};
    churn.forEach(c => {
        const clasif = c.clasificacion || 'Sin clasificación';
        if (!churnPorClasificacion[clasif]) {
            churnPorClasificacion[clasif] = {
                count: 0,
                factTotal: 0
            };
        }
        churnPorClasificacion[clasif].count++;
        churnPorClasificacion[clasif].factTotal += Number(c.facturacion_total || 0);
    });

    const tableChurn = document.getElementById('tableChurn');
    if (tableChurn) {
        const rows = Object.entries(churnPorClasificacion)
            .map(([clasif, data]) => {
                const factProm = data.count > 0 ? data.factTotal / data.count : 0;
                return {
                    clasif,
                    html: `
                        <tr class="stat-card">
                            <td class="px-4 py-3 text-sm font-medium text-gray-900">${clasif}</td>
                            <td class="px-4 py-3 text-sm text-gray-900">${data.count}</td>
                            <td class="px-4 py-3 text-sm text-gray-900">${fmtMoney(data.factTotal)}</td>
                            <td class="px-4 py-3 text-sm text-gray-900">${fmtMoney(factProm)}</td>
                        </tr>
                    `,
                    sortKey: parseFloat(clasif.match(/(\d+\.\d+)/)?.[1] || '999')
                };
            })
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(item => item.html)
            .join('');
        tableChurn.innerHTML = rows || '<tr><td colspan="4" class="px-4 py-3 text-sm text-gray-500 text-center">No hay datos</td></tr>';
    }
}

// Make fetchAllData available globally
window.fetchAllData = fetchAllData;
