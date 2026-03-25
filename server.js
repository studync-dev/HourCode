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
                        text: `Eres un extractor de productos en ESPAÑOL. Analiza este texto y responde SOLO con el producto y el precio en este formato exacto:

PRODUCTO: [nombre del producto]
PRECIO: [número]

REGLAS IMPORTANTES:
- Perdona TODAS las faltas de ortografía (ej: "cuestas" = cuesta, "carrro" = carro, "coche" = coche)
- El producto puede ser de 1 a 3 palabras
- Reconoce sinónimos comunes en España:
  * "carro" = coche
  * "ordenata" = ordenador
  * "móvi" = móvil
  * "cascos" = auriculares
- Si el precio está en palabras (ej: "ochenta euros"), conviértelo a número
- Si no ves un precio claro, pon PRECIO: 0
- Ignora nombres, edades, ciudades y conversación previa

Texto: "${text}"`
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
            return res.json({ object: "algo", price: 0 });
        }
        
        const respuesta = data.candidates[0].content.parts[0].text;
        console.log("📦 Respuesta Gemini:", respuesta);
        
        // Extraer producto y precio
        const productMatch = respuesta.match(/PRODUCTO:\s*(.+)/i);
        const priceMatch = respuesta.match(/PRECIO:\s*(\d+)/i);
        
        let producto = productMatch ? productMatch[1].trim().toLowerCase() : "algo";
        const precio = priceMatch ? parseFloat(priceMatch[1]) : 0;
        
        // Limpiar producto (quitar palabras raras)
        producto = producto.replace(/[^\w\sáéíóúñ]/g, "").trim();
        
        console.log("🧠 Extraído:", { producto, precio });
        res.json({ object: producto, price: precio });

    } catch (err) {
        console.error("Error Gemini:", err);
        res.json({ object: "algo", price: 0 });
    }
});

// Ruta para el consejo amigable
app.post("/advice", async (req, res) => {
    const { product, price, needOrWant, saved } = req.body;
    
    const prompt = `
Eres "GastoZero", un asistente amigable que ayuda a evitar gastos innecesarios. Hablas español de España.

Contexto:
- Producto: ${product} (${price}€)
- El usuario dice que es: ${needOrWant || "no especificado"}
- Dinero ahorrado hasta ahora: ${saved || 0}€

Reglas:
- Responde en español natural y cercano
- Sé empático, no sermonees
- Usa emojis con moderación
- Da un consejo útil y breve (máximo 3 líneas)
- Si es un capricho, sugiere esperar 24 horas
- Si es una necesidad, da consejos para comprar inteligente
- Termina con una pregunta que invite a reflexionar

Responde:`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 150
                }
            })
        });

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]) {
            console.error("Error consejo Gemini:", data);
            return res.json({ advice: "¿Realmente necesitas esto? Espera 24 horas antes de decidir. 💭" });
        }
        
        const advice = data.candidates[0].content.parts[0].text;
        
        console.log("💡 Consejo:", advice);
        res.json({ advice });

    } catch (err) {
        console.error("Error consejo:", err);
        res.json({ advice: "¿Realmente necesitas esto? Espera 24 horas antes de decidir. 💭" });
    }
});

// Ruta de prueba para ver si el servidor está vivo
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "GastoZero API funcionando" });
});

app.listen(3000, () => {
    console.log("🚀 Servidor con Gemini corriendo en http://localhost:3000");
});
