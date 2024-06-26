import { SES } from "aws-sdk";
import Logger from "../logger";

const awsConfig = {
    accessKeyId: "",
    secretAccessKey: "",
    region: "",
};

export default class EmailService {
    private AWS;

    constructor() {
        this.AWS = new SES(awsConfig);
    }

    public async sendEmail(emailId: string, subject: string, body: string): Promise<any> {
        const params = {
            Source: "JustBuySell<noreply@justbuysell.com>",
            Destination: {
                ToAddresses: [emailId],
            },
            ReplyToAddresses: ["noreply@justbuysell.com"],
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: body,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: subject,
                },
            },
        };

        return this.AWS.sendEmail(params).promise();
    }

    public async otpEmail(emailId: string, otp: number): Promise<any> {
        const subject = "OTP for email verification";
        const body = `Please use the following OTP to verify your email ID.<br><br><br>OTP: ${otp}<br><br><br>Cheers,<br>Team justbuysell<br><br>This email was sent because you have signed up to justbuysell on its website or after downloading the justbuysell app. You have also accepted justbuysell terms of service which permits us to send you important justbuysell-related communications`;

        Logger.info("otpEmail Please use following OTP: " + otp)

        return this.sendEmail(emailId, subject, body);
    }

    public async newSignUpEmail(emailId: any, data: any): Promise<any> {
        const subject = "New Signup on JustBuySell";
        const body = `Sign up Number: ${data.count}<br>Signup date: ${data.created_at}<br>Device: ${data.device}<br>Subscriber Name: ${data.subscriber_firm_name}<br> User Name: ${data.user_name}<br>Account Type: ${data.subscriber_account_type}<br>Priority: ${data.subscriber_priority}<br>City: ${data.city}<br>Country: ${data.country}`;

        return this.sendEmail(emailId, subject, body);
    }

}
