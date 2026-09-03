import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { decodeToken } from '../services/api';

import { AdminLayout } from '../components/admin/AdminLayout';

const OverviewTab = lazy(() => import('../components/admin/OverviewTab').then(m => ({ default: m.OverviewTab })));
const AcademicYearsTab = lazy(() => import('../components/admin/AcademicYearsTab').then(m => ({ default: m.AcademicYearsTab })));
const ActivityCalendarTab = lazy(() => import('../components/admin/ActivityCalendarTab').then(m => ({ default: m.ActivityCalendarTab })));
const MeetingsTab = lazy(() => import('../components/admin/meetings/MeetingsTab').then(m => ({ default: m.MeetingsTab })));
const AYVolunteersTab = lazy(() => import('../components/admin/volunteers/AYVolunteersTab').then(m => ({ default: m.AYVolunteersTab })));
const CoreTeamTab = lazy(() => import('../components/admin/CoreTeamTab').then(m => ({ default: m.CoreTeamTab })));
const AttendanceTab = lazy(() => import('../components/admin/AttendanceTab').then(m => ({ default: m.AttendanceTab })));
const SpecialCampsTab = lazy(() => import('../components/admin/SpecialCampsTab').then(m => ({ default: m.SpecialCampsTab })));
const ArchiveTab = lazy(() => import('../components/admin/ArchiveTab').then(m => ({ default: m.ArchiveTab })));
const EventsTab = lazy(() => import('../components/admin/EventsTab').then(m => ({ default: m.EventsTab })));
const RegistrationsTab = lazy(() => import('../components/admin/RegistrationsTab').then(m => ({ default: m.RegistrationsTab })));
const GalleryTab = lazy(() => import('../components/admin/GalleryTab').then(m => ({ default: m.GalleryTab })));
const SettingsTab = lazy(() => import('../components/admin/settings/SettingsTab').then(m => ({ default: m.SettingsTab })));
const SliderTab = lazy(() => import('../components/admin/SliderTab').then(m => ({ default: m.SliderTab })));
const AdminsTab = lazy(() => import('../components/admin/AdminsTab').then(m => ({ default: m.AdminsTab })));
const ProfileTab = lazy(() => import('../components/admin/ProfileTab').then(m => ({ default: m.ProfileTab })));
const AuditLogTab = lazy(() => import('../components/admin/AuditLogTab'));
const ApprovalsTab = lazy(() => import('../components/admin/ApprovalsTab').then(m => ({ default: m.ApprovalsTab })));
const EmailServiceTab = lazy(() => import('../components/admin/EmailServiceTab').then(m => ({ default: m.EmailServiceTab })));
const InnovativeIdeasTab = lazy(() => import('../components/admin/InnovativeIdeasTab').then(m => ({ default: m.InnovativeIdeasTab })));
const AchievementsTab = lazy(() => import('../components/admin/AchievementsTab').then(m => ({ default: m.AchievementsTab })));

const AdminDashboard = () => {
    const { token } = useAuthStore();
    const isSuperadmin = token ? decodeToken(token)?.role === 'superadmin' : false;

    return (
        <Routes>
            <Route path="/" element={<AdminLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<OverviewTab />} />
                <Route path="academic-years" element={<AcademicYearsTab isSuperadmin={isSuperadmin} />} />
                <Route path="activity-calendar" element={<ActivityCalendarTab />} />
                <Route path="volunteers" element={<AYVolunteersTab isSuperadmin={isSuperadmin} />} />
                <Route path="core-team" element={<CoreTeamTab isSuperadmin={isSuperadmin} />} />
                <Route path="attendance" element={<AttendanceTab />} />
                <Route path="meetings" element={<MeetingsTab />} />
                <Route path="special-camps" element={<SpecialCampsTab />} />
                <Route path="audit-logs" element={<AuditLogTab />} />
                <Route path="archive" element={<ArchiveTab />} />
                <Route path="events" element={<EventsTab />} />
                <Route path="registrations" element={<RegistrationsTab />} />
                <Route path="gallery" element={<GalleryTab />} />
                <Route path="slider" element={<SliderTab />} />
                <Route path="innovative-ideas" element={<InnovativeIdeasTab />} />
                <Route path="achievements" element={<AchievementsTab />} />
                <Route path="approvals" element={isSuperadmin ? <ApprovalsTab /> : <Navigate to="/admin" replace />} />
                <Route path="settings" element={isSuperadmin ? <SettingsTab /> : <Navigate to="/admin" replace />} />
                <Route path="admins" element={<AdminsTab />} />
                <Route path="profile" element={<ProfileTab />} />
                <Route path="email-service" element={<EmailServiceTab />} />
                <Route path="*" element={<Navigate to="overview" replace />} />
            </Route>
        </Routes>
    );
};

export default AdminDashboard;
