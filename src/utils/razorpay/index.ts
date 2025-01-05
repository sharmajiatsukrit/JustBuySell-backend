import Razorpay from "razorpay";

export class RazorpayUtil {
    private static instance: Razorpay | null = null;

    private constructor() {}

    private static getInstance(): Razorpay {
        if (!RazorpayUtil.instance) {
            RazorpayUtil.instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID!,
                key_secret: process.env.RAZORPAY_KEY_SECRET!,
            });
        }
        return RazorpayUtil.instance;
    }

    /**
     * Create a new Razorpay order.
     * @param amount - Amount in the smallest currency unit (e.g., paise for INR).
     * @param currency - Currency code (e.g., "INR").
     * @param receipt - A unique identifier for the order.
     */
    static async createOrder(amount: number, currency: string = "INR", receipt: string) {
        try {
            const razorpayInstance = RazorpayUtil.getInstance();
            const order = await razorpayInstance.orders.create({
                amount,
                currency,
                receipt,
            });
            return order;
        } catch (error) {
            throw new Error(`Error creating Razorpay order: ${(error as Error).message}`);
        }
    }

    /**
     * Capture a Razorpay payment.
     * @param paymentId - The ID of the payment to capture.
     * @param amount - The amount to capture, in the smallest currency unit.
     * @param currency - The currency in which the payment was made (e.g., "INR").
     */
    static async capturePayment(paymentId: string, amount: number, currency: string = "INR") {
        try {
            const razorpayInstance = RazorpayUtil.getInstance();
            const payment = await razorpayInstance.payments.capture(paymentId, amount, currency);
            return payment;
        } catch (error) {
            console.log(error);
            throw new Error(`Error capturing Razorpay payment: ${error}`);
        }
    }

    /**
     * Verify the signature of a Razorpay webhook or payment.
     * @param body - The request body as a string.
     * @param signature - The Razorpay signature from the headers.
     */
    static verifySignature(body: string, signature: string) {
        try {
            const crypto = require("crypto");
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
                .update(body.toString())
                .digest("hex");

            return expectedSignature === signature;
        } catch (error) {
            throw new Error(`Error verifying Razorpay signature: ${(error as Error).message}`);
        }
    }
}
