🧸 Խաղանք (Khaghank) — Armenian Colors & Numbers for Toddlers

A simple, colorful web game that helps 2-year-old children learn colors and numbers in Armenian. Built with plain HTML, CSS and JavaScript. No frameworks, no installation, no internet connection needed.

Features
🎨 Colors (Գույներ): tap a color to see it full screen with a picture, the Armenian word and its Latin transliteration, and hear it spoken.
🔢 Numbers (Թվեր): tap a number from 1 to 10 to watch that many objects appear one by one while the game counts aloud in Armenian.
🔍 Find the color / Find the number (Գտիր գույնը / Գտիր թիվը): the game says a word and the child picks the right answer from 3 choices. A correct answer gives stars and a happy sound. A wrong answer gently shakes the card, so there is no failure.
Made for toddlers: very large buttons, no reading needed, no timers, no scores.
Works on phones, tablets and computers. Supports light and dark mode.
Vocabulary
Colors		Numbers	
Կարմիր (karmir)	red	մեկ (mek)	1
Կապույտ (kapuyt)	blue	երկու (yerku)	2
Դեղին (deghin)	yellow	երեք (yerek)	3
Կանաչ (kanach)	green	չորս (chors)	4
Նարնջագույն (narnjaguyn)	orange	հինգ (hing)	5
Վարդագույն (vardaguyn)	pink	վեց (vets)	6
Մանուշակագույն (manushakaguyn)	purple	յոթ (yot)	7
Սպիտակ (spitak)	white	ութ (ut)	8
Սև (sev)	black	ինը (iny)	9
		տասը (tasy)	10
Getting started
Download or clone this repository:
bash
   git clone https://github.com/user35738/armenian-toddler-game.git
Open the folder and double-click index.html. It opens in any modern browser (Chrome, Safari, Edge, Firefox).

To host it online for free, use GitHub Pages: go to Settings → Pages, choose the main branch and save.

Project structure
armenian-toddler-game/
├── index.html   # page structure
├── style.css    # colors, layout and animations
├── script.js    # game logic, Armenian words and sounds
└── README.md
Sound and Armenian voice

The game speaks using the browser's built-in text-to-speech (hy-AM). Not every device has an Armenian voice installed. When there is none, the game plays a short beep and shows the big Armenian word, so a parent can read it aloud. To get spoken Armenian, install an Armenian voice in your device's text-to-speech settings.

Customization

All content is at the top of script.js:

COLORS: add or change colors (Armenian word, transliteration, hex color, emoji).
NUMS and NUMTR: the Armenian number words and their transliteration.
THINGS: the emojis used for counting.
Ideas for the future
Record real voice clips instead of text-to-speech
Shapes, animals and the Armenian alphabet
Numbers above 10
License

Released under the MIT License. Feel free to use, change and share it.
