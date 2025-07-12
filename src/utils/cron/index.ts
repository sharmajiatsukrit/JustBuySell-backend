import { Response, Request } from "express";
import cron from 'node-cron';
import CronController from "../../controllers/cron"
const cronController = new CronController();

//set Timing send write function in cron Controller 0 1 1 * *
// cron.schedule('* * * * *', cronController.renewCouponBalance);
cron.schedule('* * * * *', cronController.updateExpiredOffers);
cron.schedule('* * * * *', cronController.generateInvoice);

