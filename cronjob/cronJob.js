const cron = require("node-cron");
const {
  syncGoogleCalendarWithDatabase,
  fetchGoogleCalendars,
} = require("../controllers/authController");
const {
  getAllAccessToken,
  refreshAccessToken,
  updateAccessToken,
} = require("../services/getTokenService");

const syncAllCalendars = async () => {
  const users = await getAllAccessToken();

  for (const user of users) {
    const { user_id, refresh_token: refreshToken } = user;
    if (!refreshToken) continue;

    // Falha de um usuário não interrompe a sincronização dos demais
    try {
      const newAccessToken = await refreshAccessToken(refreshToken);
      if (!newAccessToken) continue;

      await updateAccessToken(user_id, newAccessToken);
      await syncGoogleCalendarWithDatabase(user_id, newAccessToken);
    } catch (error) {
      console.error(`Erro ao sincronizar usuário ${user_id}:`, error.message);
    }
  }
};


cron.schedule("* * * * *", async () => {
  try {
    await syncAllCalendars();
  } catch (error) {
    console.error("Erro no ciclo de sincronização:", error);
  }
});