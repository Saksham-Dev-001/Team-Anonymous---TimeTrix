// File: /js/ui/tilt-3d.js
// Ultra-Premium Spotlight Glow Engine (Zero Tilting, 100% Smooth Interactive Light Tracking)

export function init3DTilt() {
  const cards = document.querySelectorAll('.card, .auth-form-card, .metric-card, .stat-card-premium, .sidebar-team-credit');
  
  cards.forEach(card => {
    if (card._hasSpotlight) return;
    card._hasSpotlight = true;

    // Reset any legacy inline tilt transforms
    card.style.transform = '';

    function onMouseMove(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }

    function onMouseLeave() {
      card.style.setProperty('--mouse-x', '-600px');
      card.style.setProperty('--mouse-y', '-600px');
    }

    card.addEventListener('mousemove', onMouseMove, { passive: true });
    card.addEventListener('mouseleave', onMouseLeave, { passive: true });
  });
}

// Observe dynamic DOM changes to auto-bind new cards smoothly
const observer = new MutationObserver(() => {
  init3DTilt();
});

if (typeof document !== 'undefined' && document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', init3DTilt);
}
