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
  card.style.transitionDelay = `${index * 0.03}s`;
  card.dataset.memberName = memberName;

  const isLive = member.twitchLive;
  if (isLive) {
    card.classList.add('twitch-live-card');
  }

  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'member-avatar-wrapper';
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

  const right = document.createElement('div');
  right.className = 'member-right';

  const footer = document.createElement('div');
  footer.className = 'member-footer';

  const seizuresEl = document.createElement('span');
  seizuresEl.className = 'member-seizures';
  seizuresEl.textContent = `📋 ${seizureCount} ${seizureText}`;
  footer.appendChild(seizuresEl);

  if (streamInfo) {
    const liveInfo = member.twitchLive ? getLiveStreamInfo(member) : streamInfo;
    const streamLink = document.createElement('a');
    streamLink.href = liveInfo.url;
    streamLink.target = '_blank';
    streamLink.rel = 'noopener noreferrer';
    streamLink.className = `twitch-badge ${streamInfo.isLive ? 'twitch-online' : 'twitch-offline'}`;
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

  if (registeredText) {
    const registeredEl = document.createElement('div');
    registeredEl.className = 'member-registered';
    registeredEl.textContent = registeredText.replace('Cadastrado em', 'Membro desde');
    info.appendChild(registeredEl);
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
  const liveMembers = members.filter(m => (m.twitchLive === true));

  if (!liveMembers.length) {
    container.innerHTML = '<div class="empty-card">Nenhum membro está ao vivo no momento</div>';
    return;
  }

  const useCarousel = liveMembers.length > LIVE_MEMBERS_PER_PAGE;
  const totalPages = useCarousel ? Math.ceil(liveMembers.length / LIVE_MEMBERS_PER_PAGE) : 1;
  if (liveMembersPage < 0) liveMembersPage = 0;
  if (liveMembersPage >= totalPages) liveMembersPage = Math.max(0, totalPages - 1);

  const start = useCarousel ? liveMembersPage * LIVE_MEMBERS_PER_PAGE : 0;
  const end = useCarousel ? Math.min(start + LIVE_MEMBERS_PER_PAGE, liveMembers.length) : liveMembers.length;
  const pageItems = liveMembers.slice(start, end);

  const renderCard = (m, idx) => {
    const seizureCount = getMemberSeizureCount(m.name);
    const seizureText = seizureCount === 1 ? 'APREENSÃO' : 'APREENSÕES';
    const avatarHtml = m.avatarUrl
      ? `<img class="live-card-avatar" src="${escapeHtml(m.avatarUrl)}" onerror="this.src='https://placehold.co/48x48/1a1a1a/555?text=%F0%9F%91%A4'">`
      : `<div class="member-avatar-placeholder">👤</div>`;

    const streamInfo = getLiveStreamInfo(m) || {};
    const thumbUrl = getStreamThumbnailUrl(m, 640, 360);

    return `
      <div class="live-card-thumbnail reveal" data-member-name="${escapeHtml(m.name)}" style="transition-delay: ${idx * 0.03}s" onclick="window.open('${streamInfo.url || '#'}', '_blank')">
        <div class="live-card-background" style="background-image: url('${escapeHtml(thumbUrl)}');"></div>
        <div class="live-card-overlay"></div>
        <div class="live-card-live-badge">AO VIVO</div>
        <div class="live-card-viewers">${m.twitchViewers !== null && m.twitchViewers !== undefined ? `👁 ${m.twitchViewers}` : ''}</div>
        <div class="live-card-content">
          ${avatarHtml}
          <div class="live-card-info">
            <div class="live-card-name">${escapeHtml(m.name)}</div>
            <div class="live-card-rank">
              ${escapeHtml(m.policeRank || 'Soldado')}
              ${m.rank ? `· ${escapeHtml(m.rank)}` : ''}
              ${m.level ? `<span class="live-card-level">Nv.${m.level}</span>` : ''}
            </div>
            ${m.twitchCategory ? `<div class="live-card-badge"><span class="live-card-category">${escapeHtml(m.twitchCategory)}</span></div>` : ''}
          </div>
        </div>
      </div>
    `;
  };

  if (useCarousel) {
    let html = '<div class="seizures-carousel-wrapper" style="position:relative;">';
    html += `<button class="carousel-btn seizures-carousel-btn seizures-arrow-left" onclick="liveMembersPage=${Math.max(0, liveMembersPage - 1)};renderLiveMembers()" ${liveMembersPage <= 0 ? 'disabled' : ''}>❮</button>`;
    html += '<div class="live-members-grid">';
    pageItems.forEach((m, idx) => { html += renderCard(m, idx); });
    html += '</div>';
    html += `<button class="carousel-btn seizures-carousel-btn seizures-arrow-right" onclick="liveMembersPage=${Math.min(totalPages - 1, liveMembersPage + 1)};renderLiveMembers()" ${liveMembersPage >= totalPages - 1 ? 'disabled' : ''}>❯</button>`;
    html += '<div class="gallery-carousel-dots">';
    for (var i = 0; i < totalPages; i++) {
      html += `<span class="gallery-dot ${i === liveMembersPage ? 'active' : ''}" onclick="liveMembersPage=${i};renderLiveMembers()"></span>`;
    }
    html += '</div></div>';
    container.innerHTML = html;
  } else {
    let html = `<div class="live-members-grid${liveMembers.length === 1 ? ' live-members-grid--single' : ''}">`;
    liveMembers.forEach((m, idx) => { html += renderCard(m, idx); });
    html += '</div>';
    container.innerHTML = html;
  }
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
      html += `<div class="gallery-card reveal" style="transition-delay: ${idx * 0.03}s" onclick="openModal('${escapeHtml(item.imageUrl)}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') openModal('${escapeHtml(item.imageUrl)}')">
        ${item.imageUrl ? `<img class="gallery-img" src="${escapeHtml(item.imageUrl)}" onerror="this.src='https://placehold.co/600x400/1a1a1a/555?text=Erro+ao+carregar'" alt="${escapeHtml(item.title || 'Foto da galeria')}">` : '<div class="gallery-img placeholder">📸</div>'}
        <div class="gallery-card-overlay"></div>
        <div class="gallery-card-content">
          <div class="gallery-title">${escapeHtml(item.title || 'Sem título')}</div>
          <div class="gallery-date badge"><span class="emoji-icon">📅</span>${new Date(item.date).toLocaleDateString('pt-BR')} às ${new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>`;
    } else if (carouselType === 'vehicles') {
      html += `<div class="vehicle-card reveal" style="transition-delay: ${idx * 0.03}s" onclick="openModal('${escapeHtml(item.imageUrl)}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') openModal('${escapeHtml(item.imageUrl)}')">
        ${item.imageUrl ? `<img class="vehicle-img" src="${escapeHtml(item.imageUrl)}" onerror="this.src='https://placehold.co/600x400/1a1a1a/555?text=Sem+Imagem'" alt="${escapeHtml(item.name)}">` : '<div class="vehicle-img placeholder">🚗</div>'}
        <div class="vehicle-card-overlay"></div>
        <div class="vehicle-card-content">
          <div class="vehicle-name">${escapeHtml(item.name)}</div>
        </div>
      </div>`;
    } else if (carouselType === 'seizures') {
      const dateText = `${new Date(item.date).toLocaleDateString('pt-BR')} às ${new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      html += `<div class="seizure-card reveal" style="transition-delay: ${idx * 0.03}s" onclick="openModal('${escapeHtml(item.imageUrl)}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') openModal('${escapeHtml(item.imageUrl)}')">
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
    <div class="vehicle-card reveal" style="transition-delay: ${idx * 0.03}s" onclick="openModal('${escapeHtml(item.imageUrl)}')">
      ${item.imageUrl ? `<img class="vehicle-img" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" onerror="this.src='https://placehold.co/600x400/1a1a1a/555?text=Sem+Imagem'">` : '<div class="vehicle-img placeholder">🚗</div>'}
      <div class="vehicle-card-overlay"></div>
      <div class="vehicle-card-content">
        <div class="vehicle-name">${escapeHtml(item.name)}</div>
      </div>
    </div>
  `).join('') + '</div>';
}

const GALLERY_PAGE_HOME = 6;

function renderGallery() {
  const container = document.getElementById('gallery-content');
  if (!container) return;
  
  const sorted = normalizeArrayData(gallery).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, GALLERY_PAGE_HOME * 3);
  
  if (!sorted.length) {
    container.innerHTML = '<div class="empty-card">Nenhuma foto na galeria</div>';
    return;
  }
  
  const totalPages = Math.ceil(sorted.length / GALLERY_PAGE_HOME);
  if (galleryPage < 0) galleryPage = 0;
  if (galleryPage >= totalPages) galleryPage = Math.max(0, totalPages - 1);
  
  const start = galleryPage * GALLERY_PAGE_HOME;
  const end = Math.min(start + GALLERY_PAGE_HOME, sorted.length);
  const pageItems = sorted.slice(start, end);
  
  let html = '<div class="gallery-carousel-wrapper" style="position:relative;">';
  let hasNav = totalPages > 1;
  
  if (hasNav) {
    html += `<button class="carousel-btn seizures-carousel-btn gallery-carousel-btn gallery-arrow-left" onclick="galleryPage=${Math.max(0, galleryPage - 1)};renderGallery()" ${galleryPage <= 0 ? 'disabled' : ''}>❮</button>`;
  }
  
  html += '<div class="simple-grid">';
  html += pageItems.map((item, idx) => {
    const imageUrl = item.imageUrl ? String(item.imageUrl).trim() : '';
    const safeImageUrl = escapeHtml(imageUrl);
    const title = escapeHtml(item.title || 'Sem título');
    const dateText = item.date ? `${new Date(item.date).toLocaleDateString('pt-BR')} às ${new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '';
    const imgHtml = imageUrl
      ? `<img class="gallery-img" src="${safeImageUrl}" alt="${title}" onerror="this.src='https://placehold.co/600x400/1a1a1a/555?text=Erro'">`
      : '<div class="gallery-img placeholder">📸</div>';

    return `
      <div class="gallery-card reveal" style="transition-delay: ${idx * 0.03}s" ${imageUrl ? `onclick="openModal('${safeImageUrl}')"` : ''}>
        ${imgHtml}
        <div class="gallery-card-overlay"></div>
        <div class="gallery-card-content">
          <div class="gallery-title">${title}</div>
          <div class="gallery-date badge"><span class="emoji-icon">📅</span>${dateText}</div>
        </div>
      </div>
    `;
  }).join('');
  html += '</div>';
  
  if (hasNav) {
    html += `<button class="carousel-btn seizures-carousel-btn gallery-carousel-btn gallery-arrow-right" onclick="galleryPage=${Math.min(totalPages - 1, galleryPage + 1)};renderGallery()" ${galleryPage >= totalPages - 1 ? 'disabled' : ''}>❯</button>`;
    
    html += '<div class="gallery-carousel-dots">';
    for (var i = 0; i < totalPages; i++) {
      html += `<span class="gallery-dot ${i === galleryPage ? 'active' : ''}" onclick="galleryPage=${i};renderGallery()"></span>`;
    }
    html += '</div>';
  }
  
  html += '</div>';
  container.innerHTML = html;
  observeRevealElements();
}

const SEIZURES_PAGE_HOME = 3;

function renderSeizures() {
  try {
    const container = document.getElementById('seizures-content');
    if (!container) { return; }
    
    const sorted = [...seizures].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 9);
    
    if (!sorted.length) {
      container.innerHTML = '<div class="empty-card">Nenhuma apreensão registrada</div>';
      return;
    }
    
    const totalPages = Math.ceil(sorted.length / SEIZURES_PAGE_HOME);
    if (seizuresPage < 0) seizuresPage = 0;
    if (seizuresPage >= totalPages) seizuresPage = Math.max(0, totalPages - 1);
    
    const start = seizuresPage * SEIZURES_PAGE_HOME;
    const end = Math.min(start + SEIZURES_PAGE_HOME, sorted.length);
    const pageItems = sorted.slice(start, end);
    
    let html = '<div class="seizures-carousel-wrapper" style="position:relative;">';
    let hasNav = totalPages > 1;
    
    if (hasNav) {
      html += `<button class="carousel-btn seizures-carousel-btn seizures-arrow-left" onclick="seizuresPage=${Math.max(0, seizuresPage - 1)};renderSeizures()" ${seizuresPage <= 0 ? 'disabled' : ''}>❮</button>`;
    }
    
    html += '<div class="simple-grid">';
    
    pageItems.forEach((item, idx) => {
      try {
        const backgroundStyle = item.imageUrl && item.imageUrl.trim()
          ? `background-image: url('${escapeHtml(item.imageUrl)}');`
          : '';
        const dateText = `${new Date(item.date).toLocaleDateString('pt-BR')} às ${new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const imgUrl = escapeHtml(item.imageUrl || '');
        
        html += `
          <div class="seizure-card reveal" style="transition-delay: ${idx * 0.03}s" onclick="openModal('${imgUrl}')">
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
    
    if (hasNav) {
      html += `<button class="carousel-btn seizures-carousel-btn seizures-arrow-right" onclick="seizuresPage=${Math.min(totalPages - 1, seizuresPage + 1)};renderSeizures()" ${seizuresPage >= totalPages - 1 ? 'disabled' : ''}>❯</button>`;
      html += '<div class="gallery-carousel-dots">';
      for (var i = 0; i < totalPages; i++) {
        html += `<span class="gallery-dot ${i === seizuresPage ? 'active' : ''}" onclick="seizuresPage=${i};renderSeizures()"></span>`;
      }
      html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    observeRevealElements();
  } catch (error) {
    console.error('❌ Erro ao renderizar apreensões:', error);
  }
}

function updateStats() {
  const today = new Date().toDateString();
  const liveCount = members.filter(m => m.twitchLive === true).length;
  
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
    
    document.body.style.overflow = 'hidden';
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
    document.body.style.overflow = '';
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
                  <span class="member-profile-badge">${escapeHtml(member.policeRank || 'Soldado')}</span>
                  <span class="badge-sep">-</span>
                  <span class="member-profile-badge">${escapeHtml(member.rank || 'Membro')}</span>
                  <span class="badge-sep">-</span>
                  <span class="member-profile-badge">Nv.${member.level || '-'}</span>
                  ${member.twitch ? `<span class="badge-sep">-</span><a href="https://twitch.tv/${escapeHtml(member.twitch)}" target="_blank" class="member-profile-badge member-profile-twitch">${getTwitchSVG()} ${escapeHtml(member.twitch)}</a>` : ''}
                </div>
                <div class="member-social-row">
                  ${member.instagram ? `<a href="https://instagram.com/${escapeHtml(member.instagram)}" target="_blank" class="member-social-link" aria-label="Instagram">${getInstagramSVG()}</a>` : ''}
                  ${member.x ? `<a href="https://x.com/${escapeHtml(member.x)}" target="_blank" class="member-social-link" aria-label="X (Twitter)">${getXSVG()}</a>` : ''}
                  ${member.discord ? `<span class="member-social-link member-social-discord" title="${escapeHtml(member.discord)}" aria-label="Discord">${getDiscordSVG()}</span>` : ''}
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
        <div style="text-align:center;margin-top:12px;"><a href="apreensoes.html?member=${encodeURIComponent(member.name)}" style="font-size:11px;color:#ffffff;text-decoration:none;font-weight:600;">VER MAIS APREENSÕES →</a></div>
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
