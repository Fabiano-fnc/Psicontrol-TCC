const { User } = require("./userModel");
const { Customer } = require("./customerModel");
const { CustomersBillingRecords } = require("./customersBillingRecordsModel");
const { income } = require("./incomeModel");
const { Event } = require("../models/eventModel");
const { Calendar } = require("../models/calendarModel");
const { Receipt } = require("./receiptModel");

User.hasMany(Customer, { foreignKey: "user_id" });
Customer.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Customer, { foreignKey: "user_id" });
Event.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(income, { foreignKey: "user_id" });
income.belongsTo(User, { foreignKey: "user_id"});

Customer.hasMany(CustomersBillingRecords, { foreignKey: "customer_id" });
CustomersBillingRecords.belongsTo(Customer, { foreignKey: "customer_id" });

Customer.hasMany(CustomersBillingRecords, { foreignKey: "customer_id" });
Event.belongsTo(Customer, { foreignKey: "customer_id" });

Event.belongsTo(Calendar, { foreignKey: "calendar_id" });

Receipt.belongsTo(Customer, { foreignKey: "customer_id" });

module.exports = {
  User,
  Customer,
  CustomersBillingRecords,
  income,
  Event,
  Calendar,
  Receipt,
};
