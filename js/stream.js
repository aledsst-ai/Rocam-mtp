// ==================== TWITCH STATUS ====================
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
    const response = await fetch(`https://decapi.me/twitch/viewers/${username}`);
    const text = await response.text();
    const num = parseInt(text, 10);
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
