// Shop page: scroll-spy, "show all" expanders, and lightbox.
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

  // --- Lightbox ---
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.tabIndex = -1;
  lb.innerHTML =
    '<button class="lb-close" aria-label="Close">✕</button>' +
    '<button class="lb-prev" aria-label="Previous">‹</button>' +
    '<img class="lb-img" src="" alt="">' +
    '<button class="lb-next" aria-label="Next">›</button>';
  document.body.appendChild(lb);

  const lbImg      = lb.querySelector('.lb-img');
  const lbCloseBtn = lb.querySelector('.lb-close');
  const lbPrev     = lb.querySelector('.lb-prev');
  const lbNext     = lb.querySelector('.lb-next');

  let lbItems = [];
  let lbIndex = 0;

  function lbShow(items, index) {
    lbItems = items;
    lbIndex = index;
    lbRender();
  }

  function lbRender() {
    const link = lbItems[lbIndex];
    lbImg.src = link.href;
    lbImg.alt = (link.querySelector('img') || {}).alt || '';
    const multi = lbItems.length > 1;
    lbPrev.hidden = !multi;
    lbNext.hidden = !multi;
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lb.focus();
  }

  function lbClose() {
    lb.classList.remove('is-open');
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  lbCloseBtn.addEventListener('click', lbClose);
  lbPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length;
    lbRender();
  });
  lbNext.addEventListener('click', function (e) {
    e.stopPropagation();
    lbIndex = (lbIndex + 1) % lbItems.length;
    lbRender();
  });
  lb.addEventListener('click', function (e) {
    if (e.target === lb) lbClose();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape')      lbClose();
    if (e.key === 'ArrowLeft')  { lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length; lbRender(); }
    if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lbItems.length; lbRender(); }
  });

  document.querySelectorAll('.gallery').forEach(function (gallery) {
    const links = Array.from(gallery.querySelectorAll('a'));
    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        lbShow(links, i);
      });
    });
  });

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
