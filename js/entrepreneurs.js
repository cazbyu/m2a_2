// ===== Entrepreneur Bracket Challenge =====
// 9 real African entrepreneurs in a bracket. Donations = votes. Most funded advances.
// Users can support multiple entrepreneurs (not opponents in the same matchup) via a shopping cart.

(function () {
  'use strict';

  // ===== Real Entrepreneur Data =====
  const ENTREPRENEURS = [
    {
      id: 'ent-1',
      name: 'Kate Nanyangwe',
      business: 'Nails By Kate & Hair Salon',
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_2.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/03/Nails-By-Kate-Business-Plan.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-2',
      name: 'Jane Ndashe',
      business: 'JP Enterprise',
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/03/Entrapov-Business-Plan-JP-ENTERPRISE.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-3',
      name: 'Nanyangwe Katai',
      business: 'Chichi Braids',
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260226_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Entrapov-Business-Plan-CHICHI-BRAIDS.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-4',
      name: 'Saukilan Kapatamoyo',
      business: "God's Grace Detergent",
      country: 'Malawi',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Gods-Grace-Detergent-604x620.jpg',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Saukilan-Kapatamoyo.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-5',
      name: 'Sandra Chisala',
      business: 'High Voltage Fabrication',
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260214_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/HIGH-VOLTAGE-BUSINESS-PLAN.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-6',
      name: 'Kendrick B. Makhurane',
      business: 'Key B Manufacturers',
      country: 'Lesotho',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260213_7-686x620.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Key-B_Business-Plan.docx-1-1.docx-3.pdf',
      raised: 0
    },
    {
      id: 'ent-7',
      name: 'Lyampu Mubiana',
      business: "Lyamupu's Pastry Kitchen",
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260126_2.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/Lyamupus-Pastry-Kitchen.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-8',
      name: 'Monica Ntchalachala',
      business: 'Femmo Second Hand Clothes',
      country: 'Malawi',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260123_4.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/1754573627541_1754573623418_Entrapov-Business-Plan-Template-Monica.docx-1.pdf',
      raised: 0
    },
    {
      id: 'ent-9',
      name: 'Enrique Hannock',
      business: 'Nexora Technology Company',
      country: 'Kenya',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260113_2-536x620.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/ENRIQUE-HANNOCK-PROPOSAL.pdf.pdf',
      raised: 0
    }
  ];

  // ===== Bracket Structure (9 → play-in + 8-team bracket) =====
  const BRACKET_MATCHUPS = {
    playin: { top: 'ent-8', bot: 'ent-9', label: 'Play-In' },
    qf1: { top: 'ent-1', bot: null, feedsFrom: ['playin'], label: 'QF 1' },
    qf2: { top: 'ent-2', bot: 'ent-7', label: 'QF 2' },
    qf3: { top: 'ent-3', bot: 'ent-6', label: 'QF 3' },
    qf4: { top: 'ent-4', bot: 'ent-5', label: 'QF 4' },
    sf1:  { top: null, bot: null, feedsFrom: ['qf1', 'qf2'], label: 'SF 1' },
    sf2:  { top: null, bot: null, feedsFrom: ['qf3', 'qf4'], label: 'SF 2' },
    final: { top: null, bot: null, feedsFrom: ['sf1', 'sf2'], label: 'Championship' }
  };

  // Current active week (1=QF+play-in, 2=SF, 3=Final)
  const CURRENT_WEEK = 1;

  // ===== Cart State =====
  // cart: { entId: dollarAmount }
  const cart = {};

  const container = document.getElementById('ent-bracket');
  if (!container) return;

  // Highlight active week tab
  document.querySelectorAll('.ent-week').forEach(w => {
    const week = parseInt(w.dataset.week);
    if (week === CURRENT_WEEK) w.classList.add('active');
    if (week < CURRENT_WEEK) w.classList.add('completed');
  });

  // ===== Helpers =====
  function getEnt(id) {
    return ENTREPRENEURS.find(e => e.id === id);
  }

  // Get which matchup an entrepreneur is currently in (for the active week)
  function getMatchupForEnt(entId) {
    for (const [mId, m] of Object.entries(BRACKET_MATCHUPS)) {
      if (m.top === entId || m.bot === entId) return mId;
    }
    return null;
  }

  // Get opponent's entId in the same matchup
  function getOpponentId(entId) {
    const mId = getMatchupForEnt(entId);
    if (!mId) return null;
    const m = BRACKET_MATCHUPS[mId];
    if (m.top === entId) return m.bot;
    if (m.bot === entId) return m.top;
    return null;
  }

  // Check if adding this entrepreneur to cart would conflict
  function hasConflict(entId) {
    const opponentId = getOpponentId(entId);
    return opponentId && cart[opponentId] && cart[opponentId] > 0;
  }

  function getCartTotal() {
    return Object.values(cart).reduce((sum, amt) => sum + (amt || 0), 0);
  }

  function getCartCount() {
    return Object.values(cart).filter(amt => amt > 0).length;
  }

  function getTotalInMatchup(matchupId) {
    const m = BRACKET_MATCHUPS[matchupId];
    const topEnt = m.top ? getEnt(m.top) : null;
    const botEnt = m.bot ? getEnt(m.bot) : null;
    return (topEnt ? topEnt.raised : 0) + (botEnt ? botEnt.raised : 0);
  }

  // ===== Render =====
  function renderBracket() {
    container.innerHTML = '';

    // Play-in + QF column (Week 1)
    const round1 = document.createElement('div');
    round1.className = 'ent-round';
    if (1 > CURRENT_WEEK) round1.classList.add('ent-round-locked');

    const r1Label = document.createElement('div');
    r1Label.className = 'ent-round-label';
    r1Label.textContent = 'Week 1 \u2022 Quarterfinals';
    round1.appendChild(r1Label);

    const r1Matchups = document.createElement('div');
    r1Matchups.className = 'ent-matchups';

    r1Matchups.appendChild(createMatchupEl('playin', 1, true));
    r1Matchups.appendChild(createMatchupEl('qf1', 1, false));
    r1Matchups.appendChild(createMatchupEl('qf2', 1, false));
    r1Matchups.appendChild(createMatchupEl('qf3', 1, false));
    r1Matchups.appendChild(createMatchupEl('qf4', 1, false));

    round1.appendChild(r1Matchups);
    container.appendChild(round1);

    // Semifinals (Week 2)
    const round2 = createRoundCol('Week 2 \u2022 Semifinals', ['sf1', 'sf2'], 2);
    container.appendChild(round2);

    // Championship (Week 3)
    const round3 = createRoundCol('Week 3 \u2022 Championship', ['final'], 3);
    container.appendChild(round3);

    // Champion display
    const champDiv = document.createElement('div');
    champDiv.className = 'ent-champion-col';
    champDiv.innerHTML = `
      <div class="ent-round-label">Sponsor</div>
      <div class="ent-champion-box" id="ent-champion-box">
        <div class="ent-champion-icon">&#127942;</div>
        <div class="ent-champion-name">TBD</div>
      </div>
    `;
    container.appendChild(champDiv);

    // Render the floating cart
    renderCart();
  }

  function createRoundCol(label, matchupIds, weekNum) {
    const col = document.createElement('div');
    col.className = 'ent-round';
    if (weekNum > CURRENT_WEEK) col.classList.add('ent-round-locked');

    const labelEl = document.createElement('div');
    labelEl.className = 'ent-round-label';
    labelEl.textContent = label;
    col.appendChild(labelEl);

    const matchupsDiv = document.createElement('div');
    matchupsDiv.className = 'ent-matchups';
    matchupIds.forEach(mId => {
      matchupsDiv.appendChild(createMatchupEl(mId, weekNum, false));
    });
    col.appendChild(matchupsDiv);
    return col;
  }

  function createMatchupEl(matchupId, weekNum, isPlayin) {
    const m = BRACKET_MATCHUPS[matchupId];
    const matchup = document.createElement('div');
    matchup.className = 'ent-matchup' + (isPlayin ? ' ent-playin' : '');
    matchup.dataset.matchup = matchupId;

    if (isPlayin) {
      const tag = document.createElement('div');
      tag.className = 'ent-playin-tag';
      tag.textContent = 'Play-In';
      matchup.appendChild(tag);
    }

    const topEnt = m.top ? getEnt(m.top) : null;
    const botEnt = m.bot ? getEnt(m.bot) : null;
    const isActive = weekNum === CURRENT_WEEK;

    const topSlot = renderEntSlot(topEnt, matchupId, isActive);
    const vsDiv = document.createElement('div');
    vsDiv.className = 'ent-vs';
    vsDiv.textContent = 'VS';
    const botSlot = renderEntSlot(botEnt, matchupId, isActive);

    matchup.appendChild(topSlot);
    matchup.appendChild(vsDiv);
    matchup.appendChild(botSlot);

    return matchup;
  }

  function renderEntSlot(ent, matchupId, isActive) {
    const slot = document.createElement('div');

    if (!ent) {
      slot.className = 'ent-slot ent-slot-empty';
      slot.innerHTML = `
        <div class="ent-slot-photo-placeholder">?</div>
        <div class="ent-slot-info">
          <div class="ent-slot-name">Winner advances here</div>
        </div>
      `;
      return slot;
    }

    const total = getTotalInMatchup(matchupId);
    const pct = total > 0 ? Math.round((ent.raised / total) * 100) : 0;
    const inCart = cart[ent.id] && cart[ent.id] > 0;
    const opponentInCart = hasConflict(ent.id);

    slot.className = 'ent-slot' + (isActive ? ' ent-slot-active' : '') + (inCart ? ' ent-slot-selected' : '');

    const cartAmtDisplay = inCart ? `<div class="ent-cart-badge">$${cart[ent.id]} in cart</div>` : '';

    slot.innerHTML = `
      <div class="ent-slot-info">
        <div class="ent-slot-name">${ent.name}</div>
        <div class="ent-slot-biz">${ent.business}</div>
        <div class="ent-funding-bar">
          <div class="ent-funding-fill" style="width: ${pct}%"></div>
        </div>
        <div class="ent-slot-raised">$${ent.raised.toLocaleString()} raised</div>
        <a href="${ent.businessPlan}" target="_blank" class="ent-plan-link">View Business Plan</a>
        ${cartAmtDisplay}
      </div>
      <div class="ent-slot-photo">
        <img src="${ent.photo}" alt="${ent.name}" loading="lazy">
      </div>
      ${isActive ? renderCartControls(ent, opponentInCart) : ''}
    `;

    return slot;
  }

  function renderCartControls(ent, opponentInCart) {
    const inCart = cart[ent.id] && cart[ent.id] > 0;

    if (opponentInCart && !inCart) {
      return `<div class="ent-cart-conflict">Opponent selected</div>`;
    }

    if (inCart) {
      return `
        <div class="ent-cart-controls" data-ent-id="${ent.id}">
          <button class="btn-cart-minus" data-ent-id="${ent.id}" data-action="minus" title="Remove $5">−</button>
          <span class="ent-cart-amount">$${cart[ent.id]}</span>
          <button class="btn-cart-plus" data-ent-id="${ent.id}" data-action="plus" title="Add $5">+</button>
          <button class="btn-cart-remove" data-ent-id="${ent.id}" data-action="remove" title="Remove">&times;</button>
        </div>
      `;
    }

    return `<button class="btn-add-to-cart" data-ent-id="${ent.id}" data-action="preview">&#128640; Boost</button>`;
  }

  // ===== Floating Cart =====
  function renderCart() {
    let cartEl = document.getElementById('ent-cart-floating');
    const count = getCartCount();
    const total = getCartTotal();

    if (count === 0) {
      if (cartEl) cartEl.remove();
      return;
    }

    if (!cartEl) {
      cartEl = document.createElement('div');
      cartEl.id = 'ent-cart-floating';
      cartEl.className = 'ent-cart-floating';
      document.body.appendChild(cartEl);
    }

    const cartItems = Object.entries(cart)
      .filter(([, amt]) => amt > 0)
      .map(([entId, amt]) => {
        const ent = getEnt(entId);
        return `
          <div class="ent-cart-item">
            <img src="${ent.photo}" alt="${ent.name}" class="ent-cart-item-photo">
            <div class="ent-cart-item-info">
              <div class="ent-cart-item-name">${ent.name}</div>
              <div class="ent-cart-item-biz">${ent.business}</div>
            </div>
            <div class="ent-cart-item-controls">
              <button class="btn-cart-minus" data-ent-id="${entId}" data-action="minus">−</button>
              <span>$${amt}</span>
              <button class="btn-cart-plus" data-ent-id="${entId}" data-action="plus">+</button>
              <button class="btn-cart-remove" data-ent-id="${entId}" data-action="remove">&times;</button>
            </div>
          </div>
        `;
      }).join('');

    cartEl.innerHTML = `
      <div class="ent-cart-header" id="ent-cart-toggle">
        <span>&#128640; My Boosts</span>
        <span class="ent-cart-badge-count">${count} selected &bull; $${total}</span>
        <span class="ent-cart-toggle-icon">&#9660;</span>
      </div>
      <div class="ent-cart-body" id="ent-cart-body">
        ${cartItems}
        <div class="ent-cart-total">
          <strong>Total: $${total}</strong>
        </div>
        <button class="btn btn-primary ent-cart-checkout" id="ent-cart-checkout">
          &#128640; Boost Now ($${total})
        </button>
      </div>
    `;

    // Toggle cart body
    const toggleBtn = cartEl.querySelector('#ent-cart-toggle');
    const body = cartEl.querySelector('#ent-cart-body');
    toggleBtn.addEventListener('click', () => {
      body.classList.toggle('open');
      const icon = cartEl.querySelector('.ent-cart-toggle-icon');
      icon.textContent = body.classList.contains('open') ? '\u25B2' : '\u25BC';
    });

    // Checkout button
    const checkoutBtn = cartEl.querySelector('#ent-cart-checkout');
    checkoutBtn.addEventListener('click', handleCheckout);
  }

  // ===== Cart Actions =====
  function handleCartAction(entId, action) {
    switch (action) {
      case 'preview':
        if (!hasConflict(entId)) {
          showEntrepreneurPopup(entId);
        }
        return; // Don't re-render bracket — popup handles it
      case 'add':
        if (!hasConflict(entId)) {
          cart[entId] = 5;
        }
        break;
      case 'plus':
        if (cart[entId]) cart[entId] += 5;
        break;
      case 'minus':
        if (cart[entId] && cart[entId] > 5) {
          cart[entId] -= 5;
        } else {
          delete cart[entId];
        }
        break;
      case 'remove':
        delete cart[entId];
        break;
    }
    renderBracket();
  }

  // ===== Entrepreneur Preview Popup =====
  function showEntrepreneurPopup(entId) {
    const ent = getEnt(entId);
    if (!ent) return;

    // Remove any existing popup
    const existing = document.getElementById('ent-popup-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ent-popup-overlay';
    overlay.className = 'ent-popup-overlay';

    overlay.innerHTML = `
      <div class="ent-popup-card">
        <button class="ent-popup-close" id="ent-popup-close">&times;</button>
        <div class="ent-popup-photo">
          <img src="${ent.photo}" alt="${ent.name}">
        </div>
        <div class="ent-popup-info">
          <h3 class="ent-popup-name">${ent.name}</h3>
          <div class="ent-popup-business">${ent.business}</div>
          <div class="ent-popup-country">${ent.country || ''}</div>
          <p class="ent-popup-desc">${ent.description || 'Description coming soon.'}</p>
          <a href="${ent.businessPlan}" target="_blank" class="ent-popup-plan-link">View Full Business Plan &#8599;</a>
        </div>
        <div class="ent-popup-actions">
          <button class="btn btn-primary ent-popup-boost" id="ent-popup-boost">&#128640; Boost $5</button>
          <button class="ent-popup-cancel" id="ent-popup-cancel">Maybe Later</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    // Close handlers
    overlay.querySelector('#ent-popup-close').addEventListener('click', close);
    overlay.querySelector('#ent-popup-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Boost handler — add to cart and close
    overlay.querySelector('#ent-popup-boost').addEventListener('click', () => {
      cart[entId] = 5;
      renderBracket();
      close();
      if (window.BracketEngine) {
        window.BracketEngine.showToast(`${ent.name} boosted!`);
      }
    });
  }

  function handleCheckout() {
    const total = getCartTotal();
    if (total < 1) return;

    const checkoutBtn = document.getElementById('ent-cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Redirecting...';
    }

    // Build metadata for tracking which entrepreneurs get the funds
    const allocations = Object.entries(cart)
      .filter(([, amt]) => amt > 0)
      .map(([entId, amt]) => {
        const ent = getEnt(entId);
        return `${ent.name}: $${amt}`;
      })
      .join(', ');

    fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: total,
        description: `Entrepreneur Boost: ${allocations}`
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          // Save cart to localStorage before redirect so we can attribute later
          try {
            localStorage.setItem('m2a_ent_cart', JSON.stringify(cart));
          } catch (e) { /* ignore */ }
          window.location.href = data.url;
        } else {
          if (window.BracketEngine) {
            window.BracketEngine.showToast(data.error || 'Unable to start checkout. Please try again.');
          }
          if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = `\u{1F680} Boost Now ($${total})`;
          }
        }
      })
      .catch(() => {
        if (window.BracketEngine) {
          window.BracketEngine.showToast('Unable to connect to payment server. Please try again.');
        }
        if (checkoutBtn) {
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = `\u{1F680} Boost Now ($${total})`;
        }
      });
  }

  // ===== Event Delegation =====
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    handleCartAction(btn.dataset.entId, btn.dataset.action);
  });

  // Also handle clicks on the floating cart
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#ent-cart-floating [data-action]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    handleCartAction(btn.dataset.entId, btn.dataset.action);
  });

  // ===== Init =====
  renderBracket();
})();
