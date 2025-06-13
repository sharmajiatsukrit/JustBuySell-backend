
// import twilio from "twilio";
import nodemailer, { Transporter } from 'nodemailer';
const MFROM = process.env.MFROM || "MFROM";
const MHOST = process.env.MHOST || "MHOST";
const MUSER = process.env.MUSER || "MUSER";
const MPASS = process.env.MPASS || "MPASS";
const MPORT = process.env.MPORT || "MPORT";



/**
 * Send a WhatsApp notification using Twilio
 * @param to - Recipient's WhatsApp number in E.164 format (e.g., 'whatsapp:+1234567890')
 * @param message - Message to send
 */
async function sendMail(to: string,subject:string, html: string,attachment:[]): Promise<any> {
    try {

        const mailConfig:any =  {
            pool: false,
            name: "",
            host: MHOST,
            port: MPORT,
            secure: false,
            auth: {
              user: MUSER,
              pass: MPASS,
            },
            tls: {
              rejectUnauthorized: false,
            },
            // use up to 5 parallel connections
            maxConnections: 5,
            // do not send more than 10 messages per connection
            maxMessages: 50,
            // no not send more than 5 messages in a second
            rateLimit: 5,
            // debug: true,
            logger: true,
          }

        let transporter = nodemailer.createTransport(mailConfig);
        await transporter.sendMail(
            {
              to: to,
              from: MFROM,
              subject: subject,
              html: html,
              attachments: attachment,
            },
            (error, info) => {
              if (error) {
                return false;
              }
              return true;
            }
          );
        // return response;
    } catch (error: any) {
        console.error("Error Sending Emails Message:", error.message);
        throw error;
    }
}



export { sendMail };
