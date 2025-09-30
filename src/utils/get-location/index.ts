import axios from "axios";
import Logger from "../logger";

const geoLoaction: any = {
    apiKey: process.env.GEOLOCATION_API_KEY,
    apiUrl: "https://maps.googleapis.com/maps/api/geocode/json",
};

export default class GeoLoactionService {
    private apiKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = geoLoaction.apiKey;
        this.apiUrl = geoLoaction.apiUrl;
    }

    public async getGeoLoaction(pincode: string): Promise<any> {
        try {
            const response = await axios.get(`${this.apiUrl}?address=${pincode}&key=${this.apiKey}`);
            return response?.data?.results?.[0];
        } catch (error) {
            Logger.error(`Failed to send WhatsApp message: ${error}`);
            throw error;
        }
    }
}
