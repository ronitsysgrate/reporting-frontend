"use client";

import { useAuth } from "@/context/AuthContext";
import { addZoomAccountAPI, deleteZoomAPI, fetchZoomAPI, resetPasswordAPI, updateZoomAPI } from "@/services/userAPI";
import { EditIcon, Lock, LogOut, Mail, Trash2Icon, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import toast from "react-hot-toast";
import UserModal from "@/components/UserModal";

const timeZones = [
    { id: 0, iana: "UTC" },
    { id: 1, iana: "America/New_York" },
    { id: 2, iana: "America/Los_Angeles" },
    { id: 3, iana: "America/Chicago" },
    { id: 4, iana: "America/Sao_Paulo" },
    { id: 5, iana: "Europe/London" },
    { id: 6, iana: "Europe/Paris" },
    { id: 7, iana: "Europe/Moscow" },
    { id: 8, iana: "Africa/Johannesburg" },
    { id: 9, iana: "Asia/Dubai" },
    { id: 10, iana: "Asia/Kolkata" },
    { id: 11, iana: "Asia/Shanghai" },
    { id: 12, iana: "Asia/Singapore" },
    { id: 13, iana: "Asia/Tokyo" },
    { id: 14, iana: "Australia/Sydney" },
    { id: 15, iana: "Pacific/Auckland" }
];

interface ZoomAccount {
    id?: number | null;
    account_id: string;
    client_id: string;
    primary: boolean;
    client_password?: string;
    time_zone: string;
}

const Page = () => {

    const router = useRouter();
    const { logout, user } = useAuth();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isloading, setIsloading] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState('zoom');
    const [zoomAccounts, setZoomAccounts] = useState<ZoomAccount[]>([]);
    const [modalHeading, setModalHeading] = useState<string>('');
    const [modalBody, setModalBody] = useState<ReactNode | null>(null);
    const [newZoomAccount, setNewZoomAccount] = useState<ZoomAccount>({
        id: null,
        account_id: '',
        client_id: '',
        primary: false,
        client_password: '',
        time_zone: 'UTC'
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const fetchData = async () => {
        setIsloading(true);

        try {
            const response = await fetchZoomAPI({ authorization: `Bearer ${token}` });
            if (response.success) {
                setZoomAccounts(response.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsloading(false);
        }
    }

    useEffect(() => {
        const storedToken = sessionStorage.getItem('tk');
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const handleSetPrimary = async (id: number | undefined | null) => {
        try {
            if (!token || !id) {
                toast.error('Credentials not found, try login in again!');
                router.push('/');
                return;
            }

            const result = await updateZoomAPI({ authorization: `Bearer ${token}` }, id, { primary: true });
            if (result.success) {
                toast.success('Primary account set successfully.');
                await fetchData();
            } else {
                toast.error(result.error || 'Failed to set primary account');
            }
        } catch (err) {
            toast.error('Something went wrong!');
            console.log(err);
        }
    };

    const handleResetPassword = async () => {
        setError('');
        setSuccess('');

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setError('All fields are required.');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }

        try {
            if (!token) {
                toast.error('Credentials not found, try login in again!');
                router.push('/');
                return;
            }

            const reqBody = {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            };
            const result = await resetPasswordAPI(reqBody, { authorization: `Bearer ${token}` });
            if (result.success) {
                toast.success('Password reset successfully.');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                result.error && setError(result.error);
            }
        } catch (err) {
            toast.error('Something went wrong!');
            console.log(err);
        }
    };

    const handleAddZoomAccount = async () => {

        if (!newZoomAccount.account_id || !newZoomAccount.client_id || !newZoomAccount.client_password || !newZoomAccount.time_zone) {
            toast.error('All fields are required.');
            return;
        }

        try {
            if (!token) {
                toast.error('Credentials not found, try login in again!');
                router.push('/');
                return;
            }

            const result = await addZoomAccountAPI(newZoomAccount, { authorization: `Bearer ${token}` });
            if (result.success) {
                toast.success('Zoom account added successfully.');
                setNewZoomAccount({
                    account_id: '',
                    client_id: '',
                    primary: false,
                    client_password: '',
                    time_zone: 'UTC'
                })
                setActiveTab('zoom')
                await fetchData();
            } else {
                toast.error(result.error || 'Failed to add account');
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleEditZoomAccount = async () => {
        try {
            if (!newZoomAccount.id) return;

            const updateBody = {
                account_id: newZoomAccount.account_id,
                client_id: newZoomAccount.client_id,
                client_password: newZoomAccount.client_password,
                time_zone: newZoomAccount.time_zone
            };

            const result = await updateZoomAPI({ authorization: `Bearer ${token}` }, newZoomAccount.id, updateBody);
            if (result.success) {
                await fetchData();
                closeModal();
            } else {
                toast.error(result.error || 'Failed to update account');
            }
        } catch (error) {
            console.log(error);
            toast.error('Something went wrong!');
        }
    }

    const handleDeleteZoomAccount = async () => {
        try {
            if (!newZoomAccount.id) return;

            if (newZoomAccount.primary) {
                toast.error('Cannot delete primary account');
                return;
            }

            const result = await deleteZoomAPI({ authorization: `Bearer ${token}` }, newZoomAccount.id);
            if (result.success) {
                await fetchData();
                closeModal();
            } else {
                toast.error(result.error || 'Failed to delete account');
            }
        } catch (error) {
            console.log(error);
            toast.error('Something went wrong!');
        }
    }

    const openEditModal = (account: ZoomAccount) => {
        if (!account.id) return;

        setNewZoomAccount(account);
        setModalHeading('Edit Zoom Account');
        setOpenModal(true);
    }

    const openDeleteModal = (account: ZoomAccount) => {
        if (!account.id) return;

        setNewZoomAccount(account);
        setModalHeading('Delete Zoom Account');
        setOpenModal(true);
    }

    const closeModal = () => {
        setOpenModal(false);
        setNewZoomAccount({
            account_id: '',
            client_id: '',
            primary: false,
            client_password: '',
            time_zone: 'UTC'
        });
    }

    return (
        <>
            <div className='bg-white p-5 rounded-t-2xl flex justify-between items-center'>
                <h2 className="text-xl font-bold text-blue-800">Account Management</h2>
                <button onClick={logout} className="text-red-600 cursor-pointer flex items-center">
                    Logout<LogOut size={18} className='ms-1' />
                </button>
            </div>

            <div className='grid grid-cols-6 gap-6 mt-6'>
                <div className='col-span-2'>
                    <div className='rounded-2xl p-6 bg-white shadow-lg h-[calc(100vh-9rem)] flex flex-col'>
                        <div className="flex justify-center">
                            <UserCircle size={60} className="text-blue-600" />
                        </div>
                        <p className="text-center mt-2 text-2xl font-bold text-blue-800">{user?.name || 'User'}</p>
                        <p className="flex justify-center items-center text-sm text-blue-600 mt-1">
                            <Mail size={16} className="me-2" />
                            {user?.email || 'user@sysgrate.com'}
                        </p>
                        <div className="mt-8 bg-gray-50 rounded-2xl p-5 flex-1">
                            <h3 className="text-lg font-medium mb-4 text-blue-800">Reset Password</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-blue-600 mb-1 block">Current Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                                        <input
                                            type="password"
                                            placeholder="Enter current password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-blue-600 mb-1 block">New Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-blue-600 mb-1 block">Confirm Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                {error && <p className="text-red-400 text-sm">{error}</p>}
                                {success && <p className="text-green-400 text-sm">{success}</p>}
                                <button
                                    onClick={handleResetPassword}
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg transition-colors font-medium text-sm mt-4"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='col-span-4'>
                    <div className='rounded-2xl p-6 bg-white shadow-lg h-[calc(100vh-9rem)]'>
                        <div className="flex border-b border-gray-200 mb-6">
                            <button
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'zoom' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('zoom')}
                            >
                                Zoom Account Settings
                            </button>
                            <button
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'add' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                                onClick={() => setActiveTab('add')}
                            >
                                Add Account
                            </button>
                        </div>
                        {activeTab === 'zoom' ? (
                            <div className="overflow-auto h-[calc(100%-4rem)]">
                                <table className="w-full">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No.</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account ID</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client ID</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time Zone</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Primary</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {
                                            isloading ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-12 text-gray-500">
                                                        <div className="flex flex-col items-center justify-center space-y-3">
                                                            <p>Loading...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                zoomAccounts.map((account, index) => (
                                                    <tr key={account.id} className='hover:bg-gray-50'>
                                                        <td className="px-3 py-2 text-sm text-gray-900">{index + 1}</td>
                                                        <td className="px-3 py-2 text-sm text-gray-900">{account.account_id}</td>
                                                        <td className="px-3 py-2 text-sm text-gray-900">{account.client_id}</td>
                                                        <td className="px-3 py-2 text-sm text-gray-900">{account.time_zone}</td>
                                                        <td className="px-3 py-2 text-sm text-gray-800">
                                                            <label className="flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={account.primary}
                                                                    onChange={() => handleSetPrimary(account.id)}
                                                                    className="hidden peer"
                                                                />
                                                                <span className="w-5 h-5 inline-block border-2 border-gray-300 rounded bg-white relative transition-all duration-200 peer-checked:bg-blue-600 peer-checked:border-blue-600">
                                                                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold peer-checked:opacity-100 opacity-0">✓</span>
                                                                </span>
                                                            </label>
                                                        </td>
                                                        <td className='flex items-center py-2 px-3'>
                                                            <button onClick={(e) => openEditModal(account)} className='text-blue-500'><EditIcon size={19} /></button>
                                                            <button onClick={(e) => openDeleteModal(account)} className='ps-2 text-red-500'><Trash2Icon size={19} /></button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )
                                        }
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl p-5 h-[calc(100%-4rem)]">
                                <h3 className="text-lg font-medium mb-4 text-blue-800">Add New Zoom Account</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-blue-600 mb-1 block">Account ID</label>
                                        <input
                                            type="text"
                                            placeholder="Enter account ID"
                                            value={newZoomAccount.account_id}
                                            onChange={(e) => setNewZoomAccount({ ...newZoomAccount, account_id: e.target.value })}
                                            className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-blue-600 mb-1 block">Client ID</label>
                                        <input
                                            type="text"
                                            placeholder="Enter client ID"
                                            value={newZoomAccount.client_id}
                                            onChange={(e) => setNewZoomAccount({ ...newZoomAccount, client_id: e.target.value })}
                                            className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-blue-600 mb-1 block">Client Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter client password"
                                            value={newZoomAccount.client_password}
                                            onChange={(e) => setNewZoomAccount({ ...newZoomAccount, client_password: e.target.value })}
                                            className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-blue-600 mb-1 block">Time Zone</label>
                                        <select
                                            value={newZoomAccount.time_zone}
                                            onChange={(e) => setNewZoomAccount({ ...newZoomAccount, time_zone: e.target.value })}
                                            className="w-full bg-gray-100 text-gray-900 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {timeZones.map((tz) => (
                                                <option key={tz.id} value={tz.iana}>
                                                    {tz.iana}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAddZoomAccount}
                                        className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg transition-colors font-medium text-sm mt-4"
                                    >
                                        Add Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <UserModal isOpen={openModal} onClose={closeModal} heading={modalHeading}>
                {modalHeading === 'Edit Zoom Account' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-blue-600 mb-1 block">Account ID</label>
                            <input
                                type="text"
                                placeholder="Enter account ID"
                                value={newZoomAccount.account_id || ''}
                                onChange={(e) => setNewZoomAccount({ ...newZoomAccount, account_id: e.target.value })}
                                className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-blue-600 mb-1 block">Client ID</label>
                            <input
                                type="text"
                                placeholder="Enter client ID"
                                value={newZoomAccount.client_id || ''}
                                onChange={(e) => setNewZoomAccount({ ...newZoomAccount, client_id: e.target.value })}
                                className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-blue-600 mb-1 block">Client Password</label>
                            <input
                                type="password"
                                placeholder="Enter client password"
                                value={newZoomAccount.client_password || ''}
                                onChange={(e) => setNewZoomAccount({ ...newZoomAccount, client_password: e.target.value })}
                                className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-blue-600 mb-1 block">Time Zone</label>
                            <select
                                value={newZoomAccount.time_zone}
                                onChange={(e) => setNewZoomAccount({ ...newZoomAccount, time_zone: e.target.value })}
                                className="w-full bg-gray-100 text-gray-900 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {timeZones.map((tz) => (
                                    <option key={tz.id} value={tz.iana}>
                                        {tz.iana}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleEditZoomAccount}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg transition-colors font-medium text-sm"
                            >
                                Update Account
                            </button>
                            <button
                                onClick={closeModal}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-700">Are you sure you want to delete this Zoom account? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteZoomAccount}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </UserModal>

        </>
    )
}

export default Page