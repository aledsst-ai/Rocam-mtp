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
