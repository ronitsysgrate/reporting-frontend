"use client"

import React, { ReactNode } from 'react';
import SideBar from './SideBar';
import { useAuth } from '@/context/AuthContext';

interface ClientLayoutProps {
    children: ReactNode;
};

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {

    const { isAuthenticated, isLoading } = useAuth();

    return (
        <>
            {isAuthenticated && !isLoading ? (
                <div className="flex min-h-screen">
                    <SideBar />
                    <div className="flex-1 p-5 overflow-y-auto h-screen bg-gray-50">
                        {children}
                    </div>
                </div>
            ) : isLoading ? (
                <div className='flex min-h-screen items-center justify-center'>Loading please wait...</div>
            ) : (
                children
            )}
        </>
    )
}

export default ClientLayout