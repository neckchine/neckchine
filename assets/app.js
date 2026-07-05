/* =========================================================================
   Jéroboam 120 — Application mobile de gestion de restaurant
   Interface app-like : tab bar basse, écrans, FAB, bottom-sheets.
   Données persistées localement (localStorage) + export / import JSON.
   ========================================================================= */

'use strict';

const STORAGE_KEY = 'jero120.data.v1';
const THEME_KEY = 'jero120.theme';

/* ---------- Utilitaires ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => 'id' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayISO = () => new Date().toISOString().slice(0, 10);
const eur = (n) => (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const frDateLong = (iso) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const frDT = (ts) => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/* ---------- Icônes (SVG ligne) ---------- */
const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.6V20h14V9.6"/><path d="M9.5 20v-6h5v6"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5v9L12 21 3 16.5z"/><path d="M3 7.5 12 12l9-4.5"/><path d="M12 12v9"/></svg>',
  wine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 15.5V22"/><path d="M6.5 3h11l-.7 6.2a4.8 4.8 0 0 1-9.6 0z"/><path d="M6.9 6.5h10.2"/></svg>',
  plate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17"/><path d="M8 3v4M16 3v4"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-4 3.5V16H4z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m8 12 3 3 5-6"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3.5h9l5 5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M14 3.5V9h5"/><path d="M8 13h8M8 16.5h5"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17z"/><path d="M14 7l3 3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9M7 13l5-5 5 5"/><path d="M5 4h14"/></svg>',
  plus_add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
};

/* ---------- Persistance ---------- */
let DB = load();
function load() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return normalize(JSON.parse(raw)); }
  catch (e) { console.warn(e); }
  return seed();
}
/* Migration : ancienne clé « plats » -> « menus » (menu du jour) + planning auto */
function normalize(db) {
  if (!db.menus) {
    db.menus = Array.isArray(db.plats)
      ? db.plats.map(p => ({ id: p.id, date: p.date, categorie: 'Plat', nom: p.nom, description: p.description, prix: p.prix }))
      : [];
  }
  delete db.plats;
  if (!Array.isArray(db.staff)) db.staff = seedStaff();
  if (!db.besoins) db.besoins = defaultBesoins();
  if (!Array.isArray(db.planning)) db.planning = [];
  // Ancien format de planning (sans « service ») -> on repart propre
  db.planning = db.planning.filter(p => p && p.service && p.employeId);
  return db;
}

/* ---------- Données planning (personnel + besoins) ---------- */
function mkDispo(pairs) { return pairs.map(([m, s]) => ({ midi: !!m, soir: !!s })); }
function seedStaff() {
  return [
    { id: 'e1', nom: 'Julien Roy', categorie: 'Cuisine', role: 'Chef de cuisine', joursMax: 5, dispo: mkDispo([[1,1],[1,1],[1,1],[1,1],[1,1],[0,0],[0,0]]) },
    { id: 'e2', nom: 'Marta Sur', categorie: 'Cuisine', role: 'Commis', joursMax: 5, dispo: mkDispo([[1,1],[1,1],[1,1],[1,1],[1,1],[0,0],[0,0]]) },
    { id: 'e3', nom: 'Amina Chef', categorie: 'Salle', role: 'Cheffe de rang', joursMax: 5, dispo: mkDispo([[0,0],[1,1],[1,1],[1,1],[1,1],[1,1],[0,0]]) },
    { id: 'e4', nom: 'Lucas Petit', categorie: 'Salle', role: 'Serveur', joursMax: 4, dispo: mkDispo([[0,0],[0,0],[0,1],[0,1],[0,1],[0,1],[0,1]]) },
    { id: 'e5', nom: 'Théo Bar', categorie: 'Bar', role: 'Barman', joursMax: 5, dispo: mkDispo([[0,0],[0,0],[0,0],[0,1],[1,1],[1,1],[0,1]]) },
  ];
}
function defaultBesoins() {
  return {
    midi: { actif: true, debut: '11:00', fin: '15:00', Cuisine: 1, Salle: 2, Bar: 0 },
    soir: { actif: true, debut: '18:00', fin: '23:30', Cuisine: 2, Salle: 2, Bar: 1 },
  };
}
const MENU_CATS = ['Entrée', 'Plat', 'Suggestion', 'Dessert'];
const catLabel = (c) => ({ 'Entrée': 'Entrées', 'Plat': 'Plats', 'Dessert': 'Desserts', 'Suggestion': 'Suggestions' }[c] || c);
save(); // persiste immédiatement les données initialisées / migrées
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }
  catch (e) { toast('Sauvegarde impossible', 'err'); }
  if (window.Cloud) window.Cloud.onSave(DB);
}
let cloudState = { enabled: false, connected: false, email: null };
let loginStep = { sent: false, email: '' };

/* ---------- Données de démonstration ---------- */
function seed() {
  const t = todayISO();
  return {
    fournisseurs: [
      { id: 'f1', nom: 'Metro Rungis', categorie: 'Épicerie', contact: 'M. Bernard', telephone: '01 45 12 33 00', email: 'commandes@metro.fr', delai: 1, notes: 'Livraison avant 10h' },
      { id: 'f2', nom: 'Maison Dubois — Primeurs', categorie: 'Fruits & légumes', contact: 'Claire Dubois', telephone: '06 12 45 78 90', email: 'claire@dubois-primeurs.fr', delai: 1, notes: '' },
      { id: 'f3', nom: 'Boucherie Lefèvre', categorie: 'Viandes', contact: 'Paul Lefèvre', telephone: '01 43 55 21 10', email: 'paul@boucherie-lefevre.fr', delai: 2, notes: 'Fermé le lundi' },
      { id: 'f4', nom: 'Domaines & Terroirs', categorie: 'Vins & spiritueux', contact: 'Sophie Marchand', telephone: '03 80 24 11 22', email: 'contact@domaines-terroirs.fr', delai: 4, notes: 'Franco dès 12 bouteilles' },
    ],
    stocks: [
      { id: 's1', nom: 'Farine T55', categorie: 'Épicerie', unite: 'kg', quantite: 8, seuil: 10, fournisseurId: 'f1' },
      { id: 's2', nom: 'Beurre doux', categorie: 'Crémerie', unite: 'kg', quantite: 4, seuil: 5, fournisseurId: 'f1' },
      { id: 's3', nom: 'Pommes de terre', categorie: 'Fruits & légumes', unite: 'kg', quantite: 25, seuil: 15, fournisseurId: 'f2' },
      { id: 's4', nom: 'Filet de bœuf', categorie: 'Viandes', unite: 'kg', quantite: 3, seuil: 6, fournisseurId: 'f3' },
      { id: 's5', nom: 'Huile d\'olive', categorie: 'Épicerie', unite: 'L', quantite: 12, seuil: 6, fournisseurId: 'f1' },
      { id: 's6', nom: 'Crème liquide', categorie: 'Crémerie', unite: 'L', quantite: 2, seuil: 4, fournisseurId: 'f1' },
    ],
    vins: [
      { id: 'v1', nom: 'Chablis 1er Cru', domaine: 'Domaine Laroche', type: 'Blanc', millesime: 2021, region: 'Bourgogne', quantite: 18, seuil: 6, emplacement: 'Cave A — casier 3', prixAchat: 22, prixVente: 58 },
      { id: 'v2', nom: 'Châteauneuf-du-Pape', domaine: 'Clos du Caillou', type: 'Rouge', millesime: 2019, region: 'Rhône', quantite: 4, seuil: 6, emplacement: 'Cave A — casier 7', prixAchat: 28, prixVente: 72 },
      { id: 'v3', nom: 'Champagne Brut', domaine: 'Pol Roger', type: 'Effervescent', millesime: 0, region: 'Champagne', quantite: 30, seuil: 12, emplacement: 'Cave froide', prixAchat: 34, prixVente: 89 },
      { id: 'v4', nom: 'Sancerre', domaine: 'Henri Bourgeois', type: 'Blanc', millesime: 2022, region: 'Loire', quantite: 9, seuil: 6, emplacement: 'Cave A — casier 1', prixAchat: 16, prixVente: 42 },
    ],
    staff: seedStaff(),
    besoins: defaultBesoins(),
    planning: [],
    menus: [
      { id: 'd1', date: t, categorie: 'Entrée', nom: 'Velouté de potimarron', description: 'Crème légère & graines torréfiées', prix: 9 },
      { id: 'd2', date: t, categorie: 'Plat', nom: 'Suprême de volaille, jus au thym', description: 'Écrasé de pommes de terre à l\'huile d\'olive', prix: 19 },
      { id: 'd3', date: t, categorie: 'Plat', nom: 'Risotto aux champignons', description: 'Parmesan 24 mois, roquette', prix: 17 },
      { id: 'd4', date: t, categorie: 'Dessert', nom: 'Tarte fine aux pommes', description: 'Glace vanille de Madagascar', prix: 8 },
    ],
    comm: [
      { id: 'c1', type: 'message', texte: 'Table 12 : allergie fruits à coque, à signaler en cuisine.', auteur: 'Salle', ts: Date.now() - 3600e3, resolu: false },
    ],
    checklists: {
      ouverture: [
        { id: 'o1', texte: 'Relever les températures des frigos et congélateurs', fait: false },
        { id: 'o2', texte: 'Allumer la machine à café et le four', fait: false },
        { id: 'o3', texte: 'Vérifier la mise en place des tables', fait: false },
        { id: 'o4', texte: 'Contrôler le fond de caisse', fait: false },
        { id: 'o5', texte: 'Briefing équipe : plats du jour & 86', fait: false },
      ],
      fermeture: [
        { id: 'ff1', texte: 'Nettoyer et désinfecter les plans de travail', fait: false },
        { id: 'ff2', texte: 'Vérifier fermeture des frigos', fait: false },
        { id: 'ff3', texte: 'Sortir les poubelles et le tri', fait: false },
        { id: 'ff4', texte: 'Compter la caisse et fermer le TPE', fait: false },
        { id: 'ff5', texte: 'Éteindre équipements, gaz et lumières', fait: false },
        { id: 'ff6', texte: 'Fermer les portes et activer l\'alarme', fait: false },
      ],
    },
    notes: [
      { id: 'n1', texte: 'Fournisseur vins fermé du 14 au 21 : anticiper la commande de Champagne.', auteur: 'Direction', ts: Date.now() - 86400e3, epingle: true },
      { id: 'n2', texte: 'Formation nouveau serveur mardi 14h.', auteur: 'Direction', ts: Date.now() - 43200e3, epingle: false },
    ],
  };
}

/* ---------- Sélecteurs dérivés ---------- */
const stockBas = () => DB.stocks.filter(s => Number(s.quantite) <= Number(s.seuil));
const vinBas = () => DB.vins.filter(v => Number(v.quantite) <= Number(v.seuil));
const commOuverts = () => DB.comm.filter(c => !c.resolu);
const fournisseurNom = (id) => (DB.fournisseurs.find(f => f.id === id) || {}).nom || '—';

/* =========================================================================
   ÉCRANS
   ========================================================================= */

/* ---------- Accueil / tableau de bord (#18) ---------- */
function scrAccueil() {
  const sb = stockBas(), vb = vinBas(), co = commOuverts();
  const menuJour = DB.menus.filter(m => m.date === todayISO());
  const planningJour = DB.planning.filter(p => p.date === todayISO()).sort((a, b) => a.debut.localeCompare(b.debut));
  const auService = new Set(planningJour.map(p => p.employeId)).size;
  const valeurCave = DB.vins.reduce((t, v) => t + v.quantite * (v.prixAchat || 0), 0);
  const alertes = sb.length + vb.length;
  const chkO = DB.checklists.ouverture, chkF = DB.checklists.fermeture;
  const pct = (l) => l.length ? Math.round(l.filter(x => x.fait).length / l.length * 100) : 0;

  return `
    <div class="hero">
      <div class="hello">Bonjour 👋 · <span style="text-transform:capitalize">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      <div class="htitle">Jéroboam 120</div>
      <div class="hrow">
        <div class="hchip"><div class="n">${alertes}</div><div class="l">Alerte${alertes > 1 ? 's' : ''} de stock</div></div>
        <div class="hchip"><div class="n">${co.length}</div><div class="l">Message${co.length > 1 ? 's' : ''} en cours</div></div>
        <div class="hchip"><div class="n">${menuJour.length}</div><div class="l">Au menu du jour</div></div>
      </div>
    </div>

    ${alertes ? `<div class="eyebrow">À réapprovisionner <span class="pill p-danger">${alertes}</span></div>
      <div class="rows">
        ${[...sb.map(s => alertRow(s.nom, `${s.quantite} ${s.unite} · seuil ${s.seuil}`, 'stocks')),
           ...vb.map(v => alertRow(v.nom, `${v.quantite} bouteille(s) · seuil ${v.seuil}`, 'cave'))].join('')}
      </div>` : `<div class="card spread"><div><strong>Stocks au niveau ✅</strong><div class="muted" style="font-size:13px">Rien à recommander pour l'instant.</div></div></div>`}

    <div class="eyebrow" style="margin-top:20px">Aperçu</div>
    <div class="stat-grid">
      <button class="stat" onclick="go('cave')" style="text-align:left;cursor:pointer;border:1px solid var(--line)">
        <div class="v">${eur(valeurCave)}</div><div class="l">Valeur de la cave</div></button>
      <button class="stat" onclick="go('planning')" style="text-align:left;cursor:pointer;border:1px solid var(--line)">
        <div class="v">${auService}</div><div class="l">Au service aujourd'hui</div></button>
    </div>

    <div class="eyebrow" style="margin-top:20px">Menu du jour <a onclick="go('menu')">${menuJour.length ? 'Modifier' : 'Écrire'}</a></div>
    ${menuJour.length
      ? `<div class="card menu-card">${MENU_CATS.filter(c => menuJour.some(i => i.categorie === c)).map(cat => `
          <div class="menu-cat">${catLabel(cat)}</div>
          ${menuJour.filter(i => i.categorie === cat).map(i => menuLine(i)).join('')}`).join('')}</div>`
      : `<button class="row" onclick="go('menu')"><div class="r-ico">${I.menu}</div>
          <div class="r-main"><div class="r-title">Aucun menu pour aujourd'hui</div><div class="r-sub">Touchez pour l'écrire depuis la cuisine</div></div>
          <span class="chev">${I.chevron}</span></button>`}

    ${planningJour.length ? `<div class="eyebrow" style="margin-top:20px">Équipe du jour <a onclick="go('planning')">Planning</a></div>
      <div class="rows">${planningJour.map(p => `
        <div class="row"><div class="r-ico">${I.calendar}</div>
          <div class="r-main"><div class="r-title">${esc(p.nom)}</div><div class="r-sub">${esc(p.role || p.categorie)} · ${p.service === 'midi' ? 'Midi' : 'Soir'}</div></div>
          <span class="pill p-muted nowrap">${p.debut}–${p.fin}</span></div>`).join('')}</div>` : ''}

    <div class="eyebrow" style="margin-top:20px">Checklists <a onclick="go('checklists')">Ouvrir</a></div>
    <div class="card">
      <div class="spread" style="margin-bottom:6px"><span>Ouverture</span><strong>${pct(chkO)}%</strong></div>
      <div class="progress"><span style="width:${pct(chkO)}%"></span></div>
      <div class="spread" style="margin:14px 0 6px"><span>Fermeture</span><strong>${pct(chkF)}%</strong></div>
      <div class="progress"><span style="width:${pct(chkF)}%"></span></div>
    </div>`;
}
const alertRow = (nom, sub, screen) => `
  <button class="row alert" onclick="go('${screen}')">
    <div class="r-ico" style="background:color-mix(in srgb,var(--red) 12%,transparent);color:var(--red)">${I.bell}</div>
    <div class="r-main"><div class="r-title">${esc(nom)}</div><div class="r-sub">${esc(sub)}</div></div>
    <span class="chev">${I.chevron}</span></button>`;

/* ---------- Stocks (#5 + #6) ---------- */
function scrStocks() {
  const bas = stockBas();
  const rows = DB.stocks.slice().sort((a, b) => (b.quantite <= b.seuil) - (a.quantite <= a.seuil) || a.nom.localeCompare(b.nom));
  return `
    <button class="btn" style="margin-bottom:12px" onclick="openScan()">📷 Scanner le ticket du soir</button>
    ${bas.length ? `<div class="card" style="border-left:3px solid var(--red);margin-bottom:12px"><strong>${bas.length} produit(s) à commander</strong><div class="muted" style="font-size:13px">${bas.map(s => esc(s.nom)).join(', ')}</div></div>` : ''}
    ${searchBar('Rechercher un produit…')}
    <div class="rows" id="list">
      ${rows.map(s => {
        const low = s.quantite <= s.seuil;
        return `<div class="row ${low ? 'alert' : ''}" data-search="${esc(s.nom + ' ' + s.categorie)}">
          <div class="r-ico">${I.box}</div>
          <div class="r-main">
            <div class="r-title">${esc(s.nom)}</div>
            <div class="r-sub">${esc(s.quantite)} ${esc(s.unite)} · seuil ${esc(s.seuil)} · ${esc(fournisseurNom(s.fournisseurId))}</div>
          </div>
          <div class="r-right">
            ${low ? '<span class="pill p-danger">À commander</span>' : '<span class="pill p-ok">OK</span>'}
            <button class="icon-btn" onclick="quickRestock('${s.id}')" aria-label="Réapprovisionner">${I.plus_add}</button>
            <button class="icon-btn" onclick="editStock('${s.id}')" aria-label="Modifier">${I.edit}</button>
          </div></div>`;
      }).join('') || empty(I.box, 'Aucun produit', 'Touchez + pour ajouter un produit.')}
    </div>`;
}
function editStock(id) {
  const s = id ? DB.stocks.find(x => x.id === id) : { nom: '', categorie: 'Épicerie', unite: 'kg', quantite: 0, seuil: 0, fournisseurId: DB.fournisseurs[0]?.id || '' };
  const opts = DB.fournisseurs.map(f => `<option value="${f.id}" ${f.id === s.fournisseurId ? 'selected' : ''}>${esc(f.nom)}</option>`).join('');
  sheet(id ? 'Modifier le produit' : 'Nouveau produit', `
    ${fld('Nom du produit', `<input id="m_nom" value="${esc(s.nom)}" placeholder="Ex. Farine T55">`)}
    <div class="form-row">
      ${fld('Catégorie', `<input id="m_cat" value="${esc(s.categorie)}" list="catL"><datalist id="catL"><option>Épicerie</option><option>Crémerie</option><option>Fruits & légumes</option><option>Viandes</option><option>Poissons</option><option>Boissons</option></datalist>`)}
      ${fld('Unité', `<select id="m_unite">${['kg', 'g', 'L', 'cl', 'pièce', 'botte', 'boîte'].map(u => `<option ${u === s.unite ? 'selected' : ''}>${u}</option>`).join('')}</select>`)}
    </div>
    <div class="form-row">
      ${fld('Quantité', `<input id="m_qte" type="number" inputmode="decimal" min="0" step="0.1" value="${esc(s.quantite)}">`)}
      ${fld('Seuil d\'alerte', `<input id="m_seuil" type="number" inputmode="decimal" min="0" step="0.1" value="${esc(s.seuil)}">`)}
    </div>
    ${fld('Fournisseur', `<select id="m_four">${opts}</select>`)}
  `, () => {
    const d = { nom: $('#m_nom').value.trim(), categorie: $('#m_cat').value.trim(), unite: $('#m_unite').value, quantite: +$('#m_qte').value, seuil: +$('#m_seuil').value, fournisseurId: $('#m_four').value };
    if (!d.nom) return toast('Le nom est obligatoire', 'err'), false;
    if (id) Object.assign(s, d); else DB.stocks.push({ id: uid(), ...d });
    save(); render(); toast('Produit enregistré', 'ok');
  });
}
function quickRestock(id) {
  const s = DB.stocks.find(x => x.id === id); if (!s) return;
  const v = prompt(`Réappro « ${s.nom} » — quantité reçue (${s.unite}) :`, '');
  if (v === null || v === '') return;
  if (isNaN(+v)) return toast('Valeur invalide', 'err');
  s.quantite = +s.quantite + +v; save(); render(); toast('Stock mis à jour', 'ok');
}

/* ---------- Cave / Vins (#10) ---------- */
function scrCave() {
  const bt = DB.vins.reduce((t, v) => t + +v.quantite, 0);
  const val = DB.vins.reduce((t, v) => t + v.quantite * (v.prixAchat || 0), 0);
  return `
    <div class="stat-grid" style="margin-bottom:14px">
      <div class="stat"><div class="v">${bt}</div><div class="l">Bouteilles</div></div>
      <div class="stat"><div class="v">${eur(val)}</div><div class="l">Valeur cave</div></div>
    </div>
    ${searchBar('Rechercher un vin…')}
    <div class="rows" id="list">
      ${DB.vins.slice().sort((a, b) => a.nom.localeCompare(b.nom)).map(v => {
        const low = v.quantite <= v.seuil;
        const c = { Rouge: 'p-danger', Blanc: 'p-warn', 'Rosé': 'p-wine', Effervescent: 'p-ok', Doux: 'p-muted' }[v.type] || 'p-muted';
        return `<div class="tile" data-search="${esc(v.nom + ' ' + v.domaine + ' ' + v.region + ' ' + v.type)}">
          <div class="tile-head">
            <div><div class="tile-title">${esc(v.nom)} ${low ? '<span class="dot red"></span>' : ''}</div>
              <div class="tile-sub">${esc(v.domaine)}${v.millesime ? ' · ' + v.millesime : ''} · ${esc(v.region)}</div></div>
            <span class="pill ${c}">${esc(v.type)}</span>
          </div>
          <div class="spread" style="margin-top:10px">
            <div class="tile-sub">📍 ${esc(v.emplacement || '—')}</div>
            <div class="nowrap"><span class="pill p-muted">${esc(v.quantite)} bt</span> <span class="pill p-price">${eur(v.prixVente)}</span></div>
          </div>
          <div class="tile-actions">
            <button class="btn-sm btn-soft" onclick="quickVin('${v.id}')">+ Entrée</button>
            <button class="icon-btn" onclick="editVin('${v.id}')">${I.edit}</button>
            <button class="icon-btn" onclick="delItem('vins','${v.id}')">${I.trash}</button>
          </div></div>`;
      }).join('') || empty(I.wine, 'Cave vide', 'Touchez + pour ajouter une référence.')}
    </div>`;
}
function editVin(id) {
  const v = id ? DB.vins.find(x => x.id === id) : { nom: '', domaine: '', type: 'Rouge', millesime: '', region: '', quantite: 0, seuil: 6, emplacement: '', prixAchat: 0, prixVente: 0 };
  sheet(id ? 'Modifier la référence' : 'Nouvelle référence', `
    <div class="form-row">
      ${fld('Cuvée', `<input id="m_nom" value="${esc(v.nom)}">`)}
      ${fld('Domaine', `<input id="m_dom" value="${esc(v.domaine)}">`)}
    </div>
    <div class="form-row">
      ${fld('Type', `<select id="m_type">${['Rouge', 'Blanc', 'Rosé', 'Effervescent', 'Doux'].map(x => `<option ${x === v.type ? 'selected' : ''}>${x}</option>`).join('')}</select>`)}
      ${fld('Millésime', `<input id="m_mil" type="number" inputmode="numeric" min="0" value="${esc(v.millesime)}" placeholder="0 = sans">`)}
    </div>
    <div class="form-row">
      ${fld('Région', `<input id="m_reg" value="${esc(v.region)}">`)}
      ${fld('Emplacement', `<input id="m_emp" value="${esc(v.emplacement)}" placeholder="Cave A — casier 3">`)}
    </div>
    <div class="form-row">
      ${fld('Bouteilles', `<input id="m_qte" type="number" inputmode="numeric" min="0" value="${esc(v.quantite)}">`)}
      ${fld('Seuil', `<input id="m_seuil" type="number" inputmode="numeric" min="0" value="${esc(v.seuil)}">`)}
    </div>
    <div class="form-row">
      ${fld('Prix achat (€)', `<input id="m_pa" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(v.prixAchat)}">`)}
      ${fld('Prix vente (€)', `<input id="m_pv" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(v.prixVente)}">`)}
    </div>
  `, () => {
    const d = { nom: $('#m_nom').value.trim(), domaine: $('#m_dom').value.trim(), type: $('#m_type').value, millesime: +$('#m_mil').value || 0, region: $('#m_reg').value.trim(), emplacement: $('#m_emp').value.trim(), quantite: +$('#m_qte').value, seuil: +$('#m_seuil').value, prixAchat: +$('#m_pa').value, prixVente: +$('#m_pv').value };
    if (!d.nom) return toast('La cuvée est obligatoire', 'err'), false;
    if (id) Object.assign(v, d); else DB.vins.push({ id: uid(), ...d });
    save(); render(); toast('Référence enregistrée', 'ok');
  });
}
function quickVin(id) {
  const v = DB.vins.find(x => x.id === id); if (!v) return;
  const val = prompt(`Entrée de stock — « ${v.nom} » : bouteilles reçues`, '');
  if (val === null || val === '') return;
  if (isNaN(+val)) return toast('Valeur invalide', 'err');
  v.quantite = +v.quantite + +val; save(); render(); toast('Cave mise à jour', 'ok');
}

/* ---------- Menu du jour (#22) ---------- */
function scrMenu() {
  const jours = [...new Set(DB.menus.map(m => m.date))].sort().reverse();
  if (!jours.length) return empty(I.menu, 'Aucun menu', 'Touchez + pour écrire le menu du jour. Il s\'affichera sur l\'accueil pour toute l\'équipe.');
  return jours.map(day => {
    const items = DB.menus.filter(m => m.date === day);
    return `<div class="eyebrow" style="text-transform:capitalize">${frDateLong(day)}${day === todayISO() ? ' <span class="pill p-wine">Aujourd\'hui</span>' : ''}</div>
      <div class="card menu-card">
        ${MENU_CATS.filter(c => items.some(i => i.categorie === c)).map(cat => `
          <div class="menu-cat">${catLabel(cat)}</div>
          ${items.filter(i => i.categorie === cat).map(i => menuLine(i, true)).join('')}
        `).join('') || '<p class="muted" style="padding:12px 0">Menu vide — touchez + pour ajouter un plat.</p>'}
      </div>`;
  }).join('');
}
function menuLine(i, editable = false) {
  return `<div class="menu-item">
    <div class="mi-main"><div class="mi-name">${esc(i.nom)}</div>${i.description ? `<div class="mi-desc">${esc(i.description)}</div>` : ''}</div>
    ${i.prix ? `<span class="mi-price">${eur(i.prix)}</span>` : ''}
    ${editable ? `<button class="icon-btn" onclick="editMenuLine('${i.id}')" aria-label="Modifier">${I.edit}</button>
    <button class="icon-btn" onclick="delItem('menus','${i.id}')" aria-label="Supprimer">${I.trash}</button>` : ''}
  </div>`;
}
function editMenuLine(id) {
  const m = id ? DB.menus.find(x => x.id === id) : { nom: '', description: '', categorie: 'Plat', prix: 0, date: todayISO() };
  sheet(id ? 'Modifier la ligne du menu' : 'Ajouter au menu', `
    ${fld('Section', `<select id="m_cat">${MENU_CATS.map(c => `<option ${c === m.categorie ? 'selected' : ''}>${c}</option>`).join('')}</select>`)}
    ${fld('Intitulé du plat', `<input id="m_nom" value="${esc(m.nom)}" placeholder="Ex. Suprême de volaille, jus au thym">`)}
    ${fld('Description (facultatif)', `<textarea id="m_desc" placeholder="Garniture, accompagnement…">${esc(m.description)}</textarea>`)}
    <div class="form-row">
      ${fld('Prix € (facultatif)', `<input id="m_prix" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(m.prix)}">`)}
      ${fld('Date', `<input id="m_date" type="date" value="${esc(m.date)}">`)}
    </div>
  `, () => {
    const d = { categorie: $('#m_cat').value, nom: $('#m_nom').value.trim(), description: $('#m_desc').value.trim(), prix: +$('#m_prix').value, date: $('#m_date').value };
    if (!d.nom) return toast('L\'intitulé est obligatoire', 'err'), false;
    if (id) Object.assign(m, d); else DB.menus.push({ id: uid(), ...d });
    save(); render(); toast('Menu mis à jour', 'ok');
  });
}

/* ---------- Plus (menu) ---------- */
function scrPlus() {
  const co = commOuverts().length;
  const menu = [
    { s: 'communication', ic: I.chat, t: 'Salle ↔ Cuisine', d: 'Messages, signalements & 86', badge: co },
    { s: 'planning', ic: I.calendar, t: 'Planning équipe', d: 'Services des 7 prochains jours' },
    { s: 'fournisseurs', ic: I.truck, t: 'Fournisseurs', d: `${DB.fournisseurs.length} contact(s)` },
    { s: 'checklists', ic: I.check, t: 'Checklists', d: 'Ouverture & fermeture' },
    { s: 'notes', ic: I.note, t: 'Notes & consignes', d: 'Cahier de liaison de l\'équipe' },
  ];
  return `
    <div class="rows">
      ${menu.map(m => `<button class="row" onclick="go('${m.s}')">
        <div class="r-ico">${m.ic}</div>
        <div class="r-main"><div class="r-title">${m.t}</div><div class="r-sub">${m.d}</div></div>
        <div class="r-right">${m.badge ? `<span class="pill p-danger">${m.badge}</span>` : ''}<span class="chev">${I.chevron}</span></div>
      </button>`).join('')}
    </div>

    <div class="eyebrow" style="margin-top:22px">Synchronisation</div>
    ${cloudState.connected
      ? `<div class="card"><div class="spread"><div><strong>Connecté ☁️</strong><div class="muted" style="font-size:13px">${esc(cloudState.email || '')}</div></div><button class="btn-sm btn-soft" onclick="cloudLogout()">Se déconnecter</button></div><div class="muted" style="font-size:12.5px;margin-top:10px">Tes données sont partagées en temps réel avec l'équipe.</div></div>`
      : cloudState.enabled
        ? (loginStep.sent
          ? `<div class="card"><strong>Entre ton code</strong><p class="muted" style="font-size:13px;margin:6px 0 10px">Un code à 6 chiffres a été envoyé à <b>${esc(loginStep.email)}</b>. Regarde tes emails (et les spams).</p>
             <input id="cloudCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456" style="width:100%;padding:12px 13px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);color:var(--ink);font-size:22px;letter-spacing:6px;text-align:center" onkeydown="if(event.key==='Enter')cloudVerify()">
             <button class="btn" style="margin-top:10px" onclick="cloudVerify()">Valider le code</button>
             <div style="display:flex;gap:10px;margin-top:10px"><button class="btn-sm btn-soft" style="flex:1" onclick="cloudLogin()">Renvoyer</button><button class="btn-sm btn-soft" style="flex:1" onclick="cloudResetLogin()">Changer d'email</button></div></div>`
          : `<div class="card"><strong>Se connecter</strong><p class="muted" style="font-size:13px;margin:6px 0 10px">Reçois un code de connexion par email. Seuls les emails autorisés ont accès.</p>
             <input id="cloudEmail" type="email" inputmode="email" placeholder="ton@email.fr" value="${esc(loginStep.email)}" style="width:100%;padding:12px 13px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);color:var(--ink);font-size:16px" onkeydown="if(event.key==='Enter')cloudLogin()">
             <button class="btn" style="margin-top:10px" onclick="cloudLogin()">Recevoir le code</button></div>`)
        : `<div class="card muted" style="font-size:13px">Mode hors-ligne — données enregistrées sur cet appareil. La synchronisation entre appareils s'active sur la version en ligne (hébergée).</div>`}

    <div class="eyebrow" style="margin-top:22px">Données & sauvegarde</div>
    <div class="rows">
      <button class="row" onclick="exportData()"><div class="r-ico">${I.download}</div><div class="r-main"><div class="r-title">Exporter la sauvegarde</div><div class="r-sub">Enregistrer toutes les données (fichier .json)</div></div></button>
      <button class="row" onclick="$('#importFile').click()"><div class="r-ico">${I.upload}</div><div class="r-main"><div class="r-title">Importer une sauvegarde</div><div class="r-sub">Restaurer depuis un fichier</div></div></button>
      <button class="row" onclick="toggleTheme()"><div class="r-ico">${I.theme}</div><div class="r-main"><div class="r-title">Thème clair / sombre</div><div class="r-sub">Basculer l'apparence</div></div></button>
    </div>
    <p class="muted" style="text-align:center;font-size:12px;margin-top:22px">Jéroboam 120 · données enregistrées sur cet appareil</p>`;
}

/* ---------- Communication (#23) ---------- */
function scrCommunication() {
  const ouverts = DB.comm.filter(c => !c.resolu).sort((a, b) => b.ts - a.ts);
  const resolus = DB.comm.filter(c => c.resolu).sort((a, b) => b.ts - a.ts).slice(0, 15);
  return `
    <div class="card">
      ${fld('Message', `<input id="c_texte" placeholder="Ex. Plus de saumon · Table 5 sans gluten…" onkeydown="if(event.key==='Enter')addComm()">`)}
      <div class="form-row">
        ${fld('Type', `<select id="c_type"><option value="message">💬 Message</option><option value="86">⛔ 86 (épuisé)</option></select>`)}
        ${fld('De', `<select id="c_auteur"><option>Salle</option><option>Cuisine</option><option>Direction</option><option>Bar</option></select>`)}
      </div>
      <button class="btn" onclick="addComm()">Envoyer</button>
    </div>

    <div class="eyebrow">En cours ${ouverts.length ? `<span class="pill p-danger">${ouverts.length}</span>` : ''}</div>
    ${ouverts.length ? `<div class="rows">${ouverts.map(c => commRow(c)).join('')}</div>` : '<p class="muted" style="padding:4px">Aucun message en attente 👌</p>'}
    ${resolus.length ? `<div class="eyebrow" style="margin-top:20px">Traités</div><div class="rows">${resolus.map(c => commRow(c, true)).join('')}</div>` : ''}`;
}
function commRow(c, done = false) {
  return `<div class="row" style="${done ? 'opacity:.55;' : ''}${c.type === '86' ? 'border-left:3px solid var(--red)' : 'border-left:3px solid var(--wine)'}">
    <div class="r-main"><div class="r-title" style="font-weight:500;font-size:14.5px">${c.type === '86' ? '<span class="pill p-danger">86</span> ' : ''}${esc(c.texte)}</div>
      <div class="r-sub">${esc(c.auteur)} · ${frDT(c.ts)}</div></div>
    <div class="r-right">
      <button class="icon-btn" onclick="toggleComm('${c.id}')" aria-label="${done ? 'Rouvrir' : 'Marquer traité'}">${done ? '↩︎' : I.check}</button>
      <button class="icon-btn" onclick="delItem('comm','${c.id}')">${I.trash}</button>
    </div></div>`;
}
function addComm() {
  const texte = $('#c_texte').value.trim(); if (!texte) return toast('Écrivez un message', 'err');
  DB.comm.push({ id: uid(), type: $('#c_type').value, texte, auteur: $('#c_auteur').value, ts: Date.now(), resolu: false });
  save(); render(); toast('Message envoyé', 'ok');
}
function toggleComm(id) { const c = DB.comm.find(x => x.id === id); if (!c) return; c.resolu = !c.resolu; save(); render(); }

/* ---------- Planning (#11) : calendrier + personnel + génération auto ---------- */
const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const PLAN_CATS = ['Cuisine', 'Salle', 'Bar'];
const SERVICES = [{ key: 'midi', label: 'Midi' }, { key: 'soir', label: 'Soir' }];
const wdIndex = (iso) => (new Date(iso).getDay() + 6) % 7; // 0 = Lundi
function addDays(iso, n) { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function mondayOf(iso) { return addDays(iso, -wdIndex(iso)); }
function weekDays(monday) { return Array.from({ length: 7 }, (_, i) => addDays(monday, i)); }

let planningTab = 'calendrier';
let planningWeek = null;

function scrPlanning() {
  if (!planningWeek) planningWeek = mondayOf(todayISO());
  const seg = `<div class="segment">${[['calendrier', 'Calendrier'], ['personnel', 'Personnel'], ['besoins', 'Besoins']].map(([k, l]) => `<button class="${planningTab === k ? 'on' : ''}" onclick="setPlanningTab('${k}')">${l}</button>`).join('')}</div>`;
  const body = planningTab === 'personnel' ? planningStaffView() : planningTab === 'besoins' ? planningBesoinsView() : planningCalendarView();
  return seg + body;
}
function setPlanningTab(k) { planningTab = k; render(); }
function planningWeekShift(n) { planningWeek = addDays(planningWeek, n); render(); }

/* --- Calendrier --- */
function planningCalendarView() {
  const days = weekDays(planningWeek);
  const label = new Date(planningWeek).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return `
    <div class="spread" style="margin-bottom:12px">
      <button class="icon-btn" onclick="planningWeekShift(-7)" aria-label="Semaine précédente">‹</button>
      <strong>Semaine du ${label}</strong>
      <button class="icon-btn" onclick="planningWeekShift(7)" aria-label="Semaine suivante">›</button>
    </div>
    <button class="btn" style="margin-bottom:14px" onclick="generatePlanning()">✨ Générer le planning</button>
    ${DB.staff.length === 0 ? `<div class="card muted" style="font-size:13px">Ajoute d'abord ton personnel (onglet Personnel) et leurs disponibilités.</div>` : days.map(dayCard).join('')}`;
}
function dayCard(date) {
  const wd = wdIndex(date), isToday = date === todayISO();
  const services = SERVICES.filter(s => DB.besoins[s.key] && DB.besoins[s.key].actif);
  return `<div class="card" style="margin-bottom:10px${isToday ? ';border-left:3px solid var(--wine)' : ''}">
    <div class="spread" style="margin-bottom:6px"><strong style="text-transform:capitalize">${WEEKDAYS[wd]} ${new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</strong>${isToday ? '<span class="pill p-wine">Auj.</span>' : ''}</div>
    ${services.map(svc => {
      const b = DB.besoins[svc.key];
      const rows = PLAN_CATS.map(cat => {
        const need = Number(b[cat]) || 0;
        const assigned = DB.planning.filter(p => p.date === date && p.service === svc.key && p.categorie === cat);
        if (need === 0 && assigned.length === 0) return '';
        const manque = Math.max(0, need - assigned.length);
        return `<div style="margin:5px 0"><span class="muted" style="font-size:11.5px">${cat}${need ? ` ${assigned.length}/${need}` : ''}</span>
          <div class="tag-row" style="margin-top:3px">
            ${assigned.map(a => `<span class="pill p-muted">${esc(a.nom)} <span onclick="removeAssignment('${a.id}')" style="cursor:pointer;opacity:.55;font-weight:700">✕</span></span>`).join('')}
            <button class="pill p-wine" style="border:none;cursor:pointer" onclick="addAssignment('${date}','${svc.key}','${cat}')">＋</button>
            ${manque ? `<span class="pill p-warn">manque ${manque}</span>` : ''}
          </div></div>`;
      }).join('');
      return `<div style="margin-top:8px"><div style="font-weight:600;font-size:13px">${svc.label} · ${b.debut}–${b.fin}</div>${rows || '<span class="muted" style="font-size:12px">—</span>'}</div>`;
    }).join('')}
  </div>`;
}
function generatePlanning() {
  if (!DB.staff.length) return toast('Ajoute d\'abord du personnel', 'err');
  const days = weekDays(planningWeek);
  DB.planning = DB.planning.filter(p => !days.includes(p.date)); // on régénère la semaine
  const dayset = {}, total = {};
  DB.staff.forEach(s => { dayset[s.id] = new Set(); total[s.id] = 0; });
  for (const date of days) {
    const wd = wdIndex(date);
    for (const svc of SERVICES) {
      const b = DB.besoins[svc.key];
      if (!b || !b.actif) continue;
      for (const cat of PLAN_CATS) {
        const need = Number(b[cat]) || 0;
        if (need <= 0) continue;
        const cands = DB.staff.filter(s => s.categorie === cat
          && s.dispo && s.dispo[wd] && s.dispo[wd][svc.key]
          && !DB.planning.some(p => p.date === date && p.service === svc.key && p.employeId === s.id)
          && (dayset[s.id].has(date) || dayset[s.id].size < (Number(s.joursMax) || 7)));
        cands.sort((a, c) => total[a.id] - total[c.id] || a.nom.localeCompare(c.nom));
        cands.slice(0, need).forEach(s => {
          DB.planning.push({ id: uid(), date, service: svc.key, employeId: s.id, nom: s.nom, categorie: cat, role: s.role, debut: b.debut, fin: b.fin });
          dayset[s.id].add(date); total[s.id]++;
        });
      }
    }
  }
  save(); render();
  const trous = countShortfalls(days);
  toast(trous ? `Planning généré · ${trous} créneau(x) à compléter` : 'Planning généré ✨', trous ? '' : 'ok');
}
function countShortfalls(days) {
  let n = 0;
  for (const date of days) for (const svc of SERVICES) {
    const b = DB.besoins[svc.key]; if (!b || !b.actif) continue;
    for (const cat of PLAN_CATS) {
      const need = Number(b[cat]) || 0; if (!need) continue;
      const got = DB.planning.filter(p => p.date === date && p.service === svc.key && p.categorie === cat).length;
      n += Math.max(0, need - got);
    }
  }
  return n;
}
function addAssignment(date, service, cat) {
  const wd = wdIndex(date), b = DB.besoins[service];
  const list = DB.staff.filter(s => s.categorie === cat);
  if (!list.length) return toast('Aucun employé en ' + cat, 'err');
  const opts = list.map(s => { const ok = s.dispo && s.dispo[wd] && s.dispo[wd][service]; return `<option value="${s.id}">${esc(s.nom)}${ok ? '' : ' (indispo)'}</option>`; }).join('');
  sheet(`Ajouter — ${cat} · ${SERVICES.find(x => x.key === service).label}`, `
    ${fld('Employé', `<select id="a_emp">${opts}</select>`)}
    <div class="form-row">${fld('Début', `<input id="a_deb" type="time" value="${b.debut}">`)}${fld('Fin', `<input id="a_fin" type="time" value="${b.fin}">`)}</div>
  `, () => {
    const s = DB.staff.find(x => x.id === $('#a_emp').value); if (!s) return false;
    DB.planning.push({ id: uid(), date, service, employeId: s.id, nom: s.nom, categorie: cat, role: s.role, debut: $('#a_deb').value, fin: $('#a_fin').value });
    save(); render(); toast('Ajouté au planning', 'ok');
  });
}
function removeAssignment(id) { DB.planning = DB.planning.filter(p => p.id !== id); save(); render(); }

/* --- Personnel --- */
function planningStaffView() {
  return `<button class="btn" style="margin-bottom:12px" onclick="editStaff()">+ Ajouter un employé</button>
    ${DB.staff.map(s => `
      <div class="tile">
        <div class="tile-head"><div><div class="tile-title">${esc(s.nom)}</div><div class="tile-sub">${esc(s.role || s.categorie)} · ${esc(s.categorie)} · max ${s.joursMax} j/sem</div></div>
          <div class="nowrap"><button class="icon-btn" onclick="editStaff('${s.id}')">${I.edit}</button><button class="icon-btn" onclick="delItem('staff','${s.id}')">${I.trash}</button></div></div>
        <div class="tag-row" style="margin-top:10px">${WEEKDAYS_SHORT.map((d, i) => { const dd = s.dispo && s.dispo[i]; const on = dd && (dd.midi || dd.soir); const suf = dd ? (dd.midi && dd.soir ? ' M+S' : dd.midi ? ' M' : dd.soir ? ' S' : '') : ''; return `<span class="pill ${on ? 'p-ok' : 'p-muted'}" style="font-size:10.5px">${d}${suf}</span>`; }).join('')}</div>
      </div>`).join('') || empty(I.calendar, 'Aucun employé', 'Ajoute ton personnel pour générer le planning.')}`;
}
function editStaff(id) {
  const s = id ? DB.staff.find(x => x.id === id) : { nom: '', categorie: 'Salle', role: '', joursMax: 5, dispo: WEEKDAYS_SHORT.map(() => ({ midi: false, soir: false })) };
  const dispo = (s.dispo && s.dispo.length === 7) ? s.dispo : WEEKDAYS_SHORT.map(() => ({ midi: false, soir: false }));
  const grid = WEEKDAYS_SHORT.map((d, i) => `
    <div style="display:flex;align-items:center;gap:14px;padding:5px 0;border-bottom:1px solid var(--line)">
      <span style="width:40px;font-size:13.5px;font-weight:600">${d}</span>
      <label style="display:flex;align-items:center;gap:6px;font-size:14px"><input type="checkbox" id="d_${i}_midi" ${dispo[i].midi ? 'checked' : ''}> Midi</label>
      <label style="display:flex;align-items:center;gap:6px;font-size:14px"><input type="checkbox" id="d_${i}_soir" ${dispo[i].soir ? 'checked' : ''}> Soir</label>
    </div>`).join('');
  sheet(id ? 'Modifier l\'employé' : 'Nouvel employé', `
    ${fld('Nom', `<input id="m_nom" value="${esc(s.nom)}">`)}
    <div class="form-row">
      ${fld('Pôle', `<select id="m_cat">${PLAN_CATS.map(c => `<option ${c === s.categorie ? 'selected' : ''}>${c}</option>`).join('')}</select>`)}
      ${fld('Jours max / sem.', `<input id="m_max" type="number" inputmode="numeric" min="1" max="7" value="${s.joursMax}">`)}
    </div>
    ${fld('Poste (libellé)', `<input id="m_role" value="${esc(s.role)}" placeholder="Serveur, Commis, Barman…">`)}
    <div class="field"><label>Disponibilités</label><div style="border:1px solid var(--line);border-radius:12px;padding:2px 12px">${grid}</div></div>
  `, () => {
    const nom = $('#m_nom').value.trim(); if (!nom) return toast('Le nom est obligatoire', 'err'), false;
    const newDispo = WEEKDAYS_SHORT.map((_, i) => ({ midi: $('#d_' + i + '_midi').checked, soir: $('#d_' + i + '_soir').checked }));
    const data = { nom, categorie: $('#m_cat').value, role: $('#m_role').value.trim(), joursMax: Number($('#m_max').value) || 5, dispo: newDispo };
    if (id) Object.assign(s, data); else DB.staff.push({ id: uid(), ...data });
    save(); render(); toast('Employé enregistré', 'ok');
  });
}

/* --- Besoins --- */
function planningBesoinsView() {
  return `<p class="hint" style="margin-bottom:12px">Combien de personnes il faut par service et par pôle. Le générateur s'appuie dessus.</p>
    ${SERVICES.map(svc => { const b = DB.besoins[svc.key]; return `
      <div class="card" style="margin-bottom:12px">
        <div class="spread"><strong>${svc.label}</strong>
          <label style="font-size:13px;display:flex;align-items:center;gap:6px"><input type="checkbox" ${b.actif ? 'checked' : ''} onchange="setBesoinActif('${svc.key}',this.checked)"> service actif</label></div>
        <div class="form-row" style="margin-top:10px">
          ${fld('Début', `<input type="time" value="${b.debut}" onchange="setBesoin('${svc.key}','debut',this.value)">`)}
          ${fld('Fin', `<input type="time" value="${b.fin}" onchange="setBesoin('${svc.key}','fin',this.value)">`)}
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${PLAN_CATS.map(cat => fld(cat, `<input type="number" inputmode="numeric" min="0" value="${b[cat] || 0}" onchange="setBesoin('${svc.key}','${cat}',this.value)">`)).join('')}
        </div>
      </div>`; }).join('')}`;
}
function setBesoin(svc, key, val) { DB.besoins[svc][key] = (key === 'debut' || key === 'fin') ? val : (Number(val) || 0); save(); }
function setBesoinActif(svc, val) { DB.besoins[svc].actif = val; save(); render(); }

/* ---------- Fournisseurs (#7) ---------- */
function scrFournisseurs() {
  return `${searchBar('Rechercher un fournisseur…')}
    <div class="grid-list" id="list">
      ${DB.fournisseurs.map(f => `
        <div class="tile" data-search="${esc(f.nom + ' ' + f.categorie)}">
          <div class="tile-head"><div><div class="tile-title">${esc(f.nom)}</div><div class="tile-sub">${esc(f.categorie)} · délai ${esc(f.delai)} j</div></div>
            <div class="nowrap"><button class="icon-btn" onclick="editFournisseur('${f.id}')">${I.edit}</button><button class="icon-btn" onclick="delItem('fournisseurs','${f.id}')">${I.trash}</button></div></div>
          <div style="margin-top:10px;font-size:14px;line-height:2">
            ${f.contact ? `👤 ${esc(f.contact)}<br>` : ''}
            ${f.telephone ? `📞 <a href="tel:${esc(f.telephone)}">${esc(f.telephone)}</a><br>` : ''}
            ${f.email ? `✉️ <a href="mailto:${esc(f.email)}">${esc(f.email)}</a>` : ''}
          </div>
          ${f.notes ? `<div class="tile-sub" style="margin-top:8px">📌 ${esc(f.notes)}</div>` : ''}
        </div>`).join('') || empty(I.truck, 'Aucun fournisseur', 'Touchez + pour en ajouter un.')}
    </div>`;
}
function editFournisseur(id) {
  const f = id ? DB.fournisseurs.find(x => x.id === id) : { nom: '', categorie: 'Épicerie', contact: '', telephone: '', email: '', delai: 1, notes: '' };
  sheet(id ? 'Modifier le fournisseur' : 'Nouveau fournisseur', `
    ${fld('Nom / raison sociale', `<input id="m_nom" value="${esc(f.nom)}">`)}
    <div class="form-row">${fld('Catégorie', `<input id="m_cat" value="${esc(f.categorie)}">`)}${fld('Délai (jours)', `<input id="m_delai" type="number" inputmode="numeric" min="0" value="${esc(f.delai)}">`)}</div>
    ${fld('Contact', `<input id="m_contact" value="${esc(f.contact)}">`)}
    <div class="form-row">${fld('Téléphone', `<input id="m_tel" type="tel" value="${esc(f.telephone)}">`)}${fld('Email', `<input id="m_email" type="email" value="${esc(f.email)}">`)}</div>
    ${fld('Notes', `<textarea id="m_notes">${esc(f.notes)}</textarea>`)}
  `, () => {
    const d = { nom: $('#m_nom').value.trim(), categorie: $('#m_cat').value.trim(), contact: $('#m_contact').value.trim(), telephone: $('#m_tel').value.trim(), email: $('#m_email').value.trim(), delai: +$('#m_delai').value, notes: $('#m_notes').value.trim() };
    if (!d.nom) return toast('Le nom est obligatoire', 'err'), false;
    if (id) Object.assign(f, d); else DB.fournisseurs.push({ id: uid(), ...d });
    save(); render(); toast('Fournisseur enregistré', 'ok');
  });
}

/* ---------- Checklists (#27) ---------- */
let checkTab = 'ouverture';
function scrChecklists() {
  const key = checkTab; const list = DB.checklists[key];
  const done = list.filter(x => x.fait).length; const pct = list.length ? Math.round(done / list.length * 100) : 0;
  return `
    <div class="segment">
      <button class="${key === 'ouverture' ? 'on' : ''}" onclick="setCheckTab('ouverture')">🌅 Ouverture</button>
      <button class="${key === 'fermeture' ? 'on' : ''}" onclick="setCheckTab('fermeture')">🌙 Fermeture</button>
    </div>
    <div class="card">
      <div class="spread" style="margin-bottom:10px"><strong>${done}/${list.length} fait${done > 1 ? 's' : ''}</strong><span class="pill ${pct === 100 ? 'p-ok' : 'p-muted'}">${pct}%</span></div>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <div style="margin-top:8px">
        ${list.map(it => `<div class="check ${it.fait ? 'done' : ''}">
          <input type="checkbox" ${it.fait ? 'checked' : ''} id="ck_${it.id}" onchange="toggleCheck('${key}','${it.id}')">
          <label for="ck_${it.id}">${esc(it.texte)}</label>
          <button class="icon-btn" onclick="delCheck('${key}','${it.id}')">${I.trash}</button>
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <input id="newChk" placeholder="Ajouter une tâche…" style="flex:1;padding:11px 12px;border:1px solid var(--line);border-radius:11px;background:var(--surface-2);color:var(--ink);font-size:15px" onkeydown="if(event.key==='Enter')addCheck('${key}')">
        <button class="btn-sm btn" onclick="addCheck('${key}')">Ajouter</button>
      </div>
    </div>
    <button class="btn btn-soft" style="margin-top:14px" onclick="resetCheck('${key}')">Réinitialiser la checklist</button>`;
}
function setCheckTab(k) { checkTab = k; render(); }
function toggleCheck(key, id) { const it = DB.checklists[key].find(x => x.id === id); if (it) { it.fait = !it.fait; save(); render(); } }
function addCheck(key) { const i = $('#newChk'); const t = i.value.trim(); if (!t) return; DB.checklists[key].push({ id: uid(), texte: t, fait: false }); save(); render(); }
function delCheck(key, id) { DB.checklists[key] = DB.checklists[key].filter(x => x.id !== id); save(); render(); }
function resetCheck(key) { if (!confirm('Décocher toutes les tâches ?')) return; DB.checklists[key].forEach(x => x.fait = false); save(); render(); toast('Checklist réinitialisée', 'ok'); }

/* ---------- Notes (#30) ---------- */
function scrNotes() {
  const notes = DB.notes.slice().sort((a, b) => (b.epingle - a.epingle) || (b.ts - a.ts));
  if (!notes.length) return empty(I.note, 'Aucune note', 'Touchez + pour écrire une consigne.');
  return `<div class="rows">${notes.map(n => `
    <div class="row ${n.epingle ? 'pinned' : ''}" style="align-items:flex-start">
      <div class="r-main"><div class="r-title" style="font-weight:500;font-size:14.5px">${n.epingle ? '📌 ' : ''}${esc(n.texte).replace(/\n/g, '<br>')}</div>
        <div class="r-sub">${esc(n.auteur)} · ${frDT(n.ts)}</div></div>
      <div class="r-right"><button class="icon-btn" onclick="pinNote('${n.id}')" aria-label="Épingler">${n.epingle ? '📍' : '📌'}</button>
        <button class="icon-btn" onclick="editNote('${n.id}')">${I.edit}</button>
        <button class="icon-btn" onclick="delItem('notes','${n.id}')">${I.trash}</button></div></div>`).join('')}</div>`;
}
function editNote(id) {
  const n = id ? DB.notes.find(x => x.id === id) : { texte: '', auteur: 'Direction', epingle: false };
  sheet(id ? 'Modifier la note' : 'Nouvelle note', `
    ${fld('Consigne / message', `<textarea id="m_texte" style="min-height:120px">${esc(n.texte)}</textarea>`)}
    <div class="form-row">${fld('Auteur', `<input id="m_aut" value="${esc(n.auteur)}">`)}${fld('Épingler', `<select id="m_pin"><option value="0" ${!n.epingle ? 'selected' : ''}>Non</option><option value="1" ${n.epingle ? 'selected' : ''}>Oui</option></select>`)}</div>
  `, () => {
    const texte = $('#m_texte').value.trim(); if (!texte) return toast('La note est vide', 'err'), false;
    const d = { texte, auteur: $('#m_aut').value.trim() || 'Équipe', epingle: $('#m_pin').value === '1' };
    if (id) Object.assign(n, d); else DB.notes.push({ id: uid(), ts: Date.now(), ...d });
    save(); render(); toast('Note enregistrée', 'ok');
  });
}
function pinNote(id) { const n = DB.notes.find(x => x.id === id); if (n) { n.epingle = !n.epingle; save(); render(); } }

/* =========================================================================
   SCANNER LE TICKET (#5/#6) — lecture sur l'appareil, gratuite (Tesseract.js)
   La photo ne quitte pas le téléphone. Écran de validation avant d'appliquer.
   ========================================================================= */
let scan = { phase: 'idle', progress: 0, lines: [] };
let tesseractPromise = null;

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractPromise) return tesseractPromise;
  tesseractPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error('indispo'));
    s.onerror = () => reject(new Error('reseau'));
    document.head.appendChild(s);
    setTimeout(() => { if (!window.Tesseract) reject(new Error('timeout')); }, 25000);
  });
  return tesseractPromise;
}

function openScan() { scan = { phase: 'idle', progress: 0, lines: [] }; go('scan'); }
function resetScan() { scan = { phase: 'idle', progress: 0, lines: [] }; render(); }

function scrScan() {
  if (scan.phase === 'reading') return `
    <div class="empty" style="padding-top:56px">
      <div class="ico" style="animation:spin 1s linear infinite">${I.search}</div>
      <strong style="display:block;font-size:16px;color:var(--ink)">Lecture du ticket…</strong>
      <div class="muted" style="margin-top:6px;max-width:260px;margin-inline:auto">La toute première fois, le lecteur se télécharge (quelques secondes).</div>
      <div class="progress" style="max-width:220px;margin:18px auto 0"><span id="ocrBar" style="width:${scan.progress}%"></span></div>
      <div id="ocrPct" style="margin-top:8px;font-weight:700">${scan.progress}%</div>
    </div>`;

  if (scan.phase === 'manual') return `
    <div class="card" style="margin-bottom:12px"><strong>Saisir le ticket</strong>
      <p class="muted" style="font-size:13px;margin:6px 0 0">Une ligne par article : <b>quantité puis nom</b>.<br>Ex. « 3 Chablis », « 12 Coca », « 6 Café ».</p></div>
    <textarea id="manualText" style="width:100%;min-height:170px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);color:var(--ink);font-size:15px;font-family:inherit" placeholder="3 Chablis&#10;12 Coca&#10;6 Café"></textarea>
    <button class="btn" style="margin-top:12px" onclick="analyzeManual()">Analyser</button>
    <button class="btn btn-soft" style="margin-top:10px" onclick="resetScan()">Retour</button>`;

  if (scan.phase === 'review') return scanReviewView();

  // idle
  return `
    <div class="card" style="margin-bottom:14px">
      <strong>Scanner le ticket du soir</strong>
      <p class="muted" style="font-size:13.5px;margin:6px 0 0">Prends en photo le ticket récapitulatif des ventes. L'app lit les articles et te propose la mise à jour des stocks — tu valides avant que quoi que ce soit ne change.</p>
    </div>
    <label class="btn" style="display:block;text-align:center;cursor:pointer">📷 Prendre le ticket en photo
      <input type="file" accept="image/*" capture="environment" hidden onchange="handleScanFile(this)"></label>
    <label class="btn btn-soft" style="display:block;text-align:center;margin-top:10px;cursor:pointer">🖼️ Choisir une image
      <input type="file" accept="image/*" hidden onchange="handleScanFile(this)"></label>
    <button class="btn btn-outline" style="margin-top:10px" onclick="scanManual()">✍️ Saisir le ticket à la main</button>
    <p class="muted" style="font-size:12px;text-align:center;margin-top:18px">🔒 La photo est analysée sur ton téléphone — rien n'est envoyé sur internet.</p>`;
}

function handleScanFile(input) { const f = input.files && input.files[0]; if (f) startOcr(f); }
function scanManual() { scan.phase = 'manual'; render(); }
function analyzeManual() {
  scan.lines = buildReview(parseTicketText($('#manualText').value));
  if (!scan.lines.length) return toast('Rien à analyser', 'err');
  scan.phase = 'review'; render();
}

async function startOcr(file) {
  scan.phase = 'reading'; scan.progress = 0; render();
  try {
    const T = await loadTesseract();
    const { data } = await T.recognize(file, 'fra', {
      logger: m => {
        if (m.status === 'recognizing text') {
          scan.progress = Math.round(m.progress * 100);
          const bar = $('#ocrBar'), pct = $('#ocrPct');
          if (bar) bar.style.width = scan.progress + '%';
          if (pct) pct.textContent = scan.progress + '%';
        }
      }
    });
    scan.lines = buildReview(parseTicketText(data.text));
    scan.phase = 'review'; render();
    if (!scan.lines.length) toast('Aucune ligne détectée — réessaie ou saisis à la main', 'err');
  } catch (e) {
    toast('Lecture auto indisponible ici — passe en saisie manuelle', 'err');
    scanManual();
  }
}

/* Analyse du texte du ticket -> [{name, qty}] */
function parseTicketText(text) {
  const out = [];
  for (let raw of String(text).split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/total|sous-tot|tva|montant|caisse|serveur|table|reglement|règlement|carte|especes|espèces|merci|ticket|^[-=_*.\s]+$/i.test(line)) continue;
    let qty = null, name = null, m;
    if ((m = line.match(/^(\d{1,3})\s*[xX*]\s*(.+)$/))) { qty = +m[1]; name = m[2]; }
    else if ((m = line.match(/^(.+?)\s*[xX*]\s*(\d{1,3})\b.*$/))) { qty = +m[2]; name = m[1]; }
    else if ((m = line.match(/^(\d{1,3})\s+([A-Za-zÀ-ÿ].*)$/))) { qty = +m[1]; name = m[2]; }
    if (!name || qty == null) continue;
    name = name.replace(/[\d.,€%\-\s]+$/g, '').replace(/\s{2,}/g, ' ').trim();
    if (name.length < 2 || qty < 1 || qty > 999) continue;
    out.push({ name, qty });
  }
  return out;
}

function buildReview(parsed) {
  return parsed.map(p => { const mt = matchItem(p.name); return { name: p.name, qty: p.qty, target: mt ? mt.kind + ':' + mt.id : '' }; });
}

const normTxt = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function matchItem(name) {
  const n = normTxt(name); if (!n) return null;
  const cands = [...DB.stocks.map(s => ({ kind: 'stock', id: s.id, label: s.nom })), ...DB.vins.map(v => ({ kind: 'cave', id: v.id, label: v.nom }))];
  let best = null, score = 0;
  for (const c of cands) { const s = simScore(n, normTxt(c.label)); if (s > score) { score = s; best = c; } }
  return score >= 0.5 ? best : null;
}
function simScore(a, b) {
  const ta = a.split(' ').filter(t => t.length >= 3), tb = new Set(b.split(' ').filter(t => t.length >= 3));
  let inter = 0; ta.forEach(t => { if (tb.has(t)) inter++; });
  let s = inter / Math.max(1, Math.min(ta.length, tb.size));
  if (a.includes(b) || b.includes(a)) s = Math.max(s, 0.85);
  return s;
}

function scanReviewView() {
  if (!scan.lines.length) return `<div class="card">Aucune ligne à valider.</div><button class="btn" style="margin-top:12px" onclick="resetScan()">Recommencer</button>`;
  const matched = scan.lines.filter(l => l.target).length;
  const opts = (sel) => `<option value="">— ne pas décompter —</option>`
    + `<optgroup label="Stocks">${DB.stocks.map(s => `<option value="stock:${s.id}" ${sel === 'stock:' + s.id ? 'selected' : ''}>${esc(s.nom)}</option>`).join('')}</optgroup>`
    + `<optgroup label="Cave">${DB.vins.map(v => `<option value="cave:${v.id}" ${sel === 'cave:' + v.id ? 'selected' : ''}>${esc(v.nom)}</option>`).join('')}</optgroup>`;
  return `
    <div class="card" style="margin-bottom:12px">
      <strong>${scan.lines.length} ligne(s) détectée(s)</strong>
      <div class="muted" style="font-size:13px;margin-top:2px">${matched} reconnue(s) automatiquement. Vérifie les quantités et les correspondances, puis applique.</div>
    </div>
    <div class="grid-list">
      ${scan.lines.map((l, i) => `
        <div class="tile ${l.target ? '' : 'nomatch'}">
          <div class="spread">
            <div class="tile-title" style="font-size:14.5px">${esc(l.name)}${l.target ? '' : ' <span class="pill p-warn">à relier</span>'}</div>
            <button class="icon-btn" onclick="removeScanLine(${i})" aria-label="Retirer">${I.trash}</button>
          </div>
          <div class="form-row" style="margin-top:10px">
            ${fld('Quantité vendue', `<input type="number" inputmode="numeric" min="0" value="${l.qty}" onchange="setScanQty(${i}, this.value)">`)}
            ${fld('Décompter de', `<select onchange="setScanTarget(${i}, this.value)">${opts(l.target)}</select>`)}
          </div>
        </div>`).join('')}
    </div>
    <button class="btn" style="margin-top:14px" onclick="applyScan()">Appliquer aux stocks</button>
    <button class="btn btn-soft" style="margin-top:10px" onclick="resetScan()">Recommencer</button>`;
}
function setScanQty(i, v) { if (scan.lines[i]) scan.lines[i].qty = Math.max(0, +v || 0); }
function setScanTarget(i, v) { if (scan.lines[i]) scan.lines[i].target = v; }
function removeScanLine(i) { scan.lines.splice(i, 1); render(); }
function applyScan() {
  let ok = 0, skip = 0;
  scan.lines.forEach(l => {
    if (!l.target || !l.qty) { skip++; return; }
    const [kind, id] = l.target.split(':');
    const coll = kind === 'cave' ? DB.vins : DB.stocks;
    const it = coll.find(x => x.id === id);
    if (it) { it.quantite = Math.max(0, +it.quantite - +l.qty); ok++; } else skip++;
  });
  if (!ok) return toast('Aucune ligne reliée à un article', 'err');
  save();
  toast(`${ok} article(s) mis à jour${skip ? ` · ${skip} ignoré(s)` : ''}`, 'ok');
  scan = { phase: 'idle', progress: 0, lines: [] };
  go('stocks');
}

/* =========================================================================
   COMPOSANTS PARTAGÉS
   ========================================================================= */
const fld = (label, input) => `<div class="field"><label>${esc(label)}</label>${input}</div>`;
const searchBar = (ph) => `<div class="search">${I.search}<input type="text" placeholder="${esc(ph)}" oninput="filterList(this.value)"></div>`;
const empty = (ic, t, d) => `<div class="empty"><div class="ico">${ic}</div><strong style="display:block;font-size:16px;color:var(--ink)">${esc(t)}</strong><div style="margin-top:4px">${esc(d)}</div></div>`;

function filterList(q) {
  q = q.toLowerCase();
  $$('#list [data-search]').forEach(el => { el.style.display = el.dataset.search.toLowerCase().includes(q) ? '' : 'none'; });
}

function delItem(collection, id) {
  const labels = { stocks: 'ce produit', fournisseurs: 'ce fournisseur', vins: 'cette référence', staff: 'cet employé', planning: 'ce service', menus: 'cette ligne', comm: 'ce message', notes: 'cette note' };
  if (!confirm(`Supprimer ${labels[collection] || 'cet élément'} ?`)) return;
  DB[collection] = DB[collection].filter(x => x.id !== id); save(); render(); toast('Supprimé');
}

/* ---------- Bottom sheet ---------- */
let sheetConfirm = null;
function sheet(title, body, onConfirm) {
  sheetConfirm = onConfirm;
  $('#modalRoot').innerHTML = `
    <div class="sheet-overlay" onclick="if(event.target===this)closeSheet()">
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-grip"></div>
        <div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" onclick="closeSheet()">✕</button></div>
        <div class="sheet-body">${body}</div>
        <div class="sheet-foot"><button class="btn btn-outline" onclick="closeSheet()">Annuler</button><button class="btn" onclick="submitSheet()">Enregistrer</button></div>
      </div>
    </div>`;
  const first = $('#modalRoot input, #modalRoot textarea, #modalRoot select');
  if (first) setTimeout(() => first.focus(), 120);
}
function submitSheet() { if (sheetConfirm && sheetConfirm() === false) return; closeSheet(); }
function closeSheet() { $('#modalRoot').innerHTML = ''; sheetConfirm = null; }

/* ---------- Toast ---------- */
function toast(msg, kind = '') {
  const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = msg;
  $('#toastRoot').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; setTimeout(() => el.remove(), 300); }, 2400);
}

/* ---------- Thème ---------- */
function applyTheme() { const t = localStorage.getItem(THEME_KEY); if (t) document.documentElement.setAttribute('data-theme', t); }
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  toast('Thème ' + (next === 'dark' ? 'sombre' : 'clair'), 'ok');
}

/* ---------- Import / Export ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `jeroboam120-sauvegarde-${todayISO()}.json`; a.click(); URL.revokeObjectURL(url);
  toast('Sauvegarde exportée', 'ok');
}
function importData(file) {
  const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); if (!d.stocks || !d.checklists) throw 0; if (!confirm('Remplacer toutes les données par ce fichier ?')) return; DB = d; save(); render(); toast('Données importées', 'ok'); } catch { toast('Fichier invalide', 'err'); } };
  r.readAsText(file);
}

/* =========================================================================
   NAVIGATION (tab bar + écrans)
   ========================================================================= */
const SCREENS = {
  accueil:       { title: 'Jéroboam 120', brand: true, tab: 'accueil', render: scrAccueil },
  stocks:        { title: 'Stocks', tab: 'stocks', render: scrStocks, fab: 'editStock' },
  scan:          { title: 'Scanner le ticket', tab: 'stocks', back: 'stocks', render: scrScan },
  cave:          { title: 'Cave / Vins', tab: 'cave', render: scrCave, fab: 'editVin' },
  menu:          { title: 'Menu du jour', tab: 'menu', render: scrMenu, fab: 'editMenuLine' },
  plus:          { title: 'Plus', tab: 'plus', render: scrPlus },
  communication: { title: 'Salle ↔ Cuisine', tab: 'plus', back: 'plus', render: scrCommunication },
  planning:      { title: 'Planning équipe', tab: 'plus', back: 'plus', render: scrPlanning },
  fournisseurs:  { title: 'Fournisseurs', tab: 'plus', back: 'plus', render: scrFournisseurs, fab: 'editFournisseur' },
  checklists:    { title: 'Checklists', tab: 'plus', back: 'plus', render: scrChecklists },
  notes:         { title: 'Notes & consignes', tab: 'plus', back: 'plus', render: scrNotes, fab: 'editNote' },
};
const TABS = [
  { id: 'accueil', label: 'Accueil', icon: I.home },
  { id: 'stocks', label: 'Stocks', icon: I.box, badge: () => stockBas().length },
  { id: 'cave', label: 'Cave', icon: I.wine, badge: () => vinBas().length },
  { id: 'menu', label: 'Menu', icon: I.menu },
  { id: 'plus', label: 'Plus', icon: I.more, badge: () => commOuverts().length },
];

function go(screen) { location.hash = '#/' + screen; }
function currentScreen() { const h = location.hash.replace(/^#\//, ''); return SCREENS[h] ? h : 'accueil'; }

function renderTabbar(activeTab) {
  $('#tabbar').innerHTML = TABS.map(t => {
    const n = t.badge ? t.badge() : 0;
    return `<button class="tab ${t.id === activeTab ? 'active' : ''}" onclick="go('${t.id}')">
      ${t.icon}<span>${t.label}</span>
      <span class="tab-badge ${n > 0 ? 'show' : ''}">${n}</span></button>`;
  }).join('');
}
function renderAppbar(s) {
  const left = s.back
    ? `<button class="appbar-btn" onclick="go('${s.back}')" aria-label="Retour">${I.back}</button>`
    : '';
  const right = s.tab === 'accueil'
    ? `<button class="appbar-btn" onclick="toggleTheme()" aria-label="Thème">${I.theme}</button>`
    : '';
  $('#appbar').innerHTML = `${left}<div class="appbar-title ${s.brand ? 'brand' : ''}">${s.brand ? 'Jéroboam <b>120</b>' : esc(s.title)}</div>${right}`;
}
function renderFab(s) {
  const fab = $('#fab');
  if (s.fab) { fab.hidden = false; fab.innerHTML = I.plus; fab.onclick = () => window[s.fab](); }
  else { fab.hidden = true; fab.onclick = null; }
}

function render() {
  const key = currentScreen(); const s = SCREENS[key];
  $('#view').innerHTML = s.render();
  renderAppbar(s); renderFab(s); renderTabbar(s.tab);
  $('#view').scrollIntoView({ block: 'start' });
  window.scrollTo(0, 0);
}

/* ---------- Init ---------- */
applyTheme();
window.addEventListener('hashchange', render);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
document.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#/accueil';
  $('#importFile').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
  render();
});

/* ---------- Connexion / synchronisation ---------- */
async function cloudLogin() {
  const el = $('#cloudEmail');
  const email = ((el && el.value) || loginStep.email || '').trim();
  if (!email || !/.+@.+\..+/.test(email)) return toast('Entre un email valide', 'err');
  const err = await window.Cloud.signIn(email);
  if (err) return toast('Erreur : ' + err.message, 'err');
  loginStep = { sent: true, email };
  toast('Code envoyé — regarde tes emails 📩', 'ok');
  render();
}
async function cloudVerify() {
  const code = (($('#cloudCode') && $('#cloudCode').value) || '').replace(/\s/g, '');
  if (code.length < 6) return toast('Entre le code à 6 chiffres', 'err');
  const err = await window.Cloud.verifyCode(loginStep.email, code);
  if (err) toast('Code invalide ou expiré', 'err');
  // Succès : géré par onAuthStateChange -> synchro -> écran « Connecté »
}
function cloudResetLogin() { loginStep = { sent: false, email: '' }; render(); }
function cloudLogout() { window.Cloud.signOut(); loginStep = { sent: false, email: '' }; toast('Déconnecté'); }

/* Pont avec la couche cloud (cloud.js) */
window.__jero = {
  // Applique un état venu du cloud : met à jour le cache local + l'affichage,
  // SANS repousser vers le cloud (sinon boucle de synchro entre appareils).
  setState(d) {
    DB = normalize(d);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); } catch (e) { /* cache seul */ }
    render();
  },
  getState() { return DB; },
  onCloudState(s) { cloudState = s; if (currentScreen() === 'plus') render(); },
};

/* Exposition pour les onclick inline */
Object.assign(window, {
  go, editStock, quickRestock, editVin, quickVin, editMenuLine,
  editFournisseur, addComm, toggleComm, setCheckTab, toggleCheck,
  setPlanningTab, planningWeekShift, generatePlanning, addAssignment, removeAssignment,
  editStaff, setBesoin, setBesoinActif,
  addCheck, delCheck, resetCheck, editNote, pinNote, delItem, filterList,
  exportData, toggleTheme, closeSheet, submitSheet, $,
  openScan, resetScan, handleScanFile, scanManual, analyzeManual,
  setScanQty, setScanTarget, removeScanLine, applyScan,
  cloudLogin, cloudVerify, cloudResetLogin, cloudLogout,
});
