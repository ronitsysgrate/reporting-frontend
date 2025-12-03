"use client";

import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react'

interface PermissionTreeProps {
    selectedPermissions: string[];
    onChange: (permissions: string[]) => void;
}

const PermissionTree: React.FC<PermissionTreeProps> = ({ selectedPermissions, onChange }) => {

    const [reports, setReports] = useState<boolean>(false);
    const [user, setuser] = useState<boolean>(false);
    const [settings, setSettings] = useState<boolean>(false);

    const togglePermission = (key: string) => {
        if (selectedPermissions.includes(key)) {
            onChange(selectedPermissions.filter((p) => p !== key));
        } else {
            onChange([...selectedPermissions, key]);
        }
    };

    return (
        <div>

            <div className="rounded-lg bg-white">
                <div className="flex items-center p-2 cursor-pointer" onClick={() => setReports(!reports)}>
                    {reports ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                    <span className="font-medium text-gray-800">Historical Reports</span>
                </div>
                {reports && (
                    <div className="pl-6">
                        <div className="pl-2">
                            <div className="flex items-center cursor-pointer py-1">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    onChange={() => togglePermission('login-logout')}
                                    onClick={(e) => e.stopPropagation()}
                                    checked={selectedPermissions.includes('login-logout')}
                                />
                                <label className="text-sm font-medium text-gray-700">Login Logout Report</label>
                            </div>
                            <div className="flex items-center cursor-pointer py-1">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    onChange={() => togglePermission('agent-aux')}
                                    onClick={(e) => e.stopPropagation()}
                                    checked={selectedPermissions.includes('agent-aux')}
                                />
                                <label className="text-sm font-medium text-gray-700">Agent Aux Reports</label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-lg bg-white">
                <div className="flex items-center p-2 cursor-pointer" onClick={() => setuser(!user)}>
                    {user ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                    <span className="font-medium text-gray-800">User Management</span>
                </div>
                {user && (
                    <div className="pl-6">
                        <div className="pl-2">
                            <div className="flex items-center cursor-pointer py-1">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    onChange={() => togglePermission('manage')}
                                    onClick={(e) => e.stopPropagation()}
                                    checked={selectedPermissions.includes('manage')}
                                />
                                <label className="text-sm font-medium text-gray-700">Manage User</label>
                            </div>
                            <div className="flex items-center cursor-pointer py-1">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    onChange={() => togglePermission('role')}
                                    onClick={(e) => e.stopPropagation()}
                                    checked={selectedPermissions.includes('role')}
                                />
                                <label className="text-sm font-medium text-gray-700">User Roles</label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-lg bg-white">
                <div className="flex items-center px-2 py-1 cursor-pointer" onClick={() => setSettings(!settings)}>
                    {settings ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                    <span className="font-medium text-gray-800">Settings</span>
                </div>
                {settings && (
                    <div className="pl-6">
                        <div className="pl-2">
                            <div className="flex items-center cursor-pointer py-1">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    onChange={() => togglePermission('settings')}
                                    onClick={(e) => e.stopPropagation()}
                                    checked={selectedPermissions.includes('settings')}
                                />
                                <label className="text-sm font-medium text-gray-700">View</label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PermissionTree