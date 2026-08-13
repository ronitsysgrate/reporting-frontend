"use client";

import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import ReportHeader from '@/components/ReportHeader'
import { Headers } from '@/services/commonAPI';
import { fetchSummaryReportAPI } from '@/services/reportsAPI';
import server_url from '@/services/serverURL';
import { formatDate, formatDuration } from '@/utils/dateFormat';
import { isDateRangeValid } from '@/utils/isDateRangeValid';
import { useDateRange } from '@/utils/useDaterange';
import { Clock, Download, Filter, User, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast';

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

interface AgentAuxReport {
    user_name: string,
    user_id: string,
    user_sub_status: string,
    total_duration: string,
    average_duration: string,
    date: string,
}

const allStatus = [
    'Coaching',
    'Extended ACW - Admin',
    'Forced',
    'Holding',
    'Idle',
    'Meeting / Briefing',
    'On a Zoom call',
    'Outbound',
    'Ringing',
    'Short Break',
    'Training',
    'Transferring in',
    'Wrapping up'
];

const Page = () => {

    const { today, pastDate } = useDateRange();
    const [startDate, setStartDate] = useState<string>(pastDate || '2025-07-01');
    const [endDate, setEndDate] = useState<string>(today || '2025-07-30');
    const [data, setData] = useState<AgentAuxReport[]>([]);
    const [allAgents, setAllAgents] = useState<string[]>([]);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<'ASC' | 'DESC'>('DESC');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [exportProgress, setExportProgress] = useState<number | null>();
    const [isExporting, setIsExporting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingDownloadType, setPendingDownloadType] = useState<'excel' | 'csv' | null>(null);

    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        pages: 1,
        currentPage: 1,
        limit: 10,
    });

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        index: true,
        date: true,
        name: true,
        id: false,
        status: true,
        totalDuration: true,
        avgDuration: true,
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

        selectedStatuses.forEach(status => {
            if (status.trim()) {
                params.append('substatuses', status.trim());
            }
        });

        return params.toString();
    }, [pagination.currentPage, pagination.limit, selectedFormat, startDate, endDate, selectedAgents, selectedStatuses]);

    const summaryMetrics = useMemo<SummaryMetric[]>(() => {
        const totalLogins = pagination.total;
        const totalDuration = data.reduce((sum, report) => sum + (Number(report.total_duration) || 0), 0);
        const avgDuration = data.length > 0 ? totalDuration / data.length : '00:00:00';
        const uniqueAgents = new Set(data.map(report => report.user_name)).size;

        return [
            { label: 'Total Aux', value: totalLogins, bgColor: 'bg-blue-100', icon: User },
            { label: 'Avg Duration', value: formatDuration(avgDuration), bgColor: 'bg-orange-100', icon: Clock },
            { label: 'Unique Agents', value: uniqueAgents, bgColor: 'bg-green-100', icon: Users },
        ];
    }, [data, pagination.total]);

    const fetchAuxReports = async () => {
        setIsLoading(true);

        try {
            const headers: Headers = { authorization: `Bearer ${token}` };
            const result = await fetchSummaryReportAPI(queryParams, headers);
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

            selectedStatuses.forEach(status => {
                if (status.trim()) params.append('substatuses', status.trim());
            });

            const result = await fetchSummaryReportAPI(params.toString(), headers);
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

    const handleDownload = (type: 'excel' | 'csv' = 'excel') => {
        if (!isDateRangeValid(startDate, endDate)) return;

        setPendingDownloadType(type);
        setShowConfirmModal(true);
    };

    const confirmAndDownload = async () => {
        if (!pendingDownloadType) return;

        setShowConfirmModal(false);
        setIsExporting(true);
        setExportProgress(0);

        try {
            const storedToken = sessionStorage.getItem('tk');
            if (!storedToken) {
                throw new Error('No authentication token found');
            }

            const params = new URLSearchParams();
            params.append('from', `${startDate}T00:00:00Z`);
            params.append('to', `${endDate}T23:59:59Z`);
            params.append('format', selectedFormat);
            params.append('type', pendingDownloadType);

            selectedAgents.forEach(agent => agent.trim() && params.append('agents', agent.trim()));
            selectedStatuses.forEach(status => status.trim() && params.append('substatuses', status.trim()));

            const url = `${server_url}/download/summary?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Accept': pendingDownloadType === 'csv'
                        ? 'text/csv'
                        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }

            const total = response.headers.get('Content-Length') ? parseInt(response.headers.get('Content-Length')!, 10) : null;
            const reader = response.body!.getReader();
            const chunks: BlobPart[] = [];
            let loaded = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                loaded += value.length;

                if (total) {
                    const percentage = Math.round((loaded / total) * 100);
                    setExportProgress(percentage);
                }
            }

            const blob = new Blob(chunks, {
                type: pendingDownloadType === 'csv'
                    ? 'text/csv'
                    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = pendingDownloadType === 'csv'
                ? `Agent_Summary_${startDate}_to_${endDate}.csv`
                : `Agent_Summary_${startDate}_to_${endDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            setExportProgress(100);
            setTimeout(() => {
                setExportProgress(null);
                setIsExporting(false);
            }, 800);

        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export Excel. Please try again.');
            setExportProgress(null);
            setIsExporting(false);
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
            fetchAuxReports();
        }
    }, [token, queryParams]);

    return (
        <>
            <ReportHeader
                title="Summary Report"
                startDate={startDate}
                endDate={endDate}
                visibleColumns={visibleColumns}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                fetchReports={fetchAuxReports}
                refreshReports={handleRefresh}
                setVisibleColumns={setVisibleColumns}
                onExcelDownload={handleDownload}
                onCSVDownload={() => handleDownload('csv')}
                refresh={false}
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
                    <MultiSelectDropdown
                        options={allStatus}
                        selected={selectedStatuses}
                        onChange={setSelectedStatuses}
                        placeholder="All Statuses"
                    />
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
                                    <Filter size={16} className="text-indigo-700" />
                                </div>
                                <div className="ps-2">
                                    {selectedAgents.length > 0 || selectedStatuses.length > 0 ? (
                                        <div className="text-sm font-medium text-indigo-700 space-y-1">
                                            {selectedAgents.length > 0 && (
                                                <p>Agents: {selectedAgents.join(', ')}</p>
                                            )}
                                            {selectedStatuses.length > 0 && (
                                                <p>Statuses: {selectedStatuses.join(', ')}</p>
                                            )}
                                        </div>
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
                            <table className="w-full divide-y divide-gray-200 text-xs" aria-label="Agent Aux Report Table">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {visibleColumns.index && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                                        )}
                                        {visibleColumns.date && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Date</th>
                                        )}
                                        {visibleColumns.name && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Name</th>
                                        )}
                                        {visibleColumns.id && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">ID</th>
                                        )}
                                        {visibleColumns.status && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
                                        )}
                                        {visibleColumns.totalDuration && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Total Duration</th>
                                        )}
                                        {visibleColumns.avgDuration && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Avg Duration</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td
                                                colSpan={9}
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
                                                {visibleColumns.date && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(report.date)}
                                                    </td>
                                                )}
                                                {visibleColumns.name && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {report.user_name || '-'}
                                                    </td>
                                                )}
                                                {visibleColumns.id && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {report.user_id || '-'}
                                                    </td>
                                                )}
                                                {visibleColumns.status && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {report.user_sub_status || '-'}
                                                    </td>
                                                )}
                                                {visibleColumns.totalDuration && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDuration(report.total_duration)}
                                                    </td>
                                                )}
                                                {visibleColumns.avgDuration && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDuration(report.average_duration)}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={9}
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
                                    <option value="100">100</option>
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

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Confirm Download
                        </h3>

                        <p className="text-gray-600 mb-6">
                            Proceed to download <strong>{pagination.total.toLocaleString()}</strong> records
                            from <strong>{formatDate(startDate)}</strong> to <strong>{formatDate(endDate)}</strong>?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setPendingDownloadType(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAndDownload}
                                disabled={pagination.total <= 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
                            >
                                Download Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isExporting && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${exportProgress === 100
                                ? 'bg-green-100'
                                : 'bg-blue-100'
                                }`}>
                                {exportProgress === 100 ? (
                                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <Download className="w-8 h-8 text-blue-600 animate-bounce" />
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-center text-lg font-semibold text-gray-800 mb-2">
                            {exportProgress === 100 ? 'Export Complete!' : 'Exporting Data...'}
                        </h3>

                        {/* Subtitle */}
                        <p className="text-center text-sm text-gray-500 mb-6">
                            {exportProgress === 100
                                ? 'Your file has been downloaded successfully'
                                : 'Please wait while we prepare your file'}
                        </p>

                        {/* Progress Bar Container */}
                        <div className="relative">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ease-out rounded-full ${exportProgress === 100
                                        ? 'bg-linear-to-r from-green-500 to-green-600'
                                        : 'bg-linear-to-r from-blue-500 to-blue-600'
                                        }`}
                                    style={{ width: exportProgress !== null ? `${exportProgress}%` : '0%' }}
                                />
                            </div>

                            {/* Progress Percentage */}
                            <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-medium">
                                    {exportProgress !== null ? `${exportProgress}%` : '0%'}
                                </span>
                                {exportProgress !== 100 && (
                                    <span className="text-gray-400 flex gap-1">
                                        <span className="animate-pulse">.</span>
                                        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                                        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Page