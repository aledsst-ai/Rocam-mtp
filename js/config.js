let members = [];
let vehicles = [];
let seizures = [];
let gallery = [];
let rankOrder = {};
let currentAuthUser = null;
let adminSeizurePage = 1;
let membersSeizurePage = 1;
const ADMIN_SEIZURES_PER_PAGE = 8;
const ADMIN_GALLERY_PER_PAGE = 6;
let adminGalleryPage = 1;

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
    console.log('👁️ Animações adiadas até o intro ser removido');
    return;
  }

  if (!revealObserver) initRevealObserver();
  
  const elements = document.querySelectorAll(
    '.member-card.reveal, .vehicle-card, .seizure-card, .gallery-card, .live-card-thumbnail, .reveal, .reveal-left, .reveal-right, .about-title, .section-title, .section-title-wrapper'
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
    console.log('🔄 loadData() iniciado');
    
    if (dataListenerRegistered) {
      console.log('⏭️ Listener já registrado, ignorando...');
      return;
    }
    
    try {
      const localMembers = localStorage.getItem('rocam_members');
      if (localMembers) {
        members = sanitizeMembersData(JSON.parse(localMembers));
        vehicles = JSON.parse(localStorage.getItem('rocam_vehicles') || '[]');
        seizures = JSON.parse(localStorage.getItem('rocam_seizures') || '[]');
        gallery = JSON.parse(localStorage.getItem('rocam_gallery') || '[]');
        const savedRankOrder = localStorage.getItem('rocam_rankOrder');
        rankOrder = savedRankOrder ? JSON.parse(savedRankOrder) : {};
        localStorage.setItem('rocam_members', JSON.stringify(members));
        console.log('💾 Dados carregados de localStorage e normalizados');
      }
    } catch(e) {
      console.warn('⚠️ Erro ao carregar de localStorage:', e);
    }
    
    try {
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
          console.log('✓ Dados carregados com sucesso do Firebase', { 
            members: members.length,
            vehicles: vehicles.length,
            seizures: seizures.length,
            gallery: gallery.length
          });
        } else {
          console.log('ℹ️ Firebase vazio, usando dados do localStorage');
        }
        firebaseInitialSyncCompleted = true;
        console.log('✅ Firebase initial sync completed');
        renderVehicles();
        renderSeizures();
        renderGallery();
        if (typeof updateAllStreamStatus === 'function') {
          setTimeout(() => updateAllStreamStatus(true), 50);
        }
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
      lastUpdated: new Date().toISOString()
    };
    
    try {
      localStorage.setItem('rocam_members', JSON.stringify(members));
      localStorage.setItem('rocam_vehicles', JSON.stringify(vehicles));
      localStorage.setItem('rocam_seizures', JSON.stringify(seizures));
      localStorage.setItem('rocam_gallery', JSON.stringify(gallery));
      localStorage.setItem('rocam_rankOrder', JSON.stringify(rankOrder));
      console.log('✓ Dados salvos em localStorage');
    } catch(e) {
      console.warn('⚠️ Erro ao salvar em localStorage:', e);
    }
    
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
const firebaseConfig = {
  apiKey: "AIzaSyBnwLlzDs363_5KBhH1iHNCHWZJa3aZGIg",
  authDomain: "rocam-55ccd.firebaseapp.com",
  projectId: "rocam-55ccd",
  storageBucket: "rocam-55ccd.firebasestorage.app",
  messagingSenderId: "264193595563",
  appId: "1:264193595563:web:3d9b60f6b112f183663fee",
  measurementId: "G-8FDS6ML6VK"
};

firebase.initializeApp(firebaseConfig);
console.log('✓ Firebase inicializado');
