# Cómo contribuir

¡Gracias por querer ayudar! Este proyecto lo usan profesionales de la salud, así que la exactitud va primero.

## Reglas

1. **Toda fórmula, tabla o punto de corte debe citar una fuente publicada** (norma, guía de sociedad científica, artículo revisado por pares). Ponla en el comentario del módulo y en el README.
2. **Cada cálculo nuevo lleva pruebas** en `test/`, idealmente con un ejemplo resuelto que aparezca en la propia fuente.
3. Si una norma peruana y una internacional difieren, se implementan **ambas como opciones**, sin elegir por el usuario.
4. Sin dependencias externas en `src/`.
5. Textos de la interfaz en español claro.

## Pasos

```bash
git clone <url-del-repositorio>
cd calculadoras-salud-ocupacional
npm test
```

Crea una rama, haz tus cambios, corre `npm test` y abre un *pull request* explicando qué fuente usaste.

## Reportar un error

Abre un *issue* con: qué datos ingresaste, qué resultado salió, qué resultado esperabas y **en qué fuente** te basas.
