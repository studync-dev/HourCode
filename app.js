/**
 * GastoZero v3 - Con login funcional y estrellas mejoradas
 */

let state = {
    step: 'START',
    itemName: '',
    itemPrice: 0,
    needOrWant: '',
    user: null,
    isTyping: false
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
// 🌌 ESTRELLAS DIFERENTES Y BONITAS
// =========================
function createStars() {
    const container = document.getElementById("stars-layer");
    if (!container) return;
    container.innerHTML = '';
    
    // Estrellas normales (más cantidad)
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
    
    // Estrellas brillantes (menos cantidad, más brillo)
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

// Estrellas fugaces más elegantes
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
    }
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
// 🤖 LLAMADA AL BACKEND (Gemini)
// =========================
async function extractFromText(text) {
    try {
        const res = await fetch("https://hourcode.onrender.com/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        return { product: data.object, price: data.price };
    } catch (e) {
        console.error("Error backend:", e);
        return { product: "algo", price: 0 };
    }
}

async function getAdvice(product, price, needOrWant) {
    try {
        const userData = getUserData(state.user);
        const res = await fetch("https://hourcode.onrender.com/advice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                product, 
                price, 
                needOrWant, 
                saved: userData.savedTotal 
            })
        });
        const data = await res.json();
        
        userData.tipsCount++;
        updateUserData(state.user, { tipsCount: userData.tipsCount });
        updateStatsDisplay();
        
        return data.advice;
    } catch (e) {
        return "¿Realmente necesitas esto? Espera 24 horas antes de decidir. 💭";
    }
}

// =========================
// 🔄 FLUJO PRINCIPAL
// =========================
async function handleFlow(input) {
    
    if (state.step === 'START') {
        const { product, price } = await extractFromText(input);
        
        if (price === 0) {
            await aiSpeak(["No veo un precio claro. Ejemplo: 'unos cascos que cuestan 50€'"]);
            return;
        }
        
        state.itemName = product;
        state.itemPrice = price;
        state.step = 'ASK_NEED';
        
        await aiSpeak([
            `✅ Entendido: ${product} por ${price}€.`,
            `Antes de decidir, dime una cosa...`,
            `¿Es algo que necesitas sí o sí (ej: se te rompió) o es más un capricho que te apetece?`
        ]);
    }
    
    else if (state.step === 'ASK_NEED') {
        const lower = input.toLowerCase();
        if (lower.includes("necesito") || lower.includes("necesidad") || lower.includes("se me rompió") || lower.includes("sí o sí") || lower.includes("si o si")) {
            state.needOrWant = "necesidad";
        } else {
            state.needOrWant = "capricho";
        }
        state.step = 'ADVICE';
        
        await aiSpeak(["🤔 Déjame pensar un momento..."]);
        const advice = await getAdvice(state.itemName, state.itemPrice, state.needOrWant);
        
        await aiSpeak([advice]);
        
        await aiSpeak([
            `Si decides NO comprarlo, sumarás ${state.itemPrice}€ a tu ahorro total.`,
            `¿Qué decides? (responde "comprar" o "no comprar")`
        ]);
        
        state.step = 'DECISION';
    }
    
    else if (state.step === 'DECISION') {
        const lower = input.toLowerCase();
        const userData = getUserData(state.user);
        
        if (lower.includes("no comprar") || lower.includes("no lo compro") || lower.includes("evitar") || lower.includes("no compro")) {
            userData.savedTotal += state.itemPrice;
            userData.avoidedCount++;
            updateUserData(state.user, { 
                savedTotal: userData.savedTotal, 
                avoidedCount: userData.avoidedCount 
            });
            updateStatsDisplay();
            addToHistory(state.itemName, state.itemPrice, "evitado");
            updateStreak();
            
            await aiSpeak([
                `🎉 ¡Bien hecho! Has evitado gastar ${state.itemPrice}€.`,
                `💰 Total ahorrado: ${userData.savedTotal}€`,
                `🔥 Racha: ${userData.streak} días seguidos`,
                `¿Quieres analizar otro gasto? Escríbeme lo que estás pensando comprar.`
            ]);
        } else if (lower.includes("comprar") || lower.includes("lo compro") || lower.includes("si") || lower.includes("compro")) {
            addToHistory
