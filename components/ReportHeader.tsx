'use client'
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { AlignJustify, Download, Filter, RefreshCcw } from 'lucide-react';

interface VisibleColumnType {
    [key: string]: boolean;
}

interface ReportProps {
    title: string;
    startDate: string;
    endDate: string;
    visibleColumns: VisibleColumnType;
    refresh?: boolean;
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    setVisibleColumns: React.Dispatch<React.SetStateAction<VisibleColumnType>>;
    fetchReports: () => void;
    refreshReports: () => void;
    onExcelDownload: () => void;
    onCSVDownload: () => void;
    children: ReactNode;
}

const ReportHeader: React.FC<ReportProps> = ({ title, startDate, endDate, visibleColumns, refresh = true, setStartDate, setEndDate, fetchReports, refreshReports, setVisibleColumns, onExcelDownload, onCSVDownload, children }) => {
    const [showColumnMenu, setShowColumnMenu] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowColumnMenu(false);
            }
        };

        if (showColumnMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColumnMenu]);

    return (
        <>
            {/* title & download buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-blue-800">{title}</h2>
                <div className="flex flex-wrap gap-2">
                    <button onClick={onExcelDownload} className="px-3 py-1.5 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-600 flex items-center border border-blue-600 shadow-sm">
                        <Download size={16} className="mr-2" />Excel
                    </button>
                    <button onClick={onCSVDownload} className="px-3 py-1.5 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-600 flex items-center border border-blue-600 shadow-sm">
                        <Download size={16} className="mr-2" />CSV
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button className="px-3 py-1.5 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-600 flex items-center border border-blue-600 shadow-sm"
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                        >
                            <AlignJustify size={16} className="mr-2" />Columns
                        </button>
                        {showColumnMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                <div className="p-2 max-h-96 overflow-y-auto">
                                    {Object.keys(visibleColumns).map((column) => (
                                        <label key={column} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns[column as keyof VisibleColumnType]}
                                                onChange={() =>
                                                    setVisibleColumns((prev) => ({
                                                        ...prev,
                                                        [column]: !prev[column as keyof VisibleColumnType],
                                                    }))
                                                }
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 capitalize">
                                                {column.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {
                        refresh &&
                        <button className="px-3 py-1.5 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-600 flex items-center border border-blue-600 shadow-sm"
                            onClick={refreshReports}
                        >
                            <RefreshCcw size={16} className="mr-2" />Refresh
                        </button>
                    }
                </div>
            </div>
            {/* filters */}
            <div className="bg-white rounded-lg shadow w-full p-4">
                <div className="flex items-center justify-between flex-wrap">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">From:</span>
                            <input type="date" className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-32"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">To:</span>
                            <input type="date" className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-32"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center">
                            <div className="h-8 border-l border-gray-300 mx-2"></div>
                            <div className="flex items-center space-x-1 text-gray-700">
                                <Filter size={18} />
                                <span className="text-sm font-medium">Filters</span>
                            </div>
                            <div className="h-8 border-l border-gray-300 mx-2"></div>
                        </div>
                        <div>
                            {children}
                        </div>
                    </div>
                    <button
                        className="mt-4 sm:mt-0 px-4 py-1.5 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-600 border border-blue-600 shadow-sm"
                        onClick={fetchReports}
                    >
                        Generate Report
                    </button>
                </div>
            </div>
        </>
    );
};

export default ReportHeader;