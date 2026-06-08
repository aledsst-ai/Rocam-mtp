// ==================== TWITCH STATUS ====================
async function checkTwitchStatus(username) {
  if (!username) return false;
  try {
    const response = await fetch(`https://decapi.me/twitch/uptime/${username}`);
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

async function updateAllStreamStatus(skipSave) {
  if (streamStatusUpdateScheduled) return;
  streamStatusUpdateScheduled = true;
  
  try {
    for (const member of members) {
      member.twitchLive = false;
      member.tiktokLive = false;
    }
    
    for (const member of members) {
      if (member.twitch) {
        member.twitchLive = await checkTwitchStatus(member.twitch);
      }
      
      if (member.tiktok) {
        member.tiktok = normalizeTikTokUsername(member.tiktok);
        member.tiktokLive = await checkTikTokStatus(member.tiktok);
      }
    }
    
    if (!skipSave) {
      if (!firebaseInitialSyncCompleted && dataListenerRegistered) {
        console.log('⏭️ Ignorando saveData() até o Firebase carregar a primeira vez');
      } else {
        saveData();
      }
    }
    
    renderLiveMembers();
    renderHierarchy();
  } finally {
    streamStatusUpdateScheduled = false;
  }
}
