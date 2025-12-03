import { NextFunction, Request, Response } from "express";
import { Role } from "../models/role.model";

// CREATE - Add a new Role
export const createRole = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { role, permissions } = req.body;

        if (!role) {
            return next(
                Object.assign(new Error("Role name is required"), { status: 400 })
            );
        }

        const existingRole = await Role.findOne({ where: { role } });
        if (existingRole) {
            return next(
                Object.assign(new Error("Role with this name already exists"), {
                    status: 409,
                })
            );
        }

        const newRole = await Role.create({
            role,
            permissions: permissions || {},
        });

        res.status(201).json({ success: true, data: newRole });
    } catch (err) {
        next(err);
    }
};

// READ - Get all roles
export const getAllRoles = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { page = 1, limit = 10 } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);

        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await Role.findAndCountAll({
            order: [["id", "ASC"]],
            offset,
            limit: limitNum,
        });

        res.status(200).json({
            success: true,
            data: {
                roles: rows,
                total: count,
                page: pageNum,
                limit: limitNum
            }
        });
    } catch (err) {
        next(err);
    }
};

// READ - Get single role by ID
export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { roleId } = req.params;

        const role = await Role.findByPk(roleId);

        if (!role) {
            return next(Object.assign(new Error("Role not found"), { status: 404 }));
        }

        res.status(200).json({ success: true, data: role });
    } catch (err) {
        next(err);
    }
};

// UPDATE - Update role
export const updateRole = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { roleId } = req.params;
        const updateBody = req.body;

        const role = await Role.findByPk(roleId);
        if (!role) {
            return next(Object.assign(new Error("Role not found"), { status: 404 }));
        }

        // Prevent duplicate role names
        if (updateBody.role && updateBody.role !== role.role) {
            const existingRole = await Role.findOne({
                where: { role: updateBody.role },
            });
            if (existingRole) {
                return next(
                    Object.assign(new Error("Another role with this name already exists"), {
                        status: 409,
                    })
                );
            }
        }

        const allowedUpdates = {
            role: updateBody.role ?? role.role,
            permissions: updateBody.permissions ?? role.permissions,
        };

        await role.update(allowedUpdates);

        const updatedRole = await Role.findByPk(roleId);

        res.status(200).json({ success: true, data: updatedRole });
    } catch (err) {
        next(err);
    }
};

// DELETE - Delete role
export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { roleId } = req.params;

        const role = await Role.findByPk(roleId);
        if (!role) {
            return next(Object.assign(new Error("Role not found"), { status: 404 }));
        }

        await role.destroy();
        res.status(200).json({ success: true, message: "Role deleted successfully" });
    } catch (err) {
        next(err);
    }
};