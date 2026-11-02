const { getAllAccessToken, refreshAccessToken, updateAccessToken } = require("./getTokenService");
const { syncGoogleCalendarWithDatabase } = require("../controllers/authController"); // Ajuste o caminho se necessário

const startAutoSync = () => {
  // Roda a cada 5 minutos (300.000 milisegundos)
  setInterval(async () => {
    console.log("Iniciando sincronização automática...");
    const users = await getAllAccessToken();

    for (const user of users) {
      try {
        // 1. Tenta renovar o token para garantir que a sincronização não falhe
        const newAccessToken = await refreshAccessToken(user.refresh_token);
        
        if (newAccessToken) {
          // 2. Atualiza no banco para o próximo uso
          await updateAccessToken(user.user_id, newAccessToken);
          
          // 3. Roda a sua função de sincronização que você já tem pronta!
          await syncGoogleCalendarWithDatabase(user.user_id, newAccessToken);
          console.log(`Sincronização concluída para o usuário: ${user.user_id}`);
        }
      } catch (error) {
        console.error(`Erro ao sincronizar usuário ${user.user_id}:`, error.message);
      }
    }
  }, 30 * 1000); 
};

module.exports = { startAutoSync };