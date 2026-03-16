// ===== Supabase Integration =====
// Saves bracket picks, calculates scores, powers the leaderboard,
// and tracks entrepreneur donation votes.
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values.

(function () {
  'use strict';

  const SUPABASE_URL = 'https://ryxhnmkmsevedgjiduxn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eGhubWttc2V2ZWRnamlkdXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTAyOTMsImV4cCI6MjA2MDQ4NjI5M30.8o_OVZ9dogEl9eGhSVJDv0fGvPxICEzPctIdnEiN2Cc';

  const TABLE_BRACKETS = '0013_m2a_bracket';
  const TABLE_RESULTS = '0013_m2a_results';
  const TABLE_VOTES = '0013_m2a_entrepreneur_votes';
  const TABLE_CONTRIBUTIONS = '0013_m2a_contributions';
  const TABLE_ENTREPRENEURS = '0013_m2a_entrepreneurs';
  const VIEW_LEADERBOARD = '0013_m2a_leaderboard';
  const VIEW_ENT_TOTALS = '0013_m2a_entrepreneur_totals';

  function isDemo() {
    return SUPABASE_URL.includes('YOUR_PROJECT');
  }

  // ===== Scoring System =====
  // Points per correct pick in each round
  const POINTS_PER_ROUND = {
    1: 5,     // Round of 64
    2: 10,    // Round of 32
    3: 20,    // 16 Remain
    4: 40,    // 8 Left
    5: 80,    // Finals
    6: 160    // Championship
  };
  // ESPN uses: 10/20/40/80/160/320 (same 2x ratio, double values)
  // Max possible: 32×5 + 16×10 + 8×20 + 4×40 + 2×80 + 1×160 = 960

  // ===== REST Client =====

  function supabaseRequest(table, method, body, query) {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    if (method === 'POST') headers['Prefer'] = 'return=representation';
    if (method === 'PATCH') headers['Prefer'] = 'return=representation';

    return fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    }).then(res => {
      if (!res.ok) return res.text().then(t => { throw new Error(t); });
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return res.json();
      }
      return null;
    });
  }

  // ===== Scoring Engine =====

  function getRoundFromGameId(gameId) {
    if (gameId === 'ff-champ') return 6;
    if (gameId.startsWith('ff-semi')) return 5;
    const match = gameId.match(/r(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  function calculateScore(userPicks, results) {
    let totalScore = 0;
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let correctPicks = 0;
    let totalGames = 0;

    for (const [gameId, result] of Object.entries(results)) {
      totalGames++;
      const round = getRoundFromGameId(gameId);
      const userPick = userPicks[gameId];

      if (userPick && userPick.team === result.winner) {
        const points = POINTS_PER_ROUND[round] || 0;
        totalScore += points;
        breakdown[round] = (breakdown[round] || 0) + points;
        correctPicks++;
      }
    }

    return { totalScore, breakdown, correctPicks, totalGames };
  }

  // ===== Bracket Form Submission =====

  const form = document.getElementById('bracket-form');
  const msg = document.getElementById('form-message');
  const submitBtn = document.getElementById('submit-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstName = document.getElementById('first-name').value.trim();
      const lastName = document.getElementById('last-name').value.trim();
      const email = document.getElementById('email').value.trim();
      const bracketName = (document.getElementById('bracket-name')?.value || '').trim();

      if (!firstName || !lastName || !email) {
        showMessage('Please fill in all fields.', 'error');
        return;
      }

      // Check bracket deadline
      if (window.BracketEngine.isBracketLocked && window.BracketEngine.isBracketLocked()) {
        showMessage('Brackets are locked! The deadline has passed.', 'error');
        return;
      }

      const picks = window.BracketEngine.getPicks();
      const pickCount = window.BracketEngine.getPickCount();

      if (pickCount < 62) {
        showMessage(`You've only made ${pickCount}/62 picks. Please complete your bracket before submitting.`, 'error');
        return;
      }

      // Get championship score predictions
      const scores = window.BracketEngine.getChampionshipScores
        ? window.BracketEngine.getChampionshipScores()
        : { score1: 0, score2: 0 };

      // Validate championship scores (must predict a winner — no ties)
      if (!scores.score1 || !scores.score2 || scores.score1 === scores.score2) {
        showMessage('Please predict the championship final score (no ties allowed).', 'error');
        return;
      }

      // Get champion from picks (determined by score)
      const champPick = picks['ff-champ'];
      const champion = champPick ? champPick.team : '';

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        const bracketData = {
          first_name: firstName,
          last_name: lastName,
          email,
          bracket_name: bracketName,
          picks,
          champion,
          champ_score1: scores.score1 || 0,
          champ_score2: scores.score2 || 0,
          total_score: 0
        };

        if (isDemo()) {
          console.log('Demo mode - bracket saved locally:', bracketData);
          showMessage('Bracket saved successfully!', 'success');
          window.BracketEngine.showToast('Bracket saved!');
        } else {
          // Use RPC function to save (bypasses PostgREST schema cache issues)
          const rpcBody = {
            p_first_name: firstName,
            p_last_name: lastName,
            p_email: email,
            p_bracket_name: bracketName,
            p_picks: picks,
            p_champion: champion,
            p_champ_score1: scores.score1 || 0,
            p_champ_score2: scores.score2 || 0,
            p_total_score: 0
          };
          const result = await supabaseRequest('rpc/save_bracket', 'POST', rpcBody);
          const action = result && result.action === 'updated' ? 'updated' : 'saved';
          showMessage(`Bracket ${action} successfully!` + (bracketName ? ` (${bracketName})` : ''), 'success');
          window.BracketEngine.showToast(`Bracket ${action}!`);

          // Refresh leaderboard
          loadLeaderboard();
        }
        // Show post-save modal
        showPostSaveModal();

      } catch (err) {
        console.error('Save error:', err);
        showMessage('Error saving bracket. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save My Bracket';
      }
    });
  }

  // ===== Post-Save Modal =====
  function showPostSaveModal() {
    const modal = document.getElementById('post-save-modal');
    if (!modal) return;

    // Update modal message with champion's entrepreneur
    const msgEl = document.getElementById('modal-message');
    if (msgEl && window.BracketEngine) {
      const picks = window.BracketEngine.getPicks();
      const champPick = picks['ff-champ'];
      if (champPick && window.BracketEngine.getEntrepreneurForTeam) {
        const entInfo = window.BracketEngine.getEntrepreneurForTeam(champPick.team);
        if (entInfo) {
          const firstName = entInfo.name.split(' ')[0];
          const flagStr = entInfo.flag ? ' ' + entInfo.flag : '';
          msgEl.innerHTML = 'You\'re helping <strong>' + firstName + flagStr + '</strong> &mdash; would you like to add a boost to them or someone else?';
        }
      }
    }

    modal.style.display = 'flex';

    const close = () => { modal.style.display = 'none'; };

    // Close button
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.onclick = close;

    // Skip button
    const skipBtn = document.getElementById('modal-skip');
    if (skipBtn) skipBtn.onclick = close;

    // Boost button — close modal then scroll
    const boostBtn = document.getElementById('modal-boost-btn');
    if (boostBtn) boostBtn.onclick = () => { close(); };

    // Donate button — close modal then scroll
    const donateBtn = document.getElementById('modal-donate-btn');
    if (donateBtn) donateBtn.onclick = () => { close(); };

    // Click outside to close
    modal.onclick = (e) => { if (e.target === modal) close(); };
  }

  function showMessage(text, type) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'form-message ' + type;
  }

  // ===== Leaderboard =====
  // Full leaderboard is on leaderboard.html (powered by js/leaderboard.js).
  // This stub is kept for the recalculation flow and post-save redirect hint.

  function loadLeaderboard() {
    // No-op on main page — leaderboard is on its own page now
  }

  // ===== Score Recalculation =====
  // Call this when tournament results are updated (admin function)

  async function recalculateAllScores() {
    if (isDemo()) return;

    try {
      // Fetch all results
      const results = await supabaseRequest(TABLE_RESULTS, 'GET', null, '?select=*');
      if (!results || results.length === 0) return;

      // Build results map: gameId -> { winner, winner_seed }
      const resultsMap = {};
      results.forEach(r => {
        resultsMap[r.game_id] = { winner: r.winner, winner_seed: r.winner_seed };
      });

      // Fetch all brackets
      const brackets = await supabaseRequest(TABLE_BRACKETS, 'GET', null,
        '?select=id,picks');

      if (!brackets) return;

      // Recalculate each bracket's score
      for (const bracket of brackets) {
        const { totalScore } = calculateScore(bracket.picks || {}, resultsMap);
        await supabaseRequest(TABLE_BRACKETS, 'PATCH',
          { total_score: totalScore },
          `?id=eq.${bracket.id}`
        );
      }

      // Refresh leaderboard
      loadLeaderboard();
    } catch (err) {
      console.error('Recalculation error:', err);
    }
  }

  // ===== Entrepreneur Vote Tracking =====

  async function loadEntrepreneurTotals() {
    if (isDemo()) return {};

    try {
      const data = await supabaseRequest(VIEW_ENT_TOTALS, 'GET', null, '?select=*');
      if (!data) return {};

      // Build map: { entId: { totalRaised, voteCount } }
      const totals = {};
      data.forEach(row => {
        totals[row.entrepreneur_id] = {
          totalRaised: parseFloat(row.total_raised) || 0,
          voteCount: parseInt(row.vote_count) || 0,
          week: row.week
        };
      });
      return totals;
    } catch (e) {
      return {};
    }
  }

  async function submitEntrepreneurVote(entId, entName, amount, donorInfo, stripeSessionId) {
    if (isDemo()) {
      console.log('Demo entrepreneur vote:', { entId, entName, amount });
      return { success: true };
    }

    return supabaseRequest(TABLE_VOTES, 'POST', {
      entrepreneur_id: entId,
      entrepreneur_name: entName,
      donor_first_name: donorInfo?.firstName || null,
      donor_last_name: donorInfo?.lastName || null,
      donor_email: donorInfo?.email || null,
      amount: amount || 5,
      stripe_session_id: stripeSessionId || null,
      week: 1 // Update this as weeks progress
    });
  }

  // ===== Load Existing Bracket =====

  function setupLoadBracket() {
    const toggleBtn = document.getElementById('load-bracket-toggle');
    const formDiv = document.getElementById('load-bracket-form');
    const loadBtn = document.getElementById('load-bracket-btn');
    const statusEl = document.getElementById('load-status');

    if (!toggleBtn || !formDiv || !loadBtn) return;

    toggleBtn.addEventListener('click', () => {
      formDiv.style.display = formDiv.style.display === 'none' ? 'flex' : 'none';
    });

    loadBtn.addEventListener('click', async () => {
      const email = document.getElementById('load-email').value.trim();
      if (!email) {
        statusEl.textContent = 'Please enter your email.';
        statusEl.className = 'load-status error';
        return;
      }

      loadBtn.disabled = true;
      loadBtn.textContent = 'Loading...';
      statusEl.textContent = '';

      // Remove any previous bracket picker
      const oldPicker = document.getElementById('bracket-picker');
      if (oldPicker) oldPicker.remove();

      try {
        if (isDemo()) {
          statusEl.textContent = 'No saved bracket found for this email.';
          statusEl.className = 'load-status error';
          return;
        }

        const data = await supabaseRequest(TABLE_BRACKETS, 'GET', null,
          `?email=eq.${encodeURIComponent(email)}&select=*&order=created_at.asc`);

        if (!data || data.length === 0) {
          statusEl.textContent = 'No bracket found for this email.';
          statusEl.className = 'load-status error';
          return;
        }

        if (data.length === 1) {
          // Only one bracket — load it directly
          loadBracketData(data[0]);
        } else {
          // Multiple brackets — show picker
          showBracketPicker(data, formDiv);
        }

      } catch (err) {
        console.error('Load bracket error:', err);
        statusEl.textContent = 'Error loading bracket. Please try again.';
        statusEl.className = 'load-status error';
      } finally {
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load My Bracket';
      }
    });

    function loadBracketData(bracket) {
      // Load picks into bracket UI
      if (bracket.picks && window.BracketEngine && window.BracketEngine.loadPicks) {
        window.BracketEngine.loadPicks(bracket.picks);
      }

      // Load championship scores
      if (window.BracketEngine && window.BracketEngine.loadChampionshipScores) {
        window.BracketEngine.loadChampionshipScores(
          bracket.champ_score1 || 0,
          bracket.champ_score2 || 0
        );
      }

      // Fill in the form fields
      document.getElementById('first-name').value = bracket.first_name || '';
      document.getElementById('last-name').value = bracket.last_name || '';
      document.getElementById('email').value = bracket.email || '';
      const bracketNameInput = document.getElementById('bracket-name');
      if (bracketNameInput) bracketNameInput.value = bracket.bracket_name || '';

      const statusEl = document.getElementById('load-status');
      const label = bracket.bracket_name ? ` "${bracket.bracket_name}"` : '';
      statusEl.textContent = `Bracket${label} loaded! Edit your picks above, then save.`;
      statusEl.className = 'load-status success';

      window.BracketEngine.showToast('Bracket loaded!');
    }

    function showBracketPicker(brackets, container) {
      const statusEl = document.getElementById('load-status');
      statusEl.textContent = `Found ${brackets.length} brackets. Choose one to load:`;
      statusEl.className = 'load-status success';

      const picker = document.createElement('div');
      picker.id = 'bracket-picker';
      picker.className = 'bracket-picker';

      brackets.forEach((b, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary btn-small bracket-pick-btn';
        const name = b.bracket_name || 'Bracket ' + (i + 1);
        const champ = b.champion ? ` — Champ: ${b.champion}` : '';
        btn.textContent = `${name}${champ}`;
        btn.addEventListener('click', () => {
          loadBracketData(b);
          picker.remove();
        });
        picker.appendChild(btn);
      });

      container.appendChild(picker);
    }
  }

  // ===== Process Return from Stripe =====
  // When user comes back from Stripe with ?donation=success,
  // read pending donation info from localStorage and record in Supabase.

  async function processStripeReturn() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('donation') !== 'success') return;

    const sessionId = params.get('session_id') || '';

    // Clean URL (remove query params without reload)
    try {
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    } catch (e) { /* ignore */ }

    // Read pending donation from localStorage
    let pending = null;
    try {
      const raw = localStorage.getItem('m2a_pending_donation');
      if (raw) pending = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    if (!pending) {
      // No pending info but donation succeeded — show generic success
      console.warn('processStripeReturn: No pending donation data found in localStorage');
      if (window.BracketEngine) window.BracketEngine.showToast('Thank you for your donation!');
      return;
    }

    console.log('processStripeReturn: pending data =', JSON.stringify(pending));

    if (isDemo()) {
      console.log('Demo mode — donation recorded locally:', pending);
      localStorage.removeItem('m2a_pending_donation');
      localStorage.removeItem('m2a_ent_cart');
      if (window.BracketEngine) window.BracketEngine.showToast('Thank you for your donation!');
      return;
    }

    try {
      // Fetch entrepreneurs table to map names → UUIDs
      let entNameToUuid = {};
      try {
        const entRows = await supabaseRequest(TABLE_ENTREPRENEURS, 'GET', null, '?select=id,name&is_active=eq.true');
        if (entRows) {
          entRows.forEach(function(e) { entNameToUuid[e.name.toLowerCase()] = e.id; });
        }
      } catch (e) { console.warn('Could not fetch entrepreneurs table:', e); }

      const contributorName = ((pending.firstName || '') + ' ' + (pending.lastName || '')).trim();
      const contributorEmail = pending.email || '';
      const contributorClub = pending.rotaryClub || '';

      if (pending.type === 'boost') {
        // Record the general donation amount (if any) as a contribution with NULL entrepreneur
        const generalDonation = pending.donationAmount || 0;
        if (generalDonation > 0) {
          await supabaseRequest(TABLE_CONTRIBUTIONS, 'POST', {
            entrepreneur_id: null,
            contributor_email: contributorEmail,
            contributor_name: contributorName,
            amount: generalDonation,
            rotary_club: contributorClub,
            stripe_payment_id: sessionId || '',
            status: 'completed'
          });
        }

        // Record each entrepreneur boost in the contributions table
        if (pending.cart) {
          for (const [entId, amount] of Object.entries(pending.cart)) {
            if (!amount || amount <= 0) continue;

            const entName = (pending.entNames && pending.entNames[entId]) || entId;
            const entUuid = entNameToUuid[entName.toLowerCase()] || null;

            await supabaseRequest(TABLE_CONTRIBUTIONS, 'POST', {
              entrepreneur_id: entUuid,
              contributor_email: contributorEmail,
              contributor_name: contributorName,
              amount: amount,
              rotary_club: contributorClub,
              stripe_payment_id: sessionId || '',
              status: 'completed'
            });
          }
        }

        // Update bracket donation_amount if we know the email
        const totalAmount = pending.amount || 0;
        if (contributorEmail && totalAmount > 0) {
          try {
            const existing = await supabaseRequest(TABLE_BRACKETS, 'GET', null,
              '?email=eq.' + encodeURIComponent(contributorEmail) + '&select=id,donation_amount&limit=1');
            if (existing && existing.length > 0) {
              const currentAmt = parseFloat(existing[0].donation_amount) || 0;
              await supabaseRequest(TABLE_BRACKETS, 'PATCH',
                { donation_amount: currentAmt + totalAmount },
                '?id=eq.' + existing[0].id);
            }
          } catch (e) { /* ignore bracket update failure */ }
        }

        if (window.BracketEngine) {
          window.BracketEngine.showToast('Thank you! Your donation has been recorded.');
        }

      } else {
        // General donation — record with NULL entrepreneur_id initially
        const donationAmount = pending.amount || 0;

        await supabaseRequest(TABLE_CONTRIBUTIONS, 'POST', {
          entrepreneur_id: null,
          contributor_email: contributorEmail,
          contributor_name: contributorName,
          amount: donationAmount,
          rotary_club: contributorClub,
          stripe_payment_id: sessionId || '',
          status: 'completed'
        });

        // Also update the bracket's donation_amount if we know the email
        if (contributorEmail) {
          try {
            const existing = await supabaseRequest(TABLE_BRACKETS, 'GET', null,
              '?email=eq.' + encodeURIComponent(contributorEmail) + '&select=id,donation_amount&limit=1');
            if (existing && existing.length > 0) {
              const currentAmt = parseFloat(existing[0].donation_amount) || 0;
              await supabaseRequest(TABLE_BRACKETS, 'PATCH',
                { donation_amount: currentAmt + donationAmount },
                '?id=eq.' + existing[0].id);
            }
          } catch (e) { /* ignore bracket update failure */ }
        }

        // Show thank-you + ask if they want to boost an entrepreneur
        showDonationBoostModal(donationAmount, entNameToUuid, contributorEmail, contributorName, sessionId);
      }
    } catch (err) {
      console.error('Error recording donation:', err);
      if (window.BracketEngine) {
        window.BracketEngine.showToast('Thank you for your donation!');
      }
    } finally {
      // Clean up localStorage
      localStorage.removeItem('m2a_pending_donation');
      localStorage.removeItem('m2a_ent_cart');
    }
  }

  // ===== Post-Donation Boost Modal =====
  // After a general donation, ask if they'd like to attribute it to an entrepreneur.
  function showDonationBoostModal(amount, entNameToUuid, email, name, sessionId) {
    // Build entrepreneur list from the UUID map we already fetched
    const entrepreneurs = Object.entries(entNameToUuid).map(([nameKey, uuid]) => ({
      name: nameKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      uuid: uuid
    }));

    if (entrepreneurs.length === 0) {
      // No entrepreneurs available — just show a thank you
      if (window.BracketEngine) {
        window.BracketEngine.showToast('Thank you for your donation of $' + amount + '!');
      }
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'donation-boost-modal';
    overlay.style.display = 'flex';

    const entListHtml = entrepreneurs.map(e =>
      '<button class="donation-boost-ent-btn" data-uuid="' + e.uuid + '" data-name="' + e.name + '">' +
        e.name +
      '</button>'
    ).join('');

    overlay.innerHTML =
      '<div class="modal-card donation-boost-modal">' +
        '<button class="modal-close" id="boost-modal-close">&times;</button>' +
        '<div class="modal-icon">&#10084;&#65039;</div>' +
        '<h3>Thank You for Your $' + amount + ' Donation!</h3>' +
        '<p>Would you like your donation to count as a <strong>Boost</strong> for a specific entrepreneur?</p>' +
        '<div class="donation-boost-list">' + entListHtml + '</div>' +
        '<button class="modal-skip" id="boost-modal-skip">No thanks, keep it as a general donation</button>' +
      '</div>';

    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); };

    overlay.querySelector('#boost-modal-close').addEventListener('click', close);
    overlay.querySelector('#boost-modal-skip').addEventListener('click', () => {
      close();
      if (window.BracketEngine) {
        window.BracketEngine.showToast('Thank you for your donation of $' + amount + '!');
      }
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close();
        if (window.BracketEngine) {
          window.BracketEngine.showToast('Thank you for your donation of $' + amount + '!');
        }
      }
    });

    // Handle entrepreneur selection
    overlay.querySelectorAll('.donation-boost-ent-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const entUuid = btn.dataset.uuid;
        const entName = btn.dataset.name;

        // Highlight selected button
        overlay.querySelectorAll('.donation-boost-ent-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        btn.textContent = 'Saving...';

        try {
          // Record an additional contribution attributed to this entrepreneur
          await supabaseRequest(TABLE_CONTRIBUTIONS, 'POST', {
            entrepreneur_id: entUuid,
            contributor_email: email,
            contributor_name: name,
            amount: amount,
            rotary_club: '',
            stripe_payment_id: (sessionId || '') + '-boost-attribution',
            status: 'completed'
          });

          close();
          if (window.BracketEngine) {
            window.BracketEngine.showToast('Your $' + amount + ' donation is now boosting ' + entName + '!');
          }
        } catch (err) {
          console.error('Error attributing boost:', err);
          btn.textContent = entName;
          btn.classList.remove('selected');
          if (window.BracketEngine) {
            window.BracketEngine.showToast('Could not attribute boost. Your donation was still recorded!');
          }
        }
      });
    });
  }

  // ===== Public API =====

  window.SupabaseClient = {
    // Scoring
    calculateScore,
    POINTS_PER_ROUND,

    // Leaderboard
    loadLeaderboard,
    recalculateAllScores,

    // Entrepreneur votes
    submitEntrepreneurVote,
    loadEntrepreneurTotals,

    // Utilities
    isDemo
  };

  // ===== Initialize =====
  function init() {
    loadLeaderboard();
    setupLoadBracket();
    processStripeReturn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
