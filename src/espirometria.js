/**
 * Interpretación de espirometría por z-score.
 *
 * Esta versión NO calcula valores predichos: recibe los z-scores que entrega el
 * espirómetro con la ecuación de referencia que use (se recomienda GLI Global 2022).
 *
 * Fuente:
 *  - Stanojevic S, et al. ERS/ATS technical standard on interpretive strategies
 *    for routine lung function tests. Eur Respir J 2022;60:2101499.
 *    · Límite inferior de normalidad (LIN) = z −1,645 (percentil 5).
 *    · Gravedad por z de FEV1: leve −1,65 a −2,5; moderada −2,5 a −4; grave < −4.
 *    · Respuesta broncodilatadora: cambio > 10 % del valor PREDICHO en FEV1 o FVC.
 */

export const LIN_Z = -1.645;

export function gravedadPorZ(zFev1) {
  if (zFev1 >= LIN_Z) return 'Sin reducción del FEV1';
  if (zFev1 >= -2.5) return 'Leve';
  if (zFev1 >= -4) return 'Moderada';
  return 'Grave';
}

/**
 * Patrón espirométrico a partir de los z-scores.
 * { zFev1Fvc, zFvc, zFev1 }
 */
export function interpretarZ({ zFev1Fvc, zFvc, zFev1 }) {
  for (const [nombre, v] of Object.entries({ zFev1Fvc, zFvc, zFev1 })) {
    if (typeof v !== 'number' || Number.isNaN(v)) throw new Error(`Falta ${nombre}`);
  }
  const relacionBaja = zFev1Fvc < LIN_Z;
  const fvcBaja = zFvc < LIN_Z;
  const fev1Bajo = zFev1 < LIN_Z;

  let patron;
  let nota = '';
  if (relacionBaja && fvcBaja) {
    patron = 'Obstrucción con FVC baja';
    nota = 'Puede ser obstrucción con atrapamiento aéreo o un defecto mixto; confirmar con volúmenes pulmonares (TLC).';
  } else if (relacionBaja) {
    patron = 'Obstrucción';
  } else if (fvcBaja) {
    patron = 'Patrón no obstructivo con FVC baja (posible restricción)';
    nota = 'La espirometría sola no confirma restricción; se necesita TLC.';
  } else if (fev1Bajo) {
    patron = 'FEV1 bajo con relación normal (PRISm)';
    nota = 'Patrón inespecífico; correlacionar con la clínica y repetir.';
  } else {
    patron = 'Espirometría dentro de límites normales';
  }

  return {
    patron,
    gravedad: patron.startsWith('Espirometría dentro') ? null : gravedadPorZ(zFev1),
    nota,
  };
}

/**
 * Respuesta broncodilatadora (ERS/ATS 2022).
 * Valores en litros: { pre, post, predicho }
 */
export function respuestaBroncodilatadora({ pre, post, predicho }) {
  if (!(predicho > 0)) throw new Error('El valor predicho debe ser mayor que cero');
  const cambioPorcentaje = ((post - pre) / predicho) * 100;
  return { cambioPorcentaje, significativa: cambioPorcentaje > 10 };
}
