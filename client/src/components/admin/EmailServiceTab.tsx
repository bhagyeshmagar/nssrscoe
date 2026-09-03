import { useState, useEffect, useCallback } from 'react';
import { hodAPI, emailLogsAPI, DEPARTMENTS } from '../../services/api';
import type { HodContact, EmailLog, EmailStats } from '../../services/api';
import toast from 'react-hot-toast';
import {
    Mail, Users, BarChart2, Trash2, PlusCircle, CheckCircle2,
    XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Pencil
} from 'lucide-react';

// ─── Sub-tab type ─────────────────────────────────────────────────────────────
type SubTab = 'overview' | 'hod-contacts' | 'logs';

const EMAIL_TYPE_LABELS: Record<string, string> = {
    volunteer_welcome: '🎉 Welcome',
    volunteer_backup: '📋 Backup Status',
    volunteer_regular: '⭐ Regular Status',
    hod_attendance: '📊 HOD Report',
    meeting_notification: '📅 Meeting',
    pass_approval: '✅ Pass Approval',
};

const EMAIL_TYPE_COLORS: Record<string, string> = {
    volunteer_welcome: '#22c55e',
    volunteer_backup: '#f59e0b',
    volunteer_regular: '#3b82f6',
    hod_attendance: '#6366f1',
    meeting_notification: '#8b5cf6',
    pass_approval: '#10b981',
};

// ─── Overview Sub-tab ─────────────────────────────────────────────────────────

const OverviewTab = () => {
    const [stats, setStats] = useState<EmailStats | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await emailLogsAPI.getStats();
            setStats(res.data.data);
        } catch {
            toast.error('Failed to load email stats');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="flex items-center justify-center h-48 text-gray-400 animate-pulse">Loading stats…</div>;
    if (!stats) return null;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Emails', value: stats.total, color: '#6366f1', bg: '#ede9fe' },
                    { label: 'Successfully Sent', value: stats.totalSent, color: '#22c55e', bg: '#dcfce7' },
                    { label: 'Failed', value: stats.totalFailed, color: '#ef4444', bg: '#fee2e2' },
                    { label: 'Success Rate', value: `${stats.successRate}%`, color: '#3b82f6', bg: '#dbeafe' },
                ].map(card => (
                    <div key={card.label} className="rounded-xl p-4 border" style={{ background: card.bg, borderColor: card.color + '33' }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: card.color }}>{card.label}</p>
                        <p className="text-3xl font-black" style={{ color: card.color }}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* By Type */}
            {stats.byType.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Emails by Type</h3>
                    <div className="space-y-3">
                        {stats.byType.map(t => {
                            const color = EMAIL_TYPE_COLORS[t.emailType] ?? '#6b7280';
                            const pct = t.total > 0 ? Math.round((t.sent / t.total) * 100) : 0;
                            return (
                                <div key={t.emailType}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700">{EMAIL_TYPE_LABELS[t.emailType] ?? t.emailType}</span>
                                        <span className="text-xs text-gray-500">{t.sent}/{t.total} sent ({pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            {stats.recentLogs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Recent Activity</h3>
                    <div className="divide-y divide-gray-50">
                        {stats.recentLogs.map(log => (
                            <div key={log.id} className="py-3 flex items-start gap-3">
                                {log.status === 'sent'
                                    ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    : <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 truncate">{log.subject}</p>
                                    <p className="text-xs text-gray-400">{log.recipientEmail} · {new Date(log.sentAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                    style={{ background: (EMAIL_TYPE_COLORS[log.emailType] ?? '#6b7280') + '22', color: EMAIL_TYPE_COLORS[log.emailType] ?? '#6b7280' }}>
                                    {EMAIL_TYPE_LABELS[log.emailType] ?? log.emailType}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {stats.total === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No emails sent yet</p>
                    <p className="text-sm mt-1">Emails will appear here once the system starts sending them.</p>
                </div>
            )}
        </div>
    );
};

// ─── HOD Contacts Sub-tab ─────────────────────────────────────────────────────



const HodContactsTab = () => {
    const [hods, setHods] = useState<HodContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const [form, setForm] = useState({ department: '', name: '', email: '' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await hodAPI.getAll();
            setHods(res.data.data as any as HodContact[]);
        } catch { toast.error('Failed to load HOD contacts'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openAdd = () => {
        setEditId(null);
        setForm({ department: '', name: '', email: '' });
        setShowForm(true);
    };

    const openEdit = (hod: HodContact) => {
        setEditId(hod.id);
        setForm({ department: hod.department, name: hod.name, email: hod.email });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.department || !form.name || !form.email) {
            toast.error('All fields are required.');
            return;
        }
        setSaving(true);
        try {
            if (editId) {
                await hodAPI.update(editId, { name: form.name, email: form.email });
                toast.success('HOD contact updated!');
            } else {
                await hodAPI.upsert(form.department, form.name, form.email);
                toast.success('HOD contact saved!');
            }
            setShowForm(false);
            load();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Failed to save HOD contact.');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this HOD contact?')) return;
        setDeletingId(id);
        try {
            await hodAPI.delete(id);
            toast.success('HOD contact deleted.');
            load();
        } catch { toast.error('Failed to delete.'); }
        finally { setDeletingId(null); }
    };

    const handleToggle = async (hod: HodContact) => {
        setTogglingId(hod.id);
        try {
            await hodAPI.update(hod.id, { isActive: !hod.isActive });
            toast.success(`HOD contact ${hod.isActive ? 'deactivated' : 'activated'}.`);
            load();
        } catch { toast.error('Failed to toggle.'); }
        finally { setTogglingId(null); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Manage Head of Department (HOD) emails for each department. Active HODs receive attendance reports.</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                    <PlusCircle className="w-4 h-4" /> Add HOD
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <h3 className="font-bold text-gray-800 mb-4">{editId ? 'Edit HOD Contact' : 'Add HOD Contact'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {!editId && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                                <select
                                    value={form.department}
                                    onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select department…</option>
                                    {DEPARTMENTS.filter(d => !hods.some(h => h.department === d)).map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {editId && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                                <input value={form.department} disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500" />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">HOD Name</label>
                            <input
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Prof. John Doe"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">HOD Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                placeholder="hod@college.edu"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 justify-end">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="text-center py-10 text-gray-400 animate-pulse">Loading…</div>
            ) : hods.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No HOD contacts yet</p>
                    <p className="text-sm mt-1">Add department HOD emails to enable attendance report emails.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-gray-600">
                            <tr>
                                {['Department', 'HOD Name', 'Email', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {hods.map(hod => (
                                <tr key={hod.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-800">{hod.department}</td>
                                    <td className="px-4 py-3 text-gray-700">{hod.name}</td>
                                    <td className="px-4 py-3 text-blue-600 font-mono text-xs">{hod.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${hod.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {hod.isActive ? '● Active' : '○ Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(hod)}
                                                className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleToggle(hod)}
                                                disabled={togglingId === hod.id}
                                                className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600 transition-colors disabled:opacity-50"
                                                title={hod.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {hod.isActive
                                                    ? <ToggleRight className="w-4 h-4" />
                                                    : <ToggleLeft className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(hod.id)}
                                                disabled={deletingId === hod.id}
                                                className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ─── Email Log Sub-tab ─────────────────────────────────────────────────────────

const EmailLogsTab = () => {
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [emailTypes, setEmailTypes] = useState<string[]>([]);

    const LIMIT = 20;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [logsRes, statsRes] = await Promise.all([
                emailLogsAPI.getLogs({ emailType: typeFilter || undefined, status: (statusFilter as any) || undefined, page, limit: LIMIT }),
                page === 1 ? emailLogsAPI.getStats() : Promise.resolve(null),
            ]);
            const data: EmailLog[] = logsRes.data.data.data ?? [];
            setLogs(data);
            setHasMore(data.length === LIMIT);
            if (statsRes) {
                setEmailTypes((statsRes.data.data as any).emailTypes ?? []);
            }
        } catch { toast.error('Failed to load email logs'); }
        finally { setLoading(false); }
    }, [page, typeFilter, statusFilter]);

    useEffect(() => { load(); }, [load]);

    const handleFilter = (type: string, status: string) => {
        setTypeFilter(type);
        setStatusFilter(status);
        setPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
                <select
                    value={typeFilter}
                    onChange={e => handleFilter(e.target.value, statusFilter)}
                    className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">All Types</option>
                    {emailTypes.map(t => (
                        <option key={t} value={t}>{EMAIL_TYPE_LABELS[t] ?? t}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={e => handleFilter(typeFilter, e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">All Statuses</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                </select>
                <button onClick={() => { setPage(1); load(); }} className="p-1.5 rounded-lg border hover:bg-gray-50 text-gray-500 transition-colors" title="Refresh">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <span className="text-xs text-gray-400 ml-auto">Showing page {page}</span>
            </div>

            {/* Log Table */}
            {loading ? (
                <div className="text-center py-10 text-gray-400 animate-pulse">Loading logs…</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No email logs found</p>
                    {(typeFilter || statusFilter) && <p className="text-sm mt-1">Try clearing the filters.</p>}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b text-gray-600">
                            <tr>
                                {['Type', 'Subject', 'Recipient', 'Status', 'Sent At'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                                            background: (EMAIL_TYPE_COLORS[log.emailType] ?? '#6b7280') + '18',
                                            color: EMAIL_TYPE_COLORS[log.emailType] ?? '#6b7280',
                                        }}>
                                            {EMAIL_TYPE_LABELS[log.emailType] ?? log.emailType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={log.subject}>{log.subject}</td>
                                    <td className="px-4 py-3">
                                        <p className="text-gray-700 text-xs font-medium">{log.recipientName ?? '—'}</p>
                                        <p className="text-gray-400 text-xs font-mono">{log.recipientEmail}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.status === 'sent'
                                            ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold"><CheckCircle2 className="w-3 h-3" /> Sent</span>
                                            : (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold" title={log.errorMessage}>
                                                    <XCircle className="w-3 h-3" /> Failed
                                                </span>
                                            )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                        {new Date(log.sentAt).toLocaleString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-gray-500">Page {page}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore || loading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// ─── Main EmailServiceTab ─────────────────────────────────────────────────────

export const EmailServiceTab = () => {
    const [subTab, setSubTab] = useState<SubTab>('overview');

    const tabs: { key: SubTab; label: string; icon: React.ReactNode }[] = [
        { key: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
        { key: 'hod-contacts', label: 'HOD Contacts', icon: <Users className="w-4 h-4" /> },
        { key: 'logs', label: 'Email Log', icon: <Mail className="w-4 h-4" /> },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Email Service</h2>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setSubTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${subTab === t.key
                            ? 'bg-white shadow text-blue-700'
                            : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {subTab === 'overview' && <OverviewTab />}
            {subTab === 'hod-contacts' && <HodContactsTab />}
            {subTab === 'logs' && <EmailLogsTab />}
        </div>
    );
};
