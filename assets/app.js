/* =========================================================================
   Jéroboam 120 — Application de gestion de restaurant
   App web autonome (aucun serveur). Données persistées dans le navigateur
   via localStorage. Export / import JSON pour sauvegarde et transfert.
   ========================================================================= */

'use strict';

const STORAGE_KEY = 'jero120.data.v1';

/* ---------- Utilitaires ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const uid = () => 'id' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayISO = () => new Date().toISOString().slice(0, 10);
const eur = (n) => (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

function frDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
}
function frDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' +
         d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* ---------- Persistance ---------- */
let DB = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('Lecture stockage impossible', e); }
  return seed();
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }
  catch (e) { toast('Sauvegarde impossible (stockage plein ?)', 'err'); }
  refreshBadges();
}

/* ---------- Données de démonstration ---------- */
function seed() {
  const t = todayISO();
  return {
    fournisseurs: [
      { id: 'f1', nom: 'Metro Rungis', categorie: 'Épicerie', contact: 'M. Bernard', telephone: '01 45 12 33 00', email: 'commandes@metro.fr', delai: 1, notes: 'Livraison avant 10h' },
      { id: 'f2', nom: 'Maison Dubois — Primeurs', categorie: 'Fruits & légumes', contact: 'Claire Dubois', telephone: '06 12 45 78 90', email: 'claire@dubois-primeurs.fr', delai: 1, notes: '' },
      { id: 'f3', nom: 'Boucherie Lefèvre', categorie: 'Viandes', contact: 'Paul Lefèvre', telephone: '01 43 55 21 10', email: 'paul@boucherie-lefevre.fr', delai: 2, notes: 'Fermé le lundi' },
      { id: 'f4', nom: 'Domaines & Terroirs', categorie: 'Vins & spiritueux', contact: 'Sophie Marchand', telephone: '03 80 24 11 22', email: 'contact@domaines-terroirs.fr', delai: 4, notes: 'Franco à partir de 12 bouteilles' },
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
    planning: [
      { id: 'p1', employe: 'Julien Roy', role: 'Chef de cuisine', jour: t, debut: '09:00', fin: '15:00' },
      { id: 'p2', employe: 'Amina Chef', role: 'Cheffe de rang', jour: t, debut: '11:00', fin: '16:00' },
      { id: 'p3', employe: 'Lucas Petit', role: 'Serveur', jour: t, debut: '18:00', fin: '23:30' },
    ],
    plats: [
      { id: 'd1', nom: 'Suprême de volaille, jus au thym', description: 'Écrasé de pommes de terre à l\'huile d\'olive', prix: 24, date: t, dispo: true },
      { id: 'd2', nom: 'Risotto aux champignons', description: 'Parmesan 24 mois, roquette', prix: 19, date: t, dispo: true },
    ],
    comm: [
      { id: 'c1', type: 'message', texte: 'Table 12 : allergie fruits à coque, à signaler en cuisine.', auteur: 'Salle', ts: Date.now() - 3600e3, resolu: false },
    ],
    checklists: {
      ouverture: [
        { id: 'o1', texte: 'Relever les températures des frigos et congélateurs', fait: false },
        { id: 'o2', texte: 'Allumer la machine à café et le four', fait: false },
        { id: 'o3', texte: 'Vérifier la mise en place des tables', fait: false },
        { id: 'o4', texte: 'Contrôler la caisse (fond de caisse)', fait: false },
        { id: 'o5', texte: 'Briefing équipe : plats du jour & 86', fait: false },
      ],
      fermeture: [
        { id: 'ff1', texte: 'Nettoyer et désinfecter les plans de travail', fait: false },
        { id: 'ff2', texte: 'Vider et nettoyer les frigos si besoin', fait: false },
        { id: 'ff3', texte: 'Sortir les poubelles et le tri', fait: false },
        { id: 'ff4', texte: 'Compter la caisse et fermer le TPE', fait: false },
        { id: 'ff5', texte: 'Éteindre équipements, gaz et lumières', fait: false },
        { id: 'ff6', texte: 'Fermer portes et activer l\'alarme', fait: false },
      ],
    },
    notes: [
      { id: 'n1', texte: 'Fournisseur vins fermé du 14 au 21 : anticiper la commande de Champagne.', auteur: 'Direction', ts: Date.now() - 86400e3, epingle: true },
      { id: 'n2', texte: 'Formation nouveau serveur mardi 14h.', auteur: 'Direction', ts: Date.now() - 43200e3, epingle: false },
    ],
  };
}

/* ---------- Requêtes dérivées ---------- */
const stockBas = () => DB.stocks.filter(s => Number(s.quantite) <= Number(s.seuil));
const vinBas = () => DB.vins.filter(v => Number(v.quantite) <= Number(v.seuil));
const commOuverts = () => DB.comm.filter(c => !c.resolu);
const fournisseurNom = (id) => (DB.fournisseurs.find(f => f.id === id) || {}).nom || '—';

/* =========================================================================
   VUES
   ========================================================================= */

function viewTableauDeBord() {
  const sb = stockBas(), vb = vinBas(), co = commOuverts();
  const platsJour = DB.plats.filter(p => p.date === todayISO());
  const planningJour = DB.planning.filter(p => p.jour === todayISO());
  const valeurCave = DB.vins.reduce((t, v) => t + Number(v.quantite) * Number(v.prixAchat || 0), 0);
  const totalAlertes = sb.length + vb.length;

  const chkO = DB.checklists.ouverture, chkF = DB.checklists.fermeture;
  const pctO = chkO.length ? Math.round(chkO.filter(x => x.fait).length / chkO.length * 100) : 0;
  const pctF = chkF.length ? Math.round(chkF.filter(x => x.fait).length / chkF.length * 100) : 0;

  return `
    ${pageHead('Tableau de bord', 'Vue d\'ensemble — ' + new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}
    <div class="grid dash-grid">
      ${stat(totalAlertes, 'Alertes de stock', totalAlertes ? 'À réapprovisionner' : 'Tout est au niveau', totalAlertes ? 'red' : 'green')}
      ${stat(co.length, 'Messages salle ↔ cuisine', co.length ? 'En attente' : 'Aucun en attente', co.length ? 'amber' : 'green')}
      ${stat(platsJour.length, 'Plats du jour', 'Programmés aujourd\'hui', '')}
      ${stat(eur(valeurCave), 'Valeur de la cave', DB.vins.reduce((t, v) => t + Number(v.quantite), 0) + ' bouteilles', '')}
    </div>

    <div class="dash-cols">
      <div class="card">
        <h3>⚠️ Réapprovisionnement</h3>
        ${totalAlertes === 0
          ? '<p class="muted">Aucun produit sous le seuil. 👌</p>'
          : `<div class="list">${[...sb.map(s => alertRow(s.nom, `${s.quantite} ${s.unite} / seuil ${s.seuil}`, 'Stock')),
              ...vb.map(v => alertRow(v.nom, `${v.quantite} bt / seuil ${v.seuil}`, 'Cave'))].join('')}</div>`}
      </div>

      <div class="card">
        <h3>🍽️ Plats du jour</h3>
        ${platsJour.length === 0
          ? '<p class="muted">Aucun plat programmé. <a href="#/plats-du-jour">En ajouter →</a></p>'
          : `<div class="list">${platsJour.map(p => `
            <div class="list-item" style="padding:11px 14px">
              <div class="li-main">
                <strong>${esc(p.nom)}</strong> ${p.dispo ? '' : '<span class="badge badge-danger">86 / épuisé</span>'}
                <div class="li-meta">${esc(p.description || '')}</div>
              </div>
              <span class="badge badge-wine">${eur(p.prix)}</span>
            </div>`).join('')}</div>`}
      </div>

      <div class="card">
        <h3>🗓️ Équipe du jour</h3>
        ${planningJour.length === 0
          ? '<p class="muted">Aucun service programmé aujourd\'hui.</p>'
          : `<div class="list">${planningJour.map(p => `
            <div class="list-item" style="padding:11px 14px">
              <div class="li-main"><strong>${esc(p.employe)}</strong><div class="li-meta">${esc(p.role)}</div></div>
              <span class="badge badge-muted nowrap">${p.debut} – ${p.fin}</span>
            </div>`).join('')}</div>`}
      </div>

      <div class="card">
        <h3>✅ Checklists du jour</h3>
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;font-size:13.5px"><span>Ouverture</span><strong>${pctO}%</strong></div>
          <div class="progress"><span style="width:${pctO}%"></span></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:13.5px"><span>Fermeture</span><strong>${pctF}%</strong></div>
          <div class="progress"><span style="width:${pctF}%"></span></div>
        </div>
        <p style="margin:14px 0 0"><a href="#/checklists">Ouvrir les checklists →</a></p>
      </div>

      <div class="card">
        <h3>📝 Dernières consignes</h3>
        ${DB.notes.length === 0
          ? '<p class="muted">Aucune note.</p>'
          : `<div class="list">${DB.notes.slice().sort((a,b)=> (b.epingle-a.epingle)||(b.ts-a.ts)).slice(0,3).map(n => `
            <div class="list-item ${n.epingle ? 'pinned' : ''}" style="padding:11px 14px">
              <div class="li-main">${n.epingle ? '📌 ' : ''}${esc(n.texte)}<div class="li-meta">${esc(n.auteur)} · ${frDateTime(n.ts)}</div></div>
            </div>`).join('')}</div>`}
      </div>
    </div>`;
}
const alertRow = (nom, detail, tag) => `
  <div class="list-item" style="padding:11px 14px;border-left:3px solid var(--red)">
    <div class="li-main"><strong>${esc(nom)}</strong><div class="li-meta">${esc(detail)}</div></div>
    <span class="badge badge-muted">${tag}</span>
  </div>`;

/* ---------- Stocks (#5 + #6) ---------- */
function viewStocks() {
  const bas = stockBas();
  const rows = DB.stocks.slice().sort((a, b) => (a.quantite <= a.seuil ? -1 : 1) - (b.quantite <= b.seuil ? -1 : 1) || a.nom.localeCompare(b.nom));
  return `
    ${pageHead('Stocks', 'Inventaire et alertes de réapprovisionnement', `<button class="btn" onclick="editStock()">+ Produit</button>`)}
    ${bas.length ? `<div class="card" style="border-left:4px solid var(--red);margin-bottom:18px">
      <strong>⚠️ ${bas.length} produit(s) à réapprovisionner :</strong> ${bas.map(s => esc(s.nom)).join(', ')}.
    </div>` : ''}
    <div class="toolbar">
      <div class="search"><input type="text" id="stockSearch" placeholder="Rechercher un produit…" oninput="filterTable('stocksTable', this.value)"></div>
    </div>
    <div class="table-wrap">
      <table id="stocksTable">
        <thead><tr><th>Produit</th><th>Catégorie</th><th class="num">Quantité</th><th class="num">Seuil</th><th>Fournisseur</th><th>État</th><th></th></tr></thead>
        <tbody>
          ${rows.map(s => {
            const low = Number(s.quantite) <= Number(s.seuil);
            return `<tr class="${low ? 'row-alert' : ''}">
              <td><strong>${esc(s.nom)}</strong></td>
              <td>${esc(s.categorie)}</td>
              <td class="num">${esc(s.quantite)} ${esc(s.unite)}</td>
              <td class="num muted">${esc(s.seuil)} ${esc(s.unite)}</td>
              <td>${esc(fournisseurNom(s.fournisseurId))}</td>
              <td>${low ? '<span class="badge badge-danger">À commander</span>' : '<span class="badge badge-ok">OK</span>'}</td>
              <td class="nowrap right">
                <button class="icon-btn" title="Réappro" onclick="quickRestock('${s.id}')">➕</button>
                <button class="icon-btn" title="Modifier" onclick="editStock('${s.id}')">✏️</button>
                <button class="icon-btn" title="Supprimer" onclick="delItem('stocks','${s.id}')">🗑️</button>
              </td></tr>`;
          }).join('') || emptyRow(7, 'Aucun produit en stock.')}
        </tbody>
      </table>
    </div>`;
}
function editStock(id) {
  const s = id ? DB.stocks.find(x => x.id === id) : { nom: '', categorie: 'Épicerie', unite: 'kg', quantite: 0, seuil: 0, fournisseurId: DB.fournisseurs[0]?.id || '' };
  const opts = DB.fournisseurs.map(f => `<option value="${f.id}" ${f.id === s.fournisseurId ? 'selected' : ''}>${esc(f.nom)}</option>`).join('');
  openModal(id ? 'Modifier le produit' : 'Nouveau produit', `
    ${fld('Nom du produit', `<input id="m_nom" value="${esc(s.nom)}" placeholder="Ex. Farine T55">`)}
    <div class="form-row">
      ${fld('Catégorie', `<input id="m_cat" value="${esc(s.categorie)}" list="catList"><datalist id="catList"><option>Épicerie</option><option>Crémerie</option><option>Fruits & légumes</option><option>Viandes</option><option>Poissons</option><option>Boissons</option></datalist>`)}
      ${fld('Unité', `<select id="m_unite">${['kg','g','L','cl','pièce','botte','boîte'].map(u=>`<option ${u===s.unite?'selected':''}>${u}</option>`).join('')}</select>`)}
    </div>
    <div class="form-row">
      ${fld('Quantité en stock', `<input id="m_qte" type="number" min="0" step="0.1" value="${esc(s.quantite)}">`)}
      ${fld('Seuil d\'alerte', `<input id="m_seuil" type="number" min="0" step="0.1" value="${esc(s.seuil)}">`)}
    </div>
    ${fld('Fournisseur', `<select id="m_four">${opts}</select>`)}
  `, () => {
    const data = {
      nom: $('#m_nom').value.trim(), categorie: $('#m_cat').value.trim(),
      unite: $('#m_unite').value, quantite: Number($('#m_qte').value), seuil: Number($('#m_seuil').value),
      fournisseurId: $('#m_four').value,
    };
    if (!data.nom) return toast('Le nom est obligatoire', 'err'), false;
    if (id) Object.assign(s, data); else DB.stocks.push({ id: uid(), ...data });
    save(); render(); toast('Produit enregistré', 'ok');
  });
}
function quickRestock(id) {
  const s = DB.stocks.find(x => x.id === id); if (!s) return;
  const v = prompt(`Réapprovisionner « ${s.nom} » — quantité reçue (${s.unite}) :`, '');
  if (v === null || v === '') return;
  const n = Number(v);
  if (isNaN(n)) return toast('Valeur invalide', 'err');
  s.quantite = Number(s.quantite) + n; save(); render(); toast('Stock mis à jour', 'ok');
}

/* ---------- Fournisseurs (#7) ---------- */
function viewFournisseurs() {
  return `
    ${pageHead('Fournisseurs', 'Contacts, catégories et délais de livraison', `<button class="btn" onclick="editFournisseur()">+ Fournisseur</button>`)}
    <div class="cards">
      ${DB.fournisseurs.map(f => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div><h3 style="margin-bottom:4px">${esc(f.nom)}</h3><span class="badge badge-wine">${esc(f.categorie)}</span></div>
            <div class="nowrap">
              <button class="icon-btn" onclick="editFournisseur('${f.id}')">✏️</button>
              <button class="icon-btn" onclick="delItem('fournisseurs','${f.id}')">🗑️</button>
            </div>
          </div>
          <div style="margin-top:12px;font-size:13.5px;line-height:1.9">
            ${f.contact ? `👤 ${esc(f.contact)}<br>` : ''}
            ${f.telephone ? `📞 <a href="tel:${esc(f.telephone)}">${esc(f.telephone)}</a><br>` : ''}
            ${f.email ? `✉️ <a href="mailto:${esc(f.email)}">${esc(f.email)}</a><br>` : ''}
            ⏱️ Délai : ${esc(f.delai)} j
          </div>
          ${f.notes ? `<div class="li-meta" style="margin-top:10px">📌 ${esc(f.notes)}</div>` : ''}
        </div>`).join('') || `<div class="empty"><div class="empty-ico">🚚</div>Aucun fournisseur enregistré.</div>`}
    </div>`;
}
function editFournisseur(id) {
  const f = id ? DB.fournisseurs.find(x => x.id === id) : { nom: '', categorie: 'Épicerie', contact: '', telephone: '', email: '', delai: 1, notes: '' };
  openModal(id ? 'Modifier le fournisseur' : 'Nouveau fournisseur', `
    ${fld('Nom / raison sociale', `<input id="m_nom" value="${esc(f.nom)}">`)}
    <div class="form-row">
      ${fld('Catégorie', `<input id="m_cat" value="${esc(f.categorie)}">`)}
      ${fld('Délai de livraison (jours)', `<input id="m_delai" type="number" min="0" value="${esc(f.delai)}">`)}
    </div>
    ${fld('Personne de contact', `<input id="m_contact" value="${esc(f.contact)}">`)}
    <div class="form-row">
      ${fld('Téléphone', `<input id="m_tel" value="${esc(f.telephone)}">`)}
      ${fld('Email', `<input id="m_email" type="email" value="${esc(f.email)}">`)}
    </div>
    ${fld('Notes', `<textarea id="m_notes">${esc(f.notes)}</textarea>`)}
  `, () => {
    const data = { nom: $('#m_nom').value.trim(), categorie: $('#m_cat').value.trim(), contact: $('#m_contact').value.trim(),
      telephone: $('#m_tel').value.trim(), email: $('#m_email').value.trim(), delai: Number($('#m_delai').value), notes: $('#m_notes').value.trim() };
    if (!data.nom) return toast('Le nom est obligatoire', 'err'), false;
    if (id) Object.assign(f, data); else DB.fournisseurs.push({ id: uid(), ...data });
    save(); render(); toast('Fournisseur enregistré', 'ok');
  });
}

/* ---------- Cave / Vins (#10) ---------- */
function viewCave() {
  const bas = vinBas();
  const totalBt = DB.vins.reduce((t, v) => t + Number(v.quantite), 0);
  const valeur = DB.vins.reduce((t, v) => t + Number(v.quantite) * Number(v.prixAchat || 0), 0);
  return `
    ${pageHead('Cave / Carte des vins', 'Bouteilles, millésimes, emplacements et valeur du stock', `<button class="btn" onclick="editVin()">+ Référence</button>`)}
    <div class="grid dash-grid" style="margin-bottom:18px">
      ${stat(totalBt, 'Bouteilles en cave', DB.vins.length + ' références', '')}
      ${stat(eur(valeur), 'Valeur (prix d\'achat)', 'Immobilisé en cave', '')}
      ${stat(bas.length, 'Références à recommander', bas.length ? 'Sous le seuil' : 'Cave bien fournie', bas.length ? 'red' : 'green')}
    </div>
    <div class="toolbar"><div class="search"><input type="text" placeholder="Rechercher un vin…" oninput="filterTable('vinTable', this.value)"></div></div>
    <div class="table-wrap">
      <table id="vinTable">
        <thead><tr><th>Cuvée</th><th>Type</th><th>Millésime</th><th>Région</th><th class="num">Stock</th><th>Emplacement</th><th class="num">Vente</th><th></th></tr></thead>
        <tbody>
          ${DB.vins.slice().sort((a,b)=>a.nom.localeCompare(b.nom)).map(v => {
            const low = Number(v.quantite) <= Number(v.seuil);
            return `<tr class="${low ? 'row-alert' : ''}">
              <td><strong>${esc(v.nom)}</strong><div class="li-meta">${esc(v.domaine)}</div></td>
              <td>${typeBadge(v.type)}</td>
              <td>${v.millesime ? esc(v.millesime) : '<span class="muted">S.M.</span>'}</td>
              <td>${esc(v.region)}</td>
              <td class="num">${esc(v.quantite)} ${low ? '<span class="dot dot-red" title="Sous le seuil"></span>' : ''}</td>
              <td class="muted">${esc(v.emplacement)}</td>
              <td class="num">${eur(v.prixVente)}</td>
              <td class="nowrap right">
                <button class="icon-btn" title="Entrée de stock" onclick="quickVin('${v.id}')">➕</button>
                <button class="icon-btn" onclick="editVin('${v.id}')">✏️</button>
                <button class="icon-btn" onclick="delItem('vins','${v.id}')">🗑️</button>
              </td></tr>`;
          }).join('') || emptyRow(8, 'Aucune référence en cave.')}
        </tbody>
      </table>
    </div>`;
}
function typeBadge(t) {
  const map = { 'Rouge': 'badge-danger', 'Blanc': 'badge-warn', 'Rosé': 'badge-wine', 'Effervescent': 'badge-ok' };
  return `<span class="badge ${map[t] || 'badge-muted'}">${esc(t)}</span>`;
}
function editVin(id) {
  const v = id ? DB.vins.find(x => x.id === id) : { nom: '', domaine: '', type: 'Rouge', millesime: '', region: '', quantite: 0, seuil: 6, emplacement: '', prixAchat: 0, prixVente: 0 };
  openModal(id ? 'Modifier la référence' : 'Nouvelle référence', `
    <div class="form-row">
      ${fld('Cuvée / appellation', `<input id="m_nom" value="${esc(v.nom)}">`)}
      ${fld('Domaine / maison', `<input id="m_dom" value="${esc(v.domaine)}">`)}
    </div>
    <div class="form-row">
      ${fld('Type', `<select id="m_type">${['Rouge','Blanc','Rosé','Effervescent','Doux'].map(x=>`<option ${x===v.type?'selected':''}>${x}</option>`).join('')}</select>`)}
      ${fld('Millésime (0 = sans)', `<input id="m_mil" type="number" min="0" value="${esc(v.millesime)}">`)}
    </div>
    <div class="form-row">
      ${fld('Région', `<input id="m_reg" value="${esc(v.region)}">`)}
      ${fld('Emplacement', `<input id="m_emp" value="${esc(v.emplacement)}" placeholder="Cave A — casier 3">`)}
    </div>
    <div class="form-row">
      ${fld('Bouteilles en stock', `<input id="m_qte" type="number" min="0" value="${esc(v.quantite)}">`)}
      ${fld('Seuil d\'alerte', `<input id="m_seuil" type="number" min="0" value="${esc(v.seuil)}">`)}
    </div>
    <div class="form-row">
      ${fld('Prix d\'achat (€)', `<input id="m_pa" type="number" min="0" step="0.5" value="${esc(v.prixAchat)}">`)}
      ${fld('Prix de vente (€)', `<input id="m_pv" type="number" min="0" step="0.5" value="${esc(v.prixVente)}">`)}
    </div>
  `, () => {
    const data = { nom: $('#m_nom').value.trim(), domaine: $('#m_dom').value.trim(), type: $('#m_type').value,
      millesime: Number($('#m_mil').value) || 0, region: $('#m_reg').value.trim(), emplacement: $('#m_emp').value.trim(),
      quantite: Number($('#m_qte').value), seuil: Number($('#m_seuil').value), prixAchat: Number($('#m_pa').value), prixVente: Number($('#m_pv').value) };
    if (!data.nom) return toast('La cuvée est obligatoire', 'err'), false;
    if (id) Object.assign(v, data); else DB.vins.push({ id: uid(), ...data });
    save(); render(); toast('Référence enregistrée', 'ok');
  });
}
function quickVin(id) {
  const v = DB.vins.find(x => x.id === id); if (!v) return;
  const val = prompt(`Entrée de stock — « ${v.nom} » : nombre de bouteilles reçues`, '');
  if (val === null || val === '') return;
  const n = Number(val); if (isNaN(n)) return toast('Valeur invalide', 'err');
  v.quantite = Number(v.quantite) + n; save(); render(); toast('Cave mise à jour', 'ok');
}

/* ---------- Planning (#11) ---------- */
function viewPlanning() {
  // 7 prochains jours
  const days = [];
  const base = new Date(todayISO());
  for (let i = 0; i < 7; i++) { const d = new Date(base); d.setDate(base.getDate() + i); days.push(d.toISOString().slice(0, 10)); }
  return `
    ${pageHead('Planning de l\'équipe', 'Services des 7 prochains jours', `<button class="btn" onclick="editShift()">+ Service</button>`)}
    <div class="grid" style="gap:14px">
      ${days.map(day => {
        const shifts = DB.planning.filter(p => p.jour === day).sort((a, b) => a.debut.localeCompare(b.debut));
        const isToday = day === todayISO();
        return `<div class="card" ${isToday ? 'style="border-left:4px solid var(--wine)"' : ''}>
          <h3 style="text-transform:capitalize">${new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} ${isToday ? '<span class="badge badge-wine">Aujourd\'hui</span>' : ''}</h3>
          ${shifts.length === 0 ? '<p class="muted" style="margin:0">Aucun service.</p>' :
            `<div class="list">${shifts.map(p => `
              <div class="list-item" style="padding:10px 14px">
                <div class="li-main"><strong>${esc(p.employe)}</strong> <span class="li-meta">· ${esc(p.role)}</span></div>
                <span class="badge badge-muted nowrap">${p.debut} – ${p.fin}</span>
                <button class="icon-btn" onclick="editShift('${p.id}')">✏️</button>
                <button class="icon-btn" onclick="delItem('planning','${p.id}')">🗑️</button>
              </div>`).join('')}</div>`}
        </div>`;
      }).join('')}
    </div>`;
}
function editShift(id) {
  const p = id ? DB.planning.find(x => x.id === id) : { employe: '', role: 'Serveur', jour: todayISO(), debut: '11:00', fin: '15:00' };
  openModal(id ? 'Modifier le service' : 'Nouveau service', `
    ${fld('Employé', `<input id="m_emp" value="${esc(p.employe)}">`)}
    ${fld('Poste', `<input id="m_role" value="${esc(p.role)}" list="roleList"><datalist id="roleList"><option>Chef de cuisine</option><option>Second de cuisine</option><option>Commis</option><option>Plongeur</option><option>Cheffe de rang</option><option>Serveur</option><option>Barman</option><option>Directeur</option></datalist>`)}
    ${fld('Date', `<input id="m_jour" type="date" value="${esc(p.jour)}">`)}
    <div class="form-row">
      ${fld('Début', `<input id="m_deb" type="time" value="${esc(p.debut)}">`)}
      ${fld('Fin', `<input id="m_fin" type="time" value="${esc(p.fin)}">`)}
    </div>
  `, () => {
    const data = { employe: $('#m_emp').value.trim(), role: $('#m_role').value.trim(), jour: $('#m_jour').value, debut: $('#m_deb').value, fin: $('#m_fin').value };
    if (!data.employe) return toast('Le nom de l\'employé est obligatoire', 'err'), false;
    if (id) Object.assign(p, data); else DB.planning.push({ id: uid(), ...data });
    save(); render(); toast('Service enregistré', 'ok');
  });
}

/* ---------- Plats du jour (#22) ---------- */
function viewPlats() {
  const jours = [...new Set(DB.plats.map(p => p.date))].sort().reverse();
  return `
    ${pageHead('Plats du jour', 'Programmez et gérez la disponibilité des plats', `<button class="btn" onclick="editPlat()">+ Plat</button>`)}
    ${jours.length === 0 ? `<div class="empty"><div class="empty-ico">🍽️</div>Aucun plat programmé.</div>` :
      jours.map(day => `
        <div class="section-title">${new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${day === todayISO() ? ' <span class="badge badge-wine">Aujourd\'hui</span>' : ''}</div>
        <div class="cards">
          ${DB.plats.filter(p => p.date === day).map(p => `
            <div class="card" ${p.dispo ? '' : 'style="opacity:.6"'}>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                <strong style="font-size:15px">${esc(p.nom)}</strong>
                <span class="badge badge-wine nowrap">${eur(p.prix)}</span>
              </div>
              <p class="li-meta" style="margin:8px 0 12px">${esc(p.description || '')}</p>
              <div class="tag-row">
                <button class="btn-sm ${p.dispo ? 'btn-outline' : 'btn'}" style="border-radius:8px;${p.dispo?'':'background:var(--red)'}" onclick="togglePlat('${p.id}')">${p.dispo ? '✔ Disponible' : '⛔ 86 / épuisé'}</button>
                <button class="icon-btn" onclick="editPlat('${p.id}')">✏️</button>
                <button class="icon-btn" onclick="delItem('plats','${p.id}')">🗑️</button>
              </div>
            </div>`).join('')}
        </div>`).join('')}`;
}
function togglePlat(id) {
  const p = DB.plats.find(x => x.id === id); if (!p) return;
  p.dispo = !p.dispo; save(); render();
  toast(p.dispo ? 'Plat marqué disponible' : 'Plat marqué 86 (épuisé)', p.dispo ? 'ok' : '');
}
function editPlat(id) {
  const p = id ? DB.plats.find(x => x.id === id) : { nom: '', description: '', prix: 0, date: todayISO(), dispo: true };
  openModal(id ? 'Modifier le plat' : 'Nouveau plat du jour', `
    ${fld('Nom du plat', `<input id="m_nom" value="${esc(p.nom)}">`)}
    ${fld('Description', `<textarea id="m_desc" placeholder="Garniture, accompagnement…">${esc(p.description)}</textarea>`)}
    <div class="form-row">
      ${fld('Prix (€)', `<input id="m_prix" type="number" min="0" step="0.5" value="${esc(p.prix)}">`)}
      ${fld('Date', `<input id="m_date" type="date" value="${esc(p.date)}">`)}
    </div>
  `, () => {
    const data = { nom: $('#m_nom').value.trim(), description: $('#m_desc').value.trim(), prix: Number($('#m_prix').value), date: $('#m_date').value, dispo: id ? p.dispo : true };
    if (!data.nom) return toast('Le nom est obligatoire', 'err'), false;
    if (id) Object.assign(p, data); else DB.plats.push({ id: uid(), ...data });
    save(); render(); toast('Plat enregistré', 'ok');
  });
}

/* ---------- Communication salle ↔ cuisine (#23) ---------- */
function viewCommunication() {
  const ouverts = DB.comm.filter(c => !c.resolu).sort((a, b) => b.ts - a.ts);
  const resolus = DB.comm.filter(c => c.resolu).sort((a, b) => b.ts - a.ts).slice(0, 20);
  return `
    ${pageHead('Salle ↔ Cuisine', 'Messages, signalements et plats « 86 » (épuisés)')}
    <div class="card" style="margin-bottom:20px">
      <div class="form-row" style="grid-template-columns:auto 1fr;align-items:end">
        ${fld('Type', `<select id="c_type"><option value="message">💬 Message</option><option value="86">⛔ 86 (produit épuisé)</option></select>`)}
        ${fld('Message', `<input id="c_texte" placeholder="Ex. Plus de saumon / Table 5 sans gluten…" onkeydown="if(event.key==='Enter')addComm()">`)}
      </div>
      <div class="form-row" style="grid-template-columns:auto auto;justify-content:start">
        ${fld('De la part de', `<select id="c_auteur"><option>Salle</option><option>Cuisine</option><option>Direction</option><option>Bar</option></select>`)}
        <div class="field" style="justify-content:end"><button class="btn" onclick="addComm()">Envoyer</button></div>
      </div>
    </div>

    <div class="section-title">📨 En cours ${ouverts.length ? `<span class="badge badge-danger">${ouverts.length}</span>` : ''}</div>
    ${ouverts.length === 0 ? '<p class="muted">Aucun message en attente. 👌</p>' :
      `<div class="list">${ouverts.map(c => commItem(c)).join('')}</div>`}

    ${resolus.length ? `<div class="section-title">✔ Traités récemment</div>
      <div class="list">${resolus.map(c => commItem(c, true)).join('')}</div>` : ''}`;
}
function commItem(c, done = false) {
  return `<div class="list-item" style="${done ? 'opacity:.55;' : ''}${c.type === '86' ? 'border-left:3px solid var(--red)' : 'border-left:3px solid var(--wine)'}">
    <div class="li-main">
      ${c.type === '86' ? '<span class="badge badge-danger">86</span> ' : ''}${esc(c.texte)}
      <div class="li-meta">${esc(c.auteur)} · ${frDateTime(c.ts)}</div>
    </div>
    ${done
      ? `<button class="icon-btn" title="Rouvrir" onclick="toggleComm('${c.id}')">↩︎</button>`
      : `<button class="btn-sm btn-outline" style="border-radius:8px" onclick="toggleComm('${c.id}')">✔ Traité</button>`}
    <button class="icon-btn" onclick="delItem('comm','${c.id}')">🗑️</button>
  </div>`;
}
function addComm() {
  const texte = $('#c_texte').value.trim();
  if (!texte) return toast('Écrivez un message', 'err');
  DB.comm.push({ id: uid(), type: $('#c_type').value, texte, auteur: $('#c_auteur').value, ts: Date.now(), resolu: false });
  save(); render(); toast('Message envoyé', 'ok');
}
function toggleComm(id) {
  const c = DB.comm.find(x => x.id === id); if (!c) return;
  c.resolu = !c.resolu; save(); render();
}

/* ---------- Checklists (#27) ---------- */
function viewChecklists() {
  return `
    ${pageHead('Checklists', 'Ouverture et fermeture — ne rien oublier')}
    <div class="dash-cols">
      ${checklistCard('ouverture', '🌅 Ouverture')}
      ${checklistCard('fermeture', '🌙 Fermeture')}
    </div>
    <p class="hint" style="margin-top:20px">💡 En fin de journée, utilisez « Réinitialiser » pour repartir de zéro le lendemain.</p>`;
}
function checklistCard(key, titre) {
  const list = DB.checklists[key];
  const done = list.filter(x => x.fait).length;
  const pct = list.length ? Math.round(done / list.length * 100) : 0;
  return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3 style="margin:0">${titre}</h3>
      <span class="badge ${pct === 100 ? 'badge-ok' : 'badge-muted'}">${done}/${list.length}</span>
    </div>
    <div class="progress" style="margin:12px 0 16px"><span style="width:${pct}%"></span></div>
    <div>
      ${list.map(item => `
        <div class="check-line ${item.fait ? 'done' : ''}">
          <input type="checkbox" ${item.fait ? 'checked' : ''} onchange="toggleCheck('${key}','${item.id}')" id="chk_${item.id}">
          <label for="chk_${item.id}">${esc(item.texte)}</label>
          <button class="icon-btn" onclick="delCheck('${key}','${item.id}')">🗑️</button>
        </div>`).join('')}
    </div>
    <div class="toolbar" style="margin:16px 0 0">
      <input type="text" id="new_${key}" placeholder="Ajouter une tâche…" style="flex:1;padding:9px 12px;border:1px solid var(--line);border-radius:9px" onkeydown="if(event.key==='Enter')addCheck('${key}')">
      <button class="btn btn-sm" onclick="addCheck('${key}')">Ajouter</button>
      <button class="btn-sm btn-outline" style="border-radius:8px" onclick="resetCheck('${key}')">Réinitialiser</button>
    </div>
  </div>`;
}
function toggleCheck(key, id) {
  const it = DB.checklists[key].find(x => x.id === id); if (!it) return;
  it.fait = !it.fait; save();
  // Re-render seulement les cartes pour garder la fluidité
  render();
}
function addCheck(key) {
  const input = $('#new_' + key); const texte = input.value.trim();
  if (!texte) return;
  DB.checklists[key].push({ id: uid(), texte, fait: false }); save(); render();
}
function delCheck(key, id) {
  DB.checklists[key] = DB.checklists[key].filter(x => x.id !== id); save(); render();
}
function resetCheck(key) {
  if (!confirm('Décocher toutes les tâches de cette checklist ?')) return;
  DB.checklists[key].forEach(x => x.fait = false); save(); render(); toast('Checklist réinitialisée', 'ok');
}

/* ---------- Notes & consignes (#30) ---------- */
function viewNotes() {
  const notes = DB.notes.slice().sort((a, b) => (b.epingle - a.epingle) || (b.ts - a.ts));
  return `
    ${pageHead('Notes & consignes', 'Le cahier de liaison numérique de l\'équipe', `<button class="btn" onclick="editNote()">+ Note</button>`)}
    ${notes.length === 0 ? `<div class="empty"><div class="empty-ico">📝</div>Aucune note pour le moment.</div>` :
      `<div class="list">${notes.map(n => `
        <div class="list-item ${n.epingle ? 'pinned' : ''}">
          <div class="li-main">
            ${n.epingle ? '📌 ' : ''}${esc(n.texte).replace(/\n/g, '<br>')}
            <div class="li-meta">${esc(n.auteur)} · ${frDateTime(n.ts)}</div>
          </div>
          <button class="icon-btn" title="${n.epingle ? 'Désépingler' : 'Épingler'}" onclick="pinNote('${n.id}')">${n.epingle ? '📍' : '📌'}</button>
          <button class="icon-btn" onclick="editNote('${n.id}')">✏️</button>
          <button class="icon-btn" onclick="delItem('notes','${n.id}')">🗑️</button>
        </div>`).join('')}</div>`}`;
}
function editNote(id) {
  const n = id ? DB.notes.find(x => x.id === id) : { texte: '', auteur: 'Direction', epingle: false };
  openModal(id ? 'Modifier la note' : 'Nouvelle note', `
    ${fld('Consigne / message', `<textarea id="m_texte" style="min-height:110px">${esc(n.texte)}</textarea>`)}
    <div class="form-row">
      ${fld('Auteur', `<input id="m_aut" value="${esc(n.auteur)}">`)}
      ${fld('Épingler en haut', `<select id="m_pin"><option value="0" ${!n.epingle?'selected':''}>Non</option><option value="1" ${n.epingle?'selected':''}>Oui</option></select>`)}
    </div>
  `, () => {
    const texte = $('#m_texte').value.trim();
    if (!texte) return toast('La note est vide', 'err'), false;
    const data = { texte, auteur: $('#m_aut').value.trim() || 'Équipe', epingle: $('#m_pin').value === '1' };
    if (id) Object.assign(n, data); else DB.notes.push({ id: uid(), ts: Date.now(), ...data });
    if (id && !n.ts) n.ts = Date.now();
    save(); render(); toast('Note enregistrée', 'ok');
  });
}
function pinNote(id) {
  const n = DB.notes.find(x => x.id === id); if (!n) return;
  n.epingle = !n.epingle; save(); render();
}

/* =========================================================================
   COMPOSANTS PARTAGÉS
   ========================================================================= */
function pageHead(title, sub, actions = '') {
  return `<div class="page-head">
    <div><h1 class="page-title">${esc(title)}</h1>${sub ? `<p class="page-sub">${esc(sub)}</p>` : ''}</div>
    <div>${actions}</div>
  </div>`;
}
const stat = (value, label, foot, accent) => `
  <div class="stat ${accent ? 'accent-' + accent : ''}">
    <span class="stat-label">${esc(label)}</span>
    <span class="stat-value">${value}</span>
    <span class="stat-foot">${esc(foot)}</span>
  </div>`;
const fld = (label, input) => `<div class="field"><label>${esc(label)}</label>${input}</div>`;
const emptyRow = (cols, txt) => `<tr><td colspan="${cols}" class="empty" style="padding:36px">${esc(txt)}</td></tr>`;

function filterTable(tableId, q) {
  q = q.toLowerCase();
  $$('#' + tableId + ' tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* Suppression générique */
function delItem(collection, id) {
  const labels = { stocks: 'ce produit', fournisseurs: 'ce fournisseur', vins: 'cette référence', planning: 'ce service', plats: 'ce plat', comm: 'ce message', notes: 'cette note' };
  if (!confirm(`Supprimer ${labels[collection] || 'cet élément'} ?`)) return;
  DB[collection] = DB[collection].filter(x => x.id !== id);
  save(); render(); toast('Supprimé', '');
}

/* ---------- Modal ---------- */
let modalConfirm = null;
function openModal(title, bodyHtml, onConfirm) {
  modalConfirm = onConfirm;
  $('#modalRoot').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" onclick="closeModal()">✕</button></div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-foot">
          <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
          <button class="btn" onclick="submitModal()">Enregistrer</button>
        </div>
      </div>
    </div>`;
  const first = $('#modalRoot input, #modalRoot textarea, #modalRoot select');
  if (first) setTimeout(() => first.focus(), 50);
}
function submitModal() {
  if (modalConfirm) { const r = modalConfirm(); if (r === false) return; }
  closeModal();
}
function closeModal() { $('#modalRoot').innerHTML = ''; modalConfirm = null; }

/* ---------- Toast ---------- */
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  $('#toastRoot').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 2600);
}

/* ---------- Badges de navigation ---------- */
function refreshBadges() {
  const setBadge = (id, n) => { const el = $('#' + id); if (!el) return; el.textContent = n; el.classList.toggle('show', n > 0); };
  setBadge('badgeStocks', stockBas().length);
  setBadge('badgeCave', vinBas().length);
  setBadge('badgeComm', commOuverts().length);
}

/* ---------- Import / Export ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `jeroboam120-sauvegarde-${todayISO()}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast('Sauvegarde exportée', 'ok');
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.stocks || !data.checklists) throw new Error('format');
      if (!confirm('Remplacer toutes les données actuelles par le fichier importé ?')) return;
      DB = data; save(); render(); toast('Données importées', 'ok');
    } catch (e) { toast('Fichier invalide', 'err'); }
  };
  reader.readAsText(file);
}

/* =========================================================================
   ROUTAGE
   ========================================================================= */
const ROUTES = {
  'tableau-de-bord': viewTableauDeBord,
  'stocks': viewStocks,
  'fournisseurs': viewFournisseurs,
  'cave': viewCave,
  'planning': viewPlanning,
  'plats-du-jour': viewPlats,
  'communication': viewCommunication,
  'checklists': viewChecklists,
  'notes': viewNotes,
};

function currentRoute() {
  const h = location.hash.replace(/^#\//, '');
  return ROUTES[h] ? h : 'tableau-de-bord';
}
function render() {
  const route = currentRoute();
  $('#view').innerHTML = ROUTES[route]();
  $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === route));
  refreshBadges();
  window.scrollTo(0, 0);
}

/* ---------- Initialisation ---------- */
window.addEventListener('hashchange', () => { render(); closeMobileMenu(); });

function closeMobileMenu() { $('#sidebar').classList.remove('open'); $('#backdrop').classList.remove('show'); }

document.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#/tableau-de-bord';
  render();

  $('#menuToggle').addEventListener('click', () => { $('#sidebar').classList.toggle('open'); $('#backdrop').classList.toggle('show'); });
  $('#backdrop').addEventListener('click', closeMobileMenu);
  $('#exportBtn').addEventListener('click', exportData);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
});

// Exposition des fonctions appelées via onclick inline
Object.assign(window, {
  editStock, quickRestock, editFournisseur, editVin, quickVin, editShift,
  editPlat, togglePlat, addComm, toggleComm, toggleCheck, addCheck, delCheck,
  resetCheck, editNote, pinNote, delItem, closeModal, submitModal, filterTable,
});
