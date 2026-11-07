"""Genera las páginas HTML de la web con su SEO (título, descripción, Open Graph,
datos estructurados JSON-LD) y el sitemap.xml.

Uso:  python herramientas/generar_paginas.py
Edita los textos AQUÍ y vuelve a ejecutar; no edites los .html a mano.
"""
import json
import re
from datetime import date
from html import escape
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BASE = "https://lazocozcesar-afk.github.io/calculadoras-salud-ocupacional/"
REPO = "https://github.com/lazocozcesar-afk/calculadoras-salud-ocupacional"
HOY = date.today().isoformat()
SITIO = "Calculadoras de Salud Ocupacional"

AUTOR = {
    "@type": "Person",
    "name": "César Lazo Coz",
    "honorificPrefix": "Dr.",
    "jobTitle": "Médico cirujano",
    "knowsAbout": ["Medicina ocupacional", "Salud ocupacional", "Vigilancia médica de trabajadores"],
    "sameAs": ["https://github.com/lazocozcesar-afk"],
}

# ---------------------------------------------------------------- calculadoras
SECCION = {}

SECCION["audiometria"] = """
  <section id="audio" class="activa">
    <h2>Calculadora de audiometría</h2>
    <p>Umbrales de vía aérea en dB HL. Deja vacías las frecuencias que no evaluaste.</p>
    <h3>Audiometría actual</h3>
    <div class="tabla"><table id="tabla-actual"></table></div>
    <h3>Línea base (opcional, para STS)</h3>
    <div class="tabla"><table id="tabla-base"></table></div>
    <button class="boton" id="calc-audio">Calcular</button>
    <div class="resultado" id="res-audio" aria-live="polite"></div>
    <p class="fuente">Fuentes: OMS, <i>World Report on Hearing</i> (2021); OSHA 29 CFR 1910.95(g)(10) y 1904.10; AAO 1979 (AMA <i>Guides</i>). El STS se calcula sin el ajuste por edad del Apéndice F.</p>
  </section>"""

SECCION["ruido"] = """
  <section id="ruido">
    <h2>Calculadora de dosis de ruido y nivel de 8 horas</h2>
    <div class="campos">
      <div><label for="criterio">Criterio</label>
        <select id="criterio">
          <option value="85-3">85 dB(A) / 3 dB (NIOSH, DS 024-2016-EM)</option>
          <option value="90-5">90 dB(A) / 5 dB (OSHA)</option>
        </select></div>
      <div><label for="nrr">NRR del protector (opcional)</label><input id="nrr" type="number" min="0" step="1" placeholder="p. ej. 25"></div>
    </div>
    <h3>Tareas de la jornada</h3>
    <div id="filas-ruido"></div>
    <button class="quitar" id="agregar-ruido" type="button" style="padding:6px 12px">+ Agregar tarea</button>
    <br><button class="boton" id="calc-ruido">Calcular</button>
    <div class="resultado" id="res-ruido" aria-live="polite"></div>
    <p class="fuente">Fuentes: NIOSH 98-126 (1998); OSHA 29 CFR 1910.95 Apéndice A; OSHA Technical Manual, sección III, cap. 5 (NRR − 7) × 50 %.</p>
  </section>"""

SECCION["espirometria"] = """
  <section id="espiro">
    <h2>Interpretación de espirometría (ERS/ATS 2022)</h2>
    <p class="aviso">Ingresa los <b>z-scores</b> que da tu espirómetro (se recomienda la ecuación GLI Global 2022). Esta versión no calcula valores predichos.</p>
    <div class="campos">
      <div><label for="z-ratio">z FEV1/FVC</label><input id="z-ratio" type="number" step="0.01"></div>
      <div><label for="z-fvc">z FVC</label><input id="z-fvc" type="number" step="0.01"></div>
      <div><label for="z-fev1">z FEV1</label><input id="z-fev1" type="number" step="0.01"></div>
    </div>
    <h3>Respuesta broncodilatadora (opcional, en litros)</h3>
    <div class="campos">
      <div><label for="bd-pre">FEV1 pre</label><input id="bd-pre" type="number" step="0.01"></div>
      <div><label for="bd-post">FEV1 post</label><input id="bd-post" type="number" step="0.01"></div>
      <div><label for="bd-pred">FEV1 predicho</label><input id="bd-pred" type="number" step="0.01"></div>
    </div>
    <button class="boton" id="calc-espiro">Interpretar</button>
    <div class="resultado" id="res-espiro" aria-live="polite"></div>
    <p class="fuente">Fuente: Stanojevic S, et al. ERS/ATS technical standard on interpretive strategies for routine lung function tests. <i>Eur Respir J</i> 2022;60:2101499.</p>
  </section>"""

SECCION["imc"] = """
  <section id="antropo">
    <h2>Calculadora de IMC y perímetro abdominal</h2>
    <div class="campos">
      <div><label for="peso">Peso (kg)</label><input id="peso" type="number" step="0.1"></div>
      <div><label for="talla">Talla (m)</label><input id="talla" type="number" step="0.01" placeholder="1.70"></div>
      <div><label for="cintura">Perímetro abdominal (cm)</label><input id="cintura" type="number" step="0.5"></div>
      <div><label for="sexo">Sexo</label><select id="sexo"><option value="M">Masculino</option><option value="F">Femenino</option></select></div>
    </div>
    <button class="boton" id="calc-antropo">Calcular</button>
    <div class="resultado" id="res-antropo" aria-live="polite"></div>
    <p class="fuente">Fuentes: OMS TRS 894 (2000); MINSA/INS, Guía técnica de valoración nutricional antropométrica de la persona adulta (RM 184-2012/MINSA).</p>
  </section>"""

# ---------------------------------------------------------------- páginas
PAGINAS = [
    {
        "slug": "audiometria",
        "menu": "Audiometría",
        "titulo": "Calculadora de audiometría: grado OMS, STS y % AAO | Gratis",
        "h1": "Calculadora de audiometría ocupacional",
        "descripcion": "Calcula gratis el grado de pérdida auditiva OMS 2021, el STS de OSHA y el % de deficiencia auditiva AAO 1979 a partir del audiograma.",
        "resumen": "Ingresa el audiograma y obtén al instante el grado de pérdida auditiva según la OMS, el STS frente a la línea base y el porcentaje de deficiencia monoaural y binaural.",
        "contenido": """
    <h2>¿Qué calcula esta herramienta?</h2>
    <p>Es una <strong>calculadora de audiometría</strong> pensada para el examen médico ocupacional (EMO) de trabajadores expuestos a ruido. A partir de los umbrales de vía aérea en dB HL entrega tres resultados:</p>
    <ul>
      <li><strong>Grado de pérdida auditiva OMS 2021</strong>: promedio de 500, 1000, 2000 y 4000 Hz. El grado se asigna con el <em>mejor oído</em>.</li>
      <li><strong>Cambio estándar de umbral (STS)</strong>: compara el promedio de 2000, 3000 y 4000 Hz con la audiometría de línea base, oído por oído.</li>
      <li><strong>Deficiencia auditiva AAO 1979</strong>: porcentaje monoaural y binaural, útil para informes de evaluación y calificación.</li>
    </ul>
    <h2>Grados de pérdida auditiva de la OMS (2021)</h2>
    <div class="tabla"><table>
      <tr><th>Promedio 0,5-1-2-4 kHz (mejor oído)</th><th>Grado</th></tr>
      <tr><td>Menos de 20 dB</td><td>Audición normal</td></tr>
      <tr><td>20 a menos de 35 dB</td><td>Leve</td></tr>
      <tr><td>35 a menos de 50 dB</td><td>Moderada</td></tr>
      <tr><td>50 a menos de 65 dB</td><td>Moderadamente severa</td></tr>
      <tr><td>65 a menos de 80 dB</td><td>Severa</td></tr>
      <tr><td>80 a menos de 95 dB</td><td>Profunda</td></tr>
      <tr><td>95 dB o más</td><td>Completa o total</td></tr>
    </table></div>
    <p>Se considera <strong>pérdida unilateral</strong> cuando el mejor oído tiene menos de 20 dB y el peor 35 dB o más.</p>
    <h2>Cómo se calcula el STS y cuándo es registrable</h2>
    <p>Según OSHA 29 CFR 1910.95(g)(10), hay <strong>STS</strong> cuando el promedio de 2, 3 y 4 kHz empeora <strong>10 dB o más</strong> respecto a la línea base en cualquiera de los oídos. Es <strong>registrable</strong> (29 CFR 1904.10) si además el promedio actual es de 25 dB o más. Esta versión no aplica la corrección por edad del Apéndice F.</p>
    <h2>Fórmula AAO 1979</h2>
    <p>Deficiencia monoaural = (promedio de 0,5-1-2-3 kHz − 25) × 1,5 %, entre 0 y 100 %. Deficiencia binaural = (5 × mejor oído + peor oído) ÷ 6.</p>
    <p><em>Ejemplo:</em> umbrales de 30, 35, 45 y 50 dB dan un promedio de 40 dB; (40 − 25) × 1,5 = <strong>22,5 %</strong> de deficiencia en ese oído.</p>""",
        "faq": [
            ("¿Qué frecuencias usa la OMS para clasificar la pérdida auditiva?",
             "La OMS (World Report on Hearing, 2021) usa el promedio de 500, 1000, 2000 y 4000 Hz del mejor oído."),
            ("¿Qué es el STS en una audiometría ocupacional?",
             "Es el cambio estándar de umbral de OSHA: un empeoramiento de 10 dB o más en el promedio de 2000, 3000 y 4000 Hz frente a la audiometría de línea base, en cualquiera de los oídos."),
            ("¿Cuándo un STS es registrable?",
             "Según OSHA 29 CFR 1904.10, cuando además del STS el promedio actual de 2, 3 y 4 kHz es de 25 dB HL o más."),
            ("¿Cómo se calcula el porcentaje de deficiencia auditiva AAO 1979?",
             "Monoaural: (promedio de 500, 1000, 2000 y 3000 Hz − 25) × 1,5 %. Binaural: (5 × el mejor oído + el peor oído) ÷ 6."),
        ],
    },
    {
        "slug": "ruido",
        "menu": "Ruido",
        "titulo": "Calculadora de dosis de ruido y TWA 8 horas (NIOSH, OSHA)",
        "h1": "Calculadora de dosis de ruido ocupacional",
        "descripcion": "Calcula gratis la dosis de ruido, el TWA de 8 horas y la atenuación del protector (NRR) con los criterios NIOSH 85 dB/3 dB y OSHA 90 dB/5 dB.",
        "resumen": "Suma varias tareas de la jornada y obtén la dosis de ruido en %, el TWA de 8 horas y el nivel estimado con protector auditivo.",
        "contenido": """
    <h2>¿Qué calcula esta herramienta?</h2>
    <p>Es una <strong>calculadora de dosis de ruido</strong> para evaluar la exposición diaria de un trabajador que pasa por varias tareas con distinto nivel sonoro. Entrega la <strong>dosis en %</strong>, el <strong>nivel promedio ponderado de 8 horas (TWA)</strong> y, si ingresas el NRR, el nivel estimado dentro del protector.</p>
    <h2>Criterios disponibles</h2>
    <ul>
      <li><strong>85 dB(A) con intercambio de 3 dB</strong>: NIOSH (publicación 98-126). Es el mismo límite de 8 horas que usa el DS 024-2016-EM para minería en el Perú.</li>
      <li><strong>90 dB(A) con intercambio de 5 dB</strong>: OSHA 29 CFR 1910.95.</li>
    </ul>
    <h2>Fórmulas</h2>
    <p>Tiempo permitido: <strong>T = 8 ÷ 2<sup>(L − criterio) ÷ intercambio</sup></strong> horas. Con 85/3 dB, a 88 dB(A) se permiten 4 h y a 94 dB(A), 1 h.</p>
    <p>Dosis: <strong>D = Σ (horas de exposición ÷ tiempo permitido) × 100 %</strong>. Una dosis mayor de 100 % supera el límite.</p>
    <p>Nivel de 8 horas: <strong>TWA = criterio + (intercambio ÷ log<sub>10</sub>2) × log<sub>10</sub>(D)</strong>.</p>
    <p><em>Ejemplo (NIOSH):</em> 3 h a 92 dB(A) y 5 h a 80 dB(A) dan una dosis de <strong>209 %</strong> y un TWA de <strong>88,2 dB(A)</strong>: supera el límite.</p>
    <h2>Protector auditivo (NRR)</h2>
    <p>El NRR de la etiqueta sobrestima la protección real. El OSHA Technical Manual recomienda restar 7 y aplicar un 50 %: <strong>atenuación = (NRR − 7) × 0,5</strong>. Un tapón NRR 25 frente a 95 dB(A) deja unos 86 dB(A).</p>""",
        "faq": [
            ("¿Cuál es el límite de ruido para 8 horas en el Perú?",
             "El DS 024-2016-EM (minería) fija 85 dB(A) para una jornada de 8 horas, el mismo valor que recomienda NIOSH con un intercambio de 3 dB."),
            ("¿Cómo se calcula la dosis de ruido?",
             "Se suman las horas de cada tarea divididas entre el tiempo permitido para su nivel y se multiplica por 100. Más de 100 % supera el límite."),
            ("¿Qué diferencia hay entre el criterio de NIOSH y el de OSHA?",
             "NIOSH usa 85 dB(A) y un intercambio de 3 dB (cada 3 dB más, el tiempo permitido se reduce a la mitad); OSHA usa 90 dB(A) y 5 dB, que es menos protector."),
            ("¿Cuánto protege realmente un tapón con NRR 25?",
             "Con la corrección del OSHA Technical Manual, (25 − 7) × 0,5 = 9 dB de atenuación estimada."),
        ],
    },
    {
        "slug": "espirometria",
        "menu": "Espirometría",
        "titulo": "Interpretación de espirometría ERS/ATS 2022 por z-score",
        "h1": "Interpretación de espirometría ERS/ATS 2022",
        "descripcion": "Interpreta gratis una espirometría por z-score (ERS/ATS 2022): obstrucción, posible restricción o PRISm, gravedad y respuesta broncodilatadora.",
        "resumen": "Ingresa los z-scores de FEV1/FVC, FVC y FEV1 y obtén el patrón espirométrico, su gravedad y si la respuesta al broncodilatador es significativa.",
        "contenido": """
    <h2>¿Qué hace esta herramienta?</h2>
    <p>Aplica la <strong>estrategia de interpretación ERS/ATS 2022</strong> (Stanojevic et al.), que reemplazó los porcentajes del predicho y el cociente fijo de 0,70 por el <strong>z-score</strong> y el <strong>límite inferior de la normalidad (LIN)</strong>, que corresponde a z = −1,645.</p>
    <h2>Patrones espirométricos</h2>
    <ul>
      <li><strong>Obstrucción</strong>: z FEV1/FVC menor de −1,645.</li>
      <li><strong>Obstrucción con FVC baja</strong>: además z FVC menor de −1,645; puede ser atrapamiento aéreo o un defecto mixto (confirmar con TLC).</li>
      <li><strong>Posible restricción</strong>: relación normal con z FVC bajo; la espirometría sola no la confirma.</li>
      <li><strong>PRISm</strong>: FEV1 bajo con relación FEV1/FVC normal.</li>
    </ul>
    <h2>Gravedad por z-score del FEV1</h2>
    <div class="tabla"><table>
      <tr><th>z FEV1</th><th>Gravedad</th></tr>
      <tr><td>−1,65 a −2,5</td><td>Leve</td></tr>
      <tr><td>−2,5 a −4</td><td>Moderada</td></tr>
      <tr><td>Menor de −4</td><td>Grave</td></tr>
    </table></div>
    <h2>Respuesta broncodilatadora</h2>
    <p>ERS/ATS 2022 la expresa como el cambio en relación con el valor predicho: <strong>(post − pre) ÷ predicho × 100</strong>. Es significativa si supera el <strong>10 %</strong>.</p>""",
        "faq": [
            ("¿Qué z-score define una espirometría anormal?",
             "Un z-score menor de −1,645, que equivale al límite inferior de la normalidad (percentil 5)."),
            ("¿Por qué ya no se usa el cociente FEV1/FVC menor de 0,70?",
             "Porque el cociente fijo sobrediagnostica obstrucción en adultos mayores y la subdiagnostica en jóvenes; ERS/ATS 2022 recomienda el LIN por z-score."),
            ("¿Cuándo la respuesta broncodilatadora es significativa según ERS/ATS 2022?",
             "Cuando el cambio de FEV1 o FVC es mayor del 10 % del valor predicho."),
            ("¿Qué es el patrón PRISm?",
             "Preserved Ratio Impaired Spirometry: FEV1 bajo con relación FEV1/FVC normal. Es inespecífico y debe correlacionarse con la clínica."),
        ],
    },
    {
        "slug": "imc",
        "menu": "IMC y cintura",
        "titulo": "Calculadora de IMC y perímetro abdominal (OMS y MINSA)",
        "h1": "Calculadora de IMC y perímetro abdominal",
        "descripcion": "Calcula gratis el IMC con la clasificación de la OMS y el riesgo por perímetro abdominal según la guía técnica del MINSA (RM 184-2012).",
        "resumen": "Ingresa peso, talla y perímetro abdominal para obtener el IMC, su categoría OMS y el riesgo por perímetro abdominal del MINSA.",
        "contenido": """
    <h2>¿Qué calcula esta herramienta?</h2>
    <p>Calcula el <strong>índice de masa corporal (IMC)</strong> = peso (kg) ÷ talla² (m) y el <strong>riesgo por perímetro abdominal</strong>, dos datos que se registran en todo examen médico ocupacional.</p>
    <h2>Clasificación del IMC (OMS)</h2>
    <div class="tabla"><table>
      <tr><th>IMC (kg/m²)</th><th>Categoría</th></tr>
      <tr><td>Menos de 18,5</td><td>Bajo peso</td></tr>
      <tr><td>18,5 a 24,9</td><td>Normal</td></tr>
      <tr><td>25 a 29,9</td><td>Sobrepeso</td></tr>
      <tr><td>30 a 34,9</td><td>Obesidad grado I</td></tr>
      <tr><td>35 a 39,9</td><td>Obesidad grado II</td></tr>
      <tr><td>40 o más</td><td>Obesidad grado III</td></tr>
    </table></div>
    <h2>Riesgo por perímetro abdominal (MINSA)</h2>
    <div class="tabla"><table>
      <tr><th>Riesgo</th><th>Hombres</th><th>Mujeres</th></tr>
      <tr><td>Bajo</td><td>Menos de 94 cm</td><td>Menos de 80 cm</td></tr>
      <tr><td>Alto</td><td>94 cm o más</td><td>80 cm o más</td></tr>
      <tr><td>Muy alto</td><td>102 cm o más</td><td>88 cm o más</td></tr>
    </table></div>""",
        "faq": [
            ("¿Cómo se calcula el IMC?",
             "Se divide el peso en kilogramos entre la talla en metros elevada al cuadrado. Por ejemplo, 80 kg y 1,75 m dan un IMC de 26,1 kg/m² (sobrepeso)."),
            ("¿Cuál es el perímetro abdominal de riesgo según el MINSA?",
             "Riesgo alto desde 94 cm en hombres y 80 cm en mujeres; muy alto desde 102 cm en hombres y 88 cm en mujeres."),
            ("¿El IMC sirve en adultos mayores y gestantes?",
             "No con esta tabla: los adultos mayores y las gestantes tienen sus propias referencias en las guías técnicas del MINSA."),
        ],
    },
]

PORTADA = {
    "titulo": "Calculadoras de Salud Ocupacional gratis | Audiometría y ruido",
    "descripcion": "Calculadoras gratis de medicina ocupacional: audiometría OMS y STS, dosis de ruido, espirometría ERS/ATS 2022 e IMC. Con la fuente de cada fórmula.",
    "contenido": """
    <h2>Calculadoras para el examen médico ocupacional</h2>
    <p>Herramientas gratuitas para médicos ocupacionales, especialistas en salud ocupacional y personal de vigilancia médica del <strong>Perú y Latinoamérica</strong>. Cada fórmula cita su fuente publicada y el código es abierto, con pruebas automáticas.</p>
    <ul class="tarjetas">
      <li><a href="audiometria/"><strong>Calculadora de audiometría</strong></a> — grado de pérdida auditiva OMS 2021, STS de OSHA y % de deficiencia AAO 1979.</li>
      <li><a href="ruido/"><strong>Calculadora de dosis de ruido</strong></a> — dosis diaria, TWA de 8 horas y protector auditivo (NRR).</li>
      <li><a href="espirometria/"><strong>Interpretación de espirometría</strong></a> — patrón y gravedad por z-score según ERS/ATS 2022.</li>
      <li><a href="imc/"><strong>IMC y perímetro abdominal</strong></a> — clasificación OMS y riesgo según el MINSA.</li>
    </ul>""",
    "faq": [
        ("¿Las calculadoras son gratuitas?",
         "Sí. Son gratuitas y de código abierto (licencia MIT); no piden registro."),
        ("¿Se guardan los datos de mis pacientes?",
         "No. Todos los cálculos se hacen en tu navegador y ningún dato se envía a un servidor."),
        ("¿En qué normas se basan?",
         "OMS World Report on Hearing 2021, OSHA 29 CFR 1910.95 y 1904.10, AAO 1979, NIOSH 98-126, ERS/ATS 2022, OMS TRS 894 y la RM 184-2012/MINSA."),
    ],
}


# ---------------------------------------------------------------- plantilla
def ld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=1) + "\n</script>"


def faq_html(faq):
    items = "\n".join(
        f"    <details><summary>{escape(p)}</summary><p>{escape(r)}</p></details>" for p, r in faq
    )
    return f"    <h2>Preguntas frecuentes</h2>\n{items}"


def faq_ld(faq):
    return {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": p, "acceptedAnswer": {"@type": "Answer", "text": r}}
            for p, r in faq
        ],
    }


def pagina(*, url, titulo, descripcion, h1, resumen, nav, cuerpo, contenido, faq, grafo, pre):
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(titulo)}</title>
<meta name="description" content="{escape(descripcion)}">
<meta name="author" content="Dr. César Lazo Coz">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="{url}">
<link rel="icon" href="{pre}assets/icono.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{pre}assets/icono-180.png">
<meta name="theme-color" content="#0f6e6e">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_PE">
<meta property="og:site_name" content="{SITIO}">
<meta property="og:title" content="{escape(titulo)}">
<meta property="og:description" content="{escape(descripcion)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="{pre}assets/estilos.css">
{ld({"@context": "https://schema.org", "@graph": grafo})}
</head>
<body>
<header>
  <p class="migas"><a href="{BASE}">{SITIO}</a></p>
  <h1>{escape(h1)}</h1>
  <p><strong>Desarrollado por el Dr. César Lazo Coz</strong> · Actualizado el {HOY}</p>
  <p>{escape(resumen)} Los datos se calculan en tu navegador y no se envían a ningún servidor.</p>
{nav}
</header>

<main>
{cuerpo}

  <p class="aviso">Herramienta de apoyo para profesionales de la salud. No reemplaza el juicio clínico ni la normativa vigente; verifica siempre con la fuente oficial.</p>

  <div class="contenido">
{contenido}
{faq_html(faq)}
  </div>
</main>

<footer>
  <p>Proyecto de código abierto (licencia MIT) del Dr. César Lazo Coz. Reporta errores o propone mejoras en <a href="{REPO}">GitHub</a>.</p>
  <p><a href="{pre}">Inicio</a> · {" · ".join(f'<a href="{pre}{p["slug"]}/">{p["menu"]}</a>' for p in PAGINAS)}</p>
</footer>

<script type="module" src="{pre}assets/app.js"></script>
</body>
</html>
"""


def activar(seccion):
    """En las páginas individuales la calculadora siempre está visible."""
    return re.sub(r'<section id="(\w+)"(?: class="activa")?>', r'<section id="\g<1>" class="activa">', seccion)


def app_ld(url, nombre, descripcion):
    return {
        "@type": "WebApplication",
        "@id": url + "#app",
        "name": nombre,
        "url": url,
        "description": descripcion,
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Web",
        "inLanguage": "es",
        "isAccessibleForFree": True,
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "PEN"},
        "author": AUTOR,
        "dateModified": HOY,
        "audience": {"@type": "MedicalAudience", "audienceType": "Médicos ocupacionales y profesionales de la salud"},
    }


def main():
    # Portada (con pestañas, todas las calculadoras)
    nav_tabs = '  <nav role="tablist">\n' + "\n".join(
        f'    <button role="tab" data-tab="{t}" aria-selected="{"true" if i == 0 else "false"}">{m}</button>'
        for i, (t, m) in enumerate([("audio", "Audiometría"), ("ruido", "Ruido"), ("espiro", "Espirometría"), ("antropo", "IMC y cintura")])
    ) + "\n  </nav>"
    cuerpo = "\n".join(SECCION[k] for k in ["audiometria", "ruido", "espirometria", "imc"])
    grafo = [
        {"@type": "WebSite", "@id": BASE + "#sitio", "name": SITIO, "url": BASE, "inLanguage": "es", "author": AUTOR},
        app_ld(BASE, SITIO, PORTADA["descripcion"]),
        faq_ld(PORTADA["faq"]),
    ]
    html = pagina(url=BASE, titulo=PORTADA["titulo"], descripcion=PORTADA["descripcion"],
                  h1=SITIO, resumen="Gratuitas y de código abierto, con la fuente de cada fórmula.",
                  nav=nav_tabs, cuerpo=cuerpo, contenido=PORTADA["contenido"], faq=PORTADA["faq"],
                  grafo=grafo, pre="")
    html = html.replace(f'  <p class="migas"><a href="{BASE}">{SITIO}</a></p>\n', "")
    (RAIZ / "index.html").write_text(html, encoding="utf-8")

    # Una página por calculadora
    for p in PAGINAS:
        url = BASE + p["slug"] + "/"
        nav = '  <nav aria-label="Calculadoras">\n    <a href="../">Inicio</a>\n' + "\n".join(
            f'    <a href="../{q["slug"]}/"' + (' aria-current="page"' if q is p else "") + f'>{q["menu"]}</a>'
            for q in PAGINAS
        ) + "\n  </nav>"
        grafo = [
            app_ld(url, p["h1"], p["descripcion"]),
            faq_ld(p["faq"]),
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": SITIO, "item": BASE},
                {"@type": "ListItem", "position": 2, "name": p["h1"], "item": url},
            ]},
        ]
        html = pagina(url=url, titulo=p["titulo"], descripcion=p["descripcion"], h1=p["h1"],
                      resumen=p["resumen"], nav=nav, cuerpo=activar(SECCION[p["slug"]]), contenido=p["contenido"],
                      faq=p["faq"], grafo=grafo, pre="../")
        (RAIZ / p["slug"]).mkdir(exist_ok=True)
        (RAIZ / p["slug"] / "index.html").write_text(html, encoding="utf-8")

    # Sitemap
    urls = [BASE] + [BASE + p["slug"] + "/" for p in PAGINAS]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        f"  <url>\n    <loc>{u}</loc>\n    <lastmod>{HOY}</lastmod>\n  </url>\n" for u in urls
    ) + "</urlset>\n"
    (RAIZ / "sitemap.xml").write_text(sm, encoding="utf-8")
    print("Generadas", len(urls), "páginas y sitemap.xml")


if __name__ == "__main__":
    main()
