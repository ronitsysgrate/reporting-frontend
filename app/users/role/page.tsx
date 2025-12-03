"use client";

import PermissionTree from "@/components/PermissionTree";
import UserModal from "@/components/UserModal";
import { addRoleAPI, deleteRoleAPI, updateRoleAPI } from "@/services/roleAPI";
import { fetchAllRolesAPI } from "@/services/userAPI";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface Role {
    id?: string;
    role: string;
    permissions: string[];
};

interface Pagination {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
};

const Page = () => {

    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete'>('add');

    const [selectedRole, setSelectedRole] = useState<Role>({
        role: "",
        permissions: [],
    });

    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        pages: 1,
        currentPage: 1,
        limit: 10,
    });

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append("page", pagination.currentPage.toString());
        params.append("limit", pagination.limit.toString());
        return params.toString();
    }, [pagination.currentPage, pagination.limit]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetchAllRolesAPI(queryParams, {
                authorization: `Bearer ${token}`,
            });
            if (response.success) {
                const { roles, page, limit, total } = response.data;
                setAllRoles(roles);
                setPagination({
                    total,
                    pages: Math.ceil(total / limit),
                    currentPage: page,
                    limit,
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load roles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedToken = sessionStorage.getItem("tk");
        if (storedToken) setToken(storedToken);
    }, []);

    useEffect(() => {
        if (token) fetchData();
    }, [token, queryParams]);

    const openAddModal = () => {
        setModalMode("add");
        setSelectedRole({ role: "", permissions: [] });
        setOpenModal(true);
    };

    const openEditModal = (role: Role) => {
        setModalMode("edit");
        setSelectedRole({ ...role });
        setOpenModal(true);
    };

    const openDeleteModal = (role: Role) => {
        setModalMode("delete");
        setSelectedRole(role);
        setOpenModal(true);
    };

    const closeModal = () => {
        setOpenModal(false);
        setSelectedRole({ role: "", permissions: [] });
    };

    const handleSaveRole = async () => {
        if (!selectedRole.role.trim()) {
            toast.error("Role name is required");
            return;
        }

        try {
            const payload = {
                role: selectedRole.role.trim(),
                permissions: selectedRole.permissions,
            };

            const result =
                modalMode === "add"
                    ? await addRoleAPI(payload, { authorization: `Bearer ${token}` })
                    : await updateRoleAPI(
                        selectedRole.id!,
                        payload,
                        { authorization: `Bearer ${token}` }
                    );

            if (result.success) {
                toast.success(
                    modalMode === "add" ? "Role created" : "Role updated"
                );
                closeModal();
                fetchData();
            } else {
                toast.error(result.error || "Operation failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        }
    };

    const handleDeleteRole = async () => {
        if (!selectedRole.id) return;

        try {
            const result = await deleteRoleAPI(
                selectedRole.id,
                { authorization: `Bearer ${token}` }
            );
            if (result.success) {
                toast.success("Role deleted");
                closeModal();
                fetchData();
            } else {
                toast.error(result.error || "Cannot delete role");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to delete role");
        }
    };

    // Handlers for PermissionTree
    const updatePermissions = (perms: string[]) => {
        setSelectedRole((prev) => ({ ...prev, permissions: perms }));
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-blue-800 mb-3">Manage Roles</h2>
                <button
                    onClick={openAddModal}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all disabled:opacity-50"
                >
                    <Plus className="mr-2 h-5 w-5" /> Add Role
                </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden mt-5">
                <div className="flex flex-col" style={{ height: 'calc(98vh - 90px)' }}>
                    <div className="overflow-auto grow">
                        <table className="w-full divide-y divide-gray-200 text-xs" aria-label="Agent Aux Report Table">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Role Name</th>
                                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Permissions</th>
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
                                ) : allRoles.length > 0 ? (
                                    allRoles.map((role, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {(pagination.currentPage - 1) * pagination.limit + index + 1}
                                            </td>
                                            <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {role.role || '-'}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-900">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {role.permissions.length > 0 ? (
                                                        role.permissions.map((perm) => (
                                                            <span
                                                                key={perm}
                                                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                            >
                                                                {perm.replace(/-/g, " ")}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => openEditModal(role)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(role)}
                                                        className="text-red-600 hover:text-red-800"
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

            <UserModal
                isOpen={openModal}
                onClose={closeModal}
                heading={
                    modalMode === "add"
                        ? "Add New Role"
                        : modalMode === "edit"
                            ? "Edit Role"
                            : "Delete Role"
                }
            >
                {modalMode === "delete" ? (
                    <div className="space-y-6">
                        <p>
                            Are you sure you want to delete <strong>{selectedRole.role}</strong>? This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteRole}
                                className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Delete Role
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role Name
                            </label>
                            <input
                                type="text"
                                value={selectedRole.role}
                                onChange={(e) =>
                                    setSelectedRole({ ...selectedRole, role: e.target.value })
                                }
                                className="w-full px-4 py-2 rounded-lg shadow outline-none"
                                placeholder="e.g. Supervisor"
                            />
                        </div>

                        <PermissionTree
                            selectedPermissions={selectedRole.permissions}
                            onChange={updatePermissions}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRole}
                                className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {modalMode === "add" ? "Create Role" : "Update Role"}
                            </button>
                        </div>
                    </div>
                )}
            </UserModal>
        </>
    )
}

export default Page