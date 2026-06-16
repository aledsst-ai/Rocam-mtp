function createHierarchyMemberCard(member, index) {
  const memberName = (member.name || 'Sem nome').trim();
  const memberRank = (member.policeRank || 'Membro').trim();
  const isActive = member.status === 'ativo';
  const statusClass = isActive ? 'status-ativo' : 'status-inativo';
  const statusText = isActive ? '' : 'Inativo';
  const seizureCount = getMemberSeizureCount(memberName);
  const seizureText = seizureCount === 1 ? 'AÇÃO' : 'AÇÕES';
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
    titleEl.textContent = rank;
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

  try {
    let html = '';
    if (useCarousel) {
      html += '<div class="seizures-carousel-wrapper" style="position:relative;">';
      html += `<button class="carousel-btn seizures-carousel-btn seizures-arrow-left" data-carousel-type="live" data-carousel-direction="prev" ${liveMembersPage <= 0 ? 'disabled' : ''}>❮</button>`;
      html += '<div class="live-members-grid">';
      pageItems.forEach((m, idx) => { html += renderLiveMemberCard(m, idx); });
      html += '</div>';
      html += `<button class="carousel-btn seizures-carousel-btn seizures-arrow-right" data-carousel-type="live" data-carousel-direction="next" ${liveMembersPage >= totalPages - 1 ? 'disabled' : ''}>❯</button>`;
      html += '<div class="gallery-carousel-dots">';
      for (var i = 0; i < totalPages; i++) {
        html += `<span class="gallery-dot ${i === liveMembersPage ? 'active' : ''}" data-carousel-type="live" data-carousel-page="${i}"></span>`;
      }
      html += '</div></div>';
    } else {
      html += `<div class="live-members-grid${liveMembers.length === 1 ? ' live-members-grid--single' : ''}">`;
      liveMembers.forEach((m, idx) => { html += renderLiveMemberCard(m, idx); });
      html += '</div>';
    }
    container.innerHTML = html;
    observeRevealElements();
  } catch(e) { console.error('renderLiveMembers error:', e); }
}

function renderLiveMemberCard(m, idx) {
  const avatarHtml = m.avatarUrl
    ? `      <img class="live-card-avatar" src="${escapeHtml(m.avatarUrl)}" loading="lazy" onerror="this.src='https://placehold.co/48x48/1a1a1a/555?text=%F0%9F%91%A4'">`
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
              ${escapeHtml(m.policeRank || 'Membro')}
            ${m.rank ? `· ${escapeHtml(m.rank)}` : ''}
            ${m.level ? `<span class="live-card-level">Nv.${m.level}</span>` : ''}
          </div>
          ${m.twitchCategory ? `<div class="live-card-badge"><span class="live-card-category">${escapeHtml(m.twitchCategory)}</span></div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function carouselPrevNext(type, direction) {
  if (type === 'seizures') {
    seizuresPage = direction === 'prev' ? Math.max(0, seizuresPage - 1) : seizuresPage + 1;
    renderSeizures();
  } else if (type === 'live') {
    liveMembersPage = direction === 'prev' ? Math.max(0, liveMembersPage - 1) : liveMembersPage + 1;
    renderLiveMembers();
  }
}

function goToCarouselPage(type, page) {
  if (type === 'seizures') {
    seizuresPage = page;
    renderSeizures();
  } else if (type === 'live') {
    liveMembersPage = page;
    renderLiveMembers();
  }
}

const NEGOCIOS_PAGE_HOME = 10;

function renderNegocios() {
  const blurredRows = document.getElementById('negocios-blurred-rows');
  const lockedCard = document.getElementById('negocios-locked-card');
  const panelLink = document.querySelector('#negocios a[href="negocios.html"]');
  
  const sorted = normalizeArrayData(negocios).sort((a,b) => new Date(b.date) - new Date(a.date));
  
  if (!sorted.length) {
    if (blurredRows) {
      blurredRows.innerHTML = [
        ['9mm Premium', '1.240', 'Cliente reservado', 'R$ 000,00', 'R$ 000.000,00'],
        ['.45 ACP', '780', 'Operação sigilosa', 'R$ 000,00', 'R$ 000.000,00'],
        ['5.56 NATO', '2.600', 'Canal interno', 'R$ 000,00', 'R$ 000.000,00'],
        ['12 Gauge', '460', 'Registro protegido', 'R$ 000,00', 'R$ 000.000,00']
      ].map((row, idx) => `<tr class="negocios-row ${idx % 2 === 0 ? 'negocios-row--even' : ''}">
        <td data-label="Tipo">${row[0]}</td>
        <td data-label="Quantidade">${row[1]}</td>
        <td data-label="Cliente">${row[2]}</td>
        <td data-label="Valor">${row[3]}</td>
        <td data-label="Valor Total">${row[4]}</td>
      </tr>`).join('');
    }
    if (lockedCard) lockedCard.style.display = '';
    observeRevealElements();
    return;
  }
  
  const pageItems = sorted.slice(0, NEGOCIOS_PAGE_HOME);
  
  let html = '';
  pageItems.forEach((item, idx) => {
    const tipo = escapeHtml(item.tipo || '-');
    const qtd = Number(item.quantidade || 0).toLocaleString('pt-BR');
    const cliente = escapeHtml(item.cliente || '-');
    const valor = Number(item.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const valorTotal = Number(item.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    html += `<tr class="negocios-row ${idx % 2 === 0 ? 'negocios-row--even' : ''}">
      <td data-label="Tipo">${tipo}</td>
      <td data-label="Quantidade">${qtd}</td>
      <td data-label="Cliente">${cliente}</td>
      <td data-label="Valor">${valor}</td>
      <td data-label="Valor Total">${valorTotal}</td>
    </tr>`;
  });
  
  const totals = {};
  sorted.forEach(n => {
    const tipo = n.tipo || '-';
    totals[tipo] = (totals[tipo] || 0) + (Number(n.quantidade) || 0);
  });
  let topTipo = '';
  let topQtd = 0;
  for (const [t, q] of Object.entries(totals)) {
    if (q > topQtd) { topTipo = t; topQtd = q; }
  }
  if (topTipo) {
    html += `<tr class="negocios-row" style="font-weight:700;">
      <td colspan="5" data-label="Resumo" style="text-align:center;">${escapeHtml(topTipo)} Total ${topQtd.toLocaleString('pt-BR')}</td>
    </tr>`;
  }

  if (blurredRows) blurredRows.innerHTML = html;
  if (lockedCard) lockedCard.style.display = '';
  
  observeRevealElements();
}

const SEIZURES_PAGE_HOME = 3;

function renderSeizures() {
  try {
    const container = document.getElementById('seizures-content');
    if (!container) { return; }
    
    const approved = seizures.filter(s => s.approved !== false);
    const sorted = [...approved].sort((a,b) => (b.approvedAt || new Date(b.date).getTime()) - (a.approvedAt || new Date(a.date).getTime())).slice(0, 9);
    
    if (!sorted.length) {
      container.innerHTML = '<div class="empty-card">Nenhuma ação registrada</div>';
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
        html += renderSeizureCard(item, idx);
      } catch (itemError) {
        console.error('❌ Erro ao renderizar ação:', itemError, item);
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
    console.error('❌ Erro ao renderizar ações:', error);
  }
}

function updateStats() {
  const today = new Date().toDateString();
  const liveCount = members.filter(m => m.twitchLive === true).length;
  
  const approved = seizures.filter(s => s.approved !== false);
  const todayCount = approved.filter(s => new Date(s.date).toDateString() === today).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = approved.filter(s => new Date(s.date) >= weekAgo).length;
  
  const run = () => {
    animateStatValue('stat-ao-vivo', liveCount);
    animateStatValue('stat-membros', members.length);
    animateStatValue('stat-hoje', todayCount);
    animateStatValue('stat-semana', weekCount);
    animateStatValue('stat-total', approved.length);
  };

  const intro = document.getElementById('intro');
  if (intro && !intro.classList.contains('hidden')) {
    let done = false;
    const safe = () => { if (!done) { done = true; setTimeout(run, 200); } };
    intro.addEventListener('transitionend', safe, { once: true });
    setTimeout(safe, 4000);
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

function renderAll() {
  try { renderHierarchy(); } catch(e) { console.error('renderHierarchy error:', e); }
  try { renderLiveMembers(); } catch(e) { console.error('renderLiveMembers error:', e); }
  try { renderSeizures(); } catch(e) { console.error('renderSeizures error:', e); }
  try { renderNegocios(); } catch(e) { console.error('renderNegocios error:', e); }
  updateStats();
}

let currentMemberProfile = null;

function openMemberProfile(memberName) {
  try {
    debugLog('🔍 Abrindo perfil do membro:', memberName);
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
      debugLog('✓ Painel ativado');
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
    const panel = document.getElementById('member-profile-panel');
    const backdrop = document.getElementById('member-profile-backdrop');
    
    if (panel) panel.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    
    currentMemberProfile = null;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleProfileEscape);
    
    setTimeout(() => renderSeizures(), 300);
  } catch (error) {
    console.error('❌ Erro ao fechar perfil:', error);
    setTimeout(() => renderSeizures(), 300);
  }
}

function handleProfileEscape(e) {
  if (e.key === 'Escape') {
    closeMemberProfile();
  }
}

function renderMemberProfile(member) {
  try {
    debugLog('🎨 Renderizando perfil de:', member.name);
    const content = document.getElementById('member-profile-content');
    if (!content) {
      console.error('❌ Elemento member-profile-content não encontrado');
      return;
    }
    
    const seizureCount = getMemberSeizureCount(member.name);
    const memberSeizures = seizures.filter(s => s.approved !== false).filter(s => {
      const ms = getMembersList(s.member || s.memberName);
      return ms.includes(member.name);
    });
    const avatarUrl = member.avatarUrl || 'https://placehold.co/80x80/1a1a1a/19591d?text=👤';
    
    debugLog(`📊 ${member.name} tem ${seizureCount} ações`);
    
    let seizuresHtml = '';
    if (memberSeizures.length === 0) {
      seizuresHtml = '<div style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 0.85rem;">Nenhuma ação cadastrada</div>';
    } else {
      const sortedMemberSeizures = [...memberSeizures]
        .sort((a, b) => (b.approvedAt || new Date(b.date).getTime()) - (a.approvedAt || new Date(a.date).getTime()))
        .slice(0, 10);
      seizuresHtml = sortedMemberSeizures.map((seizure, idx) => {
        try {
          const seizureDate = new Date(seizure.date);
          const dateStr = seizureDate.toLocaleDateString('pt-BR');
          const description = seizure.description || seizure.title || 'Ação sem descrição';
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
          console.error('Erro ao renderizar ação:', e, seizure);
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
              <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(member.name)}" class="member-profile-avatar" onerror="this.src='https://placehold.co/140x140/1a1a1a/19591d?text=👤'">
              <div class="member-avatar-overlay">
                <div class="member-avatar-title">${escapeHtml(member.name)}</div>
                <div class="member-avatar-badges">
                  <span class="member-profile-badge">${escapeHtml(member.policeRank || 'Membro')}</span>
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
        <div class="seizures-carousel-title">📸 Últimas 10 ações</div>
        <div class="seizures-carousel-container">
          ${seizuresHtml}
        </div>
        <div style="text-align:center;margin-top:12px;"><a href="acoes.html?member=${encodeURIComponent(member.name)}" style="font-size:11px;color:var(--accent);text-decoration:none;font-weight:600;">VER MAIS AÇÕES →</a></div>
      </div>
    `;

    debugLog('✓ Perfil renderizado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao renderizar perfil:', error);
    const content = document.getElementById('member-profile-content');
    if (content) {
      content.innerHTML = `<div style="padding: 20px; color: var(--danger);">Erro ao carregar perfil. Verifique o console.</div>`;
    }
  }
}

function openImageModal(imageUrl) {
  if (!imageUrl) return;
  openModal(imageUrl);
}

function initRevealOnScroll() {
  observeRevealElements();
}

let negAuthType = null;

function openNegociosAuth() {
  const modal = document.getElementById('negociosAuthModal');
  if (modal) modal.classList.add('show');
  document.getElementById('negAuthInput').value = '';
  document.getElementById('negAuthError').style.display = 'none';
  setTimeout(() => document.getElementById('negAuthInput').focus(), 100);
}

function closeNegociosAuth() {
  const modal = document.getElementById('negociosAuthModal');
  if (modal) modal.classList.remove('show');
  negAuthType = null;
}

function submitNegociosAuth() {
  const pwd = document.getElementById('negAuthInput').value;
  if (!pwd) return;
  const btn = document.querySelector('#negociosAuthModal .pwd-btn-confirm');
  btn.disabled = true;
  btn.textContent = 'VERIFICANDO...';

  const tryAdmin = () => firebase.auth().signInWithEmailAndPassword('admin@sinaloa.app', pwd)
    .then(() => { negAuthType = 'admin'; });

  const tryMembers = () => firebase.auth().signInWithEmailAndPassword('membros@sinaloa.app', pwd)
    .then(() => { negAuthType = 'members'; });

  tryAdmin()
    .catch(() => tryMembers())
    .then(() => {
      closeNegociosAuth();
      openNegociosPanel();
    })
    .catch(error => {
      document.getElementById('negAuthError').textContent = 'Senha incorreta para Admin e Membros';
      document.getElementById('negAuthError').style.display = 'block';
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = 'LIBERAR';
    });
}

function closeNegociosPanel() {
  const panel = document.getElementById('negocios-panel');
  if (panel) panel.classList.add('hidden');
  document.body.style.overflow = '';
  if (negAuthType) {
    firebase.auth().signOut();
    negAuthType = null;
  }
}

let negPanelPage = 1;
let negFilterTipo = '';
let negFilterCliente = '';
let negFilterData = '';
const NEG_PANEL_PER_PAGE = 15;

function openNegociosPanel() {
  const panel = document.getElementById('negocios-panel');
  if (panel) panel.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  negPanelPage = 1;
  negFilterTipo = '';
  negFilterCliente = '';
  negFilterData = '';
  populateNegociosFilters();
  renderNegociosPanel();
}

function populateNegociosFilters() {
  const data = normalizeArrayData(negocios);
  const tipos = [...new Set(data.map(n => n.tipo).filter(Boolean))].sort();
  const clientes = [...new Set(data.map(n => n.cliente).filter(Boolean))].sort();
  
  const tipoSelect = document.getElementById('neg-filter-tipo');
  const clienteSelect = document.getElementById('neg-filter-cliente');
  const dataSelect = document.getElementById('neg-filter-data');
  
  if (tipoSelect) {
    tipoSelect.innerHTML = '<option value="">Todos</option>' + 
      tipos.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  }
  if (clienteSelect) {
    clienteSelect.innerHTML = '<option value="">Todos</option>' + 
      clientes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }
  if (dataSelect) {
    dataSelect.value = '';
  }
}

function applyNegociosFilters() {
  negFilterTipo = document.getElementById('neg-filter-tipo')?.value || '';
  negFilterCliente = document.getElementById('neg-filter-cliente')?.value || '';
  negFilterData = document.getElementById('neg-filter-data')?.value || '';
  negPanelPage = 1;
  renderNegociosPanel();
}

function getFilteredNegocios() {
  const data = normalizeArrayData(negocios);
  let filtered = data.sort((a,b) => new Date(b.date) - new Date(a.date));
  
  if (negFilterTipo) {
    filtered = filtered.filter(n => n.tipo === negFilterTipo);
  }
  if (negFilterCliente) {
    filtered = filtered.filter(n => n.cliente === negFilterCliente);
  }
  if (negFilterData) {
    const days = parseInt(negFilterData);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    filtered = filtered.filter(n => n.date && new Date(n.date) >= cutoff);
  }
  return filtered;
}

function renderNegociosPanel() {
  const container = document.getElementById('negocios-panel-body');
  if (!container) return;

  const filtered = getFilteredNegocios();

  if (!filtered.length) {
    container.innerHTML = '<div class="empty-card" style="text-align:center;padding:40px;">Nenhum negócio encontrado com os filtros atuais</div>';
    return;
  }

  const totalPages = Math.ceil(filtered.length / NEG_PANEL_PER_PAGE);
  if (negPanelPage < 1) negPanelPage = 1;
  if (negPanelPage > totalPages) negPanelPage = totalPages;

  const start = (negPanelPage - 1) * NEG_PANEL_PER_PAGE;
  const end = Math.min(start + NEG_PANEL_PER_PAGE, filtered.length);
  const pageItems = filtered.slice(start, end);

  let html = '<table class="negocios-panel-table">';
  html += '<thead><tr><th>Tipo</th><th>Quantidade</th><th>Cliente</th><th>Valor Unit.</th><th>Valor Total</th><th>Data</th></tr></thead>';
  html += '<tbody>';

  pageItems.forEach((n, idx) => {
    const qtd = Number(n.quantidade || 0).toLocaleString('pt-BR');
    const valor = Number(n.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const total = Number(n.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const dateStr = n.date ? new Date(n.date).toLocaleDateString('pt-BR') : '';
    const clienteDisplay = clientesInativos.includes(n.cliente) ? `<span style="color:red;">(X)</span> ${escapeHtml(n.cliente || '-')}` : escapeHtml(n.cliente || '-');
    html += `<tr>
      <td data-label="Tipo">${escapeHtml(n.tipo || '-')}</td>
      <td data-label="Quantidade">${qtd}</td>
      <td data-label="Cliente">${clienteDisplay}</td>
      <td data-label="Valor Unit.">${valor}</td>
      <td data-label="Valor Total">${total}</td>
      <td data-label="Data">${dateStr}</td>
    </tr>`;
  });

  html += '</tbody></table>';

  const periodLabel = negFilterData ? `Últimos ${negFilterData} dias` : 'Todos os períodos';
  const tipoLabel = negFilterTipo ? ` | Tipo: ${negFilterTipo}` : '';
  const clienteLabel = negFilterCliente ? ` | Cliente: ${negFilterCliente}` : '';
  const totalQtd = filtered.reduce((sum, n) => sum + Number(n.quantidade || 0), 0).toLocaleString('pt-BR');
  html += `<div class="negocios-result-info">${periodLabel}${tipoLabel}${clienteLabel} — ${filtered.length} Venda${filtered.length !== 1 ? 's' : ''} | Qtd Total: ${totalQtd}</div>`;

  container.innerHTML = html;

  if (totalPages > 1) {
    const paginationHtml = `
      <div class="negocios-pagination-fixed">
        <button onclick="negPanelPage=${negPanelPage - 1};renderNegociosPanel()" ${negPanelPage <= 1 ? 'disabled' : ''} aria-label="Página anterior">❮</button>
        ${Array.from({length: totalPages}, (_, i) => i + 1).map(i =>
          `<button onclick="negPanelPage=${i};renderNegociosPanel()" class="${i === negPanelPage ? 'active' : ''}" aria-label="Página ${i}">${i}</button>`
        ).join('')}
        <button onclick="negPanelPage=${negPanelPage + 1};renderNegociosPanel()" ${negPanelPage >= totalPages ? 'disabled' : ''} aria-label="Próxima página">❯</button>
        <span class="page-info">${start + 1}–${end} de ${filtered.length}</span>
      </div>
    `;
    const existingFixed = document.querySelector('.negocios-pagination-fixed');
    if (existingFixed) existingFixed.remove();
    document.querySelector('.negocios-panel-inner').insertAdjacentHTML('beforeend', paginationHtml);
  } else {
    const existingFixed = document.querySelector('.negocios-pagination-fixed');
    if (existingFixed) existingFixed.remove();
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const authModal = document.getElementById('negociosAuthModal');
    const panel = document.getElementById('negocios-panel');
    if (authModal && authModal.classList.contains('show')) {
      closeNegociosAuth();
    } else if (panel && !panel.classList.contains('hidden')) {
      closeNegociosPanel();
    }
  }
});
