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
    document.body.style.overflow = 'hidden';
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
    document.body.style.overflow = 'hidden';
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
}

function closeMembersPanel() {
  const membersOverlay = document.getElementById('members-overlay');
  if (membersOverlay) {
    membersOverlay.classList.remove('open');
    document.body.style.overflow = '';
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
  } else if (tab === 'gallery') {
    tabs[2].classList.add('active');
    adminGalleryPage = 1;
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

function renderAdminMembers() {
  const body = document.getElementById('admin-body');
  const existingRanks = [...new Set(members.map(m => m.rank || "Membro"))];
  const rankOptions = existingRanks.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ADICIONAR MEMBRO</h3>
      <div class="form-group"><label>NOME *</label><input id="new-name" placeholder="Nome" required></div>
      <div class="form-group"><label>PATENTE POLICIAL *</label><input id="new-police-rank" placeholder="Ex: 3º Sargento, Cabo, Soldado..." required></div>
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
      html += '<div class="form-group"><label>PATENTE POLICIAL</label><input id="am-rank-input" value="' + escapeHtml(m.policeRank || '') + '"></div>';
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
}

function selectAdminMember(id) {
  selectedAdminMember = selectedAdminMember === id ? null : id;
  renderMembersList();
}

function saveSelectedMember() {
  const m = members.find(x => x.id === selectedAdminMember);
  if (!m) return;
  const newName = document.getElementById('am-name-input').value.trim();
  const newPoliceRank = document.getElementById('am-rank-input').value.trim();
  const newLevel = document.getElementById('am-level-select').value;
  const newStatus = document.getElementById('am-status-select').value;
  const newCreatedAt = document.getElementById('am-created-input').value;
  const newAvatarUrl = document.getElementById('am-avatar-input').value.trim();
  const newTwitch = document.getElementById('am-twitch-input').value.trim().toLowerCase();
  const newInstagram = document.getElementById('am-instagram-input').value.trim().toLowerCase();
  const newX = document.getElementById('am-x-input').value.trim().toLowerCase();
  const newDiscord = document.getElementById('am-discord-input').value.trim();
  if (newName) m.name = newName;
  m.policeRank = newPoliceRank || m.policeRank || 'Soldado';
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
  let html = '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;justify-content:center;">';
  vehicles.forEach(v => {
    html += `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;padding:0;flex:1;min-width:280px;max-width:100%;">
      <div style="height:200px;display:flex;align-items:center;justify-content:center;background:#0a0a0a;overflow:hidden;"><img src="${escapeHtml(v.imageUrl)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;display:block;" onerror="this.parentElement.style.display='none'"></div>
      <div style="padding:8px 10px;display:flex;justify-content:space-between;align-items:center;gap:6px;">
        <div style="min-width:0;flex:1;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#fff;">${escapeHtml(v.name)}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${v.status === 'disponivel' ? 'Disponível' : v.status === 'emuso' ? 'Em Uso' : 'Manutenção'}</div>
        </div>
        <button class="btn btn-danger" style="padding:4px 10px;font-size:10px;font-weight:700;flex-shrink:0;" onclick="deleteVehicle('${v.id}')">REMOVER</button>
      </div>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
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
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">REGISTRAR APREENSÃO</h3>
      <div class="form-group"><label>QRU *</label><select id="new-desc" required><option value="">-- Selecione QRU --</option><option value="Caixa registradora">Caixa registradora</option><option value="Venda de drogas">Venda de drogas</option><option value="Assalto à residência">Assalto à residência</option><option value="Roubo de veículo">Roubo de veículo</option><option value="Contrato ilegal">Contrato ilegal</option><option value="Corrida ilegal">Corrida ilegal</option><option value="Arrombamento de veículo">Arrombamento de veículo</option><option value="Posto de combustível">Posto de combustível</option><option value="Ammunation">Ammunation</option><option value="Bebidas">Bebidas</option><option value="Loja de conveniência">Loja de conveniência</option><option value="Joalheria">Joalheria</option><option value="Banco Fleeca">Banco Fleeca</option></select><input id="new-desc-custom" placeholder="Ou digite um QRU personalizado" style="margin-top:4px;font-family:inherit;width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;font-size:11px;outline:none;box-sizing:border-box;"></div>
      <div class="form-group"><label>MEMBROS RESPONSÁVEIS *</label><div id="new-members-container" style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto;padding:6px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.08);" onclick="toggleMemberBadge(event)">${memberBadges}</div></div>
      <div class="form-group"><label>LOCAL *</label><input id="new-location" placeholder="Local" required></div>
      <div class="form-group"><label>IMAGEM URL *</label><input id="new-simg" placeholder="https://..." required></div>
      <div class="form-group"><label>BO URL *</label><input id="new-bo" placeholder="https://..." required></div>
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

function renderAdminGallery() {
  const body = document.getElementById('admin-body');
  body.innerHTML = `
    <div class="form-card">
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">ADICIONAR FOTO À GALERIA</h3>
      <div class="form-group"><label>TÍTULO *</label><input id="new-gallery-title" placeholder="Título da foto"></div>
      <div class="form-group"><label>URL DA IMAGEM *</label><input id="new-gallery-img" placeholder="https://..."></div>
      <button class="btn btn-primary" onclick="addGalleryImage()">ADICIONAR À GALERIA</button>
    </div>
    <div id="gallery-list"></div>
  `;
  renderGalleryList();
}

function renderGalleryList() {
  const container = document.getElementById('gallery-list');
  if (!gallery.length) { container.innerHTML = '<div class="empty-card">Nenhuma foto na galeria</div>'; return; }
  const sorted = [...gallery].reverse();
  const totalPages = Math.ceil(sorted.length / ADMIN_GALLERY_PER_PAGE);
  if (adminGalleryPage > totalPages) adminGalleryPage = totalPages;
  if (adminGalleryPage < 1) adminGalleryPage = 1;
  const start = (adminGalleryPage - 1) * ADMIN_GALLERY_PER_PAGE;
  const end = Math.min(start + ADMIN_GALLERY_PER_PAGE, sorted.length);
  const pageItems = sorted.slice(start, end);
  let html = '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;justify-content:center;">';
  pageItems.forEach(g => {
    html += `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;padding:0;width:300px;">
      <img src="${escapeHtml(g.imageUrl)}" alt="" style="width:100%;height:160px;object-fit:cover;display:block;" onerror="this.style.display='none'">
      <div style="padding:8px 10px;display:flex;justify-content:space-between;align-items:center;gap:6px;">
        <div style="min-width:0;flex:1;">
          <div style="font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(g.title || 'Sem título')}</div>
          <div style="font-size:10px;color:var(--text-muted);">${new Date(g.date).toLocaleDateString('pt-BR')}</div>
        </div>
        <button class="btn btn-danger" style="padding:4px 10px;font-size:10px;font-weight:700;flex-shrink:0;" onclick="deleteGalleryImage('${g.id}')">REMOVER</button>
      </div>
    </div>`;
  });
  html += '</div>';
  if (totalPages > 1) {
    html += '<div style="display:flex;justify-content:center;align-items:center;gap:6px;padding:12px 0;font-size:11px;font-weight:700;">';
    html += '<button onclick="adminGalleryPage=' + (adminGalleryPage - 1) + ';renderGalleryList()" style="padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;' + (adminGalleryPage <= 1 ? 'opacity:0.3;cursor:default;' : '') + '" ' + (adminGalleryPage <= 1 ? 'disabled' : '') + '>❮</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button onclick="adminGalleryPage=' + i + ';renderGalleryList()" style="padding:6px 10px;border-radius:6px;border:1px solid ' + (i === adminGalleryPage ? '#fff' : 'rgba(255,255,255,0.15)') + ';background:' + (i === adminGalleryPage ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)') + ';color:#fff;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;">' + i + '</button>';
    }
    html += '<button onclick="adminGalleryPage=' + (adminGalleryPage + 1) + ';renderGalleryList()" style="padding:6px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;' + (adminGalleryPage >= totalPages ? 'opacity:0.3;cursor:default;' : '') + '" ' + (adminGalleryPage >= totalPages ? 'disabled' : '') + '>❯</button>';
    html += '</div>';
  }
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
  notifyPasswordChange('ADMIN', newPwd);
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
  notifyPasswordChange('MEMBROS', newPwd);
  alert("Senha do painel MEMBROS alterada com sucesso!");
  renderAdminSettings();
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
      <h3 style="margin-bottom: 12px; font-size: 0.8rem; font-weight: 700;">REGISTRAR APREENSÃO</h3>
      <div class="form-group"><label>QRU *</label><select id="m-new-desc" required><option value="">-- Selecione QRU --</option><option value="Caixa registradora">Caixa registradora</option><option value="Venda de drogas">Venda de drogas</option><option value="Assalto à residência">Assalto à residência</option><option value="Roubo de veículo">Roubo de veículo</option><option value="Contrato ilegal">Contrato ilegal</option><option value="Corrida ilegal">Corrida ilegal</option><option value="Arrombamento de veículo">Arrombamento de veículo</option><option value="Posto de combustível">Posto de combustível</option><option value="Ammunation">Ammunation</option><option value="Bebidas">Bebidas</option><option value="Loja de conveniência">Loja de conveniência</option><option value="Joalheria">Joalheria</option><option value="Banco Fleeca">Banco Fleeca</option></select><input id="m-new-desc-custom" placeholder="Ou digite um QRU personalizado" style="margin-top:4px;font-family:inherit;width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;font-size:11px;outline:none;box-sizing:border-box;"></div>
      <div class="form-group"><label>MEMBROS RESPONSÁVEIS *</label><div id="m-new-members-container" style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto;padding:6px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.08);" onclick="toggleMemberBadge(event)">${memberBadges}</div></div>
      <div class="form-group"><label>LOCAL *</label><input id="m-new-location" placeholder="Local" required></div>
      <div class="form-group"><label>IMAGEM URL *</label><input id="m-new-simg" placeholder="https://..." required></div>
      <div class="form-group"><label>BO URL *</label><input id="m-new-bo" placeholder="https://..." required></div>
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
  if (!desc) { alert("Selecione o QRU"); return; }
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
    policeRank: policeRank || 'Soldado', 
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
  let desc = document.getElementById('new-desc').value.trim();
  const customDesc = document.getElementById('new-desc-custom').value.trim();
  if (customDesc) desc = customDesc;
  const badges = document.querySelectorAll('#new-members-container .member-badge--selected');
  let members = Array.from(badges).map(b => b.getAttribute('data-name'));
  const location = document.getElementById('new-location').value.trim();
  const imageUrl = document.getElementById('new-simg').value.trim();
  const boImageUrl = document.getElementById('new-bo').value.trim();
  if (!desc) { alert("Selecione o QRU"); return; }
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

function deleteSeizure(id) {
  if (!confirm("Remover esta apreensão?")) return;
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

function addGalleryImage() {
  const title = document.getElementById('new-gallery-title').value.trim();
  const imageUrl = document.getElementById('new-gallery-img').value.trim();
  if (!title) { alert("Informe o título da foto"); return; }
  if (!imageUrl) { alert("Informe a URL da imagem"); return; }
  gallery.push({ id: Date.now().toString(), title, imageUrl, date: new Date().toISOString() });
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

function notifyPasswordChange(type, newPwd) {
  const now = new Date().toLocaleString('pt-BR');
  emailjs.send('service_gu4cf6e', 'template_8n8xfgh', {
    type: type,
    time: now,
    new_password: newPwd
  }).then(function(r) { console.log('EmailJS ok:', r.status); }, function(e) { console.error('EmailJS error:', e); });
}

function toggleMemberBadge(e) {
  const badge = e.target.closest('.member-badge');
  if (!badge) return;
  badge.classList.toggle('member-badge--selected');
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

