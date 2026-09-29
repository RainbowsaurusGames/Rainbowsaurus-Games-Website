const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
const paintedPixels = new Map();

// LADE GESPEICHERTE PIXEL
const savedPixels = localStorage.getItem('rainbowPixels');
if (savedPixels) {
    const parsed = JSON.parse(savedPixels);
    parsed.forEach(([key, color]) => paintedPixels.set(key, color));
}

function savePixelsToStorage() {
    localStorage.setItem('rainbowPixels', JSON.stringify(Array.from(paintedPixels.entries())));
}

const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#00E676', '#00F0FF', '#AF52DE', '#FF477E'];
const gridSize = 20;

let isDrawing = false;
let isErasing = false;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const mouse = { x: null, y: null };

// EIGENER MAUSZEIGER
const cursor = document.createElement('div');
cursor.classList.add('custom-cursor');
document.body.appendChild(cursor);

function setupCursorHover() {
    const interactables = document.querySelectorAll('a, button, label, input, .hover-scale, .glass-button');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
    });
}
setupCursorHover();

// BEWEGUNG & MALEN
window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    cursor.style.left = mouse.x + 'px';
    cursor.style.top = mouse.y + 'px';

    document.documentElement.style.setProperty('--mouse-x', mouse.x + 'px');
    document.documentElement.style.setProperty('--mouse-y', mouse.y + 'px');

    particlesArray.push(new Pixel(mouse.x, mouse.y));

    const gridX = Math.floor(mouse.x / gridSize) * gridSize;
    const gridY = Math.floor(mouse.y / gridSize) * gridSize;
    const key = `${gridX},${gridY}`;

    if (isDrawing) {
        if (!paintedPixels.has(key)) {
            paintedPixels.set(key, colors[Math.floor(Math.random() * colors.length)]);
            savePixelsToStorage();
        }
    } else if (isErasing) {
        if (paintedPixels.has(key)) {
            paintedPixels.delete(key);
            savePixelsToStorage();
        }
    }
});

// KLICKEN
window.addEventListener('mousedown', (event) => {
    const gridX = Math.floor(event.clientX / gridSize) * gridSize;
    const gridY = Math.floor(event.clientY / gridSize) * gridSize;
    const key = `${gridX},${gridY}`;

    if (event.button === 0) {
        isDrawing = true;
        cursor.classList.add('cursor-drawing');
        paintedPixels.set(key, colors[Math.floor(Math.random() * colors.length)]);
        savePixelsToStorage();
    } else if (event.button === 2) {
        isErasing = true;
        cursor.classList.add('cursor-erasing');
        paintedPixels.delete(key);
        savePixelsToStorage();
    }
});

// LOSLASSEN
window.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
        isDrawing = false;
        cursor.classList.remove('cursor-drawing');
    }
    if (event.button === 2) {
        isErasing = false;
        cursor.classList.remove('cursor-erasing');
    }
});

window.addEventListener('contextmenu', (event) => {
    if (event.target.tagName !== 'A' && !event.target.closest('.card') && !event.target.closest('.glass-button')) {
        event.preventDefault();
    }
});

class Pixel {
    constructor(x, y) {
        this.x = Math.floor(x / gridSize) * gridSize;
        this.y = Math.floor(y / gridSize) * gridSize;
        this.size = gridSize;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 1;
    }
    update() { this.alpha -= 0.03; }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.shadowBlur = 0;
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paintedPixels.forEach((color, key) => {
        const [x, y] = key.split(',').map(Number);
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillRect(x, y, gridSize, gridSize);
        ctx.shadowBlur = 0;
    });

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();

        if (particlesArray[i].alpha <= 0) {
            particlesArray.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(animate);
}

animate();

// SCROLL ANIMATIONEN
const observer = new IntersectionObserver((entries) => {
    let delay = 0;
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.transitionDelay = `${delay}ms`;
            entry.target.classList.add('slide-show');
            delay += 150;
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

const hiddenElements = document.querySelectorAll('.slide-hidden, .slide-hidden-right');
hiddenElements.forEach((el) => observer.observe(el));

// SCROLL-LINIE LEBENSLAUF
const journeyContainer = document.getElementById('journey-container');
const journeyProgress = document.getElementById('journey-progress');

window.addEventListener('scroll', () => {
    if (!journeyContainer || !journeyProgress) return;
    const rect = journeyContainer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const startTrigger = windowHeight * 0.6;
    let scrollDistance = startTrigger - rect.top;
    let totalScrollable = rect.height;
    let percentage = (scrollDistance / totalScrollable) * 100;

    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;

    journeyProgress.style.height = `${percentage}%`;
});

// ZOOM & STICKY ANIMATION FÜR LEBENSLAUF-STATIONEN
const stationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active-station');
        } else {
            entry.target.classList.remove('active-station');
        }
    });
}, {
    rootMargin: "-30% 0px -30% 0px",
    threshold: 0
});

const journeyItems = document.querySelectorAll('.journey-item');
journeyItems.forEach((el) => stationObserver.observe(el));

// AUTOMATISCHE ARTWORK SLIDESHOW
const artImages = [
    'graphics/art/Rhinco.png',
    'graphics/art/paloma estúpida.jpg',
    'graphics/art/Fairytales.jpg',
    'graphics/art/Morrigan.jpg',
    'graphics/art/DorianAndRhys.jpg',
    'graphics/art/Leon 2.png',
];

const frameColors = [
    'var(--accent-yellow)',
    'var(--accent-pink)',
    'var(--accent-cyan)',
    'var(--accent-purple)',
    'var(--accent-green)',
    'var(--accent-orange)'
];

const slideshowContainer = document.getElementById('art-slideshow');

if (slideshowContainer && artImages.length > 0) {
    artImages.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'slide';
        if (index === 0) img.classList.add('active-slide');
        slideshowContainer.appendChild(img);
    });

    slideshowContainer.style.borderColor = frameColors[0];
    slideshowContainer.style.boxShadow = `0 0 15px rgba(255, 204, 0, 0.2)`;

    let currentSlide = 0;
    const slides = slideshowContainer.querySelectorAll('.slide');

    if (slides.length > 1) {
        setInterval(() => {
            slides[currentSlide].classList.remove('active-slide');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active-slide');

            const newColor = frameColors[currentSlide % frameColors.length];
            slideshowContainer.style.borderColor = newColor;
        }, 4000);
    }
}

// LEINWAND LÖSCHEN BUTTON
const clearBtn = document.getElementById('clear-canvas-btn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        paintedPixels.clear();
        localStorage.removeItem('rainbowPixels');
        clearBtn.style.backgroundColor = "var(--accent-red)";
        clearBtn.style.color = "var(--bg-main)";
        setTimeout(() => {
            clearBtn.style.backgroundColor = "";
            clearBtn.style.color = "";
        }, 300);
    });
}

// ZUFÄLLIGE FAHRBAHNEN FÜR PIXEL-TIERE
function randomizePixelLanes() {
    const pixels = document.querySelectorAll('.pixel-shape');
    if (pixels.length === 0) return;

    const usedLanes = new Set();
    const maxLanes = Math.max(20, Math.floor(window.innerHeight / gridSize) - 10);

    pixels.forEach(p => {
        let lane;
        let attempts = 0;
        let found = false;

        do {
            lane = Math.floor(Math.random() * maxLanes);
            let conflict = false;
            for (let i = -6; i <= 6; i++) {
                if (usedLanes.has(lane + i)) {
                    conflict = true;
                    break;
                }
            }
            if (!conflict) found = true;
            attempts++;
        } while (!found && attempts < 100);

        if (found) {
            for (let i = -6; i <= 6; i++) usedLanes.add(lane + i);
        }

        p.style.top = (lane * gridSize) + 'px';
    });
}
randomizePixelLanes();

// ZUFÄLLIGE SPRECHBLASE FÜR DEN DINO
const dinoBubble = document.getElementById('dino-bubble');

if (dinoBubble) {
    // Hier kannst du all deine Arcade-Sprüche eintragen (\n macht einen Zeilenumbruch)
    const bubbleTexts = [
        "RAWR!",
        "PRESS START\nTO PLAY!",
        "READY, SET,\nCODE!",
        "INSERT COIN",
        "LEVEL UP!",
        "PET MOCHI!"
    ];

    // Wählt einen zufälligen Spruch aus der Liste
    const randomText = bubbleTexts[Math.floor(Math.random() * bubbleTexts.length)];
    dinoBubble.innerText = randomText;

    // Lässt die Blase nach 2,5 Sekunden aufploppen
    setTimeout(() => {
        dinoBubble.classList.add('show-bubble');
    }, 2500);
}


/* --- AUTOMATISCHE SPRACHERKENNUNG (VORERST DEAKTIVIERT) ---
if (!localStorage.getItem('langPref')) {
    // Prüfen, ob der Browser auf Deutsch gestellt ist
    if (navigator.language.startsWith('de')) {
        localStorage.setItem('langPref', 'de');
        
        // Aktuelle Datei aus der URL auslesen
        let path = window.location.pathname;
        let page = path.split('/').pop();
        
        // Falls die URL auf dem Hauptverzeichnis endet (z. B. ohne "index.html")
        if (page === '' || !page.includes('.html')) {
            page = 'index.html';
        }
        
        // Nur weiterleiten, wenn wir nicht sowieso schon auf einer "_de"-Seite sind
        if (!page.includes('_de.html')) {
            let targetPage = page.replace('.html', '_de.html');
            window.location.href = targetPage;
        }
    }
}
*/

// --- FIX FÜR PIXELTIER-RASTER (Grid Snapping) ---
function snapToGrid() {
    // Berechnet die aktuelle Fensterbreite und rundet auf das nächste glatte Vielfache von 20 auf
    const gridWidth = Math.ceil(window.innerWidth / gridSize) * gridSize;

    // Greift sich alle Tiere, die von rechts ins Bild laufen
    document.querySelectorAll('.cat, .pokeball, .triforce, .boba').forEach(el => {
        // Das Triforce braucht etwas mehr Anlauf (260px), der Rest startet bei 200px
        let offset = el.classList.contains('triforce') ? 260 : 200;

        // Löst den krummen rechten CSS-Anker und setzt einen perfekten linken Anker
        el.style.right = 'auto';
        el.style.left = (gridWidth + offset) + 'px';
    });
}

// Führt das Snapping beim Neuladen und bei jeder Größenänderung des Fensters aus
snapToGrid();
window.addEventListener('resize', snapToGrid);

// --- NEWS FEED AUS JSON LADEN ---
const newsFeed = document.getElementById('news-feed');

if (newsFeed) {
    fetch('news.json')
        .then(response => {
            if (!response.ok) throw new Error("JSON nicht gefunden");
            return response.json();
        })
        .then(data => {
            newsFeed.innerHTML = ''; // Lade-Text entfernen

            data.forEach(news => {
                const article = document.createElement('div');
                article.className = 'news-item';

                // Setzt die Hauptfarbe für den ganzen Eintrag (Border & Links)
                const mainColor = news.color || 'var(--accent-cyan)';
                article.style.setProperty('--item-color', mainColor);

                // 1. Tags zusammenbauen (unterstützt jetzt ein Array von Tags)
                let tagsHTML = '';
                if (Array.isArray(news.tags)) {
                    news.tags.forEach(tag => {
                        tagsHTML += `<span class="news-tag" style="color: ${mainColor}; border: 1px solid ${mainColor}40;">${tag}</span>`;
                    });
                }

                // 2. Bild & Untertitel zusammenbauen (nur wenn ein Bild angegeben ist)
                let mediaHTML = '';
                if (news.image) {
                    let captionHTML = news.caption ? `<figcaption class="news-caption">${news.caption}</figcaption>` : '';
                    mediaHTML = `
                        <figure class="news-media">
                            <img src="${news.image}" alt="${news.title}">
                            ${captionHTML}
                        </figure>
                    `;
                }

                // 3. Alles in das HTML-Gerüst gießen
                article.innerHTML = `
                    <div class="news-meta">
                        <span class="news-date">${news.date}</span>
                        ${tagsHTML}
                    </div>
                    <h4 class="news-title">${news.title}</h4>
                    <p class="news-content">${news.content}</p>
                    ${mediaHTML}
                `;

                newsFeed.appendChild(article);
            });
        })
        .catch(error => {
            newsFeed.innerHTML = `<p style="color: var(--accent-red); font-family: monospace;">[ERROR] Konnte SYSTEM.LOG nicht laden. ${error}</p>`;
        });
}