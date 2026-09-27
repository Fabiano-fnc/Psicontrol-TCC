"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("customers", "calendar_id", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addIndex("customers", ["user_id", "calendar_id"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("customers", ["user_id", "calendar_id"]);
    await queryInterface.removeColumn("customers", "calendar_id");
  },
};
