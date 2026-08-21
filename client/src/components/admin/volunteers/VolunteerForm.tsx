import type { CreateVolunteerData, Department } from '../../../services/api';
import { DEPT_LIST } from '../../../lib/constants';

interface Props {
    form: CreateVolunteerData;
    setForm: (form: CreateVolunteerData) => void;
    isSubmitting: boolean;
    handleCreate: () => void;
    setShowForm: (show: boolean) => void;
}

export const VolunteerForm = ({ form, setForm, isSubmitting, handleCreate, setShowForm }: Props) => {
    return (
        <div className="mb-6 bg-white rounded-xl shadow p-6 border border-blue-100">
            <h3 className="font-semibold text-gray-700 mb-4">New Volunteer</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                    { k: 'name', l: 'Name', t: 'text' }, 
                    { k: 'email', l: 'Email', t: 'email' }, 
                    { k: 'password', l: 'Password', t: 'text' }
                ].map(f => (
                    <div key={f.k}>
                        <label className="block text-sm text-gray-600 mb-1">{f.l}</label>
                        <input type={f.t} value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                ))}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Department</label>
                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value as Department })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        {DEPT_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Status</label>
                    <select value={form.status ?? 'regular'} onChange={e => setForm({ ...form, status: e.target.value as 'regular' | 'backup' })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="regular">Regular</option>
                        <option value="backup">Backup</option>
                    </select>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={handleCreate} disabled={isSubmitting} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">{isSubmitting ? 'Adding...' : 'Add'}</button>
                <button onClick={() => setShowForm(false)} disabled={isSubmitting} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            </div>
        </div>
    );
};
