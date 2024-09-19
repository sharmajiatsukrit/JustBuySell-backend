import expres, { Router } from "express";
import AttributeController from "../../../controllers/admin/attribute";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const attributeController = new AttributeController();

routes.get("/list", validateRequest, authAdmin, attributeController.getList.bind(attributeController));
routes.post("/add", validateRequest, authAdmin, attributeController.add.bind(attributeController));
routes.put("/update/:id", validateRequest, authAdmin, attributeController.update.bind(attributeController));
routes.get("/by-id/:id", validateRequest, authAdmin, attributeController.getById.bind(attributeController));
routes.delete("/delete/:id", validateRequest, authAdmin, attributeController.delete.bind(attributeController));
routes.patch("/status/:id", validateRequest, authAdmin, attributeController.status.bind(attributeController));

export default routes;
