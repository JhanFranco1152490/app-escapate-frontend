/* Hace navegables las maquetas estáticas. No es código de producción:
   en la app real el tema lo maneja la clase del tema en <html>
   (una clase en <html>: sin clase = marca, .theme-light, .theme-dark).  */
(function () {
  'use strict';

  var THEMES = { default: '', light: 'theme-light', dark: 'theme-dark' };
  var root = document.documentElement;
  var LOCKED = root.hasAttribute('data-theme-locked');

  function current() {
    if (root.classList.contains('theme-light')) return 'light';
    if (root.classList.contains('theme-dark')) return 'dark';
    return 'default';
  }

  function apply(name) {
    if (!(name in THEMES) || LOCKED) return;
    root.classList.remove('theme-light', 'theme-dark');
    if (THEMES[name]) root.classList.add(THEMES[name]);
    sync();
  }

  function sync() {
    var now = current();
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-theme-set]'),
      function (b) {
        b.setAttribute(
          'aria-pressed',
          String(b.getAttribute('data-theme-set') === now),
        );
      },
    );
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-theme-set]') : null;
    if (b) {
      e.preventDefault();
      apply(b.getAttribute('data-theme-set'));
    }
    var t = e.target.closest ? e.target.closest('[data-error-toggle]') : null;
    if (t) {
      e.preventDefault();
      toggleError();
    }
  });

  function errorBlocks() {
    return document.querySelectorAll('[data-error-block]');
  }

  function setError(on) {
    Array.prototype.forEach.call(errorBlocks(), function (el) {
      el.hidden = !on;
    });
    var btn = document.querySelector('[data-error-toggle]');
    if (btn) btn.setAttribute('aria-pressed', String(on));
  }

  function toggleError() {
    var first = errorBlocks()[0];
    setError(!!(first && first.hidden));
  }

  /* Maquetas sin selector propio en el topbar: barra flotante de revisión. */
  function buildBar() {
    if (document.querySelector('[data-theme-set]') && !errorBlocks().length)
      return;
    if (LOCKED && !errorBlocks().length) return;

    var bar = document.createElement('div');
    bar.className = 'mockup-bar';
    bar.innerHTML = '<span>Maqueta</span>';

    if (!LOCKED && !document.querySelector('[data-theme-set]')) {
      ['default', 'light', 'dark'].forEach(function (name) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-theme-set', name);
        b.textContent = { default: 'Marca', light: 'Claro', dark: 'Oscuro' }[
          name
        ];
        bar.appendChild(b);
      });
    }
    if (errorBlocks().length) {
      var e = document.createElement('button');
      e.type = 'button';
      e.setAttribute('data-error-toggle', '');
      e.setAttribute('aria-pressed', 'false');
      e.textContent = 'Error';
      bar.appendChild(e);
    }
    document.body.appendChild(bar);
  }

  var qs = new URLSearchParams(location.search);
  if (qs.get('theme')) apply(qs.get('theme'));
  buildBar();
  sync();
  setError(qs.get('error') === '1');
})();
