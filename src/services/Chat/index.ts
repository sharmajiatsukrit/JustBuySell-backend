import { networkRequest } from '../../utils/request'
// const headers = {
//     Authorization: "Bearer D7Lu1ksaIOsaueOqOzc4ceIPHZC/l1HioIOpao2z7fbe",
// };

const url = process.env.BASE_URL;

async function getChatCount(subscriber_id: any, ai: any, authorization: any): Promise<any> {
    const response = await networkRequest("GET", `${url}/chats/subscriber/messages/count/${subscriber_id}?ai=${ai}`, {}, authorization);
    if (response.data.status) {
        return Promise.resolve(response.data.data);
    }

    return Promise.reject("You're not allowed to do that.");
}

async function getPostCount(subscriber_id: any, type: any, authorization: any): Promise<any> {
    const response = await networkRequest("GET", `${url}/post/posts/count/${subscriber_id}?type=${type}`, {}, authorization);
    if (response.data.status) {
        return Promise.resolve(response.data.data);
    }

    return Promise.reject("You're not allowed to do that.");
}

async function getPostsForAdmin(authorization: any): Promise<any> {
    const response = await networkRequest("GET", `${url}/post/posts`, {}, {authorization});
    if (response.data.status) {
        return Promise.resolve(response.data.data);
    }

    return Promise.reject("You're not allowed to do that.");
}

async function getPostsForAdminBySubscriberId(id: any, authorization: any): Promise<any> {
    const response = await networkRequest("GET", `${url}/post/posts/subscriber/${id}`, {}, {authorization});
    if (response.data.status) {
        return Promise.resolve(response.data.data);
    }

    return Promise.reject("You're not allowed to do that.");
}

async function postDelete(post_id: any, authorization: any): Promise<any> {
    const response = await networkRequest("DELETE", `${url}/post/${post_id}`, {}, {authorization});
    if (response.data.status) {
        return Promise.resolve(response.data.data);
    }

    return Promise.reject("You're not allowed to do that.");
}

async function postSoftDelete(subscriber_id: any, authorization: any): Promise<any> {
    const response = await networkRequest("POST", `${url}/post/posts/user`,{subscriber_id}, {authorization});
    if (response.data.status) {
        return Promise.resolve(response.data);
    }

    return Promise.reject("You're not allowed to do that.");
}

export { getPostsForAdmin, getPostsForAdminBySubscriberId, postDelete, postSoftDelete, getChatCount, getPostCount };