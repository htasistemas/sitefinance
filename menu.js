(function () {
  const BASE_SITE_VERSION = (window.SITE_CONFIG && window.SITE_CONFIG.version) || '0.00';

  const MENU_TEMPLATE = `
    <header class="topbar" aria-label="Barra de navegação principal">
      <a class="topbar__logo" href="index.html">
        <span class="topbar__logo-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" role="presentation" focusable="false">
            <path
              d="M4 24.5v-6.8a1.2 1.2 0 0 1 1.2-1.2h3.6a1.2 1.2 0 0 1 1.2 1.2v6.8m6-4.3v-8.7a1.2 1.2 0 0 1 1.2-1.2h3.6a1.2 1.2 0 0 1 1.2 1.2v8.7m6-2.4V7.7a1.2 1.2 0 0 1 1.2-1.2H29"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
            <path d="M3 26.6h26" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
            <circle cx="26" cy="6.5" r="2" fill="currentColor" />
          </svg>
        </span>
        <span class="topbar__logo-text">
          <span class="topbar__logo-name">
            Finance<span class="topbar__logo-em">Pro</span>
            <span class="topbar__logo-highlight">Master</span>
          </span>
          <span class="topbar__logo-subtitle">Inteligência financeira</span>
        </span>
      </a>
      <nav class="topbar__nav" aria-label="Seções principais">
        <a data-menu-label="home" href="index.html">Home</a>
        <a data-menu-label="features" href="funcionalidades.html">Funcionalidades</a>
        <a data-menu-label="plans" href="planos.html">Planos</a>
        <a data-menu-label="faq" href="faq.html">FAQ</a>
        <a data-menu-label="about" href="sobre.html">Sobre nós</a>
        <a data-menu-label="access" href="acesso.html">Acesso ao sistema</a>
        <a data-menu-label="contact" href="contato.html">Fale conosco</a>
      </nav>
      <a class="topbar__cta" data-menu-label="cta" href="planos.html#teste">Teste grátis</a>
    </header>
  `;

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

  function createMenuElement() {
    const template = document.createElement('template');
    template.innerHTML = MENU_TEMPLATE.trim();
    return template.content.firstElementChild;
  }

  function mountMenu() {
    const placeholder = document.getElementById('site-menu');
    if (!placeholder) {
      return;
    }

    if (placeholder.classList.contains('topbar')) {
      applyMenuLabels(placeholder);
      highlightCurrent(placeholder);
      return;
    }

    const menu = createMenuElement();
    placeholder.replaceWith(menu);
    applyMenuLabels(menu);
    highlightCurrent(menu);
  }

  function buildVersionMetadata() {
    const siteVersion = BASE_SITE_VERSION;
    const lastUpdated = new Date(document.lastModified);

    if (Number.isNaN(lastUpdated.getTime())) {
      return {
        build: `${siteVersion}.000000000000`,
        label: `Versão ${siteVersion}`,
      };
    }

    const stamp = `${lastUpdated.getFullYear()}${String(lastUpdated.getMonth() + 1).padStart(2, '0')}${String(lastUpdated.getDate()).padStart(2, '0')}${String(lastUpdated.getHours()).padStart(2, '0')}${String(lastUpdated.getMinutes()).padStart(2, '0')}`;

    const updatedDate = lastUpdated.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    const updatedTime = lastUpdated.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      build: `${siteVersion}.${stamp}`,
      label: `Versão ${siteVersion} • Atualizado em ${updatedDate} às ${updatedTime}`,
    };
  }

  function injectSiteVersion() {
    const footer = document.querySelector('.footer__bottom');

    if (!footer) {
      return;
    }

    const versionInfo = buildVersionMetadata();
    const versionElement = footer.querySelector('.footer__version') || document.createElement('p');

    versionElement.className = 'footer__version';
    versionElement.textContent = versionInfo.label;

    if (!versionElement.isConnected) {
      footer.appendChild(versionElement);
    }
  }

  function initializeSiteShell() {
    mountMenu();
    injectSiteVersion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSiteShell);
  } else {
    initializeSiteShell();
  }
})();
