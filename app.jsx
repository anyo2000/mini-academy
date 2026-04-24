/* ================================================================
 *  미니연수원 — React App
 *  - videos.json 로딩
 *  - 사번 로그인 + 사용자별 시청기록 (localStorage)
 *  - YouTube 재생 (풀스크린 가로 플레이어)
 *  - 카테고리 필터, 검색, 내 학습 탭
 * ================================================================ */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ============================================================
 *  설정 — 그라데이션, 테마, 카테고리
 * ============================================================ */

const GRADIENTS = [
  ['#7a3b00', '#ff8a3d'], ['#1a3a5c', '#4d8fcc'], ['#3d1a5c', '#9d5fdb'],
  ['#5c1a3a', '#db5f8f'], ['#1a5c3a', '#4dcc8f'], ['#5c3a1a', '#cc8f4d'],
  ['#2a2a4c', '#6a6acc'], ['#4c2a2a', '#cc6a6a'], ['#2a4c2a', '#6acc6a'],
  ['#4c3a2a', '#ccaa6a'], ['#3a2a4c', '#9a6acc'], ['#2a4c4c', '#6accaa'],
  ['#4c2a4c', '#cc6acc'], ['#4c4c2a', '#ccca6a'], ['#1a1a3a', '#3a3a8a'],
  ['#3a1a1a', '#8a3a3a'], ['#1a3a1a', '#3a8a3a'], ['#3a3a1a', '#8a8a3a'],
  ['#2a1a3a', '#7a3a9a'], ['#3a1a2a', '#9a3a7a'],
];

// chapter(개론/L/I/N/K) 기반 테마
const CAT_THEMES = {
  '개론': { accent: '#FF6600', bg1: '#12182a', bg2: '#0a0d18', glow: 'rgba(255,102,0,0.16)' },
  'L':   { accent: '#4A9EFF', bg1: '#0f1a2e', bg2: '#080d1a', glow: 'rgba(74,158,255,0.18)' },
  'I':   { accent: '#FFB838', bg1: '#1f1a0a', bg2: '#120e05', glow: 'rgba(255,184,56,0.18)' },
  'N':   { accent: '#9B7FFF', bg1: '#1a1430', bg2: '#0e0920', glow: 'rgba(155,127,255,0.2)' },
  'K':   { accent: '#2ECC71', bg1: '#0d1f17', bg2: '#06110c', glow: 'rgba(46,204,113,0.2)' },
};
const DEFAULT_THEME = CAT_THEMES['개론'];

// 섹션 정의 (홈에서 그룹핑용)
const SECTIONS = [
  { key: '개론', title: '개론', subtitle: '왜 LINK인가', tabLabel: '개론' },
  { key: 'L', title: 'L · 연결', subtitle: '3초 안에 고객을 붙잡는 법', tabLabel: 'L · 연결' },
  { key: 'I', title: 'I · 이슈', subtitle: '숫자로 한 방 먹이기', tabLabel: 'I · 이슈' },
  { key: 'N', title: 'N · 설계', subtitle: '넣는 게 아니라 빼는 기술', tabLabel: 'N · 설계' },
  { key: 'K', title: 'K · 해결', subtitle: '지금 결정하게 만드는 법', tabLabel: 'K · 해결' },
];

const FILTER_TABS = ['홈'].concat(SECTIONS.map(function(s) { return s.tabLabel; }));

// 탭 라벨 → chapter key 매핑
function tabToChapter(tab) {
  var sec = SECTIONS.find(function(s) { return s.tabLabel === tab; });
  return sec ? sec.key : null;
}

// chapter key → 섹션 타이틀
function sectionTitle(chapter) {
  var sec = SECTIONS.find(function(s) { return s.key === chapter; });
  return sec ? sec.title : chapter;
}

// chapter key → 섹션 소제목
function sectionSubtitle(chapter) {
  var sec = SECTIONS.find(function(s) { return s.key === chapter; });
  return sec ? sec.subtitle : '';
}

/* ============================================================
 *  유틸리티
 * ============================================================ */

function gradientFor(id) {
  const n = parseInt(String(id).replace(/\D/g, ''), 10) || 0;
  return GRADIENTS[n % GRADIENTS.length];
}

function themeFor(chapter) {
  return CAT_THEMES[chapter] || DEFAULT_THEME;
}

function isRecent(dateStr, days) {
  if (days === undefined) days = 7;
  const d = new Date(dateStr);
  const now = new Date();
  return (now - d) / (1000 * 60 * 60 * 24) <= days;
}

function parseDuration(dur) {
  var parts = dur.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

function formatSec(sec) {
  var m = Math.floor(sec / 60);
  var s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function daysAgoText(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return diff + '일 전';
  if (diff < 30) return Math.floor(diff / 7) + '주 전';
  return Math.floor(diff / 30) + '개월 전';
}

/* ============================================================
 *  아이콘
 * ============================================================ */

function Icon({ name, size }) {
  if (!size) size = 22;
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case 'home':
      return <svg {...c}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9.5z"/></svg>;
    case 'home-fill':
      return <svg {...c} fill="currentColor" stroke="none"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9.5z"/></svg>;
    case 'my':
      return <svg {...c}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>;
    case 'my-fill':
      return <svg {...c} fill="currentColor" stroke="none"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>;
    case 'search':
      return <svg {...c}><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>;
    case 'play-circle':
      return <svg {...c}><circle cx="12" cy="12" r="9.2"/><path d="M10 8.5v7l6-3.5-6-3.5z" fill="currentColor"/></svg>;
    case 'bookmark':
      return <svg {...c}><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/></svg>;
    case 'bookmark-fill':
      return <svg {...c} fill="currentColor" stroke="none"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/></svg>;
    case 'thumb':
      return <svg {...c}><path d="M7 11v9H4v-9h3zm3 9V11l4-8c1.1 0 2 .9 2 2v4h5a2 2 0 0 1 2 2l-1.5 7.5A2 2 0 0 1 19.5 20H10z"/></svg>;
    case 'thumb-fill':
      return <svg {...c} fill="currentColor" stroke="none"><path d="M7 11v9H4v-9h3zm3 9V11l4-8c1.1 0 2 .9 2 2v4h5a2 2 0 0 1 2 2l-1.5 7.5A2 2 0 0 1 19.5 20H10z"/></svg>;
    case 'message':
      return <svg {...c}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/></svg>;
    case 'x':
      return <svg {...c} strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case 'back':
      return <svg {...c} strokeWidth="2.2"><path d="M15 5l-7 7 7 7"/></svg>;
    default: return null;
  }
}

function PlayIcon({ size }) {
  if (!size) size = 12;
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
      <path d="M4 2.5v11c0 .4.4.6.7.4l9-5.5c.3-.2.3-.6 0-.8l-9-5.5C4.4 1.9 4 2.1 4 2.5z"/>
    </svg>
  );
}

function CheckIcon({ size }) {
  if (!size) size = 11;
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M3 8l3.5 3.5L13 5"/>
    </svg>
  );
}

/* ============================================================
 *  Header
 * ============================================================ */

function Header({ userId, onShowLogin, onShowSearch }) {
  return (
    <div className="header">
      <div className="logo"><img src="assets/logo-full.png" alt="미니연수원" /></div>
      <div className="header-right">
        <button className="header-icon" onClick={onShowSearch} aria-label="검색">
          <Icon name="search" size={18} />
        </button>
        {userId ? (
          <div className="badge-id" onClick={onShowLogin}>
            <span className="dot" />
            <span className="num">{userId}</span>
            <span>님</span>
          </div>
        ) : (
          <div className="badge-id" onClick={onShowLogin}>
            <span style={{ color: 'var(--text-mute)' }}>사번 입력</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 *  CategoryStrip
 * ============================================================ */

function CategoryStrip({ active, onChange }) {
  var ch = tabToChapter(active);
  var theme = ch ? themeFor(ch) : DEFAULT_THEME;
  return (
    <div className="cat-strip" style={{ '--cat-accent': theme.accent }}>
      <div className="cat-row no-scrollbar">
        {FILTER_TABS.map(function(tab) {
          return (
            <button
              key={tab}
              className={'cat-pill' + (active === tab ? ' active' : '')}
              onClick={function() { onChange(tab); }}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 *  TabBar (하단)
 * ============================================================ */

function TabBar({ active, onChange }) {
  return (
    <nav className="tabbar">
      <button className={'tab-btn' + (active === 'home' ? ' active' : '')} onClick={function() { onChange('home'); }}>
        <Icon name={active === 'home' ? 'home-fill' : 'home'} />
        홈
      </button>
      <button className={'tab-btn' + (active === 'my' ? ' active' : '')} onClick={function() { onChange('my'); }}>
        <Icon name={active === 'my' ? 'my-fill' : 'my'} />
        내 학습
      </button>
    </nav>
  );
}

/* ============================================================
 *  Hero
 * ============================================================ */

function Hero({ video, onOpen }) {
  if (!video) return null;
  var theme = themeFor(video.chapter);
  var chapterLabel = video.chapter === '개론' ? '개론' : video.chapter + '단계';
  var mainTitle = video.title.split(' — ')[0];
  var subTitle = video.title.includes(' — ') ? video.title.split(' — ').slice(1).join(' — ') : mainTitle;
  var thumbStyle = {
    background:
      'radial-gradient(ellipse at 30% 20%, ' + theme.glow + ', transparent 60%), ' +
      'radial-gradient(ellipse at 70% 80%, rgba(30,50,90,0.35), transparent 65%), ' +
      'linear-gradient(160deg, ' + theme.bg1 + ' 0%, ' + theme.bg2 + ' 100%)',
  };

  return (
    <div className="hero" onClick={function() { onOpen(video); }}>
      <div className="hero-thumb" style={thumbStyle}>
        <div className="hero-thumb-brand">
          <div className="brand-name" style={{ color: theme.accent }}>LINK CONSULTING</div>
          <div className="brand-line" style={{ background: 'linear-gradient(to right, ' + theme.accent + '99, transparent)' }} />
        </div>
        <div className="hero-thumb-chapter">{chapterLabel}</div>
        <div className="hero-thumb-title">{mainTitle}</div>
      </div>
      <div className="hero-bottom" style={{ background: 'linear-gradient(to bottom, ' + theme.bg1 + ' 0%, ' + theme.bg2 + ' 100%)' }}>
        <div className="hero-ep-tag">{video.id === 'intro' ? 'OVERVIEW' : 'EP.' + String(video.idx).padStart(2, '0') + ' · ' + video.chapter}</div>
        <h2 className="hero-title">{subTitle}</h2>
        <div className="hero-cta-row">
          <button className="hero-cta" onClick={function(e) { e.stopPropagation(); onOpen(video); }}>
            <PlayIcon size={14} /> 바로 재생
          </button>
          <span className="hero-meta">{video.duration}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 *  VideoCard
 * ============================================================ */

function VideoCard({ video, watched, watchCount, likeCount, onClick }) {
  var theme = themeFor(video.chapter);
  var isNew = isRecent(video.date);
  var mainTitle = video.title.split(' — ')[0];
  var subTitle = video.title.includes(' — ') ? video.title.split(' — ').slice(1).join(' — ') : mainTitle;
  var chapterTag = video.chapter === '개론' ? video.chapter + ' · ' + video.idx : video.chapter + '단계 · ' + video.idx;
  var thumbStyle = {
    background:
      'radial-gradient(ellipse at 30% 20%, ' + theme.glow + ', transparent 60%), ' +
      'radial-gradient(ellipse at 70% 80%, rgba(30,40,60,0.3), transparent 65%), ' +
      'linear-gradient(160deg, ' + theme.bg1 + ' 0%, ' + theme.bg2 + ' 100%)',
  };

  return (
    <div className={'card' + (watched ? ' watched' : '')} onClick={function() { onClick(video); }}>
      <div className="card-thumb-full" style={thumbStyle}>
        <div className="card-thumb-glow" style={{ background: 'radial-gradient(circle, ' + theme.glow + ', transparent 65%)' }} />
        <div className="card-brand">
          <span style={{ color: theme.accent }}>LINK CONSULTING</span>
          <div className="brand-line" style={{ background: 'linear-gradient(to right, ' + theme.accent + '99, transparent)' }} />
        </div>
        <div className="card-chapter-tag">{chapterTag}</div>
        <div className="card-content-area">
          <div className="card-main-title">{mainTitle}</div>
          <div className="card-overlay-meta">
            <span className="card-overlay-sub">{subTitle}</span>
            <div className="card-overlay-bottom">
              <span className="card-dur-light">{video.duration}</span>
              {isNew && !watched && <span className="card-new">NEW</span>}
              {watched && <span className="card-done-chip"><CheckIcon size={10} />완료</span>}
              {likeCount > 0 && <span className="card-like-count">♥ {likeCount}</span>}
            </div>
          </div>
        </div>
      </div>
      {watched && (
        <div className="card-progress"><div className="fill" style={{ width: '100%', background: theme.accent }} /></div>
      )}
    </div>
  );
}

/* ============================================================
 *  Section (가로 스크롤 행)
 * ============================================================ */

function Section({ title, subtitle, count, videos, layout, isWatched, getWatchCount, getLikeCount, onOpen, isTop, chapterKey }) {
  if (!videos || videos.length === 0) return null;
  var dotColor = chapterKey ? (themeFor(chapterKey).accent || 'var(--orange)') : 'var(--orange)';
  return (
    <div className={'section' + (isTop ? ' top' : '')}>
      <div className="section-head" style={{ '--section-accent': dotColor }}>
        <h3 className="section-title">
          {title}
          {count > 0 && <span className="section-count">({count}편)</span>}
        </h3>
        {subtitle && <span className="section-subtitle">{subtitle}</span>}
      </div>
      <div className={'card-row no-scrollbar' + (layout === 'stack' ? ' stack' : '')}>
        {videos.map(function(v) {
          return (
            <VideoCard
              key={v.id}
              video={v}
              watched={isWatched(v.id)}
              watchCount={getWatchCount(v.id)}
              likeCount={getLikeCount ? getLikeCount(v.id) : 0}
              onClick={onOpen}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 *  LoginOverlay
 * ============================================================ */

function LoginOverlay({ initialId, onSubmit, onClose }) {
  var inputRef = useRef(null);
  var _s = useState(false); var hasError = _s[0]; var setError = _s[1];

  useEffect(function() {
    if (inputRef.current) {
      if (initialId) inputRef.current.value = initialId;
      setTimeout(function() { inputRef.current && inputRef.current.focus(); }, 100);
    }
  }, []);

  function handleSubmit() {
    var val = inputRef.current.value.trim();
    if (val.length !== 7 || !/^\d{7}$/.test(val)) {
      setError(true);
      inputRef.current.focus();
      return;
    }
    setError(false);
    onSubmit(val);
  }

  function handleKeyUp(e) {
    if (hasError) setError(false);
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="login-backdrop">
      <div className="login-modal">
        <div className="login-icon">🎓</div>
        <h2>미니연수원</h2>
        <div className="sub">MINI ACADEMY</div>
        <p>사번 7자리를 입력해주세요</p>
        <input
          ref={inputRef}
          type="text"
          maxLength="7"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0000000"
          autoComplete="off"
          className={hasError ? 'error' : ''}
          onKeyUp={handleKeyUp}
        />
        <button className="login-submit" onClick={handleSubmit}>시작하기</button>
        {initialId && (
          <button
            onClick={onClose}
            style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            닫기
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 *  SearchOverlay
 * ============================================================ */

function SearchOverlay({ videos, onSelect, onClose }) {
  var _s = useState(''); var query = _s[0]; var setQuery = _s[1];
  var inputRef = useRef(null);

  useEffect(function() {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  var results = useMemo(function() {
    if (!query.trim()) return [];
    var q = query.trim().toLowerCase();
    return videos.filter(function(v) {
      return v.title.toLowerCase().includes(q) ||
             (v.desc && v.desc.toLowerCase().includes(q)) ||
             v.chapter.toLowerCase().includes(q) ||
             (v.instructor && v.instructor.toLowerCase().includes(q));
    });
  }, [query, videos]);

  var tags = useMemo(function() {
    var set = {};
    videos.forEach(function(v) { set[v.chapter] = true; });
    return Object.keys(set);
  }, [videos]);

  return (
    <div className="search-overlay">
      <div className="search-bar">
        <input
          ref={inputRef}
          value={query}
          onChange={function(e) { setQuery(e.target.value); }}
          placeholder="영상 제목, 태그로 검색"
        />
        <button className="cancel" onClick={onClose}>취소</button>
      </div>
      <div className="search-results no-scrollbar">
        {!query.trim() && (
          <>
            <div className="search-suggest-title">추천 태그</div>
            <div className="search-chip-row">
              {tags.map(function(t) {
                return <span key={t} className="search-chip" onClick={function() { setQuery(t); }}>{t}</span>;
              })}
            </div>
          </>
        )}
        {query.trim() && results.length === 0 && (
          <div className="search-empty">검색 결과가 없습니다</div>
        )}
        {results.map(function(v) {
          var gr = gradientFor(v.id);
          return (
            <div key={v.id} className="search-row" onClick={function() { onSelect(v); onClose(); }}>
              <div className="search-thumb" style={{ background: 'linear-gradient(135deg, ' + gr[0] + ', ' + gr[1] + ')' }}>
                <div className="search-thumb-kw">{v.title}</div>
              </div>
              <div>
                <div className="search-title">{v.title}</div>
                <div className="search-sub">{sectionTitle(v.chapter)} · {v.duration}</div>
              </div>
              <div className="search-dur">{v.duration}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 *  VideoModal (영상 상세)
 * ============================================================ */

function VideoModal({ video, allVideos, onClose, onOpen, onPlay, userId }) {
  // 좋아요 (Firestore — 영상별 문서)
  var _likes = useState([]);
  var videoLikes = _likes[0]; var setVideoLikes = _likes[1];
  var liked = userId && videoLikes.indexOf(userId) !== -1;
  var likeCount = videoLikes.length;

  function toggleLike() {
    if (!userId || !video) return;
    var arr = videoLikes.slice();
    var idx = arr.indexOf(userId);
    if (idx === -1) { arr.push(userId); } else { arr.splice(idx, 1); }
    setVideoLikes(arr);
    db.collection('likes').doc(video.id).set({ users: arr });
  }

  // 나중에 보기 (Firestore — 사용자별 문서)
  var _bm = useState([]);
  var bookmarks = _bm[0]; var setBookmarks = _bm[1];
  var bookmarked = video && bookmarks.indexOf(video.id) !== -1;

  function toggleBookmark() {
    if (!userId || !video) return;
    var arr = bookmarks.slice();
    var idx = arr.indexOf(video.id);
    if (idx === -1) { arr.push(video.id); } else { arr.splice(idx, 1); }
    setBookmarks(arr);
    db.collection('bookmarks').doc(userId).set({ videoIds: arr });
  }

  // 댓글 (Firestore — 영상별 서브컬렉션)
  var _comments = useState([]);
  var videoComments = _comments[0]; var setVideoComments = _comments[1];
  var _commentText = useState(''); var commentText = _commentText[0]; var setCommentText = _commentText[1];
  var _showAllComments = useState(false); var showAllComments = _showAllComments[0]; var setShowAllComments = _showAllComments[1];

  var commentCount = videoComments.length;
  var visibleComments = showAllComments ? videoComments : videoComments.slice(-3);

  function addComment() {
    if (!userId || !video || !commentText.trim()) return;
    var newComment = { userId: userId, text: commentText.trim(), date: new Date().toISOString(), id: Date.now() };
    var arr = videoComments.concat([newComment]);
    setVideoComments(arr);
    db.collection('comments').doc(video.id).set({ list: arr });
    setCommentText('');
  }

  function deleteComment(commentId) {
    if (!video) return;
    var arr = videoComments.filter(function(c) { return c.id !== commentId; });
    setVideoComments(arr);
    db.collection('comments').doc(video.id).set({ list: arr });
  }

  useEffect(function() {
    if (!video) return;
    document.body.style.overflow = 'hidden';
    setShowAllComments(false);

    // Firestore에서 데이터 로드
    db.collection('likes').doc(video.id).get().then(function(doc) {
      setVideoLikes(doc.exists ? (doc.data().users || []) : []);
    });
    db.collection('comments').doc(video.id).get().then(function(doc) {
      setVideoComments(doc.exists ? (doc.data().list || []) : []);
    });
    if (userId) {
      db.collection('bookmarks').doc(userId).get().then(function(doc) {
        setBookmarks(doc.exists ? (doc.data().videoIds || []) : []);
      });
    }

    var handler = function(e) { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return function() {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [video]);

  if (!video) return null;
  var gr = gradientFor(video.id);

  return (
    <div className={'modal-backdrop' + (video ? ' open' : '')} onClick={onClose}>
      <div className="modal-sheet" onClick={function(e) { e.stopPropagation(); }}>
        <div className="modal-video" style={{ background: 'linear-gradient(135deg, ' + gr[0] + ' 0%, ' + gr[1] + ' 100%)' }} onClick={function() { onPlay(video); }}>
          <div className="modal-video-title">{video.title}</div>
          <button className="modal-play-btn" aria-label="재생">
            <PlayIcon size={20} />
          </button>
          <button className="modal-close" onClick={function(e) { e.stopPropagation(); onClose(); }} aria-label="닫기">
            <Icon name="x" size={14} />
          </button>
          <div className="modal-time-strip" onClick={function(e) { e.stopPropagation(); }}>
            <span>00:00</span>
            <div className="scrub" />
            <span>{video.duration}</span>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-meta-row">
            <span className="modal-tag orange">{sectionTitle(video.chapter)}</span>
            {isRecent(video.date) && <span className="modal-tag new">NEW</span>}
          </div>
          <h2 className="modal-title">{video.title}</h2>
          <div className="modal-submeta">
            <span>{video.duration}</span>
            <span className="dot" />
            <span>{daysAgoText(video.date)} 등록</span>
          </div>

          <div className="modal-actions">
            <button className={'modal-action-btn' + (liked ? ' active' : '')} onClick={toggleLike}>
              <Icon name={liked ? 'thumb-fill' : 'thumb'} size={18} />
              <span>좋아요{likeCount > 0 ? ' ' + likeCount : ''}</span>
            </button>
            <button className={'modal-action-btn' + (bookmarked ? ' active' : '')} onClick={toggleBookmark}>
              <Icon name={bookmarked ? 'bookmark-fill' : 'bookmark'} size={18} />
              <span>나중에</span>
            </button>
            <button className="modal-action-btn" onClick={function() { var el = document.querySelector('.comment-input'); if (el) el.focus(); }}>
              <Icon name="message" size={18} />
              <span>댓글{commentCount > 0 ? ' ' + commentCount : ''}</span>
            </button>
          </div>

          {video.desc && <p className="modal-desc">{video.desc}</p>}

          <div className="modal-comments">
            <div className="comments-header">댓글 {commentCount > 0 && <span className="comments-count">{commentCount}</span>}</div>
            {commentCount > 3 && !showAllComments && (
              <button className="comments-more" onClick={function() { setShowAllComments(true); }}>
                이전 댓글 {commentCount - 3}개 더보기
              </button>
            )}
            {visibleComments.map(function(c) {
              return (
                <div key={c.id} className="comment-item">
                  <div className="comment-top">
                    <span className="comment-user">{c.userId}</span>
                    <span className="comment-date">{daysAgoText(c.date.slice(0, 10))}</span>
                    {(c.userId === userId) && (
                      <button className="comment-delete" onClick={function() { deleteComment(c.id); }}>삭제</button>
                    )}
                  </div>
                  <div className="comment-text">{c.text}</div>
                </div>
              );
            })}
            {commentCount === 0 && <div className="comments-empty">아직 댓글이 없습니다</div>}
            <div className="comment-write">
              <input
                className="comment-input"
                placeholder={userId ? '댓글을 입력하세요' : '로그인 후 댓글을 쓸 수 있습니다'}
                value={commentText}
                onChange={function(e) { setCommentText(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') addComment(); }}
                disabled={!userId}
              />
              <button className="comment-submit" onClick={addComment} disabled={!userId || !commentText.trim()}>등록</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 *  FullscreenPlayer (가로 90° 회전 + YouTube 재생)
 * ============================================================ */

function FullscreenPlayer({ video, onClose, onAddWatchTime }) {
  var _vis = useState(true);
  var controlsVisible = _vis[0]; var setControlsVisible = _vis[1];
  var ytApiAvailable = !!(window.YT && window.YT.Player);
  var hideTimer = useRef(null);
  var playerRef = useRef(null);
  var tickRef = useRef(null);
  var sessionSec = useRef(0);
  var maxSec = useRef(0);

  function hideAfterDelay() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(function() { setControlsVisible(false); }, 4000);
  }

  function showControls() {
    setControlsVisible(true);
    hideAfterDelay();
  }

  function startTick() {
    if (tickRef.current) return;
    tickRef.current = setInterval(function() {
      if (sessionSec.current < maxSec.current) {
        sessionSec.current += 1;
      }
    }, 1000);
  }

  function stopTick() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }

  function handleClose() {
    stopTick();
    if (sessionSec.current > 0 && onAddWatchTime) {
      onAddWatchTime(video.id, sessionSec.current);
    }
    if (playerRef.current && playerRef.current.destroy) {
      try { playerRef.current.destroy(); } catch(e) {}
    }
    playerRef.current = null;
    onClose();
  }

  useEffect(function() {
    if (!video) return;
    document.body.style.overflow = 'hidden';
    maxSec.current = parseDuration(video.duration);
    sessionSec.current = 0;

    var hasYoutube = video.youtubeId && video.youtubeId !== '';

    if (hasYoutube && ytApiAvailable) {
      playerRef.current = new window.YT.Player('yt-player-div', {
        videoId: video.youtubeId,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: function(e) {
            if (e.data === window.YT.PlayerState.PLAYING) {
              startTick();
            } else {
              stopTick();
            }
          }
        }
      });
    }

    var handler = function(e) { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    hideAfterDelay();
    return function() {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
      stopTick();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [video]);

  if (!video) return null;
  var gr = gradientFor(video.id);
  var hasYoutube = video.youtubeId && video.youtubeId !== '';

  return (
    <div className="player-root">
      <div className="player-rotate">
        <div className="player-stage" style={{ background: 'linear-gradient(135deg, ' + gr[0] + ' 0%, ' + gr[1] + ' 100%)' }}>
          {hasYoutube && ytApiAvailable ? (
            <div id="yt-player-div" style={{ width: '100%', height: '100%' }} />
          ) : hasYoutube ? (
            <iframe
              src={'https://www.youtube.com/embed/' + video.youtubeId + '?autoplay=1&playsinline=1&rel=0&modestbranding=1'}
              title={video.title}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 0 }}
            />
          ) : (
            <div className="player-placeholder">
              <div className="ph-title">{video.title}</div>
              <div className="ph-sub">영상이 준비 중입니다</div>
            </div>
          )}
          {!controlsVisible && (
            <div className="player-touch-layer" onClick={showControls} />
          )}
          <div className={'player-controls-overlay' + (controlsVisible ? '' : ' hidden')}>
            <button className="player-back-btn" onClick={function(e) { e.stopPropagation(); handleClose(); }} aria-label="뒤로">
              <Icon name="back" size={16} />
            </button>
            <span className="player-title-text">{video.title}</span>
            <button className="player-close-btn" onClick={function(e) { e.stopPropagation(); handleClose(); }} aria-label="닫기">
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 *  MyLearning (내 학습 탭)
 * ============================================================ */

function MyLearning({ videos, watchHistory, onOpen }) {
  var rows = useMemo(function() {
    var list = [];
    Object.keys(watchHistory).forEach(function(vid) {
      var v = videos.find(function(x) { return x.id === vid; });
      if (v) {
        var entry = watchHistory[vid];
        list.push(Object.assign({}, v, {
          watchCount: entry.count,
          lastWatched: entry.lastWatched,
          watchedSec: entry.watchedSec || 0,
        }));
      }
    });
    list.sort(function(a, b) { return new Date(b.lastWatched) - new Date(a.lastWatched); });
    return list;
  }, [videos, watchHistory]);

  var completed = rows.filter(function(r) { return r.watchCount > 0; }).length;
  var totalMin = useMemo(function() {
    return rows.reduce(function(acc, r) {
      return acc + (r.watchedSec || 0) / 60;
    }, 0);
  }, [rows]);

  if (videos.length === 0) {
    return (
      <div className="mypage tab-view content-scroll">
        <div className="loading-state">
          <div className="spinner" />
          <span>불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage tab-view content-scroll">
      <div className="mypage-hero">
        <h1>내 학습</h1>
        <p>{completed > 0 ? '꾸준히 달리고 있어요!' : '아직 시청한 영상이 없어요'}</p>
      </div>

      <div className="stats-row">
        <div className="stat-box accent">
          <div className="num">{completed}<span className="unit">편</span></div>
          <div className="label">시청 완료</div>
        </div>
        <div className="stat-box">
          <div className="num">{rows.reduce(function(a, r) { return a + r.watchCount; }, 0)}<span className="unit">회</span></div>
          <div className="label">총 시청</div>
        </div>
        <div className="stat-box">
          <div className="num">{Math.round(totalMin)}<span className="unit">분</span></div>
          <div className="label">시청시간</div>
        </div>
      </div>

      <div className="my-list-head">
        <h2>완료 배지</h2>
        <span className="filter">{completed}/{videos.length}</span>
      </div>
      <div className="achievements">
        <div className={'ach-tile' + (completed >= 1 ? ' earned' : '')}>
          <span className="emoji">🎯</span>
          <div className="label">첫 완주</div>
        </div>
        <div className={'ach-tile' + (completed >= 3 ? ' earned' : '')}>
          <span className="emoji">🔥</span>
          <div className="label">3편 달성</div>
        </div>
        <div className={'ach-tile' + (completed >= 5 ? ' earned' : '')}>
          <span className="emoji">⚡</span>
          <div className="label">5편 돌파</div>
        </div>
        <div className={'ach-tile' + (completed >= 10 ? ' earned' : '')}>
          <span className="emoji">🏆</span>
          <div className="label">10편 마스터</div>
        </div>
        <div className={'ach-tile' + (totalMin >= 30 ? ' earned' : '')}>
          <span className="emoji">⏱️</span>
          <div className="label">30분 학습</div>
        </div>
        <div className={'ach-tile' + (completed >= 20 ? ' earned' : '')}>
          <span className="emoji">💎</span>
          <div className="label">전체 완주</div>
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="my-list-head">
            <h2>최근 시청</h2>
            <span className="filter">최신순</span>
          </div>
          <div className="my-list">
            {rows.map(function(r) {
              var gr = gradientFor(r.id);
              return (
                <div key={r.id} className="my-row" onClick={function() { onOpen(r); }}>
                  <div className="my-thumb" style={{ background: 'linear-gradient(135deg, ' + gr[0] + ', ' + gr[1] + ')' }}>
                    <div className="my-thumb-text">{r.title}</div>
                    <div className="my-thumb-progress">
                      <div className="fill" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div className="my-info">
                    <h4 className="my-title">{r.title}</h4>
                    <div className="my-sub">
                      <span>{sectionTitle(r.chapter)}</span>
                      <span style={{ color: 'var(--text-mute)' }}>·</span>
                      <span>{daysAgoText(r.lastWatched)}</span>
                    </div>
                    <div className="my-cont-btn">
                      <span className="my-progress-pct done">✓ {r.watchCount}회 시청</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {rows.length === 0 && (
        <div className="empty-state">
          <span className="emoji">📺</span>
          <p>영상을 시청하면 여기에 기록돼요</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 *  App (메인)
 * ============================================================ */

function App() {
  // 데이터
  var _v = useState([]); var videos = _v[0]; var setVideos = _v[1];
  var _loading = useState(true); var loading = _loading[0]; var setLoading = _loading[1];

  // 인증
  var _u = useState(function() { return localStorage.getItem('mini-academy-userId') || null; });
  var userId = _u[0]; var setUserId = _u[1];
  var _login = useState(false); var loginOpen = _login[0]; var setLoginOpen = _login[1];

  // 시청 기록
  var _wh = useState({}); var watchHistory = _wh[0]; var setWatchHistory = _wh[1];

  // 좋아요 (Firestore에서 로드)
  var _appLikes = useState({});
  var appLikes = _appLikes[0]; var setAppLikes = _appLikes[1];

  var getLikeCount = useCallback(function(videoId) {
    return (appLikes[videoId] || []).length;
  }, [appLikes]);

  function refreshLikes() {
    db.collection('likes').get().then(function(snapshot) {
      var result = {};
      snapshot.forEach(function(doc) { result[doc.id] = doc.data().users || []; });
      setAppLikes(result);
    });
  }

  // 앱 시작 시 좋아요 로드
  useEffect(function() { refreshLikes(); }, []);

  // UI
  var _tab = useState('home'); var tab = _tab[0]; var setTab = _tab[1];
  var _cat = useState('홈'); var cat = _cat[0]; var setCat = _cat[1];
  var _modal = useState(null); var modalVideo = _modal[0]; var setModalVideo = _modal[1];
  var _player = useState(null); var playerVideo = _player[0]; var setPlayerVideo = _player[1];
  var _search = useState(false); var searchOpen = _search[0]; var setSearchOpen = _search[1];

  // 데이터 로딩
  useEffect(function() {
    fetch('videos.json')
      .then(function(r) { return r.json(); })
      .then(function(data) { setVideos(data); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, []);

  // 첫 진입 시 사번 없으면 로그인
  useEffect(function() {
    if (!userId) setLoginOpen(true);
  }, []);

  // 시청 기록 로드 (Firestore)
  useEffect(function() {
    if (!userId) { setWatchHistory({}); return; }
    db.collection('watchHistory').doc(userId).get().then(function(doc) {
      setWatchHistory(doc.exists ? doc.data() : {});
    });
  }, [userId]);

  // 시청 기록 저장 (Firestore)
  var saveHistory = useCallback(function(next) {
    if (!userId) return;
    db.collection('watchHistory').doc(userId).set(next);
  }, [userId]);

  // 시청 시간 누적 (플레이어 닫힐 때 호출)
  var addWatchTime = useCallback(function(videoId, sec) {
    setWatchHistory(function(prev) {
      var v = videos.find(function(x) { return x.id === videoId; });
      var maxSec = v ? parseDuration(v.duration) : 9999;
      var entry = prev[videoId] || { count: 0, lastWatched: '', watchedSec: 0 };
      // 이번 세션 시청 시간 (영상 길이 제한)
      var sessionCapped = Math.min(sec, maxSec);
      var newWatchedSec = (entry.watchedSec || 0) + sessionCapped;
      // 80% 이상 누적 시청 시 완료 카운트 +1
      var threshold = maxSec * 0.8;
      var wasComplete = (entry.watchedSec || 0) >= threshold;
      var nowComplete = newWatchedSec >= threshold;
      var newCount = entry.count + (nowComplete && !wasComplete ? 1 : 0);
      var next = Object.assign({}, prev);
      next[videoId] = {
        count: newCount,
        lastWatched: new Date().toISOString(),
        watchedSec: newWatchedSec
      };
      saveHistory(next);
      return next;
    });
  }, [saveHistory, videos]);

  var isWatched = useCallback(function(videoId) {
    if (!watchHistory[videoId]) return false;
    var entry = watchHistory[videoId];
    var v = videos.find(function(x) { return x.id === videoId; });
    if (!v) return entry.count > 0;
    var maxSec = parseDuration(v.duration);
    return (entry.watchedSec || 0) >= maxSec * 0.8;
  }, [watchHistory, videos]);

  var getWatchCount = useCallback(function(videoId) {
    return watchHistory[videoId] ? watchHistory[videoId].count : 0;
  }, [watchHistory]);

  // 로그인
  function handleLogin(id) {
    setUserId(id);
    localStorage.setItem('mini-academy-userId', id);
    setLoginOpen(false);
  }

  // 재생
  function handlePlay(video) {
    setModalVideo(null);
    setPlayerVideo(video);
  }

  // 필터링 — 탭 선택에 따라 chapter 기준
  var filtered = useMemo(function() {
    if (cat === '홈') return videos;
    var ch = tabToChapter(cat);
    if (!ch) return videos;
    return videos.filter(function(v) { return v.chapter === ch; });
  }, [videos, cat]);

  // 섹션 구성
  var sections = useMemo(function() {
    // 특정 chapter 탭 선택 시 — 해당 chapter만 스택 레이아웃
    if (cat !== '홈') {
      var ch = tabToChapter(cat);
      var sorted = filtered.slice().sort(function(a, b) { return a.idx - b.idx; });
      return [{ title: sectionTitle(ch), subtitle: sectionSubtitle(ch), videos: sorted, count: sorted.length, chapterKey: ch }];
    }

    // 홈 탭 — SECTIONS 순서대로 가로 스크롤
    var result = [];
    SECTIONS.forEach(function(sec) {
      var list = videos.filter(function(v) { return v.chapter === sec.key; });
      list.sort(function(a, b) { return a.idx - b.idx; });
      if (list.length > 0) {
        result.push({ title: sec.title, subtitle: sec.subtitle, videos: list, count: list.length, chapterKey: sec.key });
      }
    });

    return result;
  }, [filtered, videos, cat]);

  // 히어로 — LINK 컨설팅 소개 (고정)
  var heroVideo = useMemo(function() {
    return {
      id: 'intro',
      title: 'LINK 컨설팅 소개',
      desc: 'LINK 컨설팅 프레임워크의 전체 흐름을 한눈에 살펴봅니다.',
      chapter: '개론',
      idx: 0,
      duration: '03:12',
      youtubeId: 'DEVGIlscNEY',
      date: '2026-04-20',
    };
  }, []);

  return (
    <div className="stage">
      {tab === 'home' ? (
        <div className="tab-view content-scroll">
          <Header userId={userId} onShowLogin={function() { setLoginOpen(true); }} onShowSearch={function() { setSearchOpen(true); }} />
          <CategoryStrip active={cat} onChange={setCat} />

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>영상을 불러오는 중...</span>
            </div>
          ) : (
            <>
              {cat === '홈' && heroVideo && <Hero video={heroVideo} onOpen={setModalVideo} />}

              {filtered.length === 0 && (
                <div className="empty-state">
                  <span className="emoji">🔍</span>
                  <p>해당 카테고리의 영상이 없습니다</p>
                </div>
              )}

              {sections.map(function(s, i) {
                return (
                  <Section
                    key={s.title + i}
                    title={s.title}
                    subtitle={s.subtitle}
                    count={s.count}
                    videos={s.videos}
                    layout={cat !== '홈' ? 'stack' : 'row'}
                    isWatched={isWatched}
                    getWatchCount={getWatchCount}
                    getLikeCount={getLikeCount}
                    onOpen={setModalVideo}
                    isTop={s.isTop}
                    chapterKey={s.chapterKey}
                  />
                );
              })}
            </>
          )}
        </div>
      ) : (
        <MyLearning videos={videos} watchHistory={watchHistory} onOpen={setModalVideo} />
      )}

      <TabBar active={tab} onChange={setTab} />

      {modalVideo && (
        <VideoModal
          video={modalVideo}
          allVideos={videos}
          onClose={function() { setModalVideo(null); refreshLikes(); }}
          onOpen={setModalVideo}
          onPlay={handlePlay}
          userId={userId}
        />
      )}

      {playerVideo && (
        <FullscreenPlayer
          video={playerVideo}
          onClose={function() { setPlayerVideo(null); }}
          onAddWatchTime={addWatchTime}
        />
      )}

      {searchOpen && (
        <SearchOverlay
          videos={videos}
          onSelect={setModalVideo}
          onClose={function() { setSearchOpen(false); }}
        />
      )}

      {loginOpen && (
        <LoginOverlay
          initialId={userId}
          onSubmit={handleLogin}
          onClose={function() { setLoginOpen(false); }}
        />
      )}
    </div>
  );
}

/* ============================================================
 *  렌더
 * ============================================================ */
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
