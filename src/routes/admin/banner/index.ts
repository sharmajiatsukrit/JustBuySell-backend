import expres, { Router } from "express";
import BannerController from "../../../controllers/admin/banner";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const bannerController = new BannerController();

routes.get("/list", validateRequest, authAdmin, bannerController.getList.bind(bannerController));
routes.get("/getbyid/:id", validateRequest, authAdmin, bannerController.getDetailsById.bind(bannerController));
routes.post("/addbanner", Fileupload.fields([{ name: 'bannerimg', maxCount: 1 }]), validateRequest, authAdmin, bannerController.addBanner.bind(bannerController));
routes.patch("/updatebanner/:id", Fileupload.fields([{ name: 'bannerimg', maxCount: 1 }]), validateRequest, authAdmin, bannerController.updateBanner.bind(bannerController));
routes.delete("/deletebanner/:id", validateRequest, authAdmin, bannerController.deleteBanner.bind(bannerController));
routes.patch("/update-status/:id", validateRequest, authAdmin, bannerController.updateBannerStatus.bind(bannerController));

export default routes;
   