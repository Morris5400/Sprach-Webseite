// MagyarLab – Static SPA (vereinfachte Version)
// Diese Version implementiert ein einfaches Tab‑basiertes Layout für Lektionen,
// Vokabeln und Einstellungen und verwendet dabei das bestehende Styling. Es wird
// kein komplexes Dashboard oder Drawer‑Menü bereitgestellt, sodass die Seite
// stabil funktioniert.

document.addEventListener('DOMContentLoaded', function() {
  // Fehlerausgabe: Zeigt Fehlerdetails im Dokument an.
  window.addEventListener('error', function(e) {
    try {
      const details = [
        'Fehler: ' + (e.message || ''),
        'Datei: ' + (e.filename || ''),
        'Zeile: ' + (e.lineno || ''),
        'Spalte: ' + (e.colno || ''),
        'Stack: ' + (e.error && e.error.stack ? e.error.stack : '')
      ].join('\n');
      document.body.innerHTML = '<pre style="white-space:pre-wrap;font-family:monospace;color:red;">JS Fehler – Details:\n' + details + '</pre>';
    } catch(_) {}
  });

  // Lokaler Speicher‑Schlüssel und Versionierung
  const LS_KEY = 'magyarlab-simple-v1';
  const APP_VERSION = 1;

  // Elemente aus dem DOM abrufen
  const topbar = document.getElementById('topbar');
  const mainContent = document.getElementById('mainContent');

  // Lehrplan (vereinfachter Auszug – erweitert bei Bedarf)
  const CURRICULUM = {
    A1: [
      {
        id: 'a1-u1',
        title: 'Begrüßen & Vorstellen – Van (sein)',
        grammar: [
          { name: 'Personalpronomen (én, te, ő…)' },
          { name: 'Kopulaverb *van* – Präsens, Auslassungen' },
          { name: 'Fragepartikel *-e*' },
        ],
        examples: [
          { hu: 'Szia! Jó napot!', de: 'Hi! Guten Tag!' },
          { hu: 'Péter vagyok. És te?', de: 'Ich bin Péter. Und du?' },
          { hu: 'Ő tanár?', de: 'Ist er/sie Lehrer/in?' },
        ],
      },
    ],
    B2: [
      {
        id: 'b2-u1',
        title: 'Vokalharmonie (2): richtige Endung wählen',
        grammar: [
          { name: 'Front-/Back-/Gemischte Wörter (recap & edge cases)' },
          { name: 'Bindevokale bei Suffixen (-o/-e, -a/-e, -ban/-ben, -hoz/-hez/-höz…)' },
          { name: 'Zusammengesetzte Wörter: letzte Wurzel entscheidet' },
        ],
        examples: [
          { hu: 'A könyvben jegyzetel.', de: 'Er/sie schreibt im Buch Notizen.' },
          { hu: 'A teraszról telefonálok.', de: 'Ich telefoniere von der Terrasse.' },
          { hu: 'A tanárhoz megyünk.', de: 'Wir gehen zum Lehrer.' },
        ],
      },
      {
        id: 'b2-u2',
        title: 'Indefinit oder Definit? – Objekt & Artikel',
        grammar: [
          { name: 'Kein direktes Objekt → indefinit' },
          { name: 'Unbestimmter Artikel / Quantor → meist indefinit' },
          { name: 'Bestimmter Artikel / Pronomen → definitiv' },
        ],
        examples: [
          { hu: 'Olvasok egy könyvet.', de: 'Ich lese ein Buch. (indef.)' },
          { hu: 'Olvasom a könyvet.', de: 'Ich lese das Buch. (def.)' },
          { hu: 'Kérem a számlát.', de: 'Ich bitte um die Rechnung. (def.)' },
        ],
      },
    ],
  };

  // Zustand initialisieren und aus lokalem Speicher laden
  let state;
  try {
    const raw = localStorage.getItem(LS_KEY);
    state = raw ? JSON.parse(raw) : null;
  } catch {
    state = null;
  }
  if (!state) {
    state = {
      level: null,
      tab: 'lessons',
      allowOffline: true,
      examPrep: true,
    };
  }

  // Speichert den Zustand, wenn Offline‑Modus aktiviert ist
  function saveState() {
    if (!state.allowOffline) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {}
  }

  // Ereignisse für die Topbar‑Buttons
  topbar.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      topbar.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      state.tab = button.dataset.tab;
      render();
    });
  });

  // Rendert das Hauptfeld entsprechend dem aktiven Tab
  function render() {
    if (!mainContent) return;
    mainContent.innerHTML = '';
    if (!state.level) {
      // Levelauswahl anzeigen, falls kein Level gewählt wurde
      renderLevelSelection();
      return;
    }
    switch (state.tab) {
      case 'lessons':
        renderLessons();
        break;
      case 'vocab':
        renderVocab();
        break;
      case 'settings':
        renderSettings();
        break;
      default:
        renderLessons();
    }
  }

  // Levelauswahl anzeigen
  function renderLevelSelection() {
    const wrapper = document.createElement('div');
    wrapper.className = 'level-grid';
    ['A1', 'B2'].forEach((lvl) => {
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (state.level === lvl ? ' active' : '');
      btn.textContent = lvl;
      btn.addEventListener('click', () => {
        state.level = lvl;
        saveState();
        render();
      });
      wrapper.appendChild(btn);
    });
    const msg = document.createElement('p');
    msg.textContent = 'Bitte wähle ein Niveau';
    msg.style.marginTop = '12px';
    mainContent.appendChild(msg);
    mainContent.appendChild(wrapper);
  }

  // Lektionen‑Ansicht rendern
  function renderLessons() {
    const lessons = CURRICULUM[state.level] || [];
    // Vor dem Rendern den Inhalt zurücksetzen
    mainContent.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'grid grid-1';
    lessons.forEach((lesson) => {
      const card = document.createElement('div');
      card.className = 'card link-card';
      const hd = document.createElement('div');
      hd.className = 'hd';
      hd.textContent = lesson.title;
      const bd = document.createElement('div');
      bd.className = 'bd';
      const gramTitle = document.createElement('h4');
      gramTitle.textContent = 'Grammatik:';
      const gramList = document.createElement('ul');
      lesson.grammar.forEach((g) => {
        const li = document.createElement('li');
        li.innerHTML = g.name;
        gramList.appendChild(li);
      });
      bd.appendChild(gramTitle);
      bd.appendChild(gramList);
      const ft = document.createElement('div');
      ft.className = 'ft';
      const openBtn = document.createElement('button');
      openBtn.className = 'btn primary';
      openBtn.textContent = 'Öffnen';
      openBtn.addEventListener('click', () => {
        renderLessonDetail(lesson);
      });
      ft.appendChild(openBtn);
      card.appendChild(hd);
      card.appendChild(bd);
      card.appendChild(ft);
      container.appendChild(card);
    });
    mainContent.appendChild(container);
  }

  // Detailansicht einer Lektion
  function renderLessonDetail(lesson) {
    mainContent.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'card';
    const hd = document.createElement('div');
    hd.className = 'hd';
    hd.textContent = lesson.title;
    const bd = document.createElement('div');
    bd.className = 'bd';
    const gramTitle = document.createElement('h4');
    gramTitle.textContent = 'Grammatik:';
    const gramList = document.createElement('ul');
    lesson.grammar.forEach((g) => {
      const li = document.createElement('li');
      li.innerHTML = g.name;
      gramList.appendChild(li);
    });
    bd.appendChild(gramTitle);
    bd.appendChild(gramList);
    const exTitle = document.createElement('h4');
    exTitle.textContent = 'Beispiele:';
    const exList = document.createElement('ul');
    lesson.examples.forEach((ex) => {
      const li = document.createElement('li');
      li.textContent = `${ex.hu} - ${ex.de}`;
      exList.appendChild(li);
    });
    bd.appendChild(exTitle);
    bd.appendChild(exList);
    const ft = document.createElement('div');
    ft.className = 'ft';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn';
    backBtn.textContent = 'Zurück';
    backBtn.addEventListener('click', () => {
      renderLessons();
    });
    ft.appendChild(backBtn);
    card.appendChild(hd);
    card.appendChild(bd);
    card.appendChild(ft);
    mainContent.appendChild(card);
  }

  // Vokabel‑Ansicht (Platzhalter)
  function renderVocab() {
    const content = document.createElement('div');
    content.innerHTML = '<h2>Vokabeln</h2><p>Der Vokabeltrainer ist in dieser vereinfachten Version nicht verfügbar.</p>';
    mainContent.appendChild(content);
  }

  // Einstellungen‑Ansicht
  function renderSettings() {
    const wrapper = document.createElement('div');
    wrapper.className = 'grid grid-1';
    // Offline‑Modus
    const offlineSetting = document.createElement('div');
    offlineSetting.className = 'card';
    const hd = document.createElement('div');
    hd.className = 'hd';
    hd.textContent = 'Offline‑Modus';
    const bd = document.createElement('div');
    bd.className = 'bd';
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!state.allowOffline;
    checkbox.addEventListener('change', () => {
      state.allowOffline = checkbox.checked;
      saveState();
    });
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' Lokales Speichern erlauben'));
    bd.appendChild(label);
    offlineSetting.appendChild(hd);
    offlineSetting.appendChild(bd);
    wrapper.appendChild(offlineSetting);

    // Prüfungsvorbereitung
    const examSetting = document.createElement('div');
    examSetting.className = 'card';
    const hd2 = document.createElement('div');
    hd2.className = 'hd';
    hd2.textContent = 'Prüfungsvorbereitung';
    const bd2 = document.createElement('div');
    bd2.className = 'bd';
    const label2 = document.createElement('label');
    const checkbox2 = document.createElement('input');
    checkbox2.type = 'checkbox';
    checkbox2.checked = !!state.examPrep;
    checkbox2.addEventListener('change', () => {
      state.examPrep = checkbox2.checked;
      saveState();
    });
    label2.appendChild(checkbox2);
    label2.appendChild(document.createTextNode(' Prüfungsvorbereitung aktivieren'));
    bd2.appendChild(label2);
    examSetting.appendChild(hd2);
    examSetting.appendChild(bd2);
    wrapper.appendChild(examSetting);

    mainContent.appendChild(wrapper);
  }

  // Erster Render
  render();
});