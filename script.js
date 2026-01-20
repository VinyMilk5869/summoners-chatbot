const endpoint = "https://clurestaurante.cognitiveservices.azure.com/";
const apiKey = "BtWFDvv7v26a6fHzA7SyG8x21fcuk30ySEq9E6HwUyl2r1csVABHJQQJ99CAACI8hq2XJ3w3AAAaACOGufeY";
const projectName = "PollosHermanosChat"; // tu proyecto CLU
const deploymentName = "production";

const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const chatOutput = document.getElementById("chatOutput");

sendBtn.addEventListener("click", async () => {
    const userMessage = chatInput.value;
    if(!userMessage) return;

    addMessage("Usuario", userMessage);
    chatInput.value = "";

    const response = await analyzeMessage(userMessage);
    addMessage("Bot", response);
});

// Función para agregar mensajes al chat
function addMessage(sender, text) {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatOutput.appendChild(p);
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

// Función que llama al CLU
async function analyzeMessage(text) {
    const url = `${endpoint}language/:analyze-conversations?api-version=2023-07-01-preview`;
    
    const body = {
        kind: "Conversation",
        analysisInput: {
            conversationItem: {
                id: "1",
                participantId: "user",
                text: text
            }
        },
        tasks: [{
            kind: "ConversationTask",
            taskName: "PollosHermanosIntent",
            parameters: {
                projectName: projectName,
                deploymentName: deploymentName
            }
        }]
    };

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": apiKey
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        const prediction = data.tasks[0].result.prediction;
        const intent = prediction.topIntent;
        const entities = prediction.entities.map(e => `${e.category}: ${e.text}`).join(", ");

        return `Intención: ${intent}. ${entities ? "Entidades: " + entities : ""}`;
    } catch (err) {
        console.error(err);
        return "Lo siento, hubo un error procesando tu mensaje.";
    }
}
