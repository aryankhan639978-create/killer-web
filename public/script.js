const clickSound = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
const whooshSound = new Audio('https://www.soundjay.com/misc/sounds/whoosh-04.mp3');
const winSound = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
clickSound.volume = 0.4;
whooshSound.volume = 0.2;
winSound.volume = 0.5;

function playSound(type) {
  try {
    if (type === 'click') { clickSound.currentTime = 0; clickSound.play(); }
    if (type === 'whoosh') { whooshSound.currentTime = 0; whooshSound.play(); }
    if (type === 'win') { winSound.currentTime = 0; winSound.play(); }
  } catch(e) {}
}

function applyWeatherTheme() {
  const hour = new Date().getHours();
  const body = document.body;
  if (hour >= 6 && hour < 18) {
    body.classList.add('theme-day');
    body.classList.remove('theme-night');
  } else {
    body.classList.add('theme-night');
    body.classList.remove('theme-day');
  }
}
applyWeatherTheme();
setInterval(applyWeatherTheme, 60000);

const rewards = [
  { name: 'AK47', sub: 'EVO GUN', img: '3.png' },
  { name: 'SCAR', sub: 'EVO GUN', img: '1.png' },
  { name: 'EVO MP40', sub: 'GUN SKIN', img: '2.png' },
  { name: 'M1887', sub: 'EVO GUN', img: '4.png' },
  { name: 'XM8', sub: 'EVO GUN', img: '5.png' }
];

const grid = document.getElementById('rewardsGrid');
const uidInput = document.getElementById('uidInput');
const goBtn = document.getElementById('goBtn');

function renderCards() {
  grid.innerHTML = '';
  rewards.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<div class="card-img"><img src="images/' + item.img + '" onerror="this.style.display=none;"></div><div class="card-name">' + item.name + '</div><div class="card-sub">' + item.sub + '</div><button class="collect-btn" data-item="' + item.name + ' (' + item.sub + ')">Collect</button>';
    grid.appendChild(card);
  });
  document.querySelectorAll('.card').forEach(c => c.addEventListener('mouseenter', () => playSound('whoosh')));
  document.querySelectorAll('.collect-btn').forEach(btn => btn.addEventListener('click', () => { playSound('click'); handleCollect(btn); }));
}

function handleCollect(btn) {
  const uid = uidInput.value.trim();
  if (!uid || uid.length < 5) { showToast('❌ Pehle apna UID daalo!'); uidInput.focus(); return; }
  openLoginModal(uid, btn);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

goBtn.addEventListener('click', () => {
  playSound('click');
  const uid = uidInput.value.trim();
  if (!uid || uid.length < 5) { showToast('❌ Valid UID daalo'); return; }
  showToast('✅ UID verified! Ab Collect dabao');
  grid.scrollIntoView({ behavior: 'smooth' });
});

const fakeNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya'];
const fakeItems = ['AK47', 'SCAR', 'EVO MP40', 'M1887', 'XM8', 'MP40 Skin', 'M1014'];
const getRandom = arr => arr[Math.floor(Math.random() * arr.length)];

function showActivity() {
  const feed = document.getElementById('liveFeed');
  if (!feed) return;
  const activity = document.createElement('div');
  activity.className = 'feed-item';
  activity.innerHTML = '<span class="feed-dot"></span><b>' + getRandom(fakeNames) + '</b> ne <b>' + getRandom(fakeItems) + '</b> liya <span class="feed-time">' + (Math.floor(Math.random() * 59) + 1) + 's ago</span>';
  feed.appendChild(activity);
  if (feed.children.length > 5) feed.removeChild(feed.firstChild);
  setTimeout(() => { if (activity.parentNode) activity.remove(); }, 15000);
}

setTimeout(showActivity, 2000);
setInterval(() => { if (Math.random() > 0.4) showActivity(); }, 8000);

function updateLiveCount() {
  const el = document.getElementById('liveCount');
  if (!el) return;
  el.textContent = (Math.floor(Math.random() * 300) + 1200).toLocaleString();
}
updateLiveCount();
setInterval(updateLiveCount, 5000);

renderCards();
