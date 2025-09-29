import { title } from "process";
import { triggerNotifications } from "..";
import NotificationTemplate from "../../models/notification-template";
import { sendMail } from "../mail";
import { sendSMS } from "../pinnacle";
import { body } from "express-validator";
import WhatsAppService from "../whatsApp-notification";
const whatsappService = new WhatsAppService();

export async function handleTriggerNotification(data: any) {
    if (data?.is_sms) {
        const { phone, smsContent, dlttempid = "1107175050790786232" } = data;
        console.log(data, "yes", phone, smsContent, dlttempid);
        const mess = await sendSMS(phone, smsContent, dlttempid);
    }
    if (data?.is_email) {
        const { email, subject, emailContent } = data;
        const mail = await sendMail(email, subject, emailContent, []);
    }
    if (data?.is_whatsapp) {
        const { destination, userName, campaignName, templateParams } = data;
        await whatsappService.sendWhatsApp(destination, userName, campaignName, templateParams)
    }
    if (data?.is_firebase) {
        const { title, body, to } = data;
        try {
            await triggerNotifications(title, body, to);
        } catch (error) {
            console.log(error);
        }
    }
}
// {
//   _id: new ObjectId("6883a2d8819f88fd6d83524b"),
//   name: 'RAVISH SONI',
//   phone: '8448167004',
//   admin_commission: '0.05',
//   trade_name: 'BUCKS ALLIANCE PRIVATE LIMITED',
//   designation: 'Software Eng.',
//   leagal_name: 'BUCKS ALLIANCE PRIVATE LIMITED',
//   company_logo: '1000132562-1753457749552-423580628.jpg',
//   gst: '07AAKCB9882A1ZH',
//   is_gst_verified: true,
//   telephone: '',
//   company_email: '',
//   address_line_1: 'Basement Office No 2, building no 8, Arihant nagar, Arihant nagar, Arihant Nagar',
//   landmark: 'shivaji park',
//   city: 'West Delhi',
//   state: 'Delhi',
//   pincode: '110026',
//   open_time: '09:00 AM',
//   close_time: '06:00 PM',
//   parent_id: null,
//   latitude: '',
//   longitude: '',
//   is_email_verified: false,
//   language_code: 'en',
//   language: 'English',
//   device: 'Android',
//   status: 1,
//   id: 197,
//   createdAt: 2025-07-25T15:29:28.681Z,
//   updatedAt: 2025-08-30T18:09:11.264Z,
//   email: 'soniravish45@gmail.com',
//   whatapp_num: '8743017611'
// }
//   createdAt: 2025-07-25T15:29:28.681Z,
//   updatedAt: 2025-08-30T18:09:11.264Z,
//   email: 'soniravish45@gmail.com',
//   whatapp_num: '8743017611'
//   createdAt: 2025-07-25T15:29:28.681Z,
//   updatedAt: 2025-08-30T18:09:11.264Z,
//   createdAt: 2025-07-25T15:29:28.681Z,
//   createdAt: 2025-07-25T15:29:28.681Z,
//   createdAt: 2025-07-25T15:29:28.681Z,
//   updatedAt: 2025-08-30T18:09:11.264Z,
//   createdAt: 2025-07-25T15:29:28.681Z,
//   createdAt: 2025-07-25T15:29:28.681Z,
//   updatedAt: 2025-08-30T18:09:11.264Z,
//   email: 'soniravish45@gmail.com',
//   whatapp_num: '8743017611'
// }

export function fillTemplate(template: string, data: any) {
    try {
        // Match {{ ... }} non-greedily, capture inner text
        return template.replace(/{{\s*([^}]+?)\s*}}/g, (match, rawKey) => {
            // Normalize the key by trimming and collapsing inner spaces around underscores, if desired
            const key = rawKey.trim();

            // Direct lookup
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const val = data[key];
                return val == null ? "" : String(val);
            }

            // Fallbacks: try to normalize accidental spaces around underscores, e.g., "contact _no" -> "contact_no"
            const compact = key.replace(/\s*_\s*/g, "_").replace(/\s{2,}/g, " ");
            if (Object.prototype.hasOwnProperty.call(data, compact)) {
                const val = data[compact];
                return val == null ? "" : String(val);
            }
            // Unknown placeholder: keep original {{...}}
            return match;
        });
    } catch (error) {}
}

export async function prepareNotificationData(details: any) {
    const data: any = await NotificationTemplate.findOne({ name: details?.tmplt_name });
    let notificationData = {};
    if (data?.is_sms) {
        notificationData = {
            ...notificationData,
            is_sms: true,
            phone: "6204591216",
            smsContent: data?.sms_content,
        };
    }
    if (data?.is_email) {
        notificationData = {
            ...notificationData,
            is_email: true,
            email: details?.to,
            subject: data?.subject || "Email",
            emailContent: fillTemplate(data?.email_content, details?.dynamicKey),
        };
        handleTriggerNotification(notificationData);
    }

    if (data?.is_firebase) {
        notificationData = {
            ...notificationData,
            is_firebase: true,
            title: details?.title||"JustBuySell",
            body: fillTemplate(data?.firebase_content, details?.dynamicKey),
            to: details?.to,
        };
          handleTriggerNotification(notificationData);
    }
  
    return;
}

export async function prepareWhatsAppNotificationData(details: any) {
   
    handleTriggerNotification({...details,is_whatsapp:true});
  
    return;
}
