import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 PON AQUÍ TU API KEY de DeepSeek
const DEEPSEEK_API_KEY = "sk-37d2b0a37a2f459e970782fa955f9438";

// Ruta existente para extraer producto
app.post("/extract", async (req, res) => {
    let { text } = req.body;

    console.log("📝 Texto original:", text);

    // 🔥 LIMPIAR TEXTO ANTES DE ENVIAR A LA IA
    let cleanedText = text
        .replace(/mira\s*/gi, "")
        .replace(/me llamo\s+[\w\s]+[,.]/gi, "")
        .replace(/vivo\s+[\w\s]+[,.]/gi, "")
        .replace(/tengo\s+\d+\s*años?/gi, "")
        .replace(/loq ue pasa es que\s*/gi, "")
        .replace(/lo que pasa es que\s*/gi, "")
        .replace(/es algo caro y\s*/gi, "")
        .replace(/quiero comprar\s+(?:un|una|el|la)?\s*/gi, "")
        .trim();

    console.log("🧹 Texto limpio:", cleanedText);

    try {
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: `Eres un extractor de productos. Responde SOLO con el nombre del producto, UNA SOLA PALABRA.

REGLAS:
- Responde con 1 palabra, máximo 2 si es necesario (ej: "silla gaming" se permite)
- NO uses frases
- NO uses contexto personal
- Si el producto es "ordenador", responde "ordenador"
- Si el producto es "servidor multiusos", responde "servidor multiusos"
- Ignora palabras como "loq", "ue", "pasa", "caro", "cuesta"

EJEMPLOS:
Texto: "quiero comprar un ordenador loq ue pasa es que es caro"
Respuesta: ordenador

Texto: "servidor multiusos 800€"
Respuesta: servidor multiusos

Texto: "iphone 15 pro max"
Respuesta: iphone 15 pro max`
                    },
                    {
                        role: "user",
                        content: `¿Qué producto quiere comprar? Responde con 1-2 palabras: "${cleanedText}"`
                    }
                ],
                temperature: 0,
                max_tokens: 15
            })
        });

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error("Respuesta inválida de DeepSeek:", data);
            return res.json({ object: "algo" });
        }
        
        let result = data.choices[0].message.content.trim().toLowerCase();
        
        // Limpiar caracteres raros
        result = result.replace(/[^a-záéíóúñ0-9\s]/g, "");
        
        // Tomar SOLO las primeras 2 palabras
        const words = result.split(/\s+/).slice(0, 2);
        result = words.join(" ");
        
        // Lista negra de palabras basura
        const palabrasBasura = ["loq", "ue", "pasa", "caro", "cuesta", "es", "que", "algo", "quiero", "comprar"];
        
        // Si el resultado es solo basura, intentar buscar palabra clave
        if (palabrasBasura.includes(result) || result.length < 3) {
            const palabrasClave = ["ordenador", "portátil", "servidor", "silla", "torre", "iphone", "teclado", "ratón", "monitor"];
            for (let palabra of palabrasClave) {
                if (text.toLowerCase().includes(palabra)) {
                    result = palabra;
                    break;
                }
            }
        }

        if (!result || result === "comprar" || result === "quiero" || result.length < 2) {
            result = "algo";
        }

        console.log("🧠 IA extrajo:", result);
        res.json({ object: result });

    } catch (err) {
        console.error("Error en /extract:", err);
        res.json({ object: "algo" });
    }
});

// 🆕 NUEVA RUTA: Consejo economista con IA
app.post("/advice", async (req, res) => {
    const { product, price, hourlyWage, savings, decision } = req.body;
    
    const totalHours = (price / hourlyWage).toFixed(1);
    const remaining = Math.max(0, price - savings);
    const remainingHours = (remaining / hourlyWage).toFixed(1);
    
    const prompt = `
Contexto de la conversación:
- Producto: ${product} (${price}€)
- Gana por hora: ${hourlyWage}€
- Ahorros: ${savings}€
- Total horas necesarias: ${totalHours} horas
- Le faltan: ${remaining}€ (${remainingHours} horas)
- Decisión final: ${decision === "si" ? "VA A COMPRARLO" : "NO LO VA A COMPRAR"}

Eres un economista experto en finanzas personales y psicología del consumo.
Analiza esta situación y da un consejo profundo y reflexivo.

REGLAS:
- Sé conciso pero profundo (máximo 4 líneas)
- Usa un tono sabio pero cercano
- Si decidió comprar: hazle reflexionar sobre el valor real del tiempo
- Si decidió no comprar: refuerza su decisión con sabiduría financiera
- No repitas los números, enfócate en la reflexión
- Termina con una pregunta que lo haga pensar
`;

    try {
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "Eres un economista sabio y reflexivo. Das consejos profundos sobre finanzas personales y el valor del tiempo."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 150
            })
        });

        const data = await response.json();
        let advice = data.choices[0].message.content.trim();
        
        console.log("💡 Consejo economista:", advice);
        res.json({ advice });

    } catch (err) {
        console.error("Error en /advice:", err);
        res.json({ advice: "El dinero es tiempo. Cada euro que gastas son minutos de tu vida. ¿Realmente vale la pena?" });
    }
});

app.listen(3000, () => {
    console.log("🚀 Servidor corriendo en http://localhost:3000");
    console.log("📡 Rutas: /extract y /advice");
});