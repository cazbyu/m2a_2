// ===== Entrepreneur Cards =====
// Shows all entrepreneurs with their assigned tournament teams and a Boost button.
// Users can boost multiple entrepreneurs via a shopping cart, then checkout via Stripe.

(function () {
  'use strict';

  // ===== Entrepreneur Data =====
  const ENTREPRENEURS = [
    {
      id: 'ent-1',
      name: 'Kate Nanyangwe',
      business: 'Nails By Kate & Hair Salon',
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_2.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/03/Nails-By-Kate-Business-Plan.docx.pdf'
    },
    {
      id: 'ent-2',
      name: 'Jane Ndashe',
      business: 'JP Enterprise',
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/03/Entrapov-Business-Plan-JP-ENTERPRISE.docx.pdf'
    },
    {
      id: 'ent-3',
      name: 'Nanyangwe Katai',
      business: 'Chichi Braids',
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260226_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Entrapov-Business-Plan-CHICHI-BRAIDS.docx.pdf'
    },
    {
      id: 'ent-4',
      name: 'Saukilan Kapatamoyo',
      business: "God's Grace Detergent",
      country: 'Malawi',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Gods-Grace-Detergent-604x620.jpg',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Saukilan-Kapatamoyo.docx.pdf'
    },
    {
      id: 'ent-5',
      name: 'Sandra Chisala',
      business: 'High Voltage Fabrication',
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260214_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/HIGH-VOLTAGE-BUSINESS-PLAN.docx.pdf'
    },
    {
      id: 'ent-6',
      name: 'Kendrick B. Makhurane',
      business: 'Key B Manufacturers',
      country: 'Lesotho',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260213_7-686x620.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Key-B_Business-Plan.docx-1-1.docx-3.pdf'
    },
    {
      id: 'ent-7',
      name: 'Lyampu Mubiana',
      business: "Lyamupu's Pastry Kitchen",
      country: 'Zambia',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260126_2.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/Lyamupus-Pastry-Kitchen.docx.pdf'
    },
    {
      id: 'ent-8',
      name: 'Monica Ntchalachala',
      business: 'Femmo Second Hand Clothes',
      country: 'Malawi',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260123_4.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/1754573627541_1754573623418_Entrapov-Business-Plan-Template-Monica.docx-1.pdf'
    },
    {
      id: 'ent-9',
      name: 'Enrique Hannock',
      business: 'Nexora Technology Company',
      country: 'Kenya',
      description: 'Short description coming soon.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260113_2-536x620.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/ENRIQUE-HANNOCK-PROPOSAL.pdf.pdf'
    },
    {
      id: 'ent-10',
      name: 'Jibril',
      business: 'TBD',
      country: 'Kenya',
      description: 'Details coming soon.',
      photo: '',
      businessPlan: ''
    },
    {
      id: 'ent-11',
      name: 'Esther Ruhara',
      business: 'TBD',
      country: 'Kenya',
      description: 'Details coming soon.',
      photo: '',
      businessPlan: ''
    }
  ];

  // ===== Build Reverse Team Map =====
  // Reads TEAM_ENTREPRENEUR_MAP (from teams.js) and inverts it:
  // entrepreneur name → [team1, team2, ...]
  function buildTeamMap() {
    var map = {};
    if (typeof TEAM_ENTREPRENEUR_MAP === 'undefined') return map;
    for (var team in TEAM_ENTREPRENEUR_MAP) {
      if (!TEAM_ENTREPRENEUR_MAP.hasOwnProperty(team)) continue;
      var entName = TEAM_ENTREPRENEUR_MAP[team].name;
      if (!map[entName]) map[entName] = [];
      map[entName].push(team);
    }
    return map;
  }

  // ===== Cart State =====
  var cart = {};

  var container = document.getElementById('ent-bracket');
  if (!container) return;

  // ===== Helpers =====
  function getEnt(id) {
    return ENTREPRENEURS.find(function (e) { return e.id === id; });
  }

  function getCartTotal() {
    return Object.values(cart).reduce(function (sum, amt) { return sum + (amt || 0); }, 0);
  }

  function getCartCount() {
    return Object.values(cart).filter(function (amt) { return amt > 0; }).length;
  }

  // ===== Render Cards =====
  function renderCards() {
    var teamMap = buildTeamMap();
    container.innerHTML = '';

    var grid = document.createElement('div');
    grid.className = 'ent-cards-grid';

    ENTREPRENEURS.forEach(function (ent) {
      var teams = teamMap[ent.name] || [];
      grid.appendChild(createCard(ent, teams));
    });

    container.appendChild(grid);
    renderCart();
  }

  function createCard(ent, teams) {
    var card = document.createElement('div');
    card.className = 'ent-card';
    var inCart = cart[ent.id] && cart[ent.id] > 0;
    if (inCart) card.classList.add('ent-card-selected');

    // Photo
    var photoHtml = ent.photo
      ? '<img src="' + ent.photo + '" alt="' + ent.name + '" loading="lazy">'
      : '<div class="ent-card-photo-placeholder">?</div>';

    // Business plan link
    var planHtml = ent.businessPlan
      ? '<a href="' + ent.businessPlan + '" target="_blank" class="ent-card-plan-link">View Business Plan &#8599;</a>'
      : '';

    // Teams tags
    var teamsHtml = teams.map(function (t) {
      return '<span class="ent-team-tag">' + t + '</span>';
    }).join('');

    // Cart controls or boost button
    var actionsHtml;
    if (inCart) {
      actionsHtml = '<div class="ent-cart-controls" data-ent-id="' + ent.id + '">' +
        '<button class="btn-cart-minus" data-ent-id="' + ent.id + '" data-action="minus" title="Remove $1">\u2212</button>' +
        '<span class="ent-cart-amount">$' + cart[ent.id] + '</span>' +
        '<button class="btn-cart-plus" data-ent-id="' + ent.id + '" data-action="plus" title="Add $1">+</button>' +
        '<button class="btn-cart-remove" data-ent-id="' + ent.id + '" data-action="remove" title="Remove">&times;</button>' +
        '</div>';
    } else {
      actionsHtml = '<button class="btn-add-to-cart" data-ent-id="' + ent.id + '" data-action="preview">&#128640; Boost</button>';
    }

    card.innerHTML =
      '<div class="ent-card-photo">' + photoHtml + '</div>' +
      '<div class="ent-card-body">' +
        '<h3 class="ent-card-name">' + ent.name + '</h3>' +
        '<div class="ent-card-business">' + ent.business + '</div>' +
        '<div class="ent-card-country">' + ent.country + '</div>' +
        planHtml +
        (teams.length > 0 ? (
          '<div class="ent-card-teams">' +
            '<div class="ent-card-teams-label">Assigned Teams</div>' +
            '<div class="ent-card-teams-list">' + teamsHtml + '</div>' +
          '</div>'
        ) : '') +
      '</div>' +
      '<div class="ent-card-actions">' + actionsHtml + '</div>';

    return card;
  }

  // ===== Floating Cart =====
  function renderCart() {
    var cartEl = document.getElementById('ent-cart-floating');
    var count = getCartCount();
    var total = getCartTotal();

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

    var cartItems = Object.entries(cart)
      .filter(function (pair) { return pair[1] > 0; })
      .map(function (pair) {
        var entId = pair[0];
        var amt = pair[1];
        var ent = getEnt(entId);
        var photoSrc = ent.photo || '';
        var imgHtml = photoSrc
          ? '<img src="' + photoSrc + '" alt="' + ent.name + '" class="ent-cart-item-photo">'
          : '<div class="ent-cart-item-photo" style="background:#ddd;display:flex;align-items:center;justify-content:center;color:#999;font-size:0.8rem;">?</div>';
        return '<div class="ent-cart-item">' +
          imgHtml +
          '<div class="ent-cart-item-info">' +
            '<div class="ent-cart-item-name">' + ent.name + '</div>' +
            '<div class="ent-cart-item-biz">' + ent.business + '</div>' +
          '</div>' +
          '<div class="ent-cart-item-controls">' +
            '<button class="btn-cart-minus" data-ent-id="' + entId + '" data-action="minus">\u2212</button>' +
            '<span>$' + amt + '</span>' +
            '<button class="btn-cart-plus" data-ent-id="' + entId + '" data-action="plus">+</button>' +
            '<button class="btn-cart-remove" data-ent-id="' + entId + '" data-action="remove">&times;</button>' +
          '</div>' +
        '</div>';
      }).join('');

    cartEl.innerHTML =
      '<div class="ent-cart-header" id="ent-cart-toggle">' +
        '<span>&#128640; My Boosts</span>' +
        '<span class="ent-cart-badge-count">' + count + ' selected &bull; $' + total + '</span>' +
        '<span class="ent-cart-toggle-icon">&#9660;</span>' +
      '</div>' +
      '<div class="ent-cart-body" id="ent-cart-body">' +
        cartItems +
        '<div class="ent-cart-total"><strong>Total: $' + total + '</strong></div>' +
        '<button class="btn btn-primary ent-cart-checkout" id="ent-cart-checkout">&#128640; Boost Now ($' + total + ')</button>' +
      '</div>';

    // Toggle cart body
    var toggleBtn = cartEl.querySelector('#ent-cart-toggle');
    var body = cartEl.querySelector('#ent-cart-body');
    toggleBtn.addEventListener('click', function () {
      body.classList.toggle('open');
      var icon = cartEl.querySelector('.ent-cart-toggle-icon');
      icon.textContent = body.classList.contains('open') ? '\u25B2' : '\u25BC';
    });

    // Checkout button
    var checkoutBtn = cartEl.querySelector('#ent-cart-checkout');
    checkoutBtn.addEventListener('click', handleCheckout);
  }

  // ===== Cart Actions =====
  function handleCartAction(entId, action) {
    switch (action) {
      case 'preview':
        showEntrepreneurPopup(entId);
        return; // Popup handles adding to cart
      case 'add':
        cart[entId] = 5;
        break;
      case 'plus':
        if (cart[entId]) cart[entId] += 1;
        break;
      case 'minus':
        if (cart[entId] && cart[entId] > 1) {
          cart[entId] -= 1;
        } else {
          delete cart[entId];
        }
        break;
      case 'remove':
        delete cart[entId];
        break;
    }
    renderCards();
  }

  // ===== Entrepreneur Preview Popup =====
  function showEntrepreneurPopup(entId) {
    var ent = getEnt(entId);
    if (!ent) return;

    // Remove any existing popup
    var existing = document.getElementById('ent-popup-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'ent-popup-overlay';
    overlay.className = 'ent-popup-overlay';

    var photoHtml = ent.photo
      ? '<img src="' + ent.photo + '" alt="' + ent.name + '">'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a2540;color:#555;font-size:3rem;">?</div>';

    var planLink = ent.businessPlan
      ? '<a href="' + ent.businessPlan + '" target="_blank" class="ent-popup-plan-link">View Full Business Plan &#8599;</a>'
      : '';

    overlay.innerHTML =
      '<div class="ent-popup-card">' +
        '<button class="ent-popup-close" id="ent-popup-close">&times;</button>' +
        '<div class="ent-popup-photo">' + photoHtml + '</div>' +
        '<div class="ent-popup-info">' +
          '<h3 class="ent-popup-name">' + ent.name + '</h3>' +
          '<div class="ent-popup-business">' + ent.business + '</div>' +
          '<div class="ent-popup-country">' + (ent.country || '') + '</div>' +
          '<p class="ent-popup-desc">' + (ent.description || 'Description coming soon.') + '</p>' +
          planLink +
        '</div>' +
        '<div class="ent-popup-actions">' +
          '<button class="btn btn-primary ent-popup-boost" id="ent-popup-boost">&#128640; Boost $5</button>' +
          '<button class="ent-popup-cancel" id="ent-popup-cancel">Maybe Later</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    var close = function () { overlay.remove(); };

    overlay.querySelector('#ent-popup-close').addEventListener('click', close);
    overlay.querySelector('#ent-popup-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    overlay.querySelector('#ent-popup-boost').addEventListener('click', function () {
      cart[entId] = 5;
      renderCards();
      close();
      if (window.BracketEngine) {
        window.BracketEngine.showToast(ent.name + ' boosted!');
      }
    });
  }

  // ===== Checkout =====
  function handleCheckout() {
    var total = getCartTotal();
    if (total < 1) return;

    var checkoutBtn = document.getElementById('ent-cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Redirecting...';
    }

    // Build metadata for tracking
    var allocations = Object.entries(cart)
      .filter(function (pair) { return pair[1] > 0; })
      .map(function (pair) {
        var ent = getEnt(pair[0]);
        return ent.name + ': $' + pair[1];
      })
      .join(', ');

    fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: total,
        description: 'Entrepreneur Boost: ' + allocations
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.url) {
          // Save cart + donation metadata for Supabase recording after Stripe returns
          try {
            var entNames = {};
            Object.keys(cart).forEach(function (eid) {
              var e = getEnt(eid);
              if (e) entNames[eid] = e.name;
            });
            localStorage.setItem('m2a_ent_cart', JSON.stringify(cart));
            localStorage.setItem('m2a_pending_donation', JSON.stringify({
              type: 'boost',
              amount: total,
              cart: Object.assign({}, cart),
              entNames: entNames,
              allocations: allocations,
              timestamp: Date.now()
            }));
          } catch (e) { /* ignore */ }
          window.location.href = data.url;
        } else {
          if (window.BracketEngine) {
            window.BracketEngine.showToast(data.error || 'Unable to start checkout. Please try again.');
          }
          if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = '\u{1F680} Boost Now ($' + total + ')';
          }
        }
      })
      .catch(function () {
        if (window.BracketEngine) {
          window.BracketEngine.showToast('Unable to connect to payment server. Please try again.');
        }
        if (checkoutBtn) {
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = '\u{1F680} Boost Now ($' + total + ')';
        }
      });
  }

  // ===== Event Delegation =====
  container.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    handleCartAction(btn.dataset.entId, btn.dataset.action);
  });

  // Also handle clicks on the floating cart
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#ent-cart-floating [data-action]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    handleCartAction(btn.dataset.entId, btn.dataset.action);
  });

  // ===== Init =====
  renderCards();
})();
