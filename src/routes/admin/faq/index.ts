import expres, { Router } from "express";
import FaqController from "../../../controllers/admin/faq";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const faqController = new FaqController();

routes.get("/list", validateRequest, authAdmin, faqController.getList.bind(faqController));
routes.post("/add", validateRequest, authAdmin, faqController.add.bind(faqController));
routes.put("/update/:id", validateRequest, authAdmin, faqController.update.bind(faqController));
routes.get("/by-id/:id", validateRequest, authAdmin, faqController.getById.bind(faqController));
routes.delete("/delete/:id", validateRequest, authAdmin, faqController.delete.bind(faqController));
routes.patch("/status/:id", validateRequest, authAdmin, faqController.status.bind(faqController));

export default routes;
