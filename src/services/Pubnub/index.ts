import { networkRequest } from "../../utils/request";
const url = process.env.BASE_URL;
const token = `Bearer ${process.env.INTER_SERVICE}`;

async function sendSignal(action: string, channel: string, payload: any): Promise<any> {
    const response = await networkRequest("POST", `${url}/pubnub/`, { 'action': action, 'channel': channel, payload: payload }, { "authorization": token });

    if (response.data.status) {
        return response.data.data;
    }
    throw new Error(response.data.message || "No detail found.");
}

async function restartPubnub(): Promise<any> {
    const response = await networkRequest("GET", `${url}/pubnub/restart`, {}, { "authorization": token });

    if (response.data.status) {
        return response.data.data;
    }
    throw new Error(response.data.message || "Error happened found.");
}

export { sendSignal, restartPubnub };
