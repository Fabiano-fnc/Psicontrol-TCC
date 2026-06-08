require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { oauth2Client, authUrl } = require("./config/oauth2");
const eventRoutes = require("./routes/eventRoutes");
const revenueRoutes = require("./routes/revenueRoutes"); 
const userRoutes = require("./routes/userRoutes");
const dashBoardRoutes = require("./routes/dashBoardRoutes");
const messageRoutes = require("./routes/messageRoutes");
const {
  handleOAuth2Callback,
  initiateGoogleAuth,
  syncGoogleCalendarWithDatabase, // Importamos a função de sincronização
} = require("./controllers/authController");
const { 
  getAllAccessToken, 
  refreshAccessToken, 
  updateAccessToken 
} = require("./services/getTokenService"); // Importamos os serviços de token
const { verifyToken } = require("./middleware/authMiddleware");

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "views")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("API de Eventos. Use as rotas disponíveis para gerenciar eventos.");
});

app.get("/google", initiateGoogleAuth);
app.get("/oauth2callback", handleOAuth2Callback);
app.use("/events", verifyToken, eventRoutes);
app.use("/income", verifyToken, revenueRoutes);
app.use("/dashboard", verifyToken, dashBoardRoutes);
app.use("/user", verifyToken, userRoutes);
app.get("/auth/google/callback", handleOAuth2Callback);
require("./cronjob/cronJob");
app.use("/message", verifyToken, messageRoutes);

// --- MOTOR DE SINCRONIZAÇÃO AUTOMÁTICA ---
const startAutoSync = () => {
  // Roda a cada 5 minutos
  setInterval(async () => {
    console.log("--- Iniciando Ciclo de Sincronização Automática ---");
    try {
      const users = await getAllAccessToken();
      
      for (const user of users) {
        try {
          console.log(`Sincronizando usuário ID: ${user.user_id}...`);
          const newAccessToken = await refreshAccessToken(user.refresh_token);
          
          if (newAccessToken) {
            await updateAccessToken(user.user_id, newAccessToken);
            await syncGoogleCalendarWithDatabase(user.user_id, newAccessToken);
          }
        } catch (err) {
          console.error(`Erro no usuário ${user.user_id}:`, err.message);
        }
      }
    } catch (error) {
      console.error("Erro no motor de sincronização:", error);
    }
    console.log("--- Ciclo de Sincronização Finalizado ---");
  }, 5 * 60 * 1000); 
};

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  startAutoSync(); // Ativa o motor assim que o servidor sobe
});