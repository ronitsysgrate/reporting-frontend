import { NextFunction, Request, Response } from "express";
import { ZoomUser } from "../models/zoom.model";

// CREATE - Add a new ZoomUser
export const createZoomUser = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { account_id, client_id, client_password, primary, time_zone } = req.body;

        if (!account_id || !client_id || !client_password) {
            return next(
                Object.assign(new Error("account_id, client_id and client_password are required"), {
                    status: 400,
                })
            );
        }

        const existingZoomUser = await ZoomUser.findOne({ where: { account_id } });
        if (existingZoomUser) {
            return next(
                Object.assign(new Error("Zoom user with this account_id already exists"), {
                    status: 409,
                })
            );
        }

        // Optionally enforce only one primary Zoom user
        if (primary) {
            await ZoomUser.update({ primary: false }, { where: { primary: true } });
        }

        const zoomUser = await ZoomUser.create({
            account_id,
            client_id,
            client_password,
            primary: primary ?? false,
            time_zone: time_zone || "UTC",
        });

        res.status(201).json({ success: true, data: zoomUser });
    } catch (err) {
        next(err);
    }
};

// READ - Get all Zoom users
export const getAllZoomUsers = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const zoomUsers = await ZoomUser.findAll({
            attributes: ["id", "account_id", "client_id", "client_password", "primary", "time_zone"],
            order: [["primary", "DESC"], ["id", "ASC"]],
        });

        res.status(200).json({ success: true, data: zoomUsers });
    } catch (err) {
        next(err);
    }
};

// READ - Get single Zoom user by ID
export const getZoomUserById = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { zoomUserId } = req.params;

        const zoomUser = await ZoomUser.findByPk(zoomUserId, {
            attributes: { exclude: ["client_password"] },
        });

        if (!zoomUser) {
            return next(Object.assign(new Error("Zoom user not found"), { status: 404 }));
        }

        res.status(200).json({ success: true, data: zoomUser });
    } catch (err) {
        next(err);
    }
};

// UPDATE - Update Zoom user
export const updateZoomUser = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { zoomUserId } = req.params;
        const updateBody = req.body;

        const zoomUser = await ZoomUser.findByPk(zoomUserId);
        if (!zoomUser) {
            return next(Object.assign(new Error("Zoom user not found"), { status: 404 }));
        }

        // If setting this one as primary, unset others
        if (updateBody.primary === true) {
            await ZoomUser.update({ primary: false }, { where: { primary: true } });
        }

        const allowedUpdates = {
            account_id: updateBody.account_id ?? zoomUser.account_id,
            client_id: updateBody.client_id ?? zoomUser.client_id,
            client_password: updateBody.client_password
                ? updateBody.client_password
                : zoomUser.client_password,
            primary: updateBody.primary ?? zoomUser.primary,
            time_zone: updateBody.time_zone ?? zoomUser.time_zone,
        };

        await zoomUser.update(allowedUpdates);

        const updatedZoomUser = await ZoomUser.findByPk(zoomUserId, {
            attributes: { exclude: ["client_password"] },
        });

        res.status(200).json({ success: true, data: updatedZoomUser });
    } catch (err) {
        next(err);
    }
};

// DELETE - Delete Zoom user
export const deleteZoomUser = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { zoomUserId } = req.params;

        const zoomUser = await ZoomUser.findByPk(zoomUserId);
        if (!zoomUser) {
            return next(Object.assign(new Error("Zoom user not found"), { status: 404 }));
        }

        await zoomUser.destroy();
        res.status(200).json({ success: true, message: "Zoom user deleted successfully" });
    } catch (err) {
        next(err);
    }
};

// READ - Get user time zone
export const fetchUserTimeZone = async (id: number) => {

    try {

        let user = await ZoomUser.findOne({
            where: { primary: true },
            attributes: ['time_zone'],
        });

        if (!user) {
            user = await ZoomUser.findOne({
                attributes: ['time_zone'],
            });
        }

        return user?.time_zone || '+0.00';

    } catch (err) {
        throw err;
    }
}