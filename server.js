import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 PON AQUÍ TU API KEY DE GEMINI
const GEMINI_API_KEY = "AIzaSyDOeMUQpzYAwDzGaeRMK5i-edM8opRvcrY";

// Ruta para extraer producto y precio
app.post("/extract", async (req, res) => {
    let { text } = req.body;
    
    console.log("📝 Texto recibido:", text);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Eres un EXTRACTOR DE PRODUCTOS Y PRECIOS en español. Tu ÚNICA función es analizar el texto y devolver EXCLUSIVAMENTE el producto y el precio.

FORMATO DE RESPUESTA OBLIGATORIO (exactamente así):
PRODUCTO: [nombre del producto en español]
PRECIO: [número]

REGLAS ABSOLUTAS:

1. CORRECCIÓN DE ORTOGRAFÍA Y SINÓNIMOS:
   - Perdona TODAS las faltas de ortografía ("cuestas" = cuesta, "carrro" = carro, "móvi" = móvil)
   - Reconoce sinónimos comunes en España:
     * "carro", "auto", "coche" = coche
     * "ordenata", "pc", "computadora" = ordenador
     * "móvi", "celu", "telefono" = móvil
     * "cascos" = auriculares
     * "portátil", "laptop" = ordenador portátil
     * "pantalla" = monitor
     * "zapatillas" = zapatillas deportivas
     * "lambo" = Lamborghini
     * "ferrari" = Ferrari
     * "porsche" = Porsche
     * "bugatti" = Bugatti

2. DETECCIÓN DE PRECIO:
   - Busca números seguidos de "€", "euros", "eur"
   - Si el precio está en palabras ("ochenta", "ciento veinte"), conviértelo a número
   - Si hay varios números, elige el que parece ser el precio principal (normalmente el más grande o el que está cerca del producto)
   - Si no hay precio, responde PRECIO: 0

3. DETECCIÓN DE PRODUCTO:
   - Identifica el objeto principal que se quiere comprar
   - Puede ser de 1 a 5 palabras (ej: "Lamborghini M1", "cascos gaming", "silla ergonómica")
   - Si hay varios objetos, elige el principal
   - Ignora verbos como "comprar", "quiero", "necesito"
   - Ignora nombres propios de personas, edades, ciudades, emociones

4. EJEMPLOS DE RESPUESTA CORRECTA:

Texto: "quiero comprar un lambo M1 que esta tope de guapo chaval que cuesta 8000 euros"
Respuesta:
PRODUCTO: Lamborghini M1
PRECIO: 8000

Texto: "unos cascos que cuestan 50 pavos"
Respuesta:
PRODUCTO: cascos
PRECIO: 50

Texto: "me quiero comprar una silla gaming por 150 euros"
Respuesta:
PRODUCTO: silla gaming
PRECIO: 150

Texto: "necesito un ordenata que cuesta 800"
Respuesta:
PRODUCTO: ordenador
PRECIO: 800

Texto: "hola me llamo Fer, quiero un Ferrari que cuesta 300 mil euros"
Respuesta:
PRODUCTO: Ferrari
PRECIO: 300000

5. SI NO HAY INFORMACIÓN SUFICIENTE:
   - Si no hay precio: PRECIO: 0
   - Si no hay producto claro: PRODUCTO: desconocido

TEXTO A ANALIZAR: "${text}"`
                    }]
                }],
                generationConfig: {
                    temperature: 0,
                    maxOutputTokens: 100
                }
            })
        });

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]) {
            console.error("Error respuesta Gemini:", data);
            return res.json({ object: "desconocido", price: 0 });
        }
        
        const respuesta = data.candidates[0].content.parts[0].text;
        console.log("📦 Respuesta Gemini:", respuesta);
        
        // Extraer producto y precio
        const productMatch = respuesta.match(/PRODUCTO:\s*(.+)/i);
        const priceMatch = respuesta.match(/PRECIO:\s*(\d+)/i);
        
        let producto = productMatch ? productMatch[1].trim().toLowerCase() : "desconocido";
        const precio = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        // Limpiar producto
        producto = producto.replace(/[^\w\sáéíóúñ]/g, "").trim();
        
        console.log("🧠 Extraído final:", { producto, precio });
        res.json({ object: producto, price: precio });

    } catch (err) {
        console.error("Error Gemini:", err);
        res.json({ object: "desconocido", price: 0 });
    }
});

// Ruta para el consejo - PROMPT DE TESIS DOCTORAL MEJORADO
app.post("/advice", async (req, res) => {
    const { product, price, needOrWant, saved, username, streak } = req.body;
    
    const prompt = `Eres "GastoZero", un asesor financiero personal con un enfoque humanista y psicológico. Tu misión es ayudar a las personas a tomar decisiones de compra más conscientes.

DATOS DEL USUARIO:
- Nombre: ${username || "usuario"}
- Producto: ${product}
- Precio: ${price}€
- Tipo de gasto: ${needOrWant === "necesidad" ? "NECESIDAD REAL" : "CAPRICHO/DESEO"}
- Dinero ahorrado hasta ahora: ${saved || 0}€
- Racha de reflexión: ${streak || 0} días

INSTRUCCIONES PARA TU RESPUESTA (SIGUE ESTAS REGLAS AL PIE DE LA LETRA):

1. TONO Y ESTILO:
   - Sé cálido, cercano y empático. Usa el nombre del usuario.
   - Habla como un amigo sabio, no como un juez.
   - Usa emojis con moderación (máximo 1 o 2 por mensaje).

2. SI ES UN CAPRICHO:
   - Calcula: ${price}€ son aproximadamente ${Math.floor(price / 12)} horas de trabajo (basado en salario medio de 12€/h)
   - Pregunta si realmente vale la pena trabajar tantas horas por esto
   - Menciona la regla de las 48 horas: esperar 2 días antes de comprar
   - Habla del "costo de oportunidad": qué otra cosa podría hacer con ese dinero (un viaje, un curso, invertir)

3. SI ES UNA NECESIDAD:
   - Felicítale por ser responsable
   - Sugiere comparar precios en 2-3 sitios diferentes
   - Pregunta si ha considerado segunda mano o alternativas más económicas
   - Recomienda buscar opiniones antes de comprar

4. VARIEDAD OBLIGATORIA:
   - NO USES LAS MISMAS FRASES SIEMPRE
   - Cada consejo debe ser ÚNICO y adaptado al contexto
   - Si ya ha ahorrado dinero, menciónalo como motivación

5. ESTRUCTURA DE LA RESPUESTA:
   - Empieza con el nombre del usuario
   - Da el consejo principal (2-3 líneas)
   - Termina con una pregunta que invite a reflexionar

EJEMPLOS DE BUENAS RESPUESTAS (NO COPIAR LITERALMENTE, INSPIRARTE):
- "Fer, gastar 8000€ en un Lamborghini son más de 600 horas de trabajo. ¿Vale la pena trabajar tantas horas por un coche que apenas usarás? Piensa en lo que podrías hacer con ese dinero: un viaje increíble, invertir en tu futuro... ¿qué prefieres?"
- "Ana, 150€ en unas zapatillas que necesitas está bien. Pero antes de comprar, ¿has mirado en tiendas de segunda mano? A veces encuentras joyas casi nuevas por la mitad."
- "Carlos, veo que ya has ahorrado 500€. ¡Qué bien! Para ese capricho de 200€ que te apetece, la regla de las 48 horas funciona: espera 2 días y si aún lo quieres, cómpralo sin culpa. ¿Crees que después de 2 días seguirás queriéndolo igual?"
- "Lucía, un ordenador de 800€ es una inversión si lo necesitas para trabajar. Solo asegúrate de comparar precios en 3 sitios diferentes. ¿Has mirado ofertas o reacondicionados?"

RESPONDE AHORA CON UN CONSEJO PERSONALIZADO PARA ${username?.toUpperCase() || "EL USUARIO"}:`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 200
                }
            })
        });

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]) {
            console.error("Error consejo Gemini:", data);
            return res.json({ advice: `💭 ${username}, piensa bien si realmente necesitas ${product}. A veces lo mejor que puedes comprar es tiempo para pensar.` });
        }
        
        const advice = data.candidates[0].content.parts[0].text;
        
        // Verificar que el consejo no sea undefined o vacío
        if (!advice || advice.includes("undefined")) {
            throw new Error("Consejo inválido");
        }
        
        console.log("💡 Consejo generado:", advice);
        res.json({ advice });

    } catch (err) {
        console.error("Error consejo:", err);
        res.json({ advice: `🤔 ${username}, antes de decidir, pregúntate: ¿este gasto te hará más feliz dentro de un mes? A veces la respuesta no es la que esperamos.` });
    }
});

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "GastoZero API funcionando con Gemini v2" });
});

app.listen(3000, () => {
    console.log("🚀 Servidor con Gemini corriendo en http://localhost:3000");
    console.log("📡 Endpoints: /extract, /advice");
});
