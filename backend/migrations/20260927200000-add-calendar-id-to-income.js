"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Opcional: null = lançamento "Geral", sem calendário
    await queryInterface.addColumn("income", "calendar_id", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addIndex("income", ["user_id", "month_year"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("income", ["user_id", "month_year"]);
    await queryInterface.removeColumn("income", "calendar_id");
  },
};
