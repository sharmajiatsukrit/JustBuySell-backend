import axios, { AxiosPromise, Method } from "axios";

async function sendWhatsApp(to: string,template_name:string,variables: string): AxiosPromise<any> {
    const apiKey = process.env.AISENSY_KEY;
    const url = "https://api.aisensy.com/send";
    const method = "POST";
    const messageObj = {
        to:to,
        template_name:template_name,
        variables:variables
    };
    
    const reqHeaders = {
        'Authorization': 'Bearer' + apiKey, 
        "Content-Type": "application/json",
    };

    return axios({
        url,
        method,
        data:messageObj,
        headers: reqHeaders,
    });
}

export { sendWhatsApp };
