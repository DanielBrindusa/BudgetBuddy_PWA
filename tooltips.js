(function () {
  function toCustomTooltip(el) {
    const title = el.getAttribute('title');
    if (title) {
      el.setAttribute('data-tooltip', title);
      el.removeAttribute('title'); // suppress native tooltip
    }
  }

  function setupTooltip(el) {
    const text = el.getAttribute('data-tooltip');
    if (!text) return;

    let tip = null;
    let hideTimer = null;

    function placeTip() {
      if (!tip) return;
      const r = el.getBoundingClientRect();
      const tr = tip.getBoundingClientRect();
      let left = r.left + (r.width - tr.width) / 2 + window.scrollX;
      left = Math.max(8 + window.scrollX,
        Math.min(left, window.scrollX + document.documentElement.clientWidth - tr.width - 8));
      let top = r.top - tr.height - 8 + window.scrollY;
      if (top < window.scrollY + 4) top = r.bottom + 8 + window.scrollY; // flip below if needed
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }

    function show() {
      if (tip) return;
      tip = document.createElement('div');
      tip.className = 'bb-tooltip';
      tip.textContent = text;
      document.body.appendChild(tip);
      requestAnimationFrame(() => {
        placeTip();
        tip.classList.add('bb-tooltip-show');
      });
      hideTimer = setTimeout(hide, 3000); // auto-hide after 3s
      window.addEventListener('scroll', placeTip, true);
      window.addEventListener('resize', placeTip, true);
    }

    function hide() {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      if (!tip) return;
      const t = tip;
      tip = null;
      t.classList.add('bb-tooltip-leave');
      window.removeEventListener('scroll', placeTip, true);
      window.removeEventListener('resize', placeTip, true);
      setTimeout(() => t.remove(), 150);
    }

    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', show);
    el.addEventListener('blur', hide);
    el.addEventListener('click', hide);

    const observer = new MutationObserver(() => {
      if (!document.body.contains(el)) {
        hide();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    // Convert existing [title] → [data-tooltip]
    const tooltipCandidates = Array.from(document.querySelectorAll('[title], [data-tooltip]'));
    tooltipCandidates.forEach(toCustomTooltip);
    document.querySelectorAll('[data-tooltip]').forEach(setupTooltip);

    // Watch for future nodes
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.hasAttribute && (node.hasAttribute('title') || node.hasAttribute('data-tooltip'))) {
            toCustomTooltip(node);
            setupTooltip(node);
          }
          node.querySelectorAll && node.querySelectorAll('[title], [data-tooltip]').forEach((el) => {
            toCustomTooltip(el);
            setupTooltip(el);
          });
        });
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
