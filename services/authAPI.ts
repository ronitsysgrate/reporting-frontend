import { commonAPI, Headers } from "./commonAPI"

export const loginAPI = async (reqBody: { email: string, password: string }) => {
    return await commonAPI('POST', '/user/login', reqBody);
};

export const userProfileAPI = async (header: Headers) => {
    return await commonAPI('GET', '/user/profile', null, header);
};

export const permissionAPI = async (header: Headers) => {
    return await commonAPI('GET', '/user/permissions', null, header);
};