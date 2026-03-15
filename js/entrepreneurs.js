// ===== Entrepreneur Spotlight =====
// Renders entrepreneur cards with voting and funding progress.
// Replace placeholder data with real entrepreneurs when ready.

(function () {
  'use strict';

  const PLACEHOLDER_ENTREPRENEURS = [
    {
      id: 'ent-1',
      name: 'Amara Okafor',
      location: 'Lagos, Nigeria',
      business: 'Solar-Powered Water Purification',
      description: 'Portable solar water purifiers for rural communities. Each unit serves 50+ families with clean drinking water daily.',
      fundingGoal: 5000,
      fundingRaised: 0,
      initials: 'AO'
    },
    {
      id: 'ent-2',
      name: 'Fatima Mwangi',
      location: 'Nairobi, Kenya',
      business: 'Mobile Crop Advisory App',
      description: 'SMS-based crop advisory service helping smallholder farmers optimize yields using local weather and soil data.',
      fundingGoal: 3500,
      fundingRaised: 0,
      initials: 'FM'
    },
    {
      id: 'ent-3',
      name: 'Kwame Asante',
      location: 'Accra, Ghana',
      business: 'Recycled Textile Workshop',
      description: 'Transforms textile waste into school uniforms and bags, employing local women and reducing landfill waste.',
      fundingGoal: 4000,
      fundingRaised: 0,
      initials: 'KA'
    },
    {
      id: 'ent-4',
      name: 'Zuri Ndikumana',
      location: 'Kigali, Rwanda',
      business: 'Community Beekeeping Cooperative',
      description: 'Training and equipping rural beekeepers to produce premium honey for export, supporting 30+ families.',
      fundingGoal: 2500,
      fundingRaised: 0,
      initials: 'ZN'
    }
  ];

  const grid = document.getElementById('entrepreneur-grid');
  if (!grid) return;

  function renderCards(entrepreneurs) {
    grid.innerHTML = '';
    entrepreneurs.forEach(ent => {
      const card = document.createElement('div');
      card.className = 'entrepreneur-card';
      card.innerHTML = `
        <div class="entrepreneur-img">${ent.initials}</div>
        <div class="entrepreneur-body">
          <h3>${ent.name}</h3>
          <div class="entrepreneur-location">${ent.location} &mdash; ${ent.business}</div>
          <p class="entrepreneur-desc">${ent.description}</p>
          <div class="funding-bar">
            <div class="funding-fill" style="width: ${Math.min(100, (ent.fundingRaised / ent.fundingGoal) * 100)}%"></div>
          </div>
          <div class="funding-text">$${ent.fundingRaised.toLocaleString()} raised of $${ent.fundingGoal.toLocaleString()} goal</div>
          <div class="entrepreneur-actions">
            <button class="btn btn-vote" data-ent-id="${ent.id}">Vote</button>
            <button class="btn btn-fund" data-ent-id="${ent.id}">Contribute</button>
          </div>
          <div class="vote-count" data-vote-count="${ent.id}">0 votes</div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // Render and setup vote handlers
  renderCards(PLACEHOLDER_ENTREPRENEURS);

  // Vote click handling
  grid.addEventListener('click', async (e) => {
    const voteBtn = e.target.closest('.btn-vote');
    const fundBtn = e.target.closest('.btn-fund');

    if (voteBtn) {
      const entId = voteBtn.dataset.entId;
      voteBtn.disabled = true;
      voteBtn.textContent = 'Voting...';

      try {
        await window.SupabaseClient.vote(entId);
        // Update local count
        const countEl = document.querySelector(`[data-vote-count="${entId}"]`);
        if (countEl) {
          const current = parseInt(countEl.textContent) || 0;
          countEl.textContent = `${current + 1} votes`;
        }
        if (window.BracketEngine) window.BracketEngine.showToast('Vote recorded!');
      } catch (err) {
        console.error('Vote error:', err);
        if (window.BracketEngine) window.BracketEngine.showToast('Could not record vote');
      } finally {
        voteBtn.disabled = false;
        voteBtn.textContent = 'Vote';
      }
    }

    if (fundBtn) {
      // For now, scroll to donate section
      document.getElementById('donate').scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Load vote counts from Supabase
  async function loadVoteCounts() {
    if (!window.SupabaseClient) return;
    const counts = await window.SupabaseClient.getVoteCounts();
    Object.entries(counts).forEach(([entId, count]) => {
      const el = document.querySelector(`[data-vote-count="${entId}"]`);
      if (el) el.textContent = `${count} votes`;
    });
  }

  loadVoteCounts();
})();
