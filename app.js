/* ===== 미니연수원 ===== */

let videos = [];
let currentFilter = 'all';
let userId = null;
let watchHistory = {};

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async () => {
  userId = localStorage.getItem('mini-academy-userId');
  if (userId) {
    updateUserBadge();
    loadWatchHistory();
  } else {
    document.getElementById('idOverlay').classList.add('show');
  }

  try {
    const resp = await fetch('videos.json');
    videos = await resp.json();
    renderHero();
    renderGallery();
  } catch (e) {
    document.getElementById('gallery').innerHTML =
      '<div class="empty-state"><div class="emoji">😵</div><p>영상 데이터를 불러올 수 없습니다</p></div>';
  }

  // 카테고리 탭
  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderHero();
      renderGallery();
    });
  });

  document.getElementById('idInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') submitId();
  });
});

// ===== 사번 =====
function submitId() {
  const input = document.getElementById('idInput');
  const val = input.value.trim();
  if (val.length !== 4 || !/^\d{4}$/.test(val)) {
    input.style.borderColor = '#ef4444';
    input.focus();
    return;
  }
  userId = val;
  localStorage.setItem('mini-academy-userId', userId);
  loadWatchHistory();
  updateUserBadge();
  document.getElementById('idOverlay').classList.remove('show');
}

function showIdPrompt() {
  const overlay = document.getElementById('idOverlay');
  const input = document.getElementById('idInput');
  if (userId) input.value = userId;
  overlay.classList.add('show');
  setTimeout(() => input.focus(), 100);
}

function updateUserBadge() {
  const badge = document.getElementById('userBadge');
  badge.textContent = userId + ' 님';
  badge.classList.add('active');
}

// ===== 시청 기록 =====
function loadWatchHistory() {
  const key = `mini-academy-history-${userId}`;
  const saved = localStorage.getItem(key);
  watchHistory = saved ? JSON.parse(saved) : {};
}

function saveWatchHistory() {
  if (!userId) return;
  localStorage.setItem(`mini-academy-history-${userId}`, JSON.stringify(watchHistory));
}

function markWatched(videoId) {
  if (!watchHistory[videoId]) {
    watchHistory[videoId] = { count: 0, lastWatched: '' };
  }
  watchHistory[videoId].count += 1;
  watchHistory[videoId].lastWatched = new Date().toISOString();
  saveWatchHistory();
  renderGallery();
}

// ===== 히어로 배너 =====
function renderHero() {
  const heroEl = document.getElementById('hero');
  const filtered = currentFilter === 'all'
    ? videos
    : videos.filter(v => v.tags.includes(currentFilter));

  const featured = filtered.filter(v => v.featured);
  const v = featured.length > 0 ? featured[0] : filtered[0];
  if (!v) { heroEl.innerHTML = ''; return; }

  const thumbUrl = `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`;
  const isNew = isRecent(v.date);

  heroEl.innerHTML = `
    <div class="hero-card" onclick="openPlayer('${v.id}')">
      <img src="${thumbUrl}" alt="${v.title}">
      <div class="hero-overlay">
        ${isNew ? '<span class="hero-badge">NEW</span>' : `<span class="hero-badge">${v.category}</span>`}
        <div class="hero-title">${v.title}</div>
        <div class="hero-desc">${v.desc || ''}</div>
        <div class="hero-actions">
          <button class="hero-btn primary">▶ 재생</button>
          <button class="hero-btn secondary">ℹ️ 상세</button>
        </div>
      </div>
    </div>
  `;
}

// ===== 갤러리 =====
function renderGallery() {
  const gallery = document.getElementById('gallery');
  const filtered = currentFilter === 'all'
    ? videos
    : videos.filter(v => v.tags.includes(currentFilter));

  if (filtered.length === 0) {
    gallery.innerHTML = '<div class="empty-state"><div class="emoji">🔍</div><p>해당 카테고리의 영상이 없습니다</p></div>';
    return;
  }

  const groups = {};

  // 시청 중인 콘텐츠 (시청기록 있는 것)
  const watching = filtered.filter(v => watchHistory[v.id] && watchHistory[v.id].count > 0);
  if (watching.length > 0) groups['▶ 시청 중인 콘텐츠'] = watching;

  // 필수 시청
  const featured = filtered.filter(v => v.featured);
  if (featured.length > 0) groups['🔥 꼭 챙겨 보세요'] = featured;

  // 최근 등록
  const recent = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  if (recent.length > 0) groups['🆕 최근 등록'] = recent;

  // 카테고리별
  const categories = [...new Set(filtered.map(v => v.category))];
  categories.forEach(cat => {
    const catVids = filtered.filter(v => v.category === cat);
    if (catVids.length > 0) groups[cat] = catVids;
  });

  let html = '';
  for (const [title, vids] of Object.entries(groups)) {
    html += renderRow(title, vids);
  }

  gallery.innerHTML = html;
}

function renderRow(title, vids) {
  const cards = vids.map(v => renderCard(v)).join('');
  return `
    <section class="row">
      <div class="row-header">
        <h2 class="row-title">${title}</h2>
        <span class="row-more">더보기</span>
      </div>
      <div class="row-track">${cards}</div>
    </section>
  `;
}

function renderCard(v) {
  const thumbUrl = `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`;
  const isWatched = watchHistory[v.id] && watchHistory[v.id].count > 0;
  const watchCount = isWatched ? watchHistory[v.id].count : 0;
  const isNew = isRecent(v.date);

  return `
    <article class="card ${isWatched ? 'watched' : ''}" onclick="openPlayer('${v.id}')">
      <div class="card-poster">
        <img src="${thumbUrl}" alt="${v.title}" loading="lazy">
        <span class="card-duration">${v.duration}</span>
        ${isNew && !isWatched ? '<span class="card-new">NEW</span>' : ''}
        <span class="card-watched-badge">✓ ${watchCount}회</span>
        <div class="card-play-icon"></div>
        <div class="card-inner-info">
          <div class="card-inner-title">${v.title}</div>
          <div class="card-inner-desc">${v.desc || ''}</div>
        </div>
        <div class="card-progress">
          <div class="card-progress-bar" style="width: 100%"></div>
        </div>
      </div>
    </article>
  `;
}

function isRecent(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / (1000 * 60 * 60 * 24);
  return diff <= 7;
}

// ===== 영상 재생 모달 =====
function openPlayer(videoId) {
  const v = videos.find(x => x.id === videoId);
  if (!v) return;

  document.getElementById('modalTitle').textContent = v.title;
  document.getElementById('modalDesc').textContent = v.desc || '';
  document.getElementById('modalDuration').textContent = `⏱ ${v.duration}`;
  document.getElementById('modalDate').textContent = v.date;
  document.getElementById('modalTags').innerHTML =
    v.tags.map(t => `<span class="modal-tag">#${t}</span>`).join('');

  document.getElementById('videoContainer').innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1"
      allow="autoplay; encrypted-media"
      allowfullscreen></iframe>
  `;

  document.getElementById('modalOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
  markWatched(videoId);
}

function closePlayer() {
  document.getElementById('videoContainer').innerHTML = '';
  document.getElementById('modalOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

function closeModal(event) {
  if (event.target === document.getElementById('modalOverlay')) closePlayer();
}
