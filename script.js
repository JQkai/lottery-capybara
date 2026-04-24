'use strict';

const MINIONS_DATA = [
  { id: 1, name: '毛毛', title: '御用美食評論家', trait: '永遠在吃東西', accessory: '🍖', accent: '#ff8c69' },
  { id: 2, name: '泡泡', title: '溫泉首席顧問', trait: '一泡就不想出來', accessory: '🛁', accent: '#87ceeb' },
  { id: 3, name: '懶懶', title: '睡眠研究大師', trait: '每天睡滿20小時', accessory: '💤', accent: '#c8a8d8' },
  { id: 4, name: '胖胖', title: '體重管理專員', trait: '圓滾滾超級可愛', accessory: '⚖️', accent: '#f4a460' },
  { id: 5, name: '呆呆', title: '發呆藝術大師', trait: '總是放空在發呆', accessory: '✨', accent: '#98d898' },
  { id: 6, name: '跑跑', title: '緊急撤退隊長', trait: '危險時跑最快', accessory: '👟', accent: '#ffb347' },
  { id: 7, name: '聰聰', title: '大王首席謀士', trait: '全村最有智慧的', accessory: '📚', accent: '#87cefa' },
  { id: 8, name: '萌萌', title: '可愛形象大使', trait: '可愛度破表滿分', accessory: '🌸', accent: '#ffb6c1' },
];

const DEFAULT_STATUS = '點擊手下卡片可取消 / 恢復參與資格';

const state = {
  minions: MINIONS_DATA.map(minion => ({ ...minion, active: true })),
  drawCount: 1,
  isDrawing: false,
};

let stopConfettiFn = null;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function getActiveMinions() {
  return state.minions.filter(minion => minion.active);
}

function buildCapyHTML(accessory = '') {
  return `
    <div class="minion-capy">
      <div class="minion-body">
        <div class="ear left"></div>
        <div class="ear right"></div>
        <div class="eye left"><span class="shine"></span></div>
        <div class="eye right"><span class="shine"></span></div>
        <div class="snout">
          <div class="nostril left"></div>
          <div class="nostril right"></div>
          <div class="teeth"></div>
        </div>
      </div>
      ${accessory ? `<span class="accessory">${accessory}</span>` : ''}
    </div>`;
}

function setStatus(message) {
  document.getElementById('statusMsg').textContent = message;
}

function updateInfoBar() {
  const activeCount = getActiveMinions().length;
  document.getElementById('participantInfo').innerHTML =
    `參與人數：<strong>${activeCount}</strong> / ${state.minions.length}`;
}

function syncDrawCountUI() {
  const activeCount = getActiveMinions().length;
  if (activeCount === 0) {
    state.drawCount = 1;
  } else if (state.drawCount > activeCount) {
    state.drawCount = activeCount;
  }

  document.getElementById('drawCount').textContent = state.drawCount;
  document.getElementById('decreaseCount').disabled = state.drawCount <= 1;
  document.getElementById('increaseCount').disabled = activeCount === 0 || state.drawCount >= activeCount;
  document.getElementById('drawBtn').disabled = state.isDrawing || activeCount === 0;
}

function renderMinions() {
  const grid = document.getElementById('minionsGrid');
  grid.innerHTML = '';

  state.minions.forEach(minion => {
    const card = document.createElement('div');
    card.className = `minion-card${minion.active ? '' : ' inactive'}`;
    card.id = `card-${minion.id}`;
    card.style.setProperty('--accent', minion.accent);
    card.innerHTML = `
      ${buildCapyHTML(minion.accessory)}
      <div class="minion-name">${minion.name}</div>
      <div class="minion-title">${minion.title}</div>`;

    card.addEventListener('click', () => {
      if (state.isDrawing) {
        return;
      }
      toggleMinion(minion.id);
    });

    grid.appendChild(card);
  });

  syncDrawCountUI();
  updateInfoBar();
}

function toggleMinion(id) {
  const minion = state.minions.find(item => item.id === id);
  if (!minion) {
    return;
  }

  minion.active = !minion.active;
  const card = document.getElementById(`card-${id}`);
  if (card) {
    card.classList.toggle('inactive', !minion.active);
  }

  syncDrawCountUI();
  updateInfoBar();
}

function setCardClass(id, className, enabled) {
  const card = document.getElementById(`card-${id}`);
  if (card) {
    card.classList.toggle(className, enabled);
  }
}

function clearAllCardStates() {
  state.minions.forEach(minion => {
    const card = document.getElementById(`card-${minion.id}`);
    if (!card) {
      return;
    }
    card.classList.remove('winner', 'highlighted', 'drawing');
    const badge = card.querySelector('.winner-badge');
    if (badge) {
      badge.remove();
    }
  });
}

function stopConfetti() {
  if (stopConfettiFn) {
    stopConfettiFn();
    stopConfettiFn = null;
  }
}

function closeWinnerOverlay() {
  document.getElementById('winnerOverlay').classList.add('hidden');
  stopConfetti();
}

function shuffleMinions(minions) {
  const shuffled = [...minions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

async function runScan(participants, targetId) {
  const steps = 32 + Math.floor(Math.random() * 20);
  let previousIndex = -1;

  participants.forEach(minion => setCardClass(minion.id, 'drawing', true));

  for (let step = 0; step < steps; step += 1) {
    if (previousIndex >= 0) {
      setCardClass(participants[previousIndex].id, 'highlighted', false);
    }

    let nextIndex;
    if (step === steps - 1) {
      nextIndex = participants.findIndex(minion => minion.id === targetId);
    } else {
      do {
        nextIndex = Math.floor(Math.random() * participants.length);
      } while (nextIndex === previousIndex && participants.length > 1);
    }

    setCardClass(participants[nextIndex].id, 'highlighted', true);
    previousIndex = nextIndex;

    const progress = step / (steps - 1);
    const delay = progress < 0.5 ? 65 : 65 + Math.pow((progress - 0.5) / 0.5, 2) * 390;
    await sleep(delay);
  }

  participants.forEach(minion => setCardClass(minion.id, 'drawing', false));
}

function markWinner(id) {
  const card = document.getElementById(`card-${id}`);
  if (!card) {
    return;
  }
  card.classList.remove('highlighted');
  card.classList.add('winner');
  const badge = document.createElement('div');
  badge.className = 'winner-badge';
  badge.textContent = '🏆';
  card.appendChild(badge);
}

function showWinnerModal(winners) {
  const ranks = ['🥇', '🥈', '🥉', '🎖️', '🎖️', '🎖️', '🎖️', '🎖️'];
  const list = document.getElementById('winnersList');

  list.innerHTML = winners.map((winner, index) => `
    <div class="winner-item">
      <div class="winner-rank">${ranks[index] || '🎖️'}</div>
      ${buildCapyHTML(winner.accessory)}
      <div class="winner-name">${winner.name}</div>
      <div class="winner-subtitle">${winner.trait}</div>
    </div>`).join('');

  document.getElementById('winnerOverlay').classList.remove('hidden');
  startConfetti();
}

async function startDraw() {
  if (state.isDrawing) {
    return;
  }

  closeWinnerOverlay();
  clearAllCardStates();

  const participants = getActiveMinions();
  if (participants.length === 0) {
    setStatus('請至少選擇一位手下！');
    syncDrawCountUI();
    return;
  }

  if (state.drawCount > participants.length) {
    setStatus(`參與人數不足，最多可抽 ${participants.length} 位！`);
    syncDrawCountUI();
    return;
  }

  state.isDrawing = true;
  syncDrawCountUI();

  const winners = shuffleMinions(participants).slice(0, state.drawCount);
  const drawnIds = [];
  document.getElementById('kingCapybara').classList.add('excited');

  for (let index = 0; index < winners.length; index += 1) {
    setStatus(index === 0 ? '命運的齒輪開始轉動...' : `繼續抽第 ${index + 1} 位...`);
    const remaining = participants.filter(minion => !drawnIds.includes(minion.id));
    await runScan(remaining, winners[index].id);
    markWinner(winners[index].id);
    drawnIds.push(winners[index].id);
    await sleep(550);
  }

  document.getElementById('kingCapybara').classList.remove('excited');
  setStatus('命運已定！');
  await sleep(700);
  showWinnerModal(winners);

  state.isDrawing = false;
  syncDrawCountUI();
}

function startConfetti() {
  stopConfetti();

  const canvas = document.getElementById('confettiCanvas');
  const context = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98fb98'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height * 0.5,
    vx: (Math.random() - 0.5) * 3.5,
    vy: Math.random() * 3 + 2,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.14,
    w: Math.random() * 11 + 5,
    h: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    circle: Math.random() > 0.55,
    opacity: 1,
  }));

  const startedAt = Date.now();
  let rafId;

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startedAt;
    let alive = false;

    for (const piece of pieces) {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rot += piece.rotV;
      if (elapsed > 2800) {
        piece.opacity = Math.max(0, piece.opacity - 0.012);
      }
      if (piece.y < canvas.height && piece.opacity > 0) {
        alive = true;
      }

      context.save();
      context.globalAlpha = piece.opacity;
      context.translate(piece.x, piece.y);
      context.rotate(piece.rot);
      context.fillStyle = piece.color;
      if (piece.circle) {
        context.beginPath();
        context.arc(0, 0, piece.w / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      }
      context.restore();
    }

    if (alive) {
      rafId = requestAnimationFrame(draw);
    }
  }

  draw();
  stopConfettiFn = () => {
    cancelAnimationFrame(rafId);
    context.clearRect(0, 0, canvas.width, canvas.height);
  };
}

function resetRound() {
  if (state.isDrawing) {
    return;
  }
  closeWinnerOverlay();
  clearAllCardStates();
  setStatus(DEFAULT_STATUS);
}

function resetGame() {
  if (state.isDrawing) {
    return;
  }

  state.minions.forEach(minion => {
    minion.active = true;
  });
  state.drawCount = 1;

  renderMinions();
  resetRound();
}

document.getElementById('drawBtn').addEventListener('click', startDraw);
document.getElementById('resetBtn').addEventListener('click', resetGame);

document.getElementById('closeModal').addEventListener('click', () => {
  resetRound();
});

document.getElementById('decreaseCount').addEventListener('click', () => {
  if (state.drawCount > 1) {
    state.drawCount -= 1;
    syncDrawCountUI();
  }
});

document.getElementById('increaseCount').addEventListener('click', () => {
  const activeCount = getActiveMinions().length;
  if (state.drawCount < activeCount) {
    state.drawCount += 1;
    syncDrawCountUI();
  }
});

window.addEventListener('resize', () => {
  const overlay = document.getElementById('winnerOverlay');
  if (!overlay.classList.contains('hidden') && stopConfettiFn) {
    startConfetti();
  }
});

renderMinions();
setStatus(DEFAULT_STATUS);