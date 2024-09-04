import expres, { Router } from "express";
import SettingController from "../../../controllers/admin/setting";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const settingController = new SettingController();

routes.get("/get-settings", validateRequest, authAdmin, settingController.getSettings.bind(settingController));
routes.post("/save-settings", validateRequest, authAdmin, settingController.saveSettings.bind(settingController));


export default routes;
