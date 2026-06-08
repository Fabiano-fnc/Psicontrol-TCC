const { User } = require("../models");
const { Op } = require("sequelize");
const { oauth2Client } = require("../config/oauth2");

const getAllAccessToken = async () => {
  try {
    const users = await User.findAll({
      attributes: ["user_id", "access_token", "refresh_token"],
      where: {
        access_token: { [Op.ne]: null },
        refresh_token: { [Op.ne]: null },
      },
    });

    return users;
  } catch (error) {}
};

const refreshAccessToken = async (refreshToken) => {
  try {
    // É importante setar as credenciais antes de dar o refresh
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    return null;
  }
};

const updateAccessToken = async (userId, newAccessToken) => {
  try {
    const user = await User.findByPk(userId);
    if (user) {
      user.access_token = newAccessToken;
      await user.save();
    }
  } catch (error) {}
};

module.exports = {
  getAllAccessToken,
  refreshAccessToken,
  updateAccessToken,
};
