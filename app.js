/**
 * GastoZero v7 - Con pestañas que se ocultan correctamente y lógica mejorada
 */

let state = {
    step: 'START',
    itemName: '',
    itemPrice: 0,
    needOrWant: '',
    user: null,
    isTyping: false,
    lastItem: null
};

// Datos de usuarios (localStorage)
let usersData = {};

function loadUsers() {
    const saved = localStorage.getItem('gastozero_users');
    if (saved) {
        usersData = JSON.parse(saved);
    }
}

function saveUsers() {
    localStorage.setItem('gastozero_users', JSON.stringify(usersData));
}

function getUserData(username) {
    if (!usersData[username]) {
        usersData[username] = {
            savedTotal: 0,
            streak: 0,
            lastDate: null,
            avoidedCount: 0,
            tipsCount: 0,
            history: []
        };
        saveUsers();
    }
    return usersData[username];
}

function updateUserData(username, data) {
    usersData[username] = { ...usersData[username], ...data };
    saveUsers();
}

// Elementos DOM
const chat = document.getElementById("chat-container");
const inputBox = document.getElementById("input-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const appDiv = document.getElementById("app");
const loginOverlay = document.getElementById("login-overlay");

// =========================
// 🌌 ESTRELLAS
// =========================
function createStars() {
    const container = document.getElementById("stars-layer");
    if (!container) return;
    container.innerHTML = '';
    
    const starCount = 150;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement("div");
        star.className = "star-particle";
        const size = Math.random() * 2 + 1;
        star.style.width = size + "px";
        star.style.height = size + "px";
        star.style.top = Math.random() * 100 + "%";
        star.style.left = Math.random() * 100 + "%";
        star.style.opacity = Math.random() * 0.5 + 0.2;
        star.style.animationDelay = Math.random() * 8 + "s";
        star.style.animationDuration = (Math.random() * 6 + 5) + "s";
        container.appendChild(star);
    }
    
    const brightCount = 40;
    for (let i = 0; i < brightCount; i++) {
        const star = document.createElement("div");
        star.className = "star-bright";
        const size = Math.random() * 3 + 2;
        star.style.width = size + "px";
        star.style.height = size + "px";
        star.style.top = Math.random() * 100 + "%";
        star.style.left = Math.random() * 100 + "%";
        star.style.animationDelay = Math.random() * 3 + "s";
        star.style.animationDuration = (Math.random() * 2 + 2) + "s";
        container.appendChild(star);
    }
}

function createShootingStar() {
    const container = document.getElementById("stars-layer");
    if (!container) return;
    const star = document.createElement("div");
    star.className = "shooting-star";
    star.style.left = Math.random() * window.innerWidth + "px";
    star.style.top = Math.random() * (window.innerHeight / 2) + "px";
    container.appendChild(star);
    setTimeout(() => star.remove(), 2000);
}

function initStars() {
    createStars();
    setInterval(() => {
        if (Math.random() < 0.25) createShootingStar();
    }, 12000);
}
initStars();

// =========================
// 🔧 UTILIDADES
// =========================
function scrollToBottom() {
    if (chat) {
        chat.scrollTop = chat.scrollHeight;
    }
}

function setInputEnabled(enabled) {
    state.isTyping = !enabled;
    if (enabled) {
        inputBox.classList.remove("disabled");
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    } else {
        inputBox.classList.add("disabled");
        userInput.disabled = true;
        sendBtn.disabled = true;
    }
}

function updateFloatingCounter() {
    if (!state.user) return;
    const userData = getUserData(state.user);
    const counterEl = document.getElementById('counter-value');
    if (counterEl) counterEl.innerHTML = `${userData.savedTotal}€`;
}

function updateStatsDisplay() {
    if (!state.user) return;
    const userData = getUserData(state.user);
    const savedEl = document.getElementById('stat-saved');
    const streakEl = document.getElementById('stat-streak');
    const avoidedEl = document.getElementById('stat-avoided');
    const tipsEl = document.getElementById('stat-tips');
    
    if (savedEl) savedEl.innerHTML = `${userData.savedTotal}€`;
    if (streakEl) streakEl.innerHTML = `${userData.streak} días`;
    if (avoidedEl) avoidedEl.innerHTML = userData.avoidedCount;
    if (tipsEl) tipsEl.innerHTML = userData.tipsCount;
    
    updateFloatingCounter();
}

function updateHistoryDisplay() {
    if (!state.user) return;
    const userData = getUserData(state.user);
    const historyDiv = document.getElementById('history-list');
    if (!historyDiv) return;
    
    if (userData.history.length === 0) {
        historyDiv.innerHTML = '<p style="text-align:center; opacity:0.7;">✨ Aún no hay decisiones. ¡Analiza tu primer gasto!</p>';
        return;
    }
    
    historyDiv.innerHTML = userData.history.slice(0, 15).map(item => `
        <div class="history-item">
            <span class="item-name">${item.item}</span>
            <span class="item-price">${item.price}€</span>
            <span class="item-decision ${item.decision === 'evitado' ? 'avoided' : 'bought'}">${item.decision === 'evitado' ? '✅ Evitado' : '🛒 Comprado'}</span>
            <span class="item-date">${item.date}</span>
        </div>
    `).join('');
}

function addToHistory(item, price, decision) {
    if (!state.user) return;
    const userData = getUserData(state.user);
    userData.history.unshift({
        item,
        price,
        decision,
        date: new Date().toLocaleDateString()
    });
    if (userData.history.length > 30) userData.history.pop();
    updateUserData(state.user, { history: userData.history });
    updateHistoryDisplay();
}

function updateStreak() {
    if (!state.user) return;
    const userData = getUserData(state.user);
    const today = new Date().toDateString();
    if (userData.lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (userData.lastDate === yesterday.toDateString()) {
            userData.streak++;
        } else {
            userData.streak = 1;
        }
        userData.lastDate = today;
        updateUserData(state.user, { streak: userData.streak, lastDate: today });
        updateStatsDisplay();
        return userData.streak;
    }
    return userData.streak;
}

// =========================
// 💬 MENSAJES
// =========================
async function aiSpeak(messages) {
    for (let msg of messages) {
        if (!msg) continue;
        const div = document.createElement("div");
        div.className = "message";
        chat.appendChild(div);
        for (let c of msg) {
            div.innerHTML += c;
            scrollToBottom();
            await new Promise(r => setTimeout(r, 20));
        }
        await new Promise(r => setTimeout(r, 300));
    }
}

// =========================
// 🤖 DETECCIÓN MEJORADA
// =========================
const productosDetallados = {
    "ferrari": "Ferrari", "lamborghini": "Lamborghini", "porsche": "Porsche",
    "coche": "coche", "carro": "coche", "auto": "coche",
    "iphone": "iPhone", "samsung": "Samsung", "macbook": "MacBook",
    "ordenador": "ordenador", "portátil": "portátil", "pc": "ordenador",
    "cascos": "cascos", "auriculares": "auriculares",
    "zapatos": "zapatos", "zapatillas": "zapatillas",
    "silla": "silla", "teclado": "teclado", "ratón": "ratón", "monitor": "monitor"
};

function detectarProducto(texto) {
    const lower = texto.toLowerCase();
    for (let [key, value] of Object.entries(productosDetallados)) {
        if (lower.includes(key)) return value;
    }
    const palabras = texto.split(/\s+/);
    const palabrasValidas = palabras.filter(p => 
        !["un", "una", "el", "la", "los", "las", "comprar", "compro", "quiero", "necesito", "me", "de", "que"].includes(p.toLowerCase())
    );
    if (palabrasValidas.length > 0) return palabrasValidas[palabrasValidas.length - 1];
    return "producto";
}

function extractLocalPrice(text) {
    let match = text.match(/(\d+)\s*(€|euros?|eur)/i);
    if (match) return parseFloat(match[1]);
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length > 0) return parseFloat(numbers[numbers.length - 1]);
    return 0;
}

// =========================
// 🎯 CONSEJOS LOCALES VARIADOS
// =========================
const consejosLocales = {
    capricho: [
        (product, price, user) => `${user}, gastar ${price}€ en ${product} son aproximadamente ${Math.floor(price / 12)} horas de trabajo. ¿Realmente vale la pena trabajar tantas horas por esto?`,
        (product, price, user) => `¡Vaya caprichazo, ${user}! Un ${product} de ${price}€. La regla de las 48 horas: espera 2 días. Si aún lo quieres, cómpralo sin remordimientos.`,
        (product, price, user) => `${user}, con ${price}€ podrías hacer un curso online, un viaje de fin de semana o invertirlo. ¿Qué prefieres, ${product} o una experiencia inolvidable?`,
        (product, price, user) => `Los caprichos están bien si los eliges con conciencia. ${user}, pregúntate: ¿este ${product} te hará más feliz dentro de un mes o será un objeto olvidado?`,
        (product, price, user) => `💰 ${price}€ no es una broma. ${user}, antes de comprar ${product}, piensa si hay algo que realmente necesitas más o si puedes encontrar una opción más barata.`
    ],
    necesidad: [
        (product, price, user) => `¡Bien pensado, ${user}! Si necesitas ${product}, lo importante es comprar bien. ¿Has comparado precios en 2 o 3 sitios diferentes?`,
        (product, price, user) => `${user}, para algo necesario como ${product}, la clave es la calidad-precio. No siempre lo más caro es mejor. ¿Has mirado opiniones?`,
        (product, price, user) => `Necesidad detectada: ${product}. ${user}, ¿has considerado segunda mano? A veces encuentras cosas como nuevas por la mitad de precio.`,
        (product, price, user) => `${user}, ${price}€ en algo necesario está bien si es de calidad. Solo asegúrate de que realmente lo necesitas y no es un "quiero" disfrazado.`,
        (product, price, user) => `Me gusta tu enfoque, ${user}. Gastar en necesidades es inteligente. Solo recuerda: si puedes esperar a una oferta, mejor.`
    ]
};

function getLocalAdvice(product, price, needOrWant, user) {
    const lista = consejosLocales[needOrWant] || consejosLocales.capricho;
    return lista[Math.floor(Math.random() * lista.length)](product, price, user);
}

// =========================
// 🔄 BACKEND
// =========================
const BACKEND_URL = "https://hourcode.onrender.com";

async function extractFromText(text) {
    const localPrice = extractLocalPrice(text);
    const localProduct = detectarProducto(text);
    
    try {
        const res = await fetch(`${BACKEND_URL}/extract`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error("Backend error");
        const data = await res.json();
        if (data.price > 0 && data.object !== "desconocido") {
            return { product: data.object, price: data.price };
        }
        if (localPrice > 0) return { product: localProduct, price: localPrice };
        return { product: "producto", price: 0 };
    } catch (e) {
        if (localPrice > 0) return { product: localProduct, price: localPrice };
        return { product: "producto", price: 0 };
    }
}

async function getAdvice(product, price, needOrWant) {
    try {
        const userData = getUserData(state.user);
        const res = await fetch(`${BACKEND_URL}/advice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                product, price, needOrWant, 
                saved: userData.savedTotal,
                username: state.user,
                streak: userData.streak
            })
        });
        if (!res.ok) throw new Error("Backend error");
        const data = await res.json();
        userData.tipsCount++;
        updateUserData(state.user, { tipsCount: userData.tipsCount });
        updateStatsDisplay();
        return data.advice;
    } catch (e) {
        return getLocalAdvice(product, price, needOrWant, state.user);
    }
}

// =========================
// 🔄 FLUJO PRINCIPAL
// =========================
async function handleFlow(input) {
    const userData = getUserData(state.user);
    
    if (state.step === 'START') {
        const { product, price } = await extractFromText(input);
        
        if (price === 0) {
            await aiSpeak([`🤔 ${state.user}, no veo el precio. ¿Puedes decirme cuánto cuesta? Ejemplo: "un Ferrari cuesta 8000€"`]);
            return;
        }
        
        state.itemName = product;
        state.itemPrice = price;
        state.step = 'ASK_NEED';
        
        await aiSpeak([
            `✅ Entendido: ${product} por ${price}€.`,
            `Ahora cuéntame, ${state.user}...`,
            `¿Es algo que NECESITAS sí o sí (se te rompió, es imprescindible) o es más un CAPRICHO que te apetece?`
        ]);
    }
    
    else if (state.step === 'ASK_NEED') {
        const lower = input.toLowerCase();
        const esCapricho = lower.includes("capricho") || lower.includes("apetece") || lower.includes("gusta") || lower.includes("quiero") || lower.includes("deseo");
        const esNecesidad = lower.includes("necesito") || lower.includes("necesidad") || lower.includes("rompió") || lower.includes("obligatorio") || lower.includes("imprescindible");
        
        state.needOrWant = esNecesidad ? "necesidad" : "capricho";
        state.step = 'ADVICE';
        
        await aiSpeak(["🤔 Analizando..."]);
        const advice = await getAdvice(state.itemName, state.itemPrice, state.needOrWant);
        await aiSpeak([advice]);
        
        await aiSpeak([
            `💡 Si decides NO comprar ${state.itemName}, sumarás ${state.itemPrice}€ a tu ahorro.`,
            `¿Qué decides, ${state.user}? Responde "comprar" o "no comprar"`
        ]);
        state.step = 'DECISION';
    }
    
    else if (state.step === 'DECISION') {
        const lower = input.toLowerCase();
        
        if (lower.includes("no comprar") || lower.includes("no lo compro") || lower.includes("evitar") || lower.includes("ahorrar")) {
            userData.savedTotal += state.itemPrice;
            userData.avoidedCount++;
            const nuevoStreak = updateStreak();
            updateUserData(state.user, { savedTotal: userData.savedTotal, avoidedCount: userData.avoidedCount });
            updateStatsDisplay();
            addToHistory(state.itemName, state.itemPrice, "evitado");
            
            await aiSpeak([
                `🎉 ¡Excelente decisión, ${state.user}! Has evitado gastar ${state.itemPrice}€.`,
                `💰 Total ahorrado: ${userData.savedTotal}€`,
                `🔥 Llevas ${nuevoStreak} día${nuevoStreak !== 1 ? 's' : ''} reflexionando. ¡Qué disciplina!`,
                `¿Quieres analizar otro gasto? Escríbeme lo que estás pensando comprar.`
            ]);
        } else if (lower.includes("comprar") || lower.includes("lo compro") || lower.includes("si")) {
            addToHistory(state.itemName, state.itemPrice, "comprado");
            await aiSpeak([
                `👍 Vale, ${state.user}. Es tu decisión.`,
                `💡 Consejo: espera 24 horas antes de comprar. Si aún lo quieres, adelante sin culpa.`,
                `¿Quieres analizar otro gasto? Escríbeme lo que estás pensando comprar.`
            ]);
        } else {
            await aiSpeak([`${state.user}, no te he entendido. ¿Comprar o no comprar?`]);
            return;
        }
        state.step = 'START';
        state.lastItem = state.itemName;
    }
}

// =========================
// 🎯 ENVIAR MENSAJE
// =========================
async function sendMessage() {
    if (state.isTyping) return;
    if (!userInput.value.trim()) return;

    const message = userInput.value.trim();
    chat.style.display = "flex";
    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.innerText = message;
    chat.appendChild(userMsg);
    scrollToBottom();
    userInput.value = "";
    setInputEnabled(false);
    
    try {
        await handleFlow(message);
    } catch (error) {
        console.error(error);
        await aiSpeak(["😅 Ups, algo falló. Inténtalo de nuevo."]);
    }
    setInputEnabled(true);
}

// =========================
// 🍔 MENÚ (CON OCULTACIÓN CORRECTA)
// =========================
function initMenu() {
    const menuIcon = document.getElementById('menu-icon');
    const menuNav = document.getElementById('menu-nav');
    const menuItems = document.querySelectorAll('.menu-list li');
    const featureContents = document.querySelectorAll('.feature-content');
    const inputBoxEl = document.getElementById('input-box');
    
    if (menuIcon && menuNav) {
        menuIcon.addEventListener('click', () => {
            menuIcon.classList.toggle('active');
            menuNav.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!menuIcon.contains(e.target) && !menuNav.contains(e.target) && menuNav.classList.contains('open')) {
                menuIcon.classList.remove('active');
                menuNav.classList.remove('open');
            }
        });
    }
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const feature = item.dataset.feature;
            
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Ocultar TODOS los contenidos
            featureContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Mostrar SOLO el seleccionado
            const activeContent = document.getElementById(`${feature}-container`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
            
            // Ocultar input si no es chat
            if (inputBoxEl) {
                inputBoxEl.style.display = feature === 'chat' ? 'flex' : 'none';
            }
            
            // Actualizar displays si es necesario
            if (feature === 'history') updateHistoryDisplay();
            if (feature === 'stats') updateStatsDisplay();
            
            // Cerrar menú
            if (menuIcon && menuNav) {
                menuIcon.classList.remove('active');
                menuNav.classList.remove('open');
            }
        });
    });
}

// =========================
// 👤 LOGIN
// =========================
function initLogin() {
    loadUsers();
    
    const loginBtn = document.getElementById('login-btn');
    const usernameInput = document.getElementById('login-username');
    
    if (!loginBtn || !usernameInput) return;
    
    function doLogin() {
        const username = usernameInput.value.trim();
        if (!username) {
            alert("✨ Escribe un nombre para comenzar");
            return;
        }
        
        state.user = username;
        const userData = getUserData(username);
        
        loginOverlay.style.animation = 'fadeOutScale 0.3s ease forwards';
        setTimeout(() => {
            loginOverlay.style.display = 'none';
            appDiv.style.display = 'flex';
            updateStatsDisplay();
            updateHistoryDisplay();
            updateFloatingCounter();
            
            setTimeout(() => {
                aiSpeak([
                    `👋 ¡Hola ${username}! Soy GastoZero.`,
                    `Te ayudo a pensar antes de comprar.`,
                    userData.savedTotal > 0 ? `💰 Has ahorrado ${userData.savedTotal}€. ¡Qué bien!` : `📊 Empecemos a ahorrar juntos.`,
                    `Cuéntame, ¿qué quieres comprar y cuánto cuesta?`
                ]);
            }, 500);
        }, 300);
    }
    
    loginBtn.addEventListener('click', doLogin);
    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });
}

// Animación fadeOut
const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes fadeOutScale { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); visibility: hidden; } }`;
document.head.appendChild(styleSheet);

// =========================
// 🎯 INICIALIZAR
// =========================
document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initLogin();
    sendBtn.onclick = sendMessage;
    userInput.addEventListener("keypress", (e) => { if (e.key === "Enter" && !state.isTyping) { e.preventDefault(); sendMessage(); } });
    window.addEventListener('resize', () => setTimeout(scrollToBottom, 100));
});
