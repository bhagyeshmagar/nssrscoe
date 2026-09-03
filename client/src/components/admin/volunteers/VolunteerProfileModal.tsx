import type { VolunteerWithProfile, VolunteerAttendanceRecord } from '../../../services/api';
import { uploadAPI } from '../../../services/api';

import { formatDate } from '@/utils/dateFormatter';
interface Props {
    vol?: VolunteerWithProfile;
    attendance: VolunteerAttendanceRecord[];
    loadingAttendance: boolean;
    isSuperadmin?: boolean;
    onApproveExperience?: (id: number) => void;
    isApproving?: boolean;
}

export const VolunteerProfileModal = ({ vol, attendance, loadingAttendance, isSuperadmin, onApproveExperience, isApproving }: Props) => {
    if (!vol) return <div className="py-8 text-center text-gray-500 font-medium">Volunteer not found or deleted.</div>;
    const p = vol.profile || {};
    const presentAttendance = attendance.filter(a => a.status === 'present');
    
    const renderField = (label: string, value: any) => (
        <div className="mb-4">
            <div className="text-xs text-gray-500 font-medium">{label}</div>
            <div className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded mt-1">{value || '-'}</div>
        </div>
    );
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full flex items-center gap-4 mb-4">
                {p.profilePhotoUrl ? (
                    <img src={uploadAPI.getFullUrl(p.profilePhotoUrl)} alt="Profile" className="w-24 h-24 rounded-full object-cover border" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">No Photo</div>
                )}
                <div>
                    <h4 className="text-lg font-bold text-gray-800">{vol.name}</h4>
                    <p className="text-sm text-gray-500">{vol.email}</p>
                    <span className="inline-block mt-1 bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600 border font-medium">
                        {vol.department}
                    </span>
                </div>
            </div>

            <div>
                <h5 className="font-bold text-gray-800 mb-3 border-b pb-1">Academic Details</h5>
                {renderField('Full Name', p.fullName)}
                {renderField('PRN Number', p.prnNo)}
                {renderField('College Year', p.collegeYearAtEnrollment)}
                {renderField('NSS Year', p.nssYear)}
            </div>
            <div>
                <h5 className="font-bold text-gray-800 mb-3 border-b pb-1">Personal Details</h5>
                {renderField('Phone Number', p.phoneNo)}
                {renderField('Email ID', p.emailId)}
                {isSuperadmin && (
                    <>
                        {renderField('Caste Category', p.casteCategory)}
                        {renderField('Religion / Caste', `${p.religion || '-'} / ${p.caste || '-'}`)}
                    </>
                )}
            </div>
            {p.experienceText && (
                <div className="col-span-full mt-4 bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                        <h5 className="font-semibold text-blue-800">Volunteer Experience</h5>
                        {isSuperadmin && !p.isExperienceApproved && (
                            <button 
                                onClick={() => onApproveExperience && onApproveExperience(vol.id)}
                                disabled={isApproving}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded shadow-sm disabled:opacity-50"
                            >
                                {isApproving ? 'Approving...' : 'Approve Experience'}
                            </button>
                        )}
                        {p.isExperienceApproved && (
                            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded">Approved</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-700 italic">"{p.experienceText}"</p>
                </div>
            )}
            {p.marksheetUrl && (
                <div className="col-span-full">
                    <a href={uploadAPI.getFullUrl(p.marksheetUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline">
                        📄 View Marksheet Document
                    </a>
                </div>
            )}

            {/* Attended Events Section */}
            <div className="col-span-full mt-6 border-t pt-4">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📅</span> Attended Events ({presentAttendance.length})
                </h5>
                {loadingAttendance ? (
                    <div className="text-sm text-gray-500 py-2">Loading attendance records...</div>
                ) : presentAttendance.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {presentAttendance.map((att, idx: number) => (
                            <div key={idx} className="bg-green-50/50 border border-green-100 rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">{att.sessionTitle}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{formatDate(att.date)}</div>
                                </div>
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold uppercase">Present</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 py-4 bg-gray-50 rounded-lg text-center border border-dashed">
                        No events attended yet for this academic year.
                    </div>
                )}
            </div>
        </div>
    );
};
