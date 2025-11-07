(function () {
  function highlightCurrent(menu) {
    const navLinks = menu.querySelectorAll('.topbar__nav a');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    navLinks.forEach((link) => {
      const target = link.getAttribute('href');
      if (target === currentPath) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function applyMenuLabels(menu) {
    const labels = menu.querySelectorAll('[data-menu-label]');
    if (!labels.length) {
      return;
    }

    const rootStyles = getComputedStyle(document.documentElement);

    labels.forEach((element) => {
      const key = element.getAttribute('data-menu-label');
      if (!key) {
        return;
      }

      const cssValue = rootStyles.getPropertyValue(`--menu-${key}`);
      if (!cssValue) {
        return;
      }

      const normalized = cssValue.replace(/^\s*['"]?/, '').replace(/['"]?\s*$/, '');
      if (normalized) {
        element.textContent = normalized;
        element.setAttribute('aria-label', normalized);
        element.setAttribute('title', normalized);
      }
    });
  }

  function injectMenu(placeholder) {
    fetch('menu.html')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Não foi possível carregar o menu.');
        }
        return response.text();
      })
      .then((markup) => {
        const temp = document.createElement('div');
        temp.innerHTML = markup.trim();
        const menu = temp.firstElementChild;

        if (menu) {
          placeholder.replaceWith(menu);
          applyMenuLabels(menu);
          highlightCurrent(menu);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const placeholder = document.getElementById('site-menu');
      if (placeholder) {
        injectMenu(placeholder);
      }
    });
  } else {
    const placeholder = document.getElementById('site-menu');
    if (placeholder) {
      injectMenu(placeholder);
    }
  }
})();
