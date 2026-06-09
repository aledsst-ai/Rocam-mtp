let statusCheckInterval = null;

async function checkTwitchStatus(username) {
  if (!username) return false;
  try {
    const response = await fetch(`https://decapi.me/twitch/uptime/${username}`);
    const text = await response.text();
    return !text.includes("offline") && !text.includes("error");
  } catch(e) { return false; }
}

async function checkTwitchGame(username) {
  if (!username) return '';
  try {
    const response = await fetch(`https://decapi.me/twitch/game/${username}`);
    const text = await response.text();
    if (text.includes("offline") || text.includes("error") || text.includes("404")) return '';
    return text.trim();
  } catch(e) { return ''; }
}

async function checkTwitchViewers(username) {
  if (!username) return null;
  try {
    const resp = await fetch(`https://decapi.me/twitch/viewercount/${encodeURIComponent(username)}?t=${Date.now()}`, { cache: 'no-store' });
    const text = await resp.text();
    if (!text || text.toLowerCase().includes('offline') || text.toLowerCase().includes('error')) return null;
    const cleaned = text.replace(/[,\s]/g, '');
    const num = parseInt(cleaned, 10);
    return Number.isNaN(num) ? null : num;
  } catch(e) { return null; }
}

async function updateAllStreamStatus(skipSave) {
  if (streamStatusUpdateScheduled) return;
  streamStatusUpdateScheduled = true;
  
  try {
    for (const member of members) {
      member.twitchLive = false;
      member.twitchCategory = '';
      member.twitchViewers = null;
    }
    
    for (const member of members) {
      if (member.twitch) {
        member.twitchLive = await checkTwitchStatus(member.twitch);
        if (member.twitchLive) {
          member.twitchCategory = await checkTwitchGame(member.twitch);
          member.twitchViewers = await checkTwitchViewers(member.twitch);
        }
      }
    }
    
    if (!skipSave) {
      if (!firebaseInitialSyncCompleted && dataListenerRegistered) {
        console.log('Ignorando saveData() ate Firebase carregar');
      } else {
        saveData();
      }
    }
    
    renderLiveMembers();
    renderHierarchy();
    updateStats();
    startPeriodicRefresh();
  } finally {
    streamStatusUpdateScheduled = false;
  }
}

async function refreshLiveViewers() {
  const cards = document.querySelectorAll('.live-card-thumbnail[data-member-name]');
  if (cards.length === 0) return;

  for (const card of cards) {
    const name = card.getAttribute('data-member-name');
    if (!name) continue;
    const member = members.find(m => m.name === name);
    if (!member || !member.twitch) continue;

    const isLive = await checkTwitchStatus(member.twitch);
    if (!isLive) continue;

    const viewers = await checkTwitchViewers(member.twitch);
    if (viewers !== null) {
      member.twitchViewers = viewers;
      const el = card.querySelector('.live-card-viewers');
      if (el) el.textContent = `👁 ${viewers}`;
    }
  }
}

function startPeriodicRefresh() {
  if (statusCheckInterval) return;
  refreshLiveViewers();
  statusCheckInterval = setInterval(refreshLiveViewers, 30000);
}
