/* ===== Sparhamster – Finanztracker ===== */
const STORAGE_KEY = 'sparhamster_v1';
const SW_VERSION = 'v1';

const DEFAULT_EXPENSE_CATS = [
  {id:'essen', name:'Essen & Trinken', em:'🍔', color:'#e08e5b'},
  {id:'wohnen', name:'Wohnen', em:'🏠', color:'#4f8fc0'},
  {id:'transport', name:'Transport', em:'🚗', color:'#8b7ec8'},
  {id:'shopping', name:'Shopping', em:'🛍️', color:'#d97a6c'},
  {id:'freizeit', name:'Freizeit', em:'🎉', color:'#5fae8c'},
  {id:'gesundheit', name:'Gesundheit', em:'💊', color:'#c8a13a'},
  {id:'bildung', name:'Bildung', em:'📚', color:'#4fa8a8'},
  {id:'reisen', name:'Reisen', em:'✈️', color:'#c87ea0'},
  {id:'abos', name:'Abos', em:'🔁', color:'#7e93c8'},
  {id:'geschenke_a', name:'Geschenke', em:'🎁', color:'#e0a5c8'},
  {id:'sonstiges_a', name:'Sonstiges', em:'📦', color:'#a7a294'},
];
const DEFAULT_INCOME_CATS = [
  {id:'gehalt', name:'Gehalt', em:'💼', color:'#5fae8c'},
  {id:'nebenjob', name:'Nebenjob', em:'💰', color:'#c8a13a'},
  {id:'foerderung', name:'BAföG/Stip.', em:'🎓', color:'#4f8fc0'},
  {id:'geschenk_e', name:'Geschenk', em:'🎁', color:'#e0a5c8'},
  {id:'kapital', name:'Kapitalerträge', em:'📈', color:'#8b7ec8'},
  {id:'sonstiges_e', name:'Sonstiges', em:'📦', color:'#a7a294'},
];
const ACCOUNT_TYPES = [
  {id:'bargeld', name:'Bargeld', em:'💵', counts:false},
  {id:'giro', name:'Girokonto', em:'🏦', counts:false},
  {id:'spar', name:'Sparkonto', em:'💰', counts:true},
  {id:'depot', name:'Depot', em:'📈', counts:true},
  {id:'sonstiges', name:'Sonstiges', em:'📦', counts:true},
];
const THEMES = [
  {id:'mint', color:'#5fae8c'},
  {id:'lavendel', color:'#8b7ec8'},
  {id:'pfirsich', color:'#e08e5b'},
  {id:'blau', color:'#4f8fc0'},
  {id:'gold', color:'#c8a13a'},
];

function defaultState(){
  return {
    meta:{appName:'Sparhamster'},
    ui:{theme:'mint', mode:'auto', tab:'heute', calMonth: ymOf(new Date())},
    categories:{expense: clone(DEFAULT_EXPENSE_CATS), income: clone(DEFAULT_INCOME_CATS)},
    accounts:[],
    transactions:[],
    budgets:{},
    savingsGoal:{name:'Notgroschen', target:null, targetDate:null},
    netWorthGoal:{target:null},
    companion:{bestStreak:0}
  };
}
function clone(x){return JSON.parse(JSON.stringify(x));}

let state = load();
function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const d = defaultState();
    return Object.assign(d, parsed, {
      meta: Object.assign(d.meta, parsed.meta),
      ui: Object.assign(d.ui, parsed.ui),
      categories: parsed.categories || d.categories,
      savingsGoal: Object.assign(d.savingsGoal, parsed.savingsGoal),
      netWorthGoal: Object.assign(d.netWorthGoal, parsed.netWorthGoal),
      companion: Object.assign(d.companion, parsed.companion),
    });
  }catch(e){ console.error('load failed', e); return defaultState(); }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* ---------- helpers ---------- */
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function pad2(n){ return String(n).padStart(2,'0'); }
function isoDate(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function ymOf(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1); }
function today(){ return isoDate(new Date()); }
function fmtMoney(n){
  n = Number(n)||0;
  return n.toLocaleString('de-DE',{style:'currency',currency:'EUR'});
}
function fmtMoneyShort(n){
  n = Number(n)||0;
  const sign = n<0?'-':'';
  const abs = Math.abs(n);
  if(abs>=1000) return sign+(abs/1000).toLocaleString('de-DE',{maximumFractionDigits:1})+'k €';
  return sign+abs.toLocaleString('de-DE',{maximumFractionDigits:0})+' €';
}
function fmtDateHuman(iso){
  const [y,m,d] = iso.split('-').map(Number);
  const dt = new Date(y,m-1,d);
  return dt.toLocaleDateString('de-DE',{day:'2-digit', month:'long', year:'numeric'});
}
function fmtDateShort(iso){
  const [y,m,d] = iso.split('-').map(Number);
  return pad2(d)+'.'+pad2(m)+'.';
}
function monthLabel(ym){
  const [y,m] = ym.split('-').map(Number);
  return new Date(y,m-1,1).toLocaleDateString('de-DE',{month:'long', year:'numeric'});
}
function addMonths(ym, delta){
  let [y,m] = ym.split('-').map(Number);
  m += delta;
  while(m>12){m-=12;y++;}
  while(m<1){m+=12;y--;}
  return y+'-'+pad2(m);
}
function daysInMonth(ym){
  const [y,m] = ym.split('-').map(Number);
  return new Date(y,m,0).getDate();
}
function allCats(){ return state.categories.expense.concat(state.categories.income); }
function catById(id){ return allCats().find(c=>c.id===id); }
function accById(id){ return state.accounts.find(a=>a.id===id); }
function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------- derived data ---------- */
function txForMonth(ym){ return state.transactions.filter(t=>t.date.slice(0,7)===ym); }
function txForDay(iso){ return state.transactions.filter(t=>t.date===iso); }
function sumType(txs, type){ return txs.filter(t=>t.type===type).reduce((s,t)=>s+t.amount,0); }

function monthSpentByCat(ym, catId){
  return txForMonth(ym).filter(t=>t.type==='expense' && t.catId===catId).reduce((s,t)=>s+t.amount,0);
}
function currentNetWorth(){
  return state.accounts.reduce((sum,a)=>{
    const last = latestBalance(a);
    return sum + (last==null?0:last);
  },0);
}
function currentSavings(){
  return state.accounts.filter(a=>a.counts).reduce((sum,a)=>{
    const last = latestBalance(a);
    return sum + (last==null?0:last);
  },0);
}
function latestBalance(acc){
  if(!acc.history || !acc.history.length) return null;
  const sorted = [...acc.history].sort((a,b)=>a.date.localeCompare(b.date));
  return sorted[sorted.length-1].balance;
}
function balanceAt(acc, iso){
  if(!acc.history || !acc.history.length) return null;
  const sorted = [...acc.history].sort((a,b)=>a.date.localeCompare(b.date));
  let val = null;
  for(const h of sorted){ if(h.date<=iso) val = h.balance; else break; }
  return val;
}
function netWorthSeries(){
  const dates = new Set();
  state.accounts.forEach(a=>(a.history||[]).forEach(h=>dates.add(h.date)));
  const sorted = [...dates].sort();
  return sorted.map(date=>{
    const total = state.accounts.reduce((s,a)=>s+(balanceAt(a,date)||0),0);
    return {date, total};
  });
}

/* streak: consecutive past days (ending yesterday) with at least one logged transaction
   and total expense that day not exceeding the derived daily budget */
function dailyBudgetTotal(){
  const vals = Object.values(state.budgets).filter(v=>v>0);
  if(!vals.length) return null;
  const total = vals.reduce((a,b)=>a+b,0);
  return total/30;
}
function computeStreak(){
  const dBudget = dailyBudgetTotal();
  let streak = 0;
  let d = new Date(); d.setDate(d.getDate()-1); // start yesterday
  for(let i=0;i<3650;i++){
    const iso = isoDate(d);
    const txs = txForDay(iso);
    if(txs.length===0) break; // no log -> streak ends (grace only applies to today, not past)
    const spent = sumType(txs,'expense');
    if(dBudget!=null && spent>dBudget) break;
    streak++;
    d.setDate(d.getDate()-1);
  }
  // include today bonus display separately; today doesn't break streak if empty
  if(streak>state.companion.bestStreak){ state.companion.bestStreak = streak; save(); }
  return streak;
}
function companionStage(streak){
  if(streak>=60) return 3;
  if(streak>=21) return 2;
  if(streak>=7) return 1;
  return 0;
}

/* ---------- toast / modal ---------- */
let toastTimer=null;
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 2200);
}
function openModal(html){
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-overlay" data-close-modal><div class="modal-sheet" data-stop>${html}</div></div>`;
  root.querySelector('[data-close-modal]').addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close-modal')) closeModal(); });
  root.querySelector('[data-stop]').addEventListener('click', e=>e.stopPropagation());
  bindDynamic(root);
}
function closeModal(){ document.getElementById('modalRoot').innerHTML=''; }

/* ---------- companion SVG ---------- */
function companionSvg(stage, mood){
  const bodyColor = ['#d9a875','#e0b485','#e6c095','#f0d3a8'][stage];
  const cheek = mood==='sad' ? '#e6a89a' : '#f2b6a8';
  const eyes = mood==='sad'
    ? `<path d="M28 33 Q31 36 34 33" stroke="#3a2c1e" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M42 33 Q45 36 48 33" stroke="#3a2c1e" stroke-width="2" fill="none" stroke-linecap="round"/>`
    : `<circle cx="31" cy="33" r="2.6" fill="#3a2c1e"/><circle cx="45" cy="33" r="2.6" fill="#3a2c1e"/>`;
  const accessory = stage>=2 ? `<path d="M20 20 Q38 6 56 20" stroke="#c8a13a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="38" cy="10" r="4" fill="#c8a13a"/>` : '';
  const crown = stage>=3 ? `<path d="M24 16 L30 24 L38 12 L46 24 L52 16 L50 27 L26 27 Z" fill="#e8cb84" stroke="#c8a13a" stroke-width="1.5"/>` : '';
  return `<svg class="companion-svg" viewBox="0 0 76 76" xmlns="http://www.w3.org/2000/svg" width="76" height="76">
    <ellipse cx="38" cy="44" rx="26" ry="22" fill="${bodyColor}"/>
    <ellipse cx="20" cy="24" rx="8" ry="8" fill="${bodyColor}"/>
    <ellipse cx="56" cy="24" rx="8" ry="8" fill="${bodyColor}"/>
    <ellipse cx="20" cy="25" rx="4" ry="4" fill="#f2d9b8"/>
    <ellipse cx="56" cy="25" rx="4" ry="4" fill="#f2d9b8"/>
    <ellipse cx="38" cy="38" rx="24" ry="20" fill="${bodyColor}"/>
    <ellipse cx="22" cy="42" rx="8" ry="6" fill="${cheek}"/>
    <ellipse cx="54" cy="42" rx="8" ry="6" fill="${cheek}"/>
    ${eyes}
    <ellipse cx="38" cy="40" rx="3" ry="2.4" fill="#3a2c1e"/>
    <path d="M34 46 Q38 49 42 46" stroke="#3a2c1e" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    ${accessory}${crown}
  </svg>`;
}
function companionMoodText(streak, stage){
  const stageNames=['Baby-Hamster','Backentaschen-Hamster','Sparhamster mit Krönchen','Gold-Hamster'];
  if(streak===0) return {mood:'sad', text: stageNames[stage]+' • noch kein Streak – heute eintragen?'};
  return {mood:'happy', text: stageNames[stage]+' • '+streak+' Tag'+(streak===1?'':'e')+' im Rahmen'};
}

/* ---------- rendering ---------- */
function render(){
  document.body.setAttribute('data-theme', state.ui.theme);
  applyDarkMode();
  document.getElementById('brandName').textContent = state.meta.appName;
  document.getElementById('brandIcon').innerHTML = companionSvg(0,'happy').replace('width="76" height="76"','width="34" height="34"').replace('class="companion-svg"','');
  const nw = currentNetWorth();
  document.getElementById('netPill').textContent = state.accounts.length? fmtMoneyShort(nw) : '＋ Konto anlegen';

  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===state.ui.tab));

  const app = document.getElementById('app');
  const tab = state.ui.tab;
  if(tab==='heute') app.innerHTML = renderHeute();
  else if(tab==='kalender') app.innerHTML = renderKalender();
  else if(tab==='budget') app.innerHTML = renderBudget();
  else if(tab==='vermoegen') app.innerHTML = renderVermoegen();
  else if(tab==='trends') app.innerHTML = renderTrends();
  else if(tab==='einstellungen') app.innerHTML = renderEinstellungen();
  bindDynamic(app);
}
function applyDarkMode(){
  let mode = state.ui.mode;
  if(mode==='auto') mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light';
  document.body.setAttribute('data-mode', mode);
}

function renderHeute(){
  const streak = computeStreak();
  const stage = companionStage(streak);
  const {mood, text} = companionMoodText(streak, stage);
  const ym = ymOf(new Date());
  const todTx = txForDay(today());
  const monTx = txForMonth(ym);
  const tIncome = sumType(todTx,'income'), tExpense = sumType(todTx,'expense');
  const mIncome = sumType(monTx,'income'), mExpense = sumType(monTx,'expense');

  return `
  <div class="card companion-card">
    ${companionSvg(stage, mood)}
    <div class="companion-info">
      <div class="companion-name">${escapeHtml(state.meta.appName)}</div>
      <div class="companion-mood">${text}</div>
      <div class="streak-badge">🔥 Bester Streak: ${state.companion.bestStreak} Tage</div>
    </div>
  </div>

  <button class="btn-primary" data-action="open-tx-form" data-date="${today()}">+ Buchung erfassen</button>

  <div class="section-title">Heute</div>
  <div class="card">
    <div class="stat-row">
      <div class="stat-box income"><div class="val">${fmtMoneyShort(tIncome)}</div><div class="lbl">Einnahmen</div></div>
      <div class="stat-box expense"><div class="val">${fmtMoneyShort(tExpense)}</div><div class="lbl">Ausgaben</div></div>
    </div>
  </div>
  ${renderTxList(todTx, 'Heute noch keine Buchungen', '🧾')}

  <div class="section-title">${monthLabel(ym)}</div>
  <div class="card">
    <div class="stat-row">
      <div class="stat-box income"><div class="val">${fmtMoneyShort(mIncome)}</div><div class="lbl">Einnahmen</div></div>
      <div class="stat-box expense"><div class="val">${fmtMoneyShort(mExpense)}</div><div class="lbl">Ausgaben</div></div>
      <div class="stat-box"><div class="val">${fmtMoneyShort(mIncome-mExpense)}</div><div class="lbl">Netto</div></div>
    </div>
  </div>
  `;
}

function renderTxList(txs, emptyText, emptyIcon){
  if(!txs.length){
    return `<div class="card empty-state"><div class="badge">${emptyIcon}</div><p>${emptyText}</p></div>`;
  }
  const sorted = [...txs].sort((a,b)=> b.date.localeCompare(a.date) || (b._t||0)-(a._t||0));
  return `<div class="card">${sorted.map(t=>{
    const c = catById(t.catId) || {em:'❓',name:'?',color:'#aaa'};
    const acc = t.accountId ? accById(t.accountId):null;
    return `<div class="tx-item" data-action="open-tx-edit" data-id="${t.id}">
      <div class="tx-icon" style="background:${c.color}22;">${c.em}</div>
      <div class="tx-main">
        <div class="tx-cat">${escapeHtml(c.name)}</div>
        <div class="tx-note">${escapeHtml(t.note||'')}${acc?(t.note?' · ':'')+escapeHtml(acc.name):''}</div>
      </div>
      <div class="tx-amount ${t.type}">${t.type==='expense'?'-':'+'}${fmtMoney(t.amount)}</div>
    </div>`;
  }).join('')}</div>`;
}

function txFormHtml(existing, presetDate){
  const type = existing? existing.type : 'expense';
  const catId = existing? existing.catId : null;
  const amount = existing? existing.amount : '';
  const note = existing? existing.note||'' : '';
  const date = existing? existing.date : (presetDate||today());
  const accountId = existing? existing.accountId||'' : '';
  return `
  <div class="modal-handle"></div>
  <div class="modal-title">${existing?'Buchung bearbeiten':'Neue Buchung'}</div>
  <form data-form="tx" data-id="${existing?existing.id:''}">
    <div class="type-toggle">
      <button type="button" class="${type==='expense'?'active expense':''}" data-toggle-type="expense">Ausgabe</button>
      <button type="button" class="${type==='income'?'active income':''}" data-toggle-type="income">Einnahme</button>
    </div>
    <input type="hidden" name="type" value="${type}">
    <div class="field">
      <label>Kategorie</label>
      <div class="cat-grid" data-cat-grid>${renderCatGrid(type, catId)}</div>
      <input type="hidden" name="catId" value="${catId||''}">
    </div>
    <div class="field"><label>Betrag (€)</label><input name="amount" type="number" step="0.01" min="0" inputmode="decimal" value="${amount}" required></div>
    <div class="field"><label>Datum</label><input name="date" type="date" value="${date}" required></div>
    <div class="field"><label>Konto (optional)</label>
      <select name="accountId"><option value="">– kein Konto –</option>
        ${state.accounts.map(a=>`<option value="${a.id}" ${a.id===accountId?'selected':''}>${a.em} ${escapeHtml(a.name)}</option>`).join('')}
      </select>
    </div>
    <div class="field"><label>Notiz (optional)</label><input name="note" type="text" value="${escapeHtml(note)}" placeholder="z. B. Wocheneinkauf"></div>
    <button type="submit" class="btn-primary">Speichern</button>
    ${existing?`<button type="button" class="btn-secondary" data-action="delete-tx" data-id="${existing.id}" style="color:var(--danger)">Buchung löschen</button>`:''}
  </form>`;
}
function renderCatGrid(type, activeId){
  const cats = type==='expense'? state.categories.expense : state.categories.income;
  return cats.map(c=>`<div class="cat-chip ${c.id===activeId?'active':''}" data-pick-cat="${c.id}"><span class="em">${c.em}</span>${escapeHtml(c.name)}</div>`).join('');
}

function renderKalender(){
  const ym = state.ui.calMonth;
  const [y,m] = ym.split('-').map(Number);
  const first = new Date(y,m-1,1);
  const startDow = (first.getDay()+6)%7; // Monday=0
  const dim = daysInMonth(ym);
  const monTx = txForMonth(ym);
  const byDay = {};
  monTx.forEach(t=>{ (byDay[t.date]=byDay[t.date]||[]).push(t); });
  const todayIso = today();
  const dows = ['Mo','Di','Mi','Do','Fr','Sa','So'];

  let cells = '';
  for(let i=0;i<startDow;i++) cells += `<div class="cal-day empty"></div>`;
  for(let d=1; d<=dim; d++){
    const iso = y+'-'+pad2(m)+'-'+pad2(d);
    const txs = byDay[iso]||[];
    const net = sumType(txs,'income')-sumType(txs,'expense');
    let cls = 'cal-day';
    if(iso===todayIso) cls+=' today';
    if(iso>todayIso) cls+=' future';
    if(txs.length){ cls += net>=0?' pos':' neg'; }
    cells += `<div class="${cls}" data-action="open-day" data-date="${iso}">${d}${txs.length?'<div class="dot"></div>':''}</div>`;
  }
  const mIncome=sumType(monTx,'income'), mExpense=sumType(monTx,'expense');
  return `
  <div class="card">
    <div class="cal-header">
      <button class="cal-nav" data-action="cal-prev">‹</button>
      <h2 style="font-size:16px">${monthLabel(ym)}</h2>
      <button class="cal-nav" data-action="cal-next">›</button>
    </div>
    <div class="cal-grid">${dows.map(d=>`<div class="cal-dow">${d}</div>`).join('')}${cells}</div>
  </div>
  <div class="card">
    <div class="stat-row">
      <div class="stat-box income"><div class="val">${fmtMoneyShort(mIncome)}</div><div class="lbl">Einnahmen</div></div>
      <div class="stat-box expense"><div class="val">${fmtMoneyShort(mExpense)}</div><div class="lbl">Ausgaben</div></div>
      <div class="stat-box"><div class="val">${fmtMoneyShort(mIncome-mExpense)}</div><div class="lbl">Netto</div></div>
    </div>
  </div>`;
}
function dayModalHtml(iso){
  const txs = txForDay(iso);
  return `<div class="modal-handle"></div>
  <div class="modal-title">${fmtDateHuman(iso)}</div>
  ${renderTxList(txs,'Keine Buchungen an diesem Tag','🧾')}
  <button class="btn-primary" style="margin-top:14px" data-action="open-tx-form" data-date="${iso}">+ Buchung für diesen Tag</button>`;
}

function renderBudget(){
  const ym = ymOf(new Date());
  const rows = state.categories.expense.map(c=>{
    const limit = state.budgets[c.id]||0;
    const spent = monthSpentByCat(ym,c.id);
    const pct = limit>0? Math.min(100, spent/limit*100) : 0;
    const over = limit>0 && spent>limit;
    const warn = limit>0 && !over && spent/limit>0.85;
    return `<div class="budget-row" data-action="open-budget-edit" data-cat="${c.id}">
      <div class="budget-row-top"><span class="cat">${c.em} ${escapeHtml(c.name)}</span>
        <span class="amt">${fmtMoneyShort(spent)}${limit>0?' / '+fmtMoneyShort(limit):''}</span></div>
      <div class="bar-track"><div class="bar-fill ${over?'over':warn?'warn':''}" style="width:${limit>0?pct:(spent>0?100:0)}%"></div></div>
    </div>`;
  }).join('');

  const savings = currentSavings();
  const sg = state.savingsGoal;
  let sgProgress = '', sgProjection='';
  if(sg.target){
    const pct = Math.min(100, savings/sg.target*100);
    sgProgress = `<div class="bar-track" style="margin-top:10px"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--text-soft);margin-top:6px;">
        <span>${fmtMoney(savings)}</span><span>Ziel: ${fmtMoney(sg.target)}</span></div>`;
    const proj = projectGoalDate(sg.target, savings);
    if(proj) sgProjection = `<small class="hint">📈 Bei aktuellem Tempo ca. erreicht am ${proj}</small>`;
  } else {
    sgProgress = `<small class="hint">Noch kein Sparziel gesetzt – aktuell gespart: ${fmtMoney(savings)}</small>`;
  }

  return `
  <div class="section-title">Sparziel</div>
  <div class="card" data-action="open-goal-edit">
    <h2>🎯 ${escapeHtml(sg.name||'Sparziel')}</h2>
    ${sgProgress}${sgProjection}
  </div>
  <div class="section-title">Monatsbudgets</div>
  <div class="card">${rows}</div>
  <small class="hint" style="margin:6px 4px 0;">Tippe eine Kategorie an, um ein monatliches Limit zu setzen.</small>
  `;
}
function projectGoalDate(target, current){
  // average monthly net (income-expense) over last 3 full months
  const now = new Date();
  let sumNet=0, months=0;
  for(let i=1;i<=3;i++){
    const ym = addMonths(ymOf(now), -i);
    const tx = txForMonth(ym);
    if(tx.length){ sumNet += sumType(tx,'income')-sumType(tx,'expense'); months++; }
  }
  if(months===0) return null;
  const avg = sumNet/months;
  if(avg<=0) return null;
  const remaining = target-current;
  if(remaining<=0) return 'bereits erreicht 🎉';
  const monthsNeeded = Math.ceil(remaining/avg);
  const d = new Date(); d.setMonth(d.getMonth()+monthsNeeded);
  return d.toLocaleDateString('de-DE',{month:'long', year:'numeric'});
}
function goalModalHtml(){
  const sg = state.savingsGoal;
  return `<div class="modal-handle"></div><div class="modal-title">Sparziel bearbeiten</div>
  <form data-form="goal">
    <div class="field"><label>Name</label><input name="name" value="${escapeHtml(sg.name||'')}" placeholder="z. B. Notgroschen"></div>
    <div class="field"><label>Zielbetrag (€)</label><input name="target" type="number" step="1" min="0" value="${sg.target||''}"></div>
    <button type="submit" class="btn-primary">Speichern</button>
  </form>`;
}
function budgetEditModalHtml(catId){
  const c = catById(catId);
  const cur = state.budgets[catId]||'';
  return `<div class="modal-handle"></div><div class="modal-title">${c.em} ${escapeHtml(c.name)} – Budget</div>
  <form data-form="budget" data-cat="${catId}">
    <div class="field"><label>Monatslimit (€) – 0 für kein Limit</label><input name="limit" type="number" step="1" min="0" value="${cur}" autofocus></div>
    <button type="submit" class="btn-primary">Speichern</button>
  </form>`;
}

function renderVermoegen(){
  const nw = currentNetWorth();
  const series = netWorthSeries();
  const goal = state.netWorthGoal;
  let goalHtml = '';
  if(goal.target){
    const pct = Math.min(100, nw/goal.target*100);
    goalHtml = `<div class="bar-track" style="margin-top:10px"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--text-soft);margin-top:6px;">
        <span>${fmtMoney(nw)}</span><span>Ziel: ${fmtMoney(goal.target)}</span></div>`;
  }
  const accRows = state.accounts.map(a=>{
    const bal = latestBalance(a);
    return `<div class="acc-item" data-action="open-acc-detail" data-id="${a.id}">
      <div class="acc-icon">${a.em}</div>
      <div class="acc-main"><div class="acc-name">${escapeHtml(a.name)}</div><div class="acc-type">${ACCOUNT_TYPES.find(t=>t.id===a.type)?.name||a.type}</div></div>
      <div class="acc-balance">${bal==null?'–':fmtMoney(bal)}</div>
    </div>`;
  }).join('');

  return `
  <div class="card" data-action="open-networth-goal">
    <h2>💰 Gesamtvermögen</h2>
    <div style="font-size:26px;font-weight:800;">${fmtMoney(nw)}</div>
    ${goalHtml || '<small class="hint">Tippe hier, um ein Vermögensziel zu setzen</small>'}
    ${series.length>1? chartLine(series) : ''}
  </div>
  <div class="section-title">Konten</div>
  <div class="card">
    ${accRows || `<div class="empty-state"><div class="badge">🏦</div><p>Noch keine Konten angelegt</p></div>`}
  </div>
  <button class="btn-primary" data-action="open-acc-new">+ Konto hinzufügen</button>
  `;
}
function chartLine(series){
  const w=460,h=90,pad=8;
  const vals = series.map(s=>s.total);
  const min = Math.min(...vals,0), max = Math.max(...vals,1);
  const range = (max-min)||1;
  const step = (w-2*pad)/Math.max(1,series.length-1);
  const pts = series.map((s,i)=>{
    const x = pad+i*step;
    const y = h-pad-((s.total-min)/range)*(h-2*pad);
    return x+','+y;
  }).join(' ');
  const accentVar = 'var(--accent)';
  return `<div class="chart-wrap" style="margin-top:14px;"><svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none">
    <polyline points="${pts}" fill="none" stroke="${accentVar}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg></div>`;
}
function accDetailHtml(id){
  const a = accById(id);
  const hist = [...(a.history||[])].sort((x,y)=>y.date.localeCompare(x.date));
  return `<div class="modal-handle"></div><div class="modal-title">${a.em} ${escapeHtml(a.name)}</div>
  <form data-form="acc-balance" data-id="${a.id}">
    <div class="field"><label>Neuer Kontostand (€)</label><input name="balance" type="number" step="0.01" required></div>
    <div class="field"><label>Datum</label><input name="date" type="date" value="${today()}" required></div>
    <button type="submit" class="btn-primary">Speichern</button>
  </form>
  <div class="section-title">Verlauf</div>
  ${hist.length? `<div class="card">${hist.map(h=>`<div class="tx-item"><div class="tx-main"><div class="tx-cat">${fmtDateShort(h.date)}</div></div><div class="tx-amount">${fmtMoney(h.balance)}</div></div>`).join('')}</div>` : '<div class="card empty-state"><p>Noch keine Einträge</p></div>'}
  <button class="btn-secondary" style="color:var(--danger)" data-action="delete-acc" data-id="${a.id}">Konto löschen</button>
  `;
}
function accNewHtml(){
  return `<div class="modal-handle"></div><div class="modal-title">Neues Konto</div>
  <form data-form="acc-new">
    <div class="field"><label>Name</label><input name="name" required placeholder="z. B. Tagesgeld"></div>
    <div class="field"><label>Typ</label><select name="type">${ACCOUNT_TYPES.map(t=>`<option value="${t.id}">${t.em} ${t.name}</option>`).join('')}</select></div>
    <div class="field"><label>Startkontostand (€, optional)</label><input name="balance" type="number" step="0.01"></div>
    <button type="submit" class="btn-primary">Anlegen</button>
  </form>`;
}
function networthGoalHtml(){
  return `<div class="modal-handle"></div><div class="modal-title">Vermögensziel</div>
  <form data-form="networth-goal">
    <div class="field"><label>Zielbetrag (€)</label><input name="target" type="number" step="1" min="0" value="${state.netWorthGoal.target||''}"></div>
    <button type="submit" class="btn-primary">Speichern</button>
  </form>`;
}

function renderTrends(){
  const now = new Date();
  const months = [];
  for(let i=5;i>=0;i--) months.push(addMonths(ymOf(now), -i));
  const maxVal = Math.max(1, ...months.map(ym=>{
    const tx = txForMonth(ym);
    return Math.max(sumType(tx,'income'), sumType(tx,'expense'));
  }));
  const barsHtml = months.map(ym=>{
    const tx = txForMonth(ym);
    const inc = sumType(tx,'income'), exp = sumType(tx,'expense');
    const label = new Date(...ym.split('-').map((v,i)=>i===1?v-1:v)).toLocaleDateString('de-DE',{month:'short'});
    return `<div style="text-align:center;flex:1;">
      <div style="display:flex;align-items:flex-end;justify-content:center;gap:3px;height:80px;">
        <div style="width:10px;border-radius:4px 4px 0 0;background:var(--income);height:${Math.max(2,inc/maxVal*80)}px;" title="Einnahmen"></div>
        <div style="width:10px;border-radius:4px 4px 0 0;background:var(--danger);height:${Math.max(2,exp/maxVal*80)}px;" title="Ausgaben"></div>
      </div>
      <div style="font-size:10.5px;color:var(--text-faint);margin-top:5px;font-weight:600;">${label}</div>
    </div>`;
  }).join('');

  const curYm = ymOf(now);
  const curTx = txForMonth(curYm);
  const catSums = {};
  curTx.filter(t=>t.type==='expense').forEach(t=>{ catSums[t.catId]=(catSums[t.catId]||0)+t.amount; });
  const sortedCats = Object.entries(catSums).sort((a,b)=>b[1]-a[1]);
  const maxCat = sortedCats.length? sortedCats[0][1] : 1;
  const catBars = sortedCats.map(([id,val])=>{
    const c = catById(id)||{em:'❓',name:id,color:'#aaa'};
    return `<div class="simple-bar-row">
      <div class="lbl">${c.em} ${escapeHtml(c.name)}</div>
      <div class="track"><div class="fill" style="width:${val/maxCat*100}%;background:${c.color};"></div></div>
      <div class="val">${fmtMoneyShort(val)}</div>
    </div>`;
  }).join('') || `<div class="empty-state"><div class="badge">📊</div><p>Noch keine Ausgaben diesen Monat</p></div>`;

  const mIncome = sumType(curTx,'income'), mExpense=sumType(curTx,'expense');
  const rate = mIncome>0 ? Math.round((mIncome-mExpense)/mIncome*100) : null;

  const loggedDays = new Set(state.transactions.map(t=>t.date)).size;

  return `
  <div class="section-title">Einnahmen vs. Ausgaben (6 Monate)</div>
  <div class="card">
    <div style="display:flex;gap:14px;font-size:12px;color:var(--text-soft);margin-bottom:10px;">
      <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(--income);margin-right:5px;"></span>Einnahmen</span>
      <span><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(--danger);margin-right:5px;"></span>Ausgaben</span>
    </div>
    <div style="display:flex;">${barsHtml}</div>
  </div>
  <div class="section-title">Kategorien – ${monthLabel(curYm)}</div>
  <div class="card">${catBars}</div>
  <div class="section-title">Kennzahlen</div>
  <div class="card">
    <div class="stat-row">
      <div class="stat-box"><div class="val">${rate==null?'–':rate+'%'}</div><div class="lbl">Sparquote</div></div>
      <div class="stat-box"><div class="val">${state.companion.bestStreak}</div><div class="lbl">Bester Streak</div></div>
      <div class="stat-box"><div class="val">${loggedDays}</div><div class="lbl">Tage geloggt</div></div>
    </div>
  </div>`;
}

function renderEinstellungen(){
  return `
  <div class="section-title">App</div>
  <div class="card">
    <div class="field"><label>Name</label><input id="setAppName" value="${escapeHtml(state.meta.appName)}"></div>
    <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-soft);margin-bottom:8px;">Farbe</label>
    <div class="theme-swatches">${THEMES.map(t=>`<div class="swatch ${t.id===state.ui.theme?'active':''}" style="background:${t.color}" data-set-theme="${t.id}"></div>`).join('')}</div>
    <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-soft);margin-bottom:8px;">Darstellung</label>
    <div class="toggle-row">
      <button data-set-mode="auto" class="${state.ui.mode==='auto'?'active':''}">Automatisch</button>
      <button data-set-mode="light" class="${state.ui.mode==='light'?'active':''}">Hell</button>
      <button data-set-mode="dark" class="${state.ui.mode==='dark'?'active':''}">Dunkel</button>
    </div>
  </div>

  <div class="section-title">Kategorien</div>
  <div class="card">
    <div class="row-between"><h2 style="margin:0">Ausgaben</h2><button class="icon-btn" data-action="add-cat" data-type="expense">+</button></div>
    <div class="cat-grid" style="margin-top:10px;">${state.categories.expense.map(c=>`<div class="cat-chip" data-action="del-cat" data-type="expense" data-id="${c.id}"><span class="em">${c.em}</span>${escapeHtml(c.name)}</div>`).join('')}</div>
  </div>
  <div class="card">
    <div class="row-between"><h2 style="margin:0">Einnahmen</h2><button class="icon-btn" data-action="add-cat" data-type="income">+</button></div>
    <div class="cat-grid" style="margin-top:10px;">${state.categories.income.map(c=>`<div class="cat-chip" data-action="del-cat" data-type="income" data-id="${c.id}"><span class="em">${c.em}</span>${escapeHtml(c.name)}</div>`).join('')}</div>
  </div>
  <small class="hint" style="margin:0 4px 0;">Tippe eine Kategorie an, um sie zu löschen.</small>

  <div class="section-title">Vermögensziel</div>
  <div class="card" data-action="open-networth-goal">
    <div class="row-between"><span>Ziel</span><strong>${state.netWorthGoal.target?fmtMoney(state.netWorthGoal.target):'nicht gesetzt'}</strong></div>
  </div>

  <div class="section-title">Daten</div>
  <div class="card">
    <button class="btn-secondary" data-action="export-data">⬇️ Backup exportieren (JSON)</button>
    <label class="btn-secondary" style="display:block;text-align:center;cursor:pointer;">⬆️ Backup importieren
      <input type="file" accept="application/json" id="importFile" style="display:none;">
    </label>
    <button class="btn-secondary" style="color:var(--danger)" data-action="reset-data">🗑️ Alle Daten zurücksetzen</button>
  </div>
  <small class="hint" style="text-align:center;display:block;margin-top:10px;">Alle Daten bleiben nur lokal auf diesem Gerät gespeichert.</small>
  `;
}

/* ---------- event binding ---------- */
function bindDynamic(root){
  root.querySelectorAll('[data-action]').forEach(el=>{
    el.addEventListener('click', onAction);
  });
  root.querySelectorAll('[data-toggle-type]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const form = el.closest('form');
      const type = el.dataset.toggleType;
      form.querySelector('[name=type]').value = type;
      form.querySelectorAll('.type-toggle button').forEach(b=>b.classList.remove('active','expense','income'));
      el.classList.add('active', type);
      form.querySelector('[data-cat-grid]').innerHTML = renderCatGrid(type, null);
      form.querySelector('[name=catId]').value='';
      bindCatPickers(form);
    });
  });
  root.querySelectorAll('form[data-form]').forEach(f=>bindCatPickers(f));
  root.querySelectorAll('[data-set-theme]').forEach(el=>el.addEventListener('click', ()=>{ state.ui.theme=el.dataset.setTheme; save(); render(); }));
  root.querySelectorAll('[data-set-mode]').forEach(el=>el.addEventListener('click', ()=>{ state.ui.mode=el.dataset.setMode; save(); render(); }));
  const nameInput = root.querySelector('#setAppName');
  if(nameInput) nameInput.addEventListener('change', ()=>{ state.meta.appName = nameInput.value.trim()||'Sparhamster'; save(); render(); });
  const importFile = root.querySelector('#importFile');
  if(importFile) importFile.addEventListener('change', handleImport);

  root.querySelectorAll('form[data-form=tx]').forEach(f=>f.addEventListener('submit', onTxSubmit));
  root.querySelectorAll('form[data-form=goal]').forEach(f=>f.addEventListener('submit', onGoalSubmit));
  root.querySelectorAll('form[data-form=budget]').forEach(f=>f.addEventListener('submit', onBudgetSubmit));
  root.querySelectorAll('form[data-form=acc-new]').forEach(f=>f.addEventListener('submit', onAccNewSubmit));
  root.querySelectorAll('form[data-form=acc-balance]').forEach(f=>f.addEventListener('submit', onAccBalanceSubmit));
  root.querySelectorAll('form[data-form=networth-goal]').forEach(f=>f.addEventListener('submit', onNetworthGoalSubmit));
}
function bindCatPickers(form){
  form.querySelectorAll('[data-pick-cat]').forEach(el=>{
    el.addEventListener('click', ()=>{
      form.querySelectorAll('[data-pick-cat]').forEach(x=>x.classList.remove('active'));
      el.classList.add('active');
      form.querySelector('[name=catId]').value = el.dataset.pickCat;
    });
  });
}

function onAction(e){
  const el = e.currentTarget;
  const a = el.dataset.action;
  if(a==='open-tx-form'){ openModal(txFormHtml(null, el.dataset.date)); }
  else if(a==='open-tx-edit'){ const t = state.transactions.find(x=>x.id===el.dataset.id); openModal(txFormHtml(t)); }
  else if(a==='delete-tx'){ state.transactions = state.transactions.filter(t=>t.id!==el.dataset.id); save(); closeModal(); render(); toast('Buchung gelöscht'); }
  else if(a==='cal-prev'){ state.ui.calMonth = addMonths(state.ui.calMonth,-1); render(); }
  else if(a==='cal-next'){ state.ui.calMonth = addMonths(state.ui.calMonth,1); render(); }
  else if(a==='open-day'){ openModal(dayModalHtml(el.dataset.date)); }
  else if(a==='open-goal-edit'){ openModal(goalModalHtml()); }
  else if(a==='open-budget-edit'){ openModal(budgetEditModalHtml(el.dataset.cat)); }
  else if(a==='open-acc-new'){ openModal(accNewHtml()); }
  else if(a==='open-acc-detail'){ openModal(accDetailHtml(el.dataset.id)); }
  else if(a==='open-networth-goal'){ openModal(networthGoalHtml()); }
  else if(a==='delete-acc'){ if(confirm('Konto wirklich löschen? Der Verlauf geht verloren.')){ state.accounts = state.accounts.filter(a=>a.id!==el.dataset.id); save(); closeModal(); render(); toast('Konto gelöscht'); } }
  else if(a==='add-cat'){ addCategory(el.dataset.type); }
  else if(a==='del-cat'){ deleteCategory(el.dataset.type, el.dataset.id); }
  else if(a==='export-data'){ exportData(); }
  else if(a==='reset-data'){ resetData(); }
}

function onTxSubmit(e){
  e.preventDefault();
  const f = e.target;
  const catId = f.catId.value;
  if(!catId){ toast('Bitte Kategorie wählen'); return; }
  const amount = parseFloat(f.amount.value);
  if(!(amount>0)){ toast('Bitte gültigen Betrag eingeben'); return; }
  const data = {
    type: f.type.value, catId, amount,
    date: f.date.value, accountId: f.accountId.value||null,
    note: f.note.value.trim()
  };
  const id = f.dataset.id;
  if(id){
    const t = state.transactions.find(x=>x.id===id);
    Object.assign(t, data);
  } else {
    state.transactions.push(Object.assign({id:uid(), _t:Date.now()}, data));
  }
  save(); closeModal(); render(); toast('Gespeichert');
}
function onGoalSubmit(e){
  e.preventDefault();
  const f = e.target;
  state.savingsGoal.name = f.name.value.trim()||'Sparziel';
  state.savingsGoal.target = f.target.value? parseFloat(f.target.value): null;
  save(); closeModal(); render(); toast('Sparziel gespeichert');
}
function onBudgetSubmit(e){
  e.preventDefault();
  const f = e.target;
  const cat = f.dataset.cat;
  const val = parseFloat(f.limit.value)||0;
  if(val>0) state.budgets[cat]=val; else delete state.budgets[cat];
  save(); closeModal(); render(); toast('Budget gespeichert');
}
function onAccNewSubmit(e){
  e.preventDefault();
  const f = e.target;
  const type = f.type.value;
  const typeInfo = ACCOUNT_TYPES.find(t=>t.id===type);
  const acc = {id:uid(), name:f.name.value.trim(), type, em:typeInfo.em, counts:typeInfo.counts, history:[]};
  if(f.balance.value!==''){ acc.history.push({date:today(), balance:parseFloat(f.balance.value)}); }
  state.accounts.push(acc);
  save(); closeModal(); render(); toast('Konto angelegt');
}
function onAccBalanceSubmit(e){
  e.preventDefault();
  const f = e.target;
  const acc = accById(f.dataset.id);
  const balance = parseFloat(f.balance.value);
  const date = f.date.value;
  acc.history = (acc.history||[]).filter(h=>h.date!==date);
  acc.history.push({date, balance});
  save(); closeModal(); render(); toast('Kontostand aktualisiert');
}
function onNetworthGoalSubmit(e){
  e.preventDefault();
  const f = e.target;
  state.netWorthGoal.target = f.target.value? parseFloat(f.target.value): null;
  save(); closeModal(); render(); toast('Ziel gespeichert');
}
function addCategory(type){
  const name = prompt('Name der neuen Kategorie:');
  if(!name) return;
  const em = prompt('Emoji für die Kategorie (z. B. 🧾):','🧾')||'🧾';
  const palette = ['#5fae8c','#4f8fc0','#8b7ec8','#d97a6c','#c8a13a','#4fa8a8','#c87ea0','#e08e5b'];
  const color = palette[Math.floor(Math.random()*palette.length)];
  const id = 'c_'+uid();
  state.categories[type].push({id,name:name.trim(),em,color});
  save(); render(); toast('Kategorie hinzugefügt');
}
function deleteCategory(type, id){
  const used = state.transactions.some(t=>t.catId===id);
  if(used && !confirm('Diese Kategorie wird noch von Buchungen verwendet. Trotzdem löschen?')) return;
  state.categories[type] = state.categories[type].filter(c=>c.id!==id);
  delete state.budgets[id];
  save(); render(); toast('Kategorie gelöscht');
}
function exportData(){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'sparhamster-backup-'+today()+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  toast('Backup heruntergeladen');
}
function handleImport(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      if(!confirm('Aktuelle Daten durch Backup ersetzen?')) return;
      state = Object.assign(defaultState(), parsed);
      save(); render(); toast('Backup importiert');
    }catch(err){ alert('Ungültige Datei'); }
  };
  reader.readAsText(file);
}
function resetData(){
  if(!confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden.')) return;
  if(!confirm('Ganz sicher? Alle Buchungen, Konten und Ziele werden gelöscht.')) return;
  state = defaultState();
  save(); render(); toast('Zurückgesetzt');
}

/* ---------- nav ---------- */
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{ state.ui.tab = btn.dataset.tab; save(); render(); });
});
if(window.matchMedia){
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', ()=>{ if(state.ui.mode==='auto') render(); });
}

/* ---------- service worker ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

render();
