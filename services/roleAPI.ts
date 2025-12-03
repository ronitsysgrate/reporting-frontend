import { commonAPI, Headers } from "./commonAPI";

export const fetchAllRolesAPI = async (query: string, header: Headers) => {
    return await commonAPI('GET', `/role?${query}`, null, header);
};

export const addRoleAPI = async (body: any, header: Headers) => {
    return await commonAPI('POST', '/role', body, header);
};

export const updateRoleAPI = async (id: string, body: any, header: Headers) => {
    return await commonAPI('PUT', `/role/${id}`, body, header);
};

export const deleteRoleAPI = async (id: string, header: Headers) => {
    return await commonAPI('DELETE', `/role/${id}`, undefined, header);
};
