import type { Meeting, SpecialCamp } from '../../../services/api';

interface FormData {
    title: string;
    description: string;
    meetingType: 'regular' | 'core_team' | 'special_camp';
    scheduledDate: string;
    location: string;
    sendEmail: boolean;
    specialCampId: number | undefined;
}

interface Props {
    formData: FormData;
    setFormData: (data: FormData) => void;
    editingMeeting: Meeting | null;
    specialCamps: SpecialCamp[];
    handleSubmit: (e: React.FormEvent) => void;
    setShowForm: (show: boolean) => void;
    isSubmitting: boolean;
}

export const MeetingForm = ({ formData, setFormData, editingMeeting, specialCamps, handleSubmit, setShowForm, isSubmitting }: Props) => {
    return (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-bold mb-4">{editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        value={formData.meetingType}
                        onChange={e => setFormData({ ...formData, meetingType: e.target.value as 'regular' | 'core_team' | 'special_camp', specialCampId: undefined })}
                        className="w-full border rounded px-3 py-2 text-sm"
                    >
                        <option value="regular">Regular Meeting</option>
                        <option value="core_team">Core Team Meeting</option>
                        <option value="special_camp">Special Camp Meeting</option>
                    </select>
                </div>

                {/* Camp picker — shown only when special_camp is selected */}
                {formData.meetingType === 'special_camp' && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Special Camp <span className="text-red-500">*</span>
                        </label>
                        {specialCamps.length === 0 ? (
                            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                No special camps found for this Academic Year. Please create one first.
                            </p>
                        ) : (
                            <select
                                required
                                value={formData.specialCampId ?? ''}
                                onChange={e => setFormData({ ...formData, specialCampId: Number(e.target.value) })}
                                className="w-full border rounded px-3 py-2 text-sm"
                            >
                                <option value="" disabled>Select a camp...</option>
                                {specialCamps.map(camp => (
                                    <option key={camp.id} value={camp.id}>
                                        {camp.name} — {camp.location}{camp.isFinalized ? ' ✓ Finalized' : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Only volunteers enrolled in this camp will receive notifications and be listed in attendance.</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
                    <input type="datetime-local" required value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={2} />
                </div>
                {!editingMeeting && (
                    <div className="md:col-span-2 flex items-center gap-2 mt-2">
                        <input type="checkbox" id="sendEmail" checked={formData.sendEmail} onChange={e => setFormData({ ...formData, sendEmail: e.target.checked })} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                        <label htmlFor="sendEmail" className="text-sm text-gray-700">Send email notification to invited volunteers</label>
                    </div>
                )}
                <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save Meeting'}</button>
                </div>
            </form>
        </div>
    );
};
