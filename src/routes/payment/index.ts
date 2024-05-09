// import expres, { Router } from "express";
// import PaymentController from "../../../controllers/payment";
// import { authRequest, validateRequest } from "../../utils/middleware";

// const routes: Router = expres.Router();
// const paymentController = new PaymentController();

// routes.get("/subscription-plans", authRequest, validateRequest, paymentController.getSubscriptionPlans.bind(paymentController));
// routes.get("/billing-info", authRequest, validateRequest, paymentController.getBillingInfo.bind(paymentController));
// routes.get("/lifetime-quantity", authRequest, validateRequest, paymentController.getLifetimeSubscriptionQuantity.bind(paymentController));
// routes.get("/check-stripe-subscriptions", paymentController.checkStripeSubscriptions.bind(paymentController));
// routes.post("/stripe-create-session", authRequest, validateRequest, paymentController.createStripeSession.bind(paymentController));
// routes.post("/subscription", authRequest, validateRequest, paymentController.createStripeSubscription.bind(paymentController));
// routes.post("/one-time-payment", authRequest, validateRequest, paymentController.createOneTimePayment.bind(paymentController));
// routes.get("/active-subscription", authRequest, validateRequest, paymentController.getCustomerActiveSubscriptions.bind(paymentController));
// routes.post("/cancel-subscription", authRequest, validateRequest, paymentController.cancelCustomerSubscription.bind(paymentController));
// routes.post("/stripe-webhook-in", paymentController.stripeWebhookIndia.bind(paymentController));
// routes.post("/stripe-webhook-uk", paymentController.stripeWebhookUk.bind(paymentController));
// routes.get("/check-apple-subscriptions", paymentController.checkAppleSubscriptions.bind(paymentController));
// routes.post("/verify-appstore-purchase", authRequest, paymentController.verifyAppStorePurchase.bind(paymentController));
// routes.post("/payment-webhook", authRequest, paymentController.paymentWebhook.bind(paymentController));

// export default routes;
