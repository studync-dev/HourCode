/**
 * GastoZero - Asistente anti-gastos innecesarios
 */

let state = {
    step: 'START',
    itemName: '',
    itemPrice: 0,
    needOrWant: '',
    savedTotal: parseInt(localStorage.getItem('savedMoney')) || 0,
    lastDecisions: JSON.parse(localStorage.getItem('lastDecisions')) || []
};

const chat = document.getElementById("chat-container");
const inputBox = document.getElementById("input-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// =========================
// 🌌 ESTRELLAS (igual que antes)
// =========================
function createStars() {
    const container = document.getElementById("stars");
    const count = 200;
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const star = document.createElement("div");
        star.className = "star";
        const size = Math.random() * 3 + 1;
        star.style.width = size + "px";
        star.style.height = size + "px";
        star.style.top = Math.random() * 100 + "%";
        star.style.left = Math.random() * 100 + "%";
        star.style.opacity = Math.random() * 0.7 + 0.3;
        star.style.animationDuration = (Math.random() * 3 + 2) + "s";
        star.style.animationDelay = (Math.random() * 3) + "s";
        if (size > 2.5) star.classList.add("big");
        else if (size > 1.5) star.classList.add("medium");
        else star.classList.add("small");
        if (Math.random() < 0.1) star.classList.add("colored");
        container.appendChild(star);
    }
}

function createShootingStar() {
    const container = document.getElementById("stars");
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
    setInterval(() => { if (Math.random() < 0.3) createShootingStar(); }, 10000);
}
initStars();

// =========================
// 🔧 UTILIDADES
// =========================
function scrollToBottom() { if (chat) chat.scrollTop = chat.scrollHeight; }
function setInputEnabled(enabled) {
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

function updateSavedCounter() {
    const counterEl = document.getElementById('saved-counter');
    if (counterEl) counterEl.innerHTML = `💰 Ahorro total: ${state.savedTotal}€`;
    localStorage.setItem('savedMoney', state.savedTotal);
}

function addToHistory(item, price, decision) {
    state.lastDecisions.unshift({ item, price, decision, date: new Date().toLocaleDateString() });
    if (state.lastDecisions.length > 10) state.lastDecisions.pop();
    localStorage.setItem('lastDecisions', JSON.stringify(state.lastDecisions));
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
// 🤖 LLAMADA A GEMINI
// =========================
async function extractFromText(text) {
    try {
        const res = await fetch("http://localhost:3000/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        return { product: data.object, price: data.price };
    } catch (e) {
        return { product: "algo", price: 0 };
    }
}

async function getAdvice(product, price, needOrWant, saved) {
    try {
        const res = await fetch("http://localhost:3000/advice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product, price, needOrWant, saved })
        });
        const data = await res.json();
        return data.advice;
    } catch (e) {
        return "¿Realmente necesitas esto? Espera 24 horas antes de decidir. 💭";
    }
}

// =========================
// 🔄 FLUJO PRINCIPAL
// =========================
async function handleFlow(input) {
    
    // PASO 1: Extraer producto y precio
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
            `¿Es algo que necesitas sí o sí (por ejemplo, se te rompió) o es más un capricho que te apetece?`
        ]);
    }
    
    // PASO 2: Preguntar necesidad vs capricho
    else if (state.step === 'ASK_NEED') {
        const lower = input.toLowerCase();
        if (lower.includes("necesito") || lower.includes("necesidad") || lower.includes("se me rompió") || lower.includes("sí o sí")) {
            state.needOrWant = "necesidad";
        } else {
            state.needOrWant = "capricho";
        }
        state.step = 'ASK_SAVINGS';
        
        await aiSpeak([
            `Entiendo. Es un ${state.needOrWant === "necesidad" ? "gasto necesario" : "capricho"}.`,
            `¿Ya tienes el dinero ahorrado para esto o tendrías que sacarlo de otro lado?`
        ]);
    }
    
    // PASO 3: Preguntar si tiene ahorrado
    else if (state.step === 'ASK_SAVINGS') {
        state.step = 'ADVICE';
        
        // Obtener consejo de Gemini
        await aiSpeak(["🤔 Déjame pensar un momento..."]);
        const advice = await getAdvice(state.itemName, state.itemPrice, state.needOrWant, state.savedTotal);
        
        await aiSpeak([advice]);
        
        await aiSpeak([
            `Si decides NO comprarlo, sumarás ${state.itemPrice}€ a tu contador de "gastos evitados".`,
            `¿Qué decides? (responde "comprar" o "no comprar")`
        ]);
        
        state.step = 'DECISION';
    }
    
    // PASO 4: Decisión final
    else if (state.step === 'DECISION') {
        const lower = input.toLowerCase();
        
        if (lower.includes("no comprar") || lower.includes("no lo compro") || lower.includes("evitar")) {
            // Ahorrar el dinero
            state.savedTotal += state.itemPrice;
            updateSavedCounter();
            addToHistory(state.itemName, state.itemPrice, "evitado");
            
            await aiSpeak([
                `🎉 ¡Bien hecho! Has evitado gastar ${state.itemPrice}€.`,
                `💰 Total ahorrado hasta ahora: ${state.savedTotal}€`,
                `¿Quieres analizar otro gasto? Escríbeme lo que estás pensando comprar.`
            ]);
        } else if (lower.includes("comprar") || lower.includes("lo compro") || lower.includes("si")) {
            addToHistory(state.itemName, state.itemPrice, "comprado");
            
            await aiSpeak([
                `👍 Está bien. Es tu decisión.`,
                `💡 Consejo: Antes de comprar, espera 24 horas. Si sigues queriéndolo, adelante.`,
                `¿Quieres analizar otro gasto? Escríbeme lo que estás pensando comprar.`
            ]);
        } else {
            await aiSpeak(["No te he entendido. ¿Comprar o no comprar?"]);
            return;
        }
        
        // Resetear para el siguiente análisis
        state.step = 'START';
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
        await aiSpeak(["Ha ocurrido un error. Inténtalo de nuevo."]);
    }
    setInputEnabled(true);
}

// =========================
// 🍔 MENÚ Y CONTADOR
// =========================
function initMenu() {
    const menuIcon = document.getElementById('menu-icon');
    const menuNav = document.getElementById('menu-nav');
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
}

function init() {
    initMenu();
    updateSavedCounter();
    
    // Añadir contador visible
    const appDiv = document.getElementById('app');
    const counterDiv = document.createElement('div');
    counterDiv.id = 'saved-counter';
    counterDiv.className = 'saved-counter';
    counterDiv.innerHTML = `💰 Ahorro total: ${state.savedTotal}€`;
    appDiv.insertBefore(counterDiv, appDiv.firstChild);
    
    sendBtn.onclick = sendMessage;
    userInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
    setInputEnabled(true);
    
    // Mensaje de bienvenida
    setTimeout(() => {
        aiSpeak(["👋 ¡Hola! Soy GastoZero. Te ayudo a pensar antes de comprar.", "Cuéntame, ¿qué estás pensando comprar y cuánto cuesta?"]);
    }, 500);
}

document.addEventListener('DOMContentLoaded', init);
