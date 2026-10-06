const rewards = [
  { name: 'AK47',      sub: 'EVO GUN',   img: '3.png' },
  { name: 'SCAR',      sub: 'EVO GUN',   img: '1.png' },
  { name: 'EVO MP40',  sub: 'GUN SKIN',  img: '2.png' },
  { name: 'M1887',     sub: 'EVO GUN',   img: '4.png' },
  { name: 'XM8',       sub: 'EVO GUN',   img: '5.png' },
];

const grid = document.getElementById('rewardsGrid');
const uidInput = document.getElementById('uidInput');
const goBtn = document.getElementById('goBtn');

function renderCards() {
  grid.innerHTML = '';
  rewards.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img">
        <img src="images/${item.img}" alt="${item.name}" onerror="this.style.display='none';">
      </div>
      <div class="card-name">${item.name}</div>
      <div class="card-sub">${item.sub}</div>
      <button class="collect-btn" data-item="${item.name} (${item.sub})">Collect</button>
    `;
    grid.appendChild(card);
  });
  document.querySelectorAll('.collect-btn').forEach(btn => {
    btn.addEventListener('click', () => handleCollect(btn));
  });
}

function handleCollect(btn) {
  const uid = uidInput.value.trim();
  if (!uid || uid.length < 5) {
    showToast('❌ Pehle apna UID daalo!');
    uidInput.focus();
    return;
  }
  openLoginModal(uid, btn);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

goBtn.addEventListener('click', () => {
  const uid = uidInput.value.trim();
  if (!uid || uid.length < 5) { showToast('❌ Valid UID daalo'); return; }
  showToast('✅ UID verified! Ab Collect dabao');
  grid.scrollIntoView({ behavior: 'smooth' });
});

renderCards();
