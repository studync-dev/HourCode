
const BACKEND_URL = "https://hourcode.onrender.com";
/**
 * CORE v24 - Con estrellas suaves y scrolls elegantes
 */

let state = {
    step: 'START',
    itemName: '',
    itemPrice: 0,
    hourlyWage: 0,
    savings: 0,
    lastDecision: '',
    isTyping: false
};

const chat = document.getElementById("chat-container");
const inputBox = document.getElementById("input-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// =========================
// 🌌 ESTRELLAS SUAVES Y DINÁMICAS (SIN MOVIMIENTO BRUSCO)
// =========================
function createStars() {
    const container = document.getElementById("stars");
    const count = 250;
    
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
        
        const opacityBase = Math.random() * 0.6 + 0.2;
        star.style.opacity = opacityBase;
        
        const duration = Math.random() * 3 + 2;
        star.style.animationDuration = duration + "s";
        
        star.style.animationDelay = Math.random() * 5 + "s";
        
        if (size > 2.5) {
            star.classList.add("big");
        } else if (size > 1.5) {
            star.classList.add("medium");
        } else {
            star.classList.add("small");
        }
        
        if (Math.random() < 0.08) {
            star.classList.add("colored");
        }
        
        container.appendChild(star);
    }
}

function createShootingStar() {
    const container = document.getElementById("stars");
    if (!container) return;
    
    const star = document.createElement("div");
    star.className = "shooting-star";
    
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * (window.innerHeight / 3);
    
    star.style.left = startX + "px";
    star.style.top = startY + "px";
    
    container.appendChild(star);
    
    setTimeout(() => {
        if (star && star.remove) star.remove();
    }, 2000);
}

function initStars() {
    createStars();
    
    // Estrellas fugaces más espaciadas y suaves
    setInterval(() => {
        if (Math.random() < 0.3) {
            createShootingStar();
        }
    }, 10000);
    
    // Pequeño efecto de "respiración" en algunas estrellas (sutil)
    setInterval(() => {
        const stars = document.querySelectorAll('.star');
        const randomStar = stars[Math.floor(Math.random() * stars.length)];
        if (randomStar) {
            randomStar.style.animation = 'none';
            setTimeout(() => {
                if (randomStar) randomStar.style.animation = '';
            }, 50);
        }
    }, 8000);
}

initStars();

// =========================
// 🔒 BLOQUEAR/DESBLOQUEAR INPUT
// =========================
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

function scrollToBottom() {
    if (chat) chat.scrollTop = chat.scrollHeight;
}

function getPrice(text) {
    const match = text.match(/(\d+[.,]?\d*)\s*(€|euros?)/i);
    return match ? parseFloat(match[1].replace(',', '.')) : null;
}

async function getObjectAI(text) {
    const productosValidos = ["ordenador", "portátil", "servidor", "silla", "torre", "iphone", "teclado", "ratón", "monitor", "móvil", "tablet", "auriculares", "altavoz", "consola", "ps5", "xbox", "silla gaming", "silla ergonómica", "servidor multiusos", "torre gaming", "pc gaming"];

    const textoLower = text.toLowerCase();
    for (let producto of productosValidos) {
        if (textoLower.includes(producto)) return producto;
    }

    const comprarMatch = text.match(/comprar\s+(?:un|una|el|la)?\s*([a-záéíóúñ]+)/i);
    if (comprarMatch && comprarMatch[1]) {
        let producto = comprarMatch[1].toLowerCase();
        const basura = ["loq", "ue", "pasa", "que", "es", "caro", "cuesta", "y"];
        if (!basura.includes(producto) && producto.length > 2) return producto;
    }

    const precioMatch = text.match(/(\d+)\s*(?:€|euros?)/i);
    if (precioMatch) {
        const antesDelPrecio = text.substring(0, precioMatch.index).trim();
        const palabras = antesDelPrecio.split(/\s+/);
        for (let i = palabras.length - 1; i >= 0; i--) {
            const palabra = palabras[i].toLowerCase().replace(/[^a-záéíóúñ]/g, "");
            const basura = ["loq", "ue", "pasa", "que", "es", "caro", "cuesta", "y", "un", "una", "el", "la", "comprar", "quiero"];
            if (!basura.includes(palabra) && palabra.length > 2) return palabra;
        }
    }

    try {
        const res = await fetch(`${BACKEND_URL}/extract`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        return data.object || "algo";
    } catch (e) {
        return "algo";
    }
}

async function getEconomicAdvice() {
    try {
        const res = await fetch(`${BACKEND_URL}/advice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product: state.itemName,
                price: state.itemPrice,
                hourlyWage: state.hourlyWage,
                savings: state.savings,
                decision: state.lastDecision
            })
        });
        const data = await res.json();
        return data.advice;
    } catch (e) {
        return "El dinero es tiempo. Cada euro que gastas son minutos de tu vida. ¿Realmente vale la pena?";
    }
}

function analyzeFinance() {
    const remaining = Math.max(0, state.itemPrice - state.savings);
    const totalHours = state.itemPrice / state.hourlyWage;
    const remainingHours = remaining / state.hourlyWage;
    return { remaining, totalHours: totalHours.toFixed(1), remainingHours: remainingHours.toFixed(1) };
}

function thought() {
    const arr = [
        "No estás comprando un objeto… estás comprando una sensación.",
        "Tu yo del futuro está pagando esto.",
        "Cada compra construye tu estilo de vida.",
        "No es dinero… es tiempo transformado.",
        "El problema no es el precio, es el hábito."
    ];
    return arr[Math.floor(Math.random() * arr.length)];
}

function reality() {
    const arr = [
        "La emoción de comprar dura menos que el esfuerzo de pagarlo.",
        "El dinero gastado hoy elimina opciones futuras.",
        "La mayoría de decisiones financieras son impulsivas.",
        "No es una compra… es un patrón.",
        "El autocontrol financiero es raro."
    ];
    return arr[Math.floor(Math.random() * arr.length)];
}

async function aiSpeak(messages) {
    for (let msg of messages) {
        if (!msg || msg === "") continue;
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

async function handleFlow(input) {
    if (state.step === "START") {
        const price = getPrice(input);
        
        if (!price && input.toLowerCase().includes("no")) {
            await aiSpeak(["Entiendo. Recuerda que cada decisión financiera construye tu futuro.", "Cuando quieras analizar otra compra, solo escríbeme el producto y el precio. 😊"]);
            return;
        }
        
        if (!price) {
            await aiSpeak(["No veo un precio claro.", "Ejemplo: portátil por 800€"]);
            return;
        }

        const object = await getObjectAI(input);
        let nombreMostrar = object.toUpperCase();
        if (nombreMostrar === "ALGO" || nombreMostrar.length < 2) nombreMostrar = "PRODUCTO";

        state.itemName = nombreMostrar;
        state.itemPrice = price;
        state.step = "WAGE";

        await aiSpeak([`Estás pensando en ${state.itemName} (${price}€).`, "¿Cuánto ganas por hora y cuánto tienes ahorrado?"]);
    }
    else if (state.step === "WAGE") {
        const nums = input.match(/\d+/g);
        if (!nums) {
            await aiSpeak(["No entiendo tus números. Ejemplo: gano 10 euros la hora y tengo 200 ahorrados"]);
            return;
        }

        state.hourlyWage = parseFloat(nums[0]);
        state.savings = nums[1] ? parseFloat(nums[1]) : 0;
        const f = analyzeFinance();
        state.step = "DECISION";

        await aiSpeak([`Esto son ${f.totalHours} horas de tu vida.`, `Te faltan ${f.remaining}€ → ${f.remainingHours} horas.`, thought(), "¿Lo compras? (responde sí o no)"]);
    }
    else if (state.step === "DECISION") {
        const decision = input.toLowerCase();
        
        if (decision.includes("no")) {
            state.lastDecision = "no";
            await aiSpeak(["Has decidido no hacerlo.", reality()]);
        } else if (decision.includes("si") || decision.includes("sí") || decision.includes("compro") || decision.includes("vale")) {
            state.lastDecision = "si";
            await aiSpeak(["Vas a comprarlo.", reality(), "Has cambiado tiempo por algo temporal."]);
        } else {
            await aiSpeak(["No te he entendido. ¿Lo compras? Responde sí o no"]);
            return;
        }

        await aiSpeak(["🧠 Deja que reflexione un momento..."]);
        const advice = await getEconomicAdvice();
        await aiSpeak(["💡 Reflexión económica:", advice, "", "¿Quieres analizar otra compra? Escríbeme el producto y el precio."]);
        state.step = "START";
    }
}

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
        await aiSpeak(["Ha ocurrido un error. Inténtalo de nuevo."]);
    }
    setInputEnabled(true);
}

// =========================
// ⏱️ CALCULADORA DE OPORTUNIDAD
// =========================
const oportunidades = [
    { name: "🎓 un curso online profesional", price: 200 },
    { name: "✈️ un viaje de fin de semana", price: 300 },
    { name: "📚 20 libros nuevos", price: 150 },
    { name: "🍽️ 40 cenas en restaurante", price: 100 },
    { name: "💪 un año de gimnasio", price: 250 },
    { name: "🎵 ir a 5 conciertos", price: 225 },
    { name: "🧘 30 sesiones de yoga", price: 175 },
    { name: "📱 un móvil nuevo", price: 400 },
    { name: "🎮 una consola + 5 juegos", price: 450 },
    { name: "🏊 clases de natación 6 meses", price: 275 }
];

function calculateOpportunity() {
    const amount = parseFloat(document.getElementById('opportunity-amount')?.value);
    const wage = parseFloat(document.getElementById('opportunity-wage')?.value);
    const resultDiv = document.getElementById('opportunity-result');
    
    if (!amount || !wage || amount <= 0 || wage <= 0) {
        if (resultDiv) resultDiv.innerHTML = '<p style="color: #ff6b6b;">❌ Por favor, introduce cantidades válidas</p>';
        return;
    }
    
    const hours = (amount / wage).toFixed(1);
    const days = (hours / 8).toFixed(1);
    const weeks = (hours / 40).toFixed(1);
    
    const alternativas = oportunidades.filter(opp => opp.price <= amount).sort((a, b) => b.price - a.price).slice(0, 3);
    
    let html = `
        <div style="margin-bottom: 20px; background: rgba(78,205,196,0.15); padding: 15px; border-radius: 12px;">
            <strong style="font-size: 1.2rem;">⏱️ ${amount}€ = ${hours} horas de trabajo</strong><br>
            <span style="opacity: 0.8;">≈ ${days} días laborables | ${weeks} semanas</span>
        </div>
        <div style="margin-bottom: 20px;">
            <strong>💡 En ${hours} horas PODRÍAS:</strong><br>
            • Aprender lo básico de un idioma nuevo<br>
            • Hacer ${Math.floor(hours / 10)} cursos online<br>
            • Leer ${Math.floor(hours / 8)} libros<br>
            • Empezar un proyecto personal<br>
        </div>
    `;
    
    if (alternativas.length > 0) {
        html += `<div><strong>💰 En lugar de gastar, podrías comprar:</strong><br>`;
        alternativas.forEach(alt => {
            const porcentaje = (alt.price / amount * 100).toFixed(0);
            html += `• ${alt.name} (${alt.price}€ - ${porcentaje}% de tu presupuesto)<br>`;
        });
        html += `</div>`;
    }
    
    html += `<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
        <strong>🤔 Reflexión:</strong> ¿Realmente este gasto vale más que ${Math.floor(hours)} horas de tu vida?
    </div>`;
    
    if (resultDiv) resultDiv.innerHTML = html;
}

// =========================
// 📅 RETOS CONVERSACIONALES
// =========================
let challengeState = { 
    step: 'awaiting_expense',
    streak: parseInt(localStorage.getItem('financial_streak')) || 0, 
    lastDate: localStorage.getItem('last_challenge_date')
};

function updateStreakDisplay() {
    const streakEl = document.getElementById('challenge-streak');
    if (streakEl) streakEl.innerHTML = `🔥 Racha: ${challengeState.streak} días`;
}

function addChallengeMessage(text, isUser = false) {
    const chatContainer = document.getElementById('challenge-chat');
    if (!chatContainer) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `challenge-message ${isUser ? 'user' : 'bot'}`;
    msgDiv.innerText = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function analyzeExpense(expense) {
    const expenseLower = expense.toLowerCase();
    
    const patterns = [
        { pattern: /café|starbucks|dunkin/i, suggestion: "Los cafés diarios pueden sumar más de 300€ al año. ¿Podrías prepararlo en casa?" },
        { pattern: /delivery|uber eats|glovo|just eat/i, suggestion: "Pedir comida a domicilio cuesta 2-3 veces más que cocinar. ¡Aprender a cocinar es invertir en salud y bolsillo!" },
        { pattern: /ropa|zapatos|camiseta|pantalón/i, suggestion: "¿Realmente necesitas esta prenda o es un impulso? Espera 24 horas antes de comprar." },
        { pattern: /suscrib|netflix|spotify|prime|disney/i, suggestion: "Revisa tus suscripciones mensuales. ¿Usas todas? A veces pagamos sin darnos cuenta." },
        { pattern: /chicle|caramelo|golosina/i, suggestion: "Los pequeños gastos se acumulan. Ese pequeño gasto de 1€ son 365€ al año si lo compras a diario. ¡Ojo con los gastos hormiga!" },
        { pattern: /videojuego|juego|steam/i, suggestion: "Los juegos suelen estar en oferta meses después. ¿Puedes esperar a que bajen de precio?" },
        { pattern: /comida rápida|burger|kfc|mcdonald/i, suggestion: "Comer fuera seguido impacta tu salud y bolsillo. Cocinar en casa ahorra dinero y es más sano." }
    ];
    
    for (let p of patterns) {
        if (p.pattern.test(expenseLower)) {
            return p.suggestion;
        }
    }
    
    const reflexiones = [
        "Cada pequeño gasto suma. Si ahorraras esto cada día, en un año tendrías un buen colchón.",
        "Pregúntate: ¿este gasto me aporta valor a largo plazo o es solo un placer momentáneo?",
        "Un truco: antes de gastar, espera 24 horas. La mayoría de los impulsos pasan.",
        "El dinero gastado hoy elimina opciones para mañana. ¿Prefieres esto o acercarte a tu gran meta?"
    ];
    
    return reflexiones[Math.floor(Math.random() * reflexiones.length)];
}

async function processChallengeResponse(response) {
    if (challengeState.step === 'awaiting_expense') {
        challengeState.lastExpense = response;
        addChallengeMessage(`Gracias por compartirlo. Gastaste en: "${response}"`);
        
        await new Promise(r => setTimeout(r, 800));
        
        const analysis = analyzeExpense(response);
        addChallengeMessage(`🔍 ${analysis}`);
        
        await new Promise(r => setTimeout(r, 500));
        
        addChallengeMessage("¿Qué opinas? ¿Crees que podrías reducir este tipo de gastos?");
        challengeState.step = 'awaiting_reflection';
        
    } else if (challengeState.step === 'awaiting_reflection') {
        addChallengeMessage(`Gracias por reflexionar. ${response}`);
        
        await new Promise(r => setTimeout(r, 500));
        
        const today = new Date().toDateString();
        if (challengeState.lastDate !== today) {
            challengeState.streak++;
            localStorage.setItem('financial_streak', challengeState.streak);
            localStorage.setItem('last_challenge_date', today);
            updateStreakDisplay();
            addChallengeMessage(`🎉 ¡Bien hecho! Llevas ${challengeState.streak} días seguidos reflexionando sobre tus finanzas.`);
        }
        
        await new Promise(r => setTimeout(r, 500));
        
        addChallengeMessage("💪 Sigue así. Cada pequeño cambio suma. Mañana te haré otra pregunta para seguir mejorando juntos.");
        
        challengeState.step = 'awaiting_expense';
    }
}

function sendChallengeMessage() {
    const input = document.getElementById('challenge-input');
    const message = input?.value.trim();
    if (!message) return;
    
    addChallengeMessage(message, true);
    input.value = '';
    processChallengeResponse(message);
}

// =========================
// 🍔 MENÚ HAMBURGUESA
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
            featureContents.forEach(content => content.classList.remove('active'));
            const activeContent = document.getElementById(`${feature}-container`);
            if (activeContent) activeContent.classList.add('active');
            if (inputBoxEl) inputBoxEl.style.display = feature === 'chat' ? 'flex' : 'none';
            if (menuIcon && menuNav) {
                menuIcon.classList.remove('active');
                menuNav.classList.remove('open');
            }
        });
    });
}

// =========================
// 🎯 INICIALIZAR
// =========================
document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    updateStreakDisplay();
    
    const calcBtn = document.getElementById('calculate-opportunity');
    if (calcBtn) calcBtn.addEventListener('click', calculateOpportunity);
    
    const challengeSend = document.getElementById('challenge-send');
    const challengeInput = document.getElementById('challenge-input');
    if (challengeSend) challengeSend.addEventListener('click', sendChallengeMessage);
    if (challengeInput) challengeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChallengeMessage(); });
    
    sendBtn.onclick = sendMessage;
    userInput.addEventListener("keypress", (e) => { if (e.key === "Enter" && !state.isTyping) { e.preventDefault(); sendMessage(); } });
    setInputEnabled(true);
});
