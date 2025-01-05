import expres, { Router } from "express";
import RazorpayController from "../../../controllers/user/razorpay";
import { authRequest, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const razorpayController = new RazorpayController();


routes.post("/create", validateRequest, authRequest, razorpayController.createOrder.bind(razorpayController));
routes.post("/capture", validateRequest, authRequest, razorpayController.capturePayment.bind(razorpayController));
routes.post("/verify-signature", validateRequest, authRequest, razorpayController.verifySignature.bind(razorpayController));


export default routes;
