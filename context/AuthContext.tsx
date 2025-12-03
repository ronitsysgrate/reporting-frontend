'use client'

import { loginAPI, userProfileAPI } from '@/services/authAPI';
import { UserAttributes } from '@/types/user.types';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: UserAttributes | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: { email: string, password: string }) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {

    const router = useRouter();
    const [user, setUser] = useState<UserAttributes | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        if (window !== undefined) {
            const token = sessionStorage.getItem('tk')

            if (token) {
                setIsAuthenticated(true);
                fetchUserProfile(token);
            } else {
                router.push('/')
            }
        }
    }, []);

    const login = async (formData: { email: string, password: string }) => {
        try {
            const result = await loginAPI(formData);

            if (result.success) {
                toast.success('Login successful');
                const { token, ...data } = result.data;
                setUser(data);
                router.push('/reports/login-logout');
                setIsAuthenticated(true);
                sessionStorage.setItem('tk', token);
            } else {
                toast.error(result.error || 'Login failed');
            }
        } catch (err) {
            toast.error('Something went wrong');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserProfile = async (token: string) => {
        try {
            const response = await userProfileAPI({ authorization: `Bearer ${token}` });
            if (response.success) {
                setUser(response.data);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const logout = () => {
        sessionStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        router.push('/');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 