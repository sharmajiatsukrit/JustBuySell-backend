import { Response, Request } from "express";
import cron from 'node-cron';
import CronController from "../../controllers/cron"
const cronController = new CronController();

//set Timing send write function in cron Controller 0 1 1 * *
// cron.schedule('* * * * *', cronController.renewCouponBalance);
// cron.schedule('*/5 * * * * *', cronController.updateExpiredOffers);
cron.schedule('* * * * *', cronController.generateInvoice); // for running every min
// cron.schedule('0 0 1 * *', cronController.generateInvoice); // for running every month's 1st.

//  cron.schedule('* * * * *', cronController.expirePromoAmount); // for running every min
// cron.schedule('0 0 * * *', cronController.expirePromoAmount);
