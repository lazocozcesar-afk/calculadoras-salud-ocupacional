/**
 * Audiometría ocupacional.
 *
 * Los umbrales se reciben como objeto { frecuenciaHz: umbral_dB_HL },
 * por ejemplo { 500: 15, 1000: 20, 2000: 25, 3000: 35, 4000: 45 }.
 *
 * Fuentes:
 *  - OMS. World Report on Hearing (2021), tabla de grados de pérdida auditiva.
 *  - OSHA 29 CFR 1910.95(g)(10): Standard Threshold Shift (STS).
 *  - OSHA 29 CFR 1904.10: registro de pérdida auditiva (STS + promedio >= 25 dB).
 *  - AAO-HNS / AAO 1979 (Guides to the Evaluation of Permanent Impairment, AMA):
 *    porcentaje de deficiencia auditiva.
 */

export const FRECUENCIAS_OMS = [500, 1000, 2000, 4000];
export const FRECUENCIAS_STS = [2000, 3000, 4000];
export const FRECUENCIAS_AAO = [500, 1000, 2000, 3000];

function leerUmbral(umbrales, f) {
  const v = umbrales?.[f];
  if (typeof v !== 'number' || Number.isNaN(v)) {
    throw new Error(`Falta el umbral de ${f} Hz`);
  }
  return v;
}

/** Promedio tonal puro de las frecuencias indicadas. */
export function promedioTonal(umbrales, frecuencias = FRECUENCIAS_OMS) {
  const suma = frecuencias.reduce((acc, f) => acc + leerUmbral(umbrales, f), 0);
  return suma / frecuencias.length;
}

/** Grado OMS 2021 a partir del promedio de 0,5-1-2-4 kHz. */
export function gradoOMS(promedio) {
  if (promedio < 20) return 'Audición normal';
  if (promedio < 35) return 'Pérdida leve';
  if (promedio < 50) return 'Pérdida moderada';
  if (promedio < 65) return 'Pérdida moderadamente severa';
  if (promedio < 80) return 'Pérdida severa';
  if (promedio < 95) return 'Pérdida profunda';
  return 'Pérdida completa o total';
}

/**
 * Clasificación OMS 2021 de ambos oídos.
 * El grado se asigna con el MEJOR oído; se marca "unilateral" cuando el mejor
 * oído es < 20 dB y el peor es >= 35 dB.
 */
export function clasificarOMS({ derecho, izquierdo }) {
  const pd = promedioTonal(derecho, FRECUENCIAS_OMS);
  const pi = promedioTonal(izquierdo, FRECUENCIAS_OMS);
  const mejor = Math.min(pd, pi);
  const peor = Math.max(pd, pi);
  return {
    promedioDerecho: pd,
    promedioIzquierdo: pi,
    gradoDerecho: gradoOMS(pd),
    gradoIzquierdo: gradoOMS(pi),
    grado: gradoOMS(mejor),
    unilateral: mejor < 20 && peor >= 35,
  };
}

/**
 * Cambio estándar de umbral (STS, OSHA) en UN oído.
 * STS = el promedio de 2-3-4 kHz empeora >= 10 dB respecto a la línea base.
 * Registrable (OSHA 1904.10) = STS y promedio actual >= 25 dB.
 * NO aplica el ajuste por edad del Apéndice F (pendiente; ver docs/hoja-de-ruta.md).
 */
export function cambioEstandarUmbral(lineaBase, actual) {
  const promedioBase = promedioTonal(lineaBase, FRECUENCIAS_STS);
  const promedioActual = promedioTonal(actual, FRECUENCIAS_STS);
  const cambio = promedioActual - promedioBase;
  const sts = cambio >= 10;
  return {
    promedioBase,
    promedioActual,
    cambio,
    sts,
    registrable: sts && promedioActual >= 25,
    ajustePorEdad: false,
  };
}

/** Deficiencia auditiva monoaural AAO 1979: (promedio − 25) × 1,5 %, entre 0 y 100. */
export function deficienciaMonoauralAAO(umbrales) {
  const promedio = promedioTonal(umbrales, FRECUENCIAS_AAO);
  const pct = (promedio - 25) * 1.5;
  return { promedio, porcentaje: Math.min(100, Math.max(0, pct)) };
}

/** Deficiencia auditiva binaural AAO 1979: (5 × mejor oído + peor oído) / 6. */
export function deficienciaBinauralAAO({ derecho, izquierdo }) {
  const d = deficienciaMonoauralAAO(derecho);
  const i = deficienciaMonoauralAAO(izquierdo);
  const mejor = Math.min(d.porcentaje, i.porcentaje);
  const peor = Math.max(d.porcentaje, i.porcentaje);
  return {
    derecho: d,
    izquierdo: i,
    binaural: (5 * mejor + peor) / 6,
  };
}
