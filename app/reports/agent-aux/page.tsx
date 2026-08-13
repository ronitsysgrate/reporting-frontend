"use client";

import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import ReportHeader from '@/components/ReportHeader'
import { Headers } from '@/services/commonAPI';
import { fetchAgentAuxCountAPI, fetchAgentAuxReportAPI } from '@/services/reportsAPI';
import server_url from '@/services/serverURL';
import { formatDate, formatDateTime, formatDuration } from '@/utils/dateFormat';
import { useDateRange } from '@/utils/useDaterange';
import { Clock, Download, Filter, User, Users } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
    user_status: string,
    user_sub_status: string,
    end_time_tz: string,
    duration: string,
    start_time_tz: string,
    date: string,
}
const allSubstatus = [
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

const allStatus = ['Not Ready', 'Occupied', 'Offline', 'Ready']

const Page = () => {

    const { today } = useDateRange();
    const [startDate, setStartDate] = useState<string>(today || '2025-07-01');
    const [endDate, setEndDate] = useState<string>(today || '2025-07-30');
    const [data, setData] = useState<AgentAuxReport[]>([]);
    const [allAgents, setAllAgents] = useState<string[]>([]);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedSubtatuses, setSelectedSubtatuses] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<'ASC' | 'DESC'>('DESC');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [exportProgress, setExportProgress] = useState<number | null>();
    const [isExporting, setIsExporting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingDownloadType, setPendingDownloadType] = useState<'excel' | 'csv' | null>(null);
    const [auxRecordCount, setAuxRecordCount] = useState<number | null>(null);
    const [isFetchingCount, setIsFetchingCount] = useState(false);
    const requestIdRef = useRef(0);

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
        user_status: true,
        user_sub_status: true,
        end_time_tz: true,
        duration: true,
        start_time_tz: true,
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

        selectedStatuses.forEach(status => {
            if (status.trim()) {
                params.append('statuses', status.trim());
            }
        });

        selectedSubtatuses.forEach(status => {
            if (status.trim()) {
                params.append('sub_status', status.trim());
            }
        });

        return params.toString();
    }, [pagination.currentPage, pagination.limit, selectedFormat, startDate, endDate, selectedAgents, selectedStatuses, selectedSubtatuses]);

    const summaryMetrics = useMemo<SummaryMetric[]>(() => {
        const totalLogins = pagination.total;
        const totalDuration = data.reduce((sum, report) => sum + (Number(report.duration) || 0), 0);
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

        const requestId = ++requestIdRef.current;

        try {
            const headers: Headers = { authorization: `Bearer ${token}` };
            const result = await fetchAgentAuxReportAPI(queryParams, headers);

            if (requestId !== requestIdRef.current) return;

            if (result.success) {
                const { records, agents, page, limit, total } = result.data;
                setData(records);
                setAllAgents(agents);
                setPagination((prev) => ({
                    ...prev,
                    total: total,
                    limit: limit,
                    currentPage: page,
                    pages: Math.ceil(total / limit),
                }));
            } else {
                setData([]);
                setAllAgents([]);
                setPagination((prev) => ({
                    ...prev,
                    total: 0,
                    currentPage: 1,
                    pages: 1,
                }));
            }

        } catch (error) {
            if (requestId !== requestIdRef.current) return;
            console.log(error);
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
            }
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        const requestId = ++requestIdRef.current;

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
                if (status.trim()) params.append('statuses', status.trim());
            });

            selectedSubtatuses.forEach(status => {
                if (status.trim()) params.append('sub_status', status.trim());
            });

            const result = await fetchAgentAuxReportAPI(params.toString(), headers);

            if (requestId !== requestIdRef.current) return;

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
            if (requestId !== requestIdRef.current) return;
            console.log(error);
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
            }
        }
    };

    const confirmAndDownload = async () => {
        if (!pendingDownloadType || !token) return;

        setShowConfirmModal(false);
        setIsExporting(true);
        setExportProgress(0);

        try {
            const params = new URLSearchParams();
            params.append('from', `${endDate}T00:00:00Z`);
            params.append('to', `${endDate}T23:59:59Z`);
            params.append('format', selectedFormat);
            params.append('type', pendingDownloadType);

            selectedAgents.forEach(agent => agent.trim() && params.append('agents', agent.trim()));
            selectedStatuses.forEach(s => s.trim() && params.append('statuses', s.trim()));
            selectedSubtatuses.forEach(s => s.trim() && params.append('sub_status', s.trim()));

            const url = `${server_url}/download/aux?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': pendingDownloadType === 'csv'
                        ? 'text/csv'
                        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.statusText}`);
            }

            const total = response.headers.get('Content-Length')
                ? parseInt(response.headers.get('Content-Length')!, 10)
                : null;

            const reader = response.body!.getReader();
            const chunks: BlobPart[] = [];
            let loaded = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value?.length || 0;

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
                ? `Aux_${endDate}.csv`
                : `Aux_${endDate}.xlsx`;
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
            toast.error('Failed to export file. Please try again.');
            setExportProgress(null);
            setIsExporting(false);
        } finally {
            setPendingDownloadType(null);
        }
    };

    const fetchAuxRecordCount = async (downloadType: 'excel' | 'csv' = 'excel') => {
        if (!token) return;

        setIsFetchingCount(true);
        setShowConfirmModal(true);
        setAuxRecordCount(null);

        try {
            const params = new URLSearchParams();
            params.append('to', endDate);

            selectedAgents.forEach(agent => {
                if (agent.trim()) params.append('agents', agent.trim());
            });

            selectedStatuses.forEach(s => s.trim() && params.append('statuses', s.trim()));
            selectedSubtatuses.forEach(s => s.trim() && params.append('sub_status', s.trim()));

            const headers: Headers = { authorization: `Bearer ${token}` };

            const result = await fetchAgentAuxCountAPI(params.toString(), headers);

            if (result.success && result.data?.totalRecords != null) {
                setAuxRecordCount(result.data.totalRecords);
            } else {
                setAuxRecordCount(0);
                toast.error('Could not fetch record count');
            }

        } catch (err) {
            console.error(err);
            toast.error('Failed to get record count');
            setAuxRecordCount(0);
        } finally {
            setIsFetchingCount(false);
        }
        setPendingDownloadType(downloadType);
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
                title="Agent Aux Report"
                startDate={startDate}
                endDate={endDate}
                visibleColumns={visibleColumns}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                fetchReports={fetchAuxReports}
                refreshReports={handleRefresh}
                setVisibleColumns={setVisibleColumns}
                onExcelDownload={fetchAuxRecordCount}
                onCSVDownload={() => fetchAuxRecordCount('csv')}            >
                <div className="flex space-x-4">
                    <select
                        className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-40"
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value as 'ASC' | 'DESC')}
                    >
                        <option value="DESC">Newest First</option>
                        <option value="ASC">Oldest First</option>
                    </select>
                    <MultiSelectDropdown
                        options={allAgents}
                        selected={selectedAgents}
                        onChange={setSelectedAgents}
                        placeholder="All Agents"
                    />
                    <MultiSelectDropdown
                        options={allStatus}
                        selected={selectedStatuses}
                        onChange={setSelectedStatuses}
                        placeholder="All Statuses"
                    />
                    <MultiSelectDropdown
                        options={allSubstatus}
                        selected={selectedSubtatuses}
                        onChange={setSelectedSubtatuses}
                        placeholder="All Sub Statuses"
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
                                        {visibleColumns.user_name && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Name</th>
                                        )}
                                        {visibleColumns.user_id && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">ID</th>
                                        )}
                                        {visibleColumns.user_status && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Status</th>
                                        )}
                                        {visibleColumns.user_sub_status && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Sub Status</th>
                                        )}
                                        {visibleColumns.start_time_tz && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">Start Time</th>
                                        )}
                                        {visibleColumns.end_time_tz && (
                                            <th className="px-3 py-2 text-left text-gray-500 font-medium">End Time</th>
                                        )}
                                        {visibleColumns.duration && (
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
                                                {visibleColumns.user_status && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {report.user_status || '-'}
                                                    </td>
                                                )}
                                                {visibleColumns.user_sub_status && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {report.user_sub_status || '-'}
                                                    </td>
                                                )}
                                                {visibleColumns.start_time_tz && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDateTime(report.start_time_tz)}
                                                    </td>
                                                )}
                                                {visibleColumns.end_time_tz && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDateTime(report.end_time_tz)}
                                                    </td>
                                                )}
                                                {visibleColumns.duration && (
                                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDuration(report.duration)}
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
                                    disabled={pagination.currentPage === 1 || isLoading}
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
                                    disabled={pagination.currentPage * pagination.limit >= pagination.total || isLoading}
                                    aria-label="Next Page"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Confirm Download
                        </h3>

                        {isFetchingCount ? (
                            <p className="text-gray-600 mb-6">Fetching record count...</p>
                        ) : (
                            <p className="text-gray-600 mb-6">
                                Proceed to download <strong>{auxRecordCount?.toLocaleString() ?? '—'}</strong> records
                                for <strong>{formatDate(endDate)}</strong>?
                            </p>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setPendingDownloadType(null);
                                    setAuxRecordCount(null);
                                }}
                                disabled={isFetchingCount}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmAndDownload}
                                disabled={isFetchingCount || auxRecordCount === null || auxRecordCount === 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition disabled:opacity-50"
                            >
                                {isFetchingCount ? 'Loading...' : 'Download Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Page