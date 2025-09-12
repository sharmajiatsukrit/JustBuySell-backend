import axios, { AxiosPromise, Method } from "axios";

async function sendSMS(to: string, message: string, dlttempid: string = "1107173693764931229"): AxiosPromise<any> {
    const apiKey = process.env.PINNACLE_KEY;
    const url = "https://api.pinnacle.in/index.php/sms/send";
    const method = "POST";
    const messageObj = {
        sender: "JBUYSL",
        numbers: to,
        message: message,
        messagetype: "TXT",
        dlttempid: dlttempid,
    };

    const reqHeaders = {
        apikey: apiKey,
        "Content-Type": "application/json",
    };
    console.log(messageObj)

    return axios({
        url,
        method,
        data: messageObj,
        headers: reqHeaders,
    });
}

export { sendSMS };
