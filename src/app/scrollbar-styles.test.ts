import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const css = readFileSync(path.join(__dirname, 'globals.css'), 'utf8');

// El bloque `@supports not selector(::-webkit-scrollbar) { ... }`, con sus llaves anidadas.
function firefoxOnlyBlock() {
  const start = css.indexOf('@supports not selector(::-webkit-scrollbar)');
  if (start === -1) return null;
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') depth -= 1;
    if (depth === 0) return { start, end: index + 1 };
  }
  return null;
}

// jsdom no dibuja barras de desplazamiento: estos tests cuidan la regla que no se ve en el
// código y que se rompe en silencio.
describe('barras de desplazamiento', () => {
  it('Chromium y Safari dibujan la barra delgada, redonda y discreta', () => {
    expect(css).toContain('::-webkit-scrollbar-thumb');
    expect(css).toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*border-radius/);
    expect(css).toMatch(/::-webkit-scrollbar-track[^{]*\{[^}]*transparent/);
  });

  it('el color sale del tema, sin fijar uno claro u oscuro', () => {
    const thumb =
      /::-webkit-scrollbar-thumb\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

    expect(thumb).toContain('var(--foreground)');
  });

  it('las propiedades estándar van solo para Firefox', () => {
    // Chromium ignora ::-webkit-scrollbar si ve scrollbar-width o scrollbar-color: con ellas
    // sueltas, la barra redonda deja de verse en Chrome y Edge sin ningún error.
    const block = firefoxOnlyBlock();

    expect(block).not.toBeNull();
    const outside = block
      ? css.slice(0, block.start) + css.slice(block.end)
      : css;
    expect(outside).not.toMatch(/scrollbar-(width|color)\s*:/);
    expect(css.slice(block?.start, block?.end)).toMatch(/scrollbar-color\s*:/);
  });
});
