import axios, { AxiosError } from 'axios';
import server_url from './serverURL';

export interface ResponseData {
    success: boolean;
    data?: any;
    error?: string;
};

export interface Headers {
    authorization: string;
}

export const commonAPI = async <T>(httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', url: string, reqBody?: any | null, headers: Headers | null = null) => {
    try {
        const url_og: string = `${server_url}${url}`;
        const result = await axios({
            method: httpMethod,
            url: url_og,
            data: reqBody,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        });

        return result.data as ResponseData;
    } catch (err) {
        const error = err as AxiosError;
        const errorMessage = (error.response?.data as { error?: string })?.error || 'Request failed';
        return {
            success: false,
            error: errorMessage,
        } as ResponseData;
    }
};