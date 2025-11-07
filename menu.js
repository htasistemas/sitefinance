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
