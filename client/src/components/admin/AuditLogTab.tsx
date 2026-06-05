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
    const [isExporting, setIsExporting] = useState(false);

    const fetchLogs = async (currentPage: number) => {
        try {
            setLoading(true);
            const res = await auditAPI.getLogs(currentPage, 20);
            if (res.data.success) {
                const logsData = res.data.data;
                const metaData = res.data.meta;
                setLogs(Array.isArray(logsData) ? logsData : []);
                setTotalPages(metaData?.totalPages || 1);
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">System Audit Logs</h2>
                <button
                    onClick={() => setIsExporting(true)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Export to CSV
                </button>
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
                                            {log.performedByRole} #{log.performedById}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
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
                        disabled={page === 1}
                        className="px-4 py-2 bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm"
                    >
                        Previous
                    </button>
                    <span className="text-slate-400 text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm"
                    >
                        Next
                    </button>
                </div>
            )}

            {isExporting && (
                <ExportDataModal
                    isOpen={isExporting}
                    data={logs}
                    filename="audit_logs.csv"
                    onClose={() => setIsExporting(false)}
                    columns={[
                        { key: 'createdAt', label: 'Timestamp' },
                        { key: 'action', label: 'Action' },
                        { key: 'entityType', label: 'Entity Type' },
                        { key: 'entityId', label: 'Entity ID' },
                        { key: 'performedByRole', label: 'Performed By' },
                        { key: 'performedById', label: 'Performed By ID' },
                        { key: 'details', label: 'Details' }
                    ]}
                />
            )}
        </div>
    );
};

export default AuditLogTab;
