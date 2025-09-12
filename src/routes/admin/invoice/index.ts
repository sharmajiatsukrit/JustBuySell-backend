import expres, { Router } from "express";
import InvoiceController from "../../../controllers/admin/invoice";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const invoiceController = new InvoiceController();

routes.get("/list", validateRequest, authAdmin, invoiceController.getList.bind(invoiceController));
routes.get("/by-id/:id", validateRequest, authAdmin, invoiceController.getById.bind(invoiceController));
routes.get("/generate", validateRequest, authAdmin, invoiceController.generateCurrentMonthInvoice.bind(invoiceController));

export default routes;
