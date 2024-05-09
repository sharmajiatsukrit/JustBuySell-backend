import { networkRequest } from "../request";

const url = `https://emailoctopus.com/api/1.6/lists/${process.env.OCTOPUS_LIST_ID}/contacts`

async function addSubscriberToOctopus(body: any): Promise<any> {
   const options = {
        hostname: 'emailoctopus.com',
        port: 443,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const response = await networkRequest("POST", url, body, options);
    
    if (response.data.status) {
        return Promise.resolve(response.data);
    }

    console.log(response);

    return Promise.reject("New notification not created");
}

export { addSubscriberToOctopus };