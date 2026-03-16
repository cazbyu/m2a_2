// ===== Admin Dashboard =====
// Manages tournament results entry, score recalculation, and leaderboard.

(function () {
  'use strict';

  const SUPABASE_URL = 'https://ryxhnmkmsevedgjiduxn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eGhubWttc2V2ZWRnamlkdXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTAyOTMsImV4cCI6MjA2MDQ4NjI5M30.8o_OVZ9dogEl9eGhSVJDv0fGvPxICEzPctIdnEiN2Cc';

  const TABLE_BRACKETS = '0013_m2a_bracket';
  const TABLE_RESULTS = '0013_m2a_results';
  const VIEW_LEADERBOARD = '0013_m2a_leaderboard';

  // Admin credential hash (SHA-256)
  const ADMIN_EMAIL = 'cazbyu@gmail.com';
  const ADMIN_HASH = 'fec501d608928f3b03f26155b5bff5da8ed7167b2b2c01d13d5d6138325c4404';

  // Scoring points per round
  const POINTS_PER_ROUND = { 1: 5, 2: 10, 3: 20, 4: 40, 5: 80, 6: 160 };

  // Current saved results (fetched from Supabase)
  let savedResults = {};

  // ===== REST Client =====

  function api(table, method, body, query) {
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
      const ct = res.headers.get('content-type');
      return (ct && ct.includes('application/json')) ? res.json() : null;
    });
  }

  // ===== Authentication =====

  async function hashString(str) {
    const data = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function attemptLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    if (!email || !password) {
      errorEl.style.display = 'block';
      errorEl.textContent = 'Please enter email and password.';
      return;
    }

    const pwHash = await hashString(password);

    if (email === ADMIN_EMAIL && pwHash === ADMIN_HASH) {
      sessionStorage.setItem('m2a_admin', 'true');
      showDashboard();
    } else {
      errorEl.style.display = 'block';
      errorEl.textContent = 'Invalid email or password.';
    }
  }

  function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    initDashboard();
  }

  function logout() {
    sessionStorage.removeItem('m2a_admin');
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('login-password').value = '';
  }

  // ===== Dashboard Init =====

  async function initDashboard() {
    await fetchSavedResults();
    renderGames();
    loadAdminLeaderboard();
    loadAllBrackets();
  }

  // ===== Fetch Saved Results =====

  async function fetchSavedResults() {
    try {
      const data = await api(TABLE_RESULTS, 'GET', null, '?select=*');
      savedResults = {};
      if (data) {
        data.forEach(r => {
          savedResults[r.game_id] = {
            id: r.id,
            winner: r.winner,
            winner_seed: r.winner_seed,
            score_team1: r.score_team1,
            score_team2: r.score_team2
          };
        });
      }
    } catch (e) {
      console.error('Failed to fetch results:', e);
    }
  }

  // ===== Game ID & Matchup Helpers =====

  function getRegionIndex(regionKey) {
    const map = { east: 0, midwest: 1, south: 2, west: 3 };
    return map[regionKey] ?? -1;
  }

  // Get R1 matchups from TOURNAMENT data
  function getR1Games(regionKey) {
    const idx = getRegionIndex(regionKey);
    if (idx < 0) return [];
    const teams = TOURNAMENT.regions[idx].teams;
    const games = [];
    // Teams are in bracket order: pairs of 2 → 8 games
    for (let i = 0; i < teams.length; i += 2) {
      const gameNum = Math.floor(i / 2) + 1;
      const gameId = `${regionKey}-r1-g${gameNum}`;
      games.push({
        gameId,
        team1: { name: teams[i].name, seed: teams[i].seed },
        team2: { name: teams[i + 1].name, seed: teams[i + 1].seed }
      });
    }
    return games;
  }

  // For rounds 2+, derive matchups from previous round results
  function getLaterRoundGames(regionKey, round) {
    const prevRound = round - 1;
    const prevGamesCount = Math.pow(2, 4 - prevRound); // R1=8, R2=4, R3=2, R4=1
    const games = [];
    const gamesInRound = prevGamesCount / 2;

    for (let g = 1; g <= gamesInRound; g++) {
      const gameId = `${regionKey}-r${round}-g${g}`;
      // Previous round's game pairs
      const prevGame1Id = `${regionKey}-r${prevRound}-g${g * 2 - 1}`;
      const prevGame2Id = `${regionKey}-r${prevRound}-g${g * 2}`;

      const prev1 = savedResults[prevGame1Id];
      const prev2 = savedResults[prevGame2Id];

      games.push({
        gameId,
        team1: prev1
          ? { name: prev1.winner, seed: prev1.winner_seed }
          : { name: 'TBD', seed: null },
        team2: prev2
          ? { name: prev2.winner, seed: prev2.winner_seed }
          : { name: 'TBD', seed: null }
      });
    }
    return games;
  }

  // Final Four games
  function getFinalFourGames() {
    const games = [];

    // Semi 1: East champion vs Midwest champion
    const eastChamp = savedResults['east-r4-g1'];
    const midwestChamp = savedResults['midwest-r4-g1'];
    games.push({
      gameId: 'ff-semi1',
      team1: eastChamp
        ? { name: eastChamp.winner, seed: eastChamp.winner_seed }
        : { name: 'East Champion', seed: null },
      team2: midwestChamp
        ? { name: midwestChamp.winner, seed: midwestChamp.winner_seed }
        : { name: 'Midwest Champion', seed: null }
    });

    // Semi 2: South champion vs West champion
    const southChamp = savedResults['south-r4-g1'];
    const westChamp = savedResults['west-r4-g1'];
    games.push({
      gameId: 'ff-semi2',
      team1: southChamp
        ? { name: southChamp.winner, seed: southChamp.winner_seed }
        : { name: 'South Champion', seed: null },
      team2: westChamp
        ? { name: westChamp.winner, seed: westChamp.winner_seed }
        : { name: 'West Champion', seed: null }
    });

    // Championship
    const semi1Winner = savedResults['ff-semi1'];
    const semi2Winner = savedResults['ff-semi2'];
    games.push({
      gameId: 'ff-champ',
      team1: semi1Winner
        ? { name: semi1Winner.winner, seed: semi1Winner.winner_seed }
        : { name: 'Semifinal 1 Winner', seed: null },
      team2: semi2Winner
        ? { name: semi2Winner.winner, seed: semi2Winner.winner_seed }
        : { name: 'Semifinal 2 Winner', seed: null }
    });

    return games;
  }

  // ===== Render Games =====

  function renderGames() {
    const region = document.getElementById('filter-region').value;
    const round = parseInt(document.getElementById('filter-round').value);
    const container = document.getElementById('games-list');

    let games = [];

    if (region === 'ff') {
      games = getFinalFourGames();
    } else if (round === 1) {
      games = getR1Games(region);
    } else {
      games = getLaterRoundGames(region, round);
    }

    if (games.length === 0) {
      container.innerHTML = '<p style="color:#666;">No games for this selection.</p>';
      return;
    }

    container.innerHTML = games.map(g => {
      const existing = savedResults[g.gameId];
      const hasResult = !!existing;
      const winner = existing ? existing.winner : '';
      const s1 = existing ? (existing.score_team1 ?? '') : '';
      const s2 = existing ? (existing.score_team2 ?? '') : '';

      const t1Winner = winner === g.team1.name ? 'winner' : '';
      const t2Winner = winner === g.team2.name ? 'winner' : '';

      const seedLabel1 = g.team1.seed ? `<span class="seed">(${g.team1.seed})</span> ` : '';
      const seedLabel2 = g.team2.seed ? `<span class="seed">(${g.team2.seed})</span> ` : '';

      return `
        <div class="game-card ${hasResult ? 'has-result' : ''}" data-game-id="${g.gameId}">
          <div class="game-id">${g.gameId}</div>
          <div class="game-matchup">
            <button class="team-btn ${t1Winner}" data-team="${g.team1.name}" data-seed="${g.team1.seed || ''}">${seedLabel1}${g.team1.name}</button>
            <span class="vs-label">vs</span>
            <button class="team-btn ${t2Winner}" data-team="${g.team2.name}" data-seed="${g.team2.seed || ''}">${seedLabel2}${g.team2.name}</button>
          </div>
          <div class="game-scores">
            <input type="number" class="score1" value="${s1}" placeholder="—" min="0" max="300">
            <span>&ndash;</span>
            <input type="number" class="score2" value="${s2}" placeholder="—" min="0" max="300">
          </div>
          <button class="game-save" data-game-id="${g.gameId}">Save</button>
          ${hasResult ? '<span class="game-status">&#10003; Saved</span>' : ''}
        </div>
      `;
    }).join('');

    // Attach click handlers
    container.querySelectorAll('.team-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.game-card');
        card.querySelectorAll('.team-btn').forEach(b => b.classList.remove('winner'));
        btn.classList.add('winner');
      });
    });

    container.querySelectorAll('.game-save').forEach(btn => {
      btn.addEventListener('click', () => saveGameResult(btn.dataset.gameId));
    });
  }

  // ===== Save Game Result =====

  async function saveGameResult(gameId) {
    const card = document.querySelector(`.game-card[data-game-id="${gameId}"]`);
    if (!card) return;

    const winnerBtn = card.querySelector('.team-btn.winner');
    if (!winnerBtn) {
      showStatus('Select a winner first!', 'error');
      return;
    }

    const winner = winnerBtn.dataset.team;
    const winnerSeed = winnerBtn.dataset.seed ? parseInt(winnerBtn.dataset.seed) : null;
    const score1 = card.querySelector('.score1').value;
    const score2 = card.querySelector('.score2').value;

    const resultData = {
      game_id: gameId,
      winner,
      winner_seed: winnerSeed,
      score_team1: score1 ? parseInt(score1) : null,
      score_team2: score2 ? parseInt(score2) : null,
      updated_at: new Date().toISOString()
    };

    const saveBtn = card.querySelector('.game-save');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
      const existing = savedResults[gameId];
      if (existing) {
        // Update
        await api(TABLE_RESULTS, 'PATCH', resultData, `?game_id=eq.${encodeURIComponent(gameId)}`);
      } else {
        // Insert
        await api(TABLE_RESULTS, 'POST', resultData);
      }

      savedResults[gameId] = {
        winner,
        winner_seed: winnerSeed,
        score_team1: resultData.score_team1,
        score_team2: resultData.score_team2
      };

      saveBtn.textContent = 'Saved!';
      saveBtn.classList.add('saved');
      card.classList.add('has-result');

      // Add or update status indicator
      let statusEl = card.querySelector('.game-status');
      if (!statusEl) {
        statusEl = document.createElement('span');
        statusEl.className = 'game-status';
        card.appendChild(statusEl);
      }
      statusEl.innerHTML = '&#10003; Saved';

      setTimeout(() => {
        saveBtn.textContent = 'Save';
        saveBtn.classList.remove('saved');
        saveBtn.disabled = false;
      }, 2000);

    } catch (err) {
      console.error('Save error:', err);
      saveBtn.textContent = 'Error!';
      saveBtn.disabled = false;
      showStatus('Error saving result: ' + err.message, 'error');
    }
  }

  // ===== Save All Visible Results =====

  async function saveAllVisible() {
    const cards = document.querySelectorAll('.game-card');
    let saved = 0;
    let errors = 0;

    for (const card of cards) {
      const winnerBtn = card.querySelector('.team-btn.winner');
      if (!winnerBtn) continue; // Skip games without a winner selected

      const gameId = card.dataset.gameId;
      try {
        await saveGameResult(gameId);
        saved++;
      } catch (e) {
        errors++;
      }
    }

    if (errors > 0) {
      showStatus(`Saved ${saved} results with ${errors} errors.`, 'error');
    } else if (saved > 0) {
      showStatus(`Saved ${saved} game results successfully!`, 'success');
    } else {
      showStatus('No winners selected to save.', 'error');
    }
  }

  // ===== Recalculate All Scores =====

  function getRoundFromGameId(gameId) {
    if (gameId === 'ff-champ') return 6;
    if (gameId.startsWith('ff-semi')) return 5;
    const match = gameId.match(/r(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async function recalculateAllScores() {
    const btn = document.getElementById('recalc-btn');
    btn.disabled = true;
    btn.textContent = 'Recalculating...';

    try {
      // Refresh results
      await fetchSavedResults();

      if (Object.keys(savedResults).length === 0) {
        showStatus('No results to score against. Enter some game results first.', 'error');
        btn.disabled = false;
        btn.textContent = '⚡ Recalculate All Scores';
        return;
      }

      // Fetch all brackets
      const brackets = await api(TABLE_BRACKETS, 'GET', null, '?select=id,picks');
      if (!brackets || brackets.length === 0) {
        showStatus('No brackets submitted yet.', 'error');
        btn.disabled = false;
        btn.textContent = '⚡ Recalculate All Scores';
        return;
      }

      let updated = 0;
      for (const bracket of brackets) {
        const picks = bracket.picks || {};
        let totalScore = 0;

        for (const [gameId, result] of Object.entries(savedResults)) {
          const round = getRoundFromGameId(gameId);
          const userPick = picks[gameId];
          if (userPick && userPick.team === result.winner) {
            totalScore += POINTS_PER_ROUND[round] || 0;
          }
        }

        await api(TABLE_BRACKETS, 'PATCH', { total_score: totalScore }, `?id=eq.${bracket.id}`);
        updated++;
      }

      showStatus(`Recalculated scores for ${updated} brackets!`, 'success');
      loadAdminLeaderboard();
    } catch (err) {
      console.error('Recalc error:', err);
      showStatus('Error recalculating: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '⚡ Recalculate All Scores';
    }
  }

  // ===== Admin Leaderboard =====

  async function loadAdminLeaderboard() {
    const tbody = document.getElementById('lb-body');
    const empty = document.getElementById('lb-empty');
    if (!tbody) return;

    try {
      const data = await api(VIEW_LEADERBOARD, 'GET', null, '?select=*&limit=100');

      if (!data || data.length === 0) {
        tbody.innerHTML = '';
        empty.textContent = 'No brackets submitted yet.';
        empty.style.display = 'block';
        return;
      }

      empty.style.display = 'none';
      tbody.innerHTML = data.map((row, idx) => {
        const rank = row.rank || (idx + 1);
        const tiebreaker = (row.champ_score1 || 0) + (row.champ_score2 || 0);
        return `
          <tr>
            <td>${rank}</td>
            <td>${row.first_name} ${row.last_name}</td>
            <td>${row.email || '—'}</td>
            <td>${row.champion || '—'}</td>
            <td><strong>${row.total_score || 0}</strong></td>
            <td>${tiebreaker || '—'}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Leaderboard error:', err);
      tbody.innerHTML = '';
      empty.textContent = 'Error loading leaderboard.';
      empty.style.display = 'block';
    }
  }

  // ===== All Brackets =====

  async function loadAllBrackets() {
    const tbody = document.getElementById('brackets-body');
    const empty = document.getElementById('brackets-empty');
    if (!tbody) return;

    try {
      const data = await api(TABLE_BRACKETS, 'GET', null,
        '?select=first_name,last_name,email,champion,total_score,created_at&order=created_at.desc&limit=200');

      if (!data || data.length === 0) {
        tbody.innerHTML = '';
        empty.textContent = 'No brackets submitted yet.';
        empty.style.display = 'block';
        return;
      }

      empty.style.display = 'none';
      tbody.innerHTML = data.map(row => {
        const date = row.created_at ? new Date(row.created_at).toLocaleDateString() : '—';
        return `
          <tr>
            <td>${row.first_name} ${row.last_name}</td>
            <td>${row.email}</td>
            <td>${row.champion || '—'}</td>
            <td><strong>${row.total_score || 0}</strong></td>
            <td>${date}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Brackets error:', err);
      tbody.innerHTML = '';
      empty.textContent = 'Error loading brackets.';
      empty.style.display = 'block';
    }
  }

  // ===== Status Message =====

  function showStatus(text, type) {
    const el = document.getElementById('results-status');
    if (!el) return;
    el.textContent = text;
    el.className = 'status-msg ' + type;
    setTimeout(() => { el.className = 'status-msg'; }, 5000);
  }

  // ===== Event Listeners =====

  document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in this session
    if (sessionStorage.getItem('m2a_admin') === 'true') {
      showDashboard();
    }

    // Login
    document.getElementById('login-btn').addEventListener('click', attemptLogin);
    document.getElementById('login-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Filters
    document.getElementById('filter-region').addEventListener('change', () => {
      updateRoundOptions();
      renderGames();
    });
    document.getElementById('filter-round').addEventListener('change', renderGames);

    // Tabs
    document.querySelectorAll('.dash-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
      });
    });

    // Actions
    document.getElementById('recalc-btn').addEventListener('click', recalculateAllScores);
    document.getElementById('save-all-btn').addEventListener('click', saveAllVisible);
    document.getElementById('refresh-lb-btn').addEventListener('click', loadAdminLeaderboard);
    document.getElementById('refresh-brackets-btn').addEventListener('click', loadAllBrackets);
  });

  // Update round dropdown based on region selection
  function updateRoundOptions() {
    const region = document.getElementById('filter-region').value;
    const roundSelect = document.getElementById('filter-round');

    if (region === 'ff') {
      roundSelect.innerHTML = `
        <option value="5">Final Four &mdash; 80 pts</option>
        <option value="6">Championship &mdash; 160 pts</option>
      `;
      roundSelect.style.display = 'none'; // FF games shown all at once
    } else {
      roundSelect.innerHTML = `
        <option value="1">Round 1 (R64) &mdash; 5 pts</option>
        <option value="2">Round 2 (R32) &mdash; 10 pts</option>
        <option value="3">Sweet 16 &mdash; 20 pts</option>
        <option value="4">Elite 8 &mdash; 40 pts</option>
      `;
      roundSelect.style.display = '';
    }
  }

})();
