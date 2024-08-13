import expres, { Router } from "express";
import BannerController from "../../../controllers/admin/banner";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";
import { upload } from "../../../utils/storage";
const routes: Router = expres.Router();
const bannerController = new BannerController();

routes.get("/list", validateRequest, authAdmin, bannerController.getList.bind(bannerController));
routes.get("/by-id/:id", validateRequest, authAdmin, bannerController.getById.bind(bannerController));
routes.post("/add", validateRequest, authAdmin, upload.single("banner"), bannerController.add.bind(bannerController));
routes.patch("/update/:id", validateRequest, authAdmin, upload.single("banner"), bannerController.update.bind(bannerController));
routes.delete("/delete/:id", validateRequest, authAdmin, bannerController.delete.bind(bannerController));
routes.patch("/status/:id", validateRequest, authAdmin, bannerController.updateStatus.bind(bannerController));

export default routes;
