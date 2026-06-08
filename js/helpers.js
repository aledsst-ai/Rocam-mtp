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

function getInstagramSVG() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`;
}

function getXSVG() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
}

function getSteamSVG() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.979 0C5.369 0 .06 5.31.06 11.979c0 2.508.772 4.835 2.095 6.755l3.413-1.382c.323.184.699.282 1.098.282.055 0 .111 0 .166-.005l1.924 2.545c.402.534 1.054.878 1.784.878 1.268 0 2.295-1.027 2.295-2.295 0-.303-.06-.592-.167-.854l1.153-4.339c.142.014.285.022.43.022 2.404 0 4.357-1.952 4.357-4.356 0-2.404-1.953-4.357-4.357-4.357-2.404 0-4.357 1.953-4.357 4.357 0 .42.06.826.171 1.212l-4.632 2.408c-1.195-.426-2.476-.35-3.599.238C3.51 16.883 5.394 22 11.979 22c6.611 0 11.961-5.35 11.961-11.961S18.59 0 11.979 0zM7.023 17.158l2.295-1.689c.398.608 1.062 1.04 1.826 1.142l-1.642 2.169c-.932.352-2.051.198-2.822-.429-.474-.387-.75-.942-.786-1.539l-.007-.035c.292.162.613.273.949.329.482.079.961.052 1.402.046l-.215.006zM15.5 8.999a2 2 0 110 4 2 2 0 010-4z"/></svg>`;
}

function getDiscordSVG() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0741.0741 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.1776-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>`;
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
  }
  return null;
}

function getLiveStreamInfo(member) {
  if (member.twitch && member.twitchLive) {
    return { url: `https://twitch.tv/${member.twitch}`, svg: getTwitchSVG(), platform: 'twitch', isLive: true };
  }
  return getStreamBadgeInfo(member);
}

function getStreamThumbnailUrl(member, width = 640, height = 360) {
  const streamInfo = getStreamBadgeInfo(member);
  if (!streamInfo) {
    return member.avatarUrl || `https://placehold.co/${width}x${height}/1a1a1a/555?text=Offline`;
  }
  if (streamInfo.platform === 'twitch') {
    const user = member.twitch || '';
    return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${encodeURIComponent(user)}-${width}x${height}.jpg`;
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
