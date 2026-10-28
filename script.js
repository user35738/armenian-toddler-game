/* ==========================================================
   Խաղանք — game logic
   ========================================================== */

/* ---------- Data ---------- */
const COLORS = [
    { hy: 'Կարմիր',         tr: 'karmir',        c: '#e53935', e: '🍎' },
    { hy: 'Կապույտ',        tr: 'kapuyt',        c: '#1e88e5', e: '🐳' },
    { hy: 'Դեղին',          tr: 'deghin',        c: '#f9c80e', e: '🌞' },
    { hy: 'Կանաչ',          tr: 'kanach',        c: '#2e9e4f', e: '🐸' },
    { hy: 'Նարնջագույն',    tr: 'narnjaguyn',    c: '#fb8c00', e: '🍊' },
    { hy: 'Վարդագույն',     tr: 'vardaguyn',     c: '#ec5fa0', e: '🐷' },
    { hy: 'Մանուշակագույն', tr: 'manushakaguyn', c: '#8e44ad', e: '🍇' },
    { hy: 'Սպիտակ',         tr: 'spitak',        c: '#f3f3f3', e: '☁️', dark: true },
    { hy: 'Սև',             tr: 'sev',           c: '#222222', e: '🐈‍⬛' }
];

const NUMS   = ['մեկ', 'երկու', 'երեք', 'չորս', 'հինգ', 'վեց', 'յոթ', 'ութ', 'ինը', 'տասը'];
const NUMTR  = ['mek', 'yerku', 'yerek', 'chors', 'hing', 'vets', 'yot', 'ut', 'iny', 'tasy'];
const THINGS = ['🍎', '⭐', '🐥', '🎈', '🚗', '🐟', '🍓', '🦋', '🧸', '🌸'];

/* ---------- Helpers ---------- */
const app  = document.querySelector('#app');
const rnd  = (n) => Math.floor(Math.random() * n);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let voice = null;
let audioCtx = null;
let target = null;      // the correct answer in the find game
let kind = 'c';         // 'c' = colors, 'n' = numbers
let token = 0;          // cancels an old counting animation

function stopSpeech() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}

/* ---------- Sound ---------- */
function pickVoice() {
    const voices = speechSynthesis.getVoices();
    voice = voices.find((v) => /^hy/i.test(v.lang)) || null;
}

if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
}

function beep(freq = 520) {
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();

        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.15;

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        /* sound is optional */
    }
}

function say(text) {
    if (!('speechSynthesis' in window)) {
        beep();
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang  = 'hy-AM';
        utterance.rate  = 0.7;
        utterance.pitch = 1.25;
        utterance.onend   = resolve;
        utterance.onerror = resolve;

        if (voice) {
            utterance.voice = voice;
        } else {
            beep(600);
        }

        speechSynthesis.speak(utterance);
        setTimeout(resolve, 2500);
    });
}

/* ---------- Celebration ---------- */
function burst() {
    const box = document.createElement('div');
    box.className = 'stars';

    for (let i = 0; i < 16; i++) {
        const star = document.createElement('i');
        star.textContent = ['⭐', '🌟', '✨', '🎉'][rnd(4)];
        star.style.left = '50%';
        star.style.top  = '55%';
        star.style.setProperty('--dx', (rnd(600) - 300) + 'px');
        star.style.setProperty('--dy', (rnd(500) - 380) + 'px');
        box.appendChild(star);
    }

    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1400);
}

/* ---------- Screens ---------- */
function topbar() {
    return `
        <div class="top">
            <button class="home" onclick="home()" aria-label="Home">🏠</button>
            <span style="font-size: 2.2rem">🐥</span>
        </div>`;
}

function home() {
    stopSpeech();

    app.innerHTML = `
        <h1>🧸 Խաղանք</h1>
        <p class="sub">Let’s play!</p>

        <div class="menu">
            <button class="big" style="background: #e53935" onclick="colors()">
                🎨 Գույներ<small>Colors</small>
            </button>
            <button class="big" style="background: #1e88e5" onclick="numbers()">
                🔢 Թվեր<small>Numbers</small>
            </button>
            <button class="big" style="background: #2e9e4f" onclick="find('c')">
                🔍 Գտիր գույնը<small>Find the color</small>
            </button>
            <button class="big" style="background: #8e44ad" onclick="find('n')">
                🔍 Գտիր թիվը<small>Find the number</small>
            </button>
        </div>

        <p class="note">
            Tip: tap anything. There are no wrong answers. If your device has no Armenian
            voice, install one in system text-to-speech settings, or say the word yourself
            when the big word appears.
        </p>`;
}

/* ---------- Colors ---------- */
function colors() {
    const tiles = COLORS.map((c, i) => `
        <button class="tile"
                style="background: ${c.c}; ${c.dark ? 'border: 4px solid #ccc; color: #222;' : ''}"
                onclick="showColor(${i})">
            <span style="font-size: clamp(2.6rem, 12vw, 4rem)">${c.e}</span>
        </button>`).join('');

    app.innerHTML = topbar() + `<div class="grid">${tiles}</div>`;
}

function showColor(i) {
    const c = COLORS[i];
    const stage = document.createElement('div');

    stage.className = 'stage';
    stage.style.background = c.c;
    if (c.dark) {
        stage.style.color = '#222';
    }

    stage.innerHTML = `
        <button class="x" aria-label="Close">✕</button>
        <div style="font-size: clamp(5rem, 28vw, 9rem)">${c.e}</div>
        <div class="word">${c.hy}</div>
        <div class="tr">${c.tr}</div>`;

    stage.onclick = () => {
        stopSpeech();
        stage.remove();
    };

    document.body.appendChild(stage);
    say(c.hy);
}

/* ---------- Numbers ---------- */
function numbers() {
    const tiles = NUMS.map((n, i) => `
        <button class="tile num" onclick="showNum(${i})">${i + 1}</button>`).join('');

    app.innerHTML = topbar() + `<div class="grid">${tiles}</div>`;
}

async function showNum(i) {
    const my    = ++token;
    const n     = i + 1;
    const emoji = THINGS[rnd(THINGS.length)];
    const items = Array.from({ length: n }, () => `<span>${emoji}</span>`).join('');

    const stage = document.createElement('div');
    stage.className = 'stage numstage';
    stage.innerHTML = `
        <button class="x" aria-label="Close">✕</button>
        <div class="digit">${n}</div>
        <div class="word">${NUMS[i]}</div>
        <div class="tr">${NUMTR[i]}</div>
        <div class="things">${items}</div>`;

    stage.onclick = () => {
        token++;
        stopSpeech();
        stage.remove();
    };

    document.body.appendChild(stage);

    const spans = [...stage.querySelectorAll('.things span')];

    for (let k = 0; k < n; k++) {
        if (my !== token) return;

        spans[k].classList.add('on');
        await say(NUMS[k]);
        await wait(250);
    }

    if (my === token) {
        burst();
    }
}

/* ---------- Find game ---------- */
function find(k) {
    kind = k;
    round();
}

function pickThree(max) {
    const list = [];
    while (list.length < 3) {
        const x = rnd(max);
        if (!list.includes(x)) list.push(x);
    }
    return list;
}

function round() {
    if (kind === 'c') {
        const opts = pickThree(COLORS.length);
        target = opts[rnd(3)];

        const choices = opts.map((o) => `
            <button class="choice"
                    style="background: ${COLORS[o].c}; ${COLORS[o].dark ? 'border: 4px solid #ccc;' : ''}"
                    onclick="pick(this, ${o})"></button>`).join('');

        app.innerHTML = topbar() + `
            <div class="ask" onclick="say(COLORS[target].hy)">🔊 ${COLORS[target].hy}</div>
            <div class="choices">${choices}</div>`;

        say(COLORS[target].hy);
    } else {
        const opts  = pickThree(5);
        const emoji = THINGS[rnd(THINGS.length)];
        target = opts[rnd(3)];

        const choices = opts.map((o) => `
            <button class="choice" onclick="pick(this, ${o})">
                <span class="mini">${Array(o + 1).fill(emoji).join('')}</span>
                <span>${o + 1}</span>
            </button>`).join('');

        app.innerHTML = topbar() + `
            <div class="ask" onclick="say(NUMS[target])">🔊 ${NUMS[target]}</div>
            <div class="choices">${choices}</div>`;

        say(NUMS[target]);
    }
}

async function pick(el, value) {
    if (value === target) {
        burst();
        beep(780);
        await say(kind === 'c' ? COLORS[value].hy : NUMS[value]);
        await wait(900);
        round();
    } else {
        beep(240);
        el.classList.remove('shake');
        void el.offsetWidth;            // restart the animation
        el.classList.add('shake');
    }
}

/* ---------- Start ---------- */
home();
