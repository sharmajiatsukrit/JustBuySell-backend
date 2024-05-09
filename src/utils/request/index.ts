import axios, { AxiosPromise, Method } from "axios";

function networkRequest(method: Method, url: string, data = {}, headers = {}): AxiosPromise<any> {
    const reqHeaders = {
        ...headers,
        "Content-Type": "application/json",
    };

    return axios({
        url,
        method,
        data,
        headers: reqHeaders,
    });
}

export { networkRequest };
