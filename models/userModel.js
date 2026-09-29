const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    autentication_token: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    user_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    user_cpf: {
      type: DataTypes.STRING(11),
      allowNull: true,
    },
    user_cnpj: {
      type: DataTypes.STRING(14),
      allowNull: true,
    },
    // Campo antigo (só CRP); o registro atual fica em council_*
    crp_number: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    council_type: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    council_region: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    council_number: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    council_category: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    // Linha "local e data" do recibo, ex.: "Pelotas/RS"
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Vazia = descrição automática pelo conselho
    receipt_description: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    user_phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    user_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    access_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    user_message: {
      type: DataTypes.TEXT,
      allowNull: true, // Permite que o campo seja nulo caso não haja mensagem
    },
    clinic_name: {
      type: DataTypes.STRING(255), // Novo campo para "Nome/Clínica"
      allowNull: true, // Permite ser nulo inicialmente
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: false,
  }
);

module.exports = { User };
