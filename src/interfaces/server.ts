export interface ServerResponse {
    sucess: boolean;
    code: number;
    message: string;
    data: Array<Object> | Object;
}
