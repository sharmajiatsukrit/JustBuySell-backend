import expres, { Router } from "express";
import BannerController from "../../../controllers/admin/banner";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const bannerController = new BannerController();

routes.get("/getList", validateRequest, bannerController.getList.bind(bannerController));
routes.get("getDetailsById/:id", validateRequest, bannerController.getDetailsById.bind(bannerController));
routes.post("/addBanner", Fileupload.fields([{ name: 'bannerimg', maxCount: 1 }]), validateRequest, bannerController.addBanner.bind(bannerController));
routes.patch("/updateBanner/:id", validateRequest, bannerController.updateBanner.bind(bannerController));
routes.delete("/deleteBanner/:id", validateRequest, bannerController.deleteBanner.bind(bannerController));
export default routes;
