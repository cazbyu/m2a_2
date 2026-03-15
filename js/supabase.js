// ===== Supabase Integration =====
// Saves bracket picks and handles form submission.
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values.

(function () {
  'use strict';

  // TODO: Replace with your new Supabase project credentials
  const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

  const TABLE_BRACKETS = '0013_m2a_bracket';
  const TABLE_VOTES = '0013_m2a_entrepreneur_votes';

  // Simple Supabase REST client (no SDK needed for basic inserts/selects)
  function supabaseRequest(table, method, body, query) {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : ''
    };

    return fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    }).then(res => {
      if (!res.ok) return res.text().then(t => { throw new Error(t); });
      return res.json();
    });
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

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        if (SUPABASE_URL.includes('YOUR_PROJECT')) {
          // Demo mode: just save locally
          console.log('Demo mode - bracket saved locally:', { firstName, lastName, email, picks });
          showMessage('Bracket saved locally! (Connect Supabase to save to database)', 'success');
          window.BracketEngine.showToast('Bracket saved!');
        } else {
          await supabaseRequest(TABLE_BRACKETS, 'POST', {
            first_name: firstName,
            last_name: lastName,
            email,
            picks
          });
          showMessage('Bracket saved successfully!', 'success');
          window.BracketEngine.showToast('Bracket saved!');
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

  // ===== Entrepreneur Voting =====

  window.SupabaseClient = {
    async vote(entrepreneurId, voterEmail) {
      if (SUPABASE_URL.includes('YOUR_PROJECT')) {
        console.log('Demo vote:', entrepreneurId);
        return { success: true };
      }
      return supabaseRequest(TABLE_VOTES, 'POST', {
        entrepreneur_id: entrepreneurId,
        voter_email: voterEmail || null
      });
    },

    async getVoteCounts() {
      if (SUPABASE_URL.includes('YOUR_PROJECT')) {
        return {};
      }
      try {
        const rows = await supabaseRequest(TABLE_VOTES, 'GET', null, '?select=entrepreneur_id');
        const counts = {};
        rows.forEach(r => {
          counts[r.entrepreneur_id] = (counts[r.entrepreneur_id] || 0) + 1;
        });
        return counts;
      } catch (e) {
        return {};
      }
    }
  };
})();
