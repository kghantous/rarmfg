// Shop page: scroll-spy for the section rail + "show all" gallery expanders.
(function () {
  // --- Scroll-spy: highlight the rail link for the section in view ---
  const links = Array.from(document.querySelectorAll('[data-spy] a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    const linkFor = new Map();
    links.forEach((a) => {
      const sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) linkFor.set(sec, a);
    });

    let active = null;
    function setActive(a) {
      if (a === active) return;
      if (active) active.classList.remove('is-active');
      if (a) a.classList.add('is-active');
      active = a;
    }

    // Active zone is a band near the top third of the viewport. The section
    // whose top sits highest within that band wins.
    const observer = new IntersectionObserver((entries) => {
      const inView = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (inView.length) setActive(linkFor.get(inView[0].target));
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });

    linkFor.forEach((_a, sec) => observer.observe(sec));
  }

  // --- "Show all" expanders for capped galleries ---
  document.querySelectorAll('.gallery-more').forEach((btn) => {
    const sel = btn.getAttribute('data-target');
    const gallery = sel ? document.querySelector(sel) : btn.previousElementSibling;
    if (!gallery) return;

    const labelMore = btn.textContent;
    const labelLess = 'Show fewer';

    btn.addEventListener('click', () => {
      const expanded = gallery.classList.toggle('is-expanded');
      btn.textContent = expanded ? labelLess : labelMore;
      btn.setAttribute('aria-expanded', String(expanded));
      // When collapsing, keep the section in view so the page doesn't jump far.
      if (!expanded) gallery.scrollIntoView({ block: 'nearest' });
    });
  });
})();
