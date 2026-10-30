/* ==========================================================
   Խաղանք — Armenian Kids Learning Game
   Custom Armenian MP3 sounds + speech fallback
   ========================================================== */

/* ---------- Data ---------- */

const COLORS = [
    { hy: "Կարմիր", tr: "karmir", c: "#e53935", e: "🍎" },
    { hy: "Կապույտ", tr: "kapuyt", c: "#1e88e5", e: "🐳" },
    { hy: "Դեղին", tr: "deghin", c: "#f9c80e", e: "🌞" },
    { hy: "Կանաչ", tr: "kanach", c: "#2e9e4f", e: "🐸" },
    { hy: "Նարնջագույն", tr: "narnjaguyn", c: "#fb8c00", e: "🍊" },
    { hy: "Վարդագույն", tr: "vardaguyn", c: "#ec5fa0", e: "🐷" },
    { hy: "Մանուշակագույն", tr: "manushakaguyn", c: "#8e44ad", e: "🍇" },
    { hy: "Սպիտակ", tr: "spitak", c: "#f3f3f3", e: "☁️", dark: true },
    { hy: "Սև", tr: "sev", c: "#222222", e: "🐈‍⬛" }
];

const NUMS = [
    "մեկ", "երկու", "երեք", "չորս", "հինգ",
    "վեց", "յոթ", "ութ", "ինը", "տասը"
];

const NUMTR = [
    "mek", "yerku", "yerek", "chors", "hing",
    "vets", "yot", "ut", "iny", "tasy"
];

const THINGS = [
    "🍎", "⭐", "🐥", "🎈", "🚗",
    "🐟", "🍓", "🦋", "🧸", "🌸"
];

/* ---------- Settings ---------- */

// Set to true to use your MP3 files.
// If a file is missing, the game uses browser speech instead.
const USE_CUSTOM_SOUNDS = true;

// Set to false if you do not want browser speech fallback.
const USE_SPEECH_FALLBACK = true;

const SPEECH_RATE = 0.78;
const SPEECH_PITCH = 1.45;
const SPEECH_VOLUME = 1.0;

/* ---------- Helpers ---------- */

const app = document.querySelector("#app");

const rnd = (n) => Math.floor(Math.random() * n);

const wait = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

let voice = null;
let audioCtx = null;
let target = null;
let kind = "c";
let token = 0;

let activeAudio = null;
let audioCache = new Map();
let audioRequestId = 0;

/* ---------- Stop all speech and audio ---------- */

function stopSpeech() {
    audioRequestId++;

    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }

    if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
        activeAudio = null;
    }
}

/* ---------- Armenian Voice Selection ---------- */

function pickVoice() {
    if (!("speechSynthesis" in window)) return;

    const voices = speechSynthesis.getVoices();

    voice =
        voices.find(v => /^hy-AM$/i.test(v.lang)) ||
        voices.find(v => /^hy([-_]|$)/i.test(v.lang)) ||
        null;
}

if ("speechSynthesis" in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
}

/* ---------- Custom MP3 Playback ---------- */

function playCustomAudio(folder, filename) {
    return new Promise(resolve => {
        if (!USE_CUSTOM_SOUNDS) {
            resolve("missing");
            return;
        }

        const requestId = ++audioRequestId;
        const path = `sounds/${folder}/${filename}.mp3`;

        let audio = audioCache.get(path);

        if (!audio) {
            audio = new Audio(path);
            audio.preload = "auto";
            audioCache.set(path, audio);
        }

        if (activeAudio) {
            activeAudio.pause();
            activeAudio.currentTime = 0;
        }

        activeAudio = audio;
        audio.currentTime = 0;

        let finished = false;

        function finish(result) {
            if (finished) return;
            finished = true;

            audio.onended = null;
            audio.onerror = null;
            audio.onabort = null;

            if (activeAudio === audio) {
                activeAudio = null;
            }

            resolve(result);
        }

        audio.onended = () => finish("played");
        audio.onerror = () => finish("missing");
        audio.onabort = () => finish("cancelled");

        const playPromise = audio.play();

        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => finish("missing"));
        }

        // If another sound starts, do not continue this request.
        if (requestId !== audioRequestId) {
            audio.pause();
            finish("cancelled");
        }
    });
}

/* ---------- Browser Speech Fallback ---------- */

function speakWithBrowser(text) {
    if (!USE_SPEECH_FALLBACK || !("speechSynthesis" in window)) {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = "hy-AM";
        utterance.rate = SPEECH_RATE;
        utterance.pitch = SPEECH_PITCH;
        utterance.volume = SPEECH_VOLUME;

        if (voice) {
            utterance.voice = voice;
        }

        utterance.onend = resolve;
        utterance.onerror = resolve;

        speechSynthesis.speak(utterance);
    });
}

/* ---------- Main Say Function ---------- */

// folder: "colors" or "numbers"
// filename: for example "karmir" or "mek"

async function say(text, folder = null, filename = null) {
    if (folder && filename && USE_CUSTOM_SOUNDS) {
        const result = await playCustomAudio(folder, filename);

        if (result === "played" || result === "cancelled") {
            return;
        }
    }

    await speakWithBrowser(text);
}

/* ---------- Beep Sound ---------- */

function beep(freq = 520) {
    try {
        audioCtx =
            audioCtx ||
            new (window.AudioContext || window.webkitAudioContext)();

        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.15;

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.3
        );

        osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        // Sound is optional.
    }
}

/* ---------- Celebration ---------- */

function burst() {
    const box = document.createElement("div");
    box.className = "stars";

    for (let i = 0; i < 16; i++) {
        const star = document.createElement("i");

        star.textContent = ["⭐", "🌟", "✨", "🎉"][rnd(4)];
        star.style.left = "50%";
        star.style.top = "55%";

        star.style.setProperty(
            "--dx",
            rnd(600) - 300 + "px"
        );

        star.style.setProperty(
            "--dy",
            rnd(500) - 380 + "px"
        );

        box.appendChild(star);
    }

    document.body.appendChild(box);

    setTimeout(() => box.remove(), 1400);
}

/* ---------- Top Bar ---------- */

function topbar() {
    return `
        <div class="top">
            <button class="home"
                    onclick="home()"
                    aria-label="Home">🏠</button>
            <span style="font-size: 2.2rem">🐥</span>
        </div>
    `;
}

/* ---------- Home Screen ---------- */

function home() {
    token++;
    stopSpeech();

    app.innerHTML = `
        <h1>🧸 Խաղանք</h1>

        <p class="sub">Let's play!</p>

        <div class="menu">

            <button class="big"
                    style="background: #e53935"
                    onclick="colors()">
                🎨 Գույներ
                <small>Colors</small>
            </button>

            <button class="big"
                    style="background: #1e88e5"
                    onclick="numbers()">
                🔢 Թվեր
                <small>Numbers</small>
            </button>

            <button class="big"
                    style="background: #2e9e4f"
                    onclick="find('c')">
                🔍 Գտիր գույնը
                <small>Find the color</small>
            </button>

            <button class="big"
                    style="background: #8e44ad"
                    onclick="find('n')">
                🔍 Գտիր թիվը
                <small>Find the number</small>
            </button>

        </div>

        <p class="note">
            Խաղա՛ և սովորի՛ր գույներն ու թվերը։
        </p>
    `;
}

/* ---------- Colors ---------- */

function colors() {
    token++;
    stopSpeech();

    const tiles = COLORS.map((c, i) => `
        <button class="tile"
                style="
                    background: ${c.c};
                    ${c.dark ? "border: 4px solid #ccc; color: #222;" : ""}
                "
                onclick="showColor(${i})">

            <span style="font-size: clamp(2.6rem, 12vw, 4rem)">
                ${c.e}
            </span>

        </button>
    `).join("");

    app.innerHTML =
        topbar() +
        `<div class="grid">${tiles}</div>`;
}

function showColor(i) {
    const c = COLORS[i];

    stopSpeech();

    const stage = document.createElement("div");
    stage.className = "stage";
    stage.style.background = c.c;

    if (c.dark) {
        stage.style.color = "#222";
    }

    stage.innerHTML = `
        <button class="x" aria-label="Close">✕</button>

        <div style="font-size: clamp(5rem, 28vw, 9rem)">
            ${c.e}
        </div>

        <div class="word">${c.hy}</div>
        <div class="tr">${c.tr}</div>
    `;

    stage.querySelector(".x").onclick = (event) => {
        event.stopPropagation();
        stopSpeech();
        stage.remove();
    };

    stage.onclick = () => {
        stopSpeech();
        stage.remove();
    };

    document.body.appendChild(stage);

    say(c.hy, "colors", c.tr);
}

/* ---------- Numbers ---------- */

function numbers() {
    token++;
    stopSpeech();

    const tiles = NUMS.map((n, i) => `
        <button class="tile num"
                onclick="showNum(${i})">
            ${i + 1}
        </button>
    `).join("");

    app.innerHTML =
        topbar() +
        `<div class="grid">${tiles}</div>`;
}

async function showNum(i) {
    const myToken = ++token;

    stopSpeech();

    const n = i + 1;
    const emoji = THINGS[rnd(THINGS.length)];

    const items = Array.from(
        { length: n },
        () => `<span>${emoji}</span>`
    ).join("");

    const stage = document.createElement("div");
    stage.className = "stage numstage";

    stage.innerHTML = `
        <button class="x" aria-label="Close">✕</button>

        <div class="digit">${n}</div>

        <div class="word">${NUMS[i]}</div>

        <div class="tr">${NUMTR[i]}</div>

        <div class="things">${items}</div>
    `;

    stage.querySelector(".x").onclick = (event) => {
        event.stopPropagation();
        token++;
        stopSpeech();
        stage.remove();
    };

    stage.onclick = () => {
        token++;
        stopSpeech();
        stage.remove();
    };

    document.body.appendChild(stage);

    const spans = [...stage.querySelectorAll(".things span")];

    // Count objects one by one.
    for (let k = 0; k < n; k++) {
        if (myToken !== token) return;

        spans[k].classList.add("on");

        await say(NUMS[k], "numbers", NUMTR[k]);

        if (myToken !== token) return;

        await wait(250);
    }

    if (myToken === token) {
        burst();
    }
}

/* ---------- Find Game ---------- */

function find(k) {
    token++;
    stopSpeech();

    kind = k;
    round();
}

function pickThree(max) {
    const list = [];

    while (list.length < 3) {
        const x = rnd(max);

        if (!list.includes(x)) {
            list.push(x);
        }
    }

    return list;
}

/* ---------- New Round ---------- */

function round() {
    token++;
    stopSpeech();

    if (kind === "c") {
        const opts = pickThree(COLORS.length);

        target = opts[rnd(3)];

        const choices = opts.map(o => `
            <button class="choice"
                    style="
                        background: ${COLORS[o].c};
                        ${COLORS[o].dark ? "border: 4px solid #ccc;" : ""}
                    "
                    onclick="pick(this, ${o})">
            </button>
        `).join("");

        app.innerHTML = topbar() + `
            <div class="ask"
                 onclick="say(
                    COLORS[target].hy,
                    'colors',
                    COLORS[target].tr
                 )">
                🔊 ${COLORS[target].hy}
            </div>

            <div class="choices">
                ${choices}
            </div>
        `;

        say(
            COLORS[target].hy,
            "colors",
            COLORS[target].tr
        );

    } else {
        const opts = pickThree(10);
        const emoji = THINGS[rnd(THINGS.length)];

        target = opts[rnd(3)];

        const choices = opts.map(o => `
            <button class="choice"
                    onclick="pick(this, ${o})">

                <span class="mini">
                    ${Array(o + 1).fill(emoji).join("")}
                </span>

                <span>${o + 1}</span>

            </button>
        `).join("");

        app.innerHTML = topbar() + `
            <div class="ask"
                 onclick="say(
                    NUMS[target],
                    'numbers',
                    NUMTR[target]
                 )">
                🔊 ${NUMS[target]}
            </div>

            <div class="choices">
                ${choices}
            </div>
        `;

        say(
            NUMS[target],
            "numbers",
            NUMTR[target]
        );
    }
}

/* ---------- Check Answer ---------- */

async function pick(el, value) {
    if (value === target) {
        const correctToken = token;

        burst();
        beep(780);

        const text =
            kind === "c"
                ? COLORS[value].hy
                : NUMS[value];

        const folder =
            kind === "c"
                ? "colors"
                : "numbers";

        const filename =
            kind === "c"
                ? COLORS[value].tr
                : NUMTR[value];

        await say(text, folder, filename);

        if (correctToken !== token) return;

        await wait(900);

        if (correctToken === token) {
            round();
        }

    } else {
        beep(240);

        el.classList.remove("shake");

        void el.offsetWidth;

        el.classList.add("shake");
    }
}

/* ---------- Start Game ---------- */

home();