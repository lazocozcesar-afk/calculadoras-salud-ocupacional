import { PREGUNTAS } from './evaluacion-preguntas.js';

const $ = (id) => document.getElementById(id);
const LETRAS = ['A', 'B', 'C', 'D'];
const CLAVE = 'evaluacion-final-v1';
const APROBADO = 70; // % mínimo para aprobar

let estado = null; // { orden, opciones, respuestas, marcadas, actual, fin, duracion, inicio, terminado }
let reloj = null;

// ---------------------------------------------------------------- utilidades
function barajar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const rango = (n) => Array.from({ length: n }, (_, i) => i);
const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin almacenamiento */ } };
const leerGuardado = () => { try { return JSON.parse(localStorage.getItem(CLAVE)); } catch { return null; } };
const borrarGuardado = () => { try { localStorage.removeItem(CLAVE); } catch { /* nada */ } };
const escapar = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function mostrar(vista) {
  ['ev-inicio', 'ev-examen', 'ev-resultado'].forEach((v) => { $(v).hidden = v !== vista; });
  if (vista === 'ev-inicio') window.scrollTo({ top: 0 }); else $(vista).scrollIntoView({ block: 'start' });
}

// ---------------------------------------------------------------- inicio
function iniciar(indices = rango(PREGUNTAS.length)) {
  const minutos = Number($('ev-minutos').value);
  const aleatorio = $('ev-aleatorio').checked;
  const orden = aleatorio ? barajar(indices) : indices;
  const ahora = Date.now();
  estado = {
    orden,
    opciones: orden.map((i) => (aleatorio ? barajar(rango(PREGUNTAS[i].o.length)) : rango(PREGUNTAS[i].o.length))),
    respuestas: orden.map(() => null),
    marcadas: orden.map(() => false),
    actual: 0,
    inicio: ahora,
    duracion: minutos * 60000 * (orden.length / PREGUNTAS.length),
    fin: null,
    terminado: false,
  };
  estado.fin = ahora + estado.duracion;
  guardar();
  abrirExamen();
}

function abrirExamen() {
  armarMapa();
  pintarPregunta();
  mostrar('ev-examen');
  clearInterval(reloj);
  tic();
  reloj = setInterval(tic, 250);
}

function tic() {
  const resta = estado.fin - Date.now();
  const t = $('ev-reloj');
  t.textContent = mmss(resta);
  const frac = resta / estado.duracion;
  t.dataset.nivel = frac <= 0.1 ? 'critico' : frac <= 0.25 ? 'alerta' : '';
  $('ev-barra-tiempo').style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
  if (resta <= 0) terminar(true);
}

// ---------------------------------------------------------------- pregunta actual
function pintarPregunta() {
  const k = estado.actual;
  const q = PREGUNTAS[estado.orden[k]];
  $('ev-numero').textContent = `Pregunta ${k + 1} de ${estado.orden.length}`;
  $('ev-tema').textContent = q.tema;
  $('ev-enunciado').textContent = q.p;
  const cont = $('ev-opciones');
  cont.innerHTML = estado.opciones[k].map((oi, pos) => `
    <label class="ev-opcion">
      <input type="radio" name="ev-op" value="${oi}" ${estado.respuestas[k] === oi ? 'checked' : ''}>
      <span class="ev-letra">${LETRAS[pos]}</span><span>${escapar(q.o[oi])}</span>
    </label>`).join('');
  cont.querySelectorAll('input').forEach((inp) => inp.addEventListener('change', () => {
    estado.respuestas[k] = Number(inp.value);
    guardar();
    actualizarMapa();
  }));
  $('ev-marcar').setAttribute('aria-pressed', estado.marcadas[k]);
  $('ev-marcar').textContent = estado.marcadas[k] ? '★ Marcada para revisar' : '☆ Marcar para revisar';
  $('ev-anterior').disabled = k === 0;
  $('ev-siguiente').textContent = k === estado.orden.length - 1 ? 'Revisar y finalizar' : 'Siguiente →';
  actualizarMapa();
}

function ir(k) {
  estado.actual = Math.max(0, Math.min(estado.orden.length - 1, k));
  guardar();
  pintarPregunta();
  $('ev-enunciado').focus({ preventScroll: true });
  $('ev-tarjeta').scrollIntoView({ block: 'nearest' });
}

// ---------------------------------------------------------------- mapa de preguntas
function armarMapa() {
  $('ev-mapa').innerHTML = estado.orden.map((_, k) =>
    `<button type="button" data-k="${k}" aria-label="Ir a la pregunta ${k + 1}">${k + 1}</button>`).join('');
  $('ev-mapa').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => ir(Number(b.dataset.k))));
}

function actualizarMapa() {
  const resp = estado.respuestas.filter((r) => r !== null).length;
  const total = estado.orden.length;
  $('ev-progreso').textContent = `${resp}/${total} respondidas`;
  $('ev-barra-progreso').style.width = `${(resp / total) * 100}%`;
  $('ev-mapa').querySelectorAll('button').forEach((b, k) => {
    b.classList.toggle('respondida', estado.respuestas[k] !== null);
    b.classList.toggle('marcada', estado.marcadas[k]);
    if (k === estado.actual) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
}

// ---------------------------------------------------------------- finalizar
function pedirFinalizar() {
  const sin = estado.respuestas.filter((r) => r === null).length;
  const marc = estado.marcadas.filter(Boolean).length;
  const partes = [];
  if (sin) partes.push(`${sin} sin responder`);
  if (marc) partes.push(`${marc} marcada${marc > 1 ? 's' : ''} para revisar`);
  $('ev-confirmar-texto').textContent = partes.length
    ? `Tienes ${partes.join(' y ')}. ¿Deseas finalizar de todos modos?`
    : 'Respondiste todas las preguntas. ¿Deseas finalizar y ver tu resultado?';
  $('ev-confirmar').showModal();
}

function terminar(porTiempo = false) {
  if (!estado || estado.terminado) return;
  clearInterval(reloj);
  estado.terminado = true;
  estado.terminadoEn = Math.min(Date.now(), estado.fin);
  estado.porTiempo = porTiempo;
  guardar();
  if ($('ev-confirmar').open) $('ev-confirmar').close();
  pintarResultado();
}

function pintarResultado() {
  const total = estado.orden.length;
  let correctas = 0;
  const temas = {};
  const filas = estado.orden.map((qi, k) => {
    const q = PREGUNTAS[qi];
    const r = estado.respuestas[k];
    const ok = r === q.c;
    if (ok) correctas++;
    temas[q.tema] ??= { ok: 0, n: 0 };
    temas[q.tema].n++;
    if (ok) temas[q.tema].ok++;
    return { q, r, ok, k };
  });
  const pct = Math.round((correctas / total) * 100);
  const aprobado = pct >= APROBADO;
  const usado = estado.terminadoEn - estado.inicio;

  $('ev-nota').textContent = `${correctas}/${total}`;
  $('ev-pct').textContent = `${pct} %`;
  $('ev-veredicto').textContent = aprobado ? 'Aprobado' : 'Desaprobado';
  $('ev-veredicto').dataset.ok = aprobado;
  $('ev-tiempo-usado').textContent = `Tiempo usado: ${mmss(usado)}${estado.porTiempo ? ' (se acabó el tiempo)' : ''}`;
  $('ev-anillo').style.setProperty('--p', pct);

  $('ev-temas').innerHTML = Object.entries(temas).map(([t, v]) => {
    const p = Math.round((v.ok / v.n) * 100);
    return `<div class="ev-tema-fila"><span>${escapar(t)}</span><span class="ev-tema-barra"><i style="width:${p}%" data-ok="${p >= APROBADO}"></i></span><b>${v.ok}/${v.n}</b></div>`;
  }).join('');

  const errores = filas.filter((f) => !f.ok).length;
  $('ev-repetir-errores').hidden = errores === 0;
  $('ev-repetir-errores').textContent = `Practicar solo las ${errores} falladas`;

  $('ev-revision').innerHTML = filas.map(({ q, r, ok, k }) => `
    <details class="ev-rev" data-ok="${ok}" ${ok ? '' : 'open'}>
      <summary><span class="ev-icono">${ok ? '✓' : r === null ? '–' : '✗'}</span> ${k + 1}. ${escapar(q.p)}</summary>
      <ul>${estado.opciones[k].map((oi, pos) => `<li class="${oi === q.c ? 'correcta' : oi === r ? 'elegida' : ''}">${LETRAS[pos]}. ${escapar(q.o[oi])}${oi === q.c ? ' — <b>correcta</b>' : oi === r ? ' — tu respuesta' : ''}</li>`).join('')}</ul>
      ${r === null ? '<p class="ev-sin">No respondiste esta pregunta.</p>' : ''}
      <p>${escapar(q.e)}</p>
      <p class="fuente">Fuente: ${escapar(q.f)}</p>
    </details>`).join('');
  filtrarRevision('todas');
  mostrar('ev-resultado');
}

function filtrarRevision(filtro) {
  document.querySelectorAll('[data-filtro]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.filtro === filtro));
  document.querySelectorAll('.ev-rev').forEach((d) => {
    d.hidden = filtro === 'errores' ? d.dataset.ok === 'true' : false;
  });
}

// ---------------------------------------------------------------- eventos
$('ev-total').textContent = PREGUNTAS.length;
$('ev-comenzar').addEventListener('click', () => iniciar());
$('ev-anterior').addEventListener('click', () => ir(estado.actual - 1));
$('ev-siguiente').addEventListener('click', () => {
  if (estado.actual === estado.orden.length - 1) pedirFinalizar(); else ir(estado.actual + 1);
});
$('ev-marcar').addEventListener('click', () => {
  estado.marcadas[estado.actual] = !estado.marcadas[estado.actual];
  guardar();
  pintarPregunta();
});
$('ev-finalizar').addEventListener('click', pedirFinalizar);
$('ev-si').addEventListener('click', () => terminar(false));
$('ev-no').addEventListener('click', () => $('ev-confirmar').close());
$('ev-otra-vez').addEventListener('click', () => { borrarGuardado(); estado = null; mostrar('ev-inicio'); });
$('ev-repetir-errores').addEventListener('click', () => {
  const falladas = estado.orden.filter((qi, k) => estado.respuestas[k] !== PREGUNTAS[qi].c);
  iniciar(falladas);
});
document.querySelectorAll('[data-filtro]').forEach((b) => b.addEventListener('click', () => filtrarRevision(b.dataset.filtro)));

// Teclado: A-D o 1-4 eligen opción; flechas navegan
document.addEventListener('keydown', (ev) => {
  if ($('ev-examen').hidden || $('ev-confirmar').open || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.target.matches('input[type="text"], select, textarea')) return;
  const tecla = ev.key.toUpperCase();
  const idx = LETRAS.indexOf(tecla) >= 0 ? LETRAS.indexOf(tecla) : ['1', '2', '3', '4'].indexOf(tecla);
  const radios = $('ev-opciones').querySelectorAll('input');
  if (idx >= 0 && radios[idx]) { radios[idx].checked = true; radios[idx].dispatchEvent(new Event('change')); ev.preventDefault(); }
  else if (ev.key === 'ArrowRight' && !ev.target.matches('input[type="radio"]')) { if (estado.actual < estado.orden.length - 1) ir(estado.actual + 1); }
  else if (ev.key === 'ArrowLeft' && !ev.target.matches('input[type="radio"]')) { if (estado.actual > 0) ir(estado.actual - 1); }
});

window.addEventListener('beforeunload', (ev) => {
  if (estado && !estado.terminado) { ev.preventDefault(); ev.returnValue = ''; }
});

// Reanudar si hay un intento guardado (el tiempo sigue corriendo aunque cierres la página)
const previo = leerGuardado();
if (previo && Array.isArray(previo.orden) && previo.orden.every((i) => PREGUNTAS[i])) {
  estado = previo;
  if (estado.terminado) pintarResultado();
  else if (Date.now() >= estado.fin) terminar(true);
  else abrirExamen();
}
