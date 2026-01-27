import { commonAPI, Headers } from "./commonAPI";

export const fetchAgentLoginReportAPI = async (query: string, headers: Headers) => {
    return await commonAPI('GET', `/agents/login-logout?${query}`, null, headers);
};

export const fetchAgentAuxReportAPI = async (query: string, headers: Headers) => {
    return await commonAPI('GET', `/agents/status?${query}`, null, headers);
};

export const fetchSummaryReportAPI = async (query: string, headers: Headers) => {
    return await commonAPI('GET', `/agents/summary?${query}`, null, headers);
};

export const fetchAgentLoginCountAPI = async (query: string, headers: Headers) => {
    return await commonAPI('GET', `/download/login/count?${query}`, null, headers);
};

export const fetchAgentAuxCountAPI = async (query: string, headers: Headers) => {
    return await commonAPI('GET', `/download/aux/count?${query}`, null, headers);
};