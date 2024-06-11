import expres, { Router } from "express";
import ProductRequestController from "../../../controllers/user/productrequest";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const productcontroller = new ProductRequestController();

routes.post("/add", Fileupload.fields([{ name: 'product_image', maxCount: 1 }]),  productcontroller.validate(UserRouteEndPoints.Addproductrequest), validateRequest, productcontroller.add.bind(productcontroller));

export default routes;