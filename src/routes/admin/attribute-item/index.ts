import expres, { Router } from "express";
import AttributeItemController from "../../../controllers/admin/attribute-item";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const attributeitemController = new AttributeItemController();

routes.get("/list/:attribute_id", validateRequest, authAdmin, attributeitemController.getList.bind(attributeitemController));
routes.post("/add", validateRequest, authAdmin, attributeitemController.add.bind(attributeitemController));
routes.put("/update/:id", validateRequest, authAdmin, attributeitemController.update.bind(attributeitemController));
routes.get("/by-id/:id", validateRequest, authAdmin, attributeitemController.getById.bind(attributeitemController));
routes.delete("/delete/:id", validateRequest, authAdmin, attributeitemController.delete.bind(attributeitemController));
routes.patch("/status/:id", validateRequest, authAdmin, attributeitemController.status.bind(attributeitemController));

export default routes;
