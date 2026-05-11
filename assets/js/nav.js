// Mobile nav toggle — shared across all mockups.
// Looks for [data-nav-toggle] button controlling [data-nav-menu] via aria-expanded.
(function () {
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  if (!toggle || !menu) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.dataset.open = open ? 'true' : 'false';
    document.body.style.overflow = open ? 'hidden' : '';
  }

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Close when a menu link is clicked
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setOpen(false);
  });
})();
