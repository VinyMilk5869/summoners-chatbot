// =======================
// Configuración CLU
// =======================
const ENDPOINT = "https://clurestaurante.cognitiveservices.azure.com/";
const KEY = "BtWFDvv7v26a6fHzA7SyG8x21fcuk30ySEq9E6HwUyl2r1csVABHJQQJ99CAACI8hq2XJ3w3AAAaACOGufeY";
const PROJECT_NAME = "CLURestaurante";
const DEPLOYMENT_NAME = "production";
const API_VERSION = "2023-04-01";

const messagesContainer = document.getElementById("messagesContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// =======================
// Función para extraer entidades de la predicción
// =======================
function extractEntities(prediction) {
    const entities = {};
    for (const ent of prediction.entities || []) {
        const category = ent.category;
        const text = ent.text;
        if (category && text) {
            if (!entities[category]) entities[category] = [];
            entities[category].push(text);
        }
    }
    return entities;
}

// =======================
// Función para construir la respuesta del bot
// =======================
function buildReply(intent, entities) {
    if (intent === "CrearPedido") {
        const plato = (entities.plato || [""])[0];
        const cantidad = (entities.cantidad || ["1"])[0];
        const ciudad = (entities.ciudad || [""])[0];
        const fecha = (entities.fecha || [""])[0];
        const hora = (entities.hora || [""])[0];
        const direccion = (entities.direccion || [""])[0];
        const nombre = (entities.nombre_cliente || [""])[0];
        const email = (entities.email || [""])[0];

        const missing = [];
        if (!plato) missing.push("plato");
        if (!cantidad) missing.push("cantidad");
        if (!ciudad) missing.push("ciudad");
        if (!fecha) missing.push("fecha");
        if (!hora) missing.push("hora");
        if (!direccion) missing.push("dirección");
        if (!nombre) missing.push("nombre");
        if (!email) missing.push("email");

        if (missing.length > 0) {
            return {
                text: `✏️ Para tramitar el pedido, indícame: ${missing.join(", ")}.`,
                entities: entities
            };
        }

        return {
            text: `✅ Pedido confirmado:\n📦 ${cantidad} x ${plato}\n📍 ${direccion}, ${ciudad}\n📅 ${fecha} a las ${hora}\n📧 Confirmación a ${email}\n👤 A nombre de ${nombre}`,
            entities: entities
        };
    }

    if (intent === "ConsultarEstadoPedido") {
        return {
            text: "🔍 Tu pedido está en preparación. Para afinar la búsqueda, indícame tu email o la dirección del pedido.",
            entities: entities
        };
    }

    if (intent === "CancelarPedido") {
        return {
            text: "❌ De acuerdo, tramitando cancelación. Indícame tu email o la dirección del pedido.",
            entities: entities
        };
    }

    if (intent === "Recomendacion") {
        return {
            text: "🌟 Recomendación del día:\n🍝 Tortilla de patatas\n🍗 Pollo al curry\n🥗 Ensalada César",
            entities: entities
        };
    }

    return {
        text: "❓ No lo he entendido. ¿Quieres crear un pedido, consultar estado, cancelar o pedir una recomendación?",
        entities: {}
    };
}

// =======================
// Función para agregar mensajes al chat
// =======================
function addMessage(content, sender = "bot", entities = {}) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.innerHTML = content;

    messageDiv.appendChild(contentDiv);

    // Mostrar entidades si existen
    if (sender === "bot" && Object.keys(entities).length > 0) {
        const infoDiv = document.createElement("div");
        infoDiv.className = "message-info";
        let infoText = "🏷️ Entidades: ";
        for (const [key, values] of Object.entries(entities)) {
            infoText += `${key}: ${values.join(", ")} | `;
        }
        infoDiv.textContent = infoText.slice(0, -3);
        messageDiv.appendChild(infoDiv);
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// =======================
// Función para llamar a CLU
// =======================
async function callCLU(text) {
    const url = `${ENDPOINT}language/:analyze-conversations?api-version=${API_VERSION}`;
    
    const body = {
        kind: "Conversation",
        analysisInput: {
            conversationItem: {
                id: "1",
                participantId: "user",
                text: text
            }
        },
        parameters: {
            projectName: PROJECT_NAME,
            deploymentName: DEPLOYMENT_NAME,
            stringIndexType: "Utf16CodeUnit"
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Error CLU: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.result.prediction;
    } catch (error) {
        console.error("Error llamando a CLU:", error);
        throw error;
    }
}

// =======================
// Función para enviar mensaje
// =======================
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Mostrar mensaje del usuario
    addMessage(text, "user");
    userInput.value = "";
    sendBtn.disabled = true;

    // Mostrar indicador de escritura
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message bot";
    loadingDiv.innerHTML = `<div class="loading"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>`;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const prediction = await callCLU(text);
        const topIntent = prediction.topIntent || "";
        const entities = extractEntities(prediction);

        const reply = buildReply(topIntent, entities);

        // Remover loading
        loadingDiv.remove();

        // Agregar respuesta
        addMessage(reply.text, "bot", reply.entities);
    } catch (error) {
        loadingDiv.remove();
        addMessage(
            `<div class="error-message"> Error: ${error.message}</div>`,
            "bot"
        );
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// =======================
// Enviar con Enter
// =======================
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener("click", sendMessage);
