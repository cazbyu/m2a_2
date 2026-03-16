// ===== Bracket Engine =====
// Renders the interactive tournament bracket and handles click-to-advance logic.

(function () {
  'use strict';

  // Game ID scheme: "{region}-r{round}-g{game}" e.g. "east-r1-g1"
  // Finals: "ff-semi1", "ff-semi2", "ff-champ"

  const state = {
    picks: {},   // gameId -> { team, seed }
    pickCount: 0,
    totalPicks: 62 // 32+16+8+4+2 = 62 (championship determined by score)
  };

  // ===== Initialization =====

  function init() {
    renderAllRegions();
    setupRegionTabs();
    setupNavToggle();
    setupDonateButtons();
    setupScoreInputs();
    setupTeamTooltips();
    setupCountdown();
    // Don't auto-load picks — users must login via "Load My Bracket" to see/edit
    updateChampionshipTeamNames();
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

  // Round date labels for 2026 NCAA Tournament
  const ROUND_LABELS = {
    1: { name: '1st Round',     dates: 'Mar 20–21' },
    2: { name: '2nd Round',     dates: 'Mar 22–23' },
    3: { name: '16 Remain',    dates: 'Mar 27–28' },
    4: { name: '8 Left',       dates: 'Mar 29–30' }
  };
  const FF_LABELS = {
    semi: { name: 'Finals',        dates: 'Apr 5' },
    champ: { name: 'Championship', dates: 'Apr 7' }
  };

  function renderRegion(container, region, regionKey, side) {
    // Teams come in pairs: [0,1], [2,3], [4,5], ... (8 matchups)
    const teams = region.teams;
    const rounds = 4; // R64, R32, Sweet16, Elite8

    for (let r = 0; r < rounds; r++) {
      const roundDiv = document.createElement('div');
      roundDiv.className = `round round-${r + 1}`;
      roundDiv.dataset.round = r + 1;

      // Add round date label at top
      const label = ROUND_LABELS[r + 1];
      if (label) {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'round-label';
        labelDiv.innerHTML = `<span class="round-name">${label.name}</span><span class="round-dates">${label.dates}</span>`;
        roundDiv.appendChild(labelDiv);
      }

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

    // Add country flag image from entrepreneur mapping
    if (team && typeof TEAM_ENTREPRENEUR_MAP !== 'undefined' && TEAM_ENTREPRENEUR_MAP[team.name]) {
      const info = TEAM_ENTREPRENEUR_MAP[team.name];
      const flagSrc = typeof COUNTRY_FLAGS !== 'undefined' && COUNTRY_FLAGS[info.country];
      if (flagSrc) {
        const flagImg = document.createElement('img');
        flagImg.className = 'team-flag';
        flagImg.src = flagSrc;
        flagImg.alt = info.country;
        slot.appendChild(flagImg);
      }
    }

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

    // Determine the game this slot belongs to
    const matchup = slot.closest('.matchup');
    const gameId = matchup.dataset.game;

    // Don't allow clicking on championship game — score determines winner
    if (gameId === 'ff-champ') return;

    const team = slot.dataset.team;
    const seed = parseInt(slot.dataset.seed);

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

    updateChampionshipTeamNames();
    updateProgress();
    saveToLocalStorage();
  }

  function updateSlotFlag(slotEl, teamName) {
    // Remove existing flag if any
    const existing = slotEl.querySelector('.team-flag');
    if (existing) existing.remove();
    // Add flag image from entrepreneur mapping
    if (teamName && typeof TEAM_ENTREPRENEUR_MAP !== 'undefined' && TEAM_ENTREPRENEUR_MAP[teamName]) {
      const info = TEAM_ENTREPRENEUR_MAP[teamName];
      const flagSrc = typeof COUNTRY_FLAGS !== 'undefined' && COUNTRY_FLAGS[info.country];
      if (flagSrc) {
        const flagImg = document.createElement('img');
        flagImg.className = 'team-flag';
        flagImg.src = flagSrc;
        flagImg.alt = info.country;
        slotEl.appendChild(flagImg);
      }
    }
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
        updateSlotFlag(slotEl, team);
        slotEl.classList.remove('empty');
        slotEl.classList.add('has-team');
      }
      // When championship teams change, update names and re-check scores
      if (nextGameId === 'ff-champ') {
        updateChampionshipTeamNames();
        determineChampionFromScore();
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
      updateSlotFlag(targetSlot, team);
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
      // Championship is determined by score, not click
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

        // Add donation to entrepreneur boost cart instead of going directly to Stripe
        if (window.EntrepreneurBoost) {
          // Check if bracket has a champion pick — auto-suggest that entrepreneur
          const suggestion = window.EntrepreneurBoost.getChampionSuggestion();
          if (suggestion) {
            window.EntrepreneurBoost.addToCart(suggestion.entId, amount);
            showToast('$' + amount + ' boost added for ' + suggestion.name + '!');
          } else {
            // No champion yet — scroll to entrepreneurs so user can pick
            showToast('Choose an entrepreneur to boost with your $' + amount + ' donation!');
          }

          // Scroll to entrepreneurs section and open cart
          document.getElementById('entrepreneurs').scrollIntoView({ behavior: 'smooth' });
          setTimeout(function () {
            window.EntrepreneurBoost.openCart();
          }, 500);
        } else {
          showToast('Please try again in a moment.');
        }
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

  // ===== Championship Score Prediction =====

  function updateChampionshipTeamNames() {
    const topSlot = document.querySelector('[data-slot="ff-champ-top"]');
    const botSlot = document.querySelector('[data-slot="ff-champ-bot"]');
    const name1 = document.getElementById('champ-team1-name');
    const name2 = document.getElementById('champ-team2-name');
    if (name1 && topSlot && topSlot.dataset.team) {
      name1.textContent = topSlot.dataset.team;
    } else if (name1) {
      name1.textContent = 'Team 1';
    }
    if (name2 && botSlot && botSlot.dataset.team) {
      name2.textContent = botSlot.dataset.team;
    } else if (name2) {
      name2.textContent = 'Team 2';
    }
  }

  function saveScoresToLocalStorage() {
    try {
      const s1 = document.getElementById('champ-score1');
      const s2 = document.getElementById('champ-score2');
      if (s1 && s2) {
        localStorage.setItem('m2a_champ_scores', JSON.stringify({
          score1: s1.value, score2: s2.value
        }));
      }
    } catch (e) { /* ignore */ }
  }

  function loadScoresFromLocalStorage() {
    try {
      const saved = localStorage.getItem('m2a_champ_scores');
      if (!saved) return;
      const { score1, score2 } = JSON.parse(saved);
      const s1 = document.getElementById('champ-score1');
      const s2 = document.getElementById('champ-score2');
      if (s1 && score1) s1.value = score1;
      if (s2 && score2) s2.value = score2;
    } catch (e) { /* ignore */ }
  }

  function setupScoreInputs() {
    const s1 = document.getElementById('champ-score1');
    const s2 = document.getElementById('champ-score2');
    if (s1) s1.addEventListener('input', () => { determineChampionFromScore(); saveScoresToLocalStorage(); });
    if (s2) s2.addEventListener('input', () => { determineChampionFromScore(); saveScoresToLocalStorage(); });
  }

  // Determine champion based on score inputs
  function determineChampionFromScore() {
    const s1El = document.getElementById('champ-score1');
    const s2El = document.getElementById('champ-score2');
    const topSlot = document.querySelector('[data-slot="ff-champ-top"]');
    const botSlot = document.querySelector('[data-slot="ff-champ-bot"]');
    const champName = document.getElementById('champion-name');

    if (!s1El || !s2El || !topSlot || !botSlot || !champName) return;

    const score1 = parseInt(s1El.value) || 0;
    const score2 = parseInt(s2El.value) || 0;
    const team1 = topSlot.dataset.team;
    const team2 = botSlot.dataset.team;

    // Need both teams in the championship and at least one score entered
    if (!team1 || !team2) {
      champName.textContent = '?';
      delete state.picks['ff-champ'];
      return;
    }

    if (score1 === 0 && score2 === 0) {
      champName.textContent = '?';
      delete state.picks['ff-champ'];
      updateProgress();
      saveToLocalStorage();
      return;
    }

    // Higher score wins
    if (score1 > score2) {
      state.picks['ff-champ'] = { team: team1, seed: parseInt(topSlot.dataset.seed) || 0 };
      champName.textContent = team1;
      // Highlight winning slot
      topSlot.classList.add('selected');
      botSlot.classList.remove('selected');
    } else if (score2 > score1) {
      state.picks['ff-champ'] = { team: team2, seed: parseInt(botSlot.dataset.seed) || 0 };
      champName.textContent = team2;
      botSlot.classList.add('selected');
      topSlot.classList.remove('selected');
    } else {
      // Tied — no champion yet
      champName.textContent = '?';
      delete state.picks['ff-champ'];
      topSlot.classList.remove('selected');
      botSlot.classList.remove('selected');
    }

    updateProgress();
    saveToLocalStorage();
  }

  // ===== Countdown Timer =====
  // Brackets lock Thursday March 19 at 10:10 AM MT (Mountain Daylight = UTC-6)

  const BRACKET_DEADLINE = new Date('2026-03-19T16:10:00Z'); // 10:10 AM MDT

  function setupCountdown() {
    const banner = document.getElementById('countdown-banner');
    if (!banner) return;

    function tick() {
      const now = new Date();
      const diff = BRACKET_DEADLINE - now;

      if (diff <= 0) {
        // Brackets locked
        banner.classList.add('countdown-locked');
        document.getElementById('countdown-label').innerHTML = '&#128274; Brackets are locked!';
        document.getElementById('countdown-timer').style.display = 'none';
        document.getElementById('countdown-note').textContent = 'Boosts are still open \u2014 support your favorite entrepreneur!';

        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Brackets Locked';
        }
        return; // Stop ticking
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      document.getElementById('cd-days').textContent = days;
      document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
      document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
      document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');

      setTimeout(tick, 1000);
    }

    tick();
  }

  // Expose deadline for form validation
  function isBracketLocked() {
    return new Date() >= BRACKET_DEADLINE;
  }

  // ===== Team → Entrepreneur Tooltips =====

  function setupTeamTooltips() {
    const container = document.getElementById('bracket-container');
    if (!container || typeof TEAM_ENTREPRENEUR_MAP === 'undefined') return;

    // Create a single reusable tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'team-ent-tooltip';
    tooltip.className = 'team-ent-tooltip';
    document.body.appendChild(tooltip);

    container.addEventListener('mouseover', (e) => {
      const slot = e.target.closest('.team-slot');
      if (!slot || !slot.dataset.team) { tooltip.style.display = 'none'; return; }

      const team = slot.dataset.team;
      const info = TEAM_ENTREPRENEUR_MAP[team];
      if (!info) { tooltip.style.display = 'none'; return; }

      const firstName = info.name.split(' ')[0];
      const flagSrc = typeof COUNTRY_FLAGS !== 'undefined' && COUNTRY_FLAGS[info.country];
      const flagImg = flagSrc ? ' <img src="' + flagSrc + '" alt="' + info.country + '" style="height:14px;vertical-align:middle;">' : '';
      tooltip.innerHTML = 'If <strong>' + team + '</strong> wins, <strong>' + firstName + '</strong>' + flagImg + ' wins';
      tooltip.style.display = 'block';

      const rect = slot.getBoundingClientRect();
      tooltip.style.left = (rect.left + rect.width / 2) + 'px';
      tooltip.style.top = (rect.top - 6) + 'px';
    });

    container.addEventListener('mouseout', (e) => {
      const slot = e.target.closest('.team-slot');
      if (slot) tooltip.style.display = 'none';
    });
  }

  // Helper: look up entrepreneur for a team name (used by post-save modal)
  function getEntrepreneurForTeam(teamName) {
    if (typeof TEAM_ENTREPRENEUR_MAP === 'undefined' || !teamName) return null;
    return TEAM_ENTREPRENEUR_MAP[teamName] || null;
  }

  // ===== Public API =====

  // Load picks from an external source (e.g., Supabase)
  function loadPicks(picks) {
    if (!picks || typeof picks !== 'object') return;

    // Clear existing picks
    state.picks = {};
    state.pickCount = 0;

    // Clear all selected states and advanced teams in the UI
    document.querySelectorAll('.team-slot.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.team-slot[data-team]').forEach(el => {
      // Only reset slots that were auto-filled (not original R1 slots)
      const slot = el.dataset.slot || '';
      if (!slot.match(/-r1-g\d+-(top|bot)$/)) {
        el.querySelector('.name').textContent = el.dataset.placeholder || '';
        el.querySelector('.seed').textContent = '';
        delete el.dataset.team;
        delete el.dataset.seed;
      }
    });

    // Sort by round order and replay picks (same as loadFromLocalStorage)
    const sortedKeys = Object.keys(picks).sort((a, b) => {
      return getRoundOrder(a) - getRoundOrder(b);
    });

    sortedKeys.forEach(gameId => {
      const pick = picks[gameId];
      if (!pick || !pick.team) return;

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

    updateProgress();
    updateChampionshipTeamNames();
    determineChampionFromScore();
    saveToLocalStorage();
  }

  // Load championship score predictions
  function loadChampionshipScores(score1, score2) {
    const s1 = document.getElementById('champ-score1');
    const s2 = document.getElementById('champ-score2');
    if (s1) s1.value = score1 || '';
    if (s2) s2.value = score2 || '';
  }

  window.BracketEngine = {
    getPicks: () => ({ ...state.picks }),
    getPickCount: () => state.pickCount,
    getTotalPicks: () => state.totalPicks,
    isComplete: () => state.pickCount >= state.totalPicks,
    getChampionshipScores: () => {
      const s1 = document.getElementById('champ-score1');
      const s2 = document.getElementById('champ-score2');
      return {
        score1: s1 ? parseInt(s1.value) || 0 : 0,
        score2: s2 ? parseInt(s2.value) || 0 : 0
      };
    },
    loadPicks,
    loadChampionshipScores,
    showToast,
    getEntrepreneurForTeam,
    isBracketLocked
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
