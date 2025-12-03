"use client"
import { addUserAPI, deleteUserAPI, fetchAllUsersAPI, updateUserAPI } from '@/services/userAPI';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react'
import UserModal from "@/components/UserModal";
import toast from 'react-hot-toast';

interface UserAttributes {
    id: number | null;
    name: string;
    email: string;
    role: Role | null;
    roleId: number | null;
}

interface Role {
    id: number;
    role: string
};

interface Pagination {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
};


const Page = () => {

    const [allUsers, setAllUsers] = useState<UserAttributes[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete'>('add');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [selectedUser, setSelectedUser] = useState<UserAttributes>({
        id: null,
        name: '',
        email: '',
        role: null,
        roleId: null,
    });

    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        pages: 1,
        currentPage: 1,
        limit: 10,
    });

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append('page', pagination.currentPage.toString());
        params.append('limit', pagination.limit.toString());
        if (searchTerm.trim()) params.append('search', searchTerm.trim());

        return params.toString();
    }, [pagination.currentPage, pagination.limit, searchTerm]);

    const fetchData = async () => {
        setLoading(true);

        try {
            const response = await fetchAllUsersAPI(queryParams, { authorization: `Bearer ${token}` });
            if (response.success) {
                const { users, roles, page, limit, total } = response.data;
                setAllUsers(users);
                setAllRoles(roles);
                setPagination({
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    limit,
                })
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const storedToken = sessionStorage.getItem('tk');
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    useEffect(() => {
        if (!token) return;

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            setPagination(prev => ({ ...prev, currentPage: 1 }));
            fetchData();
        }, 600);

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [token, queryParams]);

    const openAddModal = () => {
        setModalMode('add');
        setSelectedUser({
            id: null,
            name: '',
            email: '',
            role: null,
            roleId: null
        });
        setOpenModal(true);
    };

    const openEditModal = (user: UserAttributes) => {
        setModalMode('edit');
        setSelectedUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            roleId: user.role?.id ?? null,
        });
        setOpenModal(true);
    };

    const openDeleteModal = (user: UserAttributes) => {
        setModalMode('delete');
        setSelectedUser(user);
        setOpenModal(true);
    };

    const closeModal = () => {
        setOpenModal(false);
        setSelectedUser({
            id: null,
            name: '',
            email: '',
            role: null,
            roleId: null
        });
    };

    const handleSaveUser = async () => {
        if (!selectedUser.name || !selectedUser.email || !selectedUser.roleId) {
            toast.error("All fields are required");
            return;
        }

        try {
            const payload = {
                name: selectedUser.name,
                email: selectedUser.email,
                roleId: selectedUser.roleId,
                ...(modalMode === 'add' && { password: "default123" })
            };

            const apiCall = modalMode === 'add'
                ? addUserAPI(payload, { authorization: `Bearer ${token}` })
                : updateUserAPI({ authorization: `Bearer ${token}` }, selectedUser.id!, payload);

            const result = await apiCall;

            if (result.success) {
                toast.success(modalMode === 'add' ? "User created successfully" : "User updated successfully");
                closeModal();
                fetchData();
            } else {
                toast.error(result.error || "Operation failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser.id) return;

        try {
            const result = await deleteUserAPI({ authorization: `Bearer ${token}` }, selectedUser.id);
            if (result.success) {
                toast.success("User deleted successfully");
                closeModal();
                fetchData();
            } else {
                toast.error(result.error || "Failed to delete user");
            }
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    return (
        <>
            <h2 className="text-xl font-bold text-blue-800 mb-3">Manage Users</h2>
            <div className='flex justify-between items-center'>
                <div className="relative w-full sm:w-1/3">
                    <input
                        type="text"
                        placeholder="Search users by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg shadow outline-none"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all disabled:opacity-50"
                >
                    <Plus className="mr-2 h-5 w-5" /> Add User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mt-5">
                <div className="flex flex-col" style={{ height: 'calc(98vh - 135px)' }}>
                    <div className="overflow-auto grow">
                        <table className="w-full divide-y divide-gray-200 text-xs" aria-label="Agent Aux Report Table">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Name</th>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Email</th>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Role</th>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Actions</th>

                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-3 py-1.5 text-center text-sm text-gray-500"
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : allUsers.length > 0 ? (
                                    allUsers.map((user, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {(pagination.currentPage - 1) * pagination.limit + index + 1}
                                            </td>
                                            <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {user.name || '-'}
                                            </td>
                                            <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {user.email || '-'}
                                            </td>
                                            <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {user.role?.role || '-'}
                                            </td>
                                            <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={(e) => openEditModal(user)}
                                                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                                                        aria-label={`Edit user ${user.name}`}
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => openDeleteModal(user)}
                                                        className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                                                        aria-label={`Delete user ${user.name}`}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-3 py-1.5 text-center text-sm text-gray-500"
                                        >
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                            <span>Showing</span>
                            <select
                                className="mx-2 border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                                value={pagination.limit}
                                onChange={(e) => {
                                    setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value), currentPage: 1 }));
                                }}
                                aria-label="Select Records Per Page"
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                            <span>records per page</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                className="px-2 py-1 border border-gray-300 rounded text-xs bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                onClick={(e) => {
                                    setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
                                }}
                                disabled={pagination.currentPage === 1}
                                aria-label="Previous Page"
                            >
                                Previous
                            </button>
                            <span className="px-2 py-1 border border-blue-500 bg-blue-500 text-white rounded text-xs">
                                {pagination.currentPage} of {pagination.total / pagination.limit === 0 ? 1 : Math.ceil(pagination.total / pagination.limit)}
                            </span>
                            <button
                                className="px-2 py-1 border border-gray-300 rounded text-xs bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                onClick={(e) => {
                                    setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
                                }}
                                disabled={pagination.currentPage * pagination.limit >= pagination.total}
                                aria-label="Next Page"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <UserModal isOpen={openModal} onClose={closeModal} heading={
                modalMode === 'add' ? 'Add New User' :
                    modalMode === 'edit' ? 'Edit User' : 'Delete User'
            }>
                {modalMode === 'delete' ? (
                    <div className="space-y-6">
                        <p className="text-gray-700">
                            Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={closeModal} className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={handleDeleteUser} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Delete User
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={selectedUser.name}
                                onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={selectedUser.email}
                                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="user@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                value={selectedUser.roleId ?? ''}
                                onChange={(e) => {
                                    const newRoleId = e.target.value ? Number(e.target.value) : null;
                                    const newRole = allRoles.find(r => r.id === newRoleId) || null;
                                    setSelectedUser(prev => ({
                                        ...prev,
                                        roleId: newRoleId,
                                        role: newRole
                                    }));
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a role</option>
                                {allRoles.map(role => (
                                    <option key={role.id} value={role.id}>{role.role}</option>
                                ))}
                            </select>
                        </div>
                        {modalMode === 'add' && (
                            <p className="text-xs text-gray-500">Default password: <strong>default123</strong> (user must change on first login)</p>
                        )}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button onClick={closeModal} className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={handleSaveUser} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                {modalMode === 'add' ? 'Create User' : 'Update User'}
                            </button>
                        </div>
                    </div>
                )}
            </UserModal >
        </>
    )
}

export default Page