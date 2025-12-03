import { commonAPI, Headers } from "./commonAPI";

export const fetchAgentLoginReportAPI = async (query: string, headers: Headers) => {
    return await commonAPI('GET', `/agents/login-logout?${query}`, null, headers);
};

export const fetchAgentAuxReportAPI = async (query: string, headers: Headers) => {
    return await commonAPI('GET', `/agents/status?${query}`, null, headers);
};