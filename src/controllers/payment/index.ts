// import { Request, Response } from "express";
// import fs from 'fs';
// import axios from "axios";
// import Stripe from "stripe";
// import JWT from 'jsonwebtoken';
// import { BillingGatewayEnum } from "../../enums";
// import { Billings, Permissons, User } from "../../models";
// import UserController from "../user";
// import Logger from "../../utils/logger";
// import { serverResponse, serverErrorHandler, constructResponseMsg } from "../../utils";
// import { HttpCodeEnum } from "../../enums/server";
// import { networkRequest } from "../../utils/request";
// import { UserInviteType } from "../../enums/user";
// import ServerMessages, { ServerMessagesEnum } from "../../config/messages";

// const fileName = "[payment][index.ts]";

// export default class PaymentController {
//     public locale: string = "en";
//     public userController;

//     constructor() {
//         this.userController = new UserController();
//     }

//     private async getStripe(user: any): Promise<Stripe> {
//         if (user.country_code === 'IN') {
//             const stripe = new Stripe(process.env.STRIPE_KEY_IN!, {
//                 apiVersion: "2022-11-15",
//             });
//             return stripe;
//         }
//         const stripe = new Stripe(process.env.STRIPE_KEY!, {
//             apiVersion: "2022-11-15",
//         });
//         return stripe;
//     }

//     public async getStripePlans(locale: string, stripe: Stripe): Promise<any> {
//         try {
//             return Promise.all(
//                 [
//                 stripe.products.list({ active: true }),
//                 stripe.prices.list({})
//                 ]
//             ).then(stripeData => {
//                 let products: any = stripeData[0].data;
//                 let planPrices: any = stripeData[1].data;

//                 products.forEach((product: any) => {
//                     const filteredPlans = planPrices.filter((plan: any) => {
//                         return plan.product === product.id;
//                     });
//                     product.planPrices = filteredPlans[0];
//                 });

//                 return products;
//             }).then((products) => {
//                 let plans: any = [];

//                 products.forEach((product: any) => {
//                     plans.push({
//                         id: product.id,
//                         name: product.name,
//                         description: product.description,
//                         price: parseFloat(((product.planPrices.unit_amount) / 100).toFixed(2)),
//                         amount: product.planPrices.unit_amount,
//                         credits: parseInt(product.metadata.credits),
//                         recurring: (product.planPrices.type === "recurring") ? true : false,
//                         currency: product.planPrices.currency,
//                         price_id: product.planPrices.id
//                     });
//                 });

//                 return plans.sort((a: any, b: any) => {
//                     return a.price - b.price;
//                 });
//             });
//         } catch (err: any) {
//             throw new Error(ServerMessages.errorMsgLocale(locale, ServerMessagesEnum["stripe-plan-not-found"]));
//         }
//     }

//     public async getSubscriptionPlans(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[getSubscriptionPlans]";
//             const { locale } = req.query;
//             this.locale = (locale as string) || "en";

//             const { user_id } = req.user;
//             Logger.info(`${fileName + fn} user_id: ${user_id}`);

//             const userData: any = await this.userController.fetchUserDetails(user_id);
//             const stripe: any = await this.getStripe(userData);
//             let plans: { [key: string]: any[] } = {};
//             const stripePlans: any = await this.getStripePlans(this.locale, stripe);
//             plans["stripe"] = stripePlans;
//             plans["apple"] = [{
//                     "id": "one_user_mon_pack_in",
//                     "name": "Paid Account",
//                     "description": "₹ 399 | Monthly | User",
//                     "price": 399,
//                     "amount": 39900,
//                     "credits": 1,
//                     "recurring": true,
//                     "currency": "inr",
//                     "priceId": ""
//             }];

//             let billingInfo: any = await Billings.findOne({ subscriber_id: userData.activeSubscriber.id }).lean();
//             if (!billingInfo) {
//                 const customer = await stripe.customers.create({
//                     name: userData.activeSubscriber.subscriberFirmName,
//                     email: userData.email
//                 });
//                 billingInfo = await Billings.create({
//                     subscriber_id: userData.activeSubscriber.id,
//                     active_billing_gateway: BillingGatewayEnum.Stripe,
//                     stripe_id: customer.id,
//                 });
//             }

//             const customer: any = await stripe.customers.retrieve(billingInfo.stripe_id);

//             const data = {
//                 hasSubscription: !!billingInfo!.stripe_subscription_id,
//                 plans: plans,
//                 coupon_code: customer.discount?.coupon.id || ''
//             };

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "stripe-plans"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async getBillingInfo(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[getBillingInfo]";
//             const { locale } = req.query;
//             this.locale = (locale as string) || "en";

//             const { user_id } = req.user;
//             Logger.info(`${fileName + fn} user_id: ${user_id}`);

//             const userData: any = await this.userController.fetchUserDetails(user_id);
//             const billingInfo: any = await Billings.findOne({ subscriber_id: userData.activeSubscriber.id }).lean();

//             const data = {
//                 billingInfo: billingInfo.address,
//             };

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async getLifetimeSubscriptionQuantity(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[getBillingInfo]";
//             const { locale } = req.query;
//             this.locale = (locale as string) || "en";

//             const { user_id } = req.user;
//             const planId = req.context.params.planId;
//             Logger.info(`${fileName + fn} user_id: ${user_id}`);

//             const userData = await this.userController.fetchUserDetails(user_id);
//             const stripe = await this.getStripe(userData);
//             const stripePlan = await this.getStripePlans(this.locale, stripe);
//             const billingInfo: any = await Billings.findOne({ subscriber_id: userData.activeSubscriber.id }).lean();
//             const plan: any = stripePlan.find((p: any) => p.id == planId);
//             Logger.info (fn + "billing info:" +JSON.stringify(billingInfo));

//             const data = {
//                 quantity: billingInfo.life_quantity[plan.id] || 0
//             }

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async createStripeSession(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[createStripeSession]";
//             const { locale } = req.query;
//             this.locale = (locale as string) || "en";

//             const { user_id } = req.user;
//             Logger.info(`${fileName + fn} user_id: ${user_id}`);

//             const userData = await this.userController.fetchUserDetails(user_id);
//             const stripe = await this.getStripe(userData);
//             const stripePlan = await this.getStripePlans(this.locale, stripe);
//             let billingInfo: any = await Billings.findOne({ subscriber_id: userData.activeSubscriber.id }).lean();
//             if (!billingInfo) {
//                 const customer = await stripe.customers.create({
//                     name: userData.activeSubscriber.subscriberFirmName,
//                     email: userData.email
//                 });
//                 billingInfo = await Billings.create({
//                     subscriber_id: userData.activeSubscriber.id,
//                     active_billing_gateway: BillingGatewayEnum.Stripe,
//                     stripe_id: customer.id,
//                 });
//             } else {
//                 await Billings.findOneAndUpdate({ subscriber_id: userData.activeSubscriber.id }, { address: req.context.params.billingInfo });
//             }

//             const plan: any = stripePlan.find((p: any) => p.id == req.context.params.planId);

//             const session = await stripe.checkout.sessions.create({
//                 allow_promotion_codes: true,
//                 line_items: [{
//                     price: plan.priceId,
//                     quantity: parseInt(req.context.params.quantity) ?? 1,
//                 }],
//                 mode: plan.recurring ? 'subscription' : 'payment',
//                 success_url: "https://www.arkchat.com/stripe-success",
//                 cancel_url: "https://www.arkchat.com/stripe-cancel",
//                 client_reference_id: user_id + "-" + userData.activeSubscriber.id,
//                 customer: billingInfo.stripe_id,
//                 metadata: {
//                     planId: plan.planId,
//                     autoRenew: plan.recurring,
//                     userId: user_id,
//                     quantity: parseInt(req.context.params.quantity) ?? 1,
//                 }
//             });
//             const data = {
//                 session
//             };

//             Logger.info(fn + "session" + JSON.stringify(session));

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async getCustomerActiveSubscriptions(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[getCustomerActiveSubscriptions]";
//             const { locale } = req.query;
//             this.locale = (locale as string) || "en";

//             const { user_id } = req.user;
//             Logger.info(`${fileName + fn} user_id: ${user_id}`);

//             const userData = await this.userController.fetchUserDetails(user_id);
//             const stripe = await this.getStripe(userData);
//             const stripePlan = await this.getStripePlans(this.locale, stripe);

//             const billingInfo: any = await Billings.findOne({ subscriber_id: userData.activeSubscriber.id }).lean();
//             let plans: any = stripePlan.filter((p: any) => billingInfo.plan_ids.includes(p.id));

//             plans.forEach((p:any) => {
//                 if (p.recurring) {
//                     p.billedunits = billingInfo.subscription_users ?? 1;
//                     p.total_users = billingInfo.subscription_users
//                 } else {
//                     p.billedunits = (billingInfo.lifetime_users ?? 1) / p.units;
//                     p.total_users = billingInfo.life_quantity[p.id] * p.units;
//                 }
//             });

//             const data = { plans };

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async createStripeSubscription(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[createStripeSubscription]";
//             const { locale } = req.query;
//             this.locale = (locale as string) || "en";
//             const planId = req.context.params.planId
//             const autoRenew = req.context.params.autoRenew || false;
//             const coupon_code = req.context.params.coupon_code || null;

//             const { user_id } = req.user;
//             Logger.info(`${fileName + fn} user_id: ${user_id}`);

//             const userData = await this.userController.fetchUserDetails(user_id);
//             const stripe = await this.getStripe(userData);
//             const stripePlan = await this.getStripePlans(this.locale, stripe);

//             let billingInfo: any = await Billings.findOne({ subscriber_id: userData.activeSubscriber.id }).lean();

//             if (!billingInfo) {
//                 const customer = await stripe.customers.create({
//                     name: userData.activeSubscriber.subscriberFirmName,
//                     email: userData.email
//                 });
//                 billingInfo = await Billings.create({
//                     subscriber_id: userData.activeSubscriber.id,
//                     active_billing_gateway: BillingGatewayEnum.Stripe,
//                     stripe_id: customer.id,
//                 });
//             } else {
//                 await Billings.findOneAndUpdate({subscriber_id: userData.activeSubscriber.id}, {address: req.context.params.billingInfo});
//                 const {city, countryCode, zipcode, addressLine1, addressLine2="", name, taxNumber="" } = req.context.params.billingInfo;
//                 await stripe.customers.update(billingInfo.stripe_id,{
//                     address: {
//                         city,
//                         country: countryCode,
//                         line1: addressLine1,
//                         line2: addressLine2,
//                         postal_code: zipcode
//                     },
//                     shipping: {
//                         name: name,
//                         address: {
//                             city,
//                             country: countryCode,
//                             line1: addressLine1,
//                             line2: addressLine2,
//                             postal_code: zipcode
//                         }
//                     },
//                     invoice_settings: {
//                         footer: `GST Number: ${taxNumber}`,
//                     },
//                 })
//             }

//             Logger.info(fn + "billinfInfo: " + JSON.stringify(billingInfo));
//             const plan: any = stripePlan.find((p: any) => p.id == planId);

//             const checkoutObject: any = {
//                 customer: billingInfo.stripe_id,
//                 items: [{
//                     price: plan.priceId
//                 }],
//                 payment_behavior: 'default_incomplete',
//                 payment_settings: { save_default_payment_method: 'on_subscription' },
//                 metadata: {
//                     userId: user_id,
//                     planId: plan.id,
//                     autoRenew: autoRenew,
//                     subscriberId: userData.activeSubscriber.id,
//                     receipt_email: userData.email
//                 },
//                 expand: ['latest_invoice.payment_intent']
//             }

//             // if (userData.country_code == 'IN') {
//             //     checkoutObject["default_tax_rates"] = [process.env.in_tax_id]
//             // }

//             if (coupon_code) {
//                 try {
//                     const coupon = await stripe.coupons.retrieve(coupon_code);
//                     if (coupon) {
//                         checkoutObject.coupon = coupon_code;
//                     }
//                 } catch (err) {
//                     throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["coupon-code-is-invalid"]));
//                 }
//             }

//             const subscription: any = await stripe.subscriptions.create(checkoutObject);
//             const data = {
//                 subscriptionId: subscription.id,
//                 secret: subscription.latest_invoice.payment_intent.client_secret, //paymentIntent.client_secret,
//                 customer: subscription.customer
//             };
//             Logger.info(fn + "session" + JSON.stringify(data));

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async createOneTimePayment(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[createOneTimePayment]";
//             const { locale } = req.query;
//             this.locale = (locale as string) || "en";
//             const quantity = req.context.params.quantity || 1;
//             const planId = req.context.params.planId;
//             const coupon_code = req.context.params.coupon_code || null;

//             const { user_id } = req.user;
//             Logger.info(`${fileName + fn} user_id: ${user_id}`);

//             const userData = await this.userController.fetchUserDetails(user_id);
//             const stripe = await this.getStripe(userData);
//             const stripePlan = await this.getStripePlans(this.locale, stripe);

//             let billingInfo: any = await Billings.findOne({ subscriber_id: userData.activeSubscriber.id }).lean();

//             if (!billingInfo) {
//                 const customer = await stripe.customers.create({
//                     name: userData.activeSubscriber.subscriberFirmName,
//                     email: userData.email
//                 });
//                 billingInfo = await Billings.create({
//                     subscriber_id: userData.activeSubscriber.id,
//                     active_billing_gateway: BillingGatewayEnum.Stripe,
//                     stripe_id: customer.id,
//                 });
//             } else {
//                 await Billings.findOneAndUpdate({subscriber_id: userData.activeSubscriber.id},{address: req.context.params.billingInfo});
//                 const {city, countryCode, zipcode, addressLine1, addressLine2="", name, taxNumber="" } = req.context.params.billingInfo;
//                 await stripe.customers.update(billingInfo.stripe_id, {
//                     address: {
//                         city,
//                         country: countryCode,
//                         line1: addressLine1,
//                         line2: addressLine2,
//                         postal_code: zipcode
//                     },
//                     shipping: {
//                         name: name,
//                         address: {
//                             city,
//                             country: countryCode,
//                             line1: addressLine1,
//                             line2: addressLine2,
//                             postal_code: zipcode
//                         }
//                     },
//                     invoice_settings: {
//                         footer: `GST Number: ${taxNumber}`,
//                     },
//                 })
//             }

//             const plan: any = stripePlan.find((p: any) => p.id == planId);
//             let amount = plan.amount;
//             Logger.info (fn + "billing info:" +JSON.stringify(billingInfo));
//             const stripeCustomer: any = await stripe.customers.retrieve(billingInfo.stripe_id);

//             if ((billingInfo.life_quantity[plan.id] && billingInfo.life_quantity[plan.id] + parseInt(quantity) > 5) || parseInt(quantity) > 5) {
//                 return serverResponse(res, HttpCodeEnum.OK, "Invalid Quantity", {message: "You cannot buy more than 5 quantities in a lifetime plan"});
//             }

//             if (stripeCustomer.discount.coupon || coupon_code) {
//                 try {
//                     const coupon_id = coupon_code || stripeCustomer.discount.coupon.id;
//                     const coupon: any = await stripe.coupons.retrieve(coupon_id);
//                     if(coupon) {
//                         amount = amount - (coupon.percent_off/100)*amount;
//                     }
//                 } catch (err) {
//                     if (coupon_code) throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["coupon-code-is-invalid"]));
//                     else Logger.error(fn + err);
//                 }
//             }

//             // if (userData.country_code == 'IN') {
//             //     amount += (18/100)*amount
//             // }

//             const paymentIntent: any = await stripe.paymentIntents.create({
//                 customer: billingInfo.stripe_id,
//                 amount: amount,
//                 automatic_payment_methods:{
//                     enabled: true,
//                 },
//                 currency: plan.currency,
//                 metadata: {
//                     planId,
//                     userId: user_id,
//                     quantity,
//                     receipt_email: userData.email
//                 },
//                 receipt_email: userData.email
//             });
//             const ephemeralKey = await stripe.ephemeralKeys.create( 
//                 { customer: billingInfo.stripe_id }, 
//                 { apiVersion: '2022-11-15' }
//             );

//             const data = {
//                 paymentIntent,
//                 ephemeralKey: ephemeralKey.secret,
//                 secret: paymentIntent.client_secret,
//                 customer: paymentIntent.customer,
//                 stripeCustomer
//             };

//             Logger.info(fn + "data" + JSON.stringify(data));

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async cancelCustomerSubscription(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[cancelCustomerSubscription]";
//             const { locale } = req.query;
//             this.locale = (locale as string) || "en";

//             const { user_id } = req.user;
//             Logger.info(`${fileName + fn} user_id: ${user_id}`);

//             const userData = await this.userController.fetchUserDetails(user_id);
//             const stripe = await this.getStripe(userData);
//             const stripePlan = await this.getStripePlans(this.locale, stripe);

//             const billingInfo: any = await Billings.findOne({ active: true, subscriber_id: userData.activeSubscriber.id }).lean();
//             if (billingInfo.stripe_subscription_id) {
//                 await stripe.subscriptions.cancel(billingInfo.stripe_subscription_id);
//             }

//             const plan_ids = (billingInfo.plan_ids ?? []).filter((e : String) => !e.includes('mon'));

//             Logger.info(fn + ' plan_ids: ' + plan_ids);
//             await Billings.findOneAndUpdate({ subscriber_id: userData.activeSubscriber.id },
//                 {
//                     active: plan_ids.length ? true: false,
//                     stripe_subscription_id: '',
//                     subscription_users: 0,
//                     total_users: billingInfo.lifetime_users,
//                     auto_renew: false,
//                     plan_ids: plan_ids,
//                     source_subscriber_id: 0,
//                     credits_consumed: 0,
//                     cancel_reason: req.context.params.cancelReason
//                 });

//             //Credit Exhaustion Logic
//             await Permissons.findOneAndUpdate({
//                     subscriber_id: billingInfo.subscriber_id,
//                     is_credit_allocated: true,
//                     invite_type: { $ne: UserInviteType.External }
//                 }, {is_credit_allocated: false});

//             // Cancel Subscription for External Subscriber
//             const externalBilling = await Billings.find({
//                     source_subscriber_id: billingInfo.subscriber_id,
//                     subscriber_id: { $ne: billingInfo.subscriber_id }
//                 }).lean();

//             for (const billing of externalBilling) {
//                 await Billings.findOneAndUpdate({subscriber_id: billing.subscriber_id},
//                     {
//                         active: billing.plan_ids.length ? true: false,
//                         stripe_subscription_id: '',   
//                         subscription_users: 0,
//                         auto_renew: false,
//                         total_users: billing.lifetime_users,
//                         credits_consumed: 0,
//                         source_subscriber_id: 0,
//                     });

//                 //Credit Exhaustion Logic

//                 await Permissons.findOneAndUpdate({
//                         subscriber_id: billing.subscriber_id,
//                         is_credit_allocated: true,
//                         invite_type: { $ne: UserInviteType.External }
//                     },{is_credit_allocated: false});
//             }

//             const data = {};

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale,"stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async checkStripeSubscriptions(req: Request, res: Response): Promise<any> {
//         try {
            
//             const billings = await Billings.find({
//                     stripe_subscription_id: {
//                         $not: ''
//                     },
//                     active: true,
//                     activated_on: {
//                         $not: null,
//                     },
//                 //    $and: literal("CURRENT_DATE > activated_on + 30 * INTERVAL '1 DAY'") // need mongoose rework
//                 }).lean();

//             const in_stripe = new Stripe(process.env.STRIPE_KEY_IN!, {
//                 apiVersion: "2022-11-15",
//             });

//             const global_stripe = new Stripe(process.env.STRIPE_KEY!, {
//                 apiVersion: "2022-11-15",
//             });

//             const in_subscriptions: any = await in_stripe.subscriptions.list({
//                 status: "all"
//             });

//             const global_subscriptions: any = await global_stripe.subscriptions.list({
//                 status: "all"
//             });
            
//             for (const billing of billings) {
//                 Logger.info("checkStripeSubscriptions: checking for : " + JSON.stringify(billing));

//                 let existingSubscription: any = null;

//                 const userData: any = {};
//                 if (billing.currency_code == "INR") {
//                     userData.country_code = "IN"
//                     existingSubscription = in_subscriptions.data.find((sub: any)=>sub.id===billing.stripe_subscription_id);

//                 } else {
//                     userData.country_code = "OTHER";
//                     existingSubscription = global_subscriptions.data.find((sub: any)=>sub.id===billing.stripe_subscription_id);
//                 }
//                 const stripe = await this.getStripe(userData);
                
//                 Logger.info("checkStripeSubscriptions: existing subscription : " + JSON.stringify(existingSubscription));
//                 if (existingSubscription?.status === 'canceled' || existingSubscription === null) {
//                     // cancel subscription
//                     Logger.info("checkStripeSubscriptions: cancel subscription : " + billing.stripe_subscription_id);
//                     try {
//                         await stripe.subscriptions.cancel(billing.stripe_subscription_id);
//                     } catch (err) {
//                         Logger.error("checkStripeSubscriptions: error" + err);
//                     }
                    
//                     const plan_ids = (billing.plan_ids ?? []).filter((e : String) => !e.includes('mon'));
//                     Logger.info("checkStripeSubscriptions: billing" + JSON.stringify(billing));
//                     await Billings.findOneAndUpdate({ subscriber_id: billing.subscriber_id },
//                         {
//                             active: plan_ids.length ? true: false,
//                             stripe_subscription_id: '',   
//                             subscription_users: 0,
//                             auto_renew: false,
//                             total_users: billing.lifetime_users,
//                             plan_ids: plan_ids,
//                             credits_consumed: 0,
//                             source_subscriber_id: 0,
//                             cancel_reason: 'AUTO: Subscription Expired'
//                         });

//                     //Credit Exhaustion Logic
//                     await Permissons.findOneAndUpdate({
//                             subscriber_id: billing.subscriber_id,
//                             is_credit_allocated: true,
//                             invite_type: { $ne: UserInviteType.External }
//                         },
//                         {is_credit_allocated: false});
//                 }
//             }

//             const data = {};

//             return serverResponse(res, HttpCodeEnum.OK, "Checking Stripe Subscriptions Successful", data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async stripeWebhookUk(req: Request, res: Response): Promise<any> {
//         try {
//             const event = req.context.params;

//             // Handle the event
//             switch (event.type) {
//                 case 'payment_intent.succeeded':
//                     const payment_intent_succeeded = event.data.object;
//                     // Then define and call a function to handle the event payment_intent.succeeded
//                     await this.processStripeEvent(payment_intent_succeeded, true);
//                     break;
//                 // ... handle other event types
//                 default:
//                     Logger.error(`Unhandled event type ${event.type}`);
//             }

//             const data = {};

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale,"stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async stripeWebhookIndia(req: Request, res: Response): Promise<any> {
//         try {
//             // const endpointSecret = "whsec_BqR7AirpBeMV7yuBlin3GLXzVxmleorM";
//             // const sig = req.headers['stripe-signature'] ?? '';
//             // const stripe = new Stripe(process.env.STRIPE_KEY_IN || '', {
//             //     apiVersion: "2022-11-15",
//             // });
//             // const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//             const event = req.context.params;

//             // Handle the event
//             switch (event.type) {
//                 case 'payment_intent.succeeded':
//                     const payment_intent_succeeeded = event.data.object;
//                     // Then define and call a function to handle the event payment_intent.succeeded
//                     await this.processStripeEvent(payment_intent_succeeeded, false);
//                     break;true
//                 // ... handle other event types
//                 default:
//                     Logger.error(`Unhandled event type ${event.type}`);
//             }

//             const data = {};

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale,"stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     private async processStripeEvent(stripeEvent: any, isUkWebhook: boolean) {
//         Logger.info("processStripeEvent: event data: " + JSON.stringify(stripeEvent));
        
//         const userId = stripeEvent.metadata.userId;
//         const planId = stripeEvent.metadata.planId;
//         const autoRenew = stripeEvent.metadata.autoRenew;
//         const quantity = stripeEvent.metadata.quantity;
//         Logger.info("processStripeEvent: stripeEvent: " + stripeEvent);
//         Logger.info("processStripeEvent: planId: " + planId);
//         Logger.info("processStripeEvent: autoRenew: " + autoRenew);

//         const userData = await this.userController.fetchUserDetails(userId);
//         const stripe = await this.getStripe(userData);
//         const stripePlan = await this.getStripePlans(this.locale, stripe);

//         const plan: any = stripePlan.find((p: any) => p.id == planId);
//         Logger.info("processStripeEvent: plan: " + JSON.stringify(plan));

//         const billingInfo: any = await Billings.findOne({ subscriber_id: userData.activeSubscriber.id }).lean();

//         let lifetime_users = billingInfo.lifetime_users + (plan.recurring ? 0 : plan.credits);
//         let subscription_users = plan.recurring ? plan.credits : billingInfo.subscription_users;
//         let plan_ids: any = billingInfo.plan_ids;
//         let stripe_subscription_id = billingInfo.stripe_subscription_id;

//         if (plan.monthly && (stripe_subscription_id !== stripeEvent.metadata.subscription)) {
//             if (stripe_subscription_id) {
//                 Logger.info("cancelStripesubscription: stripe_subscription_id: " + stripe_subscription_id);
//                 if (billingInfo.source_subscriber_id === userData.activeSubscriber.id) {
//                     try {
//                         Logger.info("processStripeEvent: Cancel Existing subscription");
//                         await stripe.subscriptions.cancel(stripe_subscription_id);
//                     } catch (error) {
//                         Logger.error(error);
//                     }
//                 }
//                 plan_ids = (billingInfo.plan_ids ?? []).filter((e : String) => !e.includes('mon'));
//                 Logger.info("cancelStripesubscription: plan_ids:"+ plan_ids);
//             }
//             stripe_subscription_id = stripeEvent.metadata.subscription;
//         }

//         if (!plan_ids.includes(plan.id)) {
//             plan_ids.push(plan.id);
//         }
//         Logger.info("updatedStripesubscription: plan_ids:"+ plan_ids);
//         const data: any = {
//             plan_ids: plan_ids,
//             currency_code: plan.currency,
//             lifetime_users: lifetime_users,
//             subscription_users: subscription_users,
//             total_users: subscription_users + lifetime_users,
//             stripe_subscription_id: stripe_subscription_id,
//             apple_subscription_id: '',
//             source_subscriber_id: userData.activeSubscriber.id,
//             active: true,
//             auto_renew: autoRenew,
//             credits_consumed: 0,
//             activated_on: new Date()
//         };

//         if (plan.onetime) {
//             data.life_quantity = {
//                 ...billingInfo.life_quantity,
//                 [plan.id]: billingInfo.life_quantity[plan.id] ? parseInt(billingInfo.life_quantity[plan.id]) + parseInt(quantity) : parseInt(quantity) 
//             }
//             delete data.activated_on;
//             delete data.stripe_subscription;
//             delete data.source_subscriber_id;
//             delete data.credits_consumed;
//             delete data.apple_subscription_id;
//         }


//         await Billings.findOneAndUpdate({subscriber_id: userData.activeSubscriber.id},data);

//         await Permissons.findOneAndUpdate({
//                 subscriber_id: billingInfo.subscriber_id,
//                 is_credit_allocated: true,
//                 invite_type: { $ne: UserInviteType.External }},
//                 {is_credit_allocated: false});

//         if (plan.recurring) {

//             if (billingInfo?.source_subscriber_id && billingInfo?.source_subscriber_id !== userData.activeSubscriber.id) {
//                 const credit = billingInfo?.subscription_users?-Math.abs(billingInfo?.subscription_users): 0;
//                 await Billings.findOneAndUpdate({subscriber_id: billingInfo?.source_subscriber_id}, {$inc : { 'credits_consumed' : credit}}).exec();
//             }

//             // Cancel Subscription for External Subscriber

//             const externalBilling = await Billings.find({
//                 where: {
//                     source_subscriber_id: billingInfo.subscriber_id,
//                     subscriber_id: { $ne: billingInfo.subscriber_id }
//                 }
//             })

//             for (const billing of externalBilling) {
//                 await Billings.findOneAndUpdate({subscriber_id: billing.subscriber_id},
//                     {
//                         active: billing.plan_ids.length ? true: false,
//                         stripe_subscription_id: '',
//                         subscription_users: 0,
//                         auto_renew: false,
//                         total_users: billing.lifetime_users,
//                         credits_consumed: 0,
//                         source_subscriber_id: 0,
//                     });

//                 //Credit Exhaustion Logic

//                 await Permissons.findOneAndUpdate({
//                         subscriber_id: billing.subscriber_id,
//                         is_credit_allocated: true,
//                         invite_type: { $ne: UserInviteType.External }
//                     },{is_credit_allocated: false});
//             }
//         }
//     }

//     public async checkAppleSubscriptions(req: Request, res: Response): Promise<any> {
//         try {
//             const privateKey = fs.readFileSync("src/controllers/payment/SubscriptionKey_SF7LCUW27R.p8")
//             const apiKeyId = "DGYN6WTB4P"
//             const issuerId = "7db380ca-2e5a-48e1-b7ff-2a94f584a0d4"
//             let now = Math.round((new Date()).getTime() / 1000); 
//             let nowPlus20 = now + 2399

//             let payload = {
//                 "iss": issuerId,
//                 "iat": now,
//                 "bid": "com.arkchat",
//                 "exp": nowPlus20,
//                 "aud": "appstoreconnect-v1"
//             }

//             let signOptions: any = {
//                 "algorithm": "ES256", // you must use this algorythm, not jsonwebtoken's default
//                 header : {
//                     "alg": "ES256",
//                     "kid": apiKeyId,
//                     "typ": "JWT"
//                 }
//             };

//             const token = JWT.sign(payload, privateKey, signOptions);
//             console.log('@token: ', token);

//             const headers = {
//                 Authorization: "Bearer " + token
//             };

//             let url = process.env.NODE_ENV === "production" ? "https://api.storekit.itunes.apple.com/inApps/v1/subscriptions" : "https://api.storekit-sandbox.itunes.apple.com/inApps/v1/subscriptions";
            
//             const billings = await Billings.find({
//                     apple_subscription_id: {
//                         $not: ''
//                     },
//                     active: true,
//                     activated_on: {
//                         $not: null,
//                     },
//                     // $and: literal("CURRENT_DATE > activated_on + 30 * INTERVAL '1 DAY'") // need mongoose rework
//                 }).lean();

//             for (const billing of billings) {
//                 Logger.info("checkAppleSubscriptions: checking for : " + JSON.stringify(billing));

//                 const existingSubscription = await networkRequest("GET", url+`/${billing.apple_subscription_id}`, {}, headers);
//                 Logger.info("checkStripeSubscriptions: existing subscription : " + JSON.stringify(existingSubscription.data.data));
//                 if (existingSubscription.data.data[0].lastTransactions[0].status != 1) {
//                     // cancel subscription
//                     Logger.info("checkAppleSubscriptions: cancel subscription : " + billing.stripe_subscription_id);
                    
//                     const plan_ids = (billing.plan_ids ?? []).filter((e : String) => !e.includes('mon'));
//                     Logger.info("checkAppleSubscriptions: billing" + JSON.stringify(billing));

//                     await Billings.findOneAndUpdate({subscriber_id: billing.subscriber_id},
//                         {
//                             active: plan_ids.length ? true: false,
//                             stripe_subscription_id: '',
//                             source_subscriber_id: 0,
//                             apple_subscription_id: '',
//                             subscription_users: 0,
//                             total_users: billing.lifetime_users,
//                             credits_consumed: 0,
//                             auto_renew: false,
//                             plan_ids: plan_ids,
//                             cancel_reason: 'AUTO: Subscription Expired'
//                         });

//                     //Credit Exhaustion Logic

//                     await Permissons.findOneAndUpdate({
//                             subscriber_id: billing.subscriber_id,
//                             is_credit_allocated: true,
//                             invite_type: { $ne: UserInviteType.External }
//                         },
//                         {is_credit_allocated: false});
//                 }
//             }

//             const data = {};

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale,"stripe-payment-sheet"), data);
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async verifyAppStorePurchase(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[verifyAppStorePurchase]";
//             const { user_id } = req.user;
//             Logger.info(`${fileName + fn} user_id: ${user_id}`);
//             const quantity = req.context.params.quantity || 1;
//             const planId = req.context.params.productId;
//             const userData = await this.userController.fetchUserDetails(user_id);
//             const stripe = await this.getStripe(userData);
//             const stripePlan = await this.getStripePlans(this.locale, stripe);
//             const plan: any = stripePlan.find((p: any) => p.id == planId);
//             // const plan: any = userData.country_code != "IN" ? ukPlans.find((p) => p.iosProductId == planId)! : inPlans.find((p) => p.iosProductId == planId)!; 
//             Logger.info("verifyAppStorePurchase: planId:" + planId);
//             Logger.info("verifyAppStorePurchase: plan:" + plan);
//             const billingInfo: any = await Billings.findOne({
//                 where: {
//                     subscriber_id: userData.activeSubscriber.id,
//                 },
//                 raw: true
//             });
            
//             let url = process.env.NODE_ENV === "production" ? "https://buy.itunes.apple.com/verifyReceipt" : "https://sandbox.itunes.apple.com/verifyReceipt";
            
//             const response = (await axios.post(url, {
//                 "receipt-data": req.context.params.verificationData,
//                 "password": "b1ab693048e042be844b0ad803b76d52",
//                 "exclude-old-transactions": true,
//             })).data;

//             Logger.info("verifyAppStorePurchase: response: " + JSON.stringify(response));

//             const newUsers = quantity * plan.units;
//             let lifetime_users = billingInfo!.lifetime_users + (plan.onetime ? newUsers : 0);
//             let subscription_users = plan.monthly ? newUsers : billingInfo!.subscription_users;
            
//             if (response.status === 0 && response.latest_receipt_info.length 
//                 && response.latest_receipt_info[0].product_id == req.context.params.productId 
//                 && response.latest_receipt_info[0].in_app_ownership_type == "PURCHASED") {
//                     let plan_ids = billingInfo!.plan_ids;

//                     if (plan.monthly) {
//                         plan_ids = (billingInfo!.plan_ids ?? []).filter((e : String) => !e.includes('mon'));
//                     }
            
//                     if (!plan_ids.includes(plan.id)) {
//                         plan_ids.push(plan.id);
//                     }  
            
//                     const data: any = {
//                         plan_ids: plan_ids,
//                         currency_code: plan.currency,
//                         lifetime_users: lifetime_users,
//                         subscription_users: subscription_users,
//                         apple_subscription_id: response.latest_receipt_info[0].original_transaction_id, 
//                         stripe_subscription_id: "",  
//                         total_users: subscription_users + lifetime_users,
//                         active_billing_gateway: BillingGatewayEnum.Apple,
//                         source_subscriber_id: userData.activeSubscriber.id,
//                         active: true,
//                         auto_renew: true,
//                         credits_consumed: 0,
//                         activated_on: new Date()
//                     };
            
//                     if (plan.onetime) {
//                         data.life_quantity = {
//                             ...billingInfo.life_quantity,
//                             [plan.id]: billingInfo.life_quantity[plan.id] ? parseInt(billingInfo.life_quantity[plan.id]) + parseInt(quantity) : parseInt(quantity)
//                         }
//                         delete data.activated_on;
//                         delete data.apple_subscription_id;
//                         delete data.source_subscriber_id;
//                         delete data.credits_consumed;
//                     }
            
//                     Logger.info("verifyAppStorePurchase: userData: " + JSON.stringify(userData));
//                     await Billings.findOneAndUpdate({subscriber_id: userData.activeSubscriber.id}, data);

//                     await Permissons.findOneAndUpdate({
//                             subscriber_id: billingInfo.subscriber_id,
//                             is_credit_allocated: true,
//                             invite_type: { $ne: UserInviteType.External }
//                         },{is_credit_allocated: false});

//                     if (plan.monthly) {
//                         // Cancel Subscription for External Subscriber
//                         const externalBilling = await Billings.find({
//                             where: {
//                                 source_subscriber_id: billingInfo.subscriber_id,
//                                 subscriber_id: { $ne: billingInfo.subscriber_id }
//                             }
//                         })
            
//                         for (const billing of externalBilling) {
//                             await Billings.findOneAndUpdate({subscriber_id: billing.subscriber_id},
//                                 {
//                                     active: billing.plan_ids.length ? true: false,
//                                     stripe_subscription_id: '',   
//                                     subscription_users: 0,
//                                     auto_renew: false,
//                                     total_users: billing.lifetime_users,
//                                     credits_consumed: 0,
//                                     source_subscriber_id: 0,
//                                 });
            
//                             //Credit Exhaustion Logic
//                             await Permissons.findOneAndUpdate({
//                                     subscriber_id: billing.subscriber_id,
//                                     is_credit_allocated: true,
//                                     invite_type: { $ne: UserInviteType.External }
//                                 },{is_credit_allocated: false});
//                         }
//                     }
//             }

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "stripe-payment-sheet"), { paymentStatus : response.status === 0 && response.latest_receipt_info.length ? true : false} );
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

//     public async paymentWebhook(req: Request, res: Response): Promise<any> {
//         try {
//             const fn = "[paymentWebhook]";
//             Logger.info("Request Body:" + JSON.stringify(req.body));
//             Logger.info("Request Params:" + JSON.stringify(req.context.params));
//             let stream = fs.createWriteStream("data.json", {flags:'a'});
//             stream.write(JSON.stringify(req.context.params) + "\n\n");
//             stream.write("............/´¯¯/)\n..........,/¯.../\n........../..../\n....../´¯/'..'/´¯¯`·¸\n../'/.../..../....../¨¯\\\n.('(....´...´... ¯~/'..')\n..\..............'...../\n...\....\.........._.·´\n....\..............(\n.....\..............\\\n\n");
//             stream.end();

//             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "stripe-payment-sheet"), {});
//         } catch (err: any) {
//             return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
//         }
//     }

// }
