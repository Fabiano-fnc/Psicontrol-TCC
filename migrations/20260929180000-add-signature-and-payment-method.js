"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Imagem da assinatura usada no recibo (arquivo em uploads/)
    await queryInterface.addColumn("users", "signature_image", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    // pix | dinheiro | credito | debito | transferencia (null = não informado)
    await queryInterface.addColumn("customers_billing_records", "payment_method", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("customers_billing_records", "payment_method");
    await queryInterface.removeColumn("users", "signature_image");
  },
};
