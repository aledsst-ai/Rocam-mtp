<script>
// ==================== DATA ====================
let members = [];
let vehicles = [];
let seizures = [];
let gallery = [];
let adminPassword = null;
let membersPassword = null;
let rankOrder = {};
let adminSeizurePage = 1;
let membersSeizurePage = 1;
const ADMIN_SEIZURES_PER_PAGE = 8;

function normalizeMemberAvatar(member) {
  if (!member || typeof member !== 'object') return null;
  if (member.avatarUrl) return member.avatarUrl;
  if (member.avatar) return member.avatar;
  if (member.photoUrl) return member.photoUrl;
  return null;
}

function sanitizeMembersData(data) {
  if (!Array.isArray(data)) return [];
  return data.map(member => {
    if (member && typeof member === 'object') {
      const { songUrl, songTitle, avatar, photoUrl, ...cleanMember } = member;
      if (!cleanMember.avatarUrl) {
        cleanMember.avatarUrl = avatar || photoUrl || null;
      }
      return cleanMember;
    }
    return member;
  });
}

function normalizeArrayData(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

// Carrossel: índices de paginação
let galleryPage = 0;
let vehiclesPage = 0;
let seizuresPage = 0;
const ITEMS_PER_PAGE = 4;
const GALLERY_ITEMS_PER_PAGE = 4;
const SEIZURES_ITEMS_PER_PAGE = 4;

// Estados dos filtros
let galleryFilterDays = 7;
let seizuresFilterDays = 7;

// ==================== GLOBAL OBSERVER E ESTADO ====================
let revealObserver = null;
let dataListenerRegistered = false;
let firebaseInitialSyncCompleted = false;
let scrollListenerActive = false;
let streamStatusUpdateScheduled = false;

function initRevealObserver() {
  // Limpar observer anterior se existir
  if (revealObserver) {
    revealObserver.disconnect();
  }
  
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
}

function observeRevealElements() {
  const intro = document.getElementById('intro');
  if (intro && !intro.classList.contains('hidden')) {
    console.log('👁️ Animações adiadas até o intro ser removido');
    return;
  }

  if (!revealObserver) initRevealObserver();
  
  // Selecionar TODOS os elementos que precisam animar
  const elements = document.querySelectorAll(
    '.member-card.reveal, .vehicle-card, .seizure-card, .gallery-card, .live-card-thumbnail, .reveal, .reveal-left, .reveal-right, .about-title, .section-title, .section-title-wrapper'
  );
  
  elements.forEach(el => {
    revealObserver.observe(el);
    
    // Verificar se o elemento já está visível e adicionar classe imediatamente
    const rect = el.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isVisible) {
      el.classList.add('visible');
    }
  });
}

function loadData() {
  try {
    console.log('🔄 loadData() iniciado');
    
    // Se já registramos o listener, não registra novamente
    if (dataListenerRegistered) {
      console.log('⏭️ Listener já registrado, ignorando...');
      return;
    }
    
    // Primeiro, tentar carregar do localStorage (fallback)
    try {
      const localMembers = localStorage.getItem('rocam_members');
      if (localMembers) {
        members = sanitizeMembersData(JSON.parse(localMembers));
        vehicles = JSON.parse(localStorage.getItem('rocam_vehicles') || '[]');
        seizures = JSON.parse(localStorage.getItem('rocam_seizures') || '[]');
        gallery = JSON.parse(localStorage.getItem('rocam_gallery') || '[]');
        const savedRankOrder = localStorage.getItem('rocam_rankOrder');
        rankOrder = savedRankOrder ? JSON.parse(savedRankOrder) : {};
        adminPassword = localStorage.getItem('rocam_admin_password');
        membersPassword = localStorage.getItem('rocam_members_password');
        localStorage.setItem('rocam_members', JSON.stringify(members));
        console.log('💾 Dados carregados de localStorage e normalizados');
      }
    } catch(e) {
      console.warn('⚠️ Erro ao carregar de localStorage:', e);
    }
    
    // Depois, tentar carregar do Firebase
    try {
      // Carregar dados compartilhados do Firebase (sem usuário específico)
      const db = firebase.database();
      const dataRef = db.ref('rocam-data');
      
      console.log('📥 Registrando listener do Firebase para rocam-data (primeira vez)');
      dataListenerRegistered = true;
      
      dataRef.on('value', (snapshot) => {
        console.log('✅ Firebase retornou:', {
          exists: snapshot.exists(),
          numChildren: snapshot.numChildren(),
          valor: snapshot.val()
        });
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('📦 Dados do Firebase:', {
            members: data.members ? data.members.length : 0,
            vehicles: data.vehicles ? data.vehicles.length : 0,
            seizures: data.seizures ? data.seizures.length : 0,
            gallery: data.gallery ? data.gallery.length : 0
          });
          
          console.log('📦 Atualizando variáveis globais com dados do Firebase');
          members = sanitizeMembersData(data.members || []);
          vehicles = normalizeArrayData(data.vehicles);
          seizures = normalizeArrayData(data.seizures);
          gallery = normalizeArrayData(data.gallery);
          rankOrder = data.rankOrder || {};
          if (typeof data.adminPassword === 'string') adminPassword = data.adminPassword;
          if (typeof data.membersPassword === 'string') membersPassword = data.membersPassword;
          console.log('✓ Dados carregados com sucesso do Firebase', { 
            members: members.length,
            vehicles: vehicles.length,
            seizures: seizures.length,
            gallery: gallery.length
          });
        } else {
          console.log('ℹ️ Firebase vazio, usando dados do localStorage');
        }
        console.log('🎨 Chamando renderAll()');
        renderAll();
        firebaseInitialSyncCompleted = true;
        console.log('✅ Firebase initial sync completed');
      }, (error) => {
        console.warn('⚠️ Erro ao carregar do Firebase:', error);
        console.log('💾 Usando dados do localStorage');
        console.log('🎨 Chamando renderAll()');
        renderAll();
      });
    } catch(e) { 
      console.warn('⚠️ Firebase indisponível:', e);
      console.log('💾 Usando dados do localStorage');
      renderAll();
    }
  } catch(e) { 
    console.error('❌ Erro crítico em loadData:', e);
    renderAll();
  }
}

function saveData() {
  try {
    console.log('💾 Tentando salvar dados:', {
      members: members.length,
      vehicles: vehicles.length,
      seizures: seizures.length,
      gallery: gallery.length
    });
    
    const sanitizedMembers = sanitizeMembersData(members);
    members = sanitizedMembers;
    const dataToSave = {
      members: sanitizedMembers,
      vehicles: vehicles,
      seizures: seizures,
      gallery: gallery,
      rankOrder: rankOrder,
      adminPassword: adminPassword,
      membersPassword: membersPassword,
      lastUpdated: new Date().toISOString()
    };
    
    // Sempre salvar em localStorage (fallback, funciona offline)
    try {
      localStorage.setItem('rocam_members', JSON.stringify(members));
      localStorage.setItem('rocam_vehicles', JSON.stringify(vehicles));
      localStorage.setItem('rocam_seizures', JSON.stringify(seizures));
      localStorage.setItem('rocam_gallery', JSON.stringify(gallery));
      localStorage.setItem('rocam_rankOrder', JSON.stringify(rankOrder));
      localStorage.setItem('rocam_admin_password', adminPassword);
      localStorage.setItem('rocam_members_password', membersPassword);
      console.log('✓ Dados salvos em localStorage');
    } catch(e) {
      console.warn('⚠️ Erro ao salvar em localStorage:', e);
    }
    
    // Tentar salvar em Firebase
    try {
      const db = firebase.database();
      const dataRef = db.ref('rocam-data');
      
      console.log('📡 Enviando dados para Firebase em rocam-data');
      dataRef.set(dataToSave, (error) => {
        if (error) {
          console.error('❌ Erro ao salvar no Firebase:', error);
          console.log('⚠️ Dados salvos apenas em localStorage');
        } else {
          console.log('✅ Dados salvos NO FIREBASE com sucesso!');
        }
      });
    } catch(e) {
      console.error('❌ Firebase indisponível:', e);
      console.log('⚠️ Dados salvos apenas em localStorage');
    }
  } catch(e) {
    console.error('❌ Erro em saveData:', e);
  }
}

// ==================== MODAL ====================
function openModal(imageUrl) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  if (imageUrl && imageUrl !== '') {
    modalImg.style.opacity = '0';
    modalImg.src = imageUrl;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    modalImg.onload = () => {
      modalImg.style.opacity = '1';
    };
  }
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ==================== TWITCH STATUS ====================
function normalizeKickUsername(value) {
  if (!value) return '';
  let sanitized = value.trim().toLowerCase();
  sanitized = sanitized.replace(/^https?:\/\//, '');
  sanitized = sanitized.replace(/^www\./, '');
  sanitized = sanitized.replace(/^kick\.com\//, '');
  sanitized = sanitized.replace(/^kick\.com$/, '');
  sanitized = sanitized.replace(/^\/+/, '');
  return sanitized;
}

async function checkTwitchStatus(username) {
  if (!username) return false;
  try {
    const response = await fetch(`https://decapi.me/twitch/uptime/${username}`);
    const text = await response.text();
    return !text.includes("offline") && !text.includes("error");
  } catch(e) { return false; }
}

async function checkKickStatus(username) {
  const normalized = normalizeKickUsername(username);
  if (!normalized) return false;
  try {
    const response = await fetch(`https://decapi.me/kick/uptime/${normalized}`);
    const text = await response.text();
    return !text.includes("offline") && !text.includes("error");
  } catch(e) { return false; }
}

function normalizeTikTokUsername(value) {
  if (!value) return '';
  let sanitized = value.trim().toLowerCase();
  sanitized = sanitized.replace(/^https?:\/\//, '');
  sanitized = sanitized.replace(/^www\./, '');
  sanitized = sanitized.replace(/^tiktok\.com\//, '');
  sanitized = sanitized.replace(/^@/, '');
  sanitized = sanitized.replace(/^\/+/, '');
  sanitized = sanitized.split('/')[0];
  return sanitized;
}

async function checkTikTokStatus(username) {
  const normalized = normalizeTikTokUsername(username);
  if (!normalized) return false;
  try {
    const response = await fetch(`https://decapi.me/tiktok/uptime/${normalized}`);
    const text = await response.text();
    return !text.includes("offline") && !text.includes("error");
  } catch(e) { return false; }
}

async function updateAllStreamStatus() {
  // Evitar múltiplas atualizações simultâneas
  if (streamStatusUpdateScheduled) return;
  streamStatusUpdateScheduled = true;
  
  try {
    let statusChanged = false;
    
    for (const member of members) {
      let oldTwitchLive = member.twitchLive;
      let oldKickLive = member.kickLive;
      let oldTikTokLive = member.tiktokLive;
      
      if (member.twitch) {
        member.twitchLive = await checkTwitchStatus(member.twitch);
      } else {
        member.twitchLive = false;
      }
      
      if (member.kick) {
        member.kick = normalizeKickUsername(member.kick);
        member.kickLive = await checkKickStatus(member.kick);
      } else {
        member.kickLive = false;
      }
      
      if (member.tiktok) {
        member.tiktok = normalizeTikTokUsername(member.tiktok);
        member.tiktokLive = await checkTikTokStatus(member.tiktok);
      } else {
        member.tiktokLive = false;
      }
      
      if (oldTwitchLive !== member.twitchLive || oldKickLive !== member.kickLive || oldTikTokLive !== member.tiktokLive) {
        statusChanged = true;
      }
    }
    
    // Salvar só depois do primeiro carregamento do Firebase
    if (!firebaseInitialSyncCompleted && dataListenerRegistered) {
      console.log('⏭️ Ignorando saveData() até o Firebase carregar a primeira vez');
    } else {
      saveData();
    }
    
    // Re-renderizar apenas se algo mudou
    if (statusChanged) {
      renderLiveMembers();
      renderHierarchy();
    }
  } finally {
    streamStatusUpdateScheduled = false;
  }
}

// ==================== HELPER ====================
function getMembersList(member) {
  if (!member) return [];
  if (Array.isArray(member)) return member;
  return [member];
}

function makeMembersBadge(member) {
  const list = getMembersList(member);
  if (!list.length) return '';
  let text = list.length <= 2 ? list.join(', ') : list.slice(0, 2).join(', ') + ' +' + (list.length - 2);
  const json = JSON.stringify(list).replace(/"/g, '&quot;');
  return '<span class="badge" style="cursor:pointer;" onclick="event.stopPropagation(); showMembers(this, event)" data-members=\'' + json + '\'><span class="emoji-icon">👤</span>' + escapeHtml(text) + '</span>';
}

function showMembers(el, e) {
  var members = JSON.parse(el.dataset.members);
  closeMembersTooltip();
  var tooltip = document.createElement('div');
  tooltip.id = 'members-tooltip';
  tooltip.style.cssText = 'position:fixed;z-index:9999;background:rgba(10,10,10,0.95);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;font-size:0.78rem;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.4);pointer-events:none;white-space:nowrap;';
  tooltip.textContent = members.join(', ');
  var x = (e ? e.clientX : window.innerWidth / 2) + 12;
  var y = (e ? e.clientY : window.innerHeight / 2) + 8;
  if (x + 200 > window.innerWidth) x = window.innerWidth - 210;
  if (y + 40 > window.innerHeight) y = window.innerHeight - 50;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  document.body.appendChild(tooltip);
  setTimeout(function() { document.addEventListener('click', closeMembersTooltip); }, 0);
  document.addEventListener('keydown', closeMembersTooltipEsc);
}

function closeMembersTooltipEsc(e) {
  if (e.key === 'Escape') closeMembersTooltip();
}

function closeMembersTooltip() {
  var t = document.getElementById('members-tooltip');
  if (t) { t.remove(); }
  document.removeEventListener('click', closeMembersTooltip);
  document.removeEventListener('keydown', closeMembersTooltipEsc);
}

function getMemberSeizureCount(memberName) {
  if (!memberName) return 0;
  return seizures.filter(s => {
    const ms = getMembersList(s.member || s.memberName);
    return ms.includes(memberName);
  }).length;
}

function getTwitchSVG() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.571 4.714h1.715v5.143h-1.715V4.714zm4.715 0H18v5.143h-1.714V4.714zm0 2.286l1.715 1.715-1.715 1.715V6.999zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0H6zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v9.429z"/></svg>`;
}

function getKickSVG() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h6v-8h2v8h4v-9h1l2 1v8h4V7c0-2.2-1.8-4-4-4h-3V1h-2v2H7c-2.2 0-4 1.8-4 4zm8 4h4c1.1 0 2 .9 2 2s-.9 2-2 2h-4V7z"/></svg>`;
}

function getTikTokSVG() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`;
}

function parseStoredDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string') {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function formatDateForInput(value) {
  const date = parseStoredDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStreamBadgeInfo(member) {
  if (member.kick) {
    const kickName = normalizeKickUsername(member.kick);
    return {
      url: `https://kick.com/${kickName}`,
      svg: getKickSVG(),
      platform: 'kick',
      isLive: member.kickLive
    };
  } else if (member.twitch) {
    return {
      url: `https://twitch.tv/${member.twitch}`,
      svg: getTwitchSVG(),
      platform: 'twitch',
      isLive: member.twitchLive
    };
  } else if (member.tiktok) {
    const tiktokName = normalizeTikTokUsername(member.tiktok);
    return {
      url: `https://tiktok.com/@${tiktokName}`,
      svg: getTikTokSVG(),
      platform: 'tiktok',
      isLive: member.tiktokLive
    };
  }
  return null;
}

function getLiveStreamInfo(member) {
  // Retorna o info da plataforma que está realmente ao vivo
  if (member.tiktok && member.tiktokLive) {
    const tiktokName = normalizeTikTokUsername(member.tiktok);
    return { url: `https://tiktok.com/@${tiktokName}`, svg: getTikTokSVG(), platform: 'tiktok', isLive: true };
  }
  if (member.kick && member.kickLive) {
    const kickName = normalizeKickUsername(member.kick);
    return { url: `https://kick.com/${kickName}`, svg: getKickSVG(), platform: 'kick', isLive: true };
  }
  if (member.twitch && member.twitchLive) {
    return { url: `https://twitch.tv/${member.twitch}`, svg: getTwitchSVG(), platform: 'twitch', isLive: true };
  }
  return getStreamBadgeInfo(member);
}

function getStreamThumbnailUrl(member, width = 640, height = 360) {
  // Usar a plataforma que está ao vivo primeiro, senão a de maior prioridade
  if (member.tiktokLive) {
    return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=TikTok+Live`;
  }
  if (member.kickLive) {
    return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=Kick+Live`;
  }
  const streamInfo = getStreamBadgeInfo(member);
  if (!streamInfo) {
    return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=Offline`;
  }
  if (streamInfo.platform === 'twitch') {
    const user = member.twitch || '';
    return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${encodeURIComponent(user)}-${width}x${height}.jpg`;
  }
  if (streamInfo.platform === 'kick') {
    return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=Kick`;
  }
  if (streamInfo.platform === 'tiktok') {
    return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=TikTok`;
  }
  return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=Offline`;
}

function filterByDays(items, days) {
  if (days === 'all') return items;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return items.filter(item => new Date(item.date) >= cutoffDate);
}

// ==================== RENDER HIERARQUIA ====================
function createHierarchyMemberCard(member, index) {
  const memberName = (member.name || 'Sem nome').trim();
  const memberRank = (member.policeRank || 'Soldado').trim();
  const isActive = member.status === 'ativo';
  const statusClass = isActive ? 'status-ativo' : 'status-inativo';
  const statusText = isActive ? '' : 'Inativo';
  const seizureCount = getMemberSeizureCount(memberName);
  const seizureText = seizureCount === 1 ? 'APREENSÃO' : 'APREENSÕES';
  const streamInfo = getStreamBadgeInfo(member);
  const registeredAt = parseStoredDate(member.createdAt);
  const registeredText = registeredAt
    ? `Cadastrado em ${registeredAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
    : '';

  const card = document.createElement('div');
  card.className = 'member-card reveal';
  card.style.transitionDelay = `${index * 0.05}s`;
  card.dataset.memberName = memberName;

  if (streamInfo && streamInfo.isLive) {
    const liveClass = streamInfo.platform === 'kick' && !member.twitchLive ? 'kick-live-only-card' : streamInfo.platform === 'tiktok' && !member.twitchLive && !member.kickLive ? 'tiktok-live-card' : 'twitch-live-card';
    card.classList.add(liveClass);
  }

  const avatarWrapper = document.createElement('div');
  if (member.avatarUrl) {
    const avatar = document.createElement('img');
    avatar.className = 'member-avatar';
    avatar.src = member.avatarUrl;
    avatar.alt = memberName;
    avatar.onerror = () => {
      const placeholder = document.createElement('div');
      placeholder.className = 'member-avatar-placeholder';
      placeholder.textContent = '👤';
      avatar.replaceWith(placeholder);
    };
    avatarWrapper.appendChild(avatar);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'member-avatar-placeholder';
    placeholder.textContent = '👤';
    avatarWrapper.appendChild(placeholder);
  }

  const info = document.createElement('div');
  info.className = 'member-info';

  const nameEl = document.createElement('div');
  nameEl.className = 'member-name';
  nameEl.textContent = memberName;

  const rankEl = document.createElement('div');
  rankEl.className = 'member-police-rank';
  rankEl.textContent = memberRank;

  if (member.level) {
    const levelEl = document.createElement('span');
    levelEl.className = 'member-level';
    levelEl.textContent = `Nv.${member.level}`;
    rankEl.appendChild(levelEl);
  }

  info.append(nameEl, rankEl);

  if (registeredText) {
    const registeredEl = document.createElement('div');
    registeredEl.className = 'member-registered';
    registeredEl.textContent = registeredText.replace('Cadastrado em', 'Membro desde');
    info.appendChild(registeredEl);
  }

  const right = document.createElement('div');
  right.className = 'member-right';

  const footer = document.createElement('div');
  footer.className = 'member-footer';

  const seizuresEl = document.createElement('span');
  seizuresEl.className = 'member-seizures';
  seizuresEl.textContent = `📋 ${seizureCount} ${seizureText}`;
  footer.appendChild(seizuresEl);

  if (streamInfo) {
    const liveInfo = member.tiktokLive || member.kickLive || member.twitchLive ? getLiveStreamInfo(member) : streamInfo;
    const streamLink = document.createElement('a');
    streamLink.href = liveInfo.url;
    streamLink.target = '_blank';
    streamLink.rel = 'noopener noreferrer';
    streamLink.className = `twitch-badge ${streamInfo.platform === 'kick' ? (streamInfo.isLive ? 'kick-online' : 'kick-offline') : streamInfo.platform === 'tiktok' ? (streamInfo.isLive ? 'tiktok-online' : 'tiktok-offline') : (streamInfo.isLive ? 'twitch-online' : 'twitch-offline')}`;
    streamLink.addEventListener('click', e => e.stopPropagation());

    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'stream-icon';
    iconWrapper.innerHTML = streamInfo.svg;

    const label = document.createElement('span');
    label.textContent = streamInfo.isLive ? 'AO VIVO' : 'OFFLINE';

    streamLink.append(iconWrapper, label);
    right.appendChild(streamLink);
  }

  if (statusText) {
    const statusBadge = document.createElement('span');
    statusBadge.className = `member-status ${statusClass}`;
    statusBadge.textContent = statusText;
    right.append(statusBadge);
  }

  right.prepend(footer);
  card.append(avatarWrapper, info, right);

  card.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    openMemberProfile(memberName);
  });

  return card;
}

function renderHierarchy() {
  const container = document.getElementById('hierarchy-content');
  if (!container) return;
  container.innerHTML = '';

  if (!members.length) {
    container.innerHTML = '<div class="empty-card">Nenhum membro cadastrado</div>';
    return;
  }

  const groups = members.reduce((acc, member) => {
    const rank = member.rank || 'Membro';
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(member);
    return acc;
  }, {});

  Object.keys(groups).forEach(rank => {
    if (!rankOrder[rank]) {
      rankOrder[rank] = Object.keys(rankOrder).length + 1;
    }
  });

  const sortedRanks = Object.keys(groups).sort((a, b) => (rankOrder[a] || 99) - (rankOrder[b] || 99));
  const fragment = document.createDocumentFragment();

  sortedRanks.forEach(rank => {
    const groupEl = document.createElement('div');
    groupEl.className = 'rank-group';

    const headerEl = document.createElement('div');
    headerEl.className = 'rank-group-header';
    const titleEl = document.createElement('h3');
    titleEl.textContent = `💀 ${rank}`;
    headerEl.appendChild(titleEl);

    const gridEl = document.createElement('div');
    gridEl.className = 'members-grid';

    groups[rank].forEach((member, idx) => {
      const card = createHierarchyMemberCard(member, idx);
      gridEl.appendChild(card);
    });

    groupEl.append(headerEl, gridEl);
    fragment.appendChild(groupEl);
  });

  container.appendChild(fragment);
  observeRevealElements();
}

// ==================== RENDER MEMBROS AO VIVO ====================
function renderLiveMembers() {
  const container = document.getElementById('live-members-content');
  const liveMembers = members.filter(m => (m.twitchLive === true || m.kickLive === true || m.tiktokLive === true));

  if (!liveMembers.length) {
    container.innerHTML = '<div class="empty-card">Nenhum membro está ao vivo no momento</div>';
    return;
  }

  let html = '<div class="members-grid">';
  liveMembers.forEach((m, idx) => {
    const statusClass = m.status === 'ativo' ? 'status-ativo' : 'status-inativo';
    const statusText = m.status === 'ativo' ? 'Ativo' : 'Inativo';
    const seizureCount = getMemberSeizureCount(m.name);
    const seizureText = seizureCount === 1 ? 'APREENSÃO' : 'APREENSÕES';
    const avatarHtml = m.avatarUrl
      ? `<img class="live-card-avatar" src="${escapeHtml(m.avatarUrl)}" onerror="this.src='https://placehold.co/48x48/1a1a1a/555?text=%F0%9F%91%A4'">`
      : `<div class="member-avatar-placeholder">👤</div>`;

    const streamInfo = getLiveStreamInfo(m) || {};
    const thumbUrl = getStreamThumbnailUrl(m, 640, 360);

    html += `
      <div class="live-card-thumbnail reveal" style="transition-delay: ${idx * 0.05}s" onclick="window.open('${streamInfo.url || '#'}', '_blank')">
        <div class="live-card-background" style="background-image: url('${escapeHtml(thumbUrl)}');"></div>
        <div class="live-card-overlay"></div>
        <div class="live-card-content">
          ${avatarHtml}
          <div class="live-card-info">
            <div class="live-card-name">${escapeHtml(m.name)}</div>
            <div class="live-card-rank">
              ${escapeHtml(m.policeRank || 'Soldado')}
              ${m.rank ? `· ${escapeHtml(m.rank)}` : ''}
              ${m.level ? `<span class="live-card-level">Nv.${m.level}</span>` : ''}
            </div>
            <div class="live-card-badge">${streamInfo.svg || ''} AO VIVO</div>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ==================== CARROSSEL ====================
function carouselPrevNext(type, direction) {
  if (type === 'gallery') {
    galleryPage = direction === 'prev' ? Math.max(0, galleryPage - 1) : galleryPage + 1;
    renderGallery();
  } else if (type === 'vehicles') {
    vehiclesPage = direction === 'prev' ? Math.max(0, vehiclesPage - 1) : vehiclesPage + 1;
    renderVehicles();
  } else if (type === 'seizures') {
    seizuresPage = direction === 'prev' ? Math.max(0, seizuresPage - 1) : seizuresPage + 1;
    renderSeizures();
  }
}

function goToCarouselPage(type, page) {
  if (type === 'gallery') {
    galleryPage = page;
    renderGallery();
  } else if (type === 'vehicles') {
    vehiclesPage = page;
    renderVehicles();
  } else if (type === 'seizures') {
    seizuresPage = page;
    renderSeizures();
  }
}

function renderCarousel(containerId, items, carouselType, emptyMessage, itemsPerPage = ITEMS_PER_PAGE) {
  const container = document.getElementById(containerId);
  if (!items.length) {
    container.innerHTML = `<div class="empty-card">${emptyMessage}</div>`;
    return;
  }
  
  let page = 0;
  if (carouselType === 'gallery') page = galleryPage;
  else if (carouselType === 'vehicles') page = vehiclesPage;
  else if (carouselType === 'seizures') page = seizuresPage;
  
  // Garantir que a página está dentro dos limites
  const maxPage = Math.ceil(items.length / itemsPerPage) - 1;
  if (page > maxPage) {
    page = maxPage;
    if (carouselType === 'gallery') galleryPage = page;
    else if (carouselType === 'vehicles') vehiclesPage = page;
    else if (carouselType === 'seizures') seizuresPage = page;
  }
  
  const start = page * itemsPerPage;
  const end = Math.min(start + itemsPerPage, items.length);
  const currentItems = items.slice(start, end);
  const hasNext = end < items.length;
  const hasPrev = page > 0;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  let html = '<div class="carousel-wrapper">';
  html += '<div class="carousel-container">';
  html += `<button class="carousel-btn" data-carousel-type="${carouselType}" data-carousel-direction="prev" ${!hasPrev ? 'disabled' : ''} title="Página anterior" aria-label="Anterior">❮</button>`;
  html += '<div class="carousel-content">';
  
  currentItems.forEach((item, idx) => {
    if (carouselType === 'gallery') {
      html += `<div class="gallery-card reveal" style="transition-delay: ${idx * 0.05}s" onclick="openModal('${escapeHtml(item.imageUrl)}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') openModal('${escapeHtml(item.imageUrl)}')">
        ${item.imageUrl ? `<img class="gallery-img" src="${escapeHtml(item.imageUrl)}" onerror="this.src='https://placehold.co/600x400/1a1a1a/555?text=Erro+ao+carregar'" alt="${escapeHtml(item.title || 'Foto da galeria')}">` : '<div class="gallery-img placeholder">📸</div>'}
        <div class="gallery-card-overlay"></div>
        <div class="gallery-card-content">
          <div class="gallery-title">${escapeHtml(item.title || 'Sem título')}</div>
          <div class="gallery-date badge">${new Date(item.date).toLocaleDateString('pt-BR')}</div>
        </div>
      </div>`;
    } else if (carouselType === 'vehicles') {
      html += `<div class="vehicle-card reveal" style="transition-delay: ${idx * 0.05}s" onclick="openModal('${escapeHtml(item.imageUrl)}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') openModal('${escapeHtml(item.imageUrl)}')">
        ${item.imageUrl ? `<img class="vehicle-img" src="${escapeHtml(item.imageUrl)}" onerror="this.src='https://placehold.co/600x400/1a1a1a/555?text=Sem+Imagem'" alt="${escapeHtml(item.name)}">` : '<div class="vehicle-img placeholder">🚗</div>'}
        <div class="vehicle-card-overlay"></div>
        <div class="vehicle-card-content">
          <div class="vehicle-name">${escapeHtml(item.name)}</div>
        </div>
      </div>`;
    } else if (carouselType === 'seizures') {
      const dateText = `${new Date(item.date).toLocaleDateString('pt-BR')} às ${new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      html += `<div class="seizure-card reveal" style="transition-delay: ${idx * 0.05}s" onclick="openModal('${escapeHtml(item.imageUrl)}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') openModal('${escapeHtml(item.imageUrl)}')">
        ${item.imageUrl ? `<img class="seizure-img" src="${escapeHtml(item.imageUrl)}" onerror="this.src='https://placehold.co/600x400/1a1a1a/555?text=Sem+Imagem'" alt="${escapeHtml(item.description)}">` : '<div class="seizure-img" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:2rem;">📷</div>'}
        <div class="seizure-info">
          <div class="seizure-card-header"><span class="qru-badge">${escapeHtml(item.description)}</span></div>
          <div class="seizure-meta">
            ${item.member ? makeMembersBadge(item.member) : ''}
            ${item.location ? `<span class="badge"><span class="emoji-icon">📍</span>${escapeHtml(item.location)}</span>` : ''}
          </div>
          <div class="seizure-footer">
            <span class="badge"><span class="emoji-icon">📅</span>${dateText}</span>
            ${item.boImageUrl ? `<a href="${escapeHtml(item.boImageUrl)}" target="_blank" onclick="event.stopPropagation()">Ver BO →</a>` : ''}
          </div>
        </div>
      </div>`;
    }
  });
  
  html += '</div>';
  html += `<button class="carousel-btn" data-carousel-type="${carouselType}" data-carousel-direction="next" ${!hasNext ? 'disabled' : ''} title="Próxima página" aria-label="Próximo">❯</button>`;
  html += '</div>';
  
  // Adicionar indicadores de paginação
  if (totalPages > 1) {
    html += '<div class="carousel-indicators">';
    for (let i = 0; i < totalPages; i++) {
      const isActive = i === page ? 'active' : '';
      html += `<button class="carousel-dot ${isActive}" data-carousel-type="${carouselType}" data-carousel-page="${i}" title="Página ${i + 1}" onclick="goToCarouselPage('${carouselType}', ${i})" aria-label="Ir para página ${i + 1}"></button>`;
    }
    html += '</div>';
    
    // Informação de paginação
    html += `<div class="carousel-info">PÁGINA ${page + 1} DE ${totalPages}</div>`;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

// ==================== RENDER COM CARROSSEL ====================
function renderVehicles() {
  const sorted = [...vehicles].sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
  const container = document.getElementById('vehicles-content');
  if (!sorted.length) {
    container.innerHTML = '<div class="empty-card">Nenhuma viatura cadastrada</div>';
    return;
  }
  
  container.innerHTML = '<div class="simple-grid">' + sorted.map((item, idx) => `
    <div class="vehicle-card reveal" style="transition-delay: ${idx * 0.05}s" onclick="openModal('${escapeHtml(item.imageUrl)}')">
      ${item.imageUrl ? `<img class="vehicle-img" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" onerror="this.src='https://placehold.co/600x400/1a1a1a/555?text=Sem+Imagem'">` : '<div class="vehicle-img placeholder">🚗</div>'}
      <div class="vehicle-card-overlay"></div>
      <div class="vehicle-card-content">
        <div class="vehicle-name">${escapeHtml(item.name)}</div>
      </div>
    </div>
  `).join('') + '</div>';
}

function renderGallery() {
  const filtered = normalizeArrayData(gallery).sort((a,b) => new Date(b.date) - new Date(a.date));
  const container = document.getElementById('gallery-content');
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-card">Nenhuma foto na galeria</div>';
    return;
  }
  
  const limited = filtered.slice(0, 3); // Mostrar apenas 3
  container.innerHTML = '<div class="simple-grid">' + limited.map((item, idx) => {
    const imageUrl = item.imageUrl ? String(item.imageUrl).trim() : '';
    const safeImageUrl = escapeHtml(imageUrl);
    const title = escapeHtml(item.title || 'Sem título');
    const dateText = item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '';
    const imgHtml = imageUrl
      ? `<img class="gallery-img" src="${safeImageUrl}" alt="${title}" onerror="this.src='https://placehold.co/600x400/1a1a1a/555?text=Erro'">`
      : '<div class="gallery-img placeholder">📸</div>';

    return `
      <div class="gallery-card reveal" style="transition-delay: ${idx * 0.05}s" ${imageUrl ? `onclick="openModal('${safeImageUrl}')"` : ''}>
        ${imgHtml}
        <div class="gallery-card-overlay"></div>
        <div class="gallery-card-content">
          <div class="gallery-title">${title}</div>
          <div class="gallery-date badge">${dateText}</div>
        </div>
      </div>
    `;
  }).join('') + '</div>';
  observeRevealElements();
}

function renderSeizures() {
  try {
    console.log('🎨 renderSeizures() chamada');
    const container = document.getElementById('seizures-content');
    if (!container) {
      console.warn('⚠️ Elemento seizures-content não encontrado');
      return;
    }
    
    console.log('✅ Container encontrado:', {
      id: container.id,
      classe: container.className,
      display: window.getComputedStyle(container).display,
      visibility: window.getComputedStyle(container).visibility,
      opacity: window.getComputedStyle(container).opacity
    });
    
    console.log(`📊 Verificando seizures: total = ${seizures.length}`);
    console.log('📋 Seizures:', seizures);
    
    const sorted = [...seizures].sort((a,b) => new Date(b.date) - new Date(a.date));
    console.log(`📊 Seizures após sort: ${sorted.length}`);
    
    if (!sorted.length) {
      console.log('⚠️ Nenhuma apreensão encontrada');
      container.innerHTML = '<div class="empty-card">Nenhuma apreensão registrada</div>';
      console.log('✅ Container atualizado com mensagem vazia');
      console.log('Container innerHTML:', container.innerHTML);
      return;
    }
    
    const limited = sorted.slice(0, 3); // Mostrar apenas 3
    console.log(`📊 Mostrando ${limited.length} de ${sorted.length} apreensões`);
    let html = '<div class="simple-grid">';
    
    limited.forEach((item, idx) => {
      try {
        const backgroundStyle = item.imageUrl && item.imageUrl.trim()
          ? `background-image: url('${escapeHtml(item.imageUrl)}');`
          : '';
        const dateText = `${new Date(item.date).toLocaleDateString('pt-BR')} às ${new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const imgUrl = escapeHtml(item.imageUrl || '');
        
        html += `
          <div class="seizure-card reveal" style="transition-delay: ${idx * 0.05}s" onclick="openModal('${imgUrl}')">
            <div class="seizure-card-background ${item.imageUrl ? '' : 'seizure-card-background--empty'}" style="${backgroundStyle}"></div>
            <div class="seizure-card-overlay"></div>
            <div class="seizure-card-content">
              <div class="seizure-card-header"><span class="qru-badge">${escapeHtml(item.description || 'Apreensão')}</span></div>
              <div class="seizure-meta">
                ${item.member ? makeMembersBadge(item.member) : ''}
                ${item.location ? `<span class="badge"><span class="emoji-icon">📍</span>${escapeHtml(item.location)}</span>` : ''}
              </div>
              <div class="seizure-footer">
                <span class="badge"><span class="emoji-icon">📅</span>${dateText}</span>
                ${item.boImageUrl ? `<a href="${escapeHtml(item.boImageUrl)}" target="_blank" onclick="event.stopPropagation()">Ver BO →</a>` : ''}
              </div>
            </div>
          </div>
        `;
      } catch (itemError) {
        console.error('❌ Erro ao renderizar item de apreensão:', itemError, item);
      }
    });
    
    html += '</div>';
    container.innerHTML = html;
    console.log(`✅ ${limited.length} apreensões renderizadas com sucesso`);
    console.log('📍 Container innerHTML atualizado');
    console.log('Container HTML length:', container.innerHTML.length);
    console.log('Container classes:', container.className);
    
    // IMPORTANTE: Observar elementos após renderizar
    observeRevealElements();
    console.log('👁️ observeRevealElements() chamada para animar cards');
    
    // Verificar visibilidade APÓS renderizar
    setTimeout(() => {
      console.log('🔍 Verificação PÓS-RENDERIZAÇÃO:');
      console.log('Container display:', window.getComputedStyle(container).display);
      console.log('Container visibility:', window.getComputedStyle(container).visibility);
      console.log('Container opacity:', window.getComputedStyle(container).opacity);
      console.log('Container HTML atualmente:', container.innerHTML.substring(0, 100) + '...');
      
      // Verificar se cards têm classe 'visible'
      const cards = container.querySelectorAll('.seizure-card');
      console.log(`📊 Total de cards: ${cards.length}`);
      cards.forEach((card, idx) => {
        console.log(`Card ${idx}: classes=${card.className}, opacity=${window.getComputedStyle(card).opacity}`);
      });
    }, 100);
  } catch (error) {
    console.error('❌ Erro ao renderizar apreensões:', error);
  }
}

function updateStats() {
  const today = new Date().toDateString();
  const liveCount = members.filter(m => m.twitchLive === true || m.kickLive === true).length;
  
  // Apreensões de hoje
  const todayCount = seizures.filter(s => new Date(s.date).toDateString() === today).length;
  
  // Apreensões da última semana (últimos 7 dias)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = seizures.filter(s => new Date(s.date) >= weekAgo).length;
  
  const run = () => {
    animateStatValue('stat-ao-vivo', liveCount);
    animateStatValue('stat-membros', members.length);
    animateStatValue('stat-hoje', todayCount);
    animateStatValue('stat-semana', weekCount);
    animateStatValue('stat-total', seizures.length);
  };

  const intro = document.getElementById('intro');
  if (intro && !intro.classList.contains('hidden')) {
    const onTransitionEnd = () => {
      intro.removeEventListener('transitionend', onTransitionEnd);
      setTimeout(run, 200);
    };
    intro.addEventListener('transitionend', onTransitionEnd);
  } else {
    setTimeout(run, 300);
  }
}

function animateStatValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = Number(el.textContent) || 0;
  if (start === value) {
    el.textContent = value;
    return;
  }

  const duration = 1300;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const current = Math.floor(start + (value - start) * progress);
    el.textContent = current;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = value;
      el.classList.add('update-active');
      setTimeout(() => el.classList.remove('update-active'), 260);
    }
  }

  requestAnimationFrame(tick);
}

// Carrossel: mostrar 4 itens por página com navegação

function renderAll() {
  renderHierarchy();
  renderLiveMembers();
  renderVehicles();
  renderSeizures();
  renderGallery();
  updateStats();
}

// ==================== ADMIN PANELS ====================
let currentAdminTab = 'members';
let currentMembersTab = 'seizures';

function openAdminPanel() {
  const adminPasswordDialog = document.getElementById('adminPasswordDialog');
  if (!adminPasswordDialog) {
    console.error('ERROR: adminPasswordDialog element not found in DOM');
    alert('Erro: Diálogo de senha não foi inicializado. Por favor, recarregue a página.');
    return;
  }
  adminPasswordDialog.classList.add('show');
  document.getElementById('adminPasswordInput').focus();
}

function submitAdminPassword() {
  const pwd = document.getElementById('adminPasswordInput').value;
  if (adminPassword === null) {
    alert('A senha de administrador ainda não foi carregada. Aguarde e tente novamente.');
    return;
  }
  if (pwd === adminPassword) {
    const adminOverlay = document.getElementById('admin-overlay');
    if (!adminOverlay) {
      console.error('ERROR: admin-overlay element not found in DOM');
      alert('Erro: Painel não foi inicializado. Por favor, recarregue a página.');
      return;
    }
    adminOverlay.classList.add('open');
    switchAdminTab('seizures');
    closePasswordDialog('admin');
  } else if (pwd) {
    alert("Senha incorreta!");
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminPasswordInput').focus();
  }
}

function openMembersPanel() {
  const membersPasswordDialog = document.getElementById('membersPasswordDialog');
  if (!membersPasswordDialog) {
    console.error('ERROR: membersPasswordDialog element not found in DOM');
    alert('Erro: Diálogo de senha não foi inicializado. Por favor, recarregue a página.');
    return;
  }
  closeAdminMenu();
  membersPasswordDialog.classList.add('show');
  document.getElementById('membersPasswordInput').focus();
}

function toggleAdminMenu() {
  const menu = document.getElementById('admin-options');
  const toggle = document.getElementById('adminMenuToggle');
  if (!menu || !toggle) return;
  const show = !menu.classList.contains('show');
  menu.classList.toggle('show', show);
  toggle.setAttribute('aria-expanded', String(show));
  menu.setAttribute('aria-hidden', String(!show));
}

function closeAdminMenu() {
  const menu = document.getElementById('admin-options');
  const toggle = document.getElementById('adminMenuToggle');
  if (!menu || !toggle) return;
  menu.classList.remove('show');
  toggle.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
}

document.addEventListener('click', function(event) {
  const menu = document.getElementById('admin-options');
  const toggle = document.getElementById('adminMenuToggle');
  if (!menu || !toggle) return;
  if (!menu.contains(event.target) && !toggle.contains(event.target)) {
    closeAdminMenu();
  }
});

function submitMembersPassword() {
  const pwd = document.getElementById('membersPasswordInput').value;
  if (membersPassword === null) {
    alert('A senha de acesso de membros ainda não foi carregada. Aguarde e tente novamente.');
    return;
  }
  if (pwd === membersPassword) {
    const membersOverlay = document.getElementById('members-overlay');
    if (!membersOverlay) {
      console.error('ERROR: members-overlay element not found in DOM');
      alert('Erro: Painel não foi inicializado. Por favor, recarregue a página.');
      return;
    }
    membersOverlay.classList.add('open');
    switchMembersTab('seizures');
    closePasswordDialog('members');
  } else if (pwd) {
    alert("Senha incorreta!");
    document.getElementById('membersPasswordInput').value = '';
    document.getElementById('membersPasswordInput').focus();
  }
}

function closePasswordDialog(type) {
  if (type === 'admin') {
    const adminPasswordDialog = document.getElementById('adminPasswordDialog');
    if (adminPasswordDialog) {
      adminPasswordDialog.classList.remove('show');
      document.getElementById('adminPasswordInput').value = '';
    }
  } else if (type === 'members') {
    const membersPasswordDialog = document.getElementById('membersPasswordDialog');
    if (membersPasswordDialog) {
      membersPasswordDialog.classList.remove('show');
      document.getElementById('membersPasswordInput').value = '';
    }
  }
}

function closeAdminPanel() {
  const adminOverlay = document.getElementById('admin-overlay');
  if (adminOverlay) {
    adminOverlay.classList.remove('open');
  }
}

function closeMembersPanel() {
  const membersOverlay = document.getElementById('members-overlay');
  if (membersOverlay) {
    membersOverlay.classList.remove('open');
  }
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  const tabs = document.querySelectorAll('#admin-overlay .admin-tab');
  tabs.forEach(t => t.classList.remove('active'));
  if (tab === 'seizures') {
    tabs[0].classList.add('active');
    renderAdminSeizures();
  } else if (tab === 'members') {
    tabs[1].classList.add('active');
    renderAdminMembers();
  } else if (tab === 'gallery') {
    tabs[2].classList.add('active');
    renderAdminGallery();
  } else if (tab === 'vehicles') {
    tabs[3].classList.add('active');
    renderAdminVehicles();
  } else if (tab === 'rankOrder') {
    tabs[4].classList.add('active');
    renderAdminRankOrder();
  } else if (tab === 'settings') {
    tabs[5].classList.add('active');
    renderAdminSettings();
  }
}

function switchMembersTab(tab) {
  currentMembersTab = tab;
  const tabs = document.querySelectorAll('#members-overlay .admin-tab');
  tabs.forEach(t => t.classList.remove('active'));
  if (tab === 'seizures') {
    tabs[0].classList.add('active');
    renderMembersSeizures();
  } else if (tab === 'gallery') {
    tabs[1].classList.add('active');
    renderMembersGallery();
  } else if (tab === 'vehicles') {
    tabs[2].classList.add('active');
    renderMembersVehicles();
  } else if (tab === 'members') {
    tabs[3].classList.add('active');
    renderMembersMembers();
  }
}

// ========== ADMIN FULL PANEL ==========
function renderAdminMembers() {
  const body = document.getElementById('admin-body');
  // Buscar hierarquias únicas existentes
  const existingRanks = [...new Set(members.map(m => m.rank || "Membro"))];
  const rankOptions = existingRanks.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ADICIONAR MEMBRO</h3>
      <div class="form-group"><label>NOME</label><input id="new-name" placeholder="Nome"></div>
      <div class="form-group"><label>PATENTE POLICIAL</label><input id="new-police-rank" placeholder="Ex: 3º Sargento, Cabo, Soldado..."></div>
      <div class="form-group"><label>HIERARQUIA</label><select id="new-rank"><option value="">-- Selecione ou crie nova --</option>${rankOptions}<option value="__new__">+ CRIAR NOVA</option></select><input id="new-rank-custom" placeholder="Nome da hierarquia" style="display:none; margin-top: 4px;"></div>
      <div class="form-group"><label>NÍVEL</label><input id="new-level" type="number" value="1"></div>
      <div class="form-group"><label>STATUS</label><select id="new-status"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
      <div class="form-group"><label>DATA DE CADASTRO</label><input id="new-created-at" type="date"></div>
      <div class="form-group"><label>FOTO DO MEMBRO (URL)</label><input id="new-avatar" placeholder="https://..."></div>
      <div class="form-group"><label>TWITCH</label><input id="new-twitch" placeholder="username (opcional)"></div>
      <div class="form-group"><label>KICK</label><input id="new-kick" placeholder="username (opcional)"></div>
      <div class="form-group"><label>TIKTOK</label><input id="new-tiktok" placeholder="username (opcional)"></div>
      <button class="btn btn-primary" onclick="addMember()">ADICIONAR MEMBRO</button>
    </div>
    <div id="members-list"></div>
  `;
  
  // Listener para mostrar/ocultar input de nova hierarquia
  document.getElementById('new-rank').addEventListener('change', function() {
    const customInput = document.getElementById('new-rank-custom');
    if (this.value === '__new__') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
    }
  });
  
  renderMembersList();
}

function renderMembersList() {
  const container = document.getElementById('members-list');
  if (!members.length) { container.innerHTML = '<div class="empty-card">Nenhum membro</div>'; return; }
  let html = '';
  members.forEach(m => {
    html += `<div class="admin-list-item" style="font-size:11px;font-family:'Inter',sans-serif;">
      <div class="item-info">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#fff;">${escapeHtml(m.name)}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Patente: ${escapeHtml(m.policeRank || 'Soldado')} | Nv.${m.level} | ${m.status}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Cadastrado: ${parseStoredDate(m.createdAt) ? parseStoredDate(m.createdAt).toLocaleDateString('pt-BR') : '---'}</div>
        ${m.twitch ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">twitch.tv/${m.twitch}</div>` : ''}
        ${m.kick ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">kick.com/${m.kick}</div>` : ''}
        ${m.tiktok ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">tiktok.com/@${m.tiktok}</div>` : ''}
        <div class="inline-edit" style="margin-top:6px;">
          <input type="text" id="name-input-${m.id}" value="${escapeHtml(m.name || '')}" placeholder="Nome" class="btn-edit" style="font-size:11px;">
          <input type="text" id="rank-input-${m.id}" value="${escapeHtml(m.policeRank || '')}" placeholder="Patente" class="btn-edit" style="font-size:11px;">
          <select id="level-select-${m.id}" class="btn-edit" style="font-size:11px;">
            ${[...Array(100).keys()].map(i => `<option value="${i}" ${m.level == i ? 'selected' : ''}>Nv.${i}</option>`).join('')}
          </select>
          <input type="date" id="created-at-input-${m.id}" value="${escapeHtml(formatDateForInput(m.createdAt))}" class="btn-edit" style="font-size:11px;">
          <input type="text" id="avatar-input-${m.id}" value="${escapeHtml(m.avatarUrl || '')}" placeholder="URL da imagem" class="btn-edit" style="font-size:11px;">
          <input type="text" id="twitch-input-${m.id}" value="${escapeHtml(m.twitch || '')}" placeholder="Twitch" class="btn-edit" style="font-size:11px;">
          <input type="text" id="kick-input-${m.id}" value="${escapeHtml(m.kick || '')}" placeholder="Kick" class="btn-edit" style="font-size:11px;">
          <input type="text" id="tiktok-input-${m.id}" value="${escapeHtml(m.tiktok || '')}" placeholder="TikTok" class="btn-edit" style="font-size:11px;">
          <button class="btn-edit" onclick="updateMemberFields('${m.id}')" style="font-size:11px;font-weight:700;">SALVAR</button>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-danger" style="padding: 4px 12px;font-size:11px;" onclick="deleteMember('${m.id}')">REMOVER</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

function renderAdminVehicles() {
  const body = document.getElementById('admin-body');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ADICIONAR VIATURA</h3>
      <div class="form-group"><label>MODELO</label><input id="new-vname" placeholder="Ex: BMW M5"></div>
      <div class="form-group"><label>STATUS</label><select id="new-vstatus"><option value="disponivel">Disponível</option><option value="emuso">Em Uso</option><option value="manutencao">Manutenção</option></select></div>
      <div class="form-group"><label>IMAGEM URL</label><input id="new-vimg" placeholder="https://..."></div>
      <button class="btn btn-primary" onclick="addVehicle()">ADICIONAR VIATURA</button>
    </div>
    <div id="vehicles-list"></div>
  `;
  renderVehiclesList();
}

function renderVehiclesList() {
  const container = document.getElementById('vehicles-list');
  if (!vehicles.length) { container.innerHTML = '<div class="empty-card">Nenhuma viatura</div>'; return; }
  let html = '<div class="admin-seizure-grid">';
  vehicles.forEach(v => {
    html += `<div class="admin-list-item" style="font-size:11px;font-family:'Inter',sans-serif;">
      <div><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#fff;">${escapeHtml(v.name)}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${v.status === 'disponivel' ? 'Disponível' : v.status === 'emuso' ? 'Em Uso' : 'Manutenção'}</div></div>
      <button class="btn btn-danger" style="padding:4px 12px;font-size:11px;font-weight:700;" onclick="deleteVehicle('${v.id}')">REMOVER</button>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderAdminSeizures() {
  adminSeizurePage = 1;
  const body = document.getElementById('admin-body');
  const memberCheckboxes = members.map(m => `<label style="display:inline-flex;align-items:center;gap:4px;font-size:0.68rem;color:var(--text);cursor:pointer;padding:2px 6px;background:rgba(255,255,255,0.05);border-radius:4px;"><input type="checkbox" class="member-checkbox" value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</label>`).join('');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">REGISTRAR APREENSÃO</h3>
      <div class="form-group"><label>QRU</label><select id="new-desc"><option value="">-- Selecione QRU --</option><option value="Caixa registradora">Caixa registradora</option><option value="Venda de drogas">Venda de drogas</option><option value="Assalto à residência">Assalto à residência</option><option value="Roubo de veículo">Roubo de veículo</option><option value="Contrato ilegal">Contrato ilegal</option><option value="Corrida ilegal">Corrida ilegal</option><option value="Arrombamento de veículo">Arrombamento de veículo</option><option value="Posto de combustível">Posto de combustível</option><option value="Ammunation">Ammunation</option><option value="Bebidas">Bebidas</option><option value="Loja de conveniência">Loja de conveniência</option><option value="Joalheria">Joalheria</option><option value="Banco Fleeca">Banco Fleeca</option></select></div>
      <div class="form-group"><label>MEMBROS RESPONSÁVEIS</label><div id="new-members-container" style="display:flex;flex-wrap:wrap;gap:4px;max-height:140px;overflow-y:auto;padding:6px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.08);">${memberCheckboxes}</div></div>
      <div class="form-group"><label>LOCAL</label><input id="new-location" placeholder="Local"></div>
      <div class="form-group"><label>IMAGEM URL</label><input id="new-simg" placeholder="https://..."></div>
      <div class="form-group"><label>BO URL</label><input id="new-bo" placeholder="https://..."></div>
      <button class="btn btn-primary" onclick="addSeizure()">REGISTRAR APREENSÃO</button>
    </div>
    <div id="seizures-list"></div>
  `;
  renderSeizuresList();
}

function renderSeizuresList() {
  const container = document.getElementById('seizures-list');
  if (!seizures.length) { container.innerHTML = '<div class="empty-card">Nenhuma apreensão</div>'; return; }
  const sorted = [...seizures].reverse();
  const totalPages = Math.ceil(sorted.length / ADMIN_SEIZURES_PER_PAGE);
  if (adminSeizurePage > totalPages) adminSeizurePage = totalPages;
  if (adminSeizurePage < 1) adminSeizurePage = 1;
  const start = (adminSeizurePage - 1) * ADMIN_SEIZURES_PER_PAGE;
  const end = Math.min(start + ADMIN_SEIZURES_PER_PAGE, sorted.length);
  const pageItems = sorted.slice(start, end);
  let html = '<div class="admin-seizure-grid">';
  pageItems.forEach(s => {
    const members = getMembersList(s.member);
    const memberText = members.length ? members.join(', ') : '';
    html += `<div class="admin-list-item" style="font-size:10px;font-family:'Inter',sans-serif;">
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#fff;">${escapeHtml(s.description.substring(0, 40))}</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${escapeHtml(memberText)} | ${new Date(s.date).toLocaleDateString('pt-BR')}</div></div>
      <button class="btn btn-danger" style="padding:4px 12px;font-size:10px;font-weight:700;" onclick="deleteSeizure('${s.id}')">REMOVER</button>
    </div>`;
  });
  html += '</div>';
  if (totalPages > 1) {
    html += '<div style="display:flex;justify-content:center;align-items:center;gap:6px;padding:12px 0;font-size:10px;font-weight:700;font-family:\'Inter\',sans-serif;">';
    html += '<button onclick="adminSeizurePage=' + (adminSeizurePage - 1) + ';renderSeizuresList()" style="padding:6px 12px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:\'Inter\',sans-serif;' + (adminSeizurePage <= 1 ? 'opacity:0.3;cursor:default;' : '') + '" ' + (adminSeizurePage <= 1 ? 'disabled' : '') + '>❮</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button onclick="adminSeizurePage=' + i + ';renderSeizuresList()" style="padding:6px 10px;border-radius:4px;border:1px solid ' + (i === adminSeizurePage ? '#fff' : 'rgba(255,255,255,0.15)') + ';background:' + (i === adminSeizurePage ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)') + ';color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:\'Inter\',sans-serif;">' + i + '</button>';
    }
    html += '<button onclick="adminSeizurePage=' + (adminSeizurePage + 1) + ';renderSeizuresList()" style="padding:6px 12px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:\'Inter\',sans-serif;' + (adminSeizurePage >= totalPages ? 'opacity:0.3;cursor:default;' : '') + '" ' + (adminSeizurePage >= totalPages ? 'disabled' : '') + '>❯</button>';
    html += '</div>';
  }
  container.innerHTML = html;
}

function renderAdminGallery() {
  const body = document.getElementById('admin-body');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ADICIONAR FOTO À GALERIA</h3>
      <div class="form-group"><label>TÍTULO</label><input id="new-gallery-title" placeholder="Título da foto"></div>
      <div class="form-group"><label>URL DA IMAGEM</label><input id="new-gallery-img" placeholder="https://..."></div>
      <button class="btn btn-primary" onclick="addGalleryImage()">ADICIONAR À GALERIA</button>
    </div>
    <div id="gallery-list"></div>
  `;
  renderGalleryList();
}

function renderGalleryList() {
  const container = document.getElementById('gallery-list');
  if (!gallery.length) { container.innerHTML = '<div class="empty-card">Nenhuma foto na galeria</div>'; return; }
  let html = '<div class="admin-seizure-grid">';
  [...gallery].reverse().forEach(g => {
    html += `<div class="admin-list-item" style="font-size:11px;font-family:'Inter',sans-serif;">
      <div><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#fff;">${escapeHtml(g.title || 'Sem título')}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${new Date(g.date).toLocaleDateString('pt-BR')}</div></div>
      <button class="btn btn-danger" style="padding:4px 12px;font-size:11px;font-weight:700;" onclick="deleteGalleryImage('${g.id}')">REMOVER</button>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderAdminRankOrder() {
  const body = document.getElementById('admin-body');
  const ranks = [...new Set(members.map(m => m.rank || "Membro"))];
  
  ranks.forEach(rank => {
    if (!rankOrder[rank]) {
      rankOrder[rank] = Object.keys(rankOrder).length + 1;
    }
  });
  
  const sortedRanks = [...ranks].sort((a,b) => (rankOrder[a] || 99) - (rankOrder[b] || 99));
  
  let html = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 11px; font-weight: 700;">REORGANIZAR HIERARQUIA</h3>
      <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 16px;">Clique nos botões para mover as hierarquias de ordem</p>
      <div id="rank-list">
  `;
  
  sortedRanks.forEach((rank, index) => {
    html += `
      <div class="rank-item" data-rank="${escapeHtml(rank)}" style="font-size:11px;font-family:'Inter',sans-serif;">
        <div><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#fff;">${escapeHtml(rank)}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${members.filter(m => m.rank === rank).length} membro(s)</div></div>
        <div class="rank-actions">
          <button onclick="moveRankUp('${escapeHtml(rank)}')" ${index === 0 ? 'disabled style="opacity:0.5;"' : ''} style="font-size:11px;font-weight:700;">↑ SUBIR</button>
          <button onclick="moveRankDown('${escapeHtml(rank)}')" ${index === sortedRanks.length - 1 ? 'disabled style="opacity:0.5;"' : ''} style="font-size:11px;font-weight:700;">↓ DESCER</button>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      <button class="btn btn-primary" style="margin-top: 16px;font-size:11px;font-weight:700;" onclick="saveRankOrderAndRefresh()">SALVAR E ATUALIZAR</button>
    </div>
  `;
  body.innerHTML = html;
}

function renderAdminSettings() {
  const body = document.getElementById('admin-body');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ALTERAR SENHA DO ADMIN</h3>
      <div class="form-group"><label>SENHA ATUAL</label><input type="password" id="admin-old-pwd" placeholder="Senha atual"></div>
      <div class="form-group"><label>NOVA SENHA</label><input type="password" id="admin-new-pwd" placeholder="Nova senha"></div>
      <div class="form-group"><label>CONFIRMAR NOVA SENHA</label><input type="password" id="admin-conf-pwd" placeholder="Confirmar"></div>
      <button class="btn btn-primary" onclick="changeAdminPassword()">ALTERAR SENHA ADMIN</button>
    </div>
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ALTERAR SENHA DOS MEMBROS</h3>
      <div class="form-group"><label>SENHA ATUAL DO ADMIN</label><input type="password" id="members-old-pwd" placeholder="Senha atual do admin"></div>
      <div class="form-group"><label>NOVA SENHA MEMBROS</label><input type="password" id="members-new-pwd" placeholder="Nova senha para membros"></div>
      <div class="form-group"><label>CONFIRMAR NOVA SENHA</label><input type="password" id="members-conf-pwd" placeholder="Confirmar"></div>
      <button class="btn btn-primary" onclick="changeMembersPassword()">ALTERAR SENHA MEMBROS</button>
    </div>
  `;
}

function changeAdminPassword() {
  const oldPwd = document.getElementById('admin-old-pwd').value;
  const newPwd = document.getElementById('admin-new-pwd').value;
  const confPwd = document.getElementById('admin-conf-pwd').value;
  if (oldPwd !== adminPassword) { alert("Senha atual incorreta!"); return; }
  if (!newPwd) { alert("Nova senha não pode ser vazia!"); return; }
  if (newPwd !== confPwd) { alert("As senhas não coincidem!"); return; }
  adminPassword = newPwd;
  saveData();
  alert("Senha do ADMIN alterada com sucesso!");
  renderAdminSettings();
}

function changeMembersPassword() {
  const adminOldPwd = document.getElementById('members-old-pwd').value;
  const newPwd = document.getElementById('members-new-pwd').value;
  const confPwd = document.getElementById('members-conf-pwd').value;
  if (adminOldPwd !== adminPassword) { alert("Senha do ADMIN incorreta!"); return; }
  if (!newPwd) { alert("Nova senha não pode ser vazia!"); return; }
  if (newPwd !== confPwd) { alert("As senhas não coincidem!"); return; }
  membersPassword = newPwd;
  saveData();
  alert("Senha do painel MEMBROS alterada com sucesso!");
  renderAdminSettings();
}

// ========== MEMBERS LIMITED PANEL ==========
function renderMembersSeizures() {
  membersSeizurePage = 1;
  const body = document.getElementById('members-body');
  const memberCheckboxes = members.map(m => `<label style="display:inline-flex;align-items:center;gap:4px;font-size:0.68rem;color:var(--text);cursor:pointer;padding:2px 6px;background:rgba(255,255,255,0.05);border-radius:4px;"><input type="checkbox" class="m-member-checkbox" value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</label>`).join('');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">REGISTRAR APREENSÃO</h3>
      <div class="form-group"><label>QRU</label><select id="m-new-desc"><option value="">-- Selecione QRU --</option><option value="Caixa registradora">Caixa registradora</option><option value="Venda de drogas">Venda de drogas</option><option value="Assalto à residência">Assalto à residência</option><option value="Roubo de veículo">Roubo de veículo</option><option value="Contrato ilegal">Contrato ilegal</option><option value="Corrida ilegal">Corrida ilegal</option><option value="Arrombamento de veículo">Arrombamento de veículo</option><option value="Posto de combustível">Posto de combustível</option><option value="Ammunation">Ammunation</option><option value="Bebidas">Bebidas</option><option value="Loja de conveniência">Loja de conveniência</option><option value="Joalheria">Joalheria</option><option value="Banco Fleeca">Banco Fleeca</option></select></div>
      <div class="form-group"><label>MEMBROS RESPONSÁVEIS</label><div id="m-new-members-container" style="display:flex;flex-wrap:wrap;gap:4px;max-height:140px;overflow-y:auto;padding:6px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.08);">${memberCheckboxes}</div></div>
      <div class="form-group"><label>LOCAL</label><input id="m-new-location" placeholder="Local"></div>
      <div class="form-group"><label>IMAGEM URL</label><input id="m-new-simg" placeholder="https://..."></div>
      <div class="form-group"><label>BO URL</label><input id="m-new-bo" placeholder="https://..."></div>
      <button class="btn btn-primary" onclick="addSeizureMembers()">REGISTRAR APREENSÃO</button>
    </div>
    <div id="seizures-list-members"></div>
  `;
  renderSeizuresListMembers();
}

function renderSeizuresListMembers() {
  const container = document.getElementById('seizures-list-members');
  if (!seizures.length) { container.innerHTML = '<div class="empty-card">Nenhuma apreensão</div>'; return; }
  const sorted = [...seizures].reverse();
  const totalPages = Math.ceil(sorted.length / ADMIN_SEIZURES_PER_PAGE);
  if (membersSeizurePage > totalPages) membersSeizurePage = totalPages;
  if (membersSeizurePage < 1) membersSeizurePage = 1;
  const start = (membersSeizurePage - 1) * ADMIN_SEIZURES_PER_PAGE;
  const end = Math.min(start + ADMIN_SEIZURES_PER_PAGE, sorted.length);
  const pageItems = sorted.slice(start, end);
  let html = '<div class="admin-seizure-grid">';
  pageItems.forEach(s => {
    const members = getMembersList(s.member);
    const memberText = members.length ? members.join(', ') : '';
    html += `<div class="admin-list-item" style="font-size:10px;font-family:'Inter',sans-serif;">
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#fff;">${escapeHtml(s.description.substring(0, 40))}</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${escapeHtml(memberText)} | ${new Date(s.date).toLocaleDateString('pt-BR')}</div></div>
    </div>`;
  });
  html += '</div>';
  if (totalPages > 1) {
    html += '<div style="display:flex;justify-content:center;align-items:center;gap:6px;padding:12px 0;font-size:10px;font-weight:700;font-family:\'Inter\',sans-serif;">';
    html += '<button onclick="membersSeizurePage=' + (membersSeizurePage - 1) + ';renderSeizuresListMembers()" style="padding:6px 12px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:\'Inter\',sans-serif;' + (membersSeizurePage <= 1 ? 'opacity:0.3;cursor:default;' : '') + '" ' + (membersSeizurePage <= 1 ? 'disabled' : '') + '>❮</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button onclick="membersSeizurePage=' + i + ';renderSeizuresListMembers()" style="padding:6px 10px;border-radius:4px;border:1px solid ' + (i === membersSeizurePage ? '#fff' : 'rgba(255,255,255,0.15)') + ';background:' + (i === membersSeizurePage ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)') + ';color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:\'Inter\',sans-serif;">' + i + '</button>';
    }
    html += '<button onclick="membersSeizurePage=' + (membersSeizurePage + 1) + ';renderSeizuresListMembers()" style="padding:6px 12px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:\'Inter\',sans-serif;' + (membersSeizurePage >= totalPages ? 'opacity:0.3;cursor:default;' : '') + '" ' + (membersSeizurePage >= totalPages ? 'disabled' : '') + '>❯</button>';
    html += '</div>';
  }
  container.innerHTML = html;
}

function addSeizureMembers() {
  const desc = document.getElementById('m-new-desc').value.trim();
  const checkboxes = document.querySelectorAll('#m-new-members-container .m-member-checkbox:checked');
  const members = Array.from(checkboxes).map(cb => cb.value);
  const location = document.getElementById('m-new-location').value.trim();
  const imageUrl = document.getElementById('m-new-simg').value.trim();
  const boImageUrl = document.getElementById('m-new-bo').value.trim();
  if (!desc) { alert("Informe o QRU"); return; }
  seizures.push({ id: Date.now().toString(), description: desc, member: members, location, imageUrl, boImageUrl, date: new Date().toISOString() });
  membersSeizurePage = 1;
  saveData();
  renderAll();
  renderMembersSeizures();
}

function renderMembersVehicles() {
  const body = document.getElementById('members-body');
  body.innerHTML = `<div class="empty-card">⚠️ Acesso restrito. Utilize o painel ADMIN para gerenciar viaturas.</div>`;
}

function renderMembersGallery() {
  const body = document.getElementById('members-body');
  body.innerHTML = `<div class="empty-card">⚠️ Acesso restrito. Utilize o painel ADMIN para gerenciar a galeria.</div>`;
}

function renderMembersMembers() {
  const body = document.getElementById('members-body');
  body.innerHTML = `<div class="empty-card">⚠️ Acesso restrito. Utilize o painel ADMIN para gerenciar membros.</div>`;
}

// ========== CRUD OPERATIONS ==========
function updateMemberFields(id) {
  const newName = document.getElementById(`name-input-${id}`).value.trim();
  const newPoliceRank = document.getElementById(`rank-input-${id}`).value.trim();
  const newLevel = document.getElementById(`level-select-${id}`).value;
  const newCreatedAt = document.getElementById(`created-at-input-${id}`).value;
  const newAvatarUrl = document.getElementById(`avatar-input-${id}`).value.trim();
  const newTwitch = document.getElementById(`twitch-input-${id}`).value.trim().toLowerCase();
  const newKickRaw = document.getElementById(`kick-input-${id}`).value.trim();
  const newKick = normalizeKickUsername(newKickRaw);
  const newTikTok = document.getElementById(`tiktok-input-${id}`).value.trim().toLowerCase();
  const member = members.find(m => m.id === id);
  if (member) {
    if (newName) member.name = newName;
    member.policeRank = newPoliceRank || member.policeRank || 'Soldado';
    member.level = newLevel;
    if (newCreatedAt) {
      const parsedDate = parseStoredDate(newCreatedAt);
      if (!parsedDate) {
        alert('Data de cadastro inválida');
        return;
      }
      member.createdAt = newCreatedAt;
    }
    member.avatarUrl = newAvatarUrl || null;
    member.twitch = newTwitch || null;
    member.kick = newKick || null;
    member.tiktok = newTikTok || null;
    saveData();
    renderAll();
    renderAdminMembers();
    updateAllStreamStatus();
  }
}

function addMember() {
  const name = document.getElementById('new-name').value.trim();
  const policeRank = document.getElementById('new-police-rank').value.trim();
  let rank = document.getElementById('new-rank').value.trim();
  
  // Se selecionou "criar nova", pegar o valor do input customizado
  if (rank === '__new__') {
    rank = document.getElementById('new-rank-custom').value.trim();
  }
  
  const level = document.getElementById('new-level').value;
  const status = document.getElementById('new-status').value;
  const createdAtInput = document.getElementById('new-created-at').value;
  const avatarUrl = document.getElementById('new-avatar').value.trim();
  const twitch = document.getElementById('new-twitch').value.trim().toLowerCase();
  const kickRaw = document.getElementById('new-kick').value.trim();
  const kick = normalizeKickUsername(kickRaw);
  const tiktokRaw = document.getElementById('new-tiktok').value.trim();
  const tiktok = normalizeTikTokUsername(tiktokRaw);
  
  if (!name || !policeRank) { alert("Preencha nome e patente policial"); return; }
  if (!rank) { alert("Selecione ou crie uma hierarquia"); return; }
  
  let createdAt = formatDateForInput(new Date());
  if (createdAtInput) {
    const parsedDate = parseStoredDate(createdAtInput);
    if (!parsedDate) {
      alert('Data de cadastro inválida');
      return;
    }
    createdAt = createdAtInput;
  }
  
  const newMember = { 
    id: Date.now().toString(), 
    name, 
    policeRank: policeRank || 'Soldado', 
    rank,  // NOVO: campo de hierarquia
    level, 
    status, 
    avatarUrl, 
    twitch, 
    kick, 
    tiktok,
    createdAt,
  };

  members.push(newMember);
  saveData();
  renderAll();
  renderAdminMembers();
  resetAddMemberForm();
}

function resetAddMemberForm() {
  document.getElementById('new-name').value = '';
  document.getElementById('new-police-rank').value = '';
  document.getElementById('new-rank').value = '';
  document.getElementById('new-rank-custom').value = '';
  document.getElementById('new-level').value = '';
  document.getElementById('new-status').value = 'ativo';
  document.getElementById('new-created-at').value = '';
  document.getElementById('new-avatar').value = '';
  document.getElementById('new-twitch').value = '';
  document.getElementById('new-kick').value = '';
  document.getElementById('new-tiktok').value = '';
}

function deleteMember(id) {
  if (!confirm("Remover este membro permanentemente?")) return;
  members = members.filter(m => m.id !== id);
  saveData();
  renderAll();
  renderAdminMembers();
}

function addVehicle() {
  const name = document.getElementById('new-vname').value.trim();
  const status = document.getElementById('new-vstatus').value;
  const imageUrl = document.getElementById('new-vimg').value.trim();
  if (!name) { alert("Informe o modelo"); return; }
  vehicles.push({ id: Date.now().toString(), name, status, imageUrl });
  saveData();
  renderAll();
  renderAdminVehicles();
}

function deleteVehicle(id) {
  if (!confirm("Remover esta viatura?")) return;
  vehicles = vehicles.filter(v => v.id !== id);
  saveData();
  renderAll();
  renderAdminVehicles();
}

function addSeizure() {
  const desc = document.getElementById('new-desc').value.trim();
  const checkboxes = document.querySelectorAll('#new-members-container .member-checkbox:checked');
  const members = Array.from(checkboxes).map(cb => cb.value);
  const location = document.getElementById('new-location').value.trim();
  const imageUrl = document.getElementById('new-simg').value.trim();
  const boImageUrl = document.getElementById('new-bo').value.trim();
  if (!desc) { alert("Informe o QRU"); return; }
  seizures.push({ id: Date.now().toString(), description: desc, member: members, location, imageUrl, boImageUrl, date: new Date().toISOString() });
  adminSeizurePage = 1;
  saveData();
  renderAll();
  renderAdminSeizures();
}

function deleteSeizure(id) {
  if (!confirm("Remover esta apreensão?")) return;
  seizures = seizures.filter(s => s.id !== id);
  saveData();
  renderAll();
  renderAdminSeizures();
}

function addGalleryImage() {
  const title = document.getElementById('new-gallery-title').value.trim();
  const imageUrl = document.getElementById('new-gallery-img').value.trim();
  if (!imageUrl) { alert("Informe a URL da imagem"); return; }
  gallery.push({ id: Date.now().toString(), title: title || 'Sem título', imageUrl, date: new Date().toISOString() });
  saveData();
  renderAll();
  renderAdminGallery();
}

function deleteGalleryImage(id) {
  if (!confirm("Remover esta foto da galeria?")) return;
  gallery = gallery.filter(g => g.id !== id);
  saveData();
  renderAll();
  renderAdminGallery();
}

function moveRankUp(rank) {
  const currentPos = rankOrder[rank];
  if (!currentPos) return;
  let rankAbove = null;
  let highestPosBelowCurrent = 0;
  for (const [r, pos] of Object.entries(rankOrder)) {
    if (pos < currentPos && pos > highestPosBelowCurrent) {
      highestPosBelowCurrent = pos;
      rankAbove = r;
    }
  }
  if (rankAbove) {
    rankOrder[rank] = highestPosBelowCurrent;
    rankOrder[rankAbove] = currentPos;
    renderAdminRankOrder();
  }
}

function moveRankDown(rank) {
  const currentPos = rankOrder[rank];
  if (!currentPos) return;
  let rankBelow = null;
  let lowestPosAboveCurrent = 999;
  for (const [r, pos] of Object.entries(rankOrder)) {
    if (pos > currentPos && pos < lowestPosAboveCurrent) {
      lowestPosAboveCurrent = pos;
      rankBelow = r;
    }
  }
  if (rankBelow) {
    rankOrder[rank] = lowestPosAboveCurrent;
    rankOrder[rankBelow] = currentPos;
    renderAdminRankOrder();
  }
}

function saveRankOrderAndRefresh() {
  saveData();
  renderAll();
  alert("Ordem da hierarquia salva com sucesso!");
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#39;';
    return m;
  });
}

// ==================== MEMBER PROFILE PANEL ====================
let currentMemberProfile = null;

function openMemberProfile(memberName) {
  try {
    console.log('🔍 Abrindo perfil do membro:', memberName);
    const member = members.find(m => m.name === memberName);
    
    if (!member) {
      console.error('❌ Membro não encontrado:', memberName);
      alert('Erro: Membro não encontrado');
      return;
    }
    
    currentMemberProfile = member;
    renderMemberProfile(member);
    
    const panel = document.getElementById('member-profile-panel');
    const backdrop = document.getElementById('member-profile-backdrop');
    
    if (panel) {
      panel.classList.add('active');
      console.log('✓ Painel ativado');
    }
    if (backdrop) {
      backdrop.classList.add('active');
      backdrop.onclick = closeMemberProfile;
    }
    
    document.addEventListener('keydown', handleProfileEscape);
  } catch (error) {
    console.error('❌ Erro ao abrir perfil:', error);
    alert('Erro ao abrir perfil do membro. Verifique o console.');
  }
}

function closeMemberProfile() {
  try {
    console.log('🔴 Fechando painel do membro...');
    const panel = document.getElementById('member-profile-panel');
    const backdrop = document.getElementById('member-profile-backdrop');
    
    if (panel) {
      panel.classList.remove('active');
      console.log('✓ Classe active removida do painel');
    }
    if (backdrop) {
      backdrop.classList.remove('active');
      console.log('✓ Classe active removida do backdrop');
    }
    
    currentMemberProfile = null;
    document.removeEventListener('keydown', handleProfileEscape);
    
    // Re-renderizar apreensões com garantias múltiplas
    console.log(`📊 Seizures array tem ${seizures.length} itens`);
    console.log('📍 Tentando renderizar apreensões após fechar painel...');
    
    // Primeira tentativa - imediata
    renderSeizures();
    console.log('✓ renderSeizures() chamada (imediata)');
    
    // Segunda tentativa - após 100ms
    setTimeout(() => {
      renderSeizures();
      console.log('✓ renderSeizures() chamada (100ms)');
    }, 100);
    
    // Terceira tentativa - após 300ms
    setTimeout(() => {
      renderSeizures();
      console.log('✓ renderSeizures() chamada (300ms)');
    }, 300);
    
    // Quarta tentativa - após 500ms
    setTimeout(() => {
      const container = document.getElementById('seizures-content');
      if (container && container.innerHTML.trim() === '') {
        console.warn('⚠️ Container vazio! Renderizando novamente...');
        renderSeizures();
        console.log('✓ renderSeizures() chamada (500ms - fallback)');
      }
    }, 500);
    
    console.log('✓ Painel fechado');
  } catch (error) {
    console.error('❌ Erro ao fechar perfil:', error);
    // Forçar renderização mesmo em caso de erro
    setTimeout(() => {
      renderSeizures();
      console.log('✓ renderSeizures() chamada (fallback de erro)');
    }, 300);
  }
}

function handleProfileEscape(e) {
  if (e.key === 'Escape') {
    closeMemberProfile();
  }
}

function renderMemberProfile(member) {
  try {
    console.log('🎨 Renderizando perfil de:', member.name);
    const content = document.getElementById('member-profile-content');
    if (!content) {
      console.error('❌ Elemento member-profile-content não encontrado');
      return;
    }
    
    const seizureCount = getMemberSeizureCount(member.name);
    const memberSeizures = seizures.filter(s => {
      const ms = getMembersList(s.member || s.memberName);
      return ms.includes(member.name);
    });
    const avatarUrl = member.avatarUrl || 'https://placehold.co/80x80/1a1a1a/9146ff?text=👤';
    
    console.log(`📊 ${member.name} tem ${seizureCount} apreensões`);
    
    let seizuresHtml = '';
    if (memberSeizures.length === 0) {
      seizuresHtml = '<div style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 0.85rem;">Nenhuma apreensão cadastrada</div>';
    } else {
      const sortedMemberSeizures = [...memberSeizures]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
      seizuresHtml = sortedMemberSeizures.map((seizure, idx) => {
        try {
          const seizureDate = new Date(seizure.date);
          const dateStr = seizureDate.toLocaleDateString('pt-BR');
          const description = seizure.description || seizure.title || 'Apreensão sem descrição';
          const imageUrl = seizure.imageUrl || seizure.boImageUrl || '';
          const thumbnail = imageUrl || 'https://placehold.co/120x120/1a1a1a/ffffff?text=%3F';
          return `
            <div class="seizure-item" onclick="openImageModal('${escapeHtml(imageUrl)}')">
              <div class="seizure-item-bg" style="background-image:url('${escapeHtml(thumbnail)}')"></div>
              <div class="seizure-item-overlay">
                <div class="seizure-item-title">${escapeHtml(description)}</div>
                <div class="seizure-item-date">${dateStr}</div>
              </div>
            </div>
          `;
        } catch (e) {
          console.error('Erro ao renderizar apreensão:', e, seizure);
          return '';
        }
      }).join('');
    }
    
    const status = member.status === 'ativo' ? '🟢 Ativo' : '🔴 Inativo';
    const statusColor = member.status === 'ativo' ? 'var(--success)' : 'var(--danger)';
    
    content.innerHTML = `
      <div class="member-profile-main-row">
        <div class="member-profile-hero">
          <div class="member-profile-avatar-wrapper">
            <div class="member-profile-avatar-inner">
              <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(member.name)}" class="member-profile-avatar" onerror="this.src='https://placehold.co/140x140/1a1a1a/9146ff?text=👤'">
              <div class="member-avatar-overlay">
                <div class="member-avatar-title">${escapeHtml(member.name)}</div>
                <div class="member-avatar-badges">
                  <span class="member-profile-rank">${escapeHtml(member.policeRank || 'Soldado')}</span>
                  <span class="member-profile-hierarchy">${escapeHtml(member.rank || 'Membro')}</span>
                  ${member.twitch ? `
                  <a href="https://twitch.tv/${escapeHtml(member.twitch)}" target="_blank" class="twitch-link" aria-label="Abrir canal Twitch">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.767-6.767V0H2.149zm15.966 13.23l-3.737 3.737H9.851L7.347 19.28v-2.313H4.028V1.577h14.087v11.653z" fill="currentColor"/>
                      <rect x="11.636" y="4.769" width="1.577" height="5.731" fill="currentColor"/>
                      <rect x="15.825" y="4.769" width="1.577" height="5.731" fill="currentColor"/>
                    </svg>
                  </a>
                  ` : ''}
                  ${member.tiktok ? `
                  <a href="https://tiktok.com/@${escapeHtml(member.tiktok)}" target="_blank" class="twitch-link" aria-label="Abrir canal TikTok">
                    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="color:#ff0050;">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                  ` : ''}
                </div>
                <div class="member-avatar-stats">
                  <div class="member-avatar-stat">
                    <span>Nível</span>
                    <strong>${member.level || '-'}</strong>
                  </div>
                  <div class="member-avatar-stat">
                    <span>Apreensões</span>
                    <strong>${seizureCount}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="seizures-carousel-wrapper">
        <div class="seizures-carousel-title">📸 Últimas 10 apreensões</div>
        <div class="seizures-carousel-container">
          ${seizuresHtml}
        </div>
      </div>
    `;

    console.log('✓ Perfil renderizado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao renderizar perfil:', error);
    const content = document.getElementById('member-profile-content');
    if (content) {
      content.innerHTML = `<div style="padding: 20px; color: var(--danger);">Erro ao carregar perfil. Verifique o console.</div>`;
    }
  }
}

function navigationMemberProfile(direction) {
  try {
    if (!currentMemberProfile) return;
    
    const currentIndex = members.findIndex(m => m.name === currentMemberProfile.name);
    let newIndex = currentIndex;
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < members.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      const newMember = members[newIndex];
      console.log('➡️ Navegando para:', newMember.name);
      openMemberProfile(newMember.name);
    }
  } catch (error) {
    console.error('❌ Erro ao navegar:', error);
  }
}

function openImageModal(imageUrl) {
  try {
    if (!imageUrl) {
      console.warn('⚠️ URL de imagem vazia');
      return;
    }
    const modal = document.getElementById('imgModal');
    const modalImg = document.getElementById('img01');
    
    if (modal && modalImg) {
      modal.style.display = 'block';
      modalImg.src = imageUrl;
      console.log('📸 Abrindo imagem');
    } else {
      console.error('❌ Elementos do modal não encontrados');
    }
  } catch (error) {
    console.error('❌ Erro ao abrir imagem:', error);
  }
}

// ==================== REVEAL ON SCROLL ====================
function initRevealOnScroll() {
  // Função substituída por initRevealObserver() e observeRevealElements()
  // que reutilizam o observer global
  observeRevealElements();
}

// ==================== INICIALIZAÇÃO DE EVENT LISTENERS ====================
function initEventListeners() {
  // Listener de click para carrossel
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.carousel-btn[data-carousel-type][data-carousel-direction]');
    if (btn && !btn.disabled) {
      const type = btn.dataset.carouselType;
      const direction = btn.dataset.carouselDirection;
      carouselPrevNext(type, direction);
    }
  });

  // Navegação por teclado no carrossel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Verificar se estamos dentro de um input
      if (e.target.tagName === 'INPUT') return;
      
      const carousels = document.querySelectorAll('[id$="-content"]');
      let currentCarousel = null;
      
      // Encontrar qual carrossel está mais próximo do foco
      for (const carousel of carousels) {
        if (carousel.querySelector('.carousel-btn')) {
          currentCarousel = carousel;
          break;
        }
      }
      
      if (currentCarousel) {
        const buttons = currentCarousel.querySelectorAll('.carousel-btn[data-carousel-type]');
        if (buttons.length > 0) {
          const type = buttons[0].dataset.carouselType;
          const direction = e.key === 'ArrowLeft' ? 'prev' : 'next';
          const btn = currentCarousel.querySelector(`[data-carousel-direction="${direction}"]`);
          if (btn && !btn.disabled) {
            carouselPrevNext(type, direction);
          }
        }
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const adminOpen = document.getElementById('admin-overlay')?.classList.contains('open');
      const membersOpen = document.getElementById('members-overlay')?.classList.contains('open');
      if (adminOpen) closeAdminPanel();
      if (membersOpen) closeMembersPanel();
    }
  });
}

// ==================== INIT ====================
// ==================== FIREBASE INITIALIZATION ====================
const firebaseConfig = {
  apiKey: "AIzaSyBnwLlzDs363_5KBhH1iHNCHWZJa3aZGIg",
  authDomain: "rocam-55ccd.firebaseapp.com",
  projectId: "rocam-55ccd",
  storageBucket: "rocam-55ccd.firebasestorage.app",
  messagingSenderId: "264193595563",
  appId: "1:264193595563:web:3d9b60f6b112f183663fee",
  measurementId: "G-8FDS6ML6VK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
console.log('✓ Firebase inicializado');

window.addEventListener('DOMContentLoaded', () => {
  // Configurar intro ANTES de carregar dados
  const intro = document.getElementById('intro');
  const splashShown = sessionStorage.getItem('rocamSplashShown') === 'true';
  
  console.log('🔄 DOMContentLoaded iniciado');
  console.log('intro elemento:', intro ? '✓ encontrado' : '✗ não encontrado');
  console.log('splashShown:', splashShown);
  
  // Função para remover o intro
  const hideIntro = () => {
    if (intro && !intro.classList.contains('hidden')) {
      console.log('🎬 Removendo intro...');
      intro.classList.add('hidden');
      const onTransitionEnd = () => {
        intro.removeEventListener('transitionend', onTransitionEnd);
        setTimeout(initRevealOnScroll, 300);
      };
      intro.addEventListener('transitionend', onTransitionEnd);
      sessionStorage.setItem('rocamSplashShown', 'true');
    }
  };
  
  if (intro) {
    if (splashShown) {
      console.log('✓ Visita anterior - pulando splash');
      intro.classList.add('hidden');
      initRevealOnScroll();
    } else {
      console.log('⏳ Primeira visita - exibindo splash por 4.5s');
      setTimeout(hideIntro, 4500);

      // FALLBACK: Se ainda estiver visível após 8s, força remover
      setTimeout(() => {
        if (intro && !intro.classList.contains('hidden')) {
          console.log('⚠️ FALLBACK: Forçando remoção do intro após 8s');
          hideIntro();
        }
      }, 8000);
    }
  }
  
  // Carregar dados do Firebase (agora sim, após intro configurado)
  console.log('📡 Iniciando carregamento do Firebase...');
  loadData();
  initRevealObserver();
  initEventListeners();
  
  // Atualizar status dos streams uma vez ao carregar
  updateAllStreamStatus().catch(err => console.error('Erro ao atualizar status dos streams:', err));
  
  // Criar overlays com tratamento de erros
  try {
    const adminOverlay = document.createElement('div');
    adminOverlay.className = 'overlay';
    adminOverlay.id = 'admin-overlay';
    adminOverlay.innerHTML = `
      <div class="admin-panel">
        <div class="admin-header"><h2>PAINEL ADMINISTRATIVO</h2><button class="btn btn-secondary" onclick="closeAdminPanel()">FECHAR</button></div>
        <div class="admin-tabs">
          <div class="admin-tab active">APREENSÕES</div>
          <div class="admin-tab">MEMBROS</div>
          <div class="admin-tab">GALERIA</div>
          <div class="admin-tab">VIATURAS</div>
          <div class="admin-tab">ORDEM</div>
          <div class="admin-tab">CONFIG</div>
        </div>
        <div class="admin-body" id="admin-body"></div>
      </div>
    `;
    document.body.appendChild(adminOverlay);
    console.log('✓ Admin overlay created successfully');
    
    const membersOverlay = document.createElement('div');
    membersOverlay.className = 'overlay';
    membersOverlay.id = 'members-overlay';
    membersOverlay.innerHTML = `
      <div class="admin-panel">
        <div class="admin-header"><h2>PAINEL MEMBROS</h2><button class="btn btn-secondary" onclick="closeMembersPanel()">FECHAR</button></div>
        <div class="admin-tabs">
          <div class="admin-tab active">APREENSÕES</div>
          <div class="admin-tab">GALERIA</div>
          <div class="admin-tab">VIATURAS</div>
          <div class="admin-tab">MEMBROS</div>
        </div>
        <div class="admin-body" id="members-body"></div>
      </div>
    `;
    document.body.appendChild(membersOverlay);
    console.log('✓ Members overlay created successfully');
    
    // Re-attach event listeners
    const adminTabs = document.querySelectorAll('#admin-overlay .admin-tab');
    if (adminTabs.length >= 6) {
      adminTabs[0].onclick = () => switchAdminTab('seizures');
      adminTabs[1].onclick = () => switchAdminTab('members');
      adminTabs[2].onclick = () => switchAdminTab('gallery');
      adminTabs[3].onclick = () => switchAdminTab('vehicles');
      adminTabs[4].onclick = () => switchAdminTab('rankOrder');
      adminTabs[5].onclick = () => switchAdminTab('settings');
      console.log('✓ Admin tabs event listeners attached');
    }
    
    const membersTabs = document.querySelectorAll('#members-overlay .admin-tab');
    if (membersTabs.length >= 4) {
      membersTabs[0].onclick = () => switchMembersTab('seizures');
      membersTabs[1].onclick = () => switchMembersTab('gallery');
      membersTabs[2].onclick = () => switchMembersTab('vehicles');
      membersTabs[3].onclick = () => switchMembersTab('members');
      console.log('✓ Members tabs event listeners attached');
    }
  } catch (error) {
    console.error('ERROR creating admin/members overlays:', error);
    alert('Erro ao inicializar painéis administrativos. Verifique o console para mais detalhes.');
  }
  
  // Adicionar listener de scroll com proteção
  if (!scrollListenerActive) {
    scrollListenerActive = true;
    const scrollHandler = () => {
      const sections = document.querySelectorAll('section');
      const navLinks = document.querySelectorAll('.nav-links a');
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionBottom = sectionTop + section.offsetHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
          current = section.getAttribute('id');
        }
      });
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    };
    window.addEventListener('scroll', scrollHandler);
  }
});
</script>
