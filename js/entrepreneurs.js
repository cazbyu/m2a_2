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
      description: 'Kate offers nail care and hair salon services to women in her local Zambian community, building a loyal client base with quality personal beauty services.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_2.png',
      businessPlan: 'https://entrapov.com/nails-by-kate-hair-salon-business-plan/'
    },
    {
      id: 'ent-2',
      name: 'Jane Ndashe',
      business: 'JP Enterprise',
      country: 'Zambia',
      description: 'Jane buys and resells dried kapenta fish, a staple food commodity, to local customers in Zambia \u2014 growing her trading volume to serve more families.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_1.png',
      businessPlan: 'https://entrapov.com/jp-enterprise-business-plan/'
    },
    {
      id: 'ent-3',
      name: 'Nanyangwe Katai',
      business: 'Chichi Braids',
      country: 'Zambia',
      description: 'Nanyangwe provides professional hair braiding services to women and girls in Zambia, offering a range of braided styles with quality materials.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260226_1.png',
      businessPlan: 'https://entrapov.com/chichi-braids-business-plans/'
    },
    {
      id: 'ent-4',
      name: 'Saukilan Kapatamoyo',
      business: "God's Grace Detergent",
      country: 'Uganda',
      description: 'Saukilan manufactures and sells affordable household detergent in Uganda, providing a locally-made cleaning product to families in her community.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Gods-Grace-Detergent-604x620.jpg',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Saukilan-Kapatamoyo.docx.pdf',
      funded: true
    },
    {
      id: 'ent-5',
      name: 'Sandra Chisala',
      business: 'High Voltage Fabrication',
      country: 'Zambia',
      description: 'Sandra runs a metal fabrication workshop in Zambia, welding and building custom products for local businesses and households.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260214_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/HIGH-VOLTAGE-BUSINESS-PLAN.docx.pdf',
      funded: true
    },
    {
      id: 'ent-6',
      name: 'Kendrick B. Makhurane',
      business: 'Key B Manufacturers',
      country: 'Zimbabwe',
      description: 'Kendrick manufactures household and industrial products in Zimbabwe, building a local brand that serves community needs with quality goods.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260213_7-686x620.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Key-B_Business-Plan.docx-1-1.docx-3.pdf',
      funded: true
    },
    {
      id: 'ent-7',
      name: 'Lyampu Mubiana',
      business: "Lyamupu's Pastry Kitchen",
      country: 'Zambia',
      description: 'Lyampu bakes and sells fresh pastries and savory dishes from her kitchen in Zambia, serving local customers with affordable, home-style food.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260126_2.png',
      businessPlan: 'https://entrapov.com/lyamupus-pastry-kitchen-business-plan/',
      funded: true
    },
    {
      id: 'ent-8',
      name: 'Monica Ntchalachala',
      business: 'Femmo Second Hand Clothes',
      country: 'Malawi',
      description: 'Monica buys and resells quality secondhand clothing in Malawi, making affordable fashion accessible to families in her community.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260123_4.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/1754573627541_1754573623418_Entrapov-Business-Plan-Template-Monica.docx-1.pdf',
      funded: true
    },
    {
      id: 'ent-9',
      name: 'Enrique Hannock',
      business: 'Nexora Technology Company',
      country: 'Malawi',
      description: 'Enrique is launching a technology services company in Kenya, offering IT and digital solutions to local businesses as the country\u2019s tech sector rapidly grows.',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260113_2-536x620.png',
      businessPlan: 'https://entrapov.com/nexora-technology-company/'
    },
    {
      id: 'ent-10',
      name: 'Jibril',
      business: 'TBD',
      country: 'Kenya',
      description: 'Details coming soon.',
      photo: '/assets/Jibril.png',
      businessPlan: ''
    },
    {
      id: 'ent-11',
      name: 'Esther Ruhara',
      business: 'Inspire Hands Creation Enterprise',
      country: 'Kenya',
      description: 'Esther creates handmade crafts and products in Kenya, turning local materials into beautiful goods that support her family and inspire her community.',
      photo: '/assets/esther jewelry.jpeg',
      businessPlan: ''
    },
    {
      id: 'ent-12',
      name: 'Lisa Jane Sithole',
      business: 'TBD',
      country: 'Zimbabwe',
      description: 'Details coming soon.',
      photo: '/assets/Lisa.jpg',
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
  var cart = {};           // entrepreneur boosts: { entId: amount }
  var donationAmount = 15; // general donation amount (default $15)
  var rotaryClub = '';
  var cartVisible = false; // tracks if cart has been opened

  var container = document.getElementById('ent-bracket');
  if (!container) return;

  // ===== Helpers =====
  function getEnt(id) {
    return ENTREPRENEURS.find(function (e) { return e.id === id; });
  }

  function getBoostTotal() {
    return Object.values(cart).reduce(function (sum, amt) { return sum + (amt || 0); }, 0);
  }

  function getCartTotal() {
    return donationAmount + getBoostTotal();
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

  // ===== Photo Position Storage =====
  function getPhotoSettings(entId) {
    try {
      var saved = JSON.parse(localStorage.getItem('m2a_photo_settings') || '{}');
      return saved[entId] || { posY: 50, zoom: 100 };
    } catch (e) { return { posY: 50, zoom: 100 }; }
  }
  function savePhotoSettings(entId, posY, zoom) {
    try {
      var saved = JSON.parse(localStorage.getItem('m2a_photo_settings') || '{}');
      saved[entId] = { posY: posY, zoom: zoom };
      localStorage.setItem('m2a_photo_settings', JSON.stringify(saved));
    } catch (e) { /* ignore */ }
  }

  function createCard(ent, teams) {
    var card = document.createElement('div');
    card.className = 'ent-card';
    var inCart = cart[ent.id] && cart[ent.id] > 0;
    if (inCart) card.classList.add('ent-card-selected');

    // Flag image
    var flagSrc = (typeof COUNTRY_FLAGS !== 'undefined' && COUNTRY_FLAGS[ent.country]) || '';
    var flagHtml = flagSrc
      ? '<img src="' + flagSrc + '" alt="' + ent.country + '" class="ent-card-flag">'
      : '';

    // Photo with position controls
    var photoSettings = getPhotoSettings(ent.id);
    var photoHtml;
    if (ent.photo) {
      photoHtml = '<div class="ent-card-photo" data-ent-id="' + ent.id + '">' +
        '<img src="' + ent.photo + '" alt="' + ent.name + '" loading="lazy" ' +
          'style="object-position: 50% ' + photoSettings.posY + '%; transform: scale(' + (photoSettings.zoom / 100) + ');">' +
        '<div class="ent-photo-controls">' +
          '<label><span>Position</span><input type="range" class="photo-pos-slider" min="0" max="100" value="' + photoSettings.posY + '" data-ent-id="' + ent.id + '"></label>' +
          '<label><span>Zoom</span><input type="range" class="photo-zoom-slider" min="100" max="250" value="' + photoSettings.zoom + '" data-ent-id="' + ent.id + '"></label>' +
        '</div>' +
      '</div>';
    } else {
      photoHtml = '<div class="ent-card-photo"><div class="ent-card-photo-placeholder">?</div></div>';
    }

    // Business plan link
    var planHtml = ent.businessPlan
      ? '<a href="' + ent.businessPlan + '" target="_blank" rel="noopener noreferrer" class="ent-card-plan-link">View Business Plan &#8599;</a>'
      : '';

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

    // Funded stamp
    var fundedHtml = ent.funded
      ? '<div class="ent-card-funded-stamp">FUNDED<span class="ent-card-funded-sub">Next entrepreneur on deck</span></div>'
      : '';

    // Teams tags
    var teamsHtml = teams.length > 0
      ? '<div class="ent-card-teams">' +
          '<div class="ent-card-teams-label">Teams that help ' + ent.name.split(' ')[0] + ' win</div>' +
          '<div class="ent-card-teams-list">' +
            teams.map(function (t) { return '<span class="ent-team-tag">' + t + '</span>'; }).join('') +
          '</div>' +
        '</div>'
      : '';

    card.innerHTML =
      photoHtml +
      fundedHtml +
      '<div class="ent-card-body">' +
        '<h3 class="ent-card-name">' + ent.name + '</h3>' +
        '<div class="ent-card-business">' + ent.business + '</div>' +
        '<div class="ent-card-country">' + flagHtml + ' ' + ent.country + '</div>' +
        '<hr class="ent-card-divider">' +
        '<div class="ent-card-desc-label">Business Description</div>' +
        '<p class="ent-card-desc">' + ent.description + '</p>' +
        planHtml +
        teamsHtml +
      '</div>' +
      '<div class="ent-card-actions">' + actionsHtml + '</div>';

    return card;
  }

  // ===== Floating Cart =====
  function renderCart() {
    var cartEl = document.getElementById('ent-cart-floating');
    var boostCount = getCartCount();
    var total = getCartTotal();

    // Only show cart if it's been opened (via Donate or adding a boost)
    if (!cartVisible && boostCount === 0) {
      if (cartEl) cartEl.remove();
      return;
    }

    if (!cartEl) {
      cartEl = document.createElement('div');
      cartEl.id = 'ent-cart-floating';
      cartEl.className = 'ent-cart-floating';
      document.body.appendChild(cartEl);
    }

    // Donation amount selector with quick buttons
    var amountBtns = [10, 15, 25, 50].map(function (amt) {
      var active = donationAmount === amt ? ' active' : '';
      return '<button class="cart-amt-btn' + active + '" data-cart-amount="' + amt + '">$' + amt + '</button>';
    }).join('');

    var donationRow =
      '<div class="cart-donation-section">' +
        '<div class="cart-donation-label">Donation Amount</div>' +
        '<div class="cart-donation-amounts">' +
          amountBtns +
          '<div class="cart-custom-amount">' +
            '<span>$</span><input type="number" id="cart-custom-amount" min="0" placeholder="Other" value="' +
              ([10, 15, 25, 50].indexOf(donationAmount) === -1 && donationAmount > 0 ? donationAmount : '') + '">' +
          '</div>' +
        '</div>' +
        '<div class="cart-donation-msg">&#127758; Your donation supports all the entrepreneurs!</div>' +
      '</div>';

    // Entrepreneur boost items
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

    // Boost section (only show header if there are boosts or to encourage adding)
    var boostSection = '';
    if (boostCount > 0) {
      boostSection =
        '<div class="cart-boost-section">' +
          '<div class="cart-boost-label">&#128640; Entrepreneur Boosts</div>' +
          cartItems +
          '<a href="#entrepreneurs" class="ent-cart-browse-link">+ Boost another entrepreneur</a>' +
        '</div>';
    } else {
      boostSection =
        '<div class="cart-boost-section cart-boost-empty">' +
          '<a href="#entrepreneurs" class="ent-cart-browse-link">&#128640; Boost a specific entrepreneur (optional)</a>' +
        '</div>';
    }

    var headerLabel = total > 0 ? ('$' + total) : 'Donate';

    cartEl.innerHTML =
      '<div class="ent-cart-header" id="ent-cart-toggle">' +
        '<span>&#10084;&#65039; My Donation</span>' +
        '<span class="ent-cart-badge-count">' + headerLabel + '</span>' +
        '<span class="ent-cart-toggle-icon">&#9660;</span>' +
      '</div>' +
      '<div class="ent-cart-body" id="ent-cart-body">' +
        donationRow +
        boostSection +
        '<div class="ent-cart-donor-info">' +
          '<div class="cart-donor-name-row">' +
            '<div class="cart-donor-name-field">' +
              '<label for="cart-donor-first" class="ent-cart-rotary-label">First Name</label>' +
              '<input type="text" id="cart-donor-first" class="ent-cart-rotary-input" placeholder="First">' +
            '</div>' +
            '<div class="cart-donor-name-field">' +
              '<label for="cart-donor-last" class="ent-cart-rotary-label">Last Name</label>' +
              '<input type="text" id="cart-donor-last" class="ent-cart-rotary-input" placeholder="Last">' +
            '</div>' +
          '</div>' +
          '<label for="cart-donor-email" class="ent-cart-rotary-label">Your Email</label>' +
          '<input type="email" id="cart-donor-email" class="ent-cart-rotary-input" placeholder="your@email.com">' +
        '</div>' +
        '<div class="ent-cart-rotary">' +
          '<label for="rotary-club-input" class="ent-cart-rotary-label">Rotary Club (optional)</label>' +
          '<input type="text" id="rotary-club-input" class="ent-cart-rotary-input" placeholder="e.g. Sandy Rotary Club" value="' + (rotaryClub || '').replace(/"/g, '&quot;') + '">' +
        '</div>' +
        '<div class="ent-cart-total"><strong>Total: $' + total + '</strong></div>' +
        '<button class="btn btn-primary ent-cart-checkout" id="ent-cart-checkout">&#10084;&#65039; Donate Now ($' + total + ')</button>' +
        '<div class="ent-cart-note">No donation is required to play the bracket challenge</div>' +
      '</div>';

    // Toggle cart body
    var toggleBtn = cartEl.querySelector('#ent-cart-toggle');
    var body = cartEl.querySelector('#ent-cart-body');
    toggleBtn.addEventListener('click', function () {
      body.classList.toggle('open');
      var icon = cartEl.querySelector('.ent-cart-toggle-icon');
      icon.textContent = body.classList.contains('open') ? '\u25B2' : '\u25BC';
    });

    // Donation amount buttons
    cartEl.querySelectorAll('.cart-amt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        donationAmount = parseInt(btn.dataset.cartAmount);
        var customInput = cartEl.querySelector('#cart-custom-amount');
        if (customInput) customInput.value = '';
        updateCartTotals();
        // Update active state
        cartEl.querySelectorAll('.cart-amt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    // Custom amount input
    var customAmountInput = cartEl.querySelector('#cart-custom-amount');
    if (customAmountInput) {
      customAmountInput.addEventListener('input', function () {
        var val = parseInt(customAmountInput.value) || 0;
        donationAmount = Math.max(0, val);
        cartEl.querySelectorAll('.cart-amt-btn').forEach(function (b) { b.classList.remove('active'); });
        updateCartTotals();
      });
    }

    // Pre-fill donor name/email from bracket form if available
    var donorFirstInput = cartEl.querySelector('#cart-donor-first');
    var donorLastInput = cartEl.querySelector('#cart-donor-last');
    var donorEmailInput = cartEl.querySelector('#cart-donor-email');
    if (donorFirstInput) {
      var fnEl = document.getElementById('first-name');
      if (fnEl && fnEl.value.trim()) donorFirstInput.value = fnEl.value.trim();
    }
    if (donorLastInput) {
      var lnEl = document.getElementById('last-name');
      if (lnEl && lnEl.value.trim()) donorLastInput.value = lnEl.value.trim();
    }
    if (donorEmailInput) {
      var emailEl = document.getElementById('email');
      var existingEmail = emailEl ? emailEl.value.trim() : '';
      if (existingEmail) donorEmailInput.value = existingEmail;
    }

    // Rotary Club input
    var clubInput = cartEl.querySelector('#rotary-club-input');
    if (clubInput) {
      clubInput.addEventListener('input', function () {
        rotaryClub = clubInput.value;
      });
    }

    // Checkout button
    var checkoutBtn = cartEl.querySelector('#ent-cart-checkout');
    checkoutBtn.addEventListener('click', handleCheckout);
  }

  // Lightweight total update (no full re-render, keeps cart open)
  function updateCartTotals() {
    var cartEl = document.getElementById('ent-cart-floating');
    if (!cartEl) return;
    var total = getCartTotal();
    var badge = cartEl.querySelector('.ent-cart-badge-count');
    if (badge) badge.textContent = '$' + total;
    var totalEl = cartEl.querySelector('.ent-cart-total strong');
    if (totalEl) totalEl.textContent = 'Total: $' + total;
    var checkoutBtn = cartEl.querySelector('.ent-cart-checkout');
    if (checkoutBtn) checkoutBtn.textContent = '\u2764\uFE0F Donate Now ($' + total + ')';
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

    // For +/- changes, do a lightweight update instead of full re-render
    // so the floating cart stays open
    if (action === 'plus' || action === 'minus') {
      updateCartAmounts();
    } else {
      renderCards();
    }
  }

  // ===== Lightweight Cart Update =====
  // Updates amounts in-place without rebuilding the DOM (keeps cart open)
  function updateCartAmounts() {
    // Update amounts on card controls
    document.querySelectorAll('.ent-cart-controls').forEach(function (ctrl) {
      var eid = ctrl.dataset.entId;
      var amtSpan = ctrl.querySelector('.ent-cart-amount');
      if (amtSpan && cart[eid]) {
        amtSpan.textContent = '$' + cart[eid];
      }
    });

    // Update floating cart item amounts
    var cartEl = document.getElementById('ent-cart-floating');
    if (!cartEl) return;

    cartEl.querySelectorAll('.ent-cart-item-controls').forEach(function (ctrl) {
      var minusBtn = ctrl.querySelector('[data-action="minus"]');
      if (!minusBtn) return;
      var eid = minusBtn.dataset.entId;
      var amtSpan = ctrl.querySelector('span');
      if (amtSpan && cart[eid]) {
        amtSpan.textContent = '$' + cart[eid];
      }
    });

    updateCartTotals();
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

    var flagSrc = (typeof COUNTRY_FLAGS !== 'undefined' && COUNTRY_FLAGS[ent.country]) || '';

    var planLink = ent.businessPlan
      ? '<a href="' + ent.businessPlan + '" target="_blank" rel="noopener noreferrer" class="ent-popup-plan-link">View Full Business Plan &#8599;</a>'
      : '';

    overlay.innerHTML =
      '<div class="ent-popup-card">' +
        '<button class="ent-popup-close" id="ent-popup-close">&times;</button>' +
        '<div class="ent-popup-photo">' + photoHtml + '</div>' +
        '<div class="ent-popup-info">' +
          '<h3 class="ent-popup-name">' + ent.name + '</h3>' +
          '<div class="ent-popup-business">' + ent.business + '</div>' +
          '<div class="ent-popup-country">' +
            (flagSrc ? '<img src="' + flagSrc + '" alt="' + ent.country + '" style="height:16px;vertical-align:middle;margin-right:4px;">' : '') +
            (ent.country || '') +
          '</div>' +
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
    if (total < 1) {
      if (window.BracketEngine) window.BracketEngine.showToast('Please select a donation amount');
      return;
    }

    var checkoutBtn = document.getElementById('ent-cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Redirecting...';
    }

    // Build metadata for tracking
    var boostAllocations = Object.entries(cart)
      .filter(function (pair) { return pair[1] > 0; })
      .map(function (pair) {
        var ent = getEnt(pair[0]);
        return ent.name + ': $' + pair[1];
      })
      .join(', ');

    var descParts = [];
    if (donationAmount > 0) descParts.push('Donation: $' + donationAmount);
    if (boostAllocations) descParts.push('Boosts: ' + boostAllocations);
    if (rotaryClub) descParts.push('Club: ' + rotaryClub);
    var description = descParts.join(' | ') || 'March -2- Africa Donation';

    fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: total,
        description: description
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
            // Grab contributor info from bracket form first, then cart donor fields
            var emailEl = document.getElementById('email');
            var fnEl = document.getElementById('first-name');
            var lnEl = document.getElementById('last-name');
            var cartDonorFirst = document.getElementById('cart-donor-first');
            var cartDonorLast = document.getElementById('cart-donor-last');
            var cartDonorEmail = document.getElementById('cart-donor-email');
            var contributorEmail = (emailEl && emailEl.value.trim()) || (cartDonorEmail && cartDonorEmail.value.trim()) || '';
            var contributorFirst = (fnEl && fnEl.value.trim()) || (cartDonorFirst && cartDonorFirst.value.trim()) || '';
            var contributorLast = (lnEl && lnEl.value.trim()) || (cartDonorLast && cartDonorLast.value.trim()) || '';

            localStorage.setItem('m2a_ent_cart', JSON.stringify(cart));
            localStorage.setItem('m2a_pending_donation', JSON.stringify({
              type: 'boost',
              amount: total,
              donationAmount: donationAmount,
              cart: Object.assign({}, cart),
              entNames: entNames,
              allocations: boostAllocations,
              email: contributorEmail,
              firstName: contributorFirst,
              lastName: contributorLast,
              rotaryClub: rotaryClub || '',
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

  // ===== Photo Position/Zoom Sliders =====
  container.addEventListener('input', function (e) {
    var slider = e.target;
    if (!slider.classList.contains('photo-pos-slider') && !slider.classList.contains('photo-zoom-slider')) return;
    var entId = slider.dataset.entId;
    var photoDiv = slider.closest('.ent-card-photo');
    if (!photoDiv) return;
    var img = photoDiv.querySelector('img');
    if (!img) return;

    var posSlider = photoDiv.querySelector('.photo-pos-slider');
    var zoomSlider = photoDiv.querySelector('.photo-zoom-slider');
    var posY = posSlider ? parseInt(posSlider.value) : 50;
    var zoom = zoomSlider ? parseInt(zoomSlider.value) : 100;

    img.style.objectPosition = '50% ' + posY + '%';
    img.style.transform = 'scale(' + (zoom / 100) + ')';
    savePhotoSettings(entId, posY, zoom);
  });

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

  // ===== Champion Suggestion =====
  // Reads the user's champion pick from BracketEngine and suggests boosting that entrepreneur
  function getChampionSuggestion() {
    if (!window.BracketEngine) return null;
    var picks = window.BracketEngine.getPicks();
    var champPick = picks['ff-champ'];
    if (!champPick || !champPick.team) return null;
    var entInfo = window.BracketEngine.getEntrepreneurForTeam(champPick.team);
    if (!entInfo) return null;
    // Find the entrepreneur ID from our data
    var ent = ENTREPRENEURS.find(function (e) { return e.name === entInfo.name; });
    if (!ent) return null;
    return { entId: ent.id, name: ent.name, country: entInfo.country, team: champPick.team };
  }

  // ===== Public API =====
  // Exposed so the donate button and other modules can interact with the cart
  window.EntrepreneurBoost = {
    addToCart: function (entId, amount) {
      cart[entId] = (cart[entId] || 0) + amount;
      cartVisible = true;
      renderCards();
    },
    showDonateCart: function (amount) {
      // Show the cart with a donation amount pre-selected
      if (amount) donationAmount = amount;
      cartVisible = true;
      renderCards();
      // Open it
      this.openCart();
    },
    openCart: function () {
      var cartEl = document.getElementById('ent-cart-floating');
      if (!cartEl) {
        // Cart not rendered yet — make it visible and render
        cartVisible = true;
        renderCards();
        cartEl = document.getElementById('ent-cart-floating');
      }
      if (cartEl) {
        var body = cartEl.querySelector('#ent-cart-body');
        if (body && !body.classList.contains('open')) {
          body.classList.add('open');
          var icon = cartEl.querySelector('.ent-cart-toggle-icon');
          if (icon) icon.textContent = '\u25B2';
        }
      }
    },
    getEntIdByName: function (name) {
      var ent = ENTREPRENEURS.find(function (e) { return e.name === name; });
      return ent ? ent.id : null;
    },
    getChampionSuggestion: getChampionSuggestion,
    getCart: function () { return cart; },
    getCartTotal: getCartTotal,
    getDonationAmount: function () { return donationAmount; }
  };

  // ===== Hero Spotlight Rotator =====
  // Shows a mini entrepreneur card in the hero section, cycling every 5 seconds
  function initHeroSpotlight() {
    var spotlight = document.getElementById('hero-ent-spotlight');
    if (!spotlight) return;

    var currentIndex = 0;
    var fadeClass = 'hero-ent-fade-in';

    function renderSpotlight() {
      var ent = ENTREPRENEURS[currentIndex];
      var flagSrc = (typeof COUNTRY_FLAGS !== 'undefined' && COUNTRY_FLAGS[ent.country]) || '';
      var flagImg = flagSrc
        ? '<img src="' + flagSrc + '" alt="' + ent.country + '" class="hero-ent-flag">'
        : '';
      var photoHtml = ent.photo
        ? '<img src="' + ent.photo + '" alt="' + ent.name + '" class="hero-ent-photo">'
        : '<div class="hero-ent-photo hero-ent-photo-placeholder">?</div>';

      var fundedBadge = ent.funded
        ? '<span class="hero-ent-funded">FUNDED</span>'
        : '';

      spotlight.classList.remove(fadeClass);
      // Force reflow to restart animation
      void spotlight.offsetWidth;

      spotlight.innerHTML =
        '<a href="#entrepreneurs" class="hero-ent-card">' +
          photoHtml +
          '<div class="hero-ent-info">' +
            '<div class="hero-ent-name">' + ent.name + ' ' + fundedBadge + '</div>' +
            '<div class="hero-ent-business">' + ent.business + '</div>' +
            '<div class="hero-ent-country">' + flagImg + ' ' + ent.country + '</div>' +
          '</div>' +
        '</a>';

      spotlight.classList.add(fadeClass);

      currentIndex = (currentIndex + 1) % ENTREPRENEURS.length;
    }

    renderSpotlight();
    setInterval(renderSpotlight, 5000);
  }

  initHeroSpotlight();

  // ===== Init =====
  renderCards();
})();
