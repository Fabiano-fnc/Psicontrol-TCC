const express = require("express");
const router = express.Router();
const dashBoardController = require("../controllers/dashBoardController");

router.get("/billing-records", dashBoardController.getBillingRecordsByMonthAndYear);
router.post(
    "/update-partial-payment",
    dashBoardController.updatePartialPayment
  );
  
  router.post(
    "/confirm-payment",
    dashBoardController.confirmPayment
  );

  router.post(
    "/mark-invoice-sent",
    dashBoardController.markInvoiceSent
  );

module.exports = router;
