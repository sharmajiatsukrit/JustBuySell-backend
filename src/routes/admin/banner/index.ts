import expres, { Router } from "express";
import BannerController from "../../../controllers/admin/banner";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const bannerController = new BannerController();

routes.get("/getlist", validateRequest, bannerController.getList.bind(bannerController));
routes.get("/getbyid/:id", validateRequest, bannerController.getDetailsById.bind(bannerController));
routes.post("/addbanner", Fileupload.fields([{ name: 'bannerimg', maxCount: 1 }]), validateRequest, bannerController.addBanner.bind(bannerController));
routes.patch("/updatebanner/:id", validateRequest, bannerController.updateBanner.bind(bannerController));
routes.delete("/deletebanner/:id", validateRequest, bannerController.deleteBanner.bind(bannerController));

export default routes;
