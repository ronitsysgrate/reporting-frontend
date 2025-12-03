"use client";

import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import ReportHeader from '@/components/ReportHeader'
import { Headers } from '@/services/commonAPI';
import { fetchAgentLoginReportAPI } from '@/services/reportsAPI';
import { formatDate, formatDateTime, formatDuration } from '@/utils/dateFormat';
import { useDateRange } from '@/utils/useDaterange';
import { Clock, Filter, User, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'

interface Pagination {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
};

interface SummaryMetric {
    label: string;
    value: string | number;
    bgColor: string;
    icon: React.ComponentType<{ size?: number }>;
};

interface AgentLoginReport {
    user_name: string,
    user_id: string,
    login_time: string,
    logout_time: string,
    total_duration: string,
    date: string,
}

const Page = () => {

    const { today, pastDate } = useDateRange();
    const [startDate, setStartDate] = useState<string>(pastDate || '2025-07-01');
    const [endDate, setEndDate] = useState<string>(today || '2025-07-30');
    const [data, setData] = useState<AgentLoginReport[]>([]);
    const [allAgents, setAllAgents] = useState<string[]>([]);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<'ASC' | 'DESC'>('DESC');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);

    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        pages: 1,
        currentPage: 1,
        limit: 10,
    });

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        index: true,
        user_name: true,
        user_id: false,
        login_time: true,
        logout_time: true,
        total_duration: true,
        date: true,
    });

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append('page', pagination.currentPage.toString());
        params.append('limit', pagination.limit.toString());

        const from = `${startDate}T00:00:00Z`;
        const to = `${endDate}T23:59:59Z`;

        params.append('from', from);
        params.append('to', to);
        params.append('format', selectedFormat);

        selectedAgents.forEach(agent => {
            if (agent.trim()) {
                params.append('agents', agent.trim());
            }
        });

        return params.toString();
    }, [pagination.currentPage, pagination.limit, selectedFormat, startDate, endDate, selectedAgents]);

    const summaryMetrics = useMemo<SummaryMetric[]>(() => {
        const totalLogins = pagination.total;
        const totalDuration = data.reduce((sum, report) => sum + (Number(report.total_duration) || 0), 0);
        const avgDuration = data.length > 0 ? totalDuration / data.length : '00:00:00';
        const uniqueAgents = new Set(data.map(report => report.user_name)).size;

        return [
            { label: 'Total Logins', value: totalLogins, bgColor: 'bg-blue-100', icon: User },
            { label: 'Avg Duration', value: formatDuration(avgDuration), bgColor: 'bg-orange-100', icon: Clock },
            { label: 'Unique Agents', value: uniqueAgents, bgColor: 'bg-green-100', icon: Users },
        ];
    }, [data, pagination.total]);

    const fetchLoginLogoutReports = async () => {
        setIsLoading(true);

        try {
            const headers: Headers = { authorization: `Bearer ${token}` };
            const result = await fetchAgentLoginReportAPI(queryParams, headers);
            if (result.success) {
                const { records, agents, page, limit, total } = result.data;
                setData(records);
                setAllAgents(agents);
                setPagination({
                    total: total,
                    limit: limit,
                    currentPage: page,
                    pages: Math.ceil(total / limit),
                });
            } else {
                setData([]);
                setAllAgents([]);
                setPagination({
                    total: 0,
                    limit: 10,
                    currentPage: 1,
                    pages: 1,
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);

        try {
            const headers: Headers = { authorization: `Bearer ${token}` };
            const params = new URLSearchParams();
            params.append('page', '1');
            params.append('limit', pagination.limit.toString());
            params.append('from', `${startDate}T00:00:00Z`);
            params.append('to', `${endDate}T23:59:59Z`);
            params.append('refresh_record', 'true');

            selectedAgents.forEach(agent => {
                if (agent.trim()) params.append('agents', agent.trim());
            });

            const result = await fetchAgentLoginReportAPI(params.toString(), headers);
            if (result.success) {
                const { records, agents, page, limit, total } = result.data;
                setData(records);
                setAllAgents(agents);
                setPagination({
                    total: total,
                    limit: limit,
                    currentPage: page,
                    pages: Math.ceil(total / limit),
                });
            } else {
                setData([]);
                setAllAgents([]);
                setPagination({
                    total: 0,
                    limit: 10,
                    currentPage: 1,
                    pages: 1,
                });
            }

        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const storedToken = sessionStorage.getItem('tk');
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchLoginLogoutReports();
        }
    }, [token, queryParams]);

    return (
        <>
            <ReportHeader
                title="Agent Login-Logout Report"
                startDate={startDate}
                endDate={endDate}
                reportData={data}
                visibleColumns={visibleColumns}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                fetchReports={fetchLoginLogoutReports}
                refreshReports={handleRefresh}
                setVisibleColumns={setVisibleColumns}
            >
                <div className="flex space-x-4">
                    <MultiSelectDropdown
                        options={allAgents}
                        selected={selectedAgents}
                        onChange={setSelectedAgents}
                        placeholder="All Agents"
                    />
                    <select
                        className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-40"
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value as 'ASC' | 'DESC')}
                    >
                        <option value="DESC">Newest First</option>
                        <option value="ASC">Oldest First</option>
                    </select>
                </div>
            </ReportHeader>
            <div className="mt-6 space-y-6">

                {/* summary metrics */}
                <div className="bg-white rounded-lg shadow">
                    <div className="flex flex-wrap divide-x divide-gray-200">
                        {summaryMetrics.map((metric, index) => (
                            <div key={index} className="flex-1 py-3 px-4">
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-md ${metric.bgColor}`}>
                                        <metric.icon size={16} />
                                    </div>
                                    <div className="ps-5">
                                        <p className="text-xs font-medium text-gray-500">{metric.label}</p>
                                        <p className="text-xl font-bold text-gray-800">{metric.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="flex-1 py-2 items-center px-4 bg-indigo-50">
                            <div className="flex items-center h-full">
                                <div className="p-1.5 rounded-md bg-indigo-100 mr-3">
                                    <Filter size={16} className=" text-indigo-700" />
                                </div>
                                <div className="ps-2">
                                    {selectedAgents.length > 0 ? (
                                        <p className="text-sm font-medium text-indigo-700">
                                            Agents: {selectedAgents.join(', ')}
                                        </p>
                                    ) : (
                                        <p className="text-sm font-medium text-indigo-700">All data (no filters applied)</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="flex flex-col" style={{ height: 'calc(98vh - 270px)' }}>
                        <div className="overflow-auto grow">
                            <table className="w-full divide-y divide-gray-200 text-xs" aria-label="Agent Login-Logout Report Table">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {visibleColumns.index && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                                        )}
                                        {visibleColumns.user_name && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Name</th>
                                        )}
                                        {visibleColumns.user_id && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">ID</th>
                                        )}
                                        {visibleColumns.login_time && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Login</th>
                                        )}
                                        {visibleColumns.logout_time && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Logout</th>
                                        )}
                                        {visibleColumns.total_duration && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Duration</th>
                                        )}
                                        {visibleColumns.date && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Date</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-3 py-1.5 text-center text-sm text-gray-500"
                                            >
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : data.length > 0 ? (
                                        data.map((report, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                {visibleColumns.index && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {(pagination.currentPage - 1) * pagination.limit + index + 1}
                                                    </td>
                                                )}
                                                {visibleColumns.user_name && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {report.user_name || '-'}
                                                    </td>
                                                )}
                                                {visibleColumns.user_id && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {report.user_id || '-'}
                                                    </td>
                                                )}
                                                {visibleColumns.login_time && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDateTime(report.login_time)}
                                                    </td>
                                                )}
                                                {visibleColumns.logout_time && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDateTime(report.logout_time)}
                                                    </td>
                                                )}
                                                {visibleColumns.total_duration && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDuration(report.total_duration)}
                                                    </td>
                                                )}
                                                {visibleColumns.date && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(report.date)}
                                                    </td>
                                                )}
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
            </div>
        </>
    )
}

export default Page