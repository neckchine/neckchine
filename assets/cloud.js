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
    signIn, verifyCode, signInWithPin, signOut,
    isConnected: () => !!session,
  };

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
