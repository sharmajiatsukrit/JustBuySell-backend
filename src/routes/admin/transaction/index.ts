import expres, { Router } from "express";
import TransactionController from "../../../controllers/admin/transaction";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const transactionController = new TransactionController();

routes.get("/list", validateRequest, authAdmin, transactionController.getList.bind(transactionController));
routes.get("/by-id/:id", validateRequest, authAdmin, transactionController.getById.bind(transactionController));

export default routes;
