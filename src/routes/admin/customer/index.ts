import expres, { Router } from "express";
import CustomerController from "../../../controllers/admin/customer";
import { authAdmin, authRequest, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";
import { upload } from "../../../utils/storage";
const routes: Router = expres.Router();
const customerController = new CustomerController();

routes.get("/list", validateRequest, authAdmin, customerController.getList.bind(customerController));
routes.post("/add", validateRequest, authAdmin, upload.single("company_logo"), customerController.add.bind(customerController));
routes.put("/update/:id", validateRequest, authAdmin,  customerController.update.bind(customerController));
routes.get("/by-id/:id", validateRequest, authAdmin, customerController.getById.bind(customerController));
routes.delete("/delete/:id", validateRequest, authAdmin, customerController.delete.bind(customerController));
routes.patch("/status/:id", validateRequest, authAdmin, customerController.status.bind(customerController));
routes.put("/update-companylogo/:id", upload.single("company_logo"), authAdmin, validateRequest, customerController.updateCompanyLogo.bind(customerController));
routes.get("/get-wallet-balance/:id", validateRequest, authAdmin, customerController.getWalletBalance.bind(customerController));
routes.put("/recharge-wallet/:id",  authAdmin, validateRequest, customerController.updateCompanyLogo.bind(customerController));


routes.get("/watchlist/list/:customer_id",  validateRequest, authAdmin, customerController.getWatchlistList.bind(customerController));
routes.get("/watchlist/by-id/:id",  validateRequest, authAdmin, customerController.getWatchlistById.bind(customerController));
routes.post("/watchlist/add/:customer_id",  validateRequest, authAdmin, customerController.addWatchlist.bind(customerController));
routes.put("/watchlist/update/:id",  validateRequest, authAdmin, customerController.updateWatchlist.bind(customerController));
routes.delete("/watchlist/delete/:id",  validateRequest, authAdmin, customerController.deleteWishlist.bind(customerController));

routes.get("/watchlist/products/by-id/:id",  validateRequest, authAdmin, customerController.getProductsByWatchlistId.bind(customerController));

routes.get("/transactions/list/:customer_id",  validateRequest, authAdmin, customerController.getTransactions.bind(customerController));
routes.get("/invoice/list/:customer_id",  validateRequest, authAdmin, customerController.getInvoices.bind(customerController));


routes.put("/admin-settings/update/:id",  validateRequest, authAdmin, customerController.adminSettings.bind(customerController));

export default routes;