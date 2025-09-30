import axios from 'axios';
import Logger from "../logger";

const whatsappConfig : any = {
    apiKey: process.env.WHATSAPP_API_KEY,
    apiUrl: "https://backend.aisensy.com/campaign/t1/api/v2",
};

export default class WhatsAppService {
    private apiKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = whatsappConfig.apiKey;
        this.apiUrl = whatsappConfig.apiUrl;
    }

    public async sendWhatsApp( destination: string, userName: string, campaignName: string, templateParams: string[]): Promise<any> {
        const payload = {
            apiKey: this.apiKey,
            campaignName: campaignName,
            destination: destination,
            userName: userName,
            templateParams: templateParams
        };
        console.log("WhatsApp Payload:", payload);

        try {
            const response = await axios.post(`${this.apiUrl}`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            Logger.info(`WhatsApp message sent to ${destination} for campaign: ${campaignName}`);
            return response.data;
        } catch (error) {
            Logger.error(`Failed to send WhatsApp message: ${error}`);
            throw error;
        }
    }

   
}
