const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");

const QRPortalWeb = require("@bot-whatsapp/portal");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");
const express = require("express");
const app = express();
const port = 7131;
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const https = require("https");
const privateKey = fs.readFileSync("private2024.pem", "utf8");
const certificate = fs.readFileSync("certificate2024.pem", "utf8");

const credentials = { key: privateKey, cert: certificate };
const server = https.createServer(credentials, app);

// Ruta al archivo bot.qr.png
const qrImagePath = path.join(__dirname, "bot.qr.png");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "https://whatsapp.limpiolux.com:7129",
      "https://whatsapp.limpiolux.com:7130",
      "https://whatsapp.limpiolux.com",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

const flowBienvenida = addKeyword("HOLA").addAnswer(
  "Hola, ¿en qué puedo ayudarte?"
);

let loginStatus = false; // Estado inicial
let registeredNumber = ""; // Número registrado

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowBienvenida]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  QRPortalWeb();

  // Capturar los mensajes de la consola
  const consoleLog = console.log;
  console.log = function (message) {
    if (message.includes("Proveedor conectado y listo")) {
      loginStatus = true;
    } else if (message.includes("ACCIÓN REQUERIDA")) {
      loginStatus = false;
    } else if (message.includes("Número registrado")) {
      // Extraer el número registrado y almacenarlo
      const matchResult = message.match(/(\d{10,})/);
      if (matchResult) {
        registeredNumber = matchResult[0];
      }
    }
    consoleLog.apply(console, arguments);
  };

  app.post("/send-message-bot", async (req, res) => {
    try {
      const phone = req.body.phone;
      if (!phone) {
        throw new Error("Phone number is missing in the request body");
      }

      const message = req.body.message;
      if (!message) {
        throw new Error("Message is missing in the request body");
      }

      await adapterProvider.sendText(phone, message);
      res.send({ data: "¡Enviado!" });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  });

  app.get("/qr", (req, res) => {
    try {
      // Verificar si el archivo existe
      if (fs.existsSync(qrImagePath)) {
        // Leer el archivo y enviarlo como respuesta
        const image = fs.readFileSync(qrImagePath);
        res.contentType("image/png");
        res.send(image);
      } else {
        // Si el archivo no existe, enviar una respuesta de error 404
        res.status(404).send({ error: "File not found" });
      }
    } catch (error) {
      // En caso de cualquier error, enviar una respuesta de error 500
      res.status(500).send({ error: "Internal server error" });
    }
  });

  app.get("/login", (req, res) => {
    res.send({ status: loginStatus, registeredNumber: registeredNumber });
  });

  server.listen(port, () => {
    console.log(`HTTP app listening on port ${port}`);
  });
};

main();
