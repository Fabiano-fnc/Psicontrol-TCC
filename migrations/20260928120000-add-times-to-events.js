"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Horário da consulta no formato "HH:mm"; null em eventos de dia inteiro
    await queryInterface.addColumn("events", "start_time", {
      type: Sequelize.STRING(5),
      allowNull: true,
    });
    await queryInterface.addColumn("events", "end_time", {
      type: Sequelize.STRING(5),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("events", "end_time");
    await queryInterface.removeColumn("events", "start_time");
  },
};
