import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 PON AQUÍ TU API KEY DE GEMINI
const GEMINI_API_KEY = "TU_API_KEY_AQUI";

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
                        text: `Eres un EXTRACTOR DE PRODUCTOS Y PRECIOS en español. Tu ÚNICA función es analizar el texto y devolver EXCLUSIVAMENTE el producto y el precio en el formato exacto que se te indica.

FORMATO DE RESPUESTA OBLIGATORIO:
PRODUCTO: [nombre del producto en español, entre 1 y 4 palabras]
PRECIO: [número entero o decimal]

REGLAS ABSOLUTAS:
1. Perdona TODAS las faltas de ortografía (cuestas = cuesta, carro = coche, ordenata = ordenador)
2. Reconoce sinónimos comunes en España:
   - "carro", "auto" = coche
   - "móvi", "celular" = móvil
   - "cascos" = auriculares
   - "portátil", "laptop" = ordenador portátil
   - "pantalla" = monitor
3. Si el precio está en palabras (ochenta, ciento veinte), conviértelo a número
4. Si hay múltiples números, elige el que parece ser el precio del producto principal
5. Si NO hay un precio claro, responde PRECIO: 0
6. Si NO hay un producto claro, responde PRODUCTO: desconocido
7. IGNORA completamente: nombres propios, edades, ciudades, emociones, historias personales

Texto a analizar: "${text}"`
                    }]
                }],
                generationConfig: {
                    temperature: 0,
                    maxOutputTokens: 80
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
        
        const productMatch = respuesta.match(/PRODUCTO:\s*(.+)/i);
        const priceMatch = respuesta.match(/PRECIO:\s*(\d+)/i);
        
        let producto = productMatch ? productMatch[1].trim().toLowerCase() : "desconocido";
        const precio = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        producto = producto.replace(/[^\w\sáéíóúñ]/g, "").trim();
        
        console.log("🧠 Extraído:", { producto, precio });
        res.json({ object: producto, price: precio });

    } catch (err) {
        console.error("Error Gemini:", err);
        res.json({ object: "desconocido", price: 0 });
    }
});

// Ruta para el consejo - PROMPT DE TESIS DOCTORAL
app.post("/advice", async (req, res) => {
    const { product, price, needOrWant, saved, username, streak } = req.body;
    
    const prompt = `Eres "GastoZero", un asesor financiero personal con un enfoque humanista y psicológico. Tu misión es ayudar a las personas a tomar decisiones de compra más conscientes, basadas en el valor real del dinero y el tiempo.

CONTEXTO DEL USUARIO:
- Nombre: ${username || "usuario"}
- Producto que quiere comprar: ${product}
- Precio: ${price}€
- Naturaleza del gasto: ${needOrWant === "necesidad" ? "NECESIDAD REAL (algo que se rompió o es imprescindible)" : "CAPRICHO/DESEO (algo que le apetece pero no necesita)"}
- Dinero ahorrado hasta ahora: ${saved || 0}€
- Racha de reflexión: ${streak || 0} días consecutivos

INSTRUCCIONES PARA TU RESPUESTA:
1. Actúa como un amigo sabio, no como un juez. Sé empático pero firme.
2. Usa el nombre del usuario para personalizar.
3. Si es un capricho:
   - Calcula cuántas horas de trabajo representa el gasto (basado en un salario medio de 12-15€/h)
   - Pregunta si realmente vale la pena trabajar tantas horas por ese producto
   - Ofrece la regla de las 48 horas: si después de 2 días sigue queriéndolo, que lo piense
   - Menciona el "costo de oportunidad": qué otra cosa podría hacer con ese dinero
4. Si es una necesidad:
   - Felicítale por ser responsable
   - Sugiere comparar precios en 3 sitios diferentes antes de comprar
   - Pregunta si ha considerado segunda mano o alternativas más económicas
5. VARIEDAD OBLIGATORIA: NO USES LAS MISMAS FRASES. Cada consejo debe ser ÚNICO.
6. LONGITUD: Entre 2 y 4 líneas, conciso pero profundo.
7. TONO: Cálido, cercano, con pequeñas dosis de humor si es apropiado.
8. TERMINA SIEMPRE con una pregunta que invite a la reflexión personal.

EJEMPLOS DE CONSEJOS QUE PUEDES ADAPTAR (NO COPIAR LITERALMENTE):
- "Juan, gastar 800€ en un móvil nuevo son 80 horas de trabajo. ¿Realmente necesitas el último modelo o uno más sencillo te sirve igual?"
- "Ana, un capricho de 50€ está bien si lo has planeado. La clave no es privarte, sino elegir conscientemente."
- "Carlos, antes de comprar ese producto necesario, ¿has mirado en Wallapop o Vinted? A veces hay oportunidades increíbles."
- "Lucía, con 1200€ podrías hacer un curso que duplique tu sueldo. ¿Prefieres eso o el objeto?"
- "Diego, la regla de las 48 horas: espera 2 días. Si sigues queriéndolo, cómpralo sin culpa. Si se te pasa, te has ahorrado un disgusto."

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
                    temperature: 0.9,
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
        
        console.log("💡 Consejo:", advice);
        res.json({ advice });

    } catch (err) {
        console.error("Error consejo:", err);
        res.json({ advice: `🤔 ${username}, antes de decidir, pregúntate: ¿este gasto te hará más feliz dentro de un mes? A veces la respuesta no es la que esperamos.` });
    }
});

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "GastoZero API funcionando con Gemini" });
});

app.listen(3000, () => {
    console.log("🚀 Servidor con Gemini corriendo en http://localhost:3000");
});
