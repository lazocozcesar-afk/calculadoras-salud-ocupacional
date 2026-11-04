import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audiometria, ruido, espirometria, antropometria } from '../src/index.js';

const cerca = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

// ---------- Audiometría ----------
test('grados OMS 2021 en los límites', () => {
  assert.equal(audiometria.gradoOMS(19.9), 'Audición normal');
  assert.equal(audiometria.gradoOMS(20), 'Pérdida leve');
  assert.equal(audiometria.gradoOMS(35), 'Pérdida moderada');
  assert.equal(audiometria.gradoOMS(50), 'Pérdida moderadamente severa');
  assert.equal(audiometria.gradoOMS(65), 'Pérdida severa');
  assert.equal(audiometria.gradoOMS(80), 'Pérdida profunda');
  assert.equal(audiometria.gradoOMS(95), 'Pérdida completa o total');
});

test('OMS: el grado se toma del mejor oído y detecta unilateral', () => {
  const r = audiometria.clasificarOMS({
    derecho: { 500: 10, 1000: 10, 2000: 15, 4000: 20 }, // 13,75
    izquierdo: { 500: 30, 1000: 35, 2000: 40, 4000: 50 }, // 38,75
  });
  assert.equal(r.grado, 'Audición normal');
  assert.equal(r.unilateral, true);
});

test('STS: ejemplo de clase (base 10 dB → 15/20/25)', () => {
  const r = audiometria.cambioEstandarUmbral(
    { 2000: 10, 3000: 10, 4000: 10 },
    { 2000: 15, 3000: 20, 4000: 25 },
  );
  assert.equal(r.cambio, 10);
  assert.equal(r.sts, true);
  assert.equal(r.registrable, false); // promedio actual 20 < 25
});

test('STS registrable cuando el promedio actual llega a 25', () => {
  const r = audiometria.cambioEstandarUmbral(
    { 2000: 10, 3000: 15, 4000: 20 },
    { 2000: 20, 3000: 25, 4000: 30 },
  );
  assert.equal(r.sts, true);
  assert.equal(r.registrable, true);
});

test('AAO 1979 monoaural y binaural', () => {
  const r = audiometria.deficienciaBinauralAAO({
    derecho: { 500: 25, 1000: 25, 2000: 25, 3000: 25 }, // 0 %
    izquierdo: { 500: 45, 1000: 45, 2000: 45, 3000: 45 }, // 30 %
  });
  assert.equal(r.derecho.porcentaje, 0);
  assert.equal(r.izquierdo.porcentaje, 30);
  assert.equal(r.binaural, 5); // (5×0 + 30)/6
});

test('AAO se limita a 100 %', () => {
  const r = audiometria.deficienciaMonoauralAAO({ 500: 110, 1000: 110, 2000: 110, 3000: 110 });
  assert.equal(r.porcentaje, 100);
});

test('falta un umbral → error claro', () => {
  assert.throws(() => audiometria.promedioTonal({ 500: 10 }), /2000 Hz|1000 Hz/);
});

// ---------- Ruido ----------
test('tiempo permitido 85/3: 88 dB → 4 h, 94 dB → 1 h', () => {
  cerca(ruido.tiempoPermitido(85), 8);
  cerca(ruido.tiempoPermitido(88), 4);
  cerca(ruido.tiempoPermitido(94), 1);
});

test('tiempo permitido OSHA 90/5: 95 dB → 4 h', () => {
  cerca(ruido.tiempoPermitido(95, { criterio: 90, intercambio: 5 }), 4);
});

test('8 h a 85 dB = 100 % de dosis y TWA 85', () => {
  const r = ruido.evaluarJornada([{ nivel: 85, horas: 8 }]);
  cerca(r.dosisPorcentaje, 100);
  cerca(r.nivelPonderado8h, 85);
  assert.equal(r.superaLimite, false);
});

test('jornada mixta: 4 h a 88 + 4 h a 82 dB', () => {
  const r = ruido.evaluarJornada([
    { nivel: 88, horas: 4 }, // 100 %
    { nivel: 82, horas: 4 }, // 25 %
  ]);
  cerca(r.dosisPorcentaje, 125);
  cerca(r.nivelPonderado8h, 85 + 9.966 * Math.log10(1.25), 0.01);
  assert.equal(r.superaLimite, true);
});

test('OSHA: 200 % de dosis → TWA 95', () => {
  cerca(ruido.nivelPonderado8h(2, { criterio: 90, intercambio: 5 }), 95);
});

test('suma de dos fuentes iguales = +3 dB', () => {
  cerca(ruido.sumarNiveles([90, 90]), 93.01);
});

test('protector NRR 25 en 90 dB(A) → ~81 dB(A) (ejemplo OSHA)', () => {
  const r = ruido.nivelConProtector(90, 25);
  assert.equal(r.atenuacion, 9);
  assert.equal(r.nivel, 81);
});

// ---------- Espirometría ----------
test('espirometría normal', () => {
  const r = espirometria.interpretarZ({ zFev1Fvc: -0.5, zFvc: 0.2, zFev1: -0.3 });
  assert.equal(r.patron, 'Espirometría dentro de límites normales');
  assert.equal(r.gravedad, null);
});

test('obstrucción moderada', () => {
  const r = espirometria.interpretarZ({ zFev1Fvc: -3, zFvc: -1, zFev1: -3.1 });
  assert.equal(r.patron, 'Obstrucción');
  assert.equal(r.gravedad, 'Moderada');
});

test('FVC baja con relación normal → posible restricción', () => {
  const r = espirometria.interpretarZ({ zFev1Fvc: 0.1, zFvc: -2.2, zFev1: -2.0 });
  assert.match(r.patron, /posible restricción/);
  assert.equal(r.gravedad, 'Leve');
});

test('PRISm', () => {
  const r = espirometria.interpretarZ({ zFev1Fvc: -1, zFvc: -1.5, zFev1: -1.8 });
  assert.match(r.patron, /PRISm/);
});

test('gravedad grave por debajo de −4', () => {
  assert.equal(espirometria.gravedadPorZ(-4.2), 'Grave');
});

test('respuesta broncodilatadora > 10 % del predicho', () => {
  const r = espirometria.respuestaBroncodilatadora({ pre: 2.0, post: 2.45, predicho: 4.0 });
  cerca(r.cambioPorcentaje, 11.25);
  assert.equal(r.significativa, true);
});

// ---------- Antropometría ----------
test('IMC y categorías OMS', () => {
  cerca(antropometria.imc(70, 1.75), 22.86);
  assert.equal(antropometria.categoriaIMC(24.99), 'Normal');
  assert.equal(antropometria.categoriaIMC(25), 'Sobrepeso');
  assert.equal(antropometria.categoriaIMC(40), 'Obesidad grado III');
});

test('perímetro abdominal MINSA', () => {
  assert.equal(antropometria.riesgoPerimetroAbdominal(93, 'M'), 'Bajo');
  assert.equal(antropometria.riesgoPerimetroAbdominal(94, 'M'), 'Alto');
  assert.equal(antropometria.riesgoPerimetroAbdominal(102, 'M'), 'Muy alto');
  assert.equal(antropometria.riesgoPerimetroAbdominal(88, 'F'), 'Muy alto');
});
