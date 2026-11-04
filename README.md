# Calculadoras de Salud Ocupacional

Calculadoras **abiertas y gratuitas** de medicina ocupacional, pensadas para médicos ocupacionales del **Perú y Latinoamérica**. Cada fórmula indica su **fuente publicada** y tiene pruebas automáticas.

Se pueden usar de dos formas:

1. **Página web**: se abre en el navegador, no necesita instalación y los datos no salen de tu computadora.
2. **Biblioteca JavaScript** sin dependencias: para integrarla en sistemas de EMO, historias clínicas o software de vigilancia médica.

> ⚠️ Es una herramienta de apoyo para profesionales de la salud. **No reemplaza el juicio clínico** ni la normativa vigente.

## Qué calcula (versión 0.1)

| Módulo | Cálculo | Fuente |
|---|---|---|
| Audiometría | Promedio tonal y grado de pérdida auditiva | OMS, *World Report on Hearing* (2021) |
| Audiometría | Cambio estándar de umbral (STS) y si es registrable | OSHA 29 CFR 1910.95(g)(10) y 1904.10 |
| Audiometría | % de deficiencia auditiva monoaural y binaural | AAO 1979 / AMA *Guides* |
| Ruido | Tiempo permitido, dosis diaria y nivel ponderado de 8 h (TWA) | NIOSH 98-126 (85 dB/3 dB); OSHA 1910.95 Ap. A (90 dB/5 dB) |
| Ruido | Suma de niveles y nivel con protector auditivo (NRR) | OSHA Technical Manual, sec. III cap. 5 |
| Espirometría | Patrón y gravedad por z-score; respuesta broncodilatadora | ERS/ATS 2022 (Stanojevic et al., *Eur Respir J*) |
| Antropometría | IMC y riesgo por perímetro abdominal | OMS TRS 894; RM 184-2012/MINSA |

## Usar la página web

Abre `index.html` desde un servidor local (los navegadores bloquean los módulos JavaScript abiertos como archivo):

```bash
npm run web
# o bien
python -m http.server
```

y entra a `http://localhost:3000` (o `http://localhost:8000`).

## Usar la biblioteca

```js
import { audiometria, ruido, espirometria } from './src/index.js';

audiometria.clasificarOMS({
  derecho:   { 500: 15, 1000: 20, 2000: 25, 4000: 45 },
  izquierdo: { 500: 15, 1000: 15, 2000: 20, 4000: 40 },
});
// → { grado: 'Pérdida leve', unilateral: false, ... }

ruido.evaluarJornada([
  { nivel: 92, horas: 3 },
  { nivel: 80, horas: 5 },
]);
// → { dosisPorcentaje: ..., nivelPonderado8h: ..., superaLimite: true }

espirometria.interpretarZ({ zFev1Fvc: -2.8, zFvc: -0.9, zFev1: -2.7 });
// → { patron: 'Obstrucción', gravedad: 'Moderada', nota: '' }
```

## Pruebas

```bash
npm test
```

## Hoja de ruta

Ver [docs/hoja-de-ruta.md](docs/hoja-de-ruta.md). Lo próximo: ajuste por edad del STS (OSHA Apéndice F), valores predichos GLI Global 2022, hemoglobina y altura geográfica, clasificación OIT de radiografías y calendario de EMO según el puesto.

## Contribuir

Las contribuciones son bienvenidas, sobre todo de médicos ocupacionales. La regla principal: **toda fórmula o punto de corte debe citar una fuente publicada**. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia

[MIT](LICENSE) © Cesar Lazo Coz
