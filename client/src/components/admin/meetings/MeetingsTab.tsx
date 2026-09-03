import { useState, useEffect } from 'react';
import type { Meeting, SpecialCamp } from '../../../services/api';
import { meetingsAPI, specialCampsAPI, decodeToken } from '../../../services/api';
import { useAYSelector } from '../Shared';
import { ExportDataModal } from '../../common/ExportDataModal';
import { MeetingAttendanceModal } from '../MeetingAttendanceModal';
import { Download } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import toast from 'react-hot-toast';
import { useAcademicYears } from '../../../hooks/useAcademicYears';

import { handleExportAttendanceXLSX } from './MeetingExportUtils';
import { MeetingForm } from './MeetingForm';
import { MeetingTable } from './MeetingTable';

export const MeetingsTab = () => {
    const { data: years = [] } = useAcademicYears();
    const { token } = useAuthStore();
    const isSuperadmin = token ? decodeToken(token)?.isSuperadmin : false;
    const { selectedAyId, setSelectedAyId } = useAYSelector(years, null);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [selectedMeetingForAttendance, setSelectedMeetingForAttendance] = useState<{ id: number, status: string, meetingType: string } | null>(null);
    const [exportingId, setExportingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionId, setActionId] = useState<number | null>(null);

    // Special camps for the current AY (used in camp picker)
    const [specialCamps, setSpecialCamps] = useState<SpecialCamp[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        meetingType: 'regular' as 'regular' | 'core_team' | 'special_camp',
        scheduledDate: '',
        location: '',
        sendEmail: false,
        specialCampId: undefined as number | undefined,
    });

    const loadMeetings = async () => {
        if (!selectedAyId) return;
        setLoading(true);
        try {
            const res = await meetingsAPI.getByAY(selectedAyId);
            setMeetings(res.data.data || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load meetings');
        }
        setLoading(false);
    };

    const loadSpecialCamps = async () => {
        if (!selectedAyId) return;
        try {
            const res = await specialCampsAPI.getByAY(selectedAyId);
            setSpecialCamps(res.data.data || []);
        } catch (err) {
            console.error('Failed to load special camps', err);
            toast.error('Failed to load special camps');
        }
    };

    useEffect(() => {
        loadMeetings();
        loadSpecialCamps();
    }, [selectedAyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.meetingType === 'special_camp' && !formData.specialCampId) {
            toast.error('Please select a Special Camp for this meeting.');
            return;
        }
        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                specialCampId: formData.meetingType === 'special_camp' ? formData.specialCampId : undefined,
            };
            if (editingMeeting) {
                await meetingsAPI.update(editingMeeting.id, payload);
            } else {
                await meetingsAPI.create(selectedAyId, payload);
            }
            setShowForm(false);
            setEditingMeeting(null);
            loadMeetings();
            toast.success(editingMeeting ? 'Meeting updated' : 'Meeting created');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save meeting');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (meeting: Meeting) => {
        setFormData({
            title: meeting.title,
            description: meeting.description || '',
            meetingType: meeting.meetingType,
            scheduledDate: new Date(meeting.scheduledDate).toISOString().slice(0, 16),
            location: meeting.location,
            sendEmail: false,
            specialCampId: meeting.specialCampId ?? undefined,
        });
        setEditingMeeting(meeting);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this meeting?')) return;
        try {
            setActionId(id);
            await meetingsAPI.delete(id);
            toast.success('Meeting deleted');
            loadMeetings();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete meeting');
        } finally {
            setActionId(null);
        }
    };

    const handleAction = async (id: number, action: 'start' | 'end' | 'reopen') => {
        try {
            setActionId(id);
            if (action === 'start') await meetingsAPI.start(id);
            if (action === 'end') await meetingsAPI.end(id);
            if (action === 'reopen') await meetingsAPI.reopen(id);
            toast.success(`Meeting ${action}ed successfully`);
            loadMeetings();
        } catch (err) {
            console.error(err);
            toast.error(`Failed to ${action} meeting`);
        } finally {
            setActionId(null);
        }
    };

    const handleExportAttendance = async (meeting: Meeting) => {
        setExportingId(meeting.id);
        await handleExportAttendanceXLSX(meeting.id);
        setExportingId(null);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Meetings</h2>
                    <select
                        value={selectedAyId || ''}
                        onChange={(e) => setSelectedAyId(Number(e.target.value))}
                        className="border rounded px-3 py-1.5 text-sm"
                    >
                        <option value={0} disabled>Select AY</option>
                        {years.map(y => (
                            <option key={y.id} value={y.id}>{y.label} {y.isCurrent ? '(Current)' : ''}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowExportModal(true)} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center">
                        <Download className="w-4 h-4 mr-1" /> Export
                    </button>
                    <button
                        onClick={() => {
                            setEditingMeeting(null);
                            setFormData({ title: '', description: '', meetingType: 'regular', scheduledDate: '', location: '', sendEmail: false, specialCampId: undefined });
                            setShowForm(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm font-medium"
                    >
                        + Schedule Meeting
                    </button>
                </div>
            </div>

            {showForm && (
                <MeetingForm 
                    formData={formData as any} 
                    setFormData={setFormData as any} 
                    editingMeeting={editingMeeting} 
                    specialCamps={specialCamps} 
                    handleSubmit={handleSubmit} 
                    setShowForm={setShowForm} 
                    isSubmitting={isSubmitting} 
                />
            )}

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading meetings...</div>
            ) : (
                <MeetingTable 
                    meetings={meetings} 
                    isSuperadmin={isSuperadmin} 
                    actionId={actionId} 
                    exportingId={exportingId} 
                    handleAction={handleAction} 
                    handleExportAttendance={handleExportAttendance} 
                    setSelectedMeetingForAttendance={setSelectedMeetingForAttendance} 
                    setAttendanceModalOpen={setAttendanceModalOpen} 
                    handleEdit={handleEdit} 
                    handleDelete={handleDelete} 
                />
            )}

            <ExportDataModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={meetings}
                columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'meetingType', label: 'Type' },
                    { key: 'description', label: 'Description' },
                    { key: 'scheduledDate', label: 'Scheduled Date' },
                    { key: 'location', label: 'Location' },
                    { key: 'status', label: 'Status' }
                ]}
                filename="Meetings_Export"
            />
            {selectedMeetingForAttendance && (
                <MeetingAttendanceModal
                    isOpen={attendanceModalOpen}
                    onClose={() => setAttendanceModalOpen(false)}
                    meetingId={selectedMeetingForAttendance.id}
                    meetingStatus={selectedMeetingForAttendance.status}
                    meetingType={selectedMeetingForAttendance.meetingType}
                />
            )}
        </div>
    );
};
