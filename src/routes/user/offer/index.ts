import expres, { Router } from "express";
import Offers from "../../../controllers/user/offer";
import { authRequest, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const offersController = new Offers();

routes.get("/my-offers",  authRequest, validateRequest, offersController.getList.bind(offersController));
routes.get("/by-id/:id",  authRequest, validateRequest, offersController.getById.bind(offersController));
routes.delete("/delete/:id",  authRequest, validateRequest, offersController.delete.bind(offersController));
routes.patch("/status/:id", validateRequest, authRequest, offersController.status.bind(offersController));

routes.put("/buy-offer/update/:id", validateRequest, authRequest, offersController.updateBuyOffer.bind(offersController));
routes.put("/sell-offer/update/:id", validateRequest, authRequest, offersController.updateSellOffer.bind(offersController));



routes.post("/post-buy-offer", validateRequest, authRequest, offersController.postBuyOffer.bind(offersController));
routes.post("/post-sell-offer", validateRequest, authRequest, offersController.postSellOffer.bind(offersController));

routes.get("/unlocked/list",  authRequest, validateRequest, offersController.getUnlockedOffersList.bind(offersController));
routes.post("/unlock", validateRequest, authRequest, offersController.unlockOffer.bind(offersController));
routes.get("/unlocked/by-id/:id",  authRequest, validateRequest, offersController.getUnlockedOfferById.bind(offersController));
routes.put("/activate-offers", validateRequest, authRequest, offersController.activateOffers.bind(offersController));



routes.get("/rating/by-id/:id",  authRequest, validateRequest, offersController.getOfferRatingById.bind(offersController));
routes.post("/rating/add", validateRequest, authRequest, offersController.addRating.bind(offersController));
routes.put("/rating/update/:id", validateRequest, authRequest, offersController.updateRating.bind(offersController));



export default routes;
