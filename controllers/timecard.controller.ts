import { NextFunction, Response } from "express";
import { AgentTimecard } from "../models/agent-timecard.model";
import commonAPI from "../config/commonAPI";
import { literal, Op } from "sequelize";
import { getAccessToken } from "../utils/accessToken";
import { AuthenticatedRequest } from "../middlewares/auth";
import { fetchUserTimeZone } from "./zoom.controller";
import { Agent } from "../models/agent.model";

export const agentLoginLogoutReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    try {
        const user = req.user;
        const { from, to, agents, page = 1, limit = 10, refresh_record, format = 'DESC' } = req.query as any;

        const pageNum = Number(page);
        const limitNum = Number(limit);

        if (!user) {
            return next(Object.assign(new Error('User not found'), { status: 404 }));
        }

        if (!from || !to) {
            return next(Object.assign(new Error('From and to required'), { status: 401 }))
        }

        const whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        let agentsArray: string[] = [];
        if (agents) {
            if (Array.isArray(agents)) {
                agentsArray = agents;
            } else if (typeof agents === 'string') {
                agentsArray = agents
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
            }
        }

        if (agentsArray.length > 0) {
            whereClause.user_name = { [Op.in]: agentsArray };
        }
        const existingData = await AgentTimecard.findAll({
            where: whereClause,
            attributes: ['work_session_id'],
            limit: 1,
        });

        if (existingData.length === 0 || refresh_record) {
            await refresh(from, to);
        }

        const userTimeZone = await fetchUserTimeZone(user.id) || 'UTC';

        // Get total count of grouped records
        const countResult = await AgentTimecard.findAll({
            where: whereClause,
            attributes: [
                'user_id',
                'user_name',
                [literal(`DATE("start_time" AT TIME ZONE '${userTimeZone}')`), 'date'],
            ],
            group: ['user_id', 'user_name', 'date'],
            raw: true,
        });

        const totalCount = countResult.length;

        // Get paginated rows
        const offset = (pageNum - 1) * limitNum;
        const rows = await AgentTimecard.findAll({
            where: whereClause,
            attributes: [
                'user_name',
                'user_id',
                [literal(`MIN("start_time" AT TIME ZONE '${userTimeZone}')`), 'login_time'],
                [literal(`MAX("end_time" AT TIME ZONE '${userTimeZone}')`), 'logout_time'],
                [literal(`SUM(duration)`), 'total_duration'],
                [literal(`DATE("start_time" AT TIME ZONE '${userTimeZone}')`), 'date'],
            ],
            group: ['user_id', 'user_name', 'date'],
            order: [
                [literal(`DATE("start_time" AT TIME ZONE '${userTimeZone}')`), `${format}`],
                ['user_name', 'ASC']
            ],
            offset,
            limit: limitNum,
            raw: true,
        });

        const agentsData = await fetchAgents();

        res.json({
            success: true,
            data: {
                records: rows,
                agents: agentsData,
                page: pageNum,
                limit: limitNum,
                total: totalCount,
            }
        });
    } catch (error) {
        next(error)
    }
};

export const agentStatusDurationReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    try {
        const user = req.user;
        if (!user) {
            return next(Object.assign(new Error('User not found'), { status: 404 }));
        }

        const { from, to, agents, page = 1, limit = 20, refresh_record, format = 'DESC' } = req.query as any;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const offset = (pageNum - 1) * limitNum;

        const userTimeZone = (await fetchUserTimeZone(user.id)) || 'UTC';

        let whereClause: any = {
            start_time: { [Op.between]: [from, to] },
        };

        if (agents && agents.length > 0) {
            const agentList = Array.isArray(agents) ? agents : [agents];
            whereClause.user_name = { [Op.in]: agentList };
        }

        // Refresh if needed
        const existing = await AgentTimecard.findAll({ where: whereClause, limit: 1 });
        if (existing.length === 0 || refresh_record) {
            await refresh(from, to);
        }

        const { count, rows } = await AgentTimecard.findAndCountAll({
            where: whereClause,
            attributes: [
                'user_name',
                'user_id',
                'user_status',
                'user_sub_status',
                [literal(`"start_time" AT TIME ZONE '${userTimeZone}'`), 'start_time_tz'],
                [literal(`"end_time" AT TIME ZONE '${userTimeZone}'`), 'end_time_tz'],
                'duration',
                [literal(`DATE("start_time" AT TIME ZONE '${userTimeZone}')`), 'date'],
            ],
            order: [
                [literal(`DATE("start_time" AT TIME ZONE '${userTimeZone}')`), `${format}`],
                ['user_name', 'ASC'],
                ['start_time_tz', 'ASC']
            ],
            offset,
            limit: limitNum,
            raw: true,
        });

        const total = Array.isArray(count) ? count.length : count;

        const agentsData = await fetchAgents();

        res.json({
            success: true,
            data: {
                records: rows,
                agents: agentsData,
                page: pageNum,
                limit: limitNum,
                total,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const refreshAgentsAPI = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    try {
        await refreshAgents();

        const agentsData = await fetchAgents();

        if (agentsData) {
            res.status(200).json({
                success: true,
                data: agentsData
            })
        }
    } catch (error) {
        next(error)
    }
}

const refresh = async (from: string, to: string) => {
    try {
        const token = await getAccessToken();

        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        await AgentTimecard.destroy({
            where: {
                start_time: { [Op.between]: [from, to] },
            },
        });

        let nextPageToken: string | undefined;

        do {
            const queryParams = new URLSearchParams({
                from,
                to,
                page_size: '300',
            });

            if (nextPageToken) {
                queryParams.append('next_page_token', nextPageToken);
            }

            const response = await commonAPI(
                "GET",
                `/contact_center/analytics/dataset/historical/agent_timecard?${queryParams.toString()}`,
                {},
                {},
                token
            );

            if (!response || !Array.isArray(response.users)) {
                console.log(`API returned no users or invalid data: ${JSON.stringify(response)}`);
                break;
            }

            nextPageToken = response.next_page_token;

            if (response?.users?.length > 0) {
                const validatedData = response.users.map((item: any) => ({
                    work_session_id: item.work_session_id ?? "",
                    start_time: item.start_time ?? "",
                    end_time: item.end_time ?? "",
                    user_id: item.user_id ?? "",
                    user_name: item.user_name ?? "",
                    user_status: item.user_status ?? "",
                    user_sub_status: item.user_sub_status ?? "",
                    duration: item.ready_duration || item.occupied_duration || item.not_ready_duration || item.work_session_duration || 0,
                }));

                try {
                    await AgentTimecard.bulkCreate(validatedData, {
                        ignoreDuplicates: true,
                        validate: true,
                    });
                } catch (bulkError) {
                    console.error('Failed to upsert data in AgentTimecard table:', bulkError);
                }
            } else {
                console.log('No data fetched from API to upsert');
            }

        } while (nextPageToken);

    } catch (err) {
        throw err;
    }
};

const fetchAgents = async () => {
    try {

        const existingData = await Agent.findAll({
            attributes: ['user_name'],
            limit: 1,
        });

        if (existingData.length === 0) {
            await refreshAgents();
        }

        const agents = await Agent.findAll();

        return agents.map((agent: Agent) => (agent.user_name));
    } catch (err) {
        throw err;
    }
};

const refreshAgents = async () => {
    try {
        const token = await getAccessToken();
        if (!token) throw Object.assign(new Error("Server token missing"), { status: 401 });

        let nextPageToken: string | undefined;

        do {
            const queryParams = new URLSearchParams({
                page_size: '300',
            });

            if (nextPageToken) {
                queryParams.append('next_page_token', nextPageToken);
            }

            const response = await commonAPI(
                "GET",
                `/contact_center/users?${queryParams.toString()}`,
                {},
                {},
                token
            );

            if (!response.users || !Array.isArray(response.users)) {
                console.warn(`API returned no users or invalid data: ${JSON.stringify(response)}`);
                break;
            }

            nextPageToken = response.next_page_token;

            if (response.users?.length > 0) {
                const validatedData = response.users?.map((item: any) => ({
                    user_name: item.display_name ? item.display_name : '',
                    user_id: item.user_id ? item.user_id : ''
                }));

                try {
                    await Agent.bulkCreate(validatedData, {
                        ignoreDuplicates: true,
                        validate: true,
                    });
                } catch (bulkError) {
                    console.error('Failed to upsert data in AgentPerformance table:', bulkError);
                }

            } else {
                console.warn('No data fetched from API to upsert');
            }

        } while (nextPageToken);

    } catch (err) {
        throw err;
    }
};