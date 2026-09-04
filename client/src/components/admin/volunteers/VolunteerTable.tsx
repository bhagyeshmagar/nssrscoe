import type { VolunteerWithProfile, AcademicYear } from '../../../services/api';

interface Props {
    vols: VolunteerWithProfile[];
    actionId: number | null;
    setViewProfileId: (id: number | null) => void;
    handleStatusChange: (id: number, s: 'regular' | 'backup') => void;
    handleToggleActive: (id: number) => void;
    handleDelete: (id: number) => void;
    selectedAY: AcademicYear | null;
    
    // Pagination
    page: number;
    setPage: (p: React.SetStateAction<number>) => void;
    totalPages: number;

    isSuperadmin?: boolean;
}

export const VolunteerTable = ({
    vols, actionId, setViewProfileId, handleStatusChange, handleToggleActive, handleDelete, selectedAY,
    page, setPage, totalPages, isSuperadmin
}: Props) => {
    return (
        <>
            <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {['Name', 'Email', 'Department', 'Status', 'Attended', 'Active', 'Actions'].map(h => (
                                <th key={h} className={`px-4 py-3 text-gray-600 font-medium ${h === 'Attended' ? 'text-center' : 'text-left'}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {vols.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No volunteers found.</td></tr>}
                        {vols.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                                <td className="px-4 py-3 text-gray-600">{v.email}</td>
                                <td className="px-4 py-3 text-gray-600 text-xs">{v.department}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.status === 'regular' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{v.status}</span></td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-700">{v.eventsAttendedCount ?? 0}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{v.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1 flex-wrap">
                                        <button onClick={() => setViewProfileId(v.id)} disabled={actionId === v.id} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50">View</button>
                                        {selectedAY && !selectedAY.isLocked && (
                                            <>
                                                <button onClick={() => handleStatusChange(v.id, v.status === 'regular' ? 'backup' : 'regular')} disabled={actionId === v.id} className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50">→ {v.status === 'regular' ? 'Backup' : 'Regular'}</button>
                                                <button onClick={() => handleToggleActive(v.id)} disabled={actionId === v.id} className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50">{v.isActive ? 'Deactivate' : 'Activate'}</button>
                                                <button onClick={() => handleDelete(v.id)} disabled={actionId === v.id} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50">Del</button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow mt-4">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50">Previous</button>
                    <span className="text-gray-600 text-sm font-medium">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50">Next</button>
                </div>
            )}

        </>
    );
};
