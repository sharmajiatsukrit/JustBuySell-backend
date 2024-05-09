import { networkRequest } from '../../utils/request'
// const headers = {
//     Authorization: "Bearer D7Lu1ksaIOsaueOqOzc4ceIPHZC/l1HioIOpao2z7fbe",
// };

const url = process.env.BASE_URL;

async function createNewNotification(body: any, authorization: any): Promise<any> {
    const response = await networkRequest("POST", `${url}/notifications/`, body, authorization);
    if (response.data.status) {
        return Promise.resolve(response.data);
    }

    return Promise.reject("New notification not created");
}

async function exitUserFromAllGroup(body: any, authorization: any): Promise<any> {
    const response = await networkRequest("POST", `${url}/group/exit-from-all-groups/`, body, authorization);
    if (response.data.status) {
        return Promise.resolve(response.data);
    }

    return Promise.reject("You're not added in any of the groups.");
}

async function joinUserToGroups(body: any, authorization: any): Promise<any> {
    const response = await networkRequest("POST", `${url}/group/joinUserToGroups/`, body, authorization);
    if (response.data.status) {
        return Promise.resolve(response.data);
    }

    return Promise.reject("You're not added in any of the groups.");
}

export { createNewNotification, exitUserFromAllGroup, joinUserToGroups };