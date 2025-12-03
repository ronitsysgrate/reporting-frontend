import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model";
import { comparePasswords, hashPassword } from "../utils/bcrypt";
import { Role } from "../models/role.model";
import { generateToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../middlewares/auth";
import { Op } from "sequelize";

// register
export const register = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { name, email, password, roleId } = req.body;

        if (!name || !email) {
            return next(Object.assign(new Error('Missing required fields'), { status: 400 }));
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return next(Object.assign(new Error('Email already exists'), { status: 401 }));
        }

        const hashedPassword = await hashPassword(password);
        const user = await User.create({ name, email, password: hashedPassword, roleId });

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// login
export const login = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(Object.assign(new Error('Missing required fields'), { status: 400 }));
        }

        const user = await User.findOne({
            where: { email },
            include: [{ model: Role, as: 'role' }],
        });

        if (!user) {
            return next(Object.assign(new Error('User not found'), { status: 404 }));
        }

        const isMatch = await comparePasswords(password, user.password || '');

        if (!isMatch) {
            return next(Object.assign(new Error('Invalid password'), { status: 401 }));
        }

        const token = generateToken({ id: user.id, role: user?.role?.role, permissions: user?.role?.permissions });
        const userDetails = {
            id: user.id,
            name: user.name,
            email: user.email,
            token: token
        }
        res.status(200).json({ success: true, data: userDetails });
    } catch (err) {
        next(err);
    }
};

// fetch all users
export const fetchAllUsers = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const allUsers = await User.findAll({
            attributes: ['name', 'email'],
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['role', 'permissions'],
                },
            ],
        })

        res.status(200).json({ success: true, data: allUsers });
    } catch (err) {
        next(err)
    }
};

// fetch users and roles
export const fetchUsersAndRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);

        let whereClause: any = {};

        if(search) {
            whereClause = {
                name: {
                    [Op.iLike]: `%${search}%`
                }
            }
        }

        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'name', 'email'],
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['role', 'id'],
                },
            ],
            offset,
            limit: limitNum,
        });

        const allRoles = await Role.findAll({
            attributes: ['id', 'role']
        });

        res.status(200).json({
            success: true,
            data: {
                users: rows,
                roles: allRoles,
                page: pageNum,
                limit: limitNum,
                total: count,
            }
        });
    } catch (error) {
        next(error);
    }
}

// fetch user profile
export const fetchUserProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    try {
        const user = req.user;
        const userProfile = await User.findByPk(user?.id, {
            attributes: ['name', 'email'],
        })

        res.status(200).json({ success: true, data: userProfile });
    } catch (err) {
        next(err)
    }
};

// update user
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { userId } = req.params;
        const updateBody = req.body;

        const user = await User.findByPk(userId);

        if (!user) {
            return next(Object.assign(new Error('User not found'), { status: 404 }));
        };

        const allowedUpdates = {
            name: updateBody.name ?? user.name,
            email: updateBody.email ?? user.email,
            roleId: updateBody.roleId ?? user.roleId,
        };

        await user.update(allowedUpdates);

        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'updatedAt'] }
        });

        if (!updatedUser) {
            return next(Object.assign(new Error('Failed to retrieve updated user'), { status: 401 }));
        };

        res.status(200).json({ success: true, data: updatedUser });
    } catch (err) {
        next(err)
    }
};

// delete user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);

        if (!user) return next(Object.assign(new Error('User not found'), { status: 404 }));

        await user.destroy();
        res.status(200).json({ success: true });
    } catch (err) {
        next(err)
    }
};

// reset password
export const resetPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    try {
        const user = req.user;
        const { currentPassword, newPassword } = req.body;

        const userId = user?.id;

        const currentuser = await User.findByPk(userId);
        if (!currentuser) {
            next(Object.assign(new Error('User not found'), { status: 404 }));
            return;
        }

        const isMatch = await comparePasswords(currentPassword, currentuser.password || '');
        if (!isMatch) {
            next(Object.assign(new Error('Current password is incorrect'), { status: 401 }));
            return;
        }

        if (await comparePasswords(newPassword, currentuser.password || '')) {
            next(Object.assign(new Error('New password cannot be the same as current password'), { status: 400 }));
            return;
        }

        const hashedPassword = await hashPassword(newPassword);

        const result = await currentuser.update({ password: hashedPassword });
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err)
    }
};

// fetch user role permissions
export const rolePermissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    try {
        const user = req.user;

        if (!user) {
            return next(Object.assign(new Error('User not authenticated'), { status: 401 }));
        }

        res.status(200).json({
            success: true,
            data: user.permissions || []
        });
    } catch (error) {
        next(error);
    }
};