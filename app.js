// MagyarLab – Ungarisch lernen (Vanilla JS, ohne Frameworks)
(function(){
  const LS_KEY = 'magyarlab-state-v1';
  const clone = (o)=>JSON.parse(JSON.stringify(o));

  const DEFAULT_STATE = {
    profile:{ level:'A1', audioMode:'normal', uiLang:'de', exam:false },
    ui:{ tab:'home', route:'home', level:'A1' },
    progress:{ completedLessons:{} },
    srs:{}
  };

  // Beispiel‑Curriculum (kompakt) – später erweiterbar
  const CURRICULUM = {
    A1:{
      units:[{ title:'Einheit 1', lessons:[
        { id:'A1-U1-L1', title:'Létige (1): sein', tag:'Grammatik',
          grammar:['vagyok, vagy, van …','Orts-/Zustandsangaben'],
          examples:[{hu:'Hol vagy?',de:'Wo bist du?'},{hu:'A szobában vagyok.',de:'Ich bin im Zimmer.'}],
          objectives:['Konjugation im Präsens','Gebrauch mit Ortsangaben','Kurzantworten bilden']
        }
      ] }]
    },
    B2:{
      units:[{ title:'Einheit 1', lessons:[
        { id:'B2-U1-L1', title:'Präfixe: be‑, ki‑, fel‑', tag:'Präfixe',
          grammar:['Richtungspräfixe','Verbtrennung im Fokus'],
          examples:[{hu:'Bemegyek a boltba.',de:'Ich gehe in den Laden hinein.'},{hu:'Kimegyek a kertbe.',de:'Ich gehe in den Garten hinaus.'}],
          objectives:['Präfix‑Bedeutungen erkennen','Verbpräfixe im Satz platzieren']
        },
        { id:'B2-U1-L2', title:'Partikelige Konstruktionen', tag:'Syntax',
          grammar:['Partikel + Verb','Betonung & Stellung'],
          examples:[{hu:'Fel kell állnom.',de:'Ich muss aufstehen.'}],
          objectives:['Modal + Partikel kombinieren']
        }
      ] }]
    }
  };

  // ---- State
  function loadState(){
    try{ const raw = localStorage.getItem(LS_KEY); if(!raw) return clone(DEFAULT_STATE);
      const s = JSON.parse(raw); return Object.assign(clone(DEFAULT_STATE), s);
    }catch{ return clone(DEFAULT_STATE); }
  }
  function saveState(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch{} }

  let state = loadState();

  // ---- Routing Helpers
  if(!state.ui) state.ui = { tab:'home', route:'home', level: state?.profile?.level || 'A1' };
  function go(route, payload){ state.ui.route = route; if(payload) state.ui.payload = payload; saveState(); render(); }
  function setTab(tab){ state.ui.tab = tab; document.querySelectorAll('#topbar .tab-button').forEach(b=> b.classList.toggle('active', b.dataset.tab===tab)); }

  // ---- Render Switcher
  function render(){
    const root = document.getElementById('mainContent'); if(!root) return;
    root.innerHTML = '';
    switch(state.ui.route){
      case 'home': return renderHome();
      case 'lessons': return renderLessons(state.ui.level || 'A1');
      case 'lesson': return renderLesson(state.ui.payload?.id);
      case 'vocab': return renderVocabHome();
      case 'grammar': return renderGrammarHub();
      case 'settings': return renderSettings();
      default: return renderHome();
    }
  }

  // ---- Startseite
  function renderHome(){
    const root = document.getElementById('mainContent');
    const hero = document.createElement('section'); hero.className='hero card';
    hero.innerHTML = `
      <div class="hd">MagyarLab – Ungarisch lernen</div>
      <div class="bd">
        <p class="notice">Schnell zur sicheren Konjugation & Vokalharmonie.</p>
        <div class="level-grid" id="levelPicker"></div>
      </div>
      <div class="ft">
        <button id="btnQuickStart" class="btn primary">Schnellstart</button>
        <span class="small">Letzte Lektion: <span id="lastLessonBadge" class="badge">–</span></span>
      </div>`;

    const tiles = document.createElement('section'); tiles.className='grid grid-3'; tiles.id='homeTiles';
    tiles.innerHTML = `
      <div class="card link-card"><div class="hd">Grammatik‑Übersicht</div><div class="bd">Themen als Kacheln</div></div>
      <div class="card link-card"><div class="hd">Prüfungsmodus (B2+)</div><div class="bd">Gemischte Übungen</div></div>
      <div class="card link-card"><div class="hd">Aussprache</div><div class="bd">Tipps & Beispiele</div></div>`;

    root.append(hero, tiles);
    renderLevelPicker(state.ui.level || 'A1');

    document.getElementById('btnQuickStart')?.addEventListener('click', ()=>{
      const next = getNextLesson(state); if(next?.id) go('lesson', {id:next.id}); else go('lessons');
    });
  }

  function renderLevelPicker(active){
    const picker = document.getElementById('levelPicker'); picker.innerHTML='';
    ['A1','A2','B1','B2','C1','C2'].forEach(l=>{
      const b=document.createElement('button'); b.className='level-btn'+(l===active?' active':''); b.textContent=l;
      b.addEventListener('click',()=>{ state.ui.level=l; state.profile.level=l; saveState(); go('lessons'); });
      picker.appendChild(b);
    });
  }

  function getNextLesson(st){
    const level = st.ui.level || 'A1';
    const lessons = (CURRICULUM?.[level]?.units||[]).flatMap(u=>u.lessons||[]);
    for(const L of lessons){ if(!st.progress?.completedLessons?.[L.id]) return {id:L.id}; }
    return null;
  }

  // ---- Lektionsliste
  function renderLessons(level){
    const root = document.getElementById('mainContent'); root.innerHTML='';

    const header = document.createElement('div'); header.className='row between';
    header.innerHTML = `
      <h2 id="levelTitle">Level ${level}</h2>
      <div class="chips" id="lessonFilters">
        <button class="chip" data-f="all">Alle</button>
        <button class="chip" data-f="open">Offen</button>
        <button class="chip" data-f="done">Fertig</button>
        <button class="chip" data-f="exercise">Mit Übungen</button>
        <button class="chip" data-f="audio">Mit Audio</button>
      </div>`;

    const list = document.createElement('section'); list.className='grid grid-2';

    function addLessonCard(L){
      const pct = state.progress?.completedLessons?.[L.id] ? 100 : 0;
      const ex = (L.examples||[]).slice(0,2).map(e=>`<div class="example"><span class="hu">${e.hu}</span><span class="de">${e.de}</span></div>`).join('');
      const gram = (L.grammar||[]).map(g=>`<li>${g}</li>`).join('');
      const card = document.createElement('div'); card.className='card lesson'; card.dataset.id=L.id;
      card.innerHTML = `
        <div class="hd">${L.title} <span class="badge">${L.tag||'Grammatik'}</span></div>
        <div class="bd grid grid-2">
          <div><strong>Grammatik</strong><ul>${gram}</ul></div>
          <div><strong>Beispiele</strong>${ex}</div>
        </div>
        <div class="ft">
          <div class="progress"><i style="width:${pct}%"></i></div>
          <div class="row">
            <button class="btn" data-act="done">Als erledigt</button>
            <button class="btn primary" data-act="open">Öffnen</button>
          </div>
        </div>`;
      list.appendChild(card);
    }

    const units = CURRICULUM?.[level]?.units || [];
    units.forEach(u => (u.lessons||[]).forEach(addLessonCard));

    header.querySelector('#lessonFilters').addEventListener('click',(e)=>{
      const f=e.target.closest('.chip')?.dataset?.f; if(!f) return;
      list.querySelectorAll('.lesson').forEach(card=>{
        const id=card.dataset.id; const done=!!state.progress?.completedLessons?.[id];
        const show = (f==='all') || (f==='open'&&!done) || (f==='done'&&done);
        card.style.display = show ? '' : 'none';
      });
    });

    list.addEventListener('click',(e)=>{
      const btn=e.target.closest('button[data-act]'); if(!btn) return;
      const id=btn.closest('.lesson')?.dataset?.id; if(!id) return;
      if(btn.dataset.act==='open') return go('lesson',{id});
      if(btn.dataset.act==='done'){
        state.progress=state.progress||{}; state.progress.completedLessons=state.progress.completedLessons||{};
        state.progress.completedLessons[id]=true; saveState(); renderLessons(level);
      }
    });

    root.append(header,list);
  }

  // ---- Lektionsdetail
  function renderLesson(id){
    const root = document.getElementById('mainContent'); root.innerHTML='';
    const L = findLessonById(id);
    if(!L){ root.innerHTML='<div class="card"><div class="bd">Lektion nicht gefunden.</div></div>'; return; }
    const wrap=document.createElement('div'); wrap.className='stack';
    wrap.innerHTML = `
      <div class="card"><div class="hd">${L.title}</div>
        <div class="bd">
          <h3>Lernziele</h3>
          <ul>${(L.objectives||['Ziele folgen']).map(x=>`<li>${x}</li>`).join('')}</ul>
          <h3>Grammatik</h3>
          <ul>${(L.grammar||[]).map(x=>`<li><em>${x}</em></li>`).join('')}</ul>
        </div></div>
      <div class="card"><div class="hd">Beispiele</div>
        <div class="bd">${(L.examples||[]).map(e=>`<div class="example"><span class="hu">${e.hu}</span><span class="de">${e.de}</span></div>`).join('')}</div>
        <div class="ft"><div class="row"><label>Audio:
          <select id="audioMode"><option value="slow">slow</option><option value="normal">normal</option></select>
        </label></div></div></div>
      <div class="card"><div class="hd">Übungen</div>
        <div class="bd" id="exerciseHost">(bald)</div>
        <div class="ft"><button class="btn ok" id="btnDone">Als erledigt</button></div></div>
    `;
    root.appendChild(wrap);

    const sel = wrap.querySelector('#audioMode');
    if(sel){ sel.value = state.profile?.audioMode || 'normal'; sel.addEventListener('change',()=>{ state.profile=state.profile||{}; state.profile.audioMode=sel.value; saveState(); }); }
    wrap.querySelector('#btnDone')?.addEventListener('click',()=>{
      state.progress=state.progress||{}; state.progress.completedLessons=state.progress.completedLessons||{};
      state.progress.completedLessons[id]=true; saveState(); go('lessons');
    });
  }

  function findLessonById(id){
    for(const lv of Object.keys(CURRICULUM)){
      for(const u of (CURRICULUM[lv].units||[])){
        for(const L of (u.lessons||[])){
          if(String(L.id)===String(id)) return L;
        }
      }
    }
    return null;
  }

  // ---- Vokabeltrainer (SRS)
  function renderVocabHome(){
    const root=document.getElementById('mainContent'); root.innerHTML='';
    const row=document.createElement('div'); row.className='row';
    [['Fällig heute','due'],['Neu','new'],['Alle','all']].forEach(([t,m])=>{
      const b=document.createElement('button'); b.className='btn'; b.textContent=t; b.addEventListener('click',()=> startSrsSession(m)); row.appendChild(b);
    });
    root.appendChild(row);
  }

  function startSrsSession(mode){
    const now=Date.now(); const entries=Object.entries(state.srs||{});
    const items = entries.filter(([id,v])=> mode==='due'? (v.due||0)<=now : mode==='new'? !(v.due>0) : true);
    const root=document.getElementById('mainContent'); root.innerHTML='';
    if(!items.length){ root.innerHTML='<div class="card"><div class="bd">Keine Karten – super! 🙂</div></div>'; return; }
    let idx=0; const next=()=>{ idx=(idx+1)%items.length; show(); };
    function show(){
      const [id,v]=items[idx];
      const card=document.createElement('div'); card.className='card srs';
      card.innerHTML=`
        <div class="bd">
          <div class="example"><span class="hu">${v.hu||id}</span> <span class="de">${v.de||''}</span></div>
          <div class="small">${v.hint||''}</div>
        </div>
        <div class="ft row">
          <button class="btn ok" data-q="easy">Gewusst</button>
          <button class="btn warn" data-q="hard">Schwer</button>
          <button class="btn danger" data-q="again">Falsch</button>
        </div>`;
      root.innerHTML=''; root.appendChild(card);
      card.querySelector('.ft').addEventListener('click',(e)=>{ const q=e.target.closest('button')?.dataset?.q; if(!q) return; updateSrsEntry(id,q); saveState(); next(); });
    }
    show();
  }

  function updateSrsEntry(id,quality){
    const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
    state.srs=state.srs||{}; const v=state.srs[id] || {ease:2.0,due:0,lapses:0}; const now=Date.now();
    if(quality==='again'){ v.ease=clamp(v.ease-0.2,1.3,2.7); v.due=now+10*60*1000; v.lapses=(v.lapses||0)+1; }
    if(quality==='hard'){  v.ease=clamp(v.ease-0.05,1.3,2.7); v.due=now+24*60*60*1000; }
    if(quality==='easy'){  v.ease=clamp(v.ease+0.1,1.3,2.7); v.due=now+3*24*60*60*1000; }
    state.srs[id]=v;
  }

  // ---- Grammatik‑Hub
  function renderGrammarHub(){
    const root=document.getElementById('mainContent'); root.innerHTML='';
    const header=document.createElement('div'); header.className='row between';
    header.innerHTML='<h2>Grammatik</h2><input id="grammarSearch" placeholder="Suchen…" />';
    const grid=document.createElement('div'); grid.className='grid grid-3'; grid.id='grammarGrid';
    function build(filter=''){
      grid.innerHTML=''; const topics=collectGrammarTopics();
      topics.filter(t=> t.title.toLowerCase().includes(filter.toLowerCase()))
        .forEach(t=>{ const c=document.createElement('div'); c.className='card link-card'; c.innerHTML=`<div class="hd">${t.title}</div><div class="bd">${t.examples}</div>`; c.addEventListener('click',()=> go('lesson',{id:t.ref})); grid.appendChild(c); });
    }
    header.querySelector('#grammarSearch').addEventListener('input',(e)=> build(e.target.value||''));
    build(''); root.append(header,grid);
  }
  function collectGrammarTopics(){
    const arr=[]; Object.values(CURRICULUM||{}).forEach(LV=>{ (LV.units||[]).forEach(U=> (U.lessons||[]).forEach(L=>{ arr.push({title:L.title, examples:(L.examples||[])[0]? `${L.examples[0].hu} — ${L.examples[0].de}`:'', ref:L.id}); })); });
    return arr;
  }

  // ---- Einstellungen
  function renderSettings(){
    const root=document.getElementById('mainContent'); root.innerHTML='';
    const card=document.createElement('div'); card.className='card';
    card.innerHTML=`
      <div class="hd">Einstellungen</div>
      <div class="bd">
        <label class="row">Audio‑Tempo
          <select id="setAudio"><option value="slow">slow</option><option value="normal">normal</option></select>
        </label>
        <label class="row">Prüfungsvorbereitung
          <input id="setExam" type="checkbox" />
        </label>
        <label class="row">UI‑Sprache
          <select id="setLang"><option value="de">Deutsch</option><option value="en">English</option></select>
        </label>
      </div>`;
    root.appendChild(card);
    const audio=card.querySelector('#setAudio'); const exam=card.querySelector('#setExam'); const lang=card.querySelector('#setLang');
    audio.value=state.profile?.audioMode||'normal'; exam.checked=!!state.profile?.exam; lang.value=state.profile?.uiLang||'de';
    audio.addEventListener('change',()=>{ state.profile=state.profile||{}; state.profile.audioMode=audio.value; saveState(); });
    exam.addEventListener('change',()=>{ state.profile=state.profile||{}; state.profile.exam=exam.checked; saveState(); });
    lang.addEventListener('change',()=>{ state.profile=state.profile||{}; state.profile.uiLang=lang.value; saveState(); });
  }

  // ---- Topbar Binding & Initial Render
  (function bindTopbar(){
    const bar=document.getElementById('topbar'); if(!bar) return;
    bar.addEventListener('click',(e)=>{
      const b=e.target.closest('.tab-button'); if(!b) return;
      setTab(b.dataset.tab);
      const map={home:'home',lessons:'lessons',vocab:'vocab',grammar:'grammar',settings:'settings'};
      go(map[b.dataset.tab]||'home');
    });
  })();
  setTab(state.ui.tab||'home');
  render();
})();
