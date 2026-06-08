// ==================== INICIALIZAÇÃO DE EVENT LISTENERS ====================
function initEventListeners() {
  // Listener de click para carrossel
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.carousel-btn[data-carousel-type][data-carousel-direction]');
    if (btn && !btn.disabled) {
      const type = btn.dataset.carouselType;
      const direction = btn.dataset.carouselDirection;
      carouselPrevNext(type, direction);
      return;
    }
    const dot = e.target.closest('.gallery-dot[data-carousel-type][data-carousel-page]');
    if (dot) {
      goToCarouselPage(dot.dataset.carouselType, parseInt(dot.dataset.carouselPage, 10));
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
      console.log('⏳ Primeira visita - exibindo splash por 3s');
      setTimeout(hideIntro, 3000);

      // FALLBACK: Se ainda estiver visível após 6s, força remover
      setTimeout(() => {
        if (intro && !intro.classList.contains('hidden')) {
          console.log('⚠️ FALLBACK: Forçando remoção do intro após 6s');
          hideIntro();
        }
      }, 6000);
    }
  }
  
  // Carregar dados do Firebase (agora sim, após intro configurado)
  console.log('📡 Iniciando carregamento do Firebase...');
  loadData();
  initRevealObserver();
  initEventListeners();
  
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
