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
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 0C5.149 0 0 5.149 0 11.5c0 5.454 3.797 10.028 8.936 11.183.205.038.417-.118.417-.329v-2.486s-1.23.254-1.576.254c-1.994 0-2.932-1.299-2.932-2.933 0-1.945 1.388-3.594 3.418-3.594 1.174 0 2.272.502 2.998 1.299l2.632-1.113c.464-.196.793-.627.793-1.149 0-.684-.556-1.24-1.24-1.24h-.086l-2.681 1.136c-.514-.45-1.17-.694-1.86-.694-1.728 0-3.129 1.401-3.129 3.129 0 1.086.554 2.042 1.393 2.6v.017c0 1.852 1.024 3.555 2.876 4.122 1.661.509 3.341.117 4.151-.325.141-.077.234-.222.234-.381v-2.067c0-.202-.164-.366-.366-.366h-.024c-.088 0-.172.033-.236.089-1.138.986-2.886 1.037-4.191.351-.77-.405-1.164-1.134-1.164-1.914 0-.951.647-1.813 1.568-2.101l3.301-1.394c.472.507.89.784 1.502.784 1.577 0 2.612-1.298 2.612-2.826 0-1.528-1.035-2.874-2.612-2.874-.793 0-1.457.258-2.045.731L9.89 9.41c-.271.115-.45.379-.45.672 0 .408.331.739.739.739h.296l1.779-.759c.898.145 1.562.87 1.562 1.728 0 .987-.801 1.486-1.562 1.486-.504 0-.993-.198-1.362-.562l-1.565.662c.057.1.11.199.156.31 1.261 3.028 4.347 3.557 5.561 3.334.297-.054.607-.14.929-.254V9.283c0-.209-.165-.378-.374-.378h-.049c-.167 0-.313.109-.363.266-.466 1.446-1.835 2.477-3.426 2.477-1.992 0-3.228-1.316-3.228-3.028 0-1.621 1.228-3.033 3.228-3.033.922 0 1.779.378 2.406 1.032l.217.22c.142.143.337.224.54.224h4.005c.651 0 1.18-.529 1.18-1.18v-1.18c0-.651-.529-1.18-1.18-1.18H16.82c-.296 0-.564.157-.701.409l-.249.453c-.844.57-1.856.909-2.939.909C9.857 5.379 7.29 7.945 7.29 11.159c0 1.306.386 2.524 1.049 3.543l-2.99 1.264c-1.404-1.484-2.463-2.587-2.463-2.587 1.166-.628 1.962-1.837 1.962-3.158 0-2.018-1.636-3.654-3.654-3.654s-3.654 1.636-3.654 3.654c0 1.332.714 2.494 1.772 3.133l.06.035c.264.468.572.915.921 1.332l-.718 3.912A12.117 12.117 0 0011.5 23C17.851 23 23 17.851 23 11.5S17.851 0 11.5 0zM5.247 17.583l.517-2.818c.541.289 1.146.486 1.796.553l-.947 2.519c-.441.101-.914.072-1.366-.254zm-2.672-6.758c0-1.242 1.007-2.249 2.249-2.249s2.249 1.007 2.249 2.249-1.007 2.249-2.249 2.249-2.249-1.007-2.249-2.249z"/></svg>`;
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
