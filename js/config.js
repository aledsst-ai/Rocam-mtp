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
