/**
 * Exposición ocupacional a ruido.
 *
 * Criterio por defecto: 85 dB(A) durante 8 horas con tasa de intercambio de 3 dB
 * (NIOSH 1998, Criteria for a Recommended Standard: Occupational Noise Exposure;
 * es el criterio que usa la normativa peruana de seguridad minera, DS 024-2016-EM).
 * Para el criterio legal de OSHA usar { criterio: 90, intercambio: 5 }.
 *
 * Fuentes:
 *  - NIOSH 98-126 (1998), capítulo 1 y fórmulas de dosis y TWA.
 *  - OSHA 29 CFR 1910.95, Apéndice A (dosis y TWA).
 *  - OSHA Technical Manual, sección III, cap. 5: corrección del NRR
 *    (restar 7 dB si se mide en dB(A) y aplicar 50 % de reducción).
 */

const POR_DEFECTO = { criterio: 85, intercambio: 3, horasReferencia: 8 };

/** Horas permitidas para un nivel dado: T = 8 / 2^((L − criterio) / intercambio). */
export function tiempoPermitido(nivel, opciones = {}) {
  const { criterio, intercambio, horasReferencia } = { ...POR_DEFECTO, ...opciones };
  return horasReferencia / 2 ** ((nivel - criterio) / intercambio);
}

/**
 * Dosis diaria como fracción (1 = 100 %).
 * exposiciones: [{ nivel: dB(A), horas: número }]
 */
export function dosis(exposiciones, opciones = {}) {
  if (!Array.isArray(exposiciones) || exposiciones.length === 0) {
    throw new Error('Ingrese al menos una exposición');
  }
  return exposiciones.reduce((acc, { nivel, horas }) => {
    if (horas < 0) throw new Error('Las horas no pueden ser negativas');
    return acc + horas / tiempoPermitido(nivel, opciones);
  }, 0);
}

/** Nivel promedio ponderado de 8 h (TWA): criterio + (intercambio / log10 2) × log10(dosis). */
export function nivelPonderado8h(dosisFraccion, opciones = {}) {
  const { criterio, intercambio } = { ...POR_DEFECTO, ...opciones };
  if (dosisFraccion <= 0) throw new Error('La dosis debe ser mayor que cero');
  return criterio + (intercambio / Math.log10(2)) * Math.log10(dosisFraccion);
}

/** Resumen completo de una jornada. */
export function evaluarJornada(exposiciones, opciones = {}) {
  const d = dosis(exposiciones, opciones);
  const twa = nivelPonderado8h(d, opciones);
  return {
    dosisPorcentaje: d * 100,
    nivelPonderado8h: twa,
    superaLimite: d > 1,
  };
}

/** Suma energética de niveles: 10 × log10(Σ 10^(Li/10)). */
export function sumarNiveles(niveles) {
  if (!niveles.length) throw new Error('Ingrese al menos un nivel');
  return 10 * Math.log10(niveles.reduce((acc, l) => acc + 10 ** (l / 10), 0));
}

/**
 * Nivel estimado bajo el protector auditivo (método OSHA para mediciones en dB(A)).
 * nivelBajoProtector = TWA − (NRR − 7) × factorReduccion   (factor por defecto 0,5)
 */
export function nivelConProtector(twaDBA, nrr, { factorReduccion = 0.5 } = {}) {
  const atenuacion = Math.max(0, (nrr - 7) * factorReduccion);
  return { atenuacion, nivel: twaDBA - atenuacion };
}
