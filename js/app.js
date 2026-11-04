// ============================================
// Guru Box - App principal
// ============================================

// Datos temporales (después se reemplaza por Firebase)
let alumnos = JSON.parse(localStorage.getItem('guru-alumnos') || '[]');

// ---------- Utilidades de fechas ----------
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function diasHasta(fechaStr) {
  const hoyDate = new Date();
  hoyDate.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr + 'T00:00:00');
  const diff = Math.ceil((fecha - hoyDate) / (1000 * 60 * 60 * 24));
  return diff;
}

function estadoVencimiento(fechaVencimiento) {
  const dias = diasHasta(fechaVencimiento);
  if (dias < 0) return { tipo: 'danger', texto: 'Vencido', dias };
  if (dias === 0) return { tipo: 'danger', texto: 'Vence hoy', dias };
  if (dias <= 5) return { tipo: 'warn', texto: `Vence en ${dias}d`, dias };
  return { tipo: 'ok', texto: 'Al día', dias };
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '-';
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
}

// ---------- Guardar / cargar ----------
function guardar() {
  localStorage.setItem('guru-alumnos', JSON.stringify(alumnos));
}

// ---------- Render lista de alumnos ----------
function renderAlumnos(filtro = '') {
  const contenedor = document.getElementById('lista-alumnos');
  const vacio = document.getElementById('sin-alumnos');
  const texto = filtro.toLowerCase().trim();

  let lista = alumnos;
  if (texto) {
    lista = alumnos.filter(a =>
      a.nombre.toLowerCase().includes(texto) ||
      (a.telefono && a.telefono.includes(texto))
    );
  }

  // Ordenar por nombre
  lista = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (lista.length === 0) {
    contenedor.innerHTML = '';
    vacio.classList.remove('hidden');
    return;
  }

  vacio.classList.add('hidden');
  contenedor.innerHTML = lista.map(a => {
    const estado = estadoVencimiento(a.fechaVencimiento);
    return `
      <article class="alumno-card" data-id="${a.id}">
        <div class="alumno-info">
          <h3>${a.nombre}</h3>
          <p>${a.plan}${a.telefono ? ' · ' + a.telefono : ''}</p>
        </div>
        <div class="alumno-meta">
          <span class="badge ${estado.tipo}">${estado.texto}</span>
          <div class="fecha">Vence ${formatearFecha(a.fechaVencimiento)}</div>
        </div>
      </article>
    `;
  }).join('');
}

// ---------- Render vencimientos ----------
function renderVencimientos(filtro = 'todos') {
  const contenedor = document.getElementById('lista-vencimientos');
  const vacio = document.getElementById('sin-vencimientos');

  let lista = alumnos.map(a => ({
    ...a,
    estado: estadoVencimiento(a.fechaVencimiento)
  }));

  if (filtro === 'vencidos') {
    lista = lista.filter(a => a.estado.dias < 0);
  } else if (filtro === 'proximos') {
    lista = lista.filter(a => a.estado.dias >= 0 && a.estado.dias <= 5);
  }

  // Ordenar: primero los más urgentes
  lista.sort((a, b) => a.estado.dias - b.estado.dias);

  if (lista.length === 0) {
    contenedor.innerHTML = '';
    vacio.classList.remove('hidden');
    return;
  }

  vacio.classList.add('hidden');
  contenedor.innerHTML = lista.map(a => `
    <article class="alumno-card">
      <div class="alumno-info">
        <h3>${a.nombre}</h3>
        <p>${a.plan}</p>
      </div>
      <div class="alumno-meta">
        <span class="badge ${a.estado.tipo}">${a.estado.texto}</span>
        <div class="fecha">${formatearFecha(a.fechaVencimiento)}</div>
      </div>
    </article>
  `).join('');
}

// ---------- Toast ----------
function mostrarToast(mensaje) {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ---------- Tabs ----------
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      contents.forEach(c => c.classList.remove('active'));
      document.getElementById('tab-' + target).classList.add('active');

      if (target === 'alumnos') renderAlumnos(document.getElementById('buscar').value);
      if (target === 'vencimientos') {
        const activo = document.querySelector('.filtro.active');
        renderVencimientos(activo ? activo.dataset.filtro : 'todos');
      }
    });
  });
}

// ---------- Filtros de vencimientos ----------
function initFiltros() {
  document.querySelectorAll('.filtro').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderVencimientos(btn.dataset.filtro);
    });
  });
}

// ---------- Formulario agregar ----------
function initForm() {
  const form = document.getElementById('form-alumno');
  const fechaInicio = document.getElementById('fechaInicio');
  const fechaVenc = document.getElementById('fechaVencimiento');
  const planSelect = document.getElementById('plan');

  // Fecha de hoy por defecto
  fechaInicio.value = hoy();

  // Calcular vencimiento automático según plan
  function calcularVencimiento() {
    if (!fechaInicio.value) return;
    const inicio = new Date(fechaInicio.value + 'T00:00:00');
    const plan = planSelect.value;
    let meses = 1;
    if (plan === 'Trimestral') meses = 3;
    if (plan === 'Semestral') meses = 6;
    if (plan === 'Anual') meses = 12;

    inicio.setMonth(inicio.getMonth() + meses);
    fechaVenc.value = inicio.toISOString().slice(0, 10);
  }

  planSelect.addEventListener('change', calcularVencimiento);
  fechaInicio.addEventListener('change', calcularVencimiento);
  calcularVencimiento();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nuevo = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      nombre: document.getElementById('nombre').value.trim(),
      telefono: document.getElementById('telefono').value.trim(),
      plan: planSelect.value,
      fechaInicio: fechaInicio.value,
      fechaVencimiento: fechaVenc.value,
      notas: document.getElementById('notas').value.trim(),
      activo: true,
      creadoEn: new Date().toISOString()
    };

    alumnos.push(nuevo);
    guardar();
    form.reset();
    fechaInicio.value = hoy();
    calcularVencimiento();

    mostrarToast('Alumno guardado');

    // Volver a la lista
    document.querySelector('.tab[data-tab="alumnos"]').click();
    renderAlumnos();
  });
}

// ---------- Buscador ----------
function initBuscador() {
  const input = document.getElementById('buscar');
  input.addEventListener('input', () => {
    renderAlumnos(input.value);
  });
}

// ---------- Inicio ----------
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFiltros();
  initForm();
  initBuscador();
  renderAlumnos();
});
