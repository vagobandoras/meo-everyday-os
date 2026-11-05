/* MEO – My Everyday OS · mobile web app
   Screens and flows follow MEO-Uygulama-Dokumani.md §8–9. Data lives in localStorage. */
(() => {
'use strict';

/* ================= Utilities ================= */
const $ = (s, r = document) => r.querySelector(s);
const view = $('#view'), footerEl = $('#footer'), tabbar = $('#tabbar'), sheetsEl = $('#sheets'), toastEl = $('#toast'), phone = $('#phone');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const pad2 = n => String(n).padStart(2, '0');
const sum = a => a.reduce((x, y) => x + y, 0);
const plural = (n, w, pl) => `${n} ${n === 1 ? w : (pl || w + 's')}`;
const fmtNum = n => Math.round(n).toLocaleString('en-US');
const initials = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const byAt = (a, b) => new Date(a.at) - new Date(b.at);

/* ---------- Dates ---------- */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const sod = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayDiff = (a, b) => Math.round((sod(a) - sod(b)) / 864e5);
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const ym = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const at = (off, h = 9, m = 0) => { const x = addDays(sod(new Date()), off); x.setHours(h, m, 0, 0); return x.toISOString(); };
const dayStr = off => ymd(addDays(new Date(), off));
const combine = (dayS, hhmm) => { const d = parseYmd(dayS); const [h, m] = (hhmm || '09:00').split(':').map(Number); d.setHours(h, m, 0, 0); return d.toISOString(); };
const fmtTime = d => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const fmtShort = d => `${MON[d.getMonth()]} ${d.getDate()}`;
const fmtLong = d => `${fmtShort(d)}, ${d.getFullYear()}`;
const fmtDow = d => `${DOW[d.getDay()]}, ${fmtShort(d)}`;
const fmtFull = d => `${DOW_FULL[d.getDay()]}, ${MONTH_FULL[d.getMonth()]} ${d.getDate()}`;
const relDay = d => { const n = dayDiff(d, new Date()); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : fmtDow(d); };
const fmtWhen = iso => { const d = new Date(iso); return `${relDay(d)}, ${fmtShort(d)} · ${fmtTime(d)}`.replace(/^(Today|Tomorrow|Yesterday), /, '$1, ').replace(/^(\w{3}, \w{3} \d+), \w{3} \d+/, '$1'); };
const fmtRange = (s, e) => {
  if (!s) return '';
  const a = parseYmd(s);
  if (!e) return fmtLong(a);
  const b = parseYmd(e);
  return a.getFullYear() === b.getFullYear() ? `${fmtShort(a)} – ${fmtLong(b)}` : `${fmtLong(a)} – ${fmtLong(b)}`;
};
const ago = iso => {
  const d = new Date(iso), s = (Date.now() - d) / 1000;
  if (s < 0) return relDay(d);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 6 * 3600) return plural(Math.floor(s / 3600), 'hour') + ' ago';
  const n = dayDiff(d, new Date());
  return n === 0 ? 'Today' : n === -1 ? 'Yesterday' : fmtShort(d);
};

/* ---------- Money ---------- */
// Demo exchange rates against TRY, used only to total spending across currencies.
const RATES = { TRY: 1, JPY: 0.23, USD: 41, EUR: 48 };
const CUR = { TRY: '₺', JPY: '¥', USD: '$', EUR: '€' };
const CUR_NAME = { TRY: 'Turkish Lira', JPY: 'Japanese Yen', USD: 'US Dollar', EUR: 'Euro' };
const conv = (a, from, to) => a * (RATES[from] || 1) / (RATES[to] || 1);
const money = (a, c = 'TRY') => {
  const neg = a < 0; a = Math.abs(a);
  const dec = c === 'JPY' || Number.isInteger(Math.round(a * 100) / 100) ? 0 : 2;
  const v = c === 'JPY' ? Math.round(a) : a;
  return (neg ? '-' : '') + (CUR[c] || '') + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};
const parseAmount = s => { const n = parseFloat(String(s || '').replace(/,/g, '').replace(/[^\d.]/g, '')); return isFinite(n) ? n : 0; };

/* ================= Icons (Lucide-style line icons) ================= */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  chart: '<path d="M4 21h16"/><path d="M6 17v-3"/><path d="M10 17v-6"/><path d="M14 17v-4"/><path d="M18 17V9"/><path d="m5 9 5-5 4 3 5-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  'chev-r': '<path d="m9 18 6-6-6-6"/>',
  'chev-l': '<path d="m15 18-6-6 6-6"/>',
  'chev-d': '<path d="m6 9 6 6 6-6"/>',
  more: '<circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  list: '<path d="m3 7 2 2 4-4"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/>',
  dumbbell: '<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>',
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  down: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
  up: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  'calendar-clock': '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4M8 2v4M3 10h5"/><circle cx="16" cy="16" r="6"/><path d="M16 14v2l1 1"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  sparkles: '<path d="M9.9 15.5A2 2 0 0 0 8.5 14.1L2.4 12.5a.5.5 0 0 1 0-1l6.1-1.6a2 2 0 0 0 1.4-1.4l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z"/>',
  paperclip: '<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6a4 4 0 0 1 5.7 5.7l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6M16 12H8M13 16H8"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 6H8.3a2 2 0 0 0-1.6.8L4 10l-2.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8M16 17H8M10 9H8"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  arrows: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1" fill="currentColor"/><circle cx="17.5" cy="10.5" r="1" fill="currentColor"/><circle cx="8.5" cy="7.5" r="1" fill="currentColor"/><circle cx="6.5" cy="12.5" r="1" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.7h2c3.1 0 5.6-2.5 5.6-5.6C22 6 17.5 2 12 2z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/>',
  nav: '<path d="m3 11 19-9-9 19-2-8z"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  pushpin: '<path d="M12 17v5"/><path d="M9 10.8a2 2 0 0 1-1.1 1.8l-1.8.9A2 2 0 0 0 5 15.2V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.8a2 2 0 0 0-1.1-1.8l-1.8-.9A2 2 0 0 1 15 10.8V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22"/><path d="M14 14.7V17c0 .6.5 1 1 1.2 1.1.5 2 2 2 3.8"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.4 1.2 1.3 2.3 2.5 2.8z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  dot: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
  minus: '<path d="M5 12h14"/>',
  shirt: '<path d="M20.4 6.6 16 4l-1.6.9a4 4 0 0 1-4.8 0L8 4 3.6 6.6a1 1 0 0 0-.5 1.1l.9 3.6a1 1 0 0 0 1 .8H7v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-9h2a1 1 0 0 0 1-.8l.9-3.6a1 1 0 0 0-.5-1.1z"/>',
  footprints: '<path d="M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0Z"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
};
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.dot}</svg>`;
const ic = (n, cls = 'brand') => `<span class="ic ${cls}">${icon(n)}</span>`;

/* ================= Reference data ================= */
const COLORS = ['brand', 'gray', 'green', 'blue', 'purple', 'orange', 'red'];
const SPACE_ICONS = ['plane', 'briefcase', 'camera', 'map', 'car', 'dumbbell', 'home', 'book', 'target', 'bag'];
const CATS = {
  food: { label: 'Food', long: 'Food & Drinks', icon: 'utensils', color: 'orange' },
  transport: { label: 'Transport', long: 'Transport', icon: 'car', color: 'blue' },
  shopping: { label: 'Shopping', long: 'Shopping', icon: 'bag', color: 'red' },
  tickets: { label: 'Tickets', long: 'Tickets & Activities', icon: 'ticket', color: 'purple' },
  hotel: { label: 'Hotel', long: 'Hotels', icon: 'building', color: 'green' },
  health: { label: 'Health', long: 'Health', icon: 'activity', color: 'green' },
  bills: { label: 'Bills', long: 'Bills', icon: 'receipt', color: 'orange' },
  fun: { label: 'Fun', long: 'Entertainment', icon: 'sparkles', color: 'purple' },
  other: { label: 'Other', long: 'Other', icon: 'tag', color: 'gray' },
};
const RTYPES = {
  general: { label: 'General', icon: 'bell', color: 'orange' },
  task: { label: 'Task', icon: 'check-circle', color: 'brand' },
  bill: { label: 'Bill', icon: 'file', color: 'red' },
  other: { label: 'Other', icon: 'more', color: 'gray' },
};
const REPEATS = {
  none: { label: 'Does not repeat', sub: 'Remind me only once', icon: 'ban' },
  daily: { label: 'Every day', sub: 'Repeat every day at the same time', icon: 'repeat' },
  weekly: { label: 'Every week', sub: 'Repeat on the same weekday', icon: 'calendar' },
  monthly: { label: 'Every month', sub: 'Repeat on the same day each month', icon: 'calendar-clock' },
  custom: { label: 'Custom', sub: 'Choose the days of the week', icon: 'sliders' },
};
const WEEKDAYS = [['1', 'Mon'], ['2', 'Tue'], ['3', 'Wed'], ['4', 'Thu'], ['5', 'Fri'], ['6', 'Sat'], ['0', 'Sun']];
const SUGGESTED = [['Pay internet bill', 'bill', 'file'], ['Gym workout', 'general', 'dumbbell'], ['Buy adapter', 'task', 'cart'], ['Check in for flight', 'task', 'plane'], ['Call mom', 'general', 'phone'], ['Take vitamins', 'general', 'activity']];
const TEMPLATES = {
  travel: { label: 'Travel', desc: 'Plan trips, expenses, places and lists.', icon: 'plane', tone: 'brand', modules: ['expenses', 'shopping', 'notes', 'places'], cover: 'fuji', color: 'brand' },
  fitness: { label: 'Fitness', desc: 'Track workouts, goals and progress.', icon: 'dumbbell', tone: 'green', modules: ['goals', 'reminders', 'notes'], cover: null, color: 'red' },
  study: { label: 'Study', desc: 'Organize notes, tasks and deadlines.', icon: 'book', tone: 'orange', modules: ['notes', 'reminders', 'goals'], cover: null, color: 'orange' },
  project: { label: 'Project', desc: 'Keep tasks, notes and plans together.', icon: 'folder', tone: 'purple', modules: ['reminders', 'notes', 'goals'], cover: null, color: 'purple' },
  scratch: { label: 'Start from scratch', desc: 'Build a Space your way.', icon: 'plus', tone: 'brand', modules: ['notes', 'reminders'], cover: null, color: 'brand' },
};
const MODULES = {
  expenses: { label: 'Expenses', desc: 'Track your spending', icon: 'wallet', color: 'orange', tone: 'orange' },
  shopping: { label: 'Shopping', desc: 'Keep a shopping list', icon: 'bag', color: 'red', tone: 'brand' },
  notes: { label: 'Notes', desc: 'Write and organize notes', icon: 'book', color: 'brand', tone: 'brand' },
  places: { label: 'Places', desc: 'Save places you want to see', icon: 'pin', color: 'green', tone: 'brand' },
  reminders: { label: 'Reminders', desc: 'Set reminders for things', icon: 'bell', color: 'orange', tone: 'orange' },
  goals: { label: 'Goals', desc: 'Set goals and track progress', icon: 'target', color: 'red', tone: 'red' },
  flights: { label: 'Flights', desc: 'Keep your flight details', icon: 'plane', color: 'purple', tone: 'blue' },
  hotel: { label: 'Hotel', desc: 'Save hotel and details', icon: 'bed', color: 'blue', tone: 'purple' },
  contacts: { label: 'Contacts', desc: 'Store contacts', icon: 'users', color: 'blue', tone: 'purple' },
};
const MOD_ORDER = ['expenses', 'shopping', 'notes', 'places', 'reminders', 'goals', 'flights', 'hotel', 'contacts'];
const EVENT_KINDS = {
  flight: { label: 'Flight', icon: 'plane', color: 'brand' },
  hotel: { label: 'Hotel', icon: 'building', color: 'purple' },
  activity: { label: 'Activity', icon: 'ticket', color: 'red' },
  other: { label: 'Plan', icon: 'calendar', color: 'gray' },
};
const NOTE_TAGS = ['Personal', 'Travel', 'Ideas', 'Food', 'Work'];
const COVERS = ['fuji', 'neon', 'temple', 'street', 'ramen', 'tower', 'skytree'];
const PLACE_CATS = [['all', 'All'], ['Attraction', 'Attractions'], ['Food', 'Food & Drinks'], ['Shopping', 'Shopping']];
const VISIT = {
  want: { label: 'Want to visit', icon: 'pushpin', color: 'orange' },
  planned: { label: 'Planned', icon: 'calendar', color: 'brand' },
  visited: { label: 'Visited', icon: 'check-circle', color: 'green' },
};
const QA = [
  { k: 'expense', label: 'Expense', sub: 'Add expense', icon: 'banknote', color: 'green' },
  { k: 'note', label: 'Note', sub: 'Add note', icon: 'book', color: 'purple' },
  { k: 'reminder', label: 'Reminder', sub: 'Remind me', icon: 'bell', color: 'orange' },
  { k: 'list', label: 'List', sub: 'Add item', icon: 'list', color: 'blue' },
  { k: 'goal', label: 'Goal', sub: 'Set goal', icon: 'target', color: 'red' },
  { k: 'place', label: 'Place', sub: 'Save a place', icon: 'pin', color: 'green' },
];

// Sample place directory for Tokyo. MEO has no live maps service here, so search runs over this list.
const CATALOG = [
  { key: 'sensoji', name: 'Senso-ji Temple', cat: 'Attraction', type: 'Temple', sub: 'Historical', area: 'Asakusa', dist: 0.3, art: 'temple', tags: ['Asakusa', 'Tokyo', 'Japan'], desc: "Tokyo's oldest temple, famous for its historic atmosphere, traditional architecture and Nakamise shopping street.", address: '2-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan', hours: '06:00 - 17:00', website: 'https://www.senso-ji.jp', x: 76, y: 26 },
  { key: 'nakamise', name: 'Nakamise Street', cat: 'Shopping', type: 'Shopping street', sub: 'Traditional', area: 'Asakusa', dist: 0.4, art: 'street', tags: ['Asakusa', 'Souvenirs'], desc: 'A 250 m street of snack and souvenir stalls leading up to Senso-ji.', address: '1-36-3 Asakusa, Taito City, Tokyo', hours: '09:00 - 19:00', website: '', x: 72, y: 32 },
  { key: 'asakusa-shrine', name: 'Asakusa Shrine', cat: 'Attraction', type: 'Shrine', sub: 'Shinto', area: 'Asakusa', dist: 0.5, art: 'temple', tags: ['Asakusa', 'Shrine'], desc: 'A quiet Shinto shrine right next to Senso-ji, home of the Sanja Matsuri festival.', address: '2-3-1 Asakusa, Taito City, Tokyo', hours: '09:00 - 16:30', website: '', x: 79, y: 22 },
  { key: 'skytree', name: 'Tokyo Skytree', cat: 'Attraction', type: 'Observation tower', sub: 'Landmark', area: 'Sumida', dist: 1.8, art: 'skytree', tags: ['Sumida', 'Views'], desc: 'The tallest tower in Japan with observation decks at 350 m and 450 m.', address: '1-1-2 Oshiage, Sumida City, Tokyo', hours: '10:00 - 21:00', website: 'https://www.tokyo-skytree.jp', x: 88, y: 30 },
  { key: 'akihabara', name: 'Akihabara', cat: 'Shopping', type: 'Electronics district', sub: 'Anime & games', area: 'Chiyoda', dist: 2.1, art: 'camera', tags: ['Electronics', 'Anime'], desc: 'Electronics shops, retro game stores and anime culture.', address: 'Sotokanda, Chiyoda City, Tokyo', hours: '10:00 - 21:00', website: '', x: 60, y: 40 },
  { key: 'yodobashi', name: 'Yodobashi Camera', cat: 'Shopping', type: 'Electronics store', sub: 'Multi-floor', area: 'Akihabara', dist: 2.2, art: 'camera', tags: ['Akihabara', 'Electronics'], desc: 'A nine-floor electronics store with cameras, games and gadgets.', address: '1-1 Kanda Hanaokacho, Chiyoda City, Tokyo', hours: '09:30 - 22:00', website: 'https://www.yodobashi-akiba.com', x: 63, y: 44 },
  { key: 'shibuya', name: 'Shibuya Crossing', cat: 'Attraction', type: 'Landmark', sub: 'Street', area: 'Shibuya', dist: 3.4, art: 'neon', tags: ['Shibuya', 'Night'], desc: 'The famous scramble crossing, best seen from above at night.', address: '2-2-1 Dogenzaka, Shibuya City, Tokyo', hours: 'Open 24 hours', website: '', x: 22, y: 72 },
  { key: 'ichiran', name: 'Ichiran Ramen', cat: 'Food', type: 'Ramen', sub: 'Tonkotsu', area: 'Shibuya', dist: 3.5, art: 'ramen', tags: ['Shibuya', 'Ramen'], desc: 'Tonkotsu ramen served in private solo booths.', address: '1-22-7 Jinnan, Shibuya City, Tokyo', hours: 'Open 24 hours', website: 'https://en.ichiran.com', x: 26, y: 64 },
  { key: 'tsukiji', name: 'Tsukiji Outer Market', cat: 'Food', type: 'Market', sub: 'Seafood', area: 'Chuo', dist: 4.0, art: 'ramen', tags: ['Chuo', 'Breakfast'], desc: 'Street food, sushi counters and kitchen shops.', address: '4-16-2 Tsukiji, Chuo City, Tokyo', hours: '05:00 - 14:00', website: '', x: 58, y: 72 },
  { key: 'tokyotower', name: 'Tokyo Tower', cat: 'Attraction', type: 'Landmark', sub: 'Observation tower', area: 'Minato', dist: 4.6, art: 'tower', tags: ['Minato', 'Views'], desc: 'The red and white tower from 1958 with a main deck at 150 m.', address: '4-2-8 Shibakoen, Minato City, Tokyo', hours: '09:00 - 23:00', website: 'https://www.tokyotower.co.jp', x: 46, y: 80 },
  { key: 'meiji', name: 'Meiji Jingu', cat: 'Attraction', type: 'Shrine', sub: 'Forest', area: 'Shibuya', dist: 5.2, art: 'temple', tags: ['Harajuku', 'Shrine'], desc: 'A forested shrine between Harajuku and Yoyogi Park.', address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo', hours: '05:00 - 18:00', website: 'https://www.meijijingu.or.jp', x: 16, y: 56 },
  { key: 'afuri', name: 'AFURI Ramen', cat: 'Food', type: 'Ramen', sub: 'Yuzu shio', area: 'Harajuku', dist: 5.0, art: 'ramen', tags: ['Harajuku', 'Ramen'], desc: 'Light yuzu shio ramen, a good counterpart to Ichiran.', address: '1-1-7 Ebisu, Shibuya City, Tokyo', hours: '11:00 - 23:00', website: '', x: 20, y: 66 },
];
const catByKey = k => CATALOG.find(c => c.key === k);

/* ================= Store ================= */
const KEY = 'meo.v1';
let db;
function seed() {
  const now = Date.now();
  const d = { v: 1 };
  d.user = { name: 'Muhsin Oktay', first: 'Muhsin', title: 'UX/UI Designer', prefs: { currency: 'TRY', appearance: 'system', language: 'English', notifications: true } };
  d.spaces = [
    { id: 'tokyo', name: 'Tokyo Trip', template: 'travel', desc: 'Trip', icon: 'plane', color: 'brand', cover: 'fuji', start: dayStr(1), end: dayStr(7), currency: 'JPY', budget: 250000, modules: ['expenses', 'shopping', 'notes', 'places'], createdAt: at(-40, 10) },
    { id: 'fitness', name: 'Fitness', template: 'fitness', desc: 'Personal goal', icon: 'dumbbell', color: 'red', cover: null, currency: 'TRY', modules: ['goals', 'reminders', 'notes'], createdAt: at(-60, 9) },
    { id: 'personal', name: 'Personal', template: 'scratch', desc: 'Daily life', icon: 'home', color: 'brand', cover: null, currency: 'TRY', modules: ['reminders', 'notes', 'expenses'], createdAt: at(-90, 9) },
    { id: 'work', name: 'Work', template: 'project', desc: 'Work related', icon: 'briefcase', color: 'orange', cover: null, currency: 'TRY', modules: ['reminders', 'notes', 'goals'], createdAt: at(-80, 9) },
  ];
  const E = (spaceId, title, amount, currency, category, when, location = '', payment = 'credit', note = '') => ({ id: uid(), spaceId, title, amount, currency, category, at: when, location, payment, note, receipt: '' });
  d.expenses = [
    E('tokyo', 'Flight ticket', 38750, 'JPY', 'transport', at(-18, 11, 5), 'Online', 'credit', 'Round trip, IST – HND'),
    E('tokyo', 'Comfort Hotel ERA', 21000, 'JPY', 'hotel', at(-14, 20, 40), 'Higashi Kanda', 'credit', 'Deposit for 6 nights'),
    E('tokyo', 'Dinner near Shibuya', 3200, 'JPY', 'food', at(-12, 21, 14), 'Shibuya', 'credit', 'Restaurant reservation'),
    E('tokyo', 'Suica Top Up', 2000, 'JPY', 'transport', at(-9, 18, 32), 'Shibuya Station', 'digital'),
    E('tokyo', 'Pocket Wi-Fi rental', 4600, 'JPY', 'other', at(-9, 14, 21), 'Online', 'credit'),
    E('personal', 'Groceries', 180, 'TRY', 'food', at(-6, 18, 10), 'Migros', 'debit'),
    E('personal', 'Metro card top-up', 100, 'TRY', 'transport', at(-6, 8, 30), 'Kadıköy', 'digital'),
    E('personal', 'Lunch with team', 160, 'TRY', 'food', at(-5, 12, 45), 'Levent', 'debit'),
    E('personal', 'Pharmacy', 240, 'TRY', 'health', at(-5, 19, 5), 'Moda', 'debit'),
    E('personal', 'Taxi home', 190, 'TRY', 'transport', at(-4, 23, 10), 'Beşiktaş', 'cash'),
    E('personal', 'Sports gear', 392, 'TRY', 'shopping', at(-3, 17, 20), 'Decathlon', 'credit'),
    E('personal', 'Cinema', 208, 'TRY', 'fun', at(-3, 20, 30), 'Kadıköy', 'credit'),
    E('personal', 'Dinner with friends', 330, 'TRY', 'food', at(-2, 20, 15), 'Kadıköy', 'credit'),
    E('personal', 'Coffee beans', 85, 'TRY', 'food', at(-1, 9, 40), 'Moda', 'debit'),
    E('personal', 'Book', 185, 'TRY', 'shopping', at(-1, 16, 0), 'Kadıköy', 'credit'),
    E('personal', 'Ferry & bus', 70, 'TRY', 'transport', at(0, 7, 5), 'Kadıköy', 'digital'),
    E('personal', 'Phone credit', 80, 'TRY', 'bills', at(0, 7, 20), 'Online', 'credit'),
  ];
  const R = (spaceId, type, title, when, extra = {}) => ({ id: uid(), spaceId, type, title, notes: '', at: when, repeat: 'none', days: [], done: false, icon: null, ...extra });
  d.reminders = [
    R('personal', 'bill', 'Pay electricity bill', at(0, 19, 30)),
    R('personal', 'task', 'Buy adapter', at(1, 10, 0), { icon: 'cart' }),
    R('fitness', 'general', 'Gym workout', at(2, 16, 0), { icon: 'dumbbell', repeat: 'weekly' }),
    R('personal', 'task', 'Review monthly budget', at(3, 9, 30), { icon: 'banknote' }),
    R('work', 'task', 'Prepare sprint demo', at(4, 14, 0)),
    R('personal', 'general', 'Water the plants', at(5, 9, 0), { repeat: 'weekly' }),
    R('fitness', 'general', 'Yoga class', at(6, 18, 30), { icon: 'activity' }),
    R('personal', 'bill', 'Pay internet bill', at(9, 10, 0), { repeat: 'monthly' }),
    R('fitness', 'general', 'Stretching', at(-6, 20, 0), { done: true }),
    R('fitness', 'general', 'Gym workout', at(-5, 16, 0), { icon: 'dumbbell', done: true }),
    R('personal', 'task', 'Call the bank', at(-5, 11, 0), { done: true }),
    R('work', 'task', 'Send invoice', at(-4, 10, 0), { done: true }),
    R('personal', 'task', 'Pick up dry cleaning', at(-4, 18, 0)),
    R('personal', 'bill', 'Pay phone bill', at(-3, 9, 0), { done: true }),
    R('fitness', 'general', 'Morning run', at(-2, 7, 30), { icon: 'activity', done: true }),
    R('work', 'task', 'Review pull requests', at(-2, 15, 0), { done: true }),
    R('personal', 'task', 'Renew gym membership', at(-1, 12, 0)),
    R('work', 'task', 'Update roadmap', at(-1, 17, 0), { done: true }),
  ];
  d.events = [
    { id: uid(), spaceId: 'tokyo', kind: 'flight', title: 'Flight to Tokyo', start: at(1, 9, 20), end: at(1, 17, 45), allDay: false },
    { id: uid(), spaceId: 'tokyo', kind: 'hotel', title: 'Check-in at Hotel', start: at(1, 19, 30), end: null, allDay: false },
    { id: uid(), spaceId: 'tokyo', kind: 'activity', title: 'DisneySea', start: at(2, 0, 0), end: null, allDay: true },
    { id: uid(), spaceId: 'tokyo', kind: 'flight', title: 'Flight home', start: at(7, 21, 5), end: at(8, 5, 10), allDay: false },
  ];
  const CL = (title, items) => ({ title, items: items.map(([text, done]) => ({ id: uid(), text, done: !!done })) });
  const N = (spaceId, title, tag, created, body, extra = {}) => ({ id: uid(), spaceId, title, tag, createdAt: created, body, cover: null, checklist: null, placeKey: null, ...extra });
  d.notes = [
    N('tokyo', 'Shibuya - must visit', 'Travel', at(-2, 16, 32), 'One of the most iconic spots in Tokyo. Explore the Shibuya Crossing, visit PARCO and Nintendo Store, and try some local food.', { cover: 'neon', placeKey: 'shibuya', checklist: CL('Things to do', [['Shibuya Crossing (take a video)', 1], ['PARCO (gaming & anime)', 1], ['Nintendo Store (check exclusive items)'], ['Try local food (ramen, street food)'], ['Take some night photos']]) }),
    N('tokyo', 'Ramen Places', 'Food', at(-6, 21, 5), 'Ichiran in Shibuya for the solo booths, AFURI for yuzu shio, and Fuunji near Shinjuku for tsukemen.', { cover: 'ramen', placeKey: 'ichiran' }),
    N('tokyo', 'Tokyo itinerary', 'Ideas', at(-33, 10, 0), 'Day 1: Shibuya, Day 2: Asakusa, Day 3: Akihabara and Ueno, Day 4: DisneySea, Day 5: Harajuku and Meiji Jingu, Day 6: Ginza.', { cover: 'skytree' }),
    N('tokyo', 'Packing list', 'Ideas', at(-37, 19, 0), 'Passport, JR Pass, clothes, adapter, power bank, umbrella.', { checklist: CL('Pack', [['Passport', 1], ['JR Pass voucher', 1], ['Travel adapter'], ['Power bank', 1], ['Umbrella']]) }),
    N('tokyo', 'Food places', 'Food', at(-40, 13, 0), 'Ramen, sushi, takoyaki, coffee shops in Shimokitazawa and the depachika food halls.', { cover: 'street' }),
    N('personal', 'Morning routine', 'Personal', at(0, 7, 10), 'Stretch for 10 minutes, coffee on the balcony, then plan the day before opening email.'),
    N('personal', 'Book ideas', 'Ideas', at(0, 7, 45), 'Re-read The Design of Everyday Things, then Atomic Habits.'),
    N('personal', 'Apartment fixes', 'Personal', at(-8, 18, 0), 'Small things to sort out this month.', { checklist: CL('To fix', [['Kitchen tap'], ['Balcony light', 1], ['Shower head']]) }),
    N('personal', 'Gift ideas', 'Ideas', at(-15, 21, 0), 'Mom: ceramic tea set. Ali: film camera strap.'),
    N('personal', 'Recipes to try', 'Food', at(-21, 19, 30), 'Menemen with sucuk, miso salmon, lentil soup.'),
    N('fitness', 'Workout plan', 'Personal', at(-20, 7, 0), 'Mon: push, Wed: pull, Fri: legs. Saturday long run.'),
    N('work', 'Q4 roadmap', 'Work', at(-10, 11, 0), 'Ship spaces sharing, improve search ranking, insights v2.'),
    N('work', 'Retro notes', 'Work', at(-3, 16, 0), 'Went well: release on time. Improve: fewer late scope changes.'),
  ];
  const S = (group, name, store, area, price, purchased, extra = {}) => ({ id: uid(), spaceId: 'tokyo', group, name, store, area, price, purchased, date: null, ...extra });
  d.shopping = [
    S('Shoes', 'Nike Air Force 1', 'Nike Store', 'Shibuya', 15400, true, { date: dayStr(0) }),
    S('Shoes', 'New Balance 2002R', 'ABC Mart', 'Shinjuku', 18700, true, { date: dayStr(0) }),
    S('Shoes', 'Adidas Samba', 'Adidas Store', 'Harajuku', null, false),
    S('Shoes', 'Asics Gel-Kayano 14', 'Asics Store', 'Ginza', null, false),
    S('Clothing', 'Uniqlo AIRism tee', 'Uniqlo', 'Ginza', 1990, true),
    S('Clothing', 'Beams overshirt', 'Beams', 'Harajuku', 12800, true),
    S('Clothing', 'Muji linen shirt', 'Muji', 'Yurakucho', null, false),
    S('Electronic', 'Fujifilm Instax Mini', 'Yodobashi Camera', 'Akihabara', 12980, true),
    S('Electronic', 'Travel adapter', 'Bic Camera', 'Shinjuku', null, false),
    S('Electronic', 'Sony WF-1000XM5', 'Yodobashi Camera', 'Akihabara', null, false),
  ];
  const PL = (key, status, dist, note = '') => { const c = catByKey(key); return { id: uid(), spaceId: 'tokyo', key, name: c.name, cat: c.cat, type: c.type, sub: c.sub, area: c.area, tags: c.tags, desc: c.desc, note, address: c.address, hours: c.hours, website: c.website, art: c.art, x: c.x, y: c.y, dist, status, createdAt: at(-20, 10) }; };
  d.places = [
    PL('shibuya', 'planned', 0.3),
    PL('ichiran', 'want', 0.5),
    PL('yodobashi', 'want', 4.2),
    PL('tokyotower', 'want', 4.6),
    PL('sensoji', 'want', 7.1, 'Visit early in the morning to avoid crowds. Walk through Nakamise street and try local snacks.'),
  ];
  d.goals = [
    { id: uid(), spaceId: 'fitness', title: 'Run 50 km this month', target: 50, progress: 32, unit: 'km' },
    { id: uid(), spaceId: 'fitness', title: 'Hit 10k steps', target: 7, progress: 4, unit: 'days' },
    { id: uid(), spaceId: 'fitness', title: 'Lose 3 kg', target: 3, progress: 3, unit: 'kg' },
    { id: uid(), spaceId: 'work', title: 'Close Q4 roadmap items', target: 12, progress: 7, unit: 'items' },
    { id: uid(), spaceId: 'work', title: 'Ship design system v2', target: 1, progress: 1, unit: '' },
  ];
  d.contacts = [];
  d.payments = [
    { id: 'credit', label: 'Credit Card', icon: 'card', color: 'green' },
    { id: 'debit', label: 'Debit Card', icon: 'card', color: 'brand' },
    { id: 'cash', label: 'Cash', icon: 'banknote', color: 'orange' },
    { id: 'transfer', label: 'Bank Transfer', icon: 'arrows', color: 'purple' },
    { id: 'digital', label: 'Digital Wallet', icon: 'wallet', color: 'red' },
  ];
  // Sample step counts (MEO would read these from Apple Health / Health Connect).
  const steps = {};
  [6420, 4170, 8830, 6050, 9120, 5480, 2610, 5200, 6100, 4900, 5800, 6300, 4700, 5100].forEach((v, i) => { steps[dayStr(-i)] = v; });
  d.health = { steps, goal: 10000, sample: true };
  d.activity = [
    { id: uid(), spaceId: 'tokyo', text: 'Expense added', amount: 3200, currency: 'JPY', at: new Date(now - 2 * 60e3).toISOString() },
    { id: uid(), spaceId: 'fitness', text: 'Goal updated', at: new Date(now - 62 * 60e3).toISOString() },
    { id: uid(), spaceId: 'personal', text: 'Reminder completed', at: new Date(now - 3.2 * 3600e3).toISOString() },
  ];
  d.recent = ['Tokyo Trip', 'electricity bill', 'gym', 'flight', 'vitamin'];
  return d;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.v === 1 && Array.isArray(d.spaces)) return d; }
  } catch (e) { /* storage blocked: fall back to sample data */ }
  return seed();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ } }
db = load();

/* ================= Domain helpers ================= */
const defCur = () => db.user.prefs.currency || 'TRY';
const spaceById = id => db.spaces.find(s => s.id === id);
const spaceCur = s => (s && s.currency) || defCur();
const spaceName = id => (spaceById(id) || {}).name || 'No space';
const payById = id => db.payments.find(p => p.id === id) || db.payments[0] || { label: 'Other', icon: 'wallet', color: 'gray' };
const hasModule = (s, m) => s && s.modules.includes(m);
const ensureModule = (s, m) => { if (s && !s.modules.includes(m)) s.modules.push(m); };
function log(spaceId, text, extra = {}) {
  db.activity.unshift({ id: uid(), spaceId, text, at: new Date().toISOString(), ...extra });
  db.activity = db.activity.slice(0, 40);
}
const spendOn = off => sum(db.expenses.filter(e => dayDiff(new Date(e.at), new Date()) === off).map(e => conv(e.amount, e.currency, defCur())));
const spaceExpenses = s => db.expenses.filter(e => e.spaceId === s.id).sort((a, b) => new Date(b.at) - new Date(a.at));
const spaceSpent = s => sum(spaceExpenses(s).map(e => conv(e.amount, e.currency, spaceCur(s))));
function spaceStatus(s) {
  if (!s.start) return '';
  const n = dayDiff(parseYmd(s.start), new Date());
  const e = s.end ? dayDiff(parseYmd(s.end), new Date()) : n;
  if (n > 1) return `Starts in ${n} days`;
  if (n === 1) return 'Starts Tomorrow';
  if (n === 0) return 'Starts Today';
  if (e >= 0) return 'In progress';
  return 'Ended';
}
function modCount(s, m) {
  const id = s.id;
  switch (m) {
    case 'expenses': return plural(db.expenses.filter(e => e.spaceId === id).length, 'item');
    case 'shopping': { const it = db.shopping.filter(i => i.spaceId === id); return `${it.filter(i => i.purchased).length} / ${it.length}`; }
    case 'notes': return plural(db.notes.filter(n => n.spaceId === id).length, 'note');
    case 'places': return `${db.places.filter(p => p.spaceId === id).length} saved`;
    case 'reminders': return `${db.reminders.filter(r => r.spaceId === id && !r.done).length} open`;
    case 'goals': { const g = db.goals.filter(x => x.spaceId === id); return `${g.filter(x => x.progress >= x.target).length} / ${g.length}`; }
    case 'flights': return plural(db.events.filter(e => e.spaceId === id && e.kind === 'flight').length, 'flight');
    case 'hotel': return plural(db.events.filter(e => e.spaceId === id && e.kind === 'hotel').length, 'stay');
    case 'contacts': return plural(db.contacts.filter(c => c.spaceId === id).length, 'contact');
    default: return '';
  }
}
function spaceSummary(s) {
  const id = s.id;
  const counts = {
    goals: [db.goals.filter(g => g.spaceId === id).length, 'goal'],
    reminders: [db.reminders.filter(r => r.spaceId === id && !r.done).length, 'reminder'],
    notes: [db.notes.filter(n => n.spaceId === id).length, 'note'],
    expenses: [db.expenses.filter(e => e.spaceId === id).length, 'expense'],
    places: [db.places.filter(p => p.spaceId === id).length, 'place'],
    shopping: [db.shopping.filter(i => i.spaceId === id).length, 'item'],
    flights: [db.events.filter(e => e.spaceId === id && e.kind === 'flight').length, 'flight'],
    hotel: [db.events.filter(e => e.spaceId === id && e.kind === 'hotel').length, 'stay'],
    contacts: [db.contacts.filter(c => c.spaceId === id).length, 'contact'],
  };
  const parts = s.modules.map(m => counts[m]).filter(c => c && c[0] > 0).slice(0, 2).map(([n, w]) => plural(n, w));
  return parts.join(' • ') || 'Empty for now';
}
function upcoming({ spaceId = null, fromTomorrow = false } = {}) {
  const now = new Date(), items = [];
  db.reminders.forEach(r => {
    if (r.done || (spaceId && r.spaceId !== spaceId)) return;
    const d = new Date(r.at);
    if (d < now) return;
    if (fromTomorrow && dayDiff(d, now) < 1) return;
    items.push({ kind: 'reminder', id: r.id, title: r.title, date: d, icon: r.icon || RTYPES[r.type].icon, color: RTYPES[r.type].color, allDay: false, sub: fmtTime(d) });
  });
  db.events.forEach(e => {
    if (spaceId && e.spaceId !== spaceId) return;
    const d = new Date(e.start), end = e.end ? new Date(e.end) : d;
    if (e.allDay ? dayDiff(d, now) < 0 : end < now) return;
    if (fromTomorrow && dayDiff(d, now) < 1) return;
    const k = EVENT_KINDS[e.kind] || EVENT_KINDS.other;
    items.push({ kind: 'event', id: e.id, title: e.title, date: d, icon: k.icon, color: k.color, allDay: e.allDay, sub: e.allDay ? 'All day' : e.end ? `${fmtTime(d)} - ${fmtTime(new Date(e.end))}` : fmtTime(d) });
  });
  return items.sort((a, b) => a.date - b.date);
}
const todaysReminders = () => db.reminders.filter(r => !r.done && dayDiff(new Date(r.at), new Date()) === 0).sort(byAt);
function nextOccurrence(r) {
  const d = new Date(r.at);
  if (r.repeat === 'daily') return addDays(d, 1);
  if (r.repeat === 'weekly') return addDays(d, 7);
  if (r.repeat === 'monthly') { const x = new Date(d); x.setMonth(x.getMonth() + 1); return x; }
  if (r.repeat === 'custom' && r.days && r.days.length) {
    for (let i = 1; i <= 7; i++) { const x = addDays(d, i); if (r.days.includes(String(x.getDay()))) return x; }
  }
  return null;
}
function setReminderDone(r, done) {
  r.done = done;
  if (done) {
    log(r.spaceId, 'Reminder completed');
    const next = nextOccurrence(r);
    if (next && !db.reminders.some(x => x.title === r.title && x.spaceId === r.spaceId && !x.done && new Date(x.at).getTime() === next.getTime())) {
      db.reminders.push({ ...r, id: uid(), at: next.toISOString(), done: false });
    }
  }
}
function placeOpenUrl(p) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.area || ''} Tokyo`)}`; }

/* ================= Visual building blocks ================= */
function neonSvg() {
  let s = '', r = 7;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  const cols = ['#3FE0D0', '#FF5FA2', '#FFD166', '#6C8CFF', '#B07CFF'];
  [[0, 90, 66], [62, 56, 62], [120, 112, 54], [170, 36, 72], [238, 82, 60], [294, 48, 56], [346, 100, 60]].forEach(([x, y, w]) => {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${260 - y}" fill="#0B1030"/>`;
    for (let yy = y + 12; yy < 226; yy += 16) for (let xx = x + 8; xx < x + w - 8; xx += 12) {
      if (rnd() < .5) s += `<rect x="${xx}" y="${yy}" width="6" height="8" fill="${cols[Math.floor(rnd() * cols.length)]}" opacity="${(.45 + rnd() * .5).toFixed(2)}"/>`;
    }
  });
  s += '<rect x="136" y="128" width="28" height="72" rx="3" fill="#FF5FA2" opacity=".9"/><rect x="252" y="104" width="22" height="60" rx="3" fill="#3FE0D0" opacity=".9"/><rect x="196" y="60" width="40" height="18" rx="3" fill="#FFD166" opacity=".9"/>';
  s += '<rect y="226" width="400" height="34" fill="#1A1440"/>';
  for (let i = 0; i < 10; i++) s += `<rect x="${10 + i * 40}" y="238" width="24" height="9" fill="#fff" opacity=".45"/>`;
  return s;
}
const ARTS = {
  fuji: { bg: 'linear-gradient(180deg,#F4B6CF 0%,#DDB4E2 45%,#B4A3DA 75%,#8E86C4 100%)', svg: '<circle cx="292" cy="62" r="24" fill="#FFE3EC" opacity=".75"/><path d="M30 206 L174 80 Q200 60 226 80 L370 206Z" fill="#8C84C2"/><path d="M148 103 L174 80 Q200 60 226 80 L252 103 L238 98 L226 110 L212 96 L200 112 L188 98 L174 108Z" fill="#fff"/><path d="M0 196 Q100 170 200 190 T400 186 V260 H0Z" fill="#7A6AA6"/><path d="M0 224 Q120 202 230 220 T400 214 V260 H0Z" fill="#5E4F8C"/><g fill="#F7A9C4"><circle cx="40" cy="216" r="22"/><circle cx="74" cy="228" r="18"/><circle cx="16" cy="238" r="16"/><circle cx="118" cy="242" r="14"/></g><rect x="327" y="98" width="4" height="20" fill="#3B2B4A"/><path d="M306 130 L352 130 L342 118 L316 118Z" fill="#2E2340"/><rect x="316" y="130" width="26" height="14" fill="#C8423A"/><path d="M300 156 L358 156 L346 144 L312 144Z" fill="#2E2340"/><rect x="312" y="156" width="34" height="16" fill="#C8423A"/><path d="M294 184 L364 184 L350 172 L308 172Z" fill="#2E2340"/><rect x="308" y="184" width="42" height="18" fill="#C8423A"/><path d="M288 214 L370 214 L354 202 L304 202Z" fill="#2E2340"/><rect x="304" y="214" width="50" height="46" fill="#C8423A"/>' },
  neon: { bg: 'linear-gradient(180deg,#141B3D 0%,#24215A 60%,#3A1F4F 100%)', svg: neonSvg() },
  temple: { bg: 'linear-gradient(180deg,#9FB4D8 0%,#DCE5F2 68%,#E9E2D6 100%)', svg: '<rect y="208" width="400" height="52" fill="#CDBFA9"/><rect x="10" y="150" width="70" height="60" fill="#9A3A30"/><path d="M0 154 L90 154 L76 136 L14 136Z" fill="#3D4F4C"/><rect x="320" y="150" width="70" height="60" fill="#9A3A30"/><path d="M310 154 L400 154 L386 136 L324 136Z" fill="#3D4F4C"/><rect x="110" y="128" width="180" height="86" fill="#B8372F"/><g fill="#7E2520"><rect x="124" y="140" width="8" height="74"/><rect x="164" y="140" width="8" height="74"/><rect x="228" y="140" width="8" height="74"/><rect x="268" y="140" width="8" height="74"/></g><path d="M66 134 L334 134 L292 98 L108 98Z" fill="#3D4F4C"/><path d="M118 100 L282 100 L252 68 L148 68Z" fill="#33433F"/><rect x="194" y="52" width="12" height="18" fill="#33433F"/><rect x="178" y="150" width="44" height="54" rx="18" fill="#D9483B"/><rect x="178" y="170" width="44" height="10" fill="#1E1E1E" opacity=".55"/><g fill="#4A4A55" opacity=".55"><circle cx="70" cy="228" r="5"/><circle cx="90" cy="232" r="5"/><circle cx="300" cy="230" r="5"/><circle cx="330" cy="234" r="5"/><circle cx="160" cy="236" r="5"/><circle cx="240" cy="234" r="5"/></g>' },
  street: { bg: 'linear-gradient(180deg,#F9E4C4,#F2CFA0)', svg: '<path d="M0 56 L162 118 L162 260 L0 260Z" fill="#B8432F"/><path d="M400 56 L238 118 L238 260 L400 260Z" fill="#B8432F"/><path d="M0 56 L162 118 L162 132 L0 82Z" fill="#7A2A1E"/><path d="M400 56 L238 118 L238 132 L400 82Z" fill="#7A2A1E"/><path d="M162 118 L238 118 L270 260 L130 260Z" fill="#D9C2A0"/><rect x="184" y="72" width="32" height="50" fill="#C8423A"/><path d="M176 76 L224 76 L220 68 L180 68Z" fill="#2E2340"/><g fill="#F6E7C8"><ellipse cx="40" cy="120" rx="10" ry="14"/><ellipse cx="90" cy="138" rx="9" ry="12"/><ellipse cx="360" cy="120" rx="10" ry="14"/><ellipse cx="310" cy="138" rx="9" ry="12"/></g><g fill="#4A3A40" opacity=".6"><circle cx="180" cy="200" r="7"/><circle cx="210" cy="214" r="7"/><circle cx="196" cy="236" r="8"/><circle cx="230" cy="190" r="6"/></g>' },
  tower: { bg: 'linear-gradient(180deg,#FFC59E 0%,#F08A7C 52%,#6B3D7A 100%)', svg: '<g fill="#4A2A5C"><rect x="0" y="196" width="60" height="64"/><rect x="56" y="210" width="44" height="50"/><rect x="290" y="186" width="54" height="74"/><rect x="340" y="204" width="60" height="56"/></g><path d="M200 24 L236 230 L164 230Z" fill="#E4572E"/><path d="M186 120 L214 120 L217 136 L183 136Z" fill="#fff"/><path d="M176 176 L224 176 L228 192 L172 192Z" fill="#fff"/><path d="M200 40 L176 230 M200 40 L224 230 M184 160 L216 160 M190 96 L210 96" stroke="#fff" stroke-width="2" opacity=".5"/><rect x="0" y="230" width="400" height="30" fill="#3B2350"/>' },
  skytree: { bg: 'linear-gradient(180deg,#8DB7F0,#DCE9FB)', svg: '<path d="M196 18 L204 18 L214 232 L186 232Z" fill="#EEF3FA"/><path d="M198 18 L202 18 L208 232 L192 232Z" fill="#C9D6EA"/><ellipse cx="200" cy="104" rx="16" ry="7" fill="#fff"/><ellipse cx="200" cy="146" rx="22" ry="8" fill="#fff"/><g fill="#5B7398"><rect x="0" y="200" width="70" height="60"/><rect x="66" y="214" width="50" height="46"/><rect x="250" y="206" width="60" height="54"/><rect x="306" y="190" width="94" height="70"/></g><rect y="236" width="400" height="24" fill="#7FA3D6"/>' },
  ramen: { bg: 'radial-gradient(circle at 50% 55%,#5A3B2A,#2A1C15)', svg: '<circle cx="200" cy="132" r="104" fill="#F3E6CF"/><circle cx="200" cy="132" r="86" fill="#E39A3B"/><g stroke="#F6D58B" stroke-width="6" fill="none" stroke-linecap="round"><path d="M140 120 q20 -14 40 0 t40 0"/><path d="M150 146 q20 -14 40 0 t40 0"/><path d="M132 168 q22 -12 44 0 t44 0"/></g><circle cx="238" cy="104" r="26" fill="#fff"/><circle cx="238" cy="104" r="13" fill="#F6A623"/><g fill="#6DBE45"><circle cx="170" cy="96" r="5"/><circle cx="182" cy="88" r="4"/><circle cx="160" cy="108" r="4"/><circle cx="252" cy="152" r="5"/></g><path d="M268 70 q14 30 6 60" stroke="#5B3A2A" stroke-width="10" fill="none" opacity=".4"/><path d="M300 20 L230 200 M318 24 L248 204" stroke="#C79A5B" stroke-width="7" stroke-linecap="round"/>' },
  camera: { bg: 'linear-gradient(180deg,#1A1F3A,#2B2350)', svg: '<rect x="60" y="40" width="280" height="220" fill="#151931"/><rect x="80" y="56" width="240" height="40" rx="4" fill="#E23B3B"/><g fill="#fff"><rect x="100" y="70" width="40" height="12" rx="2"/><rect x="150" y="70" width="60" height="12" rx="2"/><rect x="220" y="70" width="80" height="12" rx="2"/></g><rect x="70" y="110" width="26" height="120" rx="3" fill="#FFD166"/><rect x="304" y="110" width="26" height="120" rx="3" fill="#3FE0D0"/><g fill="#6C8CFF" opacity=".75"><rect x="112" y="116" width="176" height="20"/><rect x="112" y="146" width="176" height="20"/><rect x="112" y="176" width="176" height="20"/></g><rect x="0" y="230" width="400" height="30" fill="#0D1022"/>' },
};
// Photos cropped from the designer's Behance presentation (used with the designer's permission).
// Kinds without a photo fall back to the drawn SVG art; THUMBS are small crops for list thumbnails.
const PHOTOS = { fuji: 'img/fuji.jpg', neon: 'img/neon.jpg', temple: 'img/temple.jpg', street: 'img/street.jpg', ramen: 'img/ramen.jpg' };
const THUMBS = { neon: 'img/t-shibuya.jpg', ramen: 'img/t-ichiran.jpg', camera: 'img/t-yodobashi.jpg', tower: 'img/t-tower.jpg', temple: 'img/t-sensoji.jpg' };
function art(kind, small = false) {
  const src = (small && THUMBS[kind]) || PHOTOS[kind];
  if (src) return `<div class="art" style="background-image:url('${src}')"></div>`;
  const a = ARTS[kind] || ARTS.fuji;
  return `<div class="art" style="background:${a.bg}"><svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${a.svg}</svg></div>`;
}
function coverArt(s) {
  if (s.coverImg) return `<div class="art" style="background-image:url('${s.coverImg}')"></div>`;
  if (s.cover) return art(s.cover);
  return '';
}
const thumb = (kind, cls = '') => `<span class="thumb ${cls}">${art(kind, true)}</span>`;
function spaceThumb(s, cls = 'sm') {
  if (s.coverImg || s.cover) return `<span class="thumb ${cls}">${coverArt(s)}</span>`;
  return ic(s.icon, `${s.color} sq lg`);
}
function illo(name, { tone = 'brand', check = true, size = '' } = {}) {
  return `<div class="illo ${size} tone-${tone}" aria-hidden="true"><span class="blob"></span><span class="cloud c1"></span><span class="cloud c2"></span><span class="bit b1"></span><span class="bit b2"></span><span class="bit b3"></span><span class="tile3d">${icon(name)}</span>${check ? `<span class="chk">${icon('check')}</span>` : ''}</div>`;
}
const topbar = ({ title = '', center = false, step = 0, steps = 0, right = '' } = {}) => `
  <div class="topbar ${center ? 'center' : ''}">
    <button class="icon-btn" data-a="back" aria-label="Back">${icon('chev-l')}</button>
    ${center && title ? `<h1 class="tb-title">${esc(title)}</h1>` : ''}
    ${steps ? `<div class="step-ind" aria-label="Step ${step} of ${steps}"><span>${step} of ${steps}</span><span class="dots">${Array.from({ length: steps }, (_, i) => `<i class="${i < step ? 'on' : ''}"></i>`).join('')}</span></div>` : (right || '<span class="tb-spacer"></span>')}
  </div>`;
const pageHead = (title, sub, right = '') => `<div class="page-head"><div class="ph-text"><h1 class="title">${esc(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div>${right}</div>`;
const secHead = (title, action = '') => `<div class="sec-head"><h2>${esc(title)}</h2>${action}</div>`;
const seeAll = attrs => `<button class="link" ${attrs}>See all ${icon('chev-r')}</button>`;
const emptyBlock = (iconName, color, title, text, btn = '') => `<div class="empty">${ic(iconName, color + ' lg')}<p class="t">${esc(title)}</p><p class="m">${esc(text)}</p>${btn}</div>`;
const chev = () => icon('chev-r', 'chev');
const frow = (iconName, color, k, v, a, attrs = '') => `<button class="frow" data-a="${a}" ${attrs}>${ic(iconName, color)}<span class="main"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></span>${chev()}</button>`;
const counter = (id, len, max) => `<span class="count" id="${id}">${len}/${max}</span>`;

function calendar(sel, viewYm, ctx, minYmd) {
  const [y, m] = viewYm.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const today = ymd(new Date());
  let cells = '';
  for (let row = 0; row < 6; row++) {
    const rowStart = addDays(start, row * 7);
    if (row >= 4 && rowStart.getMonth() !== m - 1 && rowStart > first) break;
    for (let c = 0; c < 7; c++) {
      const d = addDays(rowStart, c), k = ymd(d);
      const dis = minYmd && k < minYmd;
      cells += `<button class="day ${d.getMonth() !== m - 1 ? 'muted' : ''} ${k === sel ? 'on' : ''} ${k === today ? 'today' : ''}" data-a="cal-day" data-ctx="${ctx}" data-day="${k}" ${dis ? 'disabled' : ''} aria-label="${fmtLong(d)}">${d.getDate()}</button>`;
    }
  }
  return `<div class="cal">
    <div class="cal-head">
      <button class="icon-btn sm" data-a="cal-nav" data-ctx="${ctx}" data-dir="-1" aria-label="Previous month">${icon('chev-l')}</button>
      <b>${MONTH_FULL[m - 1]} ${y}</b>
      <button class="icon-btn sm" data-a="cal-nav" data-ctx="${ctx}" data-dir="1" aria-label="Next month">${icon('chev-r')}</button>
    </div>
    <div class="cal-grid">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => `<span class="dow">${x}</span>`).join('')}${cells}</div>
  </div>`;
}
function mapCard(places, { height = 190, labels = true, focus = null } = {}) {
  const pins = places.map(p => `<span class="pin ${p.cat === 'Food' ? 'food' : ''} ${focus ? 'red' : ''}" style="left:${p.x}%;top:${p.y}%">${labels ? `<em>${esc(p.name)}</em>` : ''}<b>${icon(p.cat === 'Food' ? 'utensils' : focus ? 'dot' : 'pin')}</b></span>`).join('');
  return `<div class="map" style="height:${height}px"><svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="220" class="m-land"/>
      <circle cx="70" cy="120" r="38" class="m-park"/><ellipse cx="230" cy="56" rx="34" ry="18" class="m-park"/><ellipse cx="190" cy="168" rx="22" ry="14" class="m-park"/>
      <path d="M318 0 C300 50 346 92 324 134 S344 190 332 220" class="m-river"/>
      <path d="M0 74 H400 M0 152 H400 M64 0 V220 M172 0 V220 M256 0 V220 M0 20 L400 200 M24 220 L234 0" class="m-road"/>
      <path d="M0 112 H400 M116 0 V220 M214 0 V220 M0 190 L180 0 M120 220 L400 40 M290 0 V220" class="m-road thin"/>
    </svg>${pins}</div>`;
}
function ring(pct) {
  const c = 2 * Math.PI * 19, v = Math.max(0, Math.min(pct, 100)) / 100 * c;
  return `<span class="ring"><svg class="r" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" class="ring-bg"/><circle cx="22" cy="22" r="19" class="ring-fg" stroke-dasharray="${v.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 22 22)"/></svg>${icon('activity')}</span>`;
}
function trendBadge(pct, { goodWhenDown = false, suffix = '' } = {}) {
  if (pct === null || !isFinite(pct)) return '<span class="badge neutral">new</span>';
  const down = pct < 0, good = goodWhenDown ? pct <= 0 : pct >= 0;
  return `<span class="badge ${good ? 'good' : 'bad'}">${icon(down ? 'down' : 'up')} ${Math.abs(Math.round(pct))}%${suffix}</span>`;
}

/* ================= Router ================= */
const nav = {
  stack: [{ name: 'today', params: {} }],
  get cur() { return this.stack[this.stack.length - 1]; },
  push(name, params = {}) { this.cur.scroll = view.scrollTop; this.stack.push({ name, params }); render({ scroll: 0, anim: 'push' }); },
  replace(name, params = {}) { this.stack[this.stack.length - 1] = { name, params }; render({ scroll: 0, anim: 'push' }); },
  back() { if (this.stack.length > 1) { this.stack.pop(); render({ scroll: this.cur.scroll || 0, anim: 'pop' }); } else this.tab('today'); },
  tab(name) { this.stack = [{ name, params: {} }]; render({ scroll: 0 }); },
  reset(entries) { this.stack = entries; render({ scroll: 0, anim: 'push' }); },
};
const draft = () => nav.cur.params.d;
const goSpace = (id, tab = 'overview') => nav.reset([{ name: 'spaces', params: {} }, { name: 'space', params: { id, tab } }]);
const screens = {};

/* ================= Screens ================= */

/* ---------- Today (§8.1) ---------- */
screens.today = {
  tabs: true,
  render() {
    const now = new Date(), u = db.user, cur = defCur();
    const part = now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening';
    const due = todaysReminders(), first = due[0];
    const banner = first
      ? `<button class="card banner" data-a="reminder" data-id="${first.id}">
          ${ic('bell', 'orange lg')}
          <span class="main"><span class="m">${plural(due.length, 'reminder')}</span><span class="t">${esc(first.title)} ${icon('chev-r', 'xs')}</span></span>
          <span class="tpill">${icon('clock')}${fmtTime(new Date(first.at))}</span>
        </button>`
      : `<div class="card banner">${ic('check-circle', 'green lg')}<span class="main"><span class="m">All clear</span><span class="t">No reminders left for today</span></span></div>`;
    const steps = db.health.steps[ymd(now)] || 0, sp = Math.round(steps / (db.health.goal || 10000) * 100);
    const tS = spendOn(0), yS = spendOn(-1);
    const delta = yS > 0 ? (tS - yS) / yS * 100 : null;
    const notesToday = db.notes.filter(n => dayDiff(new Date(n.createdAt), now) === 0).length;
    const listLeft = db.shopping.filter(i => !i.purchased).length;
    const ups = upcoming({ fromTomorrow: true }).slice(0, 3);
    let insight = 'Add an expense to see how your days compare.';
    if (yS > 0) insight = `You spent ${Math.abs(Math.round(delta))}% ${tS <= yS ? 'less' : 'more'} than yesterday.`;
    else if (tS > 0) insight = `You spent ${money(tS, cur)} today.`;
    return `<div class="pad stack-lg">
      <header class="greet">
        <div class="avatar sq" aria-hidden="true">${esc(initials(u.name))}</div>
        <h1 class="greet-t">Good <em>${part}</em>,<br>${esc(u.first)}</h1>
        <div class="greet-actions">
          <button class="icon-btn" data-a="go" data-to="search" aria-label="Search">${icon('search')}</button>
          <button class="icon-btn" data-a="go" data-to="notifications" aria-label="Notifications">${icon('bell')}${due.length ? '<span class="dot"></span>' : ''}</button>
        </div>
      </header>
      <p class="date">${fmtFull(now)}</p>
      ${banner}
      <section class="card">
        ${secHead('Today at a glance')}
        <div class="tiles">
          <button class="tile" data-a="tab" data-to="insights"><span class="tl"><span class="k">Steps</span><span class="v">${fmtNum(steps)} <span class="badge good">${icon('dot')}${sp}%</span></span></span>${ring(sp)}</button>
          <button class="tile" data-a="tab" data-to="insights"><span class="tl"><span class="k">Spending</span><span class="v">${money(tS, cur)} ${delta === null ? '' : trendBadge(delta, { goodWhenDown: true })}</span></span>${ic('card', 'green plain')}</button>
          <button class="tile" data-a="go" data-to="search" data-filter="notes"><span class="tl"><span class="k">Notes</span><span class="v">${notesToday}</span></span>${ic('book', 'purple plain')}</button>
          <button class="tile" data-a="go" data-to="search" data-filter="items"><span class="tl"><span class="k">List items</span><span class="v">${listLeft}</span></span>${ic('list', 'purple plain')}</button>
        </div>
      </section>
      <section class="card">
        ${secHead('Upcoming', seeAll('data-a="go" data-to="notifications"'))}
        <div class="ulist">${ups.length ? ups.map(upRow).join('') : '<p class="muted">Nothing planned after today.</p>'}</div>
      </section>
      <section class="card">
        ${secHead('Insight')}
        <button class="urow" data-a="tab" data-to="insights">${ic(delta !== null && delta > 0 ? 'up' : 'down', (delta !== null && delta > 0 ? 'red' : 'green') + ' sm')}<span class="u-t"><small>Today's Insight</small><span>${esc(insight)}</span></span>${chev()}</button>
      </section>
    </div>`;
  },
};
function upRow(it) {
  const rel = it.allDay ? relDay(it.date) : relDay(it.date);
  const time = it.allDay ? 'All day' : fmtTime(it.date);
  return `<button class="urow" data-a="${it.kind}" data-id="${it.id}">${icon(it.icon)}<span class="u-t"><span>${esc(it.title)}</span></span><span class="when">${esc(rel)}<b>${time}</b></span></button>`;
}

/* ---------- Notifications ---------- */
screens.notifications = {
  render() {
    const now = new Date();
    const open = db.reminders.filter(r => !r.done);
    const overdue = open.filter(r => new Date(r.at) < now && dayDiff(new Date(r.at), now) < 0).sort(byAt);
    const today = todaysReminders();
    const next = upcoming({ fromTomorrow: true }).filter(i => dayDiff(i.date, now) <= 14);
    const remRow = r => `<div class="row clickable" data-a="reminder" data-id="${r.id}" role="button" tabindex="0">
        <button class="cb round ${r.done ? 'on' : ''}" data-a="rem-toggle" data-id="${r.id}" aria-label="Mark ${esc(r.title)} as done">${icon('check')}</button>
        <span class="main"><span class="t">${esc(r.title)}</span><span class="m">${esc(spaceName(r.spaceId))} · ${relDay(new Date(r.at))} ${fmtTime(new Date(r.at))}</span></span>${ic(r.icon || RTYPES[r.type].icon, RTYPES[r.type].color + ' sm')}</div>`;
    const block = (title, html) => html ? `<section>${secHead(title)}<div class="card tight rows">${html}</div></section>` : '';
    return `<div class="pad stack-lg">
      ${topbar({ title: 'Notifications', center: true })}
      ${block('Overdue', overdue.map(remRow).join(''))}
      ${block('Today', today.map(remRow).join(''))}
      ${block('Next 14 days', next.map(it => `<div class="row clickable" data-a="${it.kind}" data-id="${it.id}" role="button" tabindex="0">${ic(it.icon, it.color + ' sm')}<span class="main"><span class="t">${esc(it.title)}</span><span class="m">${relDay(it.date)} · ${esc(it.sub)}</span></span>${chev()}</div>`).join(''))}
      ${!overdue.length && !today.length && !next.length ? emptyBlock('bell', 'orange', 'You are all caught up', 'Reminders and plans for the next two weeks show up here.') : ''}
    </div>`;
  },
};

/* ---------- Spaces (§8.3) ---------- */
function spaceCard(s) {
  const status = spaceStatus(s);
  const more = `<button class="more" data-a="space-menu" data-id="${s.id}" aria-label="${esc(s.name)} options">${icon('more')}</button>`;
  if (s.cover || s.coverImg) {
    return `<article class="scard cover" data-a="space" data-id="${s.id}" role="button" tabindex="0">${coverArt(s)}${more}
      <h3>${esc(s.name)}</h3><p class="serif">${esc(fmtRange(s.start, s.end) || spaceSummary(s))}</p>
      ${status ? `<span class="glass-chip">${icon('calendar')}${esc(status)}</span>` : ''}</article>`;
  }
  return `<article class="scard" data-a="space" data-id="${s.id}" role="button" tabindex="0">${more}${ic(s.icon, `${s.color} xl`)}<h3>${esc(s.name)}</h3><p>${esc(spaceSummary(s))}</p></article>`;
}
function spaceGrid(q = '') {
  const list = db.spaces.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()));
  if (!list.length) return `<div style="grid-column:1/-1">${emptyBlock('layers', 'brand', 'No spaces found', q ? `Nothing matches “${q}”.` : 'Create a Space for a trip, a routine or a project.', `<button class="pill-btn" data-a="new-space">${icon('plus')} Create Space</button>`)}</div>`;
  return list.map(spaceCard).join('');
}
function activityRow(a) {
  const s = spaceById(a.spaceId);
  if (!s) return '';
  return `<div class="row clickable" data-a="space" data-id="${s.id}" role="button" tabindex="0">${spaceThumb(s)}<span class="main"><span class="t">${esc(s.name)}</span><span class="m">${esc(a.text)}</span></span><span class="end">${a.amount ? `<span class="a">${money(a.amount, a.currency)}</span>` : ''}<span class="s">${esc(ago(a.at))}</span></span></div>`;
}
screens.spaces = {
  tabs: true,
  render(p) {
    const acts = db.activity.filter(a => spaceById(a.spaceId));
    return `<div class="pad stack-lg">
      ${pageHead('Spaces', 'Everything organized around what matters.', `<button class="pill-btn" data-a="new-space">${icon('plus')} Create Space</button>`)}
      <label class="search"><span class="sr">Search spaces</span>${icon('search')}<input id="spaces-q" class="input" placeholder="Search spaces" value="${esc(p.q || '')}" autocomplete="off"></label>
      <section>${secHead('Your Spaces')}<div class="sgrid" id="sgrid">${spaceGrid(p.q || '')}</div></section>
      <section>${secHead('Recent Activity', acts.length > 3 ? `<button class="link" data-a="toggle-acts">${p.allActs ? 'Show less' : 'See all'} ${icon(p.allActs ? 'chev-d' : 'chev-r')}</button>` : '')}
        <div class="card tight rows">${acts.length ? acts.slice(0, p.allActs ? 40 : 3).map(activityRow).join('') : '<p class="muted" style="padding:16px 0">Activity from your Spaces shows up here.</p>'}</div></section>
    </div>`;
  },
};

/* ---------- Space detail (§8.4–8.6) ---------- */
const TAB_LABEL = { overview: 'Overview', expenses: 'Expenses', shopping: 'Shopping', notes: 'Notes', places: 'Places', reminders: 'Reminders', goals: 'Goals', flights: 'Flights', hotel: 'Hotel', contacts: 'Contacts' };
screens.space = {
  tabs: true,
  flush: true,
  render(p) {
    const s = spaceById(p.id);
    if (!s) return `<div class="pad">${topbar()}${emptyBlock('layers', 'brand', 'Space not found', 'It may have been deleted.')}</div>`;
    const tabs = ['overview', ...MOD_ORDER.filter(m => s.modules.includes(m))];
    const tab = tabs.includes(p.tab) ? p.tab : 'overview';
    const status = spaceStatus(s);
    const bg = (s.cover || s.coverImg) ? coverArt(s) : `<div class="hero-plain hc-${s.color}">${icon(s.icon)}</div>`;
    return `<div class="hero">${bg}
        <div class="hero-top">
          <button class="icon-btn glass" data-a="back" aria-label="Back">${icon('chev-l')}</button>
          <button class="icon-btn glass" data-a="space-menu" data-id="${s.id}" aria-label="Space options">${icon('more')}</button>
        </div>
        <div class="hero-info">
          <h1>${esc(s.name)}</h1>
          ${s.start ? `<div class="dates">${esc(fmtRange(s.start, s.end))}</div>` : `<div class="dates">${esc(s.desc || TEMPLATES[s.template]?.label || '')}</div>`}
          ${status ? `<span class="glass-chip">${icon('calendar')}${esc(status)}</span>` : ''}
        </div>
      </div>
      <div class="hero-body pad stack-lg">
        <div class="seg" role="tablist">${tabs.map(t => `<button role="tab" aria-selected="${t === tab}" class="${t === tab ? 'on' : ''}" data-a="space-tab" data-tab="${t}">${TAB_LABEL[t]}</button>`).join('')}</div>
        ${SPACE_TABS[tab](s, p)}
      </div>`;
  },
};
const SPACE_TABS = {
  overview(s) {
    const cur = spaceCur(s);
    let budget = '';
    if (s.budget) {
      const spent = spaceSpent(s), pct = Math.round(spent / s.budget * 100);
      budget = `<section class="card stack">
        <div class="card-head"><button class="h" data-a="budget" data-id="${s.id}">Budget ${icon('chev-r', 'sm')}</button><button class="icon-btn sm" style="background:var(--subtle)" data-a="budget" data-id="${s.id}" aria-label="Edit budget">${icon('more')}</button></div>
        <div class="split"><span class="budget-amt">${money(s.budget, cur)}</span><span class="r"><b>${money(s.budget - spent, cur)}</b><span>${s.budget - spent >= 0 ? 'Remaining' : 'Over budget'}</span></span></div>
        <div class="bar ${pct > 100 ? 'over' : ''}"><i style="width:${Math.min(pct, 100)}%"></i></div>
        <div class="bar-meta"><span>${money(spent, cur)} spent (${pct}%)</span><span>${esc(spaceStatus(s))}</span></div>
      </section>`;
    } else if (hasModule(s, 'expenses')) {
      budget = `<section class="card stack"><div class="card-head"><span class="h">Spent so far</span><button class="link" data-a="budget" data-id="${s.id}">Set budget ${icon('chev-r')}</button></div><span class="budget-amt">${money(spaceSpent(s), cur)}</span></section>`;
    }
    const mods = s.modules.length ? `<div class="mods">${s.modules.map(m => `<button class="mod" data-a="space-tab" data-tab="${m}">${ic(MODULES[m].icon, MODULES[m].color)}<span class="t">${MODULES[m].label}</span><span class="m">${esc(modCount(s, m))}</span></button>`).join('')}</div>` : '';
    const ups = upcoming({ spaceId: s.id }).slice(0, 4);
    const upHtml = `<section class="card">${secHead('Upcoming', `<button class="link" data-a="add-event" data-space="${s.id}">${icon('plus')} Add plan</button>`)}
      <div class="rows">${ups.length ? ups.map(it => `<div class="row clickable" data-a="${it.kind}" data-id="${it.id}" role="button" tabindex="0">${ic(it.icon, it.color)}<span class="main"><span class="t">${esc(it.title)}</span><span class="m">${esc(it.sub)}</span></span><span class="dbadge"><small>${MON[it.date.getMonth()]}</small><b>${it.date.getDate()}</b></span></div>`).join('') : '<p class="muted">No plans yet. Add flights, check-ins or bookings.</p>'}</div></section>`;
    let recent = '';
    if (hasModule(s, 'expenses')) {
      const ex = spaceExpenses(s).slice(0, 3);
      recent = `<section class="card">${secHead('Recent Expenses', ex.length ? seeAll(`data-a="space-tab" data-tab="expenses"`) : '')}<div class="rows">${ex.length ? ex.map(expenseRow).join('') : '<p class="muted">No expenses yet.</p>'}</div></section>`;
    }
    return budget + mods + upHtml + recent;
  },
  expenses(s, p) {
    const cur = spaceCur(s), all = spaceExpenses(s);
    const cats = [...new Set(all.map(e => e.category))];
    const cat = cats.includes(p.cat) ? p.cat : 'all';
    const list = cat === 'all' ? all : all.filter(e => e.category === cat);
    return `<section class="card stack"><div class="card-head"><span class="h">Total spent</span><span class="muted">${plural(all.length, 'expense')}</span></div><span class="budget-amt">${money(spaceSpent(s), cur)}</span></section>
      ${cats.length > 1 ? `<div class="chips"><button class="chip ${cat === 'all' ? 'on' : ''}" data-a="space-filter" data-k="cat" data-v="all">All</button>${cats.map(c => `<button class="chip ${cat === c ? 'on' : ''}" data-a="space-filter" data-k="cat" data-v="${c}">${icon(CATS[c].icon)}${CATS[c].label}</button>`).join('')}</div>` : ''}
      <div class="card tight rows">${list.length ? list.map(expenseRow).join('') : '<p class="muted" style="padding:16px 0">No expenses yet.</p>'}</div>
      <button class="btn btn-dashed" data-a="qa" data-k="expense" data-space="${s.id}">${icon('plus')} Add expense</button>`;
  },
  shopping(s, p) {
    const items = db.shopping.filter(i => i.spaceId === s.id);
    const groups = [...new Set(items.map(i => i.group || 'General'))];
    const g = groups.includes(p.group) ? p.group : 'all';
    const done = items.filter(i => i.purchased).length, pct = items.length ? Math.round(done / items.length * 100) : 0;
    const cur = spaceCur(s);
    const groupCard = name => {
      const its = items.filter(i => (i.group || 'General') === name);
      const gd = its.filter(i => i.purchased).length;
      return `<section class="card">
        <div class="grp-head">${ic(groupIcon(name), 'blue sq')}<span class="main"><span class="t">${esc(name)}</span><span class="m">${gd} of ${its.length} completed</span></span><button class="icon-btn sm" style="background:var(--subtle)" data-a="add-item" data-space="${s.id}" data-group="${esc(name)}" aria-label="Add item to ${esc(name)}">${icon('plus')}</button></div>
        <div class="rows">${its.map(i => `<div class="row">
          <button class="cb ${i.purchased ? 'on' : ''}" data-a="shop-toggle" data-id="${i.id}" aria-label="${i.purchased ? 'Unmark' : 'Mark'} ${esc(i.name)} as bought">${icon('check')}</button>
          <span class="main"><span class="t">${esc(i.name)}</span><span class="m">${esc([i.store, i.area].filter(Boolean).join(' • ') || 'No store yet')}</span></span>
          <span class="end"><span class="a">${i.price ? money(i.price, cur) : '-'}</span>${i.date ? `<span class="s">${fmtLong(parseYmd(i.date))}</span>` : ''}</span>
          <button class="icon-btn sm" style="background:transparent" data-a="item-menu" data-id="${i.id}" aria-label="${esc(i.name)} options">${icon('more')}</button>
        </div>`).join('')}</div></section>`;
    };
    return `<section class="card stack">
        <div class="card-head"><span class="h">Shopping Progress</span><span class="muted">${done} of ${items.length} completed</span></div>
        <div class="bar green"><i style="width:${pct}%"></i></div>
        <div class="bar-meta"><span>${pct}% completed</span><span>${plural(items.length - done, 'item')} left</span></div>
      </section>
      ${groups.length ? `<div class="chips"><button class="chip ${g === 'all' ? 'on' : ''}" data-a="space-filter" data-k="group" data-v="all">All</button>${groups.map(x => `<button class="chip ${g === x ? 'on' : ''}" data-a="space-filter" data-k="group" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
      ${(g === 'all' ? groups : [g]).map(groupCard).join('') || emptyBlock('bag', 'red', 'Your list is empty', 'Add things you want to buy and tick them off as you go.')}
      <button class="btn btn-dashed" data-a="add-item" data-space="${s.id}">${icon('plus')} Add item</button>`;
  },
  notes(s, p) {
    const notes = db.notes.filter(n => n.spaceId === s.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const tags = [...new Set(notes.map(n => n.tag).filter(Boolean))];
    const t = tags.includes(p.ntag) ? p.ntag : 'all';
    const list = t === 'all' ? notes : notes.filter(n => n.tag === t);
    return `<div class="chips"><button class="chip ${t === 'all' ? 'on' : ''}" data-a="space-filter" data-k="ntag" data-v="all">All</button>${tags.map(x => `<button class="chip ${t === x ? 'on' : ''}" data-a="space-filter" data-k="ntag" data-v="${esc(x)}">${esc(x)}</button>`).join('')}<button class="pill-btn solid" data-a="qa" data-k="note" data-space="${s.id}">${icon('plus')} Add Note</button></div>
      ${list.length ? `<div class="ngrid">${list.map(noteCard).join('')}</div>` : emptyBlock('book', 'brand', 'No notes yet', 'Write down ideas, plans and lists for this Space.')}`;
  },
  places(s, p) {
    const places = db.places.filter(x => x.spaceId === s.id);
    const c = ['all', 'Attraction', 'Food', 'Shopping'].includes(p.pcat) ? p.pcat : 'all';
    const list = c === 'all' ? places : places.filter(x => x.cat === c);
    return `<div class="chips">${PLACE_CATS.map(([k, l]) => `<button class="chip ${c === k ? 'on' : ''}" data-a="space-filter" data-k="pcat" data-v="${k}">${l === 'Food & Drinks' ? 'Food' : l}</button>`).join('')}</div>
      ${mapCard(list.length ? list : places, { labels: list.length <= 6 })}
      <section class="card">
        <div class="card-head" style="margin-bottom:4px"><span class="h">Places to Visit</span></div>
        <p class="muted" style="font-size:13px">${plural(list.length, 'saved place')}</p>
        <div class="rows">${list.map(placeRow).join('')}</div>
        <button class="link" style="padding:12px 0 4px" data-a="add-place" data-space="${s.id}">${icon('plus')} Add place</button>
      </section>`;
  },
  reminders(s) {
    const rs = db.reminders.filter(r => r.spaceId === s.id);
    const open = rs.filter(r => !r.done).sort(byAt), done = rs.filter(r => r.done).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 10);
    const row = r => `<div class="row clickable" data-a="reminder" data-id="${r.id}" role="button" tabindex="0">
      <button class="cb round ${r.done ? 'on' : ''}" data-a="rem-toggle" data-id="${r.id}" aria-label="${r.done ? 'Mark as not done' : 'Mark as done'}">${icon('check')}</button>
      <span class="main"><span class="t ${r.done ? 'done-t' : ''}">${esc(r.title)}</span><span class="m">${relDay(new Date(r.at))} · ${fmtTime(new Date(r.at))}${r.repeat !== 'none' ? ' · ' + REPEATS[r.repeat].label : ''}</span></span>${ic(r.icon || RTYPES[r.type].icon, RTYPES[r.type].color + ' sm')}</div>`;
    return `<section class="card">${secHead('Open')}<div class="rows">${open.length ? open.map(row).join('') : '<p class="muted">Nothing open.</p>'}</div></section>
      ${done.length ? `<section class="card">${secHead('Completed')}<div class="rows">${done.map(row).join('')}</div></section>` : ''}
      <button class="btn btn-dashed" data-a="qa" data-k="reminder" data-space="${s.id}">${icon('plus')} Add reminder</button>`;
  },
  goals(s) {
    const gs = db.goals.filter(g => g.spaceId === s.id);
    return `${gs.length ? gs.map(g => { const pct = Math.min(100, Math.round(g.progress / g.target * 100)); return `<section class="card stack">
        <div class="card-head"><span class="h">${esc(g.title)}</span>${pct >= 100 ? `<span class="badge good">${icon('check')} Done</span>` : `<span class="badge brand">${pct}%</span>`}</div>
        <div class="bar ${pct >= 100 ? 'green' : ''}"><i style="width:${pct}%"></i></div>
        <div class="split" style="align-items:center"><span class="muted num">${fmtNum(g.progress)} / ${fmtNum(g.target)} ${esc(g.unit || '')}</span>
          <span class="btn-row" style="flex:none;gap:8px"><button class="icon-btn sm" style="background:var(--subtle)" data-a="goal-step" data-id="${g.id}" data-d="-1" aria-label="Decrease">${icon('minus')}</button><button class="icon-btn sm" style="background:var(--brand-soft);color:var(--brand)" data-a="goal-step" data-id="${g.id}" data-d="1" aria-label="Increase">${icon('plus')}</button><button class="icon-btn sm" style="background:transparent" data-a="goal-menu" data-id="${g.id}" aria-label="Goal options">${icon('more')}</button></span></div>
      </section>`; }).join('') : emptyBlock('target', 'red', 'No goals yet', 'Set a target and nudge it forward as you go.')}
      <button class="btn btn-dashed" data-a="qa" data-k="goal" data-space="${s.id}">${icon('plus')} Add goal</button>`;
  },
  flights(s) { return eventsTab(s, 'flight'); },
  hotel(s) { return eventsTab(s, 'hotel'); },
  contacts(s) {
    const cs = db.contacts.filter(c => c.spaceId === s.id);
    return `<div class="card tight rows">${cs.length ? cs.map(c => `<div class="row clickable" data-a="contact" data-id="${c.id}" role="button" tabindex="0"><span class="avatar" style="width:40px;height:40px;font-size:14px">${esc(initials(c.name))}</span><span class="main"><span class="t">${esc(c.name)}</span><span class="m">${esc([c.role, c.phone].filter(Boolean).join(' · '))}</span></span>${chev()}</div>`).join('') : '<p class="muted" style="padding:16px 0">Save guides, hosts or anyone you need to reach.</p>'}</div>
      <button class="btn btn-dashed" data-a="add-contact" data-space="${s.id}">${icon('plus')} Add contact</button>`;
  },
};
function eventsTab(s, kind) {
  const evs = db.events.filter(e => e.spaceId === s.id && e.kind === kind).sort((a, b) => new Date(a.start) - new Date(b.start));
  const k = EVENT_KINDS[kind];
  return `<div class="card tight rows">${evs.length ? evs.map(e => { const d = new Date(e.start); return `<div class="row clickable" data-a="event" data-id="${e.id}" role="button" tabindex="0">${ic(k.icon, k.color)}<span class="main"><span class="t">${esc(e.title)}</span><span class="m">${e.allDay ? 'All day' : fmtTime(d) + (e.end ? ' - ' + fmtTime(new Date(e.end)) : '')}</span></span><span class="dbadge"><small>${MON[d.getMonth()]}</small><b>${d.getDate()}</b></span></div>`; }).join('') : `<p class="muted" style="padding:16px 0">No ${k.label.toLowerCase()} details yet.</p>`}</div>
    <button class="btn btn-dashed" data-a="add-event" data-space="${s.id}" data-kind="${kind}">${icon('plus')} Add ${k.label.toLowerCase()}</button>`;
}
const groupIcon = name => /shoe/i.test(name) ? 'footprints' : /cloth|wear/i.test(name) ? 'shirt' : /electr|tech/i.test(name) ? 'zap' : 'bag';
function expenseRow(e) {
  const c = CATS[e.category] || CATS.other, d = new Date(e.at);
  return `<div class="row clickable" data-a="expense" data-id="${e.id}" role="button" tabindex="0">${ic(c.icon, c.color)}<span class="main"><span class="t">${esc(e.title)}</span><span class="m">${fmtShort(d)}, ${fmtTime(d)}${e.location ? ' • ' + esc(e.location) : ''}</span></span><span class="end"><span class="a">${money(e.amount, e.currency)}</span></span>${chev()}</div>`;
}
function noteCard(n) {
  return `<button class="ncard" data-a="note" data-id="${n.id}">${n.cover ? `<span class="nc-art">${art(n.cover)}</span>` : ''}<span class="nc-b">${n.tag ? `<span class="tag">${esc(n.tag)}</span>` : ''}<span class="t">${esc(n.title)}</span><p>${esc(n.body)}</p>${n.checklist ? `<span class="badge neutral">${icon('list')} ${n.checklist.items.filter(i => i.done).length}/${n.checklist.items.length}</span>` : ''}</span></button>`;
}
function placeRow(p) {
  return `<div class="row clickable" data-a="place" data-id="${p.id}" role="button" tabindex="0">${thumb(p.art)}<span class="main"><span class="t">${esc(p.name)}</span><span class="m">${esc(p.cat)} • ${esc(p.area)}</span></span>
    <span class="end"><a class="dir" href="${placeOpenUrl(p)}" target="_blank" rel="noopener">${icon('map')}Directions</a><span class="s">${p.dist != null ? p.dist + ' km' : ''}</span></span></div>`;
}

/* ---------- Note detail (§8.7) ---------- */
screens.note = {
  render(p) {
    const n = db.notes.find(x => x.id === p.id);
    if (!n) return `<div class="pad">${topbar()}${emptyBlock('book', 'brand', 'Note not found', 'It may have been deleted.')}</div>`;
    const d = new Date(n.createdAt), s = spaceById(n.spaceId);
    const place = n.placeKey ? db.places.find(x => x.key === n.placeKey && (!n.spaceId || x.spaceId === n.spaceId)) || db.places.find(x => x.key === n.placeKey) : null;
    const cl = n.checklist;
    const clHtml = cl ? `<section class="card">
        <div class="grp-head">${ic('list', 'brand sq')}<span class="main"><span class="t">${esc(cl.title)}</span><span class="m">${cl.items.filter(i => i.done).length} of ${cl.items.length} completed</span></span></div>
        <div>${cl.items.map(it => `<button class="cl-item ${it.done ? 'done' : ''}" data-a="cl-toggle" data-id="${n.id}" data-item="${it.id}"><span class="cb ${it.done ? 'on' : ''}">${icon('check')}</span><span>${esc(it.text)}</span></button>`).join('')}</div>
        <form class="add-item" data-form="cl-add" data-id="${n.id}">${icon('plus')}<label class="sr" for="cl-new">New checklist item</label><input id="cl-new" placeholder="Add item" autocomplete="off" maxlength="120"></form>
      </section>` : `<button class="btn btn-dashed" data-a="cl-create" data-id="${n.id}">${icon('list')} Add checklist</button>`;
    const related = [];
    if (place) related.push(`<div class="row clickable" data-a="place" data-id="${place.id}" role="button" tabindex="0">${thumb(place.art, 'sm')}<span class="main"><span class="m">Linked Place</span><span class="t">${esc(place.name)}</span></span>${chev()}</div>`);
    if (s) related.push(`<div class="row clickable" data-a="space" data-id="${s.id}" role="button" tabindex="0">${spaceThumb(s)}<span class="main"><span class="m">In ${s.start ? 'Trip' : 'Space'}</span><span class="t">${esc(s.name)}</span></span>${chev()}</div>`);
    return `<div class="pad stack-lg">
      ${topbar({ right: `<button class="icon-btn" data-a="note-menu" data-id="${n.id}" aria-label="Note options">${icon('more')}</button>` })}
      ${n.cover ? `<div class="note-cover">${art(n.cover)}</div>` : ''}
      <h1 class="title">${esc(n.title)}</h1>
      <div class="meta-line">${n.tag ? `<span class="tag">${esc(n.tag)}</span> •` : ''} <span>${fmtLong(d)}</span> • <span>${fmtTime(d)}</span></div>
      <hr class="rule">
      ${n.body ? `<p class="body-text">${esc(n.body)}</p>` : ''}
      ${clHtml}
      ${related.length ? `<section>${secHead('Related')}<div class="card tight rows">${related.join('')}</div></section>` : ''}
    </div>`;
  },
};

/* ---------- Search (§8.12) ---------- */
const SEARCH_TYPES = [['spaces', 'Spaces'], ['expenses', 'Expenses'], ['notes', 'Notes'], ['reminders', 'Reminders'], ['places', 'Places'], ['items', 'List items']];
function searchAll(q) {
  q = q.trim().toLowerCase();
  const m = (...f) => !q || f.some(x => String(x || '').toLowerCase().includes(q));
  return {
    spaces: db.spaces.filter(s => m(s.name, s.desc)),
    expenses: db.expenses.filter(e => m(e.title, e.note, e.location, spaceName(e.spaceId), CATS[e.category]?.label)).sort((a, b) => new Date(b.at) - new Date(a.at)),
    notes: db.notes.filter(n => m(n.title, n.body, n.tag, spaceName(n.spaceId))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    reminders: db.reminders.filter(r => m(r.title, r.notes, spaceName(r.spaceId))).sort((a, b) => (a.done - b.done) || (new Date(a.at) - new Date(b.at))),
    places: db.places.filter(p => m(p.name, p.area, p.cat, p.type, spaceName(p.spaceId))),
    items: db.shopping.filter(i => m(i.name, i.store, i.area, i.group, spaceName(i.spaceId))).sort((a, b) => a.purchased - b.purchased),
  };
}
const RESULT_ROW = {
  spaces: s => `<div class="row clickable" data-a="search-open" data-type="spaces" data-id="${s.id}" role="button" tabindex="0">${spaceThumb(s)}<span class="main"><span class="t">${esc(s.name)}</span><span class="m">Space</span>${s.start ? `<span class="m">${esc(fmtRange(s.start, s.end))}</span>` : ''}</span>${chev()}</div>`,
  expenses: e => { const c = CATS[e.category] || CATS.other, d = new Date(e.at); return `<div class="row clickable" data-a="search-open" data-type="expenses" data-id="${e.id}" role="button" tabindex="0">${ic(c.icon, c.color + ' sq lg')}<span class="main"><span class="t">${esc(e.title)}</span><span class="m">${fmtShort(d)}, ${fmtTime(d)}${e.location ? ' • ' + esc(e.location) : ''}</span></span><span class="end"><span class="a">${money(e.amount, e.currency)}</span></span>${chev()}</div>`; },
  notes: n => `<div class="row clickable" data-a="search-open" data-type="notes" data-id="${n.id}" role="button" tabindex="0">${n.cover ? thumb(n.cover) : ic('book', 'purple sq lg')}<span class="main"><span class="t">${esc(n.title)}</span><span class="m">${esc(n.tag || 'Note')} • ${fmtLong(new Date(n.createdAt))}</span><span class="m">${esc(n.body)}</span></span>${chev()}</div>`,
  reminders: r => `<div class="row clickable" data-a="search-open" data-type="reminders" data-id="${r.id}" role="button" tabindex="0">${ic(r.icon || RTYPES[r.type].icon, RTYPES[r.type].color + ' sq lg')}<span class="main"><span class="t ${r.done ? 'done-t' : ''}">${esc(r.title)}</span><span class="m">${esc(spaceName(r.spaceId))} • ${relDay(new Date(r.at))} ${fmtTime(new Date(r.at))}</span></span>${chev()}</div>`,
  places: p => `<div class="row clickable" data-a="search-open" data-type="places" data-id="${p.id}" role="button" tabindex="0">${thumb(p.art)}<span class="main"><span class="t">${esc(p.name)}</span><span class="m">${esc(p.cat)} • ${esc(p.area)}</span></span>${chev()}</div>`,
  items: i => `<div class="row clickable" data-a="search-open" data-type="items" data-id="${i.id}" role="button" tabindex="0">${ic(groupIcon(i.group || ''), (i.purchased ? 'green' : 'blue') + ' sq lg')}<span class="main"><span class="t ${i.purchased ? 'done-t' : ''}">${esc(i.name)}</span><span class="m">${esc(spaceName(i.spaceId))}${i.store ? ' • ' + esc(i.store) : ''}</span></span><span class="end"><span class="a">${i.price ? money(i.price, spaceCur(spaceById(i.spaceId))) : '-'}</span></span>${chev()}</div>`,
};
function searchResults(p) {
  const q = p.q || '', f = p.filter || 'all';
  if (!q.trim() && f === 'all') {
    return `<div class="chips">${['all', 'expenses', 'notes', 'reminders', 'places'].map(k => `<button class="chip ${k === 'all' ? 'on' : ''}" data-a="search-filter" data-v="${k}">${k === 'all' ? 'All' : SEARCH_TYPES.find(t => t[0] === k)[1]}</button>`).join('')}</div>
      <section>${secHead('Recent Searches', db.recent.length ? '<button class="link" data-a="search-clear-recent">Clear</button>' : '')}
        <div class="card tight rows">${db.recent.length ? db.recent.map(r => `<button class="row" data-a="search-recent" data-q="${esc(r)}">${icon('search', 'chev')}<span class="main"><span class="t" style="font-weight:400">${esc(r)}</span></span></button>`).join('') : '<p class="muted" style="padding:16px 0">Your recent searches appear here.</p>'}</div></section>
      <section>${secHead('Popular Searches')}<div class="stack gap-sm">
        ${[['expenses', 'Expenses', 'Find your past expenses', 'banknote', 'green'], ['notes', 'Notes', 'Search through your notes', 'book', 'purple'], ['places', 'Places', 'Find saved places', 'pin', 'blue'], ['reminders', 'Reminders', 'Search your reminders', 'bell', 'orange']].map(([k, t, m, i, c]) => `<button class="frow" data-a="search-filter" data-v="${k}">${ic(i, c)}<span class="main"><span class="v">${t}</span><span class="k">${m}</span></span>${chev()}</button>`).join('')}
      </div></section>`;
  }
  const res = searchAll(q);
  const total = sum(SEARCH_TYPES.map(([k]) => res[k].length));
  const chips = `<div class="chips"><button class="chip ${f === 'all' ? 'on' : ''}" data-a="search-filter" data-v="all">All (${total})</button>${SEARCH_TYPES.filter(([k]) => res[k].length || f === k).map(([k, l]) => `<button class="chip ${f === k ? 'on' : ''}" data-a="search-filter" data-v="${k}">${l} (${res[k].length})</button>`).join('')}</div>`;
  const groups = SEARCH_TYPES.filter(([k]) => (f === 'all' || f === k) && res[k].length).map(([k, l]) => `<section>${secHead(`${l} (${res[k].length})`, f === 'all' && res[k].length > 3 ? seeAll(`data-a="search-filter" data-v="${k}"`) : '')}<div class="card tight rows">${res[k].slice(0, f === 'all' ? 3 : 60).map(RESULT_ROW[k]).join('')}</div></section>`).join('');
  return chips + (groups || emptyBlock('search', 'brand', 'No results', q ? `Nothing in MEO matches “${q}”. Try another word.` : 'Nothing saved here yet.'));
}
screens.search = {
  render(p) {
    return `<div class="pad stack-lg">
      <div class="page-head" style="align-items:center;justify-content:flex-start"><button class="icon-btn" data-a="back" aria-label="Back">${icon('chev-l')}</button><div class="ph-text"><h1 class="title" style="font-size:26px">Search</h1><p class="sub" style="margin-top:0">Find anything in MEO</p></div></div>
      <form class="search" data-form="search">${icon('search')}<label class="sr" for="search-q">Search</label><input id="search-q" class="input" type="search" placeholder="Search expenses, notes, reminders..." value="${esc(p.q || '')}" autocomplete="off" enterkeyhint="search">${p.q ? `<button type="button" class="clear" data-a="search-clear" aria-label="Clear search">${icon('x-circle')}</button>` : ''}</form>
      <div id="search-results" class="stack-lg">${searchResults(p)}</div>
    </div>`;
  },
};

/* ---------- Insights (§8.13) ---------- */
function niceStep(max) {
  const raw = max / 4, pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * pow) return m * pow;
  return 10 * pow;
}
function barChart(days, vals, cur) {
  const W = 320, H = 210, L = 34, T = 22, B = 26, plotH = H - T - B, max = Math.max(...vals, 1);
  const step = niceStep(max), top = Math.ceil(max / step) * step;
  const y = v => T + plotH - v / top * plotH;
  const bw = 20, gap = (W - L - 8 - bw * 7) / 6;
  let g = '';
  for (let v = 0; v <= top + 1e-9; v += step) g += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="ch-g"/><text x="${L - 8}" y="${y(v) + 3}" text-anchor="end" class="ch-t">${fmtNum(v)}</text>`;
  const bars = vals.map((v, i) => {
    const x = L + 4 + i * (bw + gap), h = Math.max(v / top * plotH, v > 0 ? 6 : 0);
    const isToday = dayDiff(days[i], new Date()) === 0;
    return `${h ? `<rect x="${x}" y="${T + plotH - h}" width="${bw}" height="${h}" rx="${bw / 2}" class="ch-bar ${isToday ? 'today' : ''}"/>` : ''}
      <text x="${x + bw / 2}" y="${T + plotH - h - 6}" text-anchor="middle" class="ch-v">${v ? (CUR[cur] || '') + fmtNum(v) : '0'}</text>
      <text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" class="ch-t">${DOW[days[i].getDay()]}</text>`;
  }).join('');
  return `<div class="chart" role="img" aria-label="Spending per day: ${vals.map((v, i) => `${DOW[days[i].getDay()]} ${money(v, cur)}`).join(', ')}"><svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--brand)"/><stop offset="1" style="stop-color:var(--brand-2)"/></linearGradient></defs>${g}${bars}</svg></div>`;
}
screens.insights = {
  tabs: true,
  render(p) {
    const per = p.per || 0, cur = defCur();
    const end = addDays(sod(new Date()), -7 * per);
    const days = Array.from({ length: 7 }, (_, i) => addDays(end, i - 6));
    const prev = days.map(d => addDays(d, -7));
    const spendDays = ds => ds.map(d => sum(db.expenses.filter(e => dayDiff(new Date(e.at), d) === 0).map(e => conv(e.amount, e.currency, cur))));
    const vals = spendDays(days), total = sum(vals), prevTotal = sum(spendDays(prev));
    const stepsOf = ds => sum(ds.map(d => db.health.steps[ymd(d)] || 0));
    const st = stepsOf(days), stPrev = stepsOf(prev);
    const inRange = iso => { const d = new Date(iso); return dayDiff(d, days[0]) >= 0 && dayDiff(d, end) <= 0; };
    const rs = db.reminders.filter(r => inRange(r.at) && new Date(r.at) <= new Date());
    const rDone = rs.filter(r => r.done).length;
    const gDone = db.goals.filter(g => g.progress >= g.target).length;
    const pctOf = (a, b) => b ? Math.round(a / b * 100) : 0;
    const catTotals = {};
    db.expenses.filter(e => inRange(e.at)).forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + conv(e.amount, e.currency, cur); });
    const cats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const showAllCats = !!p.allCats;
    const label = per === 0 ? 'Last 7 days' : 'Previous 7 days';
    // Smart insights
    const ins = [];
    if (total > 0) { const i = vals.indexOf(Math.max(...vals)); ins.push(['zap', 'orange', `${DOW_FULL[days[i].getDay()]} was your biggest spending day at ${money(vals[i], cur)}.`]); }
    if (cats.length) ins.push(['utensils', 'blue', `${(CATS[cats[0][0]] || CATS.other).long} made up ${pctOf(cats[0][1], total)}% of your spending.`]);
    if (stPrev) ins.push(['activity', 'green', `You walked ${Math.abs(Math.round((st - stPrev) / stPrev * 100))}% ${st >= stPrev ? 'more' : 'less'} than the week before.`]);
    if (rs.length) ins.push(['check-circle', 'brand', `${rDone} of ${rs.length} reminders done${rs.length - rDone ? `, ${rs.length - rDone} missed` : ''}.`]);
    db.spaces.filter(s => s.budget && s.start && dayDiff(parseYmd(s.end || s.start), new Date()) >= 0).forEach(s => ins.push(['plane', 'purple', `${s.name} ${spaceStatus(s).toLowerCase()}. You've used ${pctOf(spaceSpent(s), s.budget)}% of its budget.`]));
    return `<div class="pad stack-lg">
      ${pageHead('Insights', 'Understand your everyday life.', `<button class="pill-btn outline" style="color:var(--text)" data-a="period">${icon('calendar')} ${label} ${icon('chev-d')}</button>`)}
      <section class="card">
        <div class="sec-head" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>Your Week at a Glance</h2><span class="muted" style="font-size:13px">${fmtLong(days[0])} - ${fmtLong(end)}</span></div>
        <div class="tiles">
          <div class="tile"><span class="tl"><span class="k">Spending</span><span class="v">${money(total, cur)}</span>${prevTotal ? trendBadge((total - prevTotal) / prevTotal * 100, { goodWhenDown: true, suffix: total <= prevTotal ? ' less' : ' more' }) : ''}</span>${ic('card', 'green plain')}</div>
          <div class="tile"><span class="tl"><span class="k">Steps</span><span class="v">${fmtNum(st)}</span>${stPrev ? trendBadge((st - stPrev) / stPrev * 100, { suffix: st >= stPrev ? ' more' : ' less' }) : ''}</span>${ring(pctOf(st, (db.health.goal || 10000) * 7))}</div>
          <div class="tile"><span class="tl"><span class="k">Tasks Done</span><span class="v">${rDone} / ${rs.length}</span><span class="badge good">${icon('trophy')} ${pctOf(rDone, rs.length)}%</span></span>${ic('list', 'purple plain')}</div>
          <div class="tile"><span class="tl"><span class="k">Goals</span><span class="v">${gDone} / ${db.goals.length}</span><span class="badge good">${icon('flame')} ${pctOf(gDone, db.goals.length)}%</span></span>${ic('check-circle', 'brand plain')}</div>
        </div>
      </section>
      <section class="card">
        <div class="sec-head" style="flex-direction:column;align-items:flex-start;gap:2px"><h2>Spending Overview</h2><span class="muted" style="font-size:13px">Your spending over the ${per === 0 ? 'last' : 'previous'} 7 days, in ${CUR_NAME[cur]}.</span></div>
        ${barChart(days, vals, cur)}
      </section>
      <section class="card">
        ${secHead('Top Categories', cats.length > 3 ? `<button class="link" data-a="toggle-cats">${showAllCats ? 'Show less' : 'See all'} ${icon(showAllCats ? 'chev-d' : 'chev-r')}</button>` : '')}
        <div class="rows">${cats.length ? cats.slice(0, showAllCats ? 20 : 3).map(([k, v]) => { const c = CATS[k] || CATS.other; return `<div class="row">${ic(c.icon, c.color + ' lg')}<span class="main"><span class="t">${c.long}</span><span class="m">${pctOf(v, total)}%</span></span><span class="end"><span class="a">${money(v, cur)}</span></span></div>`; }).join('') : '<p class="muted">No spending in this period.</p>'}</div>
      </section>
      <section class="card">
        ${secHead('Smart Insights')}
        <div class="ins-list">${ins.length ? ins.map(([i, c, t]) => `<div class="ins">${ic(i, c + ' sm')}<span>${esc(t)}</span></div>`).join('') : '<p class="muted">Insights appear once you add some activity.</p>'}</div>
        ${db.health.sample ? '<p class="note" style="margin-top:12px">Step counts are sample data. MEO would read them from Apple Health or Health Connect.</p>' : ''}
      </section>
    </div>`;
  },
};

/* ---------- Profile (§8.14) ---------- */
screens.profile = {
  tabs: true,
  render() {
    const u = db.user, pr = u.prefs;
    const done = db.reminders.filter(r => r.done).length + db.shopping.filter(i => i.purchased).length + sum(db.notes.map(n => n.checklist ? n.checklist.items.filter(i => i.done).length : 0));
    const setRow = (i, t, v, a) => `<button class="set-row" data-a="${a}">${icon(i)}<span class="t">${t}</span>${v ? `<span class="v">${esc(v)}</span>` : ''}${chev()}</button>`;
    return `<div class="pad stack-lg">
      ${pageHead('Profile', '')}
      <div class="profile-head"><div class="avatar lg" aria-hidden="true">${esc(initials(u.name))}</div><div><div class="name">${esc(u.name)}</div><div class="role">${esc(u.title || 'Add your role')}</div><button class="pill-btn" data-a="edit-profile">${icon('pencil')} Edit Profile</button></div></div>
      <section class="card stats">
        <button class="stat" data-a="tab" data-to="spaces">${ic('layers', 'brand')}<b>${db.spaces.length}</b><span>Spaces</span></button>
        <div class="stat">${ic('check-circle', 'green')}<b>${done}</b><span>Done</span></div>
        <button class="stat" data-a="go" data-to="search" data-filter="places">${ic('pin', 'purple')}<b>${db.places.length}</b><span>Places</span></button>
        <button class="stat" data-a="go" data-to="search" data-filter="notes">${ic('book', 'blue')}<b>${db.notes.length}</b><span>Notes</span></button>
      </section>
      <h2 class="sec-label">Preferences</h2>
      <section class="card tight">
        ${setRow('languages', 'Language', pr.language, 'set-language')}
        ${setRow('banknote', 'Default Currency', `${pr.currency} (${CUR[pr.currency]})`, 'set-currency')}
        ${setRow('bell', 'Notifications', pr.notifications ? 'On' : 'Off', 'set-notifications')}
        ${setRow('palette', 'Appearance', pr.appearance[0].toUpperCase() + pr.appearance.slice(1), 'set-appearance')}
      </section>
      <h2 class="sec-label">Account</h2>
      <section class="card tight">
        ${setRow('user', 'Account Information', '', 'edit-profile')}
        ${setRow('shield', 'Privacy', '', 'set-privacy')}
        ${setRow('cloud', 'Backup & Sync', '', 'set-backup')}
      </section>
      <p class="note" style="text-align:center">MEO · My Everyday OS</p>
    </div>`;
  },
};

/* ---------- Add Expense (§8.9) ---------- */
function newExpenseDraft(spaceId) {
  const s = spaceById(spaceId) || null;
  return { amount: '', category: 'food', spaceId: s ? s.id : '', at: new Date().toISOString(), payment: (db.payments[0] || {}).id || 'credit', note: '', receipt: '' };
}
screens.addExpense = {
  render(p) {
    const d = p.d, s = spaceById(d.spaceId), cur = spaceCur(s), pm = payById(d.payment);
    return `<div class="pad stack">
      ${topbar({ title: 'Add Expense', center: true })}
      <label class="card amount-card" for="exp-amount"><span class="k">Expense amount</span><span class="amount-in"><span>${CUR[cur]}</span><input id="exp-amount" inputmode="decimal" placeholder="0" value="${esc(d.amount)}" data-bind="amount" data-live="1" autocomplete="off" aria-label="Amount in ${CUR_NAME[cur]}"></span></label>
      <div class="field"><span class="label">Category</span><div class="chips">${Object.entries(CATS).map(([k, c]) => `<button class="chip ${d.category === k ? 'on orange' : ''}" data-a="set-draft" data-k="category" data-v="${k}">${icon(c.icon)}${c.label}</button>`).join('')}</div></div>
      ${frow('layers', 'brand', 'Add to a Space', s ? s.name : 'No space', 'pick-space')}
      ${frow('calendar', 'brand', 'Date & Time', fmtWhen(d.at), 'pick-date')}
      ${frow(pm.icon, pm.color, 'Payment Method', pm.label, 'pick-pay')}
      <div class="card field"><label class="label" for="exp-note"><span>Note <span class="optional">(optional)</span></span> ${counter('exp-note-c', d.note.length, 200)}</label><textarea id="exp-note" class="textarea" maxlength="200" data-bind="note" data-count="exp-note-c" data-max="200" placeholder="Dinner near Shibuya">${esc(d.note)}</textarea></div>
      <label class="btn btn-dashed" for="exp-receipt">${icon('paperclip')} ${d.receipt ? esc(d.receipt) : 'Add Receipt'}<input type="file" id="exp-receipt" accept="image/*,application/pdf" hidden data-file="receipt"></label>
    </div>`;
  },
  footer(p) { return `<button class="btn btn-primary" data-a="save-expense" ${parseAmount(p.d.amount) > 0 ? '' : 'disabled'}>Add Expense</button>`; },
};
screens.expenseDone = {
  render(p) {
    const e = db.expenses.find(x => x.id === p.id); if (!e) return '';
    const s = spaceById(e.spaceId), c = CATS[e.category] || CATS.other, pm = payById(e.payment);
    return `<div class="pad stack-lg"><div class="success">${illo('wallet', { tone: 'brand' })}<h1 class="title">Expense added!</h1><p class="sub">${money(e.amount, e.currency)} has been added to ${esc(s ? s.name : 'your expenses')}.</p></div>
      <section class="card sum-list">
        <div class="sum-row">${ic(c.icon, c.color)}<span class="main"><span class="v">${money(e.amount, e.currency)}</span><span class="k">${esc(e.title)}</span></span></div>
        <div class="sum-row">${ic('layers', 'brand')}<span class="main"><span class="v">${esc(s ? s.name : 'No space')}</span><span class="k">${esc(fmtWhen(e.at))}</span></span></div>
        <div class="sum-row">${ic(pm.icon, pm.color)}<span class="main"><span class="v">${esc(pm.label)}</span><span class="k">Payment Method</span></span></div>
        ${s ? `<div class="center-link"><button class="link" data-a="space" data-id="${s.id}" data-tab="expenses" data-reset="1">View in ${esc(s.name)} ${icon('chev-r')}</button></div>` : ''}
      </section></div>`;
  },
  footer(p) {
    const e = db.expenses.find(x => x.id === p.id), s = e && spaceById(e.spaceId);
    return `<button class="btn btn-primary" data-a="expense-again" data-space="${s ? s.id : ''}">Add Another</button>${s ? `<button class="btn btn-secondary" data-a="space" data-id="${s.id}" data-tab="expenses" data-reset="1">Back to ${esc(s.name)}</button>` : `<button class="btn btn-secondary" data-a="tab" data-to="today">Back to Today</button>`}`;
  },
};

/* ---------- Add Reminder (§8.10) ---------- */
function newReminderDraft(spaceId) {
  const now = new Date();
  const sid = spaceById(spaceId) ? spaceId : (spaceById('personal') ? 'personal' : (db.spaces[0] || {}).id || '');
  const t = now.getHours() < 19 ? '19:30' : `${pad2(Math.min(23, now.getHours() + 1))}:00`;
  return { step: 1, type: 'general', title: '', notes: '', calSel: ymd(now), calView: ym(now), time: t, repeat: 'none', days: [], spaceId: sid, editId: null, icon: null };
}
const reminderWhen = d => combine(d.calSel, d.time);
screens.addReminder = {
  back(p) { if (p.d.step > 1 && !p.d.jump) { p.d.step--; render({ scroll: 0 }); return true; } return false; },
  render(p) {
    const d = p.d, step = d.step;
    const head = (t, s) => `<div><h1 class="title">${t}</h1><p class="sub">${s}</p></div>`;
    let body = '';
    if (step === 1) {
      body = `${head(d.editId ? 'Edit Reminder' : 'Add Reminder', 'What do you want to be reminded about?')}
        <div class="type-grid">${Object.entries(RTYPES).map(([k, t]) => `<button class="type-opt ${d.type === k ? 'on' : ''}" data-a="set-draft" data-k="type" data-v="${k}">${ic(t.icon, t.color)}${t.label}</button>`).join('')}</div>
        <div class="field"><label class="label" for="rem-title">Title ${counter('rem-title-c', d.title.length, 60)}</label><input id="rem-title" class="input" maxlength="60" placeholder="Pay electricity bill" value="${esc(d.title)}" data-bind="title" data-count="rem-title-c" data-max="60" data-live="1" autocomplete="off"></div>
        <div class="field"><label class="label" for="rem-notes"><span>Notes <span class="optional">(Optional)</span></span> ${counter('rem-notes-c', d.notes.length, 200)}</label><textarea id="rem-notes" class="textarea" maxlength="200" placeholder="Add a note..." data-bind="notes" data-count="rem-notes-c" data-max="200">${esc(d.notes)}</textarea></div>
        ${d.editId ? '' : `<section>${secHead('Suggested')}<div class="stack gap-sm">${SUGGESTED.map(([t, ty, i], n) => `<button class="frow" style="padding:12px 14px" data-a="rem-suggest" data-n="${n}">${icon(i)}<span class="main"><span class="v" style="font-size:14px">${esc(t)}</span></span><span class="ic sm brand">${icon('plus')}</span></button>`).join('')}</div></section>`}`;
    } else if (step === 2) {
      const when = new Date(reminderWhen(d)), past = when < new Date();
      body = `${head('Date & Time', 'When do you want to be reminded?')}
        <section class="card stack">
          ${calendar(d.calSel, d.calView, 'screen', ymd(new Date()))}
          <label class="time-row" for="rem-time">Time <input id="rem-time" type="time" value="${d.time}" data-bind="time" data-rerender="1"></label>
          <div class="field"><span class="label" style="font-weight:400;color:var(--text-2)">Quick options</span><div class="tchips">${['08:00', '09:00', '12:00', '19:30', '20:00'].map(t => `<button class="tchip ${d.time === t ? 'on' : ''}" data-a="set-draft" data-k="time" data-v="${t}">${t}</button>`).join('')}</div></div>
        </section>
        <div class="info-box ${past ? 'warn' : ''}">${ic(past ? 'info' : 'check-circle', (past ? 'red' : 'brand') + ' sm')}<span><span class="k">${past ? 'This time has already passed' : "You'll be reminded on"}</span><br><span class="v">${DOW[when.getDay()]}, ${fmtLong(when)} at ${fmtTime(when)}</span></span></div>`;
    } else if (step === 3) {
      body = `${head('Repeat', 'Do you want to repeat this reminder?')}
        <div class="opt-list">${Object.entries(REPEATS).map(([k, r]) => `<button class="opt ${d.repeat === k ? 'on' : ''}" data-a="set-draft" data-k="repeat" data-v="${k}">${ic(r.icon, 'brand sm')}<span class="main"><span class="t">${r.label}</span><span class="m">${r.sub}</span></span><span class="radio ${d.repeat === k ? 'on' : ''}">${icon('check')}</span></button>`).join('')}</div>
        ${d.repeat === 'custom' ? `<div class="field"><span class="label">Repeat on</span><div class="tchips">${WEEKDAYS.map(([v, l]) => `<button class="tchip ${d.days.includes(v) ? 'on' : ''}" data-a="rem-day" data-v="${v}">${l}</button>`).join('')}</div></div>` : ''}`;
    } else {
      body = `${head('Select Space', 'Which space should this reminder belong to?')}
        <div class="opt-list">${db.spaces.map(s => `<button class="opt ${d.spaceId === s.id ? 'on' : ''}" data-a="set-draft" data-k="spaceId" data-v="${s.id}">${ic(s.icon, s.color + ' sm')}<span class="main"><span class="t">${esc(s.name)}</span><span class="m">${esc(s.start ? fmtRange(s.start, s.end) : (s.desc || TEMPLATES[s.template]?.desc || ''))}</span></span><span class="radio ${d.spaceId === s.id ? 'on' : ''}">${icon('check')}</span></button>`).join('')}
          <button class="opt" data-a="new-space">${ic('more', 'gray sm')}<span class="main"><span class="t">Custom Space</span><span class="m">Create a new space for this reminder</span></span>${chev()}</button></div>`;
    }
    return `<div class="pad stack-lg">${topbar({ step, steps: 4 })}${body}</div>`;
  },
  footer(p) {
    const d = p.d;
    if (d.jump) return `<button class="btn btn-primary" data-a="save-reminder" ${d.title.trim() && !(d.step === 3 && d.repeat === 'custom' && !d.days.length) ? '' : 'disabled'}>Save Changes</button>`;
    if (d.step === 1) return `<button class="btn btn-primary" data-a="wiz-next" ${d.title.trim() ? '' : 'disabled'}>Next</button>`;
    if (d.step === 2) return `<button class="btn btn-primary" data-a="wiz-next" ${new Date(reminderWhen(d)) < new Date() ? 'disabled' : ''}>Next</button>`;
    if (d.step === 3) return `<button class="btn btn-primary" data-a="wiz-next" ${d.repeat === 'custom' && !d.days.length ? 'disabled' : ''}>Next</button>`;
    return `<button class="btn btn-primary" data-a="save-reminder" ${d.spaceId ? '' : 'disabled'}>${d.editId ? 'Save Changes' : 'Create Reminder'}</button>`;
  },
};
screens.reminderDone = {
  render(p) {
    const r = db.reminders.find(x => x.id === p.id); if (!r) return '';
    const d = new Date(r.at), s = spaceById(r.spaceId), t = RTYPES[r.type];
    const row = (i, c, k, v, step, act = 'Edit') => `<div class="sum-row">${ic(i, c)}<span class="main"><span class="k">${k}</span><span class="v">${esc(v)}</span></span><button class="edit" data-a="rem-edit" data-id="${r.id}" data-step="${step}">${act}</button></div>`;
    return `<div class="pad stack-lg"><div class="success">${illo('bell', { tone: 'brand' })}<h1 class="title">Reminder Added!</h1><p class="sub">You'll be notified at the right time.</p></div>
      <section class="card sum-list">
        <div class="sum-row">${ic(t.icon, t.color)}<span class="main"><span class="v">${esc(r.title)}</span><span class="k">${t.label} • ${esc(s ? s.name : 'No space')}</span></span></div>
        ${row('calendar', 'brand', 'Date', `${DOW[d.getDay()]}, ${fmtLong(d)}`, 2)}
        ${row('clock', 'brand', 'Time', fmtTime(d), 2)}
        ${row(REPEATS[r.repeat].icon, 'brand', 'Repeat', r.repeat === 'custom' ? WEEKDAYS.filter(([v]) => r.days.includes(v)).map(x => x[1]).join(', ') : REPEATS[r.repeat].label, 3)}
        ${row(s ? s.icon : 'layers', 'brand', 'Space', s ? s.name : 'No space', 4)}
        ${row('book', 'brand', 'Notes', r.notes || 'No notes', 1, r.notes ? 'Edit' : 'Add')}
        <div class="center-link"><button class="link" data-a="qa" data-k="reminder" data-space="${r.spaceId}" data-replace="1">Add Another Reminder ${icon('chev-r')}</button></div>
      </section></div>`;
  },
  footer() { return '<button class="btn btn-primary" data-a="tab" data-to="today">Done</button>'; },
};

/* ---------- Create Space (§8.8) ---------- */
function newSpaceDraft() {
  return { step: 1, template: 'travel', name: '', cover: 'fuji', coverImg: null, icon: 'plane', color: 'brand', start: '', end: '', currency: defCur(), budget: '', modules: [...TEMPLATES.travel.modules], editId: null };
}
function draftFromSpace(s, step) {
  return { step, template: s.template, name: s.name, cover: s.cover, coverImg: s.coverImg || null, icon: s.icon, color: s.color, start: s.start || '', end: s.end || '', currency: s.currency || defCur(), budget: s.budget ? String(s.budget) : '', modules: [...s.modules], editId: s.id, desc: s.desc };
}
screens.createSpace = {
  back(p) { if (p.d.step > (p.d.editId ? 2 : 1)) { p.d.step--; render({ scroll: 0 }); return true; } return false; },
  render(p) {
    const d = p.d, t = TEMPLATES[d.template];
    const tmplSummary = `<div class="summary-chip">${illo(t.icon, { tone: t.tone, check: false, size: 'xs' })}<span class="main"><span class="t">${t.label}</span><span class="m">${t.desc}</span></span>${d.editId ? '' : '<button class="pill-btn outline" data-a="wiz-goto" data-step="1">Change</button>'}</div>`;
    let body = '';
    if (d.step === 1) {
      const card = (k, wide = false) => { const x = TEMPLATES[k]; return `<button class="tmpl ${wide ? 'wide' : ''} ${d.template === k ? 'on' : ''}" data-a="pick-template" data-v="${k}">${wide ? '' : illo(x.icon, { tone: x.tone, check: false, size: 'sm' })}<span class="stack gap-sm" style="gap:4px"><span class="tt"><span class="radio ${d.template === k ? 'on' : ''}">${icon('check')}</span>${x.label}</span><span class="m">${x.desc}</span></span>${wide ? illo(x.icon, { tone: x.tone, check: false, size: 'xs' }) : ''}</button>`; };
      body = `<div><h1 class="title">Create a Space</h1><p class="sub">Choose a starting point. You can customize everything later.</p></div>
        <div class="tmpl-grid">${card('scratch', true)}${card('travel')}${card('fitness')}${card('study')}${card('project')}</div>`;
    } else if (d.step === 2) {
      body = `<div><h1 class="title">${d.editId ? 'Edit your Space' : 'Set up your Space'}</h1><p class="sub">Give your Space a name and customize the details.</p></div>
        ${tmplSummary}
        <section class="card stack-lg">
          <div class="field"><label class="label" for="sp-name">Space name ${counter('sp-name-c', d.name.length, 40)}</label><input id="sp-name" class="input" maxlength="40" placeholder="${d.template === 'travel' ? 'Tokyo Trip' : 'My space'}" value="${esc(d.name)}" data-bind="name" data-count="sp-name-c" data-max="40" data-live="1" autocomplete="off"></div>
          <div class="field"><span class="label">Cover</span><div class="covers">
            ${['fuji', 'neon', 'temple'].map(k => `<button class="cover-opt ${d.cover === k && !d.coverImg ? 'on' : ''}" data-a="pick-cover" data-v="${k}" aria-label="Cover ${k}">${art(k)}${d.cover === k && !d.coverImg ? `<span class="badge-on">${icon('check')}</span>` : ''}</button>`).join('')}
            <label class="cover-opt ${d.coverImg ? 'on' : ''}" for="sp-cover-file">${d.coverImg ? `<div class="art" style="background-image:url('${d.coverImg}')"></div><span class="badge-on">${icon('check')}</span>` : `<span class="up">${icon('image')}Upload</span>`}<input type="file" id="sp-cover-file" accept="image/*" hidden data-file="cover"></label>
          </div><span class="hint">Tap a selected cover again to remove it.</span></div>
          <div class="field"><span class="label">Icon</span><div class="icons-grid">${SPACE_ICONS.map(i => `<button class="icon-opt ${d.icon === i ? 'on' : ''}" data-a="set-draft" data-k="icon" data-v="${i}" aria-label="${i}">${icon(i)}</button>`).join('')}</div></div>
          <div class="field"><span class="label">Color</span><div class="swatches">${COLORS.map(c => `<button class="sw ${c} ${d.color === c ? 'on' : ''}" data-a="set-draft" data-k="color" data-v="${c}" aria-label="${c}">${icon('check')}</button>`).join('')}</div></div>
          <div class="field"><span class="label">Date range <span class="optional">(optional)</span></span><div class="two"><label class="sr" for="sp-start">Start date</label><input id="sp-start" type="date" class="input" value="${d.start}" data-bind="start" data-rerender="1"><label class="sr" for="sp-end">End date</label><input id="sp-end" type="date" class="input" value="${d.end}" min="${d.start}" data-bind="end" data-rerender="1"></div>${d.start && d.end && d.end < d.start ? '<span class="error">End date must be on or after the start date.</span>' : ''}</div>
          <div class="two"><div class="field"><label class="label" for="sp-cur">Currency</label><select id="sp-cur" class="input" data-bind="currency" data-rerender="1">${Object.keys(CUR).map(c => `<option value="${c}" ${d.currency === c ? 'selected' : ''}>${c} (${CUR[c]})</option>`).join('')}</select></div>
          <div class="field"><label class="label" for="sp-budget">Budget <span class="optional">(optional)</span></label><input id="sp-budget" class="input" inputmode="decimal" placeholder="${CUR[d.currency]}0" value="${esc(d.budget)}" data-bind="budget" autocomplete="off"></div></div>
        </section>`;
    } else {
      const rec = t.modules;
      body = `<div><h1 class="title">Choose Modules</h1><p class="sub">Add the tools you want in this Space. Change later.</p></div>
        ${tmplSummary}
        <div><h2 style="font-size:17px;font-weight:600">Recommended for ${t.label === 'Start from scratch' ? 'you' : t.label}</h2><p class="sub">These modules are pre-selected for you.</p></div>
        <div class="mod-grid">${MOD_ORDER.map(m => { const x = MODULES[m], on = d.modules.includes(m); return `<button class="modc ${on ? 'on' : ''}" data-a="toggle-module" data-v="${m}" aria-pressed="${on}">${illo(x.icon, { tone: rec.includes(m) ? 'brand' : x.tone, check: false, size: 'xs' })}<span class="main"><span class="t"><span class="radio ${on ? 'on' : ''}">${icon('check')}</span>${x.label}</span><span class="m">${x.desc}</span></span></button>`; }).join('')}</div>`;
    }
    return `<div class="pad stack-lg">${topbar({ step: d.step, steps: 3 })}${body}</div>`;
  },
  footer(p) {
    const d = p.d;
    if (d.step === 1) return '<button class="btn btn-primary" data-a="wiz-next">Continue</button>';
    if (d.step === 2) return `<button class="btn btn-primary" data-a="wiz-next" ${d.name.trim() && !(d.start && d.end && d.end < d.start) ? '' : 'disabled'}>Continue</button>`;
    return `<button class="btn btn-primary" data-a="save-space" ${d.modules.length ? '' : 'disabled'}>${d.editId ? 'Save Changes' : 'Create Space'}</button>`;
  },
};
screens.spaceDone = {
  render(p) {
    const s = spaceById(p.id); if (!s) return '';
    const t = TEMPLATES[s.template];
    return `<div class="pad stack-lg"><div class="success">${illo(t.icon === 'plus' ? s.icon : t.icon, { tone: t.tone })}<h1 class="title">Your space is ready!</h1><p class="sub">${esc(s.name)} has been created. Start adding your plans, notes and more.</p></div>
      <button class="btn btn-primary" data-a="space" data-id="${s.id}" data-reset="1">Open ${esc(s.name)}</button>
      <section class="card stack">
        <div class="summary-chip" style="padding:0">${spaceThumb(s, '')}<span class="main"><span class="t">${esc(s.name)}</span><span class="m">${esc(s.start ? fmtRange(s.start, s.end) : t.label)}</span></span><button class="icon-btn sm" style="background:var(--subtle)" data-a="space-menu" data-id="${s.id}" aria-label="Space options">${icon('more')}</button></div>
        <h2 style="font-size:15px;font-weight:500">Active modules</h2>
        <div class="mod-grid">${s.modules.map(m => `<div class="modc">${illo(MODULES[m].icon, { tone: 'brand', check: false, size: 'xs' })}<span class="main"><span class="t">${MODULES[m].label}</span><span class="m">${MODULES[m].desc}</span></span></div>`).join('')}</div>
      </section></div>`;
  },
  footer() { return '<button class="btn btn-secondary" data-a="tab" data-to="today">Back to Today</button>'; },
};

/* ---------- Add Place (§8.11) ---------- */
function newPlaceDraft(spaceId) {
  const s = spaceById(spaceId) || db.spaces.find(x => x.modules.includes('places')) || db.spaces.find(x => x.template === 'travel') || db.spaces[0];
  return { step: 1, q: '', cat: 'all', key: null, spaceId: s ? s.id : '', desc: '', note: '', status: 'want', near: false };
}
const isSaved = (key, spaceId) => db.places.some(p => p.key === key && p.spaceId === spaceId);
function placeResults(d) {
  const q = d.q.trim().toLowerCase();
  const inCat = c => d.cat === 'all' || c.cat === d.cat;
  const nearby = [...CATALOG].filter(inCat).sort((a, b) => a.dist - b.dist);
  const matches = CATALOG.filter(c => inCat(c) && (!q || [c.name, c.area, c.type].some(x => x.toLowerCase().includes(q))));
  const card = c => { const saved = isSaved(c.key, d.spaceId); return `<button class="pcard" data-a="pick-place" data-key="${c.key}"><span class="pa">${art(c.art, !PHOTOS[c.art])}</span><span class="pb"><span class="t">${esc(c.name)}</span><span class="d">${icon('pin')}${c.dist < 1 ? Math.round(c.dist * 1000) + ' m' : c.dist + ' km'}</span><span class="pf"><span class="tag ${c.cat === 'Food' ? 'orange' : ''}">${esc(c.type)}</span>${saved ? '<span class="tag green">Saved</span>' : `<span class="plus-dot">${icon('plus')}</span>`}</span></span></button>`; };
  const row = c => `<button class="row" data-a="pick-place" data-key="${c.key}">${thumb(c.art, 'sm')}<span class="main"><span class="t">${esc(c.name)}</span><span class="m">${esc(c.cat)} • ${c.dist} km${isSaved(c.key, d.spaceId) ? ' • Saved' : ''}</span></span>${chev()}</button>`;
  if (q) return `<section>${secHead(`Results (${matches.length})`)}<div class="card tight rows">${matches.length ? matches.map(row).join('') : '<p class="muted" style="padding:16px 0">No places match. Try a neighborhood like Asakusa or Shibuya.</p>'}</div></section>`;
  return `<section>${secHead(d.near ? 'Near you' : 'Nearby Places')}<div class="hscroll">${nearby.slice(0, 6).map(card).join('')}</div></section>
    <section>${secHead('Suggested Results')}<div class="card tight rows">${nearby.slice(6).map(row).join('') || '<p class="muted" style="padding:16px 0">No more suggestions.</p>'}</div></section>`;
}
screens.addPlace = {
  flush: false,
  back(p) { if (p.d.step > 1) { p.d.step--; render({ scroll: 0 }); return true; } return false; },
  render(p) {
    const d = p.d, c = d.key ? catByKey(d.key) : null, s = spaceById(d.spaceId);
    if (d.step === 1) {
      return `<div class="pad stack-lg">${topbar({ step: 1, steps: 3 })}
        <div><h1 class="title">Add Place</h1><p class="sub">Search for a place or choose from nearby spots.</p></div>
        <label class="search">${icon('search')}<span class="sr">Search places</span><input id="place-q" class="input" placeholder="Search places, cafes, attractions…" value="${esc(d.q)}" autocomplete="off"></label>
        <div class="chips">${PLACE_CATS.map(([k, l]) => `<button class="chip ${d.cat === k ? 'on' : ''}" data-a="place-cat" data-v="${k}">${l}</button>`).join('')}</div>
        <div id="place-results" class="stack-lg">${placeResults(d)}</div>
        <p class="note">Showing sample places around Tokyo.</p>
      </div>`;
    }
    if (d.step === 2 && c) {
      return `<div class="place-hero">${art(c.art)}
          <div class="hero-top"><button class="icon-btn glass" data-a="back" aria-label="Back">${icon('chev-l')}</button><div class="step-ind">2 of 3 <span class="dots"><i class="on"></i><i class="on"></i><i></i></span></div></div>
          <div class="hero-info"><h1>${esc(c.name)}</h1><div class="dates">${esc(c.type)} • ${esc(c.sub)}</div><div class="tags">${c.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>
        </div>
        <div class="hero-body pad stack-lg">
          ${frow('building', 'brand', 'Category', c.type, 'noop')}
          <div class="field"><label class="label" for="pl-desc"><span>Description <span class="optional">(Optional)</span></span> ${counter('pl-desc-c', d.desc.length, 300)}</label><textarea id="pl-desc" class="textarea" maxlength="300" data-bind="desc" data-count="pl-desc-c" data-max="300">${esc(d.desc)}</textarea></div>
          <section class="card stack">
            <div style="position:relative">${mapCard([c], { height: 150, focus: true })}<a class="open-maps" style="position:absolute;right:10px;bottom:10px;z-index:2" href="${placeOpenUrl(c)}" target="_blank" rel="noopener">${icon('external')} Open in Maps</a></div>
            <div class="rows">
              <div class="row">${ic('pin', 'brand')}<span class="main"><span class="t">Address</span><span class="m" style="white-space:normal">${esc(c.address)}</span></span></div>
              <div class="row">${ic('clock', 'brand')}<span class="main"><span class="t">Hours <span class="optional" style="font-weight:400">(Optional)</span></span><span class="m">${esc(c.hours || 'Not listed')}</span></span></div>
              <div class="row">${ic('link', 'brand')}<span class="main"><span class="t">Website <span class="optional" style="font-weight:400">(Optional)</span></span>${c.website ? `<a class="m" style="color:var(--brand)" href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website)}</a>` : '<span class="m">Not listed</span>'}</span></div>
            </div>
          </section>
        </div>`;
    }
    return `<div class="pad stack-lg">${topbar({ step: 3, steps: 3 })}
      <div><h1 class="title">Add to ${esc(s ? s.name : 'a Space')}</h1><p class="sub">Add a few details before saving.</p></div>
      <div class="field"><span class="label">Adding to</span>${s ? `<button class="frow" data-a="pick-space">${spaceThumb(s)}<span class="main"><span class="v">${esc(s.name)}</span><span class="k">${esc(s.start ? fmtRange(s.start, s.end) : spaceSummary(s))}</span></span>${chev()}</button>` : frow('layers', 'brand', 'Space', 'Choose a space', 'pick-space')}</div>
      ${c ? `<div class="field"><span class="label">Place Preview</span><button class="frow" data-a="wiz-goto" data-step="2">${thumb(c.art, 'sm')}<span class="main"><span class="v">${esc(c.name)}</span><span class="k">${esc(c.type)} • ${esc(c.area)}, Tokyo</span></span>${chev()}</button></div>` : ''}
      ${s && c && isSaved(c.key, s.id) ? '<div class="info-box warn">' + ic('info', 'red sm') + `<span class="v">${esc(c.name)} is already saved in ${esc(s.name)}.</span></div>` : ''}
      <div class="field"><label class="label" for="pl-note"><span>Note <span class="optional">(Optional)</span></span> ${counter('pl-note-c', d.note.length, 300)}</label><textarea id="pl-note" class="textarea" maxlength="300" placeholder="Visit early in the morning to avoid crowds." data-bind="note" data-count="pl-note-c" data-max="300">${esc(d.note)}</textarea></div>
      <div class="field"><span class="label">Visit Status</span><div class="status-grid">${Object.entries(VISIT).map(([k, v]) => `<button class="st-opt ${d.status === k ? 'on' : ''}" data-a="set-draft" data-k="status" data-v="${k}">${ic(v.icon, v.color + ' sm')}${v.label}</button>`).join('')}</div></div>
    </div>`;
  },
  footer(p) {
    const d = p.d;
    if (d.step === 1) return '';
    if (d.step === 2) return '<button class="btn btn-primary" data-a="wiz-next">Continue</button>';
    const blocked = !d.spaceId || !d.key || isSaved(d.key, d.spaceId);
    return `<button class="btn btn-primary" data-a="save-place" ${blocked ? 'disabled' : ''}>Add Place</button>`;
  },
};
screens.placeDone = {
  render(p) {
    const pl = db.places.find(x => x.id === p.id); if (!pl) return '';
    const s = spaceById(pl.spaceId);
    return `<div class="pad stack-lg"><div class="success">${illo('pin', { tone: 'brand' })}<h1 class="title">Place Added!</h1><p class="sub">${esc(pl.name)} has been added to your ${esc(s ? s.name : 'Space')}.</p></div>
      <section class="card stack">
        <div class="sheet-hero">${art(pl.art)}</div>
        <div class="split" style="align-items:center"><span style="font-size:18px;font-weight:500">${esc(pl.name)}</span><span class="muted">${esc(s ? s.name : '')}</span></div>
        <span class="muted">${esc(pl.type)} • ${esc(pl.sub || pl.area)}</span>
        ${pl.note ? `<p class="muted">${esc(pl.note)}</p>` : ''}
        <span>${s && s.start ? `<span class="tag">${esc(fmtRange(s.start, s.end))}</span>` : ''} <span class="tag ${VISIT[pl.status].color === 'green' ? 'green' : VISIT[pl.status].color === 'orange' ? 'orange' : ''}">${VISIT[pl.status].label}</span></span>
      </section></div>`;
  },
  footer(p) {
    const pl = db.places.find(x => x.id === p.id);
    return `<button class="btn btn-primary" data-a="space" data-id="${pl ? pl.spaceId : ''}" data-tab="places" data-reset="1">View ${pl && spaceById(pl.spaceId)?.start ? 'Trip' : 'Space'}</button><button class="btn btn-secondary" data-a="add-place" data-space="${pl ? pl.spaceId : ''}" data-replace="1">Add Another Place</button>`;
  },
};

/* ---------- Add / edit Note ---------- */
function newNoteDraft(spaceId) {
  const s = spaceById(spaceId);
  return { title: '', tag: s && s.template === 'travel' ? 'Travel' : 'Personal', spaceId: s ? s.id : (spaceById('personal') ? 'personal' : ''), body: '', cover: null, items: [], editId: null };
}
screens.addNote = {
  render(p) {
    const d = p.d, s = spaceById(d.spaceId);
    return `<div class="pad stack-lg">
      ${topbar({ title: d.editId ? 'Edit Note' : 'New Note', center: true })}
      <div class="field"><label class="label" for="nt-title">Title ${counter('nt-title-c', d.title.length, 80)}</label><input id="nt-title" class="input" maxlength="80" placeholder="Shibuya - must visit" value="${esc(d.title)}" data-bind="title" data-count="nt-title-c" data-max="80" data-live="1" autocomplete="off"></div>
      ${frow(s ? s.icon : 'layers', s ? s.color : 'brand', 'Space', s ? s.name : 'No space', 'pick-space')}
      <div class="field"><span class="label">Tag</span><div class="chips">${NOTE_TAGS.map(t => `<button class="chip ${d.tag === t ? 'on' : ''}" data-a="set-draft" data-k="tag" data-v="${t}">${t}</button>`).join('')}</div></div>
      <div class="field"><span class="label">Cover <span class="optional">(optional)</span></span><div class="covers">${[null, ...COVERS.slice(0, 7)].map(k => `<button class="cover-opt ${d.cover === k ? 'on' : ''}" data-a="set-draft" data-k="cover" data-v="${k || ''}" aria-label="${k || 'No cover'}">${k ? art(k) : '<span class="muted">None</span>'}${d.cover === k && k ? `<span class="badge-on">${icon('check')}</span>` : ''}</button>`).join('')}</div></div>
      <div class="field"><label class="label" for="nt-body">Note ${counter('nt-body-c', d.body.length, 2000)}</label><textarea id="nt-body" class="textarea" style="min-height:160px" maxlength="2000" placeholder="Write anything…" data-bind="body" data-count="nt-body-c" data-max="2000">${esc(d.body)}</textarea></div>
      ${d.editId ? '' : `<section class="card"><div class="grp-head">${ic('list', 'brand sq')}<span class="main"><span class="t">Checklist</span><span class="m">${d.items.length ? plural(d.items.length, 'item') : 'Optional'}</span></span></div>
        <div>${d.items.map((t, i) => `<div class="cl-item"><span class="cb"></span><span>${esc(t)}</span><button class="icon-btn sm" style="background:transparent" data-a="nt-del-item" data-i="${i}" aria-label="Remove ${esc(t)}">${icon('x')}</button></div>`).join('')}</div>
        <form class="add-item" data-form="nt-add-item">${icon('plus')}<label class="sr" for="nt-item">New checklist item</label><input id="nt-item" placeholder="Add item" autocomplete="off" maxlength="120"></form></section>`}
    </div>`;
  },
  footer(p) { return `<button class="btn btn-primary" data-a="save-note" ${p.d.title.trim() ? '' : 'disabled'}>${p.d.editId ? 'Save Changes' : 'Save Note'}</button>`; },
};

/* ================= Sheets ================= */
let sheet = null;
function openSheet(renderFn, state = {}, opts = {}) {
  sheet = { render: renderFn, state, onClose: opts.onClose };
  sheetsEl.innerHTML = `<div class="scrim" data-a="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grabber"></div><div class="sheet-body" id="sheet-body">${renderFn(state)}</div></div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => sheetsEl.classList.add('open')));
  setTimeout(() => { const f = sheetsEl.querySelector('[autofocus]'); if (f) f.focus(); }, 320);
}
function refreshSheet() {
  if (!sheet) return;
  const b = $('#sheet-body'); const top = b.scrollTop;
  b.innerHTML = sheet.render(sheet.state); b.scrollTop = top;
}
function closeSheet({ rerender = true } = {}) {
  const s = sheet; sheet = null;
  sheetsEl.classList.remove('open');
  setTimeout(() => { if (!sheet) sheetsEl.innerHTML = ''; }, 300);
  if (s && s.onClose) s.onClose();
  if (rerender) render();
}
const sheetHead = (t, sub = '') => `<h3 class="sheet-title">${esc(t)}</h3>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}`;

function quickAdd(spaceId) {
  openSheet(() => `${sheetHead('What do you want to add?', 'Capture it now. Organize it later.')}
    <div class="qa-grid">${QA.map(o => `<button class="qa" data-a="qa" data-k="${o.k}" data-space="${spaceId || ''}" data-from-sheet="1">${ic(o.icon, o.color)}<span><b>${o.label}</b><small>${o.sub}</small></span>${chev()}</button>`).join('')}</div>`);
}
function spacePickerRows(st) {
  const q = st.q.trim().toLowerCase();
  const list = db.spaces.filter(s => !q || s.name.toLowerCase().includes(q));
  return list.map(s => `<button class="opt ${st.sel === s.id ? 'on' : ''}" data-a="picker-pick" data-id="${s.id}">${spaceThumb(s, 'sm')}<span class="main"><span class="t">${esc(s.name)}</span><span class="m">${esc(s.start ? fmtRange(s.start, s.end) : (s.desc || spaceSummary(s)))}</span></span><span class="radio ${st.sel === s.id ? 'on' : ''}">${icon('check')}</span></button>`).join('') || '<p class="muted">No spaces match.</p>';
}
function openSpacePicker(sel, apply, title = 'Add to a Space') {
  openSheet(st => `${sheetHead(title)}
    <label class="search">${icon('search')}<span class="sr">Search spaces</span><input id="picker-q" class="input" placeholder="Search spaces" value="${esc(st.q)}" autocomplete="off"></label>
    <div class="opt-list" id="picker-list">${spacePickerRows(st)}</div>
    <button class="btn btn-dashed" data-a="new-space" data-from-sheet="1">${icon('plus')} Create New Space</button>
    <button class="btn btn-primary" data-a="sheet-close">Done</button>`, { q: '', sel, apply });
}
function openDateSheet(iso, apply) {
  const d = new Date(iso);
  openSheet(st => {
    const now = new Date();
    const quick = [['Now', now], ['This morning', (() => { const x = sod(now); x.setHours(9); return x; })()], ['Yesterday', addDays(now, -1)], ['2 days ago', addDays(now, -2)]];
    return `${sheetHead('Select Date & Time')}
      <div class="seg"><button class="${st.mode === 'date' ? 'on' : ''}" data-a="sheet-set" data-k="mode" data-v="date">Date & Time</button><button class="${st.mode === 'quick' ? 'on' : ''}" data-a="sheet-set" data-k="mode" data-v="quick">Quick Select</button></div>
      ${st.mode === 'date' ? `${calendar(st.calSel, st.calView, 'sheet')}<label class="time-row" for="sh-time">Time <input id="sh-time" type="time" value="${st.time}" data-sheet-bind="time"></label>`
        : `<div class="opt-list">${quick.map(([l, x], i) => `<button class="opt" data-a="date-quick" data-i="${i}">${ic('clock', 'brand sm')}<span class="main"><span class="t">${l}</span><span class="m">${fmtDow(x)} · ${fmtTime(x)}</span></span>${chev()}</button>`).join('')}</div>`}
      <button class="btn btn-primary" data-a="date-done">Done</button>`;
  }, { mode: 'date', calSel: ymd(d), calView: ym(d), time: fmtTime(d), apply, quick: null });
}
function openPaymentSheet(sel, apply) {
  openSheet(st => `${sheetHead('Select Payment Method')}
    <div class="opt-list">${db.payments.map(p => `<button class="opt ${st.sel === p.id ? 'on' : ''}" data-a="pay-pick" data-id="${p.id}">${ic(p.icon, p.color + ' sm')}<span class="main"><span class="t">${esc(p.label)}</span></span><span class="radio ${st.sel === p.id ? 'on' : ''}">${icon('check')}</span></button>`).join('')}</div>
    ${st.adding ? `<form class="stack gap-sm" data-form="pay-add"><label class="sr" for="pay-new">New payment method</label><input id="pay-new" class="input" placeholder="e.g. Travel card" maxlength="30" autocomplete="off" autofocus><button class="btn btn-secondary" type="submit">Add method</button></form>` : `<button class="btn btn-dashed" data-a="sheet-set" data-k="adding" data-v="1">${icon('plus')} Add New Method</button>`}
    <button class="btn btn-primary" data-a="sheet-close">Done</button>`, { sel, apply, adding: false });
}
function armDelete(el, label = 'Tap again to delete') {
  if (el.dataset.armed) return true;
  el.dataset.armed = '1'; el.classList.add('armed'); const old = el.innerHTML; el.textContent = label;
  setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.classList.remove('armed'); el.innerHTML = old; } }, 3500);
  return false;
}
function reminderSheet(id) {
  openSheet(() => {
    const r = db.reminders.find(x => x.id === id); if (!r) return '<p>Reminder not found.</p>';
    const t = RTYPES[r.type], d = new Date(r.at);
    return `<div class="grp-head">${ic(r.icon || t.icon, t.color + ' lg')}<span class="main"><span class="sheet-title">${esc(r.title)}</span><span class="m">${t.label} · ${esc(spaceName(r.spaceId))}</span></span></div>
      <div><div class="kv"><span class="k">When</span><span class="v">${DOW[d.getDay()]}, ${fmtLong(d)} · ${fmtTime(d)}</span></div>
      <div class="kv"><span class="k">Repeat</span><span class="v">${r.repeat === 'custom' ? WEEKDAYS.filter(([v]) => r.days.includes(v)).map(x => x[1]).join(', ') : REPEATS[r.repeat].label}</span></div>
      <div class="kv"><span class="k">Status</span><span class="v">${r.done ? 'Done' : new Date(r.at) < new Date() ? 'Overdue' : 'Scheduled'}</span></div>
      ${r.notes ? `<div class="kv"><span class="k">Notes</span><span class="v">${esc(r.notes)}</span></div>` : ''}</div>
      <button class="btn btn-primary" data-a="rem-toggle" data-id="${r.id}" data-from-sheet="1">${icon('check')} ${r.done ? 'Mark as not done' : 'Mark as done'}</button>
      <div class="btn-row"><button class="btn btn-secondary" data-a="rem-edit" data-id="${r.id}" data-step="1">${icon('pencil')} Edit</button><button class="btn btn-danger" data-a="del-reminder" data-id="${r.id}">${icon('trash')} Delete</button></div>`;
  });
}
function expenseSheet(id) {
  openSheet(() => {
    const e = db.expenses.find(x => x.id === id); if (!e) return '<p>Expense not found.</p>';
    const c = CATS[e.category] || CATS.other, pm = payById(e.payment);
    return `<div class="grp-head">${ic(c.icon, c.color + ' lg')}<span class="main"><span class="sheet-title">${money(e.amount, e.currency)}</span><span class="m">${esc(e.title)}</span></span></div>
      <div><div class="kv"><span class="k">Category</span><span class="v">${c.long}</span></div>
      <div class="kv"><span class="k">Space</span><span class="v">${esc(spaceName(e.spaceId))}</span></div>
      <div class="kv"><span class="k">Date</span><span class="v">${fmtLong(new Date(e.at))} · ${fmtTime(new Date(e.at))}</span></div>
      <div class="kv"><span class="k">Payment</span><span class="v">${esc(pm.label)}</span></div>
      ${e.location ? `<div class="kv"><span class="k">Location</span><span class="v">${esc(e.location)}</span></div>` : ''}
      ${e.note && e.note !== e.title ? `<div class="kv"><span class="k">Note</span><span class="v">${esc(e.note)}</span></div>` : ''}
      ${e.receipt ? `<div class="kv"><span class="k">Receipt</span><span class="v">${esc(e.receipt)}</span></div>` : ''}
      ${e.currency !== defCur() ? `<div class="kv"><span class="k">In ${defCur()}</span><span class="v">≈ ${money(conv(e.amount, e.currency, defCur()), defCur())}</span></div>` : ''}</div>
      <button class="btn btn-danger" data-a="del-expense" data-id="${e.id}">${icon('trash')} Delete expense</button>`;
  });
}
function eventSheet(id) {
  openSheet(() => {
    const e = db.events.find(x => x.id === id); if (!e) return '<p>Plan not found.</p>';
    const k = EVENT_KINDS[e.kind] || EVENT_KINDS.other, d = new Date(e.start);
    return `<div class="grp-head">${ic(k.icon, k.color + ' lg')}<span class="main"><span class="sheet-title">${esc(e.title)}</span><span class="m">${k.label} · ${esc(spaceName(e.spaceId))}</span></span></div>
      <div><div class="kv"><span class="k">Date</span><span class="v">${DOW[d.getDay()]}, ${fmtLong(d)}</span></div>
      <div class="kv"><span class="k">Time</span><span class="v">${e.allDay ? 'All day' : fmtTime(d) + (e.end ? ' - ' + fmtTime(new Date(e.end)) : '')}</span></div></div>
      <button class="btn btn-danger" data-a="del-event" data-id="${e.id}">${icon('trash')} Delete plan</button>`;
  });
}
function placeSheet(id) {
  openSheet(() => {
    const p = db.places.find(x => x.id === id); if (!p) return '<p>Place not found.</p>';
    return `<div class="sheet-hero">${art(p.art)}</div>
      <div><h3 class="sheet-title">${esc(p.name)}</h3><p class="muted">${esc(p.type || p.cat)} • ${esc(p.area)} · ${esc(spaceName(p.spaceId))}</p></div>
      <div class="status-grid">${Object.entries(VISIT).map(([k, v]) => `<button class="st-opt ${p.status === k ? 'on' : ''}" data-a="place-status" data-id="${p.id}" data-v="${k}">${ic(v.icon, v.color + ' sm')}${v.label}</button>`).join('')}</div>
      ${p.note ? `<p class="body-text" style="font-size:15px">${esc(p.note)}</p>` : ''}
      <div>${p.address ? `<div class="kv"><span class="k">Address</span><span class="v">${esc(p.address)}</span></div>` : ''}
      ${p.hours ? `<div class="kv"><span class="k">Hours</span><span class="v">${esc(p.hours)}</span></div>` : ''}
      ${p.website ? `<div class="kv"><span class="k">Website</span><a class="v" href="${esc(p.website)}" target="_blank" rel="noopener">${esc(p.website.replace(/^https?:\/\//, ''))}</a></div>` : ''}</div>
      <a class="btn btn-secondary" href="${placeOpenUrl(p)}" target="_blank" rel="noopener">${icon('nav')} Directions</a>
      <button class="btn btn-danger" data-a="del-place" data-id="${p.id}">${icon('trash')} Remove place</button>`;
  });
}
function contactSheet(id) {
  openSheet(() => {
    const c = db.contacts.find(x => x.id === id); if (!c) return '<p>Contact not found.</p>';
    return `${sheetHead(c.name, c.role || '')}<div>${c.phone ? `<div class="kv"><span class="k">Phone</span><span class="v" style="user-select:all">${esc(c.phone)}</span></div>` : ''}${c.notes ? `<div class="kv"><span class="k">Notes</span><span class="v">${esc(c.notes)}</span></div>` : ''}</div>
      ${c.phone ? `<button class="btn btn-secondary" data-a="copy" data-text="${esc(c.phone)}">${icon('copy')} Copy number</button>` : ''}
      <button class="btn btn-danger" data-a="del-contact" data-id="${c.id}">${icon('trash')} Delete contact</button>`;
  });
}
function formSheet(title, fieldsHtml, formName, submitLabel, state = {}) {
  openSheet(() => `${sheetHead(title)}<form class="stack" data-form="${formName}">${fieldsHtml}<button class="btn btn-primary" type="submit">${submitLabel}</button></form>`, state);
}
const spaceSelect = (id, sel, filter = () => true) => `<select id="${id}" class="input">${db.spaces.filter(filter).map(s => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>`;

/* ================= Actions ================= */
function render(opt = {}) {
  const r = nav.cur, S = screens[r.name] || screens.today;
  const keep = opt.scroll === undefined ? view.scrollTop : opt.scroll;
  view.className = 'view';
  if (S.flush || (r.name === 'addPlace' && r.params.d && r.params.d.step === 2)) view.classList.add('flush');
  view.innerHTML = S.render(r.params);
  const f = S.footer ? S.footer(r.params) : '';
  footerEl.innerHTML = f; footerEl.hidden = !f;
  if (f) view.classList.add('has-footer');
  else if (!S.tabs) view.classList.add('no-tabs');
  tabbar.hidden = !S.tabs;
  const root = nav.stack[0].name;
  tabbar.querySelectorAll('.tab').forEach(t => { const on = t.dataset.to === root; t.classList.toggle('on', on); t.setAttribute('aria-current', on ? 'page' : 'false'); });
  view.scrollTop = keep;
  if (opt.anim) { view.classList.add('anim-' + opt.anim); }
  save();
}
const refreshFooter = () => { const S = screens[nav.cur.name]; if (S && S.footer) { const f = S.footer(nav.cur.params); footerEl.innerHTML = f; footerEl.hidden = !f; } };
function toast(msg) {
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}
const curSpaceId = () => { const r = nav.cur; return r.name === 'space' ? r.params.id : ''; };

const A = {
  back() { const S = screens[nav.cur.name]; if (S && S.back && S.back(nav.cur.params)) return; nav.back(); },
  tab(ds) { if (sheet) closeSheet({ rerender: false }); nav.tab(ds.to); },
  go(ds) { const params = {}; if (ds.filter) params.filter = ds.filter; nav.push(ds.to, params); },
  fab() { quickAdd(curSpaceId()); },
  'sheet-close'() { closeSheet(); },
  space(ds) {
    if (sheet) closeSheet({ rerender: false });
    if (ds.reset) return goSpace(ds.id, ds.tab || 'overview');
    nav.push('space', { id: ds.id, tab: ds.tab || 'overview' });
  },
  'space-tab'(ds) { nav.cur.params.tab = ds.tab; render(); },
  'space-filter'(ds) { nav.cur.params[ds.k] = ds.v; render(); },
  'toggle-acts'() { nav.cur.params.allActs = !nav.cur.params.allActs; render(); },
  'toggle-cats'() { nav.cur.params.allCats = !nav.cur.params.allCats; render(); },
  note(ds) { nav.push('note', { id: ds.id }); },
  reminder(ds) { reminderSheet(ds.id); },
  expense(ds) { expenseSheet(ds.id); },
  event(ds) { eventSheet(ds.id); },
  place(ds) { placeSheet(ds.id); },
  contact(ds) { contactSheet(ds.id); },
  noop() {},
  copy(ds) {
    const done = () => toast('Copied');
    try { navigator.clipboard.writeText(ds.text).then(done, () => toast('Select the text to copy it')); } catch (e) { toast('Select the text to copy it'); }
  },

  /* Quick add */
  qa(ds) {
    const sid = ds.space || curSpaceId();
    const fromSheet = !!ds.fromSheet;
    if (fromSheet && !['list', 'goal'].includes(ds.k)) closeSheet({ rerender: false });
    const go = (name, params) => ds.replace ? nav.replace(name, params) : nav.push(name, params);
    if (ds.k === 'expense') go('addExpense', { d: newExpenseDraft(sid) });
    else if (ds.k === 'reminder') go('addReminder', { d: newReminderDraft(sid) });
    else if (ds.k === 'note') go('addNote', { d: newNoteDraft(sid) });
    else if (ds.k === 'place') go('addPlace', { d: newPlaceDraft(sid) });
    else if (ds.k === 'list') listSheet(sid);
    else if (ds.k === 'goal') goalSheet(sid);
  },
  'new-space'(ds) { if (ds.fromSheet || sheet) closeSheet({ rerender: false }); nav.push('createSpace', { d: newSpaceDraft() }); },
  'add-place'(ds) { const d = newPlaceDraft(ds.space || curSpaceId()); ds.replace ? nav.replace('addPlace', { d }) : nav.push('addPlace', { d }); },

  /* Drafts + wizards */
  'set-draft'(ds) {
    const d = draft(); if (!d) return;
    d[ds.k] = ds.k === 'cover' ? (ds.v || null) : ds.v;
    render();
  },
  'wiz-next'() { const d = draft(); d.step++; render({ scroll: 0, anim: 'push' }); },
  'wiz-goto'(ds) { const d = draft(); d.step = +ds.step; render({ scroll: 0 }); },
  'cal-nav'(ds) {
    const st = ds.ctx === 'sheet' ? sheet.state : draft();
    const [y, m] = st.calView.split('-').map(Number);
    st.calView = ym(new Date(y, m - 1 + Number(ds.dir), 1));
    ds.ctx === 'sheet' ? refreshSheet() : render();
  },
  'cal-day'(ds) {
    const st = ds.ctx === 'sheet' ? sheet.state : draft();
    st.calSel = ds.day; st.calView = ds.day.slice(0, 7);
    ds.ctx === 'sheet' ? refreshSheet() : render();
  },

  /* Expense */
  'pick-space'() {
    const d = draft();
    openSpacePicker(d.spaceId, id => { d.spaceId = id; }, nav.cur.name === 'addNote' ? 'Choose a Space' : nav.cur.name === 'addPlace' ? 'Add to a Space' : 'Add to a Space');
  },
  'picker-pick'(ds) { sheet.state.sel = ds.id; sheet.state.apply(ds.id); refreshSheet(); },
  'pick-date'() { const d = draft(); openDateSheet(d.at, iso => { d.at = iso; }); },
  'sheet-set'(ds) { sheet.state[ds.k] = ds.v === '1' ? true : ds.v; refreshSheet(); },
  'date-quick'(ds) {
    const now = new Date();
    const opts = [now, (() => { const x = sod(now); x.setHours(9); return x; })(), addDays(now, -1), addDays(now, -2)];
    sheet.state.apply(opts[+ds.i].toISOString()); closeSheet();
  },
  'date-done'() { const st = sheet.state; st.apply(combine(st.calSel, st.time)); closeSheet(); },
  'pick-pay'() { const d = draft(); openPaymentSheet(d.payment, id => { d.payment = id; }); },
  'pay-pick'(ds) { sheet.state.sel = ds.id; sheet.state.apply(ds.id); refreshSheet(); },
  'save-expense'() {
    const d = draft(), amount = parseAmount(d.amount);
    if (!(amount > 0)) return;
    const s = spaceById(d.spaceId);
    const e = { id: uid(), spaceId: d.spaceId, title: (d.note.trim().split('\n')[0] || CATS[d.category].long).slice(0, 60), amount, currency: spaceCur(s), category: d.category, at: d.at, location: '', payment: d.payment, note: d.note.trim(), receipt: d.receipt };
    db.expenses.push(e);
    if (s) { ensureModule(s, 'expenses'); log(s.id, 'Expense added', { amount, currency: e.currency }); }
    nav.replace('expenseDone', { id: e.id });
  },
  'expense-again'(ds) { nav.replace('addExpense', { d: newExpenseDraft(ds.space) }); },
  'del-expense'(ds, el) { if (!armDelete(el)) return; db.expenses = db.expenses.filter(e => e.id !== ds.id); closeSheet(); toast('Expense deleted'); },

  /* Reminder */
  'rem-suggest'(ds) { const d = draft(); const [t, ty, i] = SUGGESTED[+ds.n]; d.title = t; d.type = ty; d.icon = i; render(); },
  'rem-day'(ds) { const d = draft(); d.days = d.days.includes(ds.v) ? d.days.filter(x => x !== ds.v) : [...d.days, ds.v]; render(); },
  'rem-toggle'(ds) {
    const r = db.reminders.find(x => x.id === ds.id); if (!r) return;
    setReminderDone(r, !r.done);
    toast(r.done ? 'Marked as done' : 'Marked as not done');
    if (ds.fromSheet) closeSheet(); else render();
  },
  'rem-edit'(ds) {
    const r = db.reminders.find(x => x.id === ds.id); if (!r) return;
    if (sheet) closeSheet({ rerender: false });
    const d = new Date(r.at);
    const params = { d: { step: +ds.step || 1, type: r.type, title: r.title, notes: r.notes, calSel: ymd(d), calView: ym(d), time: fmtTime(d), repeat: r.repeat, days: [...(r.days || [])], spaceId: r.spaceId, editId: r.id, icon: r.icon, jump: nav.cur.name === 'reminderDone' } };
    nav.cur.name === 'reminderDone' ? nav.replace('addReminder', params) : nav.push('addReminder', params);
  },
  'save-reminder'() {
    const d = draft();
    if (!d.title.trim()) return;
    const data = { type: d.type, title: d.title.trim(), notes: d.notes.trim(), at: reminderWhen(d), repeat: d.repeat, days: d.repeat === 'custom' ? d.days : [], spaceId: d.spaceId, icon: d.icon };
    let r;
    if (d.editId && (r = db.reminders.find(x => x.id === d.editId))) Object.assign(r, data);
    else { r = { id: uid(), done: false, ...data }; db.reminders.push(r); const s = spaceById(d.spaceId); if (s) { ensureModule(s, 'reminders'); log(s.id, 'Reminder added'); } }
    if (d.editId && !d.jump) { nav.back(); toast('Reminder updated'); }
    else nav.replace('reminderDone', { id: r.id });
  },
  'del-reminder'(ds, el) { if (!armDelete(el)) return; db.reminders = db.reminders.filter(r => r.id !== ds.id); closeSheet(); toast('Reminder deleted'); },

  /* Space */
  'pick-template'(ds) {
    const d = draft(), t = TEMPLATES[ds.v];
    d.template = ds.v; d.modules = [...t.modules]; d.cover = t.cover; d.color = t.color;
    d.icon = ds.v === 'scratch' ? 'home' : t.icon;
    render();
  },
  'pick-cover'(ds) { const d = draft(); d.cover = d.cover === ds.v && !d.coverImg ? null : ds.v; d.coverImg = null; render(); },
  'toggle-module'(ds) { const d = draft(); d.modules = d.modules.includes(ds.v) ? d.modules.filter(m => m !== ds.v) : [...d.modules, ds.v]; render(); },
  'save-space'() {
    const d = draft();
    const data = { name: d.name.trim(), template: d.template, icon: d.icon, color: d.color, cover: d.coverImg ? null : d.cover, coverImg: d.coverImg, start: d.start || null, end: d.end || null, currency: d.currency, budget: parseAmount(d.budget) || null, modules: MOD_ORDER.filter(m => d.modules.includes(m)) };
    if (d.editId) {
      const s = spaceById(d.editId); Object.assign(s, data);
      toast('Space updated'); nav.back();
      return;
    }
    const s = { id: uid(), desc: TEMPLATES[d.template].label, createdAt: new Date().toISOString(), ...data };
    db.spaces.push(s); log(s.id, 'Space created');
    nav.replace('spaceDone', { id: s.id });
  },
  'space-menu'(ds) {
    const s = spaceById(ds.id); if (!s) return;
    openSheet(() => `${sheetHead(s.name, spaceSummary(s))}
      <div class="opt-list">
        <button class="opt" data-a="space-edit" data-id="${s.id}" data-step="2">${ic('pencil', 'brand sm')}<span class="main"><span class="t">Edit details</span><span class="m">Name, cover, icon, dates, budget</span></span>${chev()}</button>
        <button class="opt" data-a="space-edit" data-id="${s.id}" data-step="3">${ic('layers', 'brand sm')}<span class="main"><span class="t">Change modules</span><span class="m">${s.modules.map(m => MODULES[m].label).join(', ') || 'None'}</span></span>${chev()}</button>
      </div>
      <button class="btn btn-danger" data-a="del-space" data-id="${s.id}">${icon('trash')} Delete space</button>
      <p class="note">Deleting a space also deletes its expenses, notes, reminders, places and lists.</p>`);
  },
  'space-edit'(ds) { const s = spaceById(ds.id); closeSheet({ rerender: false }); nav.push('createSpace', { d: draftFromSpace(s, +ds.step) }); },
  'del-space'(ds, el) {
    if (!armDelete(el, 'Tap again to delete everything')) return;
    const id = ds.id;
    db.spaces = db.spaces.filter(s => s.id !== id);
    ['expenses', 'notes', 'reminders', 'places', 'shopping', 'events', 'goals', 'contacts', 'activity'].forEach(k => { db[k] = db[k].filter(x => x.spaceId !== id); });
    closeSheet({ rerender: false });
    nav.tab('spaces'); toast('Space deleted');
  },
  budget(ds) {
    const s = spaceById(ds.id);
    formSheet('Budget', `<div class="field"><label class="label" for="bd-amt">Total budget (${s.currency || defCur()})</label><input id="bd-amt" class="input" inputmode="decimal" value="${s.budget || ''}" placeholder="${CUR[spaceCur(s)]}0" autocomplete="off" autofocus></div><p class="note">Leave empty to remove the budget.</p>`, 'budget', 'Save budget', { id: s.id });
  },

  /* Shopping */
  'shop-toggle'(ds) {
    const i = db.shopping.find(x => x.id === ds.id); if (!i) return;
    i.purchased = !i.purchased; i.date = i.purchased ? ymd(new Date()) : null;
    if (i.purchased) log(i.spaceId, `Bought ${i.name}`);
    render();
  },
  'add-item'(ds) { itemSheet(ds.space || curSpaceId(), ds.group || ''); },
  'item-menu'(ds) {
    const i = db.shopping.find(x => x.id === ds.id); if (!i) return;
    itemSheet(i.spaceId, i.group, i);
  },
  'del-item'(ds, el) { if (!armDelete(el)) return; db.shopping = db.shopping.filter(x => x.id !== ds.id); closeSheet(); toast('Item deleted'); },

  /* Goals, plans, contacts */
  'goal-step'(ds) { const g = db.goals.find(x => x.id === ds.id); if (!g) return; g.progress = Math.max(0, g.progress + Number(ds.d)); log(g.spaceId, 'Goal updated'); render(); },
  'goal-menu'(ds) {
    const g = db.goals.find(x => x.id === ds.id); if (!g) return;
    openSheet(() => `${sheetHead(g.title, `${fmtNum(g.progress)} / ${fmtNum(g.target)} ${g.unit || ''}`)}
      <form class="stack" data-form="goal-progress" data-id="${g.id}"><div class="field"><label class="label" for="gp-val">Progress</label><input id="gp-val" class="input" inputmode="decimal" value="${g.progress}" autocomplete="off"></div><button class="btn btn-primary" type="submit">Update progress</button></form>
      <button class="btn btn-danger" data-a="del-goal" data-id="${g.id}">${icon('trash')} Delete goal</button>`);
  },
  'del-goal'(ds, el) { if (!armDelete(el)) return; db.goals = db.goals.filter(x => x.id !== ds.id); closeSheet(); toast('Goal deleted'); },
  'add-event'(ds) {
    const kind = ds.kind || 'flight';
    formSheet('Add plan', `<div class="field"><span class="label">Type</span><div class="tchips">${Object.entries(EVENT_KINDS).map(([k, v]) => `<label class="tchip ${k === kind ? 'on' : ''}" style="display:inline-flex;align-items:center;gap:6px"><input type="radio" name="ev-kind" value="${k}" ${k === kind ? 'checked' : ''} style="accent-color:var(--brand)"> ${v.label}</label>`).join('')}</div></div>
      <div class="field"><label class="label" for="ev-title">Title</label><input id="ev-title" class="input" maxlength="60" placeholder="Flight to Tokyo" autocomplete="off" required></div>
      <div class="field"><label class="label" for="ev-date">Date</label><input id="ev-date" type="date" class="input" value="${ymd(addDays(new Date(), 1))}" required></div>
      <div class="two"><div class="field"><label class="label" for="ev-start">Start</label><input id="ev-start" type="time" class="input" value="09:00"></div><div class="field"><label class="label" for="ev-end">End <span class="optional">(optional)</span></label><input id="ev-end" type="time" class="input"></div></div>
      <label class="set-row" for="ev-allday"><span class="t">All day</span><input id="ev-allday" type="checkbox" style="width:22px;height:22px;accent-color:var(--brand)"></label>`, 'event', 'Add plan', { space: ds.space });
  },
  'del-event'(ds, el) { if (!armDelete(el)) return; db.events = db.events.filter(x => x.id !== ds.id); closeSheet(); toast('Plan deleted'); },
  'add-contact'(ds) {
    formSheet('Add contact', `<div class="field"><label class="label" for="ct-name">Name</label><input id="ct-name" class="input" maxlength="60" required autocomplete="off" autofocus></div>
      <div class="field"><label class="label" for="ct-role">Role <span class="optional">(optional)</span></label><input id="ct-role" class="input" maxlength="60" placeholder="Hotel front desk" autocomplete="off"></div>
      <div class="field"><label class="label" for="ct-phone">Phone <span class="optional">(optional)</span></label><input id="ct-phone" class="input" type="tel" maxlength="30" autocomplete="off"></div>
      <div class="field"><label class="label" for="ct-notes">Notes <span class="optional">(optional)</span></label><textarea id="ct-notes" class="textarea" maxlength="200"></textarea></div>`, 'contact', 'Save contact', { space: ds.space });
  },
  'del-contact'(ds, el) { if (!armDelete(el)) return; db.contacts = db.contacts.filter(x => x.id !== ds.id); closeSheet(); toast('Contact deleted'); },

  /* Notes */
  'cl-toggle'(ds) { const n = db.notes.find(x => x.id === ds.id); const it = n && n.checklist.items.find(i => i.id === ds.item); if (!it) return; it.done = !it.done; render(); },
  'cl-create'(ds) { const n = db.notes.find(x => x.id === ds.id); if (!n) return; n.checklist = { title: 'Checklist', items: [] }; render(); setTimeout(() => { const i = $('#cl-new'); if (i) i.focus(); }, 30); },
  'note-menu'(ds) {
    const n = db.notes.find(x => x.id === ds.id); if (!n) return;
    openSheet(() => `${sheetHead(n.title)}
      <button class="opt" data-a="note-edit" data-id="${n.id}">${ic('pencil', 'brand sm')}<span class="main"><span class="t">Edit note</span></span>${chev()}</button>
      ${n.checklist ? `<button class="opt" data-a="cl-remove" data-id="${n.id}">${ic('list', 'brand sm')}<span class="main"><span class="t">Remove checklist</span></span>${chev()}</button>` : ''}
      <button class="btn btn-danger" data-a="del-note" data-id="${n.id}">${icon('trash')} Delete note</button>`);
  },
  'cl-remove'(ds) { const n = db.notes.find(x => x.id === ds.id); if (n) n.checklist = null; closeSheet(); },
  'note-edit'(ds) {
    const n = db.notes.find(x => x.id === ds.id); if (!n) return;
    closeSheet({ rerender: false });
    nav.push('addNote', { d: { title: n.title, tag: n.tag, spaceId: n.spaceId, body: n.body, cover: n.cover, items: [], editId: n.id } });
  },
  'del-note'(ds, el) { if (!armDelete(el)) return; db.notes = db.notes.filter(x => x.id !== ds.id); closeSheet({ rerender: false }); nav.back(); toast('Note deleted'); },
  'nt-del-item'(ds) { draft().items.splice(+ds.i, 1); render(); },
  'save-note'() {
    const d = draft(); if (!d.title.trim()) return;
    if (d.editId) {
      const n = db.notes.find(x => x.id === d.editId);
      Object.assign(n, { title: d.title.trim(), tag: d.tag, spaceId: d.spaceId, body: d.body.trim(), cover: d.cover });
      nav.back(); toast('Note updated'); return;
    }
    const n = { id: uid(), spaceId: d.spaceId, title: d.title.trim(), tag: d.tag, createdAt: new Date().toISOString(), body: d.body.trim(), cover: d.cover, placeKey: null, checklist: d.items.length ? { title: 'Checklist', items: d.items.map(t => ({ id: uid(), text: t, done: false })) } : null };
    db.notes.push(n);
    const s = spaceById(d.spaceId); if (s) { ensureModule(s, 'notes'); log(s.id, 'Note created'); }
    nav.replace('note', { id: n.id }); toast('Note saved');
  },

  /* Places */
  'place-cat'(ds) { const d = draft(); d.cat = ds.v; render(); },
  'pick-place'(ds) { const d = draft(), c = catByKey(ds.key); d.key = ds.key; d.desc = c.desc; d.step = 2; render({ scroll: 0, anim: 'push' }); },
  'save-place'() {
    const d = draft(), c = catByKey(d.key), s = spaceById(d.spaceId);
    if (!c || !s || isSaved(c.key, s.id)) return;
    const p = { id: uid(), spaceId: s.id, key: c.key, name: c.name, cat: c.cat, type: c.type, sub: c.sub, area: c.area, tags: c.tags, desc: d.desc.trim(), note: d.note.trim(), address: c.address, hours: c.hours, website: c.website, art: c.art, x: c.x, y: c.y, dist: c.dist, status: d.status, createdAt: new Date().toISOString() };
    db.places.push(p); ensureModule(s, 'places'); log(s.id, 'Place saved');
    nav.replace('placeDone', { id: p.id });
  },
  'place-status'(ds) { const p = db.places.find(x => x.id === ds.id); if (!p) return; p.status = ds.v; refreshSheet(); render(); },
  'del-place'(ds, el) { if (!armDelete(el, 'Tap again to remove')) return; db.places = db.places.filter(x => x.id !== ds.id); closeSheet(); toast('Place removed'); },

  /* Search */
  'search-open'(ds) {
    const q = (nav.cur.params.q || '').trim();
    if (q) { db.recent = [q, ...db.recent.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 8); save(); }
    const id = ds.id;
    if (ds.type === 'spaces') nav.push('space', { id, tab: 'overview' });
    else if (ds.type === 'notes') nav.push('note', { id });
    else if (ds.type === 'expenses') expenseSheet(id);
    else if (ds.type === 'reminders') reminderSheet(id);
    else if (ds.type === 'places') placeSheet(id);
    else if (ds.type === 'items') { const i = db.shopping.find(x => x.id === id); if (i) nav.push('space', { id: i.spaceId, tab: 'shopping' }); }
  },
  'search-filter'(ds) { nav.cur.params.filter = ds.v; updateSearch(); },
  'search-recent'(ds) { nav.cur.params.q = ds.q; render(); },
  'search-clear'() { nav.cur.params.q = ''; nav.cur.params.filter = 'all'; render(); const i = $('#search-q'); if (i) i.focus(); },
  'search-clear-recent'() { db.recent = []; updateSearch(); save(); },

  /* Insights */
  period() {
    const p = nav.cur.params;
    openSheet(() => `${sheetHead('Time period')}<div class="opt-list">${['Last 7 days', 'Previous 7 days'].map((l, i) => `<button class="opt ${(p.per || 0) === i ? 'on' : ''}" data-a="set-period" data-v="${i}">${ic('calendar', 'brand sm')}<span class="main"><span class="t">${l}</span><span class="m">${fmtShort(addDays(new Date(), -6 - 7 * i))} – ${fmtShort(addDays(new Date(), -7 * i))}</span></span><span class="radio ${(p.per || 0) === i ? 'on' : ''}">${icon('check')}</span></button>`).join('')}</div>`);
  },
  'set-period'(ds) { nav.cur.params.per = +ds.v; closeSheet(); },

  /* Profile + settings */
  'edit-profile'() {
    const u = db.user;
    formSheet('Account Information', `<div class="field"><label class="label" for="pf-name">Full name</label><input id="pf-name" class="input" maxlength="60" value="${esc(u.name)}" required autocomplete="name"></div>
      <div class="field"><label class="label" for="pf-first">Name in greeting</label><input id="pf-first" class="input" maxlength="30" value="${esc(u.first)}" required autocomplete="given-name"></div>
      <div class="field"><label class="label" for="pf-title">Role <span class="optional">(optional)</span></label><input id="pf-title" class="input" maxlength="60" value="${esc(u.title || '')}" autocomplete="organization-title"></div>`, 'profile', 'Save');
  },
  'set-language'() {
    openSheet(() => `${sheetHead('Language')}<div class="opt-list"><button class="opt on">${ic('languages', 'brand sm')}<span class="main"><span class="t">English</span></span><span class="radio on">${icon('check')}</span></button><button class="opt" disabled>${ic('languages', 'gray sm')}<span class="main"><span class="t">Türkçe</span><span class="m">Coming soon</span></span><span class="radio"></span></button></div>`);
  },
  'set-currency'() {
    openSheet(() => `${sheetHead('Default Currency', 'Today and Insights show totals in this currency.')}<div class="opt-list">${Object.keys(CUR).map(c => `<button class="opt ${defCur() === c ? 'on' : ''}" data-a="pref" data-k="currency" data-v="${c}"><span class="ic sm brand" style="font-weight:600">${CUR[c]}</span><span class="main"><span class="t">${CUR_NAME[c]}</span><span class="m">${c}</span></span><span class="radio ${defCur() === c ? 'on' : ''}">${icon('check')}</span></button>`).join('')}</div>
      <p class="note">Amounts in other currencies are converted with fixed sample rates: 1 JPY = ₺0.23, 1 USD = ₺41, 1 EUR = ₺48.</p>`);
  },
  'set-notifications'() {
    openSheet(() => `${sheetHead('Notifications')}<button class="set-row" data-a="pref" data-k="notifications" data-v="${db.user.prefs.notifications ? '' : '1'}" role="switch" aria-checked="${db.user.prefs.notifications}"><span class="t">Reminder alerts</span><span class="switch ${db.user.prefs.notifications ? 'on' : ''}"></span></button>
      <p class="note">Due reminders show on Today and in Notifications. System push alerts need the installed app.</p>`);
  },
  'set-appearance'() {
    openSheet(() => `${sheetHead('Appearance')}<div class="opt-list">${[['system', 'System', 'Match your device'], ['light', 'Light', 'Always light'], ['dark', 'Dark', 'Always dark']].map(([k, l, m]) => `<button class="opt ${db.user.prefs.appearance === k ? 'on' : ''}" data-a="pref" data-k="appearance" data-v="${k}">${ic('palette', 'brand sm')}<span class="main"><span class="t">${l}</span><span class="m">${m}</span></span><span class="radio ${db.user.prefs.appearance === k ? 'on' : ''}">${icon('check')}</span></button>`).join('')}</div>`);
  },
  pref(ds) {
    const v = ds.k === 'notifications' ? !!ds.v : ds.v;
    db.user.prefs[ds.k] = v;
    if (ds.k === 'appearance') applyTheme();
    refreshSheet(); render();
  },
  'set-privacy'() {
    openSheet(() => `${sheetHead('Privacy')}<div class="ins">${ic('shield', 'brand sm')}<span>Everything you add to MEO is stored in this browser on this device. Nothing is sent to a server.</span></div>
      <div class="ins">${ic('info', 'gray sm')}<span>Clearing your browser data removes your MEO data. Use Backup & Sync to keep a copy.</span></div>`);
  },
  'set-backup'() {
    openSheet(st => `${sheetHead('Backup & Sync', 'Copy a backup and paste it back on any browser.')}
      <button class="btn btn-secondary" data-a="backup-copy">${icon('copy')} Copy backup</button>
      <form class="stack gap-sm" data-form="restore"><label class="label" for="bk-text">Restore from backup</label><textarea id="bk-text" class="textarea code-box" placeholder="Paste a MEO backup here"></textarea>${st.err ? `<span class="error">${esc(st.err)}</span>` : ''}<button class="btn btn-secondary" type="submit">${icon('refresh')} Restore</button></form>
      <button class="btn btn-danger" data-a="reset-data">${icon('trash')} Reset to sample data</button>`, { err: '' });
  },
  'backup-copy'() {
    const text = JSON.stringify(db);
    try { navigator.clipboard.writeText(text).then(() => toast('Backup copied'), () => fallbackCopy(text)); } catch (e) { fallbackCopy(text); }
  },
  'reset-data'(ds, el) { if (!armDelete(el, 'Tap again to reset everything')) return; db = seed(); applyTheme(); closeSheet({ rerender: false }); nav.tab('today'); toast('Sample data restored'); },
};
function fallbackCopy(text) {
  const ta = $('#bk-text'); if (!ta) return;
  ta.value = text; ta.focus(); ta.select(); toast('Backup selected. Copy it now.');
}
function listSheet(spaceId) {
  const def = spaceById(spaceId) || db.spaces.find(s => s.modules.includes('shopping')) || db.spaces[0];
  formSheet('Add list item', `<div class="field"><label class="label" for="li-name">Item</label><input id="li-name" class="input" maxlength="60" placeholder="Travel adapter" required autocomplete="off" autofocus></div>
    <div class="field"><label class="label" for="li-space">Space</label>${spaceSelect('li-space', def && def.id)}</div>
    <div class="field"><label class="label" for="li-group">Group <span class="optional">(optional)</span></label><input id="li-group" class="input" maxlength="30" placeholder="General" autocomplete="off" list="li-groups"><datalist id="li-groups">${[...new Set(db.shopping.map(i => i.group))].map(g => `<option value="${esc(g)}">`).join('')}</datalist></div>`, 'list', 'Add item');
}
function goalSheet(spaceId) {
  const def = spaceById(spaceId) || spaceById('fitness') || db.spaces[0];
  formSheet('Set a goal', `<div class="field"><label class="label" for="gl-title">Goal</label><input id="gl-title" class="input" maxlength="60" placeholder="Run 50 km this month" required autocomplete="off" autofocus></div>
    <div class="two"><div class="field"><label class="label" for="gl-target">Target</label><input id="gl-target" class="input" inputmode="decimal" placeholder="50" required autocomplete="off"></div><div class="field"><label class="label" for="gl-unit">Unit <span class="optional">(optional)</span></label><input id="gl-unit" class="input" maxlength="12" placeholder="km" autocomplete="off"></div></div>
    <div class="field"><label class="label" for="gl-space">Space</label>${spaceSelect('gl-space', def && def.id)}</div>`, 'goal', 'Save goal');
}
function itemSheet(spaceId, group, item = null) {
  const s = spaceById(spaceId);
  formSheet(item ? 'Edit item' : 'Add item', `<div class="field"><label class="label" for="it-name">Item</label><input id="it-name" class="input" maxlength="60" value="${esc(item ? item.name : '')}" placeholder="Adidas Samba" required autocomplete="off" ${item ? '' : 'autofocus'}></div>
    <div class="two"><div class="field"><label class="label" for="it-store">Store</label><input id="it-store" class="input" maxlength="40" value="${esc(item ? item.store || '' : '')}" placeholder="Adidas Store" autocomplete="off"></div><div class="field"><label class="label" for="it-area">Area</label><input id="it-area" class="input" maxlength="30" value="${esc(item ? item.area || '' : '')}" placeholder="Harajuku" autocomplete="off"></div></div>
    <div class="two"><div class="field"><label class="label" for="it-price">Price (${CUR[spaceCur(s)]})</label><input id="it-price" class="input" inputmode="decimal" value="${item && item.price ? item.price : ''}" autocomplete="off"></div><div class="field"><label class="label" for="it-group">Group</label><input id="it-group" class="input" maxlength="30" value="${esc(group || '')}" placeholder="General" autocomplete="off"></div></div>
    ${item ? `<button type="button" class="btn btn-danger" data-a="del-item" data-id="${item.id}">${icon('trash')} Delete item</button>` : ''}`, 'item', item ? 'Save item' : 'Add item', { space: spaceId, id: item ? item.id : null });
}

/* ---------- Form submits ---------- */
const val = id => (($('#' + id) || {}).value || '').trim();
const F = {
  search() { const q = nav.cur.params.q || ''; if (q.trim()) { db.recent = [q.trim(), ...db.recent.filter(x => x.toLowerCase() !== q.trim().toLowerCase())].slice(0, 8); save(); } const i = $('#search-q'); if (i) i.blur(); },
  'cl-add'(f) {
    const n = db.notes.find(x => x.id === f.dataset.id), t = val('cl-new');
    if (!n || !t) return;
    n.checklist.items.push({ id: uid(), text: t, done: false }); render();
    const i = $('#cl-new'); if (i) i.focus();
  },
  'nt-add-item'() { const t = val('nt-item'); if (!t) return; draft().items.push(t); render(); const i = $('#nt-item'); if (i) i.focus(); },
  'pay-add'() {
    const t = val('pay-new'); if (!t) return;
    const p = { id: uid(), label: t, icon: 'wallet', color: 'gray' };
    db.payments.push(p); sheet.state.sel = p.id; sheet.state.apply(p.id); sheet.state.adding = false; refreshSheet(); save();
  },
  budget() {
    const s = spaceById(sheet.state.id), v = parseAmount(val('bd-amt'));
    s.budget = v > 0 ? v : null; ensureModule(s, 'expenses'); closeSheet(); toast(v > 0 ? 'Budget saved' : 'Budget removed');
  },
  list() {
    const name = val('li-name'); if (!name) return;
    const s = spaceById(val('li-space')); if (!s) return;
    db.shopping.push({ id: uid(), spaceId: s.id, group: val('li-group') || 'General', name, store: '', area: '', price: null, purchased: false, date: null });
    ensureModule(s, 'shopping'); log(s.id, 'List item added');
    closeSheet(); toast(`Added to ${s.name}`);
  },
  goal() {
    const title = val('gl-title'), target = parseAmount(val('gl-target')), s = spaceById(val('gl-space'));
    if (!title || !(target > 0) || !s) { toast('Add a goal and a target above 0'); return; }
    db.goals.push({ id: uid(), spaceId: s.id, title, target, progress: 0, unit: val('gl-unit') });
    ensureModule(s, 'goals'); log(s.id, 'Goal created');
    closeSheet(); toast('Goal saved');
  },
  'goal-progress'(f) { const g = db.goals.find(x => x.id === f.dataset.id); if (!g) return; g.progress = Math.max(0, parseAmount(val('gp-val'))); log(g.spaceId, 'Goal updated'); closeSheet(); },
  item() {
    const name = val('it-name'); if (!name) return;
    const st = sheet.state, price = parseAmount(val('it-price'));
    const data = { name, store: val('it-store'), area: val('it-area'), price: price > 0 ? price : null, group: val('it-group') || 'General' };
    if (st.id) Object.assign(db.shopping.find(x => x.id === st.id), data);
    else { db.shopping.push({ id: uid(), spaceId: st.space, purchased: false, date: null, ...data }); ensureModule(spaceById(st.space), 'shopping'); }
    closeSheet(); toast(st.id ? 'Item updated' : 'Item added');
  },
  event() {
    const title = val('ev-title'), date = val('ev-date'); if (!title || !date) return;
    const kind = (document.querySelector('input[name="ev-kind"]:checked') || {}).value || 'other';
    const allDay = $('#ev-allday').checked, st = val('ev-start') || '09:00', en = val('ev-end');
    const sid = sheet.state.space;
    db.events.push({ id: uid(), spaceId: sid, kind, title, start: combine(date, allDay ? '00:00' : st), end: !allDay && en ? combine(date, en) : null, allDay });
    const s = spaceById(sid); if (s && (kind === 'flight' || kind === 'hotel')) ensureModule(s, kind === 'flight' ? 'flights' : 'hotel');
    log(sid, 'Plan added'); closeSheet(); toast('Plan added');
  },
  contact() {
    const name = val('ct-name'); if (!name) return;
    db.contacts.push({ id: uid(), spaceId: sheet.state.space, name, role: val('ct-role'), phone: val('ct-phone'), notes: val('ct-notes') });
    closeSheet(); toast('Contact saved');
  },
  profile() {
    const name = val('pf-name'), first = val('pf-first'); if (!name || !first) return;
    Object.assign(db.user, { name, first, title: val('pf-title') }); closeSheet(); toast('Profile saved');
  },
  restore() {
    try {
      const d = JSON.parse(($('#bk-text') || {}).value || '');
      if (!d || d.v !== 1 || !Array.isArray(d.spaces)) throw new Error('bad');
      db = d; applyTheme(); closeSheet({ rerender: false }); nav.tab('today'); toast('Backup restored');
    } catch (e) { sheet.state.err = 'That doesn’t look like a MEO backup. Copy the full backup text and try again.'; refreshSheet(); }
  },
};

/* ================= Events ================= */
function updateSearch() { const box = $('#search-results'); if (box) box.innerHTML = searchResults(nav.cur.params); }
phone.addEventListener('click', e => {
  if (e.target.closest('a[href]')) return;
  const el = e.target.closest('[data-a]');
  if (!el || !phone.contains(el) || el.disabled) return;
  const fn = A[el.dataset.a];
  if (!fn) return;
  if (el.tagName === 'LABEL') return;
  e.preventDefault();
  e.stopPropagation();
  fn(el.dataset, el, e);
});
phone.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-a]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet) closeSheet(); });
phone.addEventListener('submit', e => { e.preventDefault(); const f = e.target; const fn = F[f.dataset.form]; if (fn) fn(f); save(); });
phone.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'spaces-q') { nav.cur.params.q = el.value; $('#sgrid').innerHTML = spaceGrid(el.value); return; }
  if (el.id === 'search-q') {
    nav.cur.params.q = el.value;
    if (!el.value) nav.cur.params.filter = nav.cur.params.filter || 'all';
    updateSearch();
    return;
  }
  if (el.id === 'place-q') { draft().q = el.value; $('#place-results').innerHTML = placeResults(draft()); return; }
  if (el.id === 'picker-q') { sheet.state.q = el.value; $('#picker-list').innerHTML = spacePickerRows(sheet.state); return; }
  if (el.dataset.sheetBind && sheet) { sheet.state[el.dataset.sheetBind] = el.value; return; }
  if (el.dataset.bind) {
    const d = draft(); if (!d) return;
    d[el.dataset.bind] = el.value;
    if (el.dataset.count) { const c = $('#' + el.dataset.count); if (c) c.textContent = `${el.value.length}/${el.dataset.max}`; }
    if (el.id === 'exp-amount') el.style.width = Math.max(2, el.value.length + 1) + 'ch';
    if (el.dataset.live) refreshFooter();
  }
});
phone.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.bind && el.dataset.rerender) { const d = draft(); if (d) { d[el.dataset.bind] = el.value; render(); } return; }
  if (el.dataset.file === 'receipt' && el.files[0]) { draft().receipt = el.files[0].name; render(); return; }
  if (el.dataset.file === 'cover' && el.files[0]) {
    readImage(el.files[0]).then(url => { const d = draft(); d.coverImg = url; d.cover = null; render(); }).catch(() => toast('That image could not be read. Try a JPG or PNG.'));
  }
});
function readImage(file, max = 1000) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', .8));
      };
      img.onerror = rej; img.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
view.addEventListener('animationend', () => view.classList.remove('anim-push', 'anim-pop'));

/* ================= Theme + boot ================= */
const hostTheme = document.documentElement.getAttribute('data-theme');
function applyTheme() {
  const a = db.user.prefs.appearance;
  if (a === 'light' || a === 'dark') document.documentElement.setAttribute('data-theme', a);
  else if (hostTheme) document.documentElement.setAttribute('data-theme', hostTheme);
  else document.documentElement.removeAttribute('data-theme');
}
tabbar.innerHTML = `<div class="tabs" role="tablist">${[['today', 'Today', 'home'], ['spaces', 'Spaces', 'layers'], ['insights', 'Insights', 'chart'], ['profile', 'Profile', 'user']].map(([k, l, i]) => `<button class="tab" data-a="tab" data-to="${k}">${icon(i)}<span>${l}</span></button>`).join('')}</div>
  <button class="fab" data-a="fab" aria-label="Add">${icon('plus')}</button>`;
tabbar.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (el) { e.stopPropagation(); A[el.dataset.a](el.dataset, el, e); } });
applyTheme();
render();
})();
