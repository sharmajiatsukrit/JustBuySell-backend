import Stripe from "stripe";
import { User } from "../../models";

export class StripeUtil {

    constructor() {
        if (!process.env.STRIPE_KEY) {
            return process.exit();
        }
    }

    static async getStripe(user: any): Promise<Stripe> {
        // if (user.country_code === "IN") {
        //     const stripe = new Stripe(process.env.STRIPE_KEY_IN!, {
        //         apiVersion: "2022-11-15",
        //     });
        //     return stripe;
        // }
        const stripe = new Stripe(process.env.STRIPE_KEY!, {
            apiVersion: "2022-11-15",
        });
        return stripe;
    }

    public async createCustomer(userData: any, subscriberFirmName: string): Promise<Stripe.Response<Stripe.Customer>> {
        const stripe = await StripeUtil.getStripe(userData);
        const respData = await stripe.customers.create({
            name: subscriberFirmName,
            email: userData.email,
            shipping: {
                name: userData.first_name,
                address: {
                  city: userData.city,
                  country: userData.country_code,
                }
            }
        });
        return respData;
    }
}
