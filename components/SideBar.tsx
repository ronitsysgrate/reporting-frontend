"use client";

import Image from 'next/image'
import { Calendar, ChevronRight, LogOut, Settings, User2, UserCog, UserCog2, UserRound, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { permissionAPI } from '@/services/authAPI';
import { Headers } from '@/services/commonAPI';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavItem = {
    id: string;
    icon: React.ReactNode;
    label: string;
    hasChildren: boolean;
    children?: NavItem[];
    href?: string;
};

const SideBar = () => {

    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const pathname = usePathname();

    const NavItems: NavItem[] = [
        {
            id: 'reports',
            icon: <Calendar size={20} />,
            label: 'Historical Reports',
            hasChildren: true,
            children: [
                { id: 'login-logout', icon: <UserRound size={16} />, label: 'Login Logout Report', hasChildren: false, href: '/reports/login-logout' },
                { id: 'agent-aux', icon: <UserRound size={16} />, label: 'Agent Aux Report', hasChildren: false, href: '/reports/agent-aux' },
            ],
        },
        {
            id: 'users',
            icon: <UserCog size={20} />,
            label: 'User Management',
            hasChildren: true,
            children: [
                { id: 'manage', icon: <Users size={16} />, label: 'Manage Users', hasChildren: false, href: '/users/manage' },
                { id: 'role', icon: <UserCog2 size={16} />, label: 'User Roles', hasChildren: false, href: '/users/role' }
            ],
        },
        {
            id: 'settings',
            icon: <Settings size={20} />,
            label: 'Account Settings',
            hasChildren: false,
            href: '/settings',
        }
    ];

    useEffect(() => {
        if (window !== undefined) {
            const storedToken = sessionStorage.getItem('tk');
            setToken(storedToken);
            pathname !== '/' && setExpanded(pathname.split('/')[1]);
        }
    }, []);

    useEffect(() => {
        if (!token) return;

        const fetchPermissions = async () => {
            try {
                const headers: Headers = {
                    authorization: `Bearer ${token}`
                }
                const response = await permissionAPI(headers);
                if (response.success) {
                    setPermissions(response.data)
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchPermissions();
    }, [token])

    const filterItemsByPermissions = (items: NavItem[]): NavItem[] => {
        return items
            .map(item => {
                if (item.hasChildren && item.children) {
                    const filteredChildren = filterItemsByPermissions(item.children);

                    if (filteredChildren.length > 0) {
                        return { ...item, children: filteredChildren };
                    }
                    return null;
                }

                if (permissions.includes(item.id)) {
                    return item;
                }

                return null;
            })
            .filter((item): item is NavItem => item !== null);
    };

    const RenderSideBarOptions = (items: NavItem[], level = 1) => {
        const filteredItems = filterItemsByPermissions(items);

        return filteredItems.map(item => {
            return (
                <div key={item.id}>
                    {item.href ? (
                        <Link href={item.href}>
                            <div
                                className={`flex items-center justify-between p-3 rounded-2xl hover:bg-blue-800 cursor-pointer 'bg-blue-700'}`}
                            >
                                <div className='flex items-center'>
                                    {item.icon}
                                    {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div
                            className='flex items-center justify-between p-3 rounded-2xl hover:bg-blue-800 cursor-pointer'
                            onClick={(e) => {
                                e.preventDefault();
                                setExpanded(expanded === item.id ? null : item.id);
                            }}
                        >
                            <div className='flex items-center'>
                                {item.icon}
                                {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
                            </div>
                            {sidebarOpen && item.hasChildren && (
                                <ChevronRight
                                    size={16}
                                    className={`transition-transform ${expanded === item.id ? 'rotate-90' : ''}`}
                                />
                            )}
                        </div>
                    )}

                    {item.hasChildren && expanded === item.id && (
                        <div className="ml-5 border-l-2 border-blue-600 pl-1">
                            {item.children && RenderSideBarOptions(item.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className={`${sidebarOpen ? 'w-75' : 'w-20'} bg-linear-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 ease-in-out shadow-xl flex flex-col`}>
            <div className="p-5 flex justify-between items-center border-b border-blue-700/50">
                {sidebarOpen ? (
                    <>
                        <div className="flex items-center space-x-2">
                            <Image
                                width={150}
                                height={100}
                                src="/syslogo1.png"
                                alt="logo image"
                                className="object-contain"
                                priority
                            />
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="text-blue-200 hover:text-white transition-colors rounded-full p-1 hover:bg-blue-700/40"
                        >
                            <X size={20} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="mx-auto text-blue-200 hover:text-white transition-colors"
                    >
                        <Image
                            width={100}
                            height={100}
                            src="/syslogo.png"
                            alt="logo image"
                            className="object-contain"
                            priority
                        />
                    </button>
                )}
            </div>
            <nav className='flex flex-col justify-between h-full'>
                {sidebarOpen && (
                    <div className='px-5 space-y-3 py-3'>
                        <p className="text-xs text-blue-300 uppercase tracking-wider font-medium">Dashboard</p>
                    </div>
                )}
                <div className="px-4 overflow-y-auto"
                    style={{
                        maxHeight: 'calc(100vh - 155px - 64px)',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#155dfc #1a3bab',
                    }}>
                    <style jsx>{`
                        .px-4::-webkit-scrollbar {
                            width: 8px;
                        }
                        .px-4::-webkit-scrollbar-track {
                            background: #1a3bab;
                            border-radius: 4px;
                        }
                        .px-4::-webkit-scrollbar-thumb {
                            background: #155dfc;
                            border-radius: 4px;
                        }
                        .px-4::-webkit-scrollbar-thumb:hover {
                            background: #3B82F6;
                        }
                    `}</style>
                    {RenderSideBarOptions(NavItems)}
                </div>
                <div className={`p-4 mt-auto border-t border-blue-700/50 ${sidebarOpen ? '' : 'flex justify-center'}`}>
                    {sidebarOpen ? (
                        <div className="flex items-center justify-between">
                            <div className='flex items-center'>
                                <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-medium">
                                    <User2 size={18} />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-white">{user?.name}</p>
                                    <p className="text-xs text-blue-300">{user?.email}</p>
                                </div>
                            </div>
                            <button onClick={logout}><LogOut className='cursor-pointer' /></button>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">
                            {user?.name.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                    )}
                </div>
            </nav>
        </div>
    )
}

export default SideBar