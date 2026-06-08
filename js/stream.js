// ==================== TWITCH STATUS ====================
function normalizeKickUsername(value) {
  if (!value) return '';
  let sanitized = value.trim().toLowerCase();
  sanitized = sanitized.replace(/^https?:\/\//, '');
  sanitized = sanitized.replace(/^www\./, '');
  sanitized = sanitized.replace(/^kick\.com\//, '');
  sanitized = sanitized.replace(/^kick\.com$/, '');
  sanitized = sanitized.replace(/^@/, '');
  sanitized = sanitized.replace(/^\/+/, '');
  sanitized = sanitized.split('/')[0];
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

  const apiUrl = `https://kick.com/api/v2/channels/${encodeURIComponent(normalized)}`;
  const proxies = [
    url => url,
    url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://cors.x2u.in/${url}`,
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  for (const proxy of proxies) {
    try {
      const url = proxy(apiUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(url, { mode: 'cors', signal: controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok) { console.warn('Kick API', resp.status, 'for', url); continue; }
      const data = await resp.json();
      if (data && data.livestream !== null && data.livestream !== undefined) return true;
      if (data && data.livestream === null) return false;
      console.warn('Kick API unexpected response shape for', url);
    } catch(e) {
      console.warn('Kick API fetch error for', proxy(apiUrl), e.message);
      continue;
    }
  }
  console.warn('Kick API all proxies failed for', normalized);
  return false;
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
  if (streamStatusUpdateScheduled) return;
  streamStatusUpdateScheduled = true;
  
  try {
    for (const member of members) {
      member.twitchLive = false;
      member.kickLive = false;
      member.tiktokLive = false;
    }
    
    for (const member of members) {
      if (member.twitch) {
        member.twitchLive = await checkTwitchStatus(member.twitch);
      }
      
      if (member.kick) {
        member.kick = normalizeKickUsername(member.kick);
        console.log('Kick: checking', member.name, member.kick);
        member.kickLive = await checkKickStatus(member.kick);
      }
      
      if (member.tiktok) {
        member.tiktok = normalizeTikTokUsername(member.tiktok);
        member.tiktokLive = await checkTikTokStatus(member.tiktok);
      }
    }
    
    if (!firebaseInitialSyncCompleted && dataListenerRegistered) {
      console.log('⏭️ Ignorando saveData() até o Firebase carregar a primeira vez');
    } else {
      saveData();
    }
    
    renderLiveMembers();
    renderHierarchy();
  } finally {
    streamStatusUpdateScheduled = false;
  }
}
