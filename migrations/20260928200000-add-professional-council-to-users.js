"use strict";

const CRP_REGIONS = Array.from({ length: 24 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Registro profissional em partes: conselho, região/UF, número e categoria
    await queryInterface.addColumn("users", "council_type", {
      type: Sequelize.STRING(10),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "council_region", {
      type: Sequelize.STRING(5),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "council_number", {
      type: Sequelize.STRING(10),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "council_category", {
      type: Sequelize.STRING(5),
      allowNull: true,
    });

    // CRPs já cadastrados ("06/12345") viram CRP + região + número; região
    // inexistente fica vazia para o profissional escolher no perfil
    const [users] = await queryInterface.sequelize.query(
      "SELECT user_id, crp_number FROM users WHERE crp_number IS NOT NULL AND crp_number <> ''"
    );
    for (const { user_id, crp_number } of users) {
      const match = /^(\d{2})\/(\d+)$/.exec(crp_number.trim());
      const region = match && CRP_REGIONS.includes(match[1]) ? match[1] : null;
      const number = match ? match[2] : crp_number.replace(/\D/g, "");
      if (!number) continue;
      await queryInterface.sequelize.query(
        "UPDATE users SET council_type = 'CRP', council_region = :region, council_number = :number WHERE user_id = :user_id",
        { replacements: { region, number, user_id } }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "council_category");
    await queryInterface.removeColumn("users", "council_number");
    await queryInterface.removeColumn("users", "council_region");
    await queryInterface.removeColumn("users", "council_type");
  },
};
