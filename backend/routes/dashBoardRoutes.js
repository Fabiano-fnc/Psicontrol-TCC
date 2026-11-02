const express = require("express");
const router = express.Router();
const dashBoardController = require("../controllers/dashBoardController");
const dashboardOverviewController = require("../controllers/dashboardOverviewController");
const receiptController = require("../controllers/receiptController");

router.get("/billing-records", dashBoardController.getBillingRecordsByMonthAndYear);
router.get("/overview", dashboardOverviewController.getOverview);
router.get("/consultation-times", dashboardOverviewController.getConsultationTimes);
router.get("/receipts", receiptController.listReceipts);
router.post("/receipts", receiptController.issueReceipt);
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
