"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("events", ["user_id", "google_event_id"], {
      unique: true,
      name: "events_user_google_event_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "events",
      "events_user_google_event_unique"
    );
  },
};
