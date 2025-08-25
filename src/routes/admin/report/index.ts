import expres, { Router } from "express";
import ReportController from "../../../controllers/admin/report";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const reportController = new ReportController();

routes.get("/invoice-receipt", validateRequest, authAdmin, reportController.getPaymentReceipt.bind(reportController));
routes.get("/payment-receipt", validateRequest, authAdmin, reportController.getPaymentReceipt.bind(reportController));
routes.get("/revenue-receipt", validateRequest, authAdmin, reportController.getRevenueReceipt.bind(reportController));
routes.get("/user-wallet-txn", validateRequest, authAdmin, reportController.getUserWalletTXN.bind(reportController));

// routes.get("/by-id/:id", validateRequest, authAdmin, transactionController.getById.bind(transactionController));

export default routes;
