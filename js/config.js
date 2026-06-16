let members = [];
let seizures = [];
let gallery = [];
let negocios = [];
const SINALOA_DEBUG = false;

function debugLog(...args) {
  if (SINALOA_DEBUG) console.log(...args);
}

let rankOrder = {};
let clientesInativos = [];
let tiposInativos = [];
let currentAuthUser = null;
let adminSeizurePage = 1;
let membersSeizurePage = 1;
const ADMIN_SEIZURES_PER_PAGE = 8;
const ADMIN_GALLERY_PER_PAGE = 6;
let adminGalleryPage = 1;
const ADMIN_NEGOCIOS_PER_PAGE = 10;

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
      const { songUrl, songTitle, avatar, photoUrl, twitchLive, twitchCategory, twitchViewers, kickLive, kick, tiktokLive, tiktok, ...cleanMember } = member;
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

let galleryPage = 0;
let seizuresPage = 0;
let liveMembersPage = 0;
const LIVE_MEMBERS_PER_PAGE = 2;

let revealObserver = null;
let dataListenerRegistered = false;
let firebaseInitialSyncCompleted = false;
let scrollListenerActive = false;
let streamStatusUpdateScheduled = false;

function initRevealObserver() {
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
    debugLog('👁️ Animações adiadas até o intro ser removido');
    return;
  }

  if (!revealObserver) initRevealObserver();
  
  const elements = document.querySelectorAll(
    '.member-card.reveal, .seizure-card, .gallery-card, .live-card-thumbnail, .reveal, .reveal-left, .reveal-right, .section-title, .section-title-wrapper'
  );
  
  elements.forEach(el => {
    revealObserver.observe(el);
    
    const rect = el.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isVisible) {
      el.classList.add('visible');
    }
  });
}

function loadData() {
  try {
    debugLog('🔄 loadData() iniciado');
    
    if (dataListenerRegistered) {
      debugLog('⏭️ Listener já registrado, ignorando...');
      return;
    }
    
      try {
        const localMembers = localStorage.getItem('sinaloa_members');
        if (localMembers) {
          members = sanitizeMembersData(normalizeArrayData(JSON.parse(localMembers)));
          seizures = normalizeArrayData(JSON.parse(localStorage.getItem('sinaloa_seizures') || '[]'));
          gallery = normalizeArrayData(JSON.parse(localStorage.getItem('sinaloa_gallery') || '[]'));
          negocios = normalizeArrayData(JSON.parse(localStorage.getItem('sinaloa_negocios') || '[]'));
          const savedRankOrder = localStorage.getItem('sinaloa_rankOrder');
          rankOrder = savedRankOrder ? JSON.parse(savedRankOrder) : {};
          const savedClientesInativos = localStorage.getItem('sinaloa_clientesInativos');
          clientesInativos = savedClientesInativos ? JSON.parse(savedClientesInativos) : [];
          const savedTiposInativos = localStorage.getItem('sinaloa_tiposInativos');
          tiposInativos = savedTiposInativos ? JSON.parse(savedTiposInativos) : [];
          localStorage.setItem('sinaloa_members', JSON.stringify(members));
          debugLog('💾 Dados carregados de localStorage e normalizados');
        }
      } catch(e) {
        console.warn('⚠️ Erro ao carregar de localStorage:', e);
      }
    
    try {
      const db = firebase.database();
      const dataRef = db.ref('sinaloa-data');
      
      debugLog('📥 Registrando listener do Firebase para sinaloa-data (primeira vez)');
      dataListenerRegistered = true;
      
      dataRef.on('value', (snapshot) => {
        debugLog('✅ Firebase retornou:', {
          exists: snapshot.exists(),
          numChildren: snapshot.numChildren(),
          valor: snapshot.val()
        });
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          debugLog('📦 Dados do Firebase:', {
            members: data.members ? data.members.length : 0,
            seizures: data.seizures ? data.seizures.length : 0,
            gallery: data.gallery ? data.gallery.length : 0,
            negocios: data.negocios ? data.negocios.length : 0
          });
          
          debugLog('📦 Atualizando variáveis globais com dados do Firebase');
          members = sanitizeMembersData(normalizeArrayData(data.members));
          seizures = normalizeArrayData(data.seizures);
          gallery = normalizeArrayData(data.gallery);
          negocios = normalizeArrayData(data.negocios);
          rankOrder = data.rankOrder || {};
          clientesInativos = data.clientesInativos || [];
          tiposInativos = data.tiposInativos || [];
          debugLog('✓ Dados carregados com sucesso do Firebase', { 
            members: members.length,
            seizures: seizures.length,
            gallery: gallery.length,
            negocios: negocios.length,
            clientesInativos: clientesInativos.length,
            tiposInativos: tiposInativos.length
          });
        } else {
          debugLog('ℹ️ Firebase vazio, usando dados do localStorage');
        }
        firebaseInitialSyncCompleted = true;
        debugLog('✅ Firebase initial sync completed');
        try { renderHierarchy(); } catch(e) { console.error('renderHierarchy error:', e); }
        try { renderLiveMembers(); } catch(e) { console.error('renderLiveMembers error:', e); }
        try { renderSeizures(); } catch(e) { console.error('renderSeizures error:', e); }
        try { renderNegocios(); } catch(e) { console.error('renderNegocios error:', e); }
        updateStats();
        if (typeof updateAllStreamStatus === 'function') {
          setTimeout(() => updateAllStreamStatus(true), 50);
        }
      }, (error) => {
        console.warn('⚠️ Erro ao carregar do Firebase:', error);
        debugLog('💾 Usando dados do localStorage');
        debugLog('🎨 Chamando renderAll()');
        renderAll();
      });
    } catch(e) { 
      console.warn('⚠️ Firebase indisponível:', e);
      debugLog('💾 Usando dados do localStorage');
      renderAll();
    }
  } catch(e) { 
    console.error('❌ Erro crítico em loadData:', e);
    renderAll();
  }
}

function saveData() {
  try {
    debugLog('💾 Tentando salvar dados:', {
      members: members.length,
        seizures: seizures.length,
        gallery: gallery.length,
        negocios: negocios.length,
        clientesInativos: clientesInativos.length,
        tiposInativos: tiposInativos.length
    });
    
    const sanitizedMembers = sanitizeMembersData(members);
    members = sanitizedMembers;
    
    const dataToSave = {
      members: sanitizedMembers,
      seizures: seizures,
      gallery: gallery,
      negocios: negocios,
      rankOrder: rankOrder,
      clientesInativos: clientesInativos,
      tiposInativos: tiposInativos,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('sinaloa_members', JSON.stringify(members));
      localStorage.setItem('sinaloa_seizures', JSON.stringify(seizures));
      localStorage.setItem('sinaloa_gallery', JSON.stringify(gallery));
      localStorage.setItem('sinaloa_negocios', JSON.stringify(negocios));
      localStorage.setItem('sinaloa_rankOrder', JSON.stringify(rankOrder));
      localStorage.setItem('sinaloa_clientesInativos', JSON.stringify(clientesInativos));
      localStorage.setItem('sinaloa_tiposInativos', JSON.stringify(tiposInativos));
      debugLog('✓ Dados salvos em localStorage');
    } catch(e) {
      console.warn('⚠️ Erro ao salvar em localStorage:', e);
    }
    
    try {
      const db = firebase.database();
      const dataRef = db.ref('sinaloa-data');
      
      debugLog('📡 Enviando dados para Firebase em sinaloa-data');
      dataRef.set(dataToSave, (error) => {
        if (error) {
          console.error('❌ Erro ao salvar no Firebase:', error);
          debugLog('⚠️ Dados salvos apenas em localStorage');
        } else {
          debugLog('✅ Dados salvos NO FIREBASE com sucesso!');
        }
      });
    } catch(e) {
      console.error('❌ Firebase indisponível:', e);
      debugLog('⚠️ Dados salvos apenas em localStorage');
    }
  } catch(e) {
    console.error('❌ Erro em saveData:', e);
  }
}
firebase.initializeApp(window.SINALOA_FIREBASE_CONFIG);
debugLog('✓ Firebase inicializado');
