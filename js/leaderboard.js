// ===== Leaderboard Page =====
// Standalone script for the dedicated leaderboard page.
// Fetches bracket data from Supabase and renders the leaderboard table.

(function () {
  'use strict';

  const SUPABASE_URL = 'https://ryxhnmkmsevedgjiduxn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eGhubWttc2V2ZWRnamlkdXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MTAyOTMsImV4cCI6MjA2MDQ4NjI5M30.8o_OVZ9dogEl9eGhSVJDv0fGvPxICEzPctIdnEiN2Cc';

  const VIEW_LEADERBOARD = '0013_m2a_leaderboard';

  function supabaseRequest(table, method, body, query) {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    return fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
      .then(res => {
        if (!res.ok) return res.text().then(t => { throw new Error(t); });
        const ct = res.headers.get('content-type');
        return (ct && ct.includes('application/json')) ? res.json() : null;
      });
  }

  async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    const noData = document.getElementById('leaderboard-empty');
    if (!tbody) return;

    try {
      const data = await supabaseRequest(VIEW_LEADERBOARD, 'GET', null,
        '?select=*&limit=100');

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
        const medal = rank === 1 ? '\u{1F947}' : rank === 2 ? '\u{1F948}' : rank === 3 ? '\u{1F949}' : rank;
        const tiebreaker = (row.champ_score1 || 0) + (row.champ_score2 || 0);
        const bracketName = row.bracket_name || '';
        return `
          <tr class="${rank <= 3 ? 'leaderboard-top' : ''}">
            <td class="lb-rank">${medal}</td>
            <td class="lb-name">${row.first_name} ${row.last_name.charAt(0)}.</td>
            <td class="lb-bracket-name">${bracketName || '—'}</td>
            <td class="lb-champion">${row.champion || '—'}</td>
            <td class="lb-score">${row.total_score || 0}</td>
            <td class="lb-tiebreaker">${tiebreaker || '—'}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Leaderboard error:', err);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;">Unable to load leaderboard</td></tr>';
    }
  }

  // Mobile nav toggle
  function setupNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
    }
  }

  // Auto-refresh every 60 seconds
  function startAutoRefresh() {
    setInterval(loadLeaderboard, 60000);
  }

  function init() {
    setupNavToggle();
    loadLeaderboard();
    startAutoRefresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
