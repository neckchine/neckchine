/* =========================================================================
   Synchronisation cloud (Supabase) — connexion par lien magique + temps réel.
   L'app fonctionne hors-ligne ; le cloud se superpose quand on est connecté.
   Dépend de : window.JERO_CONFIG, window.supabase (UMD), window.__jero (app.js)
   ========================================================================= */
(function () {
  'use strict';
  const cfg = window.JERO_CONFIG || {};
  let client = null, session = null, channel = null, pushTimer = null, applying = false;
  const clientId = (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));

  function toast(m, k) { if (window.toast) window.toast(m, k || ''); }

  function init() {
    registerSW(); // enregistre le service worker (PWA + réception des notifs)
    if (!cfg.SUPABASE_URL || !window.supabase) { pushUI(); return; }
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    client.auth.getSession().then(({ data }) => { session = data.session; onAuth(); });
    client.auth.onAuthStateChange((_evt, s) => { session = s; onAuth(); });
    pushUI();
  }

  async function onAuth() {
    pushUI();
    if (session) { await pull(); subscribe(); }
    else if (channel) { client.removeChannel(channel); channel = null; }
  }

  async function pull() {
    try {
      const { data, error } = await client.from('app_state').select('data').eq('id', 1).maybeSingle();
      if (error) {
        if (/permission|policy|row-level/i.test(error.message)) return notAllowed();
        console.warn('pull', error); return;
      }
      if (data && data.data && Object.keys(data.data).length) {
        applying = true; window.__jero.setState(data.data); applying = false;
        toast('Synchronisé ☁️', 'ok');
      } else {
        await push(window.__jero.getState(), true); // base vide : on envoie l'état local
        toast('Données envoyées au cloud ☁️', 'ok');
      }
    } catch (e) { console.warn(e); }
  }

  function subscribe() {
    if (channel) return;
    channel = client.channel('app_state_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, (payload) => {
        const row = payload.new;
        if (!row || !row.data || row.updated_by === clientId) return; // ignore notre propre écho
        applying = true; window.__jero.setState(row.data); applying = false;
      })
      .subscribe();
  }

  async function push(state, force) {
    if (!session) return;
    if (applying && !force) return;
    try {
      await client.from('app_state').upsert({ id: 1, data: state, updated_at: new Date().toISOString(), updated_by: clientId });
    } catch (e) { console.warn('push', e); }
  }

  function notAllowed() {
    toast('Cet email n\'est pas autorisé', 'err');
    if (client) client.auth.signOut();
    session = null; pushUI();
  }

  async function signIn(email) {
    if (!client) return { message: 'Cloud indisponible' };
    const redirect = window.location.href.split('#')[0];
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } });
    return error;
  }
  async function verifyCode(email, token) {
    if (!client) return { message: 'Cloud indisponible' };
    const { error } = await client.auth.verifyOtp({ email: String(email).trim(), token: String(token).trim(), type: 'email' });
    return error;
  }
  async function signInWithPin(pin) {
    if (!client) return { message: 'Cloud indisponible' };
    const { error } = await client.auth.signInWithPassword({ email: cfg.AUTH_EMAIL, password: String(pin).trim() });
    return error;
  }
  async function signOut() { if (client) await client.auth.signOut(); session = null; pushUI(); }
  async function aiPlan(payload) {
    if (!client || !session) return { error: { message: 'Connecte-toi avec le code pour utiliser l\'IA' } };
    return await client.functions.invoke('plan-ai', { body: payload });
  }
  async function ai(payload) {
    if (!client || !session) return { error: { message: 'Connecte-toi avec le code pour utiliser l\'IA' } };
    return await client.functions.invoke('ai', { body: payload });
  }

  /* ---- Notifications push ---- */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return Promise.resolve(null);
    return navigator.serviceWorker.register('sw.js').catch((e) => { console.warn('SW', e); return null; });
  }
  function urlB64ToUint8(base64) {
    const pad = '='.repeat((4 - base64.length % 4) % 4);
    const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64); const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  async function enablePush() {
    if (!client || !session) return { error: 'Connecte-toi avec le code d\'abord' };
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { error: 'Notifications non supportées ici. Sur iPhone : ajoute l\'app à l\'écran d\'accueil puis réessaie.' };
    let perm = Notification.permission;
    if (perm !== 'granted') perm = await Notification.requestPermission();
    if (perm !== 'granted') return { error: 'Permission refusée' };
    const reg = (await navigator.serviceWorker.getRegistration()) || (await registerSW());
    if (!reg) return { error: 'Service worker indisponible' };
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(cfg.VAPID_PUBLIC) });
    const j = sub.toJSON();
    const { error } = await client.from('push_subs').upsert({ endpoint: j.endpoint, sub: j });
    if (error) return { error: error.message };
    return { ok: true };
  }
  async function pushSend(title, body) {
    if (!client || !session) return;
    try { await client.functions.invoke('push', { body: { task: 'send', title, body } }); } catch (e) { console.warn('push', e); }
  }
  async function pushTest() {
    if (!client || !session) return { error: 'Non connecté' };
    try { const { data, error } = await client.functions.invoke('push', { body: { task: 'test' } }); return error ? { error: error.message } : (data || { ok: true }); }
    catch (e) { return { error: String(e) }; }
  }

  function pushUI() {
    if (window.__jero && window.__jero.onCloudState) {
      window.__jero.onCloudState({
        enabled: !!client,
        connected: !!session,
        email: session && session.user ? session.user.email : null,
      });
    }
  }

  // API exposée à app.js
  window.Cloud = {
    onSave(state) { if (!session) return; clearTimeout(pushTimer); pushTimer = setTimeout(() => push(state), 400); },
    signIn, verifyCode, signInWithPin, signOut, aiPlan, ai,
    enablePush, pushSend, pushTest,
    isConnected: () => !!session,
  };

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
