let currentAdminTab = 'members';
let currentMembersTab = 'seizures';

function unlockNegocios() {
  const content = document.getElementById('negocios-content');
  const locked = document.getElementById('negocios-locked');
  if (content) content.classList.add('unlocked');
  if (locked) locked.classList.add('unlocked');
}

function lockNegocios() {
  const content = document.getElementById('negocios-content');
  const locked = document.getElementById('negocios-locked');
  if (content) content.classList.remove('unlocked');
  if (locked) locked.classList.remove('unlocked');
}

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
  if (!pwd) return;
  const btn = document.querySelector('#adminPasswordDialog .pwd-btn-confirm');
  btn.disabled = true;
  btn.textContent = 'ENTRANDO...';
  firebase.auth().signInWithEmailAndPassword('admin@sinaloa.app', pwd)
    .then(() => {
      currentAuthUser = 'admin';
      const adminOverlay = document.getElementById('admin-overlay');
      if (!adminOverlay) {
        console.error('ERROR: admin-overlay element not found in DOM');
        return;
      }
      adminOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      switchAdminTab('seizures');
      closePasswordDialog('admin');
      unlockNegocios();
    })
    .catch(error => {
      alert('Erro ao entrar: ' + (error.message || 'Senha incorreta'));
      document.getElementById('adminPasswordInput').value = '';
      document.getElementById('adminPasswordInput').focus();
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = 'ENTRAR';
    });
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
  if (!pwd) return;
  const btn = document.querySelector('#membersPasswordDialog .pwd-btn-confirm');
  btn.disabled = true;
  btn.textContent = 'ENTRANDO...';
  firebase.auth().signInWithEmailAndPassword('membros@sinaloa.app', pwd)
    .then(() => {
      currentAuthUser = 'members';
      const membersOverlay = document.getElementById('members-overlay');
      if (!membersOverlay) {
        console.error('ERROR: members-overlay element not found in DOM');
        return;
      }
      membersOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      switchMembersTab('seizures');
      closePasswordDialog('members');
      unlockNegocios();
    })
    .catch(error => {
      alert('Erro ao entrar: ' + (error.message || 'Senha incorreta'));
      document.getElementById('membersPasswordInput').value = '';
      document.getElementById('membersPasswordInput').focus();
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = 'ENTRAR';
    });
}

function closePasswordDialog(type) {
  if (type === 'admin') {
    const adminPasswordDialog = document.getElementById('adminPasswordDialog');
    if (adminPasswordDialog) {
      adminPasswordDialog.classList.remove('show');
      document.getElementById('adminPasswordInput').value = '';
      const err = document.getElementById('adminAuthError');
      if (err) err.style.display = 'none';
    }
  } else if (type === 'members') {
    const membersPasswordDialog = document.getElementById('membersPasswordDialog');
    if (membersPasswordDialog) {
      membersPasswordDialog.classList.remove('show');
      document.getElementById('membersPasswordInput').value = '';
      const err = document.getElementById('membersAuthError');
      if (err) err.style.display = 'none';
    }
  }
}

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const adminPwd = document.getElementById('adminPasswordDialog');
    const membersPwd = document.getElementById('membersPasswordDialog');
    if (adminPwd && adminPwd.classList.contains('show')) {
      closePasswordDialog('admin');
    } else if (membersPwd && membersPwd.classList.contains('show')) {
      closePasswordDialog('members');
    }
  }
});

function closeAdminPanel() {
  const adminOverlay = document.getElementById('admin-overlay');
  if (adminOverlay) {
    adminOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (currentAuthUser === 'admin') {
    firebase.auth().signOut();
    currentAuthUser = null;
  }
  lockNegocios();
}

function closeMembersPanel() {
  const membersOverlay = document.getElementById('members-overlay');
  if (membersOverlay) {
    membersOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  lockNegocios();
  if (currentAuthUser === 'members') {
    firebase.auth().signOut();
    currentAuthUser = null;
  }
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  const tabs = document.querySelectorAll('#admin-overlay .admin-tab');
  tabs.forEach(t => t.classList.remove('active'));
  if (tab === 'seizures') {
    selectedAdminMember = null;
    tabs[0].classList.add('active');
    renderAdminSeizures();
  } else if (tab === 'members') {
    tabs[1].classList.add('active');
    renderAdminMembers();
  } else if (tab === 'negocios') {
    tabs[2].classList.add('active');
    renderAdminNegocios();
  } else if (tab === 'rankOrder') {
    tabs[3].classList.add('active');
    renderAdminRankOrder();
  } else if (tab === 'manage') {
    tabs[4].classList.add('active');
    renderAdminManage();
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
  } else if (tab === 'negocios') {
    tabs[1].classList.add('active');
    renderMembersNegocios();
  } else if (tab === 'members') {
    tabs[2].classList.add('active');
    renderMembersMembers();
  }
}

function renderAdminMembers() {
  const body = document.getElementById('admin-body');
  const existingRanks = [...new Set(members.map(m => m.rank || "Membro"))];
  const rankOptions = existingRanks.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ADICIONAR MEMBRO</h3>
      <div class="form-group"><label>NOME *</label><input id="new-name" placeholder="Nome" required></div>
      <div class="form-group"><label>CARGO *</label><input id="new-police-rank" placeholder="Ex: Líder, Sub-líder, Membro..." required></div>
      <div class="form-group"><label>HIERARQUIA *</label><select id="new-rank" required><option value="">-- Selecione ou crie nova --</option>${rankOptions}<option value="__new__">+ CRIAR NOVA</option></select><input id="new-rank-custom" placeholder="Nome da hierarquia" style="display:none; margin-top: 4px;"></div>
      <div class="form-group"><label>NÍVEL *</label><input id="new-level" type="number" value="1" required></div>
      <div class="form-group"><label>STATUS</label><select id="new-status"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
      <div class="form-group"><label>DATA DE CADASTRO *</label><input id="new-created-at" type="date" required></div>
      <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div><label>TWITCH</label><input id="new-twitch" placeholder="username"></div>
        <div><label>INSTAGRAM</label><input id="new-instagram" placeholder="username"></div>
        <div><label>X (TWITTER)</label><input id="new-x" placeholder="username"></div>
        <div><label>DISCORD ID</label><input id="new-discord" placeholder="usuario#0000 ou ID"></div>
      </div>
      <div class="form-group"><label>FOTO DO MEMBRO (URL) *</label><input id="new-avatar" placeholder="https://..." required></div>
      <button class="btn btn-primary" onclick="addMember()">ADICIONAR MEMBRO</button>
    </div>
    <div id="members-list"></div>
  `;
  
  document.getElementById('new-rank').addEventListener('change', function() {
    const customInput = document.getElementById('new-rank-custom');
    if (this.value === '__new__') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
    }
  });
  document.getElementById('new-created-at').value = new Date().toISOString().split('T')[0];
  
  renderMembersList();
}

var selectedAdminMember = null;

function renderMembersList() {
  const container = document.getElementById('members-list');
  if (!members.length) { container.innerHTML = '<div class="empty-card">Nenhum membro</div>'; return; }
  const groups = members.reduce((acc, m) => {
    const rank = m.rank || 'Membro';
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(m);
    return acc;
  }, {});
  Object.keys(groups).forEach(r => { if (!rankOrder[r]) rankOrder[r] = Object.keys(rankOrder).length + 1; });
  const sortedRanks = Object.keys(groups).sort((a, b) => (rankOrder[a] || 99) - (rankOrder[b] || 99));
  let html = '<div style="margin-bottom:16px;">';
  sortedRanks.forEach(rank => {
    const items = groups[rank].map(m => `<span class="member-pill${selectedAdminMember === m.id ? ' member-pill--active' : ''}" onclick="selectAdminMember('${m.id}')">${escapeHtml(m.name)}</span>`).join('');
    html += '<div style="margin-bottom:10px;"><div style="font-size:0.6rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">' + escapeHtml(rank) + '</div><div style="display:flex;flex-wrap:wrap;gap:4px;">' + items + '</div></div>';
  });
  html += '</div>';
  if (selectedAdminMember) {
    const m = members.find(x => x.id === selectedAdminMember);
    if (m) {
      html += '<div class="form-card"><h3 style="margin-bottom:12px;font-size:0.8rem;font-weight:700;">EDITAR: ' + escapeHtml(m.name) + '</h3>';
      html += '<div class="form-group"><label>NOME</label><input id="am-name-input" value="' + escapeHtml(m.name || '') + '"></div>';
      html += '<div class="form-group"><label>CARGO (Patente Policial)</label><input id="am-police-rank-input" value="' + escapeHtml(m.policeRank || '') + '"></div>';
      html += '<div class="form-group"><label>HIERARQUIA</label><select id="am-rank-input">' + Object.keys(rankOrder).map(r => '<option value="' + escapeHtml(r) + '" ' + (m.rank === r ? 'selected' : '') + '>' + escapeHtml(r) + '</option>').join('') + '<option value="__new__">+ Nova hierarquia</option></select><input id="am-rank-custom" placeholder="Nome da nova hierarquia" style="display:none;margin-top:4px;"></div>';
      html += '<div class="form-group"><label>NÍVEL</label><select id="am-level-select">' + [...Array(100).keys()].map(i => '<option value="' + i + '" ' + (m.level == i ? 'selected' : '') + '>Nv.' + i + '</option>').join('') + '</select></div>';
      html += '<div class="form-group"><label>STATUS</label><select id="am-status-select"><option value="ativo"' + (m.status === 'ativo' ? ' selected' : '') + '>Ativo</option><option value="inativo"' + (m.status === 'inativo' ? ' selected' : '') + '>Inativo</option></select></div>';
      html += '<div class="form-group"><label>DATA DE CADASTRO</label><input id="am-created-input" type="date" value="' + escapeHtml(formatDateForInput(m.createdAt)) + '"></div>';
      html += '<div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
      html += '<div><label>TWITCH</label><input id="am-twitch-input" value="' + escapeHtml(m.twitch || '') + '"></div>';
      html += '<div><label>INSTAGRAM</label><input id="am-instagram-input" value="' + escapeHtml(m.instagram || '') + '"></div>';
      html += '<div><label>X (TWITTER)</label><input id="am-x-input" value="' + escapeHtml(m.x || '') + '"></div>';
      html += '<div><label>DISCORD ID</label><input id="am-discord-input" value="' + escapeHtml(m.discord || '') + '"></div>';
      html += '</div>';
      html += '<div class="form-group"><label>FOTO DO MEMBRO (URL)</label><input id="am-avatar-input" value="' + escapeHtml(m.avatarUrl || '') + '"></div>';
      html += '<div style="display:flex;gap:8px;">';
      html += '<button class="btn btn-primary" onclick="saveSelectedMember()">SALVAR</button>';
      html += '<button class="btn btn-danger" onclick="deleteMember(\'' + m.id + '\')">REMOVER</button>';
      html += '</div></div>';
    }
  }
  container.innerHTML = html;

  document.getElementById('am-rank-input').addEventListener('change', function() {
    const customInput = document.getElementById('am-rank-custom');
    if (this.value === '__new__') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
    }
  });
}

function selectAdminMember(id) {
  selectedAdminMember = selectedAdminMember === id ? null : id;
  renderMembersList();
}

function saveSelectedMember() {
  const m = members.find(x => x.id === selectedAdminMember);
  if (!m) return;
  const newName = document.getElementById('am-name-input').value.trim();
  const newPoliceRank = document.getElementById('am-police-rank-input').value.trim();
  let newRank = document.getElementById('am-rank-input').value.trim();
  if (newRank === '__new__') {
    newRank = document.getElementById('am-rank-custom').value.trim();
  }
  const newLevel = document.getElementById('am-level-select').value;
  const newStatus = document.getElementById('am-status-select').value;
  const newCreatedAt = document.getElementById('am-created-input').value;
  const newAvatarUrl = document.getElementById('am-avatar-input').value.trim();
  const newTwitch = document.getElementById('am-twitch-input').value.trim().toLowerCase();
  const newInstagram = document.getElementById('am-instagram-input').value.trim().toLowerCase();
  const newX = document.getElementById('am-x-input').value.trim().toLowerCase();
  const newDiscord = document.getElementById('am-discord-input').value.trim();
  if (newName) m.name = newName;
  m.policeRank = newPoliceRank || m.policeRank || 'Membro';
  if (newRank) m.rank = newRank;
  m.level = newLevel;
  m.status = newStatus;
  if (newCreatedAt) {
    const parsedDate = parseStoredDate(newCreatedAt);
    if (!parsedDate) { alert('Data de cadastro inválida'); return; }
    m.createdAt = newCreatedAt;
  }
  m.avatarUrl = newAvatarUrl || null;
  m.twitch = newTwitch || null;
  m.instagram = newInstagram || null;
  m.x = newX || null;
  m.discord = newDiscord || null;
  saveData();
  renderAll();
  renderAdminMembers();
  updateAllStreamStatus();
}

function renderAdminSeizures() {
  adminSeizurePage = 1;
  const body = document.getElementById('admin-body');
  const groups = members.reduce((acc, m) => {
    const rank = m.rank || 'Membro';
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(m);
    return acc;
  }, {});
  Object.keys(groups).forEach(r => { if (!rankOrder[r]) rankOrder[r] = Object.keys(rankOrder).length + 1; });
  const sortedRanks = Object.keys(groups).sort((a, b) => (rankOrder[a] || 99) - (rankOrder[b] || 99));
  const memberBadges = sortedRanks.map(rank => {
    const items = groups[rank].map(m => `<span class="member-badge" data-name="${escapeHtml(m.name)}">${escapeHtml(m.name)}</span>`).join('');
    return `<div style="margin-bottom:6px;"><div style="font-size:0.6rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;text-align:center;">${escapeHtml(rank)}</div><div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;">${items}</div></div>`;
  }).join('');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">REGISTRAR AÇÃO</h3>
      <div class="form-group"><label>TIPO *</label>
        <div style="display:flex;gap:4px;">
          <select id="new-desc" required style="flex:1;">
            <option value="">-- Selecione ou crie nova --</option>
            ${[...new Set((normalizeArrayData(seizures) || []).map(s => s.description).filter(Boolean))].sort().map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('')}
            <option value="__new__">+ CRIAR NOVA</option>
          </select>
          <button type="button" class="btn" onclick="inativarTipoSelecionado()" style="padding:4px 8px;font-size:10px;font-weight:700;background:rgba(255,0,0,0.1);border:1px solid rgba(255,0,0,0.3);color:#ff0000;">INATIVAR</button>
        </div>
        <input id="new-desc-custom" placeholder="Nome do novo tipo" style="display:none;margin-top:4px;font-family:inherit;width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;font-size:11px;outline:none;box-sizing:border-box;">
      </div>
      <div class="form-group"><label>MEMBROS RESPONSÁVEIS *</label><div id="new-members-container" style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto;padding:6px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.08);" onclick="toggleMemberBadge(event)">${memberBadges}</div></div>
      <div class="form-group"><label>LOCAL *</label><input id="new-location" placeholder="Local" required></div>
      <div class="form-group"><label>IMAGEM URL *</label><input id="new-simg" placeholder="https://..." required></div>
      <div class="form-group"><label>ITENS URL *</label><input id="new-bo" placeholder="https://..." required></div>
      <button class="btn btn-primary" onclick="addSeizure()">REGISTRAR AÇÃO</button>
    </div>
    <div id="seizures-list"></div>
  `;
  
  document.getElementById('new-desc').addEventListener('change', function() {
    const customInput = document.getElementById('new-desc-custom');
    if (this.value === '__new__') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
    }
  });
  
  renderSeizuresList();
}

function renderSeizuresList() {
  const container = document.getElementById('seizures-list');
  if (!seizures.length) { container.innerHTML = '<div class="empty-card">Nenhuma ação</div>'; return; }
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
    const isApproved = s.approved !== false;
    const statusBadge = isApproved
      ? '<span style="font-size:8px;color:var(--success);font-weight:700;margin-left:6px;">✓ APROVADO</span>'
      : '<span style="font-size:8px;color:#ffa500;font-weight:700;margin-left:6px;">● PENDENTE</span>';
    const actionBtn = isApproved
      ? `<button class="btn btn-danger" style="padding:4px 12px;font-size:10px;font-weight:700;" onclick="deleteSeizure('${s.id}')">REMOVER</button>`
      : `<div style="display:flex;gap:4px;">` +
        `<button class="btn" style="padding:4px 12px;font-size:10px;font-weight:700;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.4);color:#22c55e;" onclick="approveSeizure('${s.id}')">APROVAR</button>` +
        `<button class="btn btn-danger" style="padding:4px 12px;font-size:10px;font-weight:700;" onclick="deleteSeizure('${s.id}')">REMOVER</button>` +
        `</div>`;
    var thumbnails = '';
    if (s.imageUrl || s.boImageUrl) {
      thumbnails = '<div style="display:flex;gap:6px;margin-top:6px;">';
      if (s.imageUrl) thumbnails += '<img src="' + escapeHtml(s.imageUrl) + '" onclick="event.stopPropagation();openModal(\'' + escapeHtml(s.imageUrl) + '\')" style="width:60px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);" title="Ver imagem">';
      if (s.boImageUrl) thumbnails += '<img src="' + escapeHtml(s.boImageUrl) + '" onclick="event.stopPropagation();openModal(\'' + escapeHtml(s.boImageUrl) + '\')" style="width:60px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);" title="Ver BO">';
      thumbnails += '</div>';
    }
    html += `<div class="admin-list-item" style="font-size:10px;">
      <div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#fff;">${escapeHtml(s.description.substring(0, 40))} - <span style="font-weight:400;color:var(--text-muted);text-transform:none;font-size:9px;">${new Date(s.date).toLocaleDateString('pt-BR')}</span>${statusBadge}</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${escapeHtml(memberText)}</div>${thumbnails}</div>
      ${actionBtn}
    </div>`;
  });
  html += '</div>';
  if (totalPages > 1) {
    html += '<div style="display:flex;justify-content:center;align-items:center;gap:6px;padding:12px 0;font-size:10px;font-weight:700;font-family:inherit;">';
    html += '<button onclick="adminSeizurePage=' + (adminSeizurePage - 1) + ';renderSeizuresList()" style="padding:6px 12px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;' + (adminSeizurePage <= 1 ? 'opacity:0.3;cursor:default;' : '') + '" ' + (adminSeizurePage <= 1 ? 'disabled' : '') + '>❮</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button onclick="adminSeizurePage=' + i + ';renderSeizuresList()" style="padding:6px 10px;border-radius:4px;border:1px solid ' + (i === adminSeizurePage ? '#fff' : 'rgba(255,255,255,0.15)') + ';background:' + (i === adminSeizurePage ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)') + ';color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;">' + i + '</button>';
    }
    html += '<button onclick="adminSeizurePage=' + (adminSeizurePage + 1) + ';renderSeizuresList()" style="padding:6px 12px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;' + (adminSeizurePage >= totalPages ? 'opacity:0.3;cursor:default;' : '') + '" ' + (adminSeizurePage >= totalPages ? 'disabled' : '') + '>❯</button>';
    html += '</div>';
  }
  container.innerHTML = html;
}

function renderAdminNegocios() {
  const body = document.getElementById('admin-body');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">REGISTRAR NEGÓCIO</h3>
      <div class="form-group"><label>TIPO *</label>
        <select id="new-neg-tipo" required>
          <option value="">-- Selecione --</option>
          <option value="HK">HK</option>
          <option value="Five">Five</option>
          <option value="TEC">TEC</option>
          <option value="MTAR">MTAR</option>
          <option value="SMG">SMG</option>
          <option value="Magnum">Magnum</option>
          <option value="AK-47">AK-47</option>
          <option value="G36">G36</option>
        </select>
        <input id="new-neg-tipo-custom" placeholder="Ou digite um tipo personalizado" style="margin-top:4px;font-family:inherit;width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(0,0,0,0.15);background:#f5f5f5;color:#1a1a1a;font-size:11px;outline:none;box-sizing:border-box;">
      </div>
      <div class="form-group"><label>QUANTIDADE *</label><input id="new-neg-quantidade" type="number" min="1" placeholder="Ex: 5000" required></div>
      <div class="form-group"><label>CLIENTE *</label>
        <div style="display:flex;gap:4px;">
          <select id="new-neg-cliente" required style="flex:1;">
            <option value="">-- Selecione ou crie novo --</option>
            ${[...new Set((normalizeArrayData(negocios) || []).map(n => n.cliente).filter(Boolean))].sort().map(c => `<option value="${escapeHtml(c)}">${clientesInativos.includes(c) ? '(X) ' : ''}${escapeHtml(c)}</option>`).join('')}
            <option value="__new__">+ CRIAR NOVO</option>
          </select>
          <button type="button" class="btn" onclick="inativarClienteSelecionado()" style="padding:4px 8px;font-size:10px;font-weight:700;background:rgba(255,0,0,0.1);border:1px solid rgba(255,0,0,0.3);color:#ff0000;">INATIVAR</button>
        </div>
        <input id="new-neg-cliente-custom" placeholder="Nome do novo cliente" style="display:none;margin-top:4px;font-family:inherit;width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(0,0,0,0.15);background:#f5f5f5;color:#1a1a1a;font-size:11px;outline:none;box-sizing:border-box;">
      </div>
      <div class="form-group"><label>VALOR UNITÁRIO (R$) *</label><input id="new-neg-valor" type="number" step="0.01" min="0.01" placeholder="Ex: 2.50" required></div>
      <div class="form-group"><label>VALOR TOTAL</label><div id="new-neg-total-display" style="font-size:14px;font-weight:700;color:var(--accent);padding:6px 0;">R$ 0,00</div></div>
      <button class="btn btn-primary" onclick="addNegocio()">REGISTRAR NEGÓCIO</button>
    </div>
    <div id="negocios-list"></div>
  `;
  
  const qtdInput = document.getElementById('new-neg-quantidade');
  const valorInput = document.getElementById('new-neg-valor');
  const totalDisplay = document.getElementById('new-neg-total-display');
  
  function updateTotal() {
    const qtd = parseFloat(qtdInput.value) || 0;
    const val = parseFloat(valorInput.value) || 0;
    const total = qtd * val;
    totalDisplay.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  
  qtdInput.addEventListener('input', updateTotal);
  valorInput.addEventListener('input', updateTotal);
  
  document.getElementById('new-neg-tipo').addEventListener('change', function() {
    const customInput = document.getElementById('new-neg-tipo-custom');
    if (this.value === '__new__') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
    }
  });

  document.getElementById('new-neg-cliente').addEventListener('change', function() {
    const customInput = document.getElementById('new-neg-cliente-custom');
    if (this.value === '__new__') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
    }
  });
  
  renderNegociosList();
}

function renderNegociosList() {
  const container = document.getElementById('negocios-list');
  if (!negocios.length) { container.innerHTML = '<div class="empty-card">Nenhum negócio registrado</div>'; return; }
  const sorted = [...negocios].reverse();
  const totalPages = Math.ceil(sorted.length / ADMIN_NEGOCIOS_PER_PAGE);
  let page = 1;
  
  let html = '';
  for (let p = 1; p <= totalPages; p++) {
    const start = (p - 1) * ADMIN_NEGOCIOS_PER_PAGE;
    const end = Math.min(start + ADMIN_NEGOCIOS_PER_PAGE, sorted.length);
    const pageItems = sorted.slice(start, end);
    
    html += `<div class="page-content" data-page="${p}" style="${p !== 1 ? 'display:none;' : ''}">`;
    pageItems.forEach(n => {
      const qtd = Number(n.quantidade || 0).toLocaleString('pt-BR');
      const valor = Number(n.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const total = Number(n.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      html += `<div class="admin-list-item" style="font-size:10px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:10px;font-weight:700;color:#1a1a1a;text-transform:uppercase;">${escapeHtml(n.tipo || '-')} — <span style="font-weight:400;color:var(--text-muted);text-transform:none;font-size:9px;">${new Date(n.date).toLocaleDateString('pt-BR')}</span></div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${escapeHtml(n.cliente)} • ${qtd} un • ${valor} cada • Total: ${total}</div>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn" style="padding:4px 10px;font-size:10px;font-weight:700;flex-shrink:0;background:${clientesInativos.includes(n.cliente) ? 'rgba(34,197,94,0.2)' : 'rgba(255,165,0,0.2)'};border:1px solid ${clientesInativos.includes(n.cliente) ? 'rgba(34,197,94,0.4)' : 'rgba(255,165,0,0.4)'};color:${clientesInativos.includes(n.cliente) ? '#22c55e' : '#ffa500'};" onclick="toggleClienteInativo('${escapeHtml(n.cliente)}')">${clientesInativos.includes(n.cliente) ? 'ATIVAR' : 'INATIVAR'}</button>
          <button class="btn btn-danger" style="padding:4px 10px;font-size:10px;font-weight:700;flex-shrink:0;" onclick="deleteNegocio('${n.id}')">REMOVER</button>
        </div>
      </div>`;
    });
    html += '</div>';
  }
  
  if (totalPages > 1) {
    html += '<div style="display:flex;justify-content:center;align-items:center;gap:6px;padding:12px 0;font-size:10px;font-weight:700;font-family:inherit;">';
    for (var i = 1; i <= totalPages; i++) {
      html += `<button onclick="switchNegociosPage(${i})" id="neg-page-${i}" style="padding:6px 10px;border-radius:4px;border:1px solid ${i === 1 ? '#1a1a1a' : 'rgba(0,0,0,0.15)'};background:${i === 1 ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.04)'};color:#1a1a1a;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;">${i}</button>`;
    }
    html += '</div>';
  }

  // totais por tipo
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
  container.innerHTML = html;
}

function switchNegociosPage(page) {
  document.querySelectorAll('#negocios-list .page-content').forEach(el => {
    el.style.display = el.dataset.page == page ? '' : 'none';
  });
  document.querySelectorAll('#negocios-list [id^="neg-page-"]').forEach(el => {
    const num = el.id.replace('neg-page-', '');
    const isActive = num == page;
    el.style.borderColor = isActive ? '#1a1a1a' : 'rgba(0,0,0,0.15)';
    el.style.background = isActive ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.04)';
  });
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
      <div class="rank-item" data-rank="${escapeHtml(rank)}" style="font-size:11px;">
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

function renderAdminManage() {
  const body = document.getElementById('admin-body');
  
  // Get unique action types from seizures
  const actionTypes = [...new Set((normalizeArrayData(seizures) || []).map(s => s.description).filter(Boolean))].sort();
  
  // Get unique business types from negocios
  const businessTypes = [...new Set((normalizeArrayData(negocios) || []).map(n => n.tipo).filter(Boolean))].sort();
  
  let html = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">GERENCIAR NOMES DE AÇÕES</h3>
      <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">Adicione ou remova tipos de ações</p>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <input id="new-action-type" placeholder="Novo tipo de ação" style="flex:1;font-family:inherit;width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:#fff;font-size:11px;outline:none;box-sizing:border-box;">
        <button class="btn" style="padding:6px 12px;font-size:10px;font-weight:700;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.4);color:#22c55e;" onclick="addNewActionType()">ADICIONAR</button>
      </div>
      <div id="action-types-list">
  `;
  
  actionTypes.forEach(type => {
    const isInactive = tiposInativos.includes(type);
    html += `
      <div class="admin-list-item" style="font-size:10px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:${isInactive ? '#ff0000' : '#fff'};${isInactive ? 'text-decoration:line-through;' : ''}">${escapeHtml(type)}</span>
        <div style="display:flex;gap:4px;">
          <button class="btn" style="padding:4px 8px;font-size:9px;font-weight:700;background:${isInactive ? 'rgba(34,197,94,0.2)' : 'rgba(255,0,0,0.2)'};border:1px solid ${isInactive ? 'rgba(34,197,94,0.4)' : 'rgba(255,0,0,0.3)'};color:${isInactive ? '#22c55e' : '#ff0000'};" onclick="toggleTipoInativo('${escapeHtml(type)}')">${isInactive ? 'ATIVAR' : 'INATIVAR'}</button>
          <button class="btn btn-danger" style="padding:4px 8px;font-size:9px;font-weight:700;" onclick="deleteActionType('${escapeHtml(type)}')">REMOVER</button>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">GERENCIAR TIPOS DE NEGÓCIO</h3>
      <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">Adicione ou remova tipos de negócio</p>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <input id="new-business-type" placeholder="Novo tipo de negócio" style="flex:1;font-family:inherit;width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:#fff;font-size:11px;outline:none;box-sizing:border-box;">
        <button class="btn" style="padding:6px 12px;font-size:10px;font-weight:700;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.4);color:#22c55e;" onclick="addNewBusinessType()">ADICIONAR</button>
      </div>
      <div id="business-types-list">
  `;
  
  businessTypes.forEach(type => {
    html += `
      <div class="admin-list-item" style="font-size:10px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#fff;">${escapeHtml(type)}</span>
        <button class="btn btn-danger" style="padding:4px 8px;font-size:9px;font-weight:700;" onclick="deleteBusinessType('${escapeHtml(type)}')">REMOVER</button>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  body.innerHTML = html;
}

function addNewActionType() {
  const input = document.getElementById('new-action-type');
  const type = input.value.trim();
  if (!type) {
    alert('Digite um nome para o tipo de ação');
    return;
  }
  
  // Check if type already exists in seizures
  const exists = (normalizeArrayData(seizures) || []).some(s => s.description === type);
  if (exists) {
    alert('Este tipo de ação já existe');
    return;
  }
  
  // Add a placeholder seizure with this type
  seizures.push({ 
    id: Date.now().toString(), 
    description: type, 
    member: [], 
    location: '', 
    imageUrl: '', 
    boImageUrl: '', 
    date: new Date().toISOString(), 
    approved: true 
  });
  
  saveData();
  renderAdminManage();
  alert('Tipo de ação adicionado com sucesso!');
}

function addNewBusinessType() {
  const input = document.getElementById('new-business-type');
  const type = input.value.trim();
  if (!type) {
    alert('Digite um nome para o tipo de negócio');
    return;
  }
  
  // Check if type already exists in negocios
  const exists = (normalizeArrayData(negocios) || []).some(n => n.tipo === type);
  if (exists) {
    alert('Este tipo de negócio já existe');
    return;
  }
  
  // Add a placeholder negocio with this type
  negocios.push({ 
    id: Date.now().toString(), 
    tipo: type, 
    quantidade: 0, 
    cliente: '', 
    valor: 0, 
    valorTotal: 0, 
    date: new Date().toISOString() 
  });
  
  saveData();
  renderAdminManage();
  alert('Tipo de negócio adicionado com sucesso!');
}

function toggleTipoInativo(tipo) {
  if (!tipo) return;
  const idx = tiposInativos.indexOf(tipo);
  if (idx > -1) {
    tiposInativos.splice(idx, 1);
  } else {
    tiposInativos.push(tipo);
  }
  saveData();
  renderAdminManage();
}

function deleteActionType(type) {
  if (!confirm(`Remover o tipo de ação "${type}"? Isso removerá todas as ações com este tipo.`)) return;
  
  // Remove all seizures with this type
  seizures = seizures.filter(s => s.description !== type);
  
  // Remove from inactive list if present
  const idx = tiposInativos.indexOf(type);
  if (idx > -1) tiposInativos.splice(idx, 1);
  
  saveData();
  renderAdminManage();
  renderAll();
}

function deleteBusinessType(type) {
  if (!confirm(`Remover o tipo de negócio "${type}"? Isso removerá todos os negócios com este tipo.`)) return;
  
  // Remove all negocios with this type
  negocios = negocios.filter(n => n.tipo !== type);
  
  saveData();
  renderAdminManage();
  renderAll();
}

function renderAdminSettings() {
  const body = document.getElementById('admin-body');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ALTERAR SENHA DO ADMIN</h3>
      <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">Autenticado como <strong style="color:#fff;">Administrador</strong></p>
      <div class="form-group"><label>SENHA ATUAL</label><input type="password" id="admin-old-pwd" placeholder="Senha atual"></div>
      <div class="form-group"><label>NOVA SENHA</label><input type="password" id="admin-new-pwd" placeholder="Nova senha"></div>
      <div class="form-group"><label>CONFIRMAR NOVA SENHA</label><input type="password" id="admin-conf-pwd" placeholder="Confirmar"></div>
      <button class="btn btn-primary" onclick="changeAdminPassword()">ALTERAR SENHA ADMIN</button>
    </div>
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ALTERAR SENHA DOS MEMBROS</h3>
      <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">Define a nova senha do painel de membros</p>
      <div class="form-group"><label>SENHA ATUAL DOS MEMBROS *</label><input type="password" id="members-current-pwd" placeholder="Senha atual do painel"></div>
      <div class="form-group"><label>NOVA SENHA MEMBROS *</label><input type="password" id="members-new-pwd" placeholder="Nova senha"></div>
      <div class="form-group"><label>CONFIRMAR NOVA SENHA *</label><input type="password" id="members-conf-pwd" placeholder="Confirmar"></div>
      <div class="form-group"><label>SUA SENHA ADMIN *</label><input type="password" id="members-admin-pwd" placeholder="Sua senha de admin para reautenticar"></div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="changeMembersPassword()">ALTERAR SENHA</button>
        <button class="btn" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;" onclick="notifyMembersPasswordChanged()">NOTIFICAR ALTERAÇÃO</button>
      </div>
    </div>
  `;
}

function changeAdminPassword() {
  const oldPwd = document.getElementById('admin-old-pwd').value;
  const newPwd = document.getElementById('admin-new-pwd').value;
  const confPwd = document.getElementById('admin-conf-pwd').value;
  if (!newPwd) { alert("Nova senha não pode ser vazia!"); return; }
  if (newPwd !== confPwd) { alert("As senhas não coincidem!"); return; }
  const user = firebase.auth().currentUser;
  if (!user) { alert("Você precisa estar autenticado."); return; }
  const credential = firebase.auth.EmailAuthProvider.credential('admin@sinaloa.app', oldPwd);
  user.reauthenticateWithCredential(credential).then(() => {
    user.updatePassword(newPwd).then(() => {
      notifyPasswordChange('ADMIN', newPwd);
      alert("Senha do ADMIN alterada com sucesso!");
      renderAdminSettings();
    }).catch(err => {
      alert("Erro ao alterar senha: " + err.message);
    });
  }).catch(() => {
    alert("Senha atual incorreta!");
  });
}

function changeMembersPassword() {
  const currentPwd = document.getElementById('members-current-pwd').value;
  const newPwd = document.getElementById('members-new-pwd').value;
  const confPwd = document.getElementById('members-conf-pwd').value;
  const adminPwd = document.getElementById('members-admin-pwd').value;
  if (!adminPwd) { alert("Informe sua senha de administrador!"); return; }
  if (!currentPwd) { alert("Informe a senha ATUAL dos membros!"); return; }
  if (!newPwd) { alert("Nova senha não pode ser vazia!"); return; }
  if (newPwd !== confPwd) { alert("As senhas não coincidem!"); return; }
  if (newPwd.length < 6) { alert("A senha deve ter pelo menos 6 caracteres!"); return; }
  const btn = document.querySelector('#admin-body .form-card:nth-child(2) .btn-primary');
  btn.disabled = true;
  btn.textContent = 'ALTERANDO...';
  firebase.auth().signInWithEmailAndPassword('membros@sinaloa.app', currentPwd)
    .then(membersCred => membersCred.user.updatePassword(newPwd))
    .then(() => firebase.auth().signOut())
    .then(() => firebase.auth().signInWithEmailAndPassword('admin@sinaloa.app', adminPwd))
    .then(() => {
      currentAuthUser = 'admin';
      notifyPasswordChange('MEMBROS', newPwd);
      alert('Senha dos membros alterada com sucesso!');
      document.getElementById('members-current-pwd').value = '';
      document.getElementById('members-new-pwd').value = '';
      document.getElementById('members-conf-pwd').value = '';
      document.getElementById('members-admin-pwd').value = '';
      renderAdminSettings();
    })
    .catch(error => {
      const code = error.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        alert('Senha atual dos membros ou senha do admin incorreta.');
      } else {
        alert('Erro: ' + (error.message || 'Erro desconhecido'));
      }
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = 'ALTERAR SENHA';
    });
}

function notifyMembersPasswordChanged() {
  if (!confirm("Confirmar que a senha do painel de membros foi alterada? Um email de notificação será enviado.")) return;
  notifyPasswordChange('MEMBROS', 'ALTERADA MANUALMENTE NO FIREBASE CONSOLE');
  alert("Notificação enviada!");
}

function renderMembersSeizures() {
  membersSeizurePage = 1;
  const body = document.getElementById('members-body');
  const groups = members.reduce((acc, m) => {
    const rank = m.rank || 'Membro';
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(m);
    return acc;
  }, {});
  Object.keys(groups).forEach(r => { if (!rankOrder[r]) rankOrder[r] = Object.keys(rankOrder).length + 1; });
  const sortedRanks = Object.keys(groups).sort((a, b) => (rankOrder[a] || 99) - (rankOrder[b] || 99));
  const memberBadges = sortedRanks.map(rank => {
    const items = groups[rank].map(m => `<span class="member-badge" data-name="${escapeHtml(m.name)}">${escapeHtml(m.name)}</span>`).join('');
    return `<div style="margin-bottom:6px;"><div style="font-size:0.6rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;text-align:center;">${escapeHtml(rank)}</div><div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;">${items}</div></div>`;
  }).join('');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">REGISTRAR AÇÃO</h3>
      <div class="form-group"><label>TIPO *</label><select id="m-new-desc" required><option value="">-- Selecione --</option><option value="Roubo de carga">Roubo de carga</option><option value="Assalto a banco">Assalto a banco</option><option value="Tráfico de armas">Tráfico de armas</option><option value="Sequestro">Sequestro</option><option value="Homicídio contratado">Homicídio contratado</option><option value="Roubo de veículo">Roubo de veículo</option><option value="Invasão">Invasão</option><option value="Corrida ilegal">Corrida ilegal</option><option value="Venda de drogas">Venda de drogas</option><option value="Falsificação">Falsificação</option><option value="Lavagem de dinheiro">Lavagem de dinheiro</option><option value="Extorsão">Extorsão</option><option value="Resgate">Resgate</option></select><input id="m-new-desc-custom" placeholder="Ou digite um tipo personalizado" style="margin-top:4px;font-family:inherit;width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;font-size:11px;outline:none;box-sizing:border-box;"></div>
      <div class="form-group"><label>MEMBROS RESPONSÁVEIS *</label><div id="m-new-members-container" style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto;padding:6px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.08);" onclick="toggleMemberBadge(event)">${memberBadges}</div></div>
      <div class="form-group"><label>LOCAL *</label><input id="m-new-location" placeholder="Local" required></div>
      <div class="form-group"><label>IMAGEM URL *</label><input id="m-new-simg" placeholder="https://..." required></div>
      <div class="form-group"><label>ITENS URL *</label><input id="m-new-bo" placeholder="https://..." required></div>
      <button class="btn btn-primary" onclick="addSeizureMembers()">REGISTRAR AÇÃO</button>
    </div>
    <div id="seizures-list-members"></div>
  `;
  renderSeizuresListMembers();
}

function renderSeizuresListMembers() {
  const container = document.getElementById('seizures-list-members');
  if (!seizures.length) { container.innerHTML = '<div class="empty-card">Nenhuma ação</div>'; return; }
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
    const isApproved = s.approved !== false;
    const statusBadge = isApproved
      ? '<span style="font-size:8px;color:var(--success);font-weight:700;margin-left:6px;">✓ APROVADO</span>'
      : '<span style="font-size:8px;color:#ffa500;font-weight:700;margin-left:6px;">● PENDENTE</span>';
    html += `<div class="admin-list-item" style="font-size:10px;">
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#fff;">${escapeHtml(s.description.substring(0, 40))} - <span style="font-weight:400;color:var(--text-muted);text-transform:none;font-size:9px;">${new Date(s.date).toLocaleDateString('pt-BR')}</span>${statusBadge}</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${escapeHtml(memberText)}</div></div>
    </div>`;
  });
  html += '</div>';
  if (totalPages > 1) {
    html += '<div style="display:flex;justify-content:center;align-items:center;gap:6px;padding:12px 0;font-size:10px;font-weight:700;font-family:inherit;">';
    html += '<button onclick="membersSeizurePage=' + (membersSeizurePage - 1) + ';renderSeizuresListMembers()" style="padding:6px 12px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;' + (membersSeizurePage <= 1 ? 'opacity:0.3;cursor:default;' : '') + '" ' + (membersSeizurePage <= 1 ? 'disabled' : '') + '>❮</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button onclick="membersSeizurePage=' + i + ';renderSeizuresListMembers()" style="padding:6px 10px;border-radius:4px;border:1px solid ' + (i === membersSeizurePage ? '#fff' : 'rgba(255,255,255,0.15)') + ';background:' + (i === membersSeizurePage ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)') + ';color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;">' + i + '</button>';
    }
    html += '<button onclick="membersSeizurePage=' + (membersSeizurePage + 1) + ';renderSeizuresListMembers()" style="padding:6px 12px;border-radius:4px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:10px;font-weight:700;font-family:inherit;' + (membersSeizurePage >= totalPages ? 'opacity:0.3;cursor:default;' : '') + '" ' + (membersSeizurePage >= totalPages ? 'disabled' : '') + '>❯</button>';
    html += '</div>';
  }
  container.innerHTML = html;
}

function addSeizureMembers() {
  let desc = document.getElementById('m-new-desc').value.trim();
  const customDesc = document.getElementById('m-new-desc-custom').value.trim();
  if (customDesc) desc = customDesc;
  const badges = document.querySelectorAll('#m-new-members-container .member-badge--selected');
  const members = Array.from(badges).map(b => b.getAttribute('data-name'));
  const location = document.getElementById('m-new-location').value.trim();
  const imageUrl = document.getElementById('m-new-simg').value.trim();
  const boImageUrl = document.getElementById('m-new-bo').value.trim();
  if (!desc) { alert("Selecione o tipo"); return; }
  if (!members.length) { alert("Selecione ao menos um membro responsável"); return; }
  if (!location) { alert("Informe o local"); return; }
  if (!imageUrl) { alert("Informe a URL da imagem"); return; }
  if (!boImageUrl) { alert("Informe a URL do BO"); return; }
  if (imageUrl === boImageUrl) { alert("A URL da imagem deve ser diferente da URL do BO"); return; }
  seizures.push({ id: Date.now().toString(), description: desc, member: members, location, imageUrl, boImageUrl, date: new Date().toISOString(), approved: false });
  membersSeizurePage = 1;
  saveData();
  renderMembersSeizures();
}

function renderMembersNegocios() {
  const body = document.getElementById('members-body');
  body.innerHTML = `<div class="empty-card">⚠️ Acesso restrito. Utilize o painel ADMIN para gerenciar negócios.</div>`;
}

function renderMembersMembers() {
  const body = document.getElementById('members-body');
  body.innerHTML = `<div class="empty-card">⚠️ Acesso restrito. Utilize o painel ADMIN para gerenciar membros.</div>`;
}



function addMember() {
  const name = document.getElementById('new-name').value.trim();
  const policeRank = document.getElementById('new-police-rank').value.trim();
  let rank = document.getElementById('new-rank').value.trim();
  
  if (rank === '__new__') {
    rank = document.getElementById('new-rank-custom').value.trim();
  }
  
  const level = document.getElementById('new-level').value;
  const status = document.getElementById('new-status').value;
  const createdAtInput = document.getElementById('new-created-at').value;
  const avatarUrl = document.getElementById('new-avatar').value.trim();
  const twitch = document.getElementById('new-twitch').value.trim().toLowerCase();
  const instagram = document.getElementById('new-instagram').value.trim().toLowerCase();
  const x = document.getElementById('new-x').value.trim().toLowerCase();
  const discord = document.getElementById('new-discord').value.trim();
  if (!name || !policeRank) { alert("Preencha nome e patente policial"); return; }
  if (!rank) { alert("Selecione ou crie uma hierarquia"); return; }
  if (!avatarUrl) { alert("A URL da foto do membro é obrigatória"); return; }
  
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
    policeRank: policeRank || 'Membro', 
    rank,
    level, 
    status, 
    avatarUrl, 
    twitch,
    instagram: instagram || null,
    x: x || null,
    discord: discord || null,
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
  document.getElementById('new-created-at').value = new Date().toISOString().split('T')[0];
  document.getElementById('new-avatar').value = '';
  document.getElementById('new-twitch').value = '';
  document.getElementById('new-instagram').value = '';
  document.getElementById('new-x').value = '';
  document.getElementById('new-discord').value = '';
}

function deleteMember(id) {
  if (!confirm("Remover este membro permanentemente?")) return;
  members = members.filter(m => m.id !== id);
  if (selectedAdminMember === id) selectedAdminMember = null;
  saveData();
  renderAll();
  renderAdminMembers();
}

function addSeizure() {
  let desc = document.getElementById('new-desc').value.trim();
  const customDesc = document.getElementById('new-desc-custom').value.trim();
  if (customDesc) desc = customDesc;
  const badges = document.querySelectorAll('#new-members-container .member-badge--selected');
  let members = Array.from(badges).map(b => b.getAttribute('data-name'));
  const location = document.getElementById('new-location').value.trim();
  const imageUrl = document.getElementById('new-simg').value.trim();
  const boImageUrl = document.getElementById('new-bo').value.trim();
  if (!desc || desc === '__new__') { alert("Selecione ou digite o tipo"); return; }
  if (!members.length) { alert("Selecione ao menos um membro responsável"); return; }
  if (!location) { alert("Informe o local"); return; }
  if (!imageUrl) { alert("Informe a URL da imagem"); return; }
  if (!boImageUrl) { alert("Informe a URL do BO"); return; }
  if (imageUrl === boImageUrl) { alert("A URL da imagem deve ser diferente da URL do BO"); return; }
  seizures.push({ id: Date.now().toString(), description: desc, member: members, location, imageUrl, boImageUrl, date: new Date().toISOString(), approved: true });
  adminSeizurePage = 1;
  saveData();
  renderAll();
  renderAdminSeizures();
}

function inativarTipoSelecionado() {
  const select = document.getElementById('new-desc');
  const tipo = select.value;
  if (!tipo || tipo === '__new__') {
    alert('Selecione um tipo para inativar');
    return;
  }
  if (!tiposInativos) tiposInativos = [];
  const idx = tiposInativos.indexOf(tipo);
  if (idx > -1) {
    tiposInativos.splice(idx, 1);
  } else {
    tiposInativos.push(tipo);
  }
  saveData();
  renderAll();
  renderAdminSeizures();
}

function deleteSeizure(id) {
  if (!confirm("Remover esta ação?")) return;
  seizures = seizures.filter(s => s.id !== id);
  saveData();
  renderAll();
  renderAdminSeizures();
}

function approveSeizure(id) {
  const s = seizures.find(s => s.id === id);
  if (!s) return;
  s.approved = true;
  s.approvedAt = Date.now();
  saveData();
  renderAll();
  renderAdminSeizures();
}

function addNegocio() {
  let tipo = document.getElementById('new-neg-tipo').value.trim();
  const customTipo = document.getElementById('new-neg-tipo-custom').value.trim();
  if (customTipo) tipo = customTipo;
  const quantidade = parseInt(document.getElementById('new-neg-quantidade').value, 10);
  let cliente = document.getElementById('new-neg-cliente').value.trim();
  const customCliente = document.getElementById('new-neg-cliente-custom').value.trim();
  if (cliente === '__new__' && customCliente) cliente = customCliente;
  const valor = parseFloat(document.getElementById('new-neg-valor').value);
  if (!tipo) { alert("Selecione ou digite o tipo"); return; }
  if (!quantidade || quantidade < 1) { alert("Informe a quantidade"); return; }
  if (!cliente || cliente === '__new__') { alert("Informe o cliente"); return; }
  if (!valor || valor <= 0) { alert("Informe o valor unitário"); return; }
  const valorTotal = quantidade * valor;
  negocios.push({ id: Date.now().toString(), tipo, quantidade, cliente, valor, valorTotal, date: new Date().toISOString() });
  saveData();
  renderAll();
  renderAdminNegocios();
}

function deleteNegocio(id) {
  if (!confirm("Remover este negócio?")) return;
  negocios = negocios.filter(n => n.id !== id);
  saveData();
  renderAll();
  renderAdminNegocios();
}

function toggleClienteInativo(cliente) {
  if (!cliente) return;
  const idx = clientesInativos.indexOf(cliente);
  if (idx > -1) {
    clientesInativos.splice(idx, 1);
  } else {
    clientesInativos.push(cliente);
  }
  saveData();
  renderAll();
  renderAdminNegocios();
}

function inativarClienteSelecionado() {
  const select = document.getElementById('new-neg-cliente');
  const cliente = select.value;
  if (!cliente || cliente === '__new__') {
    alert('Selecione um cliente para inativar');
    return;
  }
  const idx = clientesInativos.indexOf(cliente);
  if (idx > -1) {
    clientesInativos.splice(idx, 1);
  } else {
    clientesInativos.push(cliente);
  }
  saveData();
  renderAll();
  renderAdminNegocios();
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

function notifyPasswordChange(type, newPwd) {
  const now = new Date().toLocaleString('pt-BR');
  emailjs.send('service_gu4cf6e', 'template_8n8xfgh', {
    type: type,
    time: now,
    new_password: newPwd
  }).then(function(r) { debugLog('EmailJS ok:', r.status); }, function(e) { console.error('EmailJS error:', e); });
}

function toggleMemberBadge(e) {
  const badge = e.target.closest('.member-badge');
  if (!badge) return;
  badge.classList.toggle('member-badge--selected');
}

