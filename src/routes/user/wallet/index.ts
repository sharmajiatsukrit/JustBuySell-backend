import expres, { Router } from "express";
import WalletController from "../../../controllers/user/wallet";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const walletController = new WalletController(); 

routes.post("/addwallet", walletController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, walletController.addWallet.bind(walletController));
routes.get("/getlist", walletController.validate(UserRouteEndPoints.Getlist), authRequest, validateRequest, walletController.getList.bind(walletController));
routes.get("/getbyid", walletController.validate(UserRouteEndPoints.Getbyid), authRequest, validateRequest, walletController.getByid.bind(walletController));
routes.get("/gettransbyid", walletController.validate(UserRouteEndPoints.Gettransbyid), authRequest, validateRequest, walletController.getTransbyid.bind(walletController));

export default routes;