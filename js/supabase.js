// ===== Supabase Integration =====
// Saves bracket picks, calculates scores, powers the leaderboard,
// and tracks entrepreneur donation votes.
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values.

(function () {
  'use strict';

  // TODO: Replace with your new Supabase project credentials
  const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

  const TABLE_BRACKETS = '0013_m2a_bracket';
  const TABLE_RESULTS = '0013_m2a_results';
  const TABLE_VOTES = '0013_m2a_entrepreneur_votes';
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
    3: 20,    // Sweet 16
    4: 40,    // Elite 8
    5: 80,    // Final Four
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

      if (!firstName || !lastName || !email) {
        showMessage('Please fill in all fields.', 'error');
        return;
      }

      const picks = window.BracketEngine.getPicks();
      const pickCount = window.BracketEngine.getPickCount();

      if (pickCount < 63) {
        showMessage(`You've only made ${pickCount}/63 picks. Please complete your bracket before submitting.`, 'error');
        return;
      }

      // Get championship score predictions
      const scores = window.BracketEngine.getChampionshipScores
        ? window.BracketEngine.getChampionshipScores()
        : { score1: 0, score2: 0 };

      // Get champion from picks
      const champPick = picks['ff-champ'];
      const champion = champPick ? champPick.team : '';

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        const bracketData = {
          first_name: firstName,
          last_name: lastName,
          email,
          picks,
          champion,
          champ_score1: scores.score1 || 0,
          champ_score2: scores.score2 || 0,
          total_score: 0
        };

        if (isDemo()) {
          console.log('Demo mode - bracket saved locally:', bracketData);
          showMessage('Bracket saved locally! (Connect Supabase to save to database)', 'success');
          window.BracketEngine.showToast('Bracket saved!');
        } else {
          // Check if user already submitted (by email)
          const existing = await supabaseRequest(TABLE_BRACKETS, 'GET', null,
            `?email=eq.${encodeURIComponent(email)}&select=id&limit=1`);

          if (existing && existing.length > 0) {
            // Update existing bracket
            await supabaseRequest(TABLE_BRACKETS, 'PATCH', bracketData,
              `?id=eq.${existing[0].id}`);
            showMessage('Bracket updated successfully!', 'success');
            window.BracketEngine.showToast('Bracket updated!');
          } else {
            // Insert new bracket
            await supabaseRequest(TABLE_BRACKETS, 'POST', bracketData);
            showMessage('Bracket saved successfully!', 'success');
            window.BracketEngine.showToast('Bracket saved!');
          }

          // Refresh leaderboard
          loadLeaderboard();
        }
      } catch (err) {
        console.error('Save error:', err);
        showMessage('Error saving bracket. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save My Bracket';
      }
    });
  }

  function showMessage(text, type) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'form-message ' + type;
  }

  // ===== Leaderboard =====

  async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    const noData = document.getElementById('leaderboard-empty');
    if (!tbody) return;

    if (isDemo()) {
      // Show demo leaderboard
      tbody.innerHTML = '';
      if (noData) {
        noData.style.display = 'block';
        noData.textContent = 'Connect Supabase to see the live leaderboard.';
      }
      return;
    }

    try {
      const data = await supabaseRequest(VIEW_LEADERBOARD, 'GET', null,
        '?select=*&limit=50');

      if (!data || data.length === 0) {
        tbody.innerHTML = '';
        if (noData) {
          noData.style.display = 'block';
          noData.textContent = 'No brackets submitted yet. Be the first!';
        }
        return;
      }

      if (noData) noData.style.display = 'none';

      tbody.innerHTML = data.map((row, idx) => {
        const rank = row.rank || (idx + 1);
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        const tiebreaker = (row.champ_score1 || 0) + (row.champ_score2 || 0);
        return `
          <tr class="${rank <= 3 ? 'leaderboard-top' : ''}">
            <td class="lb-rank">${medal}</td>
            <td class="lb-name">${row.first_name} ${row.last_name.charAt(0)}.</td>
            <td class="lb-champion">${row.champion || '—'}</td>
            <td class="lb-score">${row.total_score || 0}</td>
            <td class="lb-tiebreaker">${tiebreaker || '—'}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Leaderboard error:', err);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;">Unable to load leaderboard</td></tr>';
    }
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
  // Load leaderboard on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLeaderboard);
  } else {
    loadLeaderboard();
  }
})();
