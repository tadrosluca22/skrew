let players = [];
let roundMultiplier = 1;

// Utility to get element
const $ = (id) => document.getElementById(id);

// Create player name inputs
function createNameInputs() {
  const count = parseInt($('playerCount').value);
  if (isNaN(count) || count < 3) { // changed from 1 to 3
    showPopup('Please enter a valid number of players (at least 3)');
    return;
  }
  const container = $('namesContainer');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <label>Player ${i + 1} Name: </label>
      <input type="text" id="playerName${i}" placeholder="Player ${i + 1}" required/>
      <br/>
    `;
  }
  $('nameInputs').classList.remove('hidden');
  $('scoreTable').innerHTML = '';
  $('scoreboard').innerHTML = '';
  $('podium').innerHTML = '';
}

// Generate the score table
function generateTable() {
  players = [];
  const count = parseInt($('playerCount').value);
  let missingNames = [];
  for (let i = 0; i < count; i++) {
    const name = $(`playerName${i}`).value.trim();
    if (!name) missingNames.push(i);
    players.push(name);
  }
  roundMultiplier = 1;

  // If any names are missing, prompt the user
  if (missingNames.length > 0) {
    showNameNumberPopup(missingNames, count);
    return;
  }

  renderTableAndScoreboard();
}

function showNameNumberPopup(missingNames, count) {
  // Remove existing popup if present
  const oldPopup = document.getElementById('custom-popup');
  if (oldPopup) oldPopup.remove();

  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'custom-popup';
  popup.innerHTML = `
    <div class="popup-content">
      <span class="popup-message">Name players by number (P1, P2, P3, ...)?</span>
      <div style="margin-top:18px;">
        <button id="popup-yes">Yes</button>
        <button id="popup-no">No</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById('popup-yes').onclick = () => {
    // Fill missing names with placeholders
    for (let i of missingNames) {
      players[i] = `P${i + 1}`;
      $(`playerName${i}`).value = `P${i + 1}`;
    }
    popup.remove();
    renderTableAndScoreboard();
  };
  document.getElementById('popup-no').onclick = () => {
    popup.remove();
    showPopup('Please fill in all player names.');
  };
}

function renderTableAndScoreboard() {
  let html = `<div class="table-wrapper"><table id="mainTable"><thead><tr>`;
  html += `<th>Player</th>`;
  for (let r = 1; r <= 5; r++) html += `<th>Round ${r}</th>`;
  html += `<th>Total</th></tr></thead><tbody>`;

  players.forEach((player, idx) => {
    html += `<tr data-player="${idx}"><td>${player}</td>`;
    for (let r = 1; r <= 5; r++) {
      html += `<td><input type="number" min="0" value="0" data-score="${idx}-${r}"></td>`;
    }
    html += `<td><input type="number" readonly id="total-${idx}" value="0"></td></tr>`;
  });

  html += `<tr><td colspan="7" style="text-align:left;">
    Round 5 points multiplier: 
    <select id="multiplierSelect">
      <option value="1" selected>Normal (1x)</option>
      <option value="2">Double (2x)</option>
      <option value="4">Quadruple (4x)</option>
    </select>
  </td></tr>`;

  html += `</tbody></table></div>`;
  $('scoreTable').innerHTML = html;
  $('scoreboard').innerHTML = '';
  $('podium').innerHTML = '';

  // Add event listeners for score inputs and multiplier
  $('mainTable').addEventListener('input', handleTableInput);
  $('multiplierSelect').addEventListener('change', handleMultiplierChange);

  calculateAllTotals();
  showPodiumAndScoreboard();
}

// Handle input in the table (score changes)
function handleTableInput(e) {
  if (e.target.matches('input[type="number"][data-score]')) {
    calculateAllTotals();
    showPodiumAndScoreboard();
  }
}

// Handle multiplier change
function handleMultiplierChange(e) {
  roundMultiplier = parseInt(e.target.value);
  calculateAllTotals();
  showPodiumAndScoreboard();
}

// Calculate total for a player
function calculateTotal(playerIndex) {
  let sum = 0;
  for (let r = 1; r <= 4; r++) {
    const val = parseInt(document.querySelector(`input[data-score="${playerIndex}-${r}"]`).value) || 0;
    sum += val;
  }
  const val5 = parseInt(document.querySelector(`input[data-score="${playerIndex}-5"]`).value) || 0;
  sum += val5 * roundMultiplier;
  $(`total-${playerIndex}`).value = sum;
}

// Calculate all totals
function calculateAllTotals() {
  for (let i = 0; i < players.length; i++) {
    calculateTotal(i);
  }
}

// Show the podium and scoreboard
function showPodiumAndScoreboard() {
  const scores = players.map((p, i) => ({
    name: p,
    total: parseInt($(`total-${i}`).value) || 0,
  }));
  scores.sort((a, b) => a.total - b.total);

  // Podium
  let podiumHtml = `<div class="podium-row">`;
  const podiumOrder = [1, 0, 2]; // left: 2nd, center: 1st, right: 3rd
  for (let i = 0; i < 3 && i < scores.length; i++) {
    const idx = podiumOrder[i];
    const s = scores[idx];
    let spotClass = '';
    if (i === 0) spotClass = 'silver';
    if (i === 2) spotClass = 'bronze';
    podiumHtml += `
      <div class="podium-spot ${spotClass}">
        <div class="podium-rank">${idx + 1}</div>
        <div class="podium-name">${s ? s.name : '-'}</div>
        <div class="podium-score">${s ? s.total : '-'} pts</div>
      </div>
    `;
  }
  podiumHtml += `</div>`;
  $('podium').innerHTML = podiumHtml;

  // Scoreboard
  let html = `<h3>Scoreboard (Least points → Highest points)</h3><ol>`;
  scores.forEach(s => {
    html += `<li>${s.name}: ${s.total} points</li>`;
  });
  html += '</ol>';
  $('scoreboard').innerHTML = html;
}

// Utility to show a styled popup message
function showPopup(message) {
  // Remove existing popup if present
  const oldPopup = document.getElementById('custom-popup');
  if (oldPopup) oldPopup.remove();

  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'custom-popup';
  popup.innerHTML = `
    <div class="popup-content">
      <button class="popup-close" aria-label="Close">&times;</button>
      <span class="popup-message">${message}</span>
    </div>
  `;
  document.body.appendChild(popup);

  // Close on button click
  popup.querySelector('.popup-close').onclick = () => popup.remove();
}

// Attach event listeners for initial controls
window.addEventListener('DOMContentLoaded', () => {
  $('createNamesBtn')?.addEventListener('click', createNameInputs);
  $('generateTableBtn')?.addEventListener('click', generateTable);
  document.getElementById('exportPdfBtn')?.addEventListener('click', async () => {
    // Select the area to export (podium + scoreboard)
    const wrapper = document.getElementById('scoreboard-podium-wrapper');
    if (!wrapper) return;

    // Use html2canvas to render the DOM to a canvas
    const canvas = await html2canvas(wrapper, { backgroundColor: null, scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // Create PDF
    const pdf = new window.jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    // Calculate image size to fit A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = canvas.height * (imgWidth / canvas.width);

    pdf.text('Skrew Results', pageWidth / 2, 40, { align: 'center' });
    pdf.addImage(imgData, 'PNG', 20, 60, imgWidth, imgHeight);

    // Get winner's name for filename
    let winner = '';
    if (players && players.length > 0) {
      // Find the player with the lowest total (winner)
      let minScore = Infinity, winnerIdx = 0;
      for (let i = 0; i < players.length; i++) {
        const score = parseInt(document.getElementById(`total-${i}`).value) || 0;
        if (score < minScore) {
          minScore = score;
          winnerIdx = i;
        }
      }
      winner = players[winnerIdx] ? players[winnerIdx].replace(/[^a-zA-Z0-9_-]/g, '') : 'winner';
    }
    const fileName = `skrew-${winner || 'winner'}.pdf`;

    pdf.save(fileName);
  });
});
