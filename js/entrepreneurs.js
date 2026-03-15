// ===== Entrepreneur Bracket Challenge =====
// 9 real African entrepreneurs in a bracket. Donations = votes. Most funded advances.

(function () {
  'use strict';

  // ===== Real Entrepreneur Data =====
  const ENTREPRENEURS = [
    {
      id: 'ent-1',
      name: 'Kate Nanyangwe',
      business: 'Nails By Kate & Hair Salon',
      photo: 'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_2.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/03/Nails-By-Kate-Business-Plan.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-2',
      name: 'Jane Ndashe',
      business: 'JP Enterprise',
      photo: 'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/03/Entrapov-Business-Plan-JP-ENTERPRISE.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-3',
      name: 'Nanyangwe Katai',
      business: 'Chichi Braids',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260226_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Entrapov-Business-Plan-CHICHI-BRAIDS.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-4',
      name: 'Saukilan Kapatamoyo',
      business: "God's Grace Detergent",
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Gods-Grace-Detergent-604x620.jpg',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Saukilan-Kapatamoyo.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-5',
      name: 'Sandra Chisala',
      business: 'High Voltage Fabrication',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260214_1.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/HIGH-VOLTAGE-BUSINESS-PLAN.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-6',
      name: 'Kendrick B. Makhurane',
      business: 'Key B Manufacturers',
      photo: 'https://entrapov.com/wp-content/uploads/2026/02/Snip20260213_7-686x620.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/02/Key-B_Business-Plan.docx-1-1.docx-3.pdf',
      raised: 0
    },
    {
      id: 'ent-7',
      name: 'Lyampu Mubiana',
      business: "Lyamupu's Pastry Kitchen",
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260126_2.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/Lyamupus-Pastry-Kitchen.docx.pdf',
      raised: 0
    },
    {
      id: 'ent-8',
      name: 'Monica Ntchalachala',
      business: 'Femmo Second Hand Clothes',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260123_4.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/1754573627541_1754573623418_Entrapov-Business-Plan-Template-Monica.docx-1.pdf',
      raised: 0
    },
    {
      id: 'ent-9',
      name: 'Enrique Hannock',
      business: 'Nexora Technology Company',
      photo: 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260113_2-536x620.png',
      businessPlan: 'https://entrapov.com/wp-content/uploads/2026/01/ENRIQUE-HANNOCK-PROPOSAL.pdf.pdf',
      raised: 0
    }
  ];

  // ===== Bracket Structure (9 → play-in + 8-team bracket) =====
  // Seeding: 1v(play-in winner), 2v7, 3v6, 4v5
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

    // Play-in first, then QFs
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

    slot.className = 'ent-slot' + (isActive ? ' ent-slot-active' : '');
    slot.innerHTML = `
      <div class="ent-slot-info">
        <div class="ent-slot-name">${ent.name}</div>
        <div class="ent-slot-biz">${ent.business}</div>
        <div class="ent-funding-bar">
          <div class="ent-funding-fill" style="width: ${pct}%"></div>
        </div>
        <div class="ent-slot-raised">$${ent.raised.toLocaleString()} raised</div>
        <a href="${ent.businessPlan}" target="_blank" class="ent-plan-link">View Business Plan</a>
      </div>
      <div class="ent-slot-photo">
        <img src="${ent.photo}" alt="${ent.name}" loading="lazy">
      </div>
      ${isActive ? `<button class="btn btn-fund-ent" data-ent-id="${ent.id}" data-matchup="${matchupId}">Fund $5</button>` : ''}
    `;

    return slot;
  }

  // ===== Fund / Donate Click =====
  container.addEventListener('click', (e) => {
    const fundBtn = e.target.closest('.btn-fund-ent');
    if (!fundBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const entId = fundBtn.dataset.entId;
    const ent = getEnt(entId);
    if (ent) {
      ent.raised += 5;
      renderBracket();
      if (window.BracketEngine) {
        window.BracketEngine.showToast(`$5 donated to ${ent.name}!`);
      }
    }
  });

  // ===== Init =====
  renderBracket();
})();
