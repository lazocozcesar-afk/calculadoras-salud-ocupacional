/**
 * Antropometría del adulto.
 *
 * Fuentes:
 *  - OMS. Obesity: preventing and managing the global epidemic (TRS 894, 2000):
 *    categorías de IMC.
 *  - MINSA/INS. Guía técnica para la valoración nutricional antropométrica de la
 *    persona adulta (RM 184-2012/MINSA): riesgo por perímetro abdominal
 *    (varones: bajo < 94, alto 94-101, muy alto >= 102 cm;
 *     mujeres: bajo < 80, alto 80-87, muy alto >= 88 cm).
 */

export function imc(pesoKg, tallaM) {
  if (!(pesoKg > 0) || !(tallaM > 0)) throw new Error('Peso y talla deben ser mayores que cero');
  return pesoKg / (tallaM * tallaM);
}

export function categoriaIMC(valor) {
  if (valor < 18.5) return 'Bajo peso';
  if (valor < 25) return 'Normal';
  if (valor < 30) return 'Sobrepeso';
  if (valor < 35) return 'Obesidad grado I';
  if (valor < 40) return 'Obesidad grado II';
  return 'Obesidad grado III';
}

/** sexo: 'M' (masculino) o 'F' (femenino); perímetro en cm. */
export function riesgoPerimetroAbdominal(perimetroCm, sexo) {
  const [alto, muyAlto] = sexo === 'M' ? [94, 102] : sexo === 'F' ? [80, 88] : [];
  if (alto === undefined) throw new Error("El sexo debe ser 'M' o 'F'");
  if (perimetroCm >= muyAlto) return 'Muy alto';
  if (perimetroCm >= alto) return 'Alto';
  return 'Bajo';
}
