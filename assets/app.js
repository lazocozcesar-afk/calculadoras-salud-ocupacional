import { audiometria, ruido, espirometria, antropometria } from '../src/index.js';

const $ = (id) => document.getElementById(id);
const f1 = (n) => n.toLocaleString('es-PE', { maximumFractionDigits: 1 });
const num = (id) => { const v = $(id).value; return v === '' ? NaN : Number(v); };

// Pestañas (solo en la portada)
document.querySelectorAll('nav button[data-tab]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('nav button[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
  document.querySelectorAll('section').forEach((s) => s.classList.toggle('activa', s.id === b.dataset.tab));
}));

// Tablas de audiometría
if ($('tabla-actual')) {
  const FRECS = [500, 1000, 2000, 3000, 4000, 6000, 8000];
  function armarTabla(id, prefijo) {
    const t = $(id);
    t.innerHTML = `<tr><th>Oído</th>${FRECS.map((f) => `<th>${f >= 1000 ? f / 1000 + 'k' : f}</th>`).join('')}</tr>` +
      ['derecho', 'izquierdo'].map((o) => `<tr><td>${o === 'derecho' ? 'Derecho' : 'Izquierdo'}</td>${FRECS.map((f) =>
        `<td><input type="number" step="5" aria-label="${prefijo} ${o} ${f} Hz" data-p="${prefijo}" data-o="${o}" data-f="${f}"></td>`).join('')}</tr>`).join('');
  }
  armarTabla('tabla-actual', 'actual');
  armarTabla('tabla-base', 'base');
  function leer(prefijo, oido) {
    const r = {};
    document.querySelectorAll(`input[data-p="${prefijo}"][data-o="${oido}"]`).forEach((i) => {
      if (i.value !== '') r[i.dataset.f] = Number(i.value);
    });
    return r;
  }

  $('calc-audio').addEventListener('click', () => {
    const out = [];
    const d = leer('actual', 'derecho'), i = leer('actual', 'izquierdo');
    try {
      const oms = audiometria.clasificarOMS({ derecho: d, izquierdo: i });
      out.push(`OMS 2021 (0,5-1-2-4 kHz): OD ${f1(oms.promedioDerecho)} dB (${oms.gradoDerecho}), OI ${f1(oms.promedioIzquierdo)} dB (${oms.gradoIzquierdo}).`,
        `Grado (mejor oído): ${oms.grado}${oms.unilateral ? ' — pérdida UNILATERAL' : ''}.`);
    } catch (e) { out.push(`OMS: ${e.message}.`); }
    try {
      const a = audiometria.deficienciaBinauralAAO({ derecho: d, izquierdo: i });
      out.push(`AAO 1979 (0,5-1-2-3 kHz): OD ${f1(a.derecho.porcentaje)} %, OI ${f1(a.izquierdo.porcentaje)} %, binaural ${f1(a.binaural)} %.`);
    } catch (e) { out.push(`AAO: ${e.message}.`); }
    for (const [oido, nombre] of [['derecho', 'OD'], ['izquierdo', 'OI']]) {
      const base = leer('base', oido);
      if (!Object.keys(base).length) continue;
      try {
        const s = audiometria.cambioEstandarUmbral(base, leer('actual', oido));
        out.push(`STS ${nombre} (2-3-4 kHz): base ${f1(s.promedioBase)} → actual ${f1(s.promedioActual)} dB, cambio ${f1(s.cambio)} dB → ${s.sts ? 'HAY STS' + (s.registrable ? ' (registrable)' : ' (no registrable: promedio < 25 dB)') : 'sin STS'}.`);
      } catch (e) { out.push(`STS ${nombre}: ${e.message}.`); }
    }
    $('res-audio').textContent = out.join('\n');
  });
}

// Ruido
if ($('filas-ruido')) {
  function filaRuido(nivel = '', horas = '') {
    const div = document.createElement('div');
    div.className = 'fila-ruido';
    div.innerHTML = `<input type="number" step="0.1" placeholder="Nivel dB(A)" aria-label="Nivel dB(A)" value="${nivel}">
      <input type="number" step="0.25" placeholder="Horas" aria-label="Horas" value="${horas}">
      <button class="quitar" type="button" aria-label="Quitar">✕</button>`;
    div.querySelector('button').onclick = () => div.remove();
    $('filas-ruido').append(div);
  }
  filaRuido(); filaRuido();
  $('agregar-ruido').onclick = () => filaRuido();
  $('calc-ruido').addEventListener('click', () => {
    const [c, x] = $('criterio').value.split('-').map(Number);
    const op = { criterio: c, intercambio: x };
    const exp = [...document.querySelectorAll('.fila-ruido')].map((f) => {
      const [n, h] = f.querySelectorAll('input');
      return { nivel: Number(n.value), horas: Number(h.value) };
    }).filter((e) => e.horas > 0 && !Number.isNaN(e.nivel) && e.nivel > 0);
    try {
      const r = ruido.evaluarJornada(exp, op);
      const out = [`Dosis: ${f1(r.dosisPorcentaje)} % — ${r.superaLimite ? 'SUPERA el límite' : 'dentro del límite'}.`,
        `Nivel promedio ponderado de 8 h (TWA): ${f1(r.nivelPonderado8h)} dB(A).`];
      const nrr = num('nrr');
      if (!Number.isNaN(nrr)) {
        const p = ruido.nivelConProtector(r.nivelPonderado8h, nrr);
        out.push(`Con protector NRR ${nrr}: atenuación estimada ${f1(p.atenuacion)} dB → ~${f1(p.nivel)} dB(A) en el oído.`);
      }
      $('res-ruido').textContent = out.join('\n');
    } catch (e) { $('res-ruido').textContent = e.message; }
  });
}

// Espirometría
if ($('calc-espiro')) {
  $('calc-espiro').addEventListener('click', () => {
    const out = [];
    try {
      const r = espirometria.interpretarZ({ zFev1Fvc: num('z-ratio'), zFvc: num('z-fvc'), zFev1: num('z-fev1') });
      out.push(`Patrón: ${r.patron}.`);
      if (r.gravedad) out.push(`Gravedad (z FEV1): ${r.gravedad}.`);
      if (r.nota) out.push(r.nota);
    } catch (e) { out.push(e.message); }
    if (!Number.isNaN(num('bd-pre')) && !Number.isNaN(num('bd-post'))) {
      try {
        const b = espirometria.respuestaBroncodilatadora({ pre: num('bd-pre'), post: num('bd-post'), predicho: num('bd-pred') });
        out.push(`Respuesta broncodilatadora: ${f1(b.cambioPorcentaje)} % del predicho → ${b.significativa ? 'SIGNIFICATIVA (> 10 %)' : 'no significativa'}.`);
      } catch (e) { out.push(e.message); }
    }
    $('res-espiro').textContent = out.join('\n');
  });
}

// Antropometría
if ($('calc-antropo')) {
  $('calc-antropo').addEventListener('click', () => {
    const out = [];
    try {
      const v = antropometria.imc(num('peso'), num('talla'));
      out.push(`IMC: ${f1(v)} kg/m² — ${antropometria.categoriaIMC(v)}.`);
    } catch (e) { out.push(e.message); }
    if (!Number.isNaN(num('cintura'))) {
      out.push(`Riesgo por perímetro abdominal: ${antropometria.riesgoPerimetroAbdominal(num('cintura'), $('sexo').value)}.`);
    }
    $('res-antropo').textContent = out.join('\n');
  });
}
