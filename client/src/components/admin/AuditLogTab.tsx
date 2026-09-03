import { useState, useEffect } from 'react';
import type { AuditLog } from '../../services/api';
import { auditAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { ExportDataModal } from '../common/ExportDataModal';



const AuditLogTab = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
    const [exportData, setExportData] = useState<AuditLog[]>([]);

    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
        performedById: '',
        startDate: '',
        endDate: '',
    });
    const [appliedFilters, setAppliedFilters] = useState(filters);

    const fetchLogs = async (currentPage: number, currentFilters = appliedFilters) => {
        try {
            setLoading(true);
            const activeFilters = {
                action: currentFilters.action || undefined,
                entityType: currentFilters.entityType || undefined,
                performedById: currentFilters.performedById ? parseInt(currentFilters.performedById) : undefined,
                startDate: currentFilters.startDate || undefined,
                endDate: currentFilters.endDate || undefined,
            };
            const res = await auditAPI.getLogs(currentPage, 20, activeFilters);
            if (res.data.success) {
                const logsData = res.data.data;
                const metaData = res.data.meta;
                setLogs(Array.isArray(logsData) ? logsData : []);
                setTotalPages((metaData as any)?.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    const handleExportClick = async () => {
        setExportStatus('loading');
        try {
            let allLogs: AuditLog[] = [];
            let currentExportPage = 1;
            let exportTotalPages = 1;
            
            const activeFilters = {
                action: appliedFilters.action || undefined,
                entityType: appliedFilters.entityType || undefined,
                performedById: appliedFilters.performedById ? parseInt(appliedFilters.performedById) : undefined,
                startDate: appliedFilters.startDate || undefined,
                endDate: appliedFilters.endDate || undefined,
            };

            // Fetch first page to get total pages and first chunk
            const firstRes = await auditAPI.getLogs(currentExportPage, 1000, activeFilters);
            if (firstRes.data.success) {
                allLogs = allLogs.concat(Array.isArray(firstRes.data.data) ? firstRes.data.data : []);
                exportTotalPages = (firstRes.data.meta as any)?.totalPages || 1;
            }

            // Loop to fetch any remaining pages if total exceeds chunk limit
            const MAX_PAGES = 100; // Safety cap: max 100,000 logs per export
            while (currentExportPage < exportTotalPages && currentExportPage < MAX_PAGES) {
                currentExportPage++;
                const res = await auditAPI.getLogs(currentExportPage, 1000, activeFilters);
                if (res.data.success) {
                    allLogs = allLogs.concat(Array.isArray(res.data.data) ? res.data.data : []);
                }
            }

            if (exportTotalPages > MAX_PAGES) {
                toast.error(`Export truncated to the first ${MAX_PAGES * 1000} records to prevent browser crash.`);
            }

            setExportData(allLogs);
            setExportStatus('ready');
        } catch (error) {
            console.error('Failed to fetch export data', error);
            toast.error('Failed to load export data');
            setExportStatus('idle');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">System Audit Logs</h2>
                <button
                    onClick={handleExportClick}
                    disabled={exportStatus === 'loading'}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {exportStatus === 'loading' ? 'Preparing...' : 'Export to CSV'}
                </button>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Action</label>
                    <input type="text" value={filters.action} onChange={e => setFilters({...filters, action: e.target.value})} placeholder="e.g. create" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200" />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Entity Type</label>
                    <input type="text" value={filters.entityType} onChange={e => setFilters({...filters, entityType: e.target.value})} placeholder="e.g. achievement" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200" />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Admin ID</label>
                    <input type="number" value={filters.performedById} onChange={e => setFilters({...filters, performedById: e.target.value})} placeholder="e.g. 1" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200" />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
                    <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
                    <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setAppliedFilters(filters); setPage(1); fetchLogs(1, filters); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">Apply</button>
                    <button onClick={() => { 
                        const empty = {action:'', entityType:'', performedById:'', startDate:'', endDate:''};
                        setFilters(empty);
                        setAppliedFilters(empty);
                        setPage(1);
                        fetchLogs(1, empty);
                    }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors">Clear</button>
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Timestamp</th>
                                <th className="px-6 py-4 font-medium">Action</th>
                                <th className="px-6 py-4 font-medium">Entity</th>
                                <th className="px-6 py-4 font-medium">Performed By</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No logs found</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-200">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-slate-700/50 rounded text-xs">
                                                {log.entityType} #{log.entityId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {log.performedByUsername ? (
                                                <span className="font-medium text-slate-300">{log.performedByUsername}</span>
                                            ) : (
                                                <span className="text-slate-500">ID: {log.performedById}</span>
                                            )}
                                            <span className="ml-2 text-xs text-slate-500">({log.performedByRole})</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate" title={log.details || ''}>
                                            {log.details || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700/50">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="px-4 py-2 bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm"
                    >
                        Previous
                    </button>
                    <span className="text-slate-400 text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="px-4 py-2 bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm"
                    >
                        Next
                    </button>
                </div>
            )}

            <ExportDataModal
                isOpen={exportStatus === 'ready'}
                data={exportData}
                filename="audit_logs"
                onClose={() => setExportStatus('idle')}
                columns={[
                    { key: 'createdAt', label: 'Timestamp' },
                    { key: 'action', label: 'Action' },
                    { key: 'entityType', label: 'Entity Type' },
                    { key: 'entityId', label: 'Entity ID' },
                    { key: 'performedByUsername', label: 'Performed By Username' },
                    { key: 'performedByRole', label: 'Role' },
                    { key: 'performedById', label: 'Performed By ID' },
                    { key: 'details', label: 'Details' }
                ]}
            />
        </div>
    );
};

export default AuditLogTab;
