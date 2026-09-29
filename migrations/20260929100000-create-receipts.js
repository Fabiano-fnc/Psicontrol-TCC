"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Perfil: cidade da linha "local e data" e descrição do serviço (vazia =
    // automática pelo conselho)
    await queryInterface.addColumn("users", "city", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "receipt_description", {
      type: Sequelize.STRING(120),
      allowNull: true,
    });

    // Um recibo por paciente e mês, com número sequencial por profissional.
    // Sem chave estrangeira: users/customers não têm chave primária no banco
    // atual; o dono do recibo é conferido no controller.
    await queryInterface.createTable("receipts", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      month_and_year: {
        type: Sequelize.STRING(7),
        allowNull: false,
      },
      number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addIndex("receipts", ["user_id", "number"], {
      unique: true,
    });
    await queryInterface.addIndex(
      "receipts",
      ["user_id", "customer_id", "month_and_year"],
      { unique: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("receipts");
    await queryInterface.removeColumn("users", "receipt_description");
    await queryInterface.removeColumn("users", "city");
  },
};
