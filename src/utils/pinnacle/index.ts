import axios, { AxiosPromise, Method } from "axios";

async function sendSMS(to: string,message: string): AxiosPromise<any> {
    const apiKey = process.env.PINNACLE_KEY;
    const url = "https://api.pinnacle.in/index.php/sms/send";
    const method = "POST";
    const messageObj = {
        sender:"SSSTZN",
        numbers:to,
        message:message,
        messagetype:"TXT",
        dlttempid:"1107173149373830185"
    };
    
    const reqHeaders = {
        'apikey': apiKey, 
        "Content-Type": "application/json",
    };

    return axios({
        url,
        method,
        data:messageObj,
        headers: reqHeaders,
    });
}

export { sendSMS };
