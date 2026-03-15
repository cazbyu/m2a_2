// ===== Bracket Engine =====
// Renders the interactive NCAA tournament bracket and handles click-to-advance logic.

(function () {
  'use strict';

  // Game ID scheme: "{region}-r{round}-g{game}" e.g. "east-r1-g1"
  // Final Four: "ff-semi1", "ff-semi2", "ff-champ"

  const state = {
    picks: {},   // gameId -> { team, seed }
    pickCount: 0,
    totalPicks: 63 // 32+16+8+4+2+1 = 63
  };

  // ===== Initialization =====

  function init() {
    renderAllRegions();
    setupRegionTabs();
    setupNavToggle();
    setupDonateButtons();
    loadFromLocalStorage();
    updateProgress();
  }

  // ===== Render Regions =====

  function renderAllRegions() {
    TOURNAMENT.regions.forEach((region, idx) => {
      const regionKey = region.name.toLowerCase();
      const regionEl = document.querySelector(`#region-${regionKey} .rounds`);
      if (!regionEl) return;
      renderRegion(regionEl, region, regionKey, idx < 2 ? 'left' : 'right');
    });

    // Setup click delegation on the bracket container
    document.getElementById('bracket-container').addEventListener('click', handleTeamClick);
  }

  function renderRegion(container, region, regionKey, side) {
    // Teams come in pairs: [0,1], [2,3], [4,5], ... (8 matchups)
    const teams = region.teams;
    const rounds = 4; // R64, R32, Sweet16, Elite8

    for (let r = 0; r < rounds; r++) {
      const roundDiv = document.createElement('div');
      roundDiv.className = `round round-${r + 1}`;
      roundDiv.dataset.round = r + 1;

      if (r === 0) {
        // Round 1: 8 matchups from seed data
        for (let g = 0; g < 8; g++) {
          const t1 = teams[g * 2];
          const t2 = teams[g * 2 + 1];
          const gameId = `${regionKey}-r1-g${g + 1}`;
          roundDiv.appendChild(createMatchup(gameId, t1, t2));
        }
      } else {
        // Later rounds: empty slots
        const gamesInRound = 8 / Math.pow(2, r);
        for (let g = 0; g < gamesInRound; g++) {
          const gameId = `${regionKey}-r${r + 1}-g${g + 1}`;
          roundDiv.appendChild(createMatchup(gameId, null, null));
        }
      }

      container.appendChild(roundDiv);
    }
  }

  function createMatchup(gameId, team1, team2) {
    const matchup = document.createElement('div');
    matchup.className = 'matchup';
    matchup.dataset.game = gameId;

    matchup.appendChild(createTeamSlot(gameId, 'top', team1));
    matchup.appendChild(createTeamSlot(gameId, 'bot', team2));

    return matchup;
  }

  function createTeamSlot(gameId, position, team) {
    const slot = document.createElement('div');
    slot.className = 'team-slot' + (team ? ' has-team' : ' empty');
    slot.dataset.slot = `${gameId}-${position}`;

    const seedSpan = document.createElement('span');
    seedSpan.className = 'seed';
    seedSpan.textContent = team ? team.seed : '';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = team ? team.name : '';

    slot.appendChild(seedSpan);
    slot.appendChild(nameSpan);

    if (team) {
      slot.dataset.team = team.name;
      slot.dataset.seed = team.seed;
    }

    return slot;
  }

  // ===== Click Handling =====

  function handleTeamClick(e) {
    const slot = e.target.closest('.team-slot');
    if (!slot || slot.classList.contains('empty') || !slot.dataset.team) return;

    const slotId = slot.dataset.slot; // e.g. "east-r1-g1-top"
    const parts = slotId.split('-');
    const team = slot.dataset.team;
    const seed = parseInt(slot.dataset.seed);

    // Determine the game this slot belongs to
    const matchup = slot.closest('.matchup');
    const gameId = matchup.dataset.game;

    // Mark selected in this matchup
    matchup.querySelectorAll('.team-slot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');

    // Store the pick
    const previousPick = state.picks[gameId];
    state.picks[gameId] = { team, seed };

    // If previous pick was different, clear downstream
    if (previousPick && previousPick.team !== team) {
      clearDownstream(gameId, previousPick.team);
    }

    // Advance team to next round
    advanceTeam(gameId, team, seed);

    updateProgress();
    saveToLocalStorage();
  }

  function advanceTeam(gameId, team, seed) {
    const next = getNextGame(gameId);
    if (!next) return;

    const { nextGameId, position } = next;

    // Handle Final Four slots specially
    if (nextGameId.startsWith('ff-')) {
      const slotId = `${nextGameId}-${position}`;
      const slotEl = document.querySelector(`[data-slot="${slotId}"]`);
      if (slotEl) {
        slotEl.dataset.team = team;
        slotEl.dataset.seed = seed;
        slotEl.querySelector('.seed').textContent = seed;
        slotEl.querySelector('.name').textContent = team;
        slotEl.classList.remove('empty');
        slotEl.classList.add('has-team');
      }
      return;
    }

    // Find the target slot in the next matchup
    const nextMatchup = document.querySelector(`[data-game="${nextGameId}"]`);
    if (!nextMatchup) return;

    const slots = nextMatchup.querySelectorAll('.team-slot');
    const targetSlot = position === 'top' ? slots[0] : slots[1];

    if (targetSlot) {
      targetSlot.dataset.team = team;
      targetSlot.dataset.seed = seed;
      targetSlot.querySelector('.seed').textContent = seed;
      targetSlot.querySelector('.name').textContent = team;
      targetSlot.classList.remove('empty');
      targetSlot.classList.add('has-team');
    }
  }

  // ===== Game Navigation Map =====

  function getNextGame(gameId) {
    // Final Four navigation
    if (gameId === 'ff-semi1') return { nextGameId: 'ff-champ', position: 'top' };
    if (gameId === 'ff-semi2') return { nextGameId: 'ff-champ', position: 'bot' };
    if (gameId === 'ff-champ') {
      // Update champion display
      const pick = state.picks[gameId];
      if (pick) {
        document.getElementById('champion-name').textContent = pick.team;
      }
      return null;
    }

    // Parse regional game ID: "{region}-r{round}-g{game}"
    const match = gameId.match(/^(\w+)-r(\d+)-g(\d+)$/);
    if (!match) return null;

    const [, region, roundStr, gameStr] = match;
    const round = parseInt(roundStr);
    const game = parseInt(gameStr);

    // Within region (rounds 1-3 → next round)
    if (round < 4) {
      const nextRound = round + 1;
      const nextGame = Math.ceil(game / 2);
      const position = game % 2 === 1 ? 'top' : 'bot';
      return { nextGameId: `${region}-r${nextRound}-g${nextGame}`, position };
    }

    // Elite 8 (round 4) → Final Four
    if (round === 4) {
      const regionMap = {
        east: { nextGameId: 'ff-semi1', position: 'top' },
        midwest: { nextGameId: 'ff-semi1', position: 'bot' },
        south: { nextGameId: 'ff-semi2', position: 'top' },
        west: { nextGameId: 'ff-semi2', position: 'bot' }
      };
      return regionMap[region] || null;
    }

    return null;
  }

  // ===== Downstream Clearing =====

  function clearDownstream(gameId, eliminatedTeam) {
    const next = getNextGame(gameId);
    if (!next) return;

    const { nextGameId, position } = next;

    // Find the slot where the eliminated team was placed
    let slotEl;
    if (nextGameId.startsWith('ff-')) {
      slotEl = document.querySelector(`[data-slot="${nextGameId}-${position}"]`);
    } else {
      const nextMatchup = document.querySelector(`[data-game="${nextGameId}"]`);
      if (!nextMatchup) return;
      const slots = nextMatchup.querySelectorAll('.team-slot');
      slotEl = position === 'top' ? slots[0] : slots[1];
    }

    if (!slotEl || slotEl.dataset.team !== eliminatedTeam) return;

    // Clear this slot
    slotEl.dataset.team = '';
    slotEl.dataset.seed = '';
    slotEl.querySelector('.seed').textContent = '';
    slotEl.querySelector('.name').textContent = '';
    slotEl.classList.add('empty');
    slotEl.classList.remove('has-team', 'selected');

    // If this game had a pick using the eliminated team, clear it too
    if (state.picks[nextGameId] && state.picks[nextGameId].team === eliminatedTeam) {
      delete state.picks[nextGameId];
      // Also unmark selected in that matchup
      const matchup = slotEl.closest('.matchup');
      if (matchup) {
        matchup.querySelectorAll('.team-slot').forEach(s => s.classList.remove('selected'));
      }
      // Continue clearing downstream
      clearDownstream(nextGameId, eliminatedTeam);
    }

    // Special: championship clearing
    if (nextGameId === 'ff-champ' && state.picks['ff-champ'] && state.picks['ff-champ'].team === eliminatedTeam) {
      delete state.picks['ff-champ'];
      document.getElementById('champion-name').textContent = '?';
    }
  }

  // ===== Progress Tracking =====

  function updateProgress() {
    const count = Object.keys(state.picks).length;
    state.pickCount = count;
    document.getElementById('pick-count').textContent = count;
    const pct = (count / state.totalPicks) * 100;
    document.getElementById('progress-fill').style.width = pct + '%';
  }

  // ===== localStorage =====

  function saveToLocalStorage() {
    try {
      localStorage.setItem('m2a_bracket_picks', JSON.stringify(state.picks));
    } catch (e) { /* ignore */ }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('m2a_bracket_picks');
      if (!saved) return;
      const picks = JSON.parse(saved);

      // Sort by round order and replay picks
      const sortedKeys = Object.keys(picks).sort((a, b) => {
        return getRoundOrder(a) - getRoundOrder(b);
      });

      sortedKeys.forEach(gameId => {
        const pick = picks[gameId];
        state.picks[gameId] = pick;

        // Mark the selected team in the matchup
        const matchup = document.querySelector(`[data-game="${gameId}"]`);
        if (matchup) {
          matchup.querySelectorAll('.team-slot').forEach(slot => {
            if (slot.dataset.team === pick.team) {
              slot.classList.add('selected');
            }
          });
        }

        // Advance to next round
        advanceTeam(gameId, pick.team, pick.seed);
      });
    } catch (e) { /* ignore corrupt data */ }
  }

  function getRoundOrder(gameId) {
    if (gameId === 'ff-champ') return 100;
    if (gameId.startsWith('ff-semi')) return 90;
    const match = gameId.match(/r(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // ===== Region Tabs (Mobile) =====

  function setupRegionTabs() {
    const tabs = document.querySelectorAll('.region-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const region = tab.dataset.region;
        document.querySelectorAll('.region, .final-four-container').forEach(r => {
          r.classList.remove('active');
        });

        const target = document.getElementById(`region-${region}`);
        if (target) target.classList.add('active');
      });
    });

    // Activate first region on mobile
    const firstRegion = document.getElementById('region-east');
    if (firstRegion) firstRegion.classList.add('active');
  }

  // ===== Nav Toggle (Mobile) =====

  function setupNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => links.classList.remove('open'));
      });
    }
  }

  // ===== Donate Buttons =====

  function setupDonateButtons() {
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customInput = document.getElementById('custom-amount');

    amountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        amountBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (customInput) customInput.value = '';
      });
    });

    if (customInput) {
      customInput.addEventListener('input', () => {
        amountBtns.forEach(b => b.classList.remove('active'));
      });
    }

    const donateBtn = document.getElementById('donate-btn');
    if (donateBtn) {
      donateBtn.addEventListener('click', () => {
        const activeBtn = document.querySelector('.amount-btn.active');
        const customVal = customInput ? customInput.value : '';
        const amount = customVal ? parseInt(customVal) : (activeBtn ? parseInt(activeBtn.dataset.amount) : 15);

        if (!amount || amount < 1) {
          showToast('Please select or enter an amount');
          return;
        }

        // For now, show a message. Stripe integration will replace this.
        showToast(`Stripe checkout for $${amount} coming soon!`);
      });
    }
  }

  // ===== Toast =====

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ===== Public API =====

  window.BracketEngine = {
    getPicks: () => ({ ...state.picks }),
    getPickCount: () => state.pickCount,
    getTotalPicks: () => state.totalPicks,
    isComplete: () => state.pickCount >= state.totalPicks,
    showToast
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
