// Future Ceylon - Core Application Logic & State Engine
document.addEventListener('DOMContentLoaded', () => {
  // 1. STATE INITIALIZATION & LOCALSTORAGE HYDRATION
  const DEFAULT_DATA = window.FUTURE_CEYLON_DATA || {};
  let currentCategory = 'all';
  let searchQuery = '';
  let activeArticleId = null;

  // Hydrate Articles with localStorage data
  let savedArticles = [];
  try {
    const raw = localStorage.getItem('future_ceylon_articles');
    if (raw) savedArticles = JSON.parse(raw);
  } catch (e) {
    console.error('Error reading saved articles', e);
  }

  // Hydrate Votes
  let voteStore = {};
  try {
    const rawVotes = localStorage.getItem('future_ceylon_votes');
    if (rawVotes) voteStore = JSON.parse(rawVotes);
  } catch (e) {
    console.error('Error reading votes', e);
  }

  // Hydrate Comments
  let commentStore = {};
  try {
    const rawComments = localStorage.getItem('future_ceylon_comments');
    if (rawComments) commentStore = JSON.parse(rawComments);
  } catch (e) {
    console.error('Error reading comments', e);
  }

  // Merge default articles with any user-submitted articles
  let allArticles = [...(DEFAULT_DATA.articles || [])];
  if (savedArticles.length > 0) {
    allArticles = [...savedArticles, ...allArticles];
  }

  // 2. DOM ELEMENTS
  const tickerContainer = document.getElementById('tickerContainer');
  const leadStoryCard = document.getElementById('leadStoryCard');
  const storiesGrid = document.getElementById('storiesGrid');
  const storiesCount = document.getElementById('storiesCount');
  const miniHotspotList = document.getElementById('miniHotspotList');
  const radarBoard = document.getElementById('radarBoard');
  const blindItemsGrid = document.getElementById('blindItemsGrid');
  const searchInput = document.getElementById('searchInput');
  const categoryPills = document.querySelectorAll('.cat-pill');
  const navItems = document.querySelectorAll('.nav-item');
  const colomboTimeEl = document.getElementById('colomboTime');

  // Modals
  const articleModal = document.getElementById('articleModal');
  const closeArticleModalBtn = document.getElementById('closeArticleModal');
  const tipModal = document.getElementById('tipModal');
  const openTipModalBtn = document.getElementById('openTipModalBtn');
  const closeTipModalBtn = document.getElementById('closeTipModal');
  const footerSpillBtn = document.getElementById('footerSpillBtn');

  // Article Reader Modal Elements
  const modalBadge = document.getElementById('modalBadge');
  const modalCategory = document.getElementById('modalCategory');
  const modalArticleTitle = document.getElementById('modalArticleTitle');
  const modalImage = document.getElementById('modalImage');
  const modalAuthor = document.getElementById('modalAuthor');
  const modalLocation = document.getElementById('modalLocation');
  const modalTime = document.getElementById('modalTime');
  const modalParagraphs = document.getElementById('modalParagraphs');
  const modalAudioPlayer = document.getElementById('modalAudioPlayer');
  const modalAudioPlayBtn = document.getElementById('modalAudioPlayBtn');
  const modalAudioTitle = document.getElementById('modalAudioTitle');
  const countFact = document.getElementById('countFact');
  const countSip = document.getElementById('countSip');
  const countCap = document.getElementById('countCap');
  const countSpicy = document.getElementById('countSpicy');
  const voteButtons = document.querySelectorAll('#articleVoteBox .vote-btn');
  const commentForm = document.getElementById('commentForm');
  const newCommentInput = document.getElementById('newCommentInput');
  const modalCommentsList = document.getElementById('modalCommentsList');
  const commentsCount = document.getElementById('commentsCount');

  // Sharing buttons
  const copyStoryLinkBtn = document.getElementById('copyStoryLinkBtn');
  const whatsappShareBtn = document.getElementById('whatsappShareBtn');
  const xShareBtn = document.getElementById('xShareBtn');

  // Whistleblower Form Elements
  const tipForm = document.getElementById('tipForm');
  const tipSlider = document.getElementById('tipSlider');
  const spiceValue = document.getElementById('spiceValue');

  // Theme & Audio Elements
  const themePills = document.querySelectorAll('.theme-pill-btn');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const audioLabel = document.getElementById('audioLabel');

  // Newsletter Form
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterEmail = document.getElementById('newsletterEmail');

  // Toast
  const toastMsg = document.getElementById('toastMsg');
  const toastText = document.getElementById('toastText');
  const toastIcon = document.getElementById('toastIcon');

  // 3. CLOCK & TIME IN COLOMBO
  function updateColomboTime() {
    try {
      const now = new Date();
      const options = {
        timeZone: 'Asia/Colombo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      const timeStr = now.toLocaleTimeString('en-GB', options);
      if (colomboTimeEl) {
        colomboTimeEl.textContent = `Colombo ${timeStr} IST • 31°C`;
      }
    } catch (e) {
      if (colomboTimeEl) colomboTimeEl.textContent = "Colombo 17:25 IST • 31°C";
    }
  }
  updateColomboTime();
  setInterval(updateColomboTime, 30000);

  // 4. THEME CONTROLLER (3-Palettes: Midnight, Sunset, Emerald)
  const savedTheme = localStorage.getItem('future_ceylon_theme') || 'midnight';
  applyTheme(savedTheme);

  function applyTheme(theme) {
    if (theme === 'sunset') {
      document.documentElement.setAttribute('data-theme', 'sunset');
    } else if (theme === 'emerald') {
      document.documentElement.setAttribute('data-theme', 'emerald');
    } else if (theme === 'champagne') {
      document.documentElement.setAttribute('data-theme', 'champagne');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    themePills.forEach(btn => {
      if (btn.getAttribute('data-theme-set') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    localStorage.setItem('future_ceylon_theme', theme);
  }

  themePills.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-set');
      applyTheme(theme);
      playDispatchBeep();
      const names = {
        midnight: 'Galle Face Midnight 🌙',
        sunset: 'Cinnamon Sunset 🌅',
        emerald: 'Ceylon Emerald Estate 🌿',
        champagne: 'Royale Champagne & Ivory 👑'
      };
      showToast(`Theme transformed to ${names[theme] || theme}`, '🎨');
    });
  });

  // 5. AUDIO SYNTHESIZER (Web Audio API)
  let audioCtx = null;
  let isAudioPlaying = false;
  let ambientOsc = null;
  let ambientGain = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
  }

  function toggleLoungeAudio() {
    initAudio();
    if (!audioCtx) return;

    if (isAudioPlaying) {
      if (ambientGain) {
        ambientGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        setTimeout(() => {
          if (ambientOsc) ambientOsc.stop();
          ambientOsc = null;
        }, 500);
      }
      isAudioPlaying = false;
      audioToggleBtn.classList.remove('playing');
      audioIcon.textContent = '🔈';
      audioLabel.textContent = 'Lofi Ambience';
      showToast('Lofi lounge audio muted', '🔇');
    } else {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      ambientGain = audioCtx.createGain();
      ambientGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      ambientGain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 1.2);

      const biquad = audioCtx.createBiquadFilter();
      biquad.type = 'lowpass';
      biquad.frequency.setValueAtTime(420, audioCtx.currentTime);

      ambientOsc = audioCtx.createOscillator();
      ambientOsc.type = 'triangle';
      ambientOsc.frequency.setValueAtTime(110, audioCtx.currentTime);

      ambientOsc.connect(biquad);
      biquad.connect(ambientGain);
      ambientGain.connect(audioCtx.destination);
      ambientOsc.start();

      isAudioPlaying = true;
      audioToggleBtn.classList.add('playing');
      audioIcon.textContent = '🔊';
      audioLabel.textContent = 'Lofi Playing';
      showToast('Colombo Lounge Ambience playing 🎧', '🎶');
    }
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', toggleLoungeAudio);
  }

  function playDispatchBeep() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.26);
  }

  // 6. RENDER TICKER BANNER
  function renderTicker() {
    if (!tickerContainer) return;
    const items = DEFAULT_DATA.ticker || [];
    tickerContainer.innerHTML = items.map(text => `
      <span class="ticker-item" data-action="ticker-click">${escapeHTML(text)}</span>
    `).join('');

    tickerContainer.querySelectorAll('.ticker-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        if (allArticles[index % allArticles.length]) {
          openArticleModal(allArticles[index % allArticles.length].id);
        }
      });
    });
  }
  renderTicker();

  // 7. RENDER LEAD STORY
  function renderLeadStory() {
    if (!leadStoryCard) return;
    const lead = allArticles.find(a => a.featured) || allArticles[0];
    if (!lead) return;

    leadStoryCard.innerHTML = `
      <img src="${lead.image}" alt="${escapeHTML(lead.title)}" class="lead-image-bg" loading="eager">
      <div class="lead-overlay"></div>
      <div class="lead-content">
        <div class="badge-row">
          <span class="editorial-badge">${escapeHTML(lead.badge || 'EXCLUSIVE')}</span>
          <span class="location-tag">📍 ${escapeHTML(lead.location || 'Colombo')}</span>
          <span style="color:var(--text-muted); font-size:0.8rem;">${lead.readTime || '3 min'}</span>
        </div>
        <h2 class="lead-title">${escapeHTML(lead.title)}</h2>
        <p class="lead-subtitle">${escapeHTML(lead.subtitle || '')}</p>
        <div class="meta-row">
          <span class="author-pill">By ${escapeHTML(lead.author)}</span>
          <span>•</span>
          <span>${escapeHTML(lead.published)}</span>
          <span style="margin-left:auto; color:var(--magenta-primary); font-weight:800; letter-spacing:0.04em;">🔥 ${lead.heatScore || 98}% SPICY</span>
        </div>
      </div>
    `;

    leadStoryCard.onclick = () => openArticleModal(lead.id);
  }
  renderLeadStory();

  // 8. RENDER MINI HOTSPOTS & RADAR BOARD
  function renderHotspots() {
    const hotspots = DEFAULT_DATA.hotspots || [];

    if (miniHotspotList) {
      miniHotspotList.innerHTML = hotspots.slice(0, 4).map(h => `
        <div class="hotspot-card" data-hotspot-id="${h.id}">
          <div class="hotspot-info">
            <div class="hotspot-icon">${h.icon}</div>
            <div class="hotspot-text">
              <h4>${escapeHTML(h.name)}</h4>
              <p>${escapeHTML(h.area)}</p>
            </div>
          </div>
          <div class="hotspot-meter">
            <span class="hotspot-temp">${h.heatLevel}% Heat</span>
            <div class="meter-bar">
              <div class="meter-fill" style="width:${h.heatLevel}%;"></div>
            </div>
          </div>
        </div>
      `).join('');

      miniHotspotList.querySelectorAll('.hotspot-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-hotspot-id');
          filterByHotspot(id);
        });
      });
    }

    if (radarBoard) {
      radarBoard.innerHTML = hotspots.map(h => `
        <div class="hotspot-board-card" data-hotspot-id="${h.id}">
          <div class="hbc-top">
            <span class="hbc-badge ${h.heatLevel >= 90 ? 'hot' : 'warm'}">
              ${h.heatLevel >= 90 ? '🔥 ' : '⚡ '}${escapeHTML(h.status)}
            </span>
            <span style="font-weight:800; font-size:0.88rem; color:var(--gold-primary);">${h.heatLevel}°</span>
          </div>
          <h4>${h.icon} ${escapeHTML(h.name)}</h4>
          <span class="hbc-area">${escapeHTML(h.area)} • Crowd: ${escapeHTML(h.crowd)}</span>
          <div class="hbc-rumor">"${escapeHTML(h.currentRumor)}"</div>
        </div>
      `).join('');

      radarBoard.querySelectorAll('.hotspot-board-card').forEach(card => {
        card.addEventListener('click', () => {
          radarBoard.querySelectorAll('.hotspot-board-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          const id = card.getAttribute('data-hotspot-id');
          filterByHotspot(id);
        });
      });
    }
  }
  renderHotspots();

  function filterByHotspot(hotspotId) {
    const spot = (DEFAULT_DATA.hotspots || []).find(h => h.id === hotspotId);
    if (!spot) return;
    searchQuery = spot.area.toLowerCase().split(' ')[0];
    if (searchInput) searchInput.value = spot.name;
    renderArticles();
    showToast(`Radar focused on ${spot.name}: "${spot.currentRumor}"`, '📍');
  }

  // 9. RENDER STORIES FEED
  function renderArticles() {
    if (!storiesGrid) return;

    let filtered = allArticles.filter(art => {
      const matchCat = currentCategory === 'all' || art.category === currentCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        art.title.toLowerCase().includes(q) || 
        (art.subtitle && art.subtitle.toLowerCase().includes(q)) || 
        (art.location && art.location.toLowerCase().includes(q)) ||
        (art.author && art.author.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });

    if (storiesCount) {
      storiesCount.textContent = `Showing ${filtered.length} dispatch${filtered.length === 1 ? '' : 'es'}`;
    }

    if (filtered.length === 0) {
      storiesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 4.5rem 1rem; background: var(--bg-card); border-radius: var(--radius-lg); border:1px solid var(--border-subtle);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🫖</div>
          <h3 style="font-family: var(--font-serif); font-size: 1.5rem; color: #fff;">No Whispers Found</h3>
          <p style="color: var(--text-muted); margin-top: 0.5rem;">Nothing matches your search "${escapeHTML(searchQuery)}". Have tea to share?</p>
          <button class="spill-tea-btn" style="margin-top: 1.5rem;" onclick="document.getElementById('tipModal').showModal()">
            <span>🔥</span> Spill This Tea First
          </button>
        </div>
      `;
      return;
    }

    storiesGrid.innerHTML = filtered.map(art => `
      <article class="story-card" data-article-id="${art.id}">
        <div class="story-thumb-wrap">
          <img src="${art.image}" alt="${escapeHTML(art.title)}" class="story-thumb" loading="lazy">
          <div class="story-thumb-overlay"></div>
          <span class="story-thumb-badge">${escapeHTML(art.badge || 'EXCLUSIVE')}</span>
          <span class="story-heat-tag">🔥 ${art.heatScore || 85}%</span>
        </div>
        <div class="story-body">
          <div class="story-meta">
            <span class="story-category">${escapeHTML(art.category)}</span>
            <span>${escapeHTML(art.published || 'Today')}</span>
          </div>
          <h3 class="story-title">${escapeHTML(art.title)}</h3>
          <p class="story-preview">${escapeHTML(art.subtitle || (art.content ? art.content[0] : ''))}</p>
          <div class="story-card-footer">
            <div class="author-info">
              <span>✍️ By ${escapeHTML(art.author)}</span>
            </div>
            <span class="read-link">Read Tea <span>&rarr;</span></span>
          </div>
        </div>
      </article>
    `).join('');

    storiesGrid.querySelectorAll('.story-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-article-id');
        openArticleModal(id);
      });
    });
  }
  renderArticles();

  // 10. RENDER BLIND ITEMS
  function renderBlindItems() {
    if (!blindItemsGrid) return;
    const blinds = DEFAULT_DATA.blindItems || [];

    blindItemsGrid.innerHTML = blinds.map((b, idx) => `
      <div class="blind-card" id="blindCard_${b.id}">
        <div class="blind-card-header">
          <span class="blind-cat">${escapeHTML(b.category)}</span>
          <span class="blind-spiciness">${b.spiciness}</span>
        </div>
        <h3>#${idx + 1}: ${escapeHTML(b.title)}</h3>
        <p class="blind-text">${escapeHTML(b.preview)}</p>
        
        <ul class="clues-list">
          ${b.clues.map(c => `<li>${escapeHTML(c)}</li>`).join('')}
        </ul>

        <div class="blind-reveal-box">
          <button class="reveal-button" data-blind-target="${b.id}">
            <span>🔓 Reveal Insiders' Consensus</span>
          </button>
          <div class="revealed-answer" id="revealAnswer_${b.id}">
            <h5>Identified Suspect:</h5>
            <p>${escapeHTML(b.solvedGuess)}</p>
            <span>💬 ${escapeHTML(b.communityVerdict)}</span>
          </div>
        </div>
      </div>
    `).join('');

    blindItemsGrid.querySelectorAll('.reveal-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-blind-target');
        const ans = document.getElementById(`revealAnswer_${targetId}`);
        if (ans) {
          const isShown = ans.classList.contains('show');
          if (isShown) {
            ans.classList.remove('show');
            btn.innerHTML = '<span>🔓 Reveal Insiders\' Consensus</span>';
          } else {
            ans.classList.add('show');
            btn.innerHTML = '<span>🔒 Hide Clue</span>';
            playDispatchBeep();
          }
        }
      });
    });
  }
  renderBlindItems();

  // 11. ARTICLE READER MODAL LOGIC
  function openArticleModal(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;
    activeArticleId = article.id;

    if (modalBadge) modalBadge.textContent = article.badge || 'EXCLUSIVE';
    if (modalCategory) modalCategory.textContent = article.category;
    if (modalArticleTitle) modalArticleTitle.textContent = article.title;
    if (modalImage) {
      modalImage.src = article.image;
      modalImage.alt = article.title;
    }
    if (modalAuthor) modalAuthor.textContent = `By ${article.author} (${article.authorRole || 'Correspondent'})`;
    if (modalLocation) modalLocation.textContent = article.location || 'Colombo';
    if (modalTime) modalTime.textContent = article.published;

    if (modalAudioPlayer && article.audioVoiceNote) {
      modalAudioPlayer.style.display = 'flex';
      if (modalAudioTitle) modalAudioTitle.textContent = article.audioVoiceNote.title;
      modalAudioPlayer.classList.remove('playing');
      if (modalAudioPlayBtn) modalAudioPlayBtn.textContent = '▶';
    } else if (modalAudioPlayer) {
      modalAudioPlayer.style.display = 'none';
    }

    if (modalParagraphs) {
      const paragraphs = article.content || [article.subtitle || ''];
      modalParagraphs.innerHTML = paragraphs.map(p => `<p>${escapeHTML(p)}</p>`).join('');
    }

    updateVoteDisplays(article);
    renderArticleComments(article.id);

    // Setup share handlers
    setupShareHandlers(article);

    if (articleModal && typeof articleModal.showModal === 'function') {
      articleModal.showModal();
    }
  }

  function setupShareHandlers(article) {
    const url = window.location.href;
    const shareText = `Check out this hot tea on Future Ceylon: "${article.title}"`;

    if (copyStoryLinkBtn) {
      copyStoryLinkBtn.onclick = () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(() => {
            playDispatchBeep();
            showToast('Story link copied to clipboard! 📋', '✨');
          });
        } else {
          showToast('Link ready to share: ' + url, '📋');
        }
      };
    }

    if (whatsappShareBtn) {
      whatsappShareBtn.onclick = () => {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + url)}`;
        window.open(waUrl, '_blank');
      };
    }

    if (xShareBtn) {
      xShareBtn.onclick = () => {
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
        window.open(xUrl, '_blank');
      };
    }
  }

  function updateVoteDisplays(article) {
    const votes = voteStore[article.id] || article.votes || { fact: 432, sip: 289, cap: 34, spicy: 512 };
    if (countFact) countFact.textContent = votes.fact;
    if (countSip) countSip.textContent = votes.sip;
    if (countCap) countCap.textContent = votes.cap;
    if (countSpicy) countSpicy.textContent = votes.spicy;

    const userVote = localStorage.getItem(`future_ceylon_voted_${article.id}`);
    voteButtons.forEach(btn => {
      if (btn.getAttribute('data-vote') === userVote) {
        btn.classList.add('voted');
      } else {
        btn.classList.remove('voted');
      }
    });
  }

  voteButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activeArticleId) return;
      const voteType = btn.getAttribute('data-vote');
      const article = allArticles.find(a => a.id === activeArticleId);
      if (!article) return;

      if (!voteStore[activeArticleId]) {
        voteStore[activeArticleId] = { ...(article.votes || { fact: 100, sip: 50, cap: 10, spicy: 80 }) };
      }

      voteStore[activeArticleId][voteType] = (voteStore[activeArticleId][voteType] || 0) + 1;
      localStorage.setItem('future_ceylon_votes', JSON.stringify(voteStore));
      localStorage.setItem(`future_ceylon_voted_${activeArticleId}`, voteType);

      updateVoteDisplays(article);
      playDispatchBeep();
      showToast(`Your vote "${voteType.toUpperCase()}" registered!`, '🗳️');
    });
  });

  if (modalAudioPlayBtn) {
    modalAudioPlayBtn.addEventListener('click', () => {
      const isPlaying = modalAudioPlayer.classList.contains('playing');
      if (isPlaying) {
        modalAudioPlayer.classList.remove('playing');
        modalAudioPlayBtn.textContent = '▶';
      } else {
        modalAudioPlayer.classList.add('playing');
        modalAudioPlayBtn.textContent = '⏸';
        playDispatchBeep();
        showToast('Playing confidential voice note dispatch 📻', '🎙️');
      }
    });
  }

  if (closeArticleModalBtn) {
    closeArticleModalBtn.addEventListener('click', () => {
      if (modalAudioPlayer) modalAudioPlayer.classList.remove('playing');
      if (modalAudioPlayBtn) modalAudioPlayBtn.textContent = '▶';
      articleModal.close();
    });
  }

  if (articleModal) {
    articleModal.addEventListener('click', (e) => {
      const rect = articleModal.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        if (modalAudioPlayer) modalAudioPlayer.classList.remove('playing');
        articleModal.close();
      }
    });
  }

  // Comments Engine
  function renderArticleComments(articleId) {
    if (!modalCommentsList) return;
    const article = allArticles.find(a => a.id === articleId);
    const baseComments = (article && article.comments) ? article.comments : [];
    const userComments = commentStore[articleId] || [];
    const allComments = [...userComments, ...baseComments];

    if (commentsCount) commentsCount.textContent = allComments.length;

    modalCommentsList.innerHTML = allComments.map(c => `
      <div class="comment-bubble">
        <div class="cb-top">
          <span class="cb-name">@${escapeHTML(c.name)}</span>
          <span class="cb-time">${escapeHTML(c.time || 'Just now')}</span>
        </div>
        <p class="cb-text">${escapeHTML(c.text)}</p>
      </div>
    `).join('');
  }

  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeArticleId || !newCommentInput) return;
      const text = newCommentInput.value.trim();
      if (!text) return;

      const newComment = {
        name: 'ColomboGuest_' + Math.floor(100 + Math.random() * 900),
        time: 'Just now',
        text: text
      };

      if (!commentStore[activeArticleId]) {
        commentStore[activeArticleId] = [];
      }
      commentStore[activeArticleId].unshift(newComment);
      localStorage.setItem('future_ceylon_comments', JSON.stringify(commentStore));

      newCommentInput.value = '';
      renderArticleComments(activeArticleId);
      playDispatchBeep();
      showToast('Comment dropped into Colombo Tea Talk!', '💬');
    });
  }

  // 12. WHISTLEBLOWER "SPILL THE TEA" MODAL LOGIC
  if (openTipModalBtn) {
    openTipModalBtn.addEventListener('click', () => tipModal.showModal());
  }
  if (footerSpillBtn) {
    footerSpillBtn.addEventListener('click', () => tipModal.showModal());
  }
  if (closeTipModalBtn) {
    closeTipModalBtn.addEventListener('click', () => tipModal.close());
  }

  if (tipModal) {
    tipModal.addEventListener('click', (e) => {
      const rect = tipModal.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        tipModal.close();
      }
    });
  }

  if (tipSlider && spiceValue) {
    const spiceLevels = {
      1: '🍵 Mild Cinnamon Chai',
      2: '🌶️ Warm Gossip',
      3: '🌶️🌶️🌶️ High Voltage Drama',
      4: '🌶️🌶️🌶️🌶️ Boiling Tea',
      5: '💣💥 100% Habenero Explosion'
    };
    tipSlider.addEventListener('input', () => {
      spiceValue.textContent = spiceLevels[tipSlider.value] || 'High Voltage';
    });
  }

  if (tipForm) {
    tipForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const alias = document.getElementById('tipAlias').value.trim();
      const category = document.getElementById('tipCategory').value;
      const location = document.getElementById('tipLocation').value.trim() || 'Colombo';
      const story = document.getElementById('tipStory').value.trim();
      const spice = parseInt(tipSlider.value, 10);

      const newArticle = {
        id: 'tip-' + Date.now(),
        featured: false,
        badge: '⚡ INFORMANT LEAK',
        location: location,
        title: story.length > 70 ? story.substring(0, 68) + '...' : story,
        subtitle: `Dispatched anonymously by ${alias}. Verified by editorial radar.`,
        category: category,
        author: alias,
        authorRole: 'Confidential Whistleblower',
        readTime: '2 min read',
        published: 'Just now',
        image: category === 'Nightlife & Raves' ? 'assets/mirissa_beach_party.jpg' :
               category === 'Cricket & Stars' ? 'assets/galle_face_supercar.jpg' :
               category === 'Silver Screen & Drama' ? 'assets/hero_colombo_gala.jpg' :
               'assets/colombo_socialite_whisper.jpg',
        heatScore: 80 + (spice * 4),
        votes: { fact: 12, sip: 8, cap: 1, spicy: 25 },
        content: [
          story,
          `Our editorial team received this encrypted dispatch directly from informant ${alias}. The report has been tagged under ${category} with a spice rating of ${spice}/5.`,
          "Follow-up inquiries are currently being directed to society contacts across Colombo."
        ],
        comments: [
          { name: 'DeskEditor', time: '1m ago', text: 'Tip received and encrypted. High priority verification underway.', likes: 5 }
        ]
      };

      savedArticles.unshift(newArticle);
      localStorage.setItem('future_ceylon_articles', JSON.stringify(savedArticles));

      allArticles.unshift(newArticle);
      renderArticles();

      tipForm.reset();
      tipModal.close();

      playDispatchBeep();
      showToast(`⚡ Tea Dispatched! Published to live feed under "${category}"`, '🕵️');
    });
  }

  // 13. CATEGORY FILTER CONTROLLER
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-category');
      
      navItems.forEach(n => {
        if (n.getAttribute('data-filter') === currentCategory) {
          n.classList.add('active');
        } else {
          n.classList.remove('active');
        }
      });

      renderArticles();
    });
  });

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const filter = item.getAttribute('data-filter');
      if (filter) {
        e.preventDefault();
        currentCategory = filter;
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        categoryPills.forEach(p => {
          if (p.getAttribute('data-category') === filter) {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });

        renderArticles();
        window.scrollTo({ top: document.getElementById('storiesGrid').offsetTop - 120, behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('.footer-links a[data-filter]').forEach(a => {
    a.addEventListener('click', () => {
      const filter = a.getAttribute('data-filter');
      currentCategory = filter;
      categoryPills.forEach(p => {
        if (p.getAttribute('data-category') === filter) p.classList.add('active');
        else p.classList.remove('active');
      });
      renderArticles();
      window.scrollTo({ top: document.getElementById('storiesGrid').offsetTop - 120, behavior: 'smooth' });
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderArticles();
    });
  }

  const jumpToBlindsBtn = document.getElementById('jumpToBlindsBtn');
  if (jumpToBlindsBtn) {
    jumpToBlindsBtn.addEventListener('click', () => {
      const el = document.getElementById('blindItemsSection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterEmail ? newsletterEmail.value.trim() : '';
      if (!email) return;
      if (newsletterEmail) newsletterEmail.value = '';
      playDispatchBeep();
      showToast(`Welcome to the VIP Circle! Midnight dispatches will arrive at ${email}`, '🥂');
    });
  }

  const footerHotspotsBtn = document.getElementById('footerHotspotsBtn');
  if (footerHotspotsBtn) {
    footerHotspotsBtn.addEventListener('click', () => {
      const el = document.getElementById('spottedRadarSection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const footerEditorialPolicy = document.getElementById('footerEditorialPolicy');
  if (footerEditorialPolicy) {
    footerEditorialPolicy.addEventListener('click', () => {
      showToast('Editorial Policy: Satirical pop-culture & society journalism. All sources protected.', '📜');
    });
  }

  const footerSubmissions = document.getElementById('footerSubmissions');
  if (footerSubmissions) {
    footerSubmissions.addEventListener('click', () => tipModal.showModal());
  }

  // 14. TOAST NOTIFICATION UTILITY
  let toastTimer = null;
  function showToast(message, icon = '✨') {
    if (!toastMsg) return;
    if (toastText) toastText.textContent = message;
    if (toastIcon) toastIcon.textContent = icon;
    toastMsg.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMsg.classList.remove('show');
    }, 4500);
  }

  // 15. HTML ESCAPE HELPER
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  setTimeout(() => {
    showToast('Welcome to Future Ceylon. 6 new breaking dispatches logged today.', '☕');
  }, 1200);
});
