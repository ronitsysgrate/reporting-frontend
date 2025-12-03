import { commonAPI, Headers } from "./commonAPI";

export const fetchAllUsersAPI = async (query: string, header: Headers) => {
    return await commonAPI('GET', `/user/user-role?${query}`, null, header);
};

export const fetchAllRolesAPI = async (query: string, header: Headers) => {
    return await commonAPI('GET', `/role?${query}`, null, header);
};

export const fetchZoomAPI = async (header: Headers) => {
    return await commonAPI('GET', '/zoom', null, header);
};

export const addZoomAccountAPI = async (body: any, header: Headers) => {
    return await commonAPI('POST', '/zoom', body, header);
};

export const addUserAPI = async (body: any, header: Headers) => {
    return await commonAPI('POST', '/user/register', body, header);
};

export const updateZoomAPI = async (header: Headers, id: number, body: any) => {
    return await commonAPI('PUT', `/zoom/${id}`, body, header);
};

export const updateUserAPI = async (header: Headers, id: number, body: any) => {
    return await commonAPI('PUT', `/user/${id}`, body, header);
};

export const resetPasswordAPI = async (body: any, header: Headers) => {
    return await commonAPI('PUT', '/user/reset-password', body, header);
};

export const deleteZoomAPI = async (header: Headers, id: number) => {
    return await commonAPI('DELETE', `/zoom/${id}`, undefined, header);
};

export const deleteUserAPI = async (header: Headers, id: number) => {
    return await commonAPI('DELETE', `/user/${id}`, undefined, header);
};