// ==================== MODAL ====================
function openModal(imageUrl) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  if (imageUrl && imageUrl !== '') {
    modalImg.style.opacity = '0';
    modalImg.src = imageUrl;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    modalImg.onload = () => {
      modalImg.style.opacity = '1';
    };
  }
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('show');
  document.body.style.overflow = 'auto';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});
// ==================== HELPER ====================
function getMembersList(member) {
  if (!member) return [];
  if (Array.isArray(member)) return member;
  return [member];
}

function makeMembersBadge(member) {
  const list = getMembersList(member);
  if (!list.length) return '';
  let text = list.length <= 2 ? list.join(', ') : list.slice(0, 2).join(', ') + ' +' + (list.length - 2);
  const json = JSON.stringify(list).replace(/"/g, '&quot;');
  return '<span class="badge" style="cursor:pointer;" onclick="event.stopPropagation(); showMembers(this, event)" data-members=\'' + json + '\'><span class="emoji-icon">👤</span>' + escapeHtml(text) + '</span>';
}

function showMembers(el, e) {
  var members = JSON.parse(el.dataset.members);
  closeMembersTooltip();
  var tooltip = document.createElement('div');
  tooltip.id = 'members-tooltip';
  tooltip.style.cssText = 'position:fixed;z-index:9999;background:rgba(10,10,10,0.95);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;font-size:0.78rem;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.4);pointer-events:none;white-space:nowrap;';
  tooltip.textContent = members.join(', ');
  var x = (e ? e.clientX : window.innerWidth / 2) + 12;
  var y = (e ? e.clientY : window.innerHeight / 2) + 8;
  if (x + 200 > window.innerWidth) x = window.innerWidth - 210;
  if (y + 40 > window.innerHeight) y = window.innerHeight - 50;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  document.body.appendChild(tooltip);
  setTimeout(function() { document.addEventListener('click', closeMembersTooltip); }, 0);
  document.addEventListener('keydown', closeMembersTooltipEsc);
}

function closeMembersTooltipEsc(e) {
  if (e.key === 'Escape') closeMembersTooltip();
}

function closeMembersTooltip() {
  var t = document.getElementById('members-tooltip');
  if (t) { t.remove(); }
  document.removeEventListener('click', closeMembersTooltip);
  document.removeEventListener('keydown', closeMembersTooltipEsc);
}

function getMemberSeizureCount(memberName) {
  if (!memberName) return 0;
  return seizures.filter(s => {
    const ms = getMembersList(s.member || s.memberName);
    return ms.includes(memberName);
  }).length;
}

function getTwitchSVG() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.571 4.714h1.715v5.143h-1.715V4.714zm4.715 0H18v5.143h-1.714V4.714zm0 2.286l1.715 1.715-1.715 1.715V6.999zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0H6zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v9.429z"/></svg>`;
}

function getTikTokSVG() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`;
}

function parseStoredDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string') {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function formatDateForInput(value) {
  const date = parseStoredDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStreamBadgeInfo(member) {
  if (member.twitch) {
    return {
      url: `https://twitch.tv/${member.twitch}`,
      svg: getTwitchSVG(),
      platform: 'twitch',
      isLive: member.twitchLive
    };
  } else if (member.tiktok) {
    const tiktokName = normalizeTikTokUsername(member.tiktok);
    return {
      url: `https://tiktok.com/@${tiktokName}/live`,
      svg: getTikTokSVG(),
      platform: 'tiktok',
      isLive: member.tiktokLive
    };
  }
  return null;
}

function getLiveStreamInfo(member) {
  if (member.tiktok && member.tiktokLive) {
    const tiktokName = normalizeTikTokUsername(member.tiktok);
    return { url: `https://tiktok.com/@${tiktokName}/live`, svg: getTikTokSVG(), platform: 'tiktok', isLive: true };
  }
  if (member.twitch && member.twitchLive) {
    return { url: `https://twitch.tv/${member.twitch}`, svg: getTwitchSVG(), platform: 'twitch', isLive: true };
  }
  return getStreamBadgeInfo(member);
}

function getStreamThumbnailUrl(member, width = 640, height = 360) {
  if (member.tiktokLive) {
    const name = normalizeTikTokUsername(member.tiktok);
    return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/eee?text=%40${encodeURIComponent(name)}+%F0%9F%94%B4`;
  }
  const streamInfo = getStreamBadgeInfo(member);
  if (!streamInfo) {
    return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=Offline`;
  }
  if (streamInfo.platform === 'twitch') {
    const user = member.twitch || '';
    return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${encodeURIComponent(user)}-${width}x${height}.jpg`;
  }
  if (streamInfo.platform === 'tiktok') {
    return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=TikTok`;
  }
  return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=Offline`;
}

function filterByDays(items, days) {
  if (days === 'all') return items;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return items.filter(item => new Date(item.date) >= cutoffDate);
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
