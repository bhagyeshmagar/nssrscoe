import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
    eventsAPI, galleryAPI, membersAPI, settingsAPI,
    academicYearsAPI, decodeToken
} from '../services/api';
import type { SiteSettings, AcademicYear, EventData, GalleryItem, MemberData } from '../services/api';

import { AYStatusBadge } from '../components/admin/Shared';

import { useAuthStore } from '../stores/authStore';
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
const EmailServiceTab = lazy(() => import('../components/admin/EmailServiceTab').then(m => ({ default: m.EmailServiceTab })));

type TabType =
    | 'overview' | 'academic-years' | 'volunteers' | 'core-team'
    | 'attendance' | 'special-camps' | 'archive' | 'activity-calendar'
    | 'events' | 'registrations' | 'gallery' | 'members' | 'settings' | 'slider' | 'admins' | 'profile' | 'meetings' | 'audit-logs' | 'email-service';

const getTabGroups = (isSuperadmin: boolean) => [
    {
        label: 'AY Platform', tabs: [
            { id: 'overview', label: 'Overview', icon: '🏠' },
            { id: 'academic-years', label: 'Academic Years', icon: '🏛️' },
            { id: 'activity-calendar', label: 'Activity Calendar', icon: '📅' },
            { id: 'volunteers', label: 'Volunteers', icon: '🦾' },
            { id: 'core-team', label: 'Core Team', icon: '👥' },
            { id: 'attendance', label: 'Attendance', icon: '🧾' },
            { id: 'meetings', label: 'Meetings', icon: '🗣️' },
            { id: 'special-camps', label: 'Special Camps', icon: '⛺' },
            { id: 'audit-logs', label: 'Audit Logs', icon: '📜' },
            { id: 'archive', label: 'Archive', icon: '🗄️' },
        ]
    },
    {
        label: 'Site Management', tabs: [
            { id: 'events', label: 'Events', icon: '🎯' },
            { id: 'registrations', label: 'Registrations', icon: '📝' },
            { id: 'gallery', label: 'Gallery', icon: '🖼️' },
            { id: 'slider', label: 'Home Slider', icon: '🖼️' },
            { id: 'email-service', label: 'Email Service', icon: '📧' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
            ...(isSuperadmin ? [{ id: 'admins', label: 'Admins', icon: '🔑' }] : []),
        ]
    },
    {
        label: 'Account', tabs: [
            { id: 'profile', label: 'My Profile', icon: '👤' },
        ]
    },
];

const AdminDashboard = () => {
    const { token } = useAuthStore();
    const isSuperadmin = token ? decodeToken(token)?.role === 'superadmin' : false;
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [years, setYears] = useState<AcademicYear[]>([]);
    const [currentAY, setCurrentAY] = useState<AcademicYear | null>(null);

    const [events, setEvents] = useState<EventData[]>([]);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [members, setMembers] = useState<MemberData[]>([]);
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    const [showEventForm, setShowEventForm] = useState(false);
    const [showGalleryForm, setShowGalleryForm] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const tabGroups = getTabGroups(isSuperadmin);

    const loadYears = useCallback(async () => {
        try {
            const [allRes, currRes] = await Promise.all([
                academicYearsAPI.getAll(),
                academicYearsAPI.getCurrent().catch(() => ({ data: { data: null } })),
            ]);
            const yearsArr = allRes.data.data;
            const currentAyObj = currRes.data.data ?? null;
            setYears(Array.isArray(yearsArr) ? yearsArr : []);
            setCurrentAY(currentAyObj);
        } catch { setYears([]); }
    }, []);

     
    useEffect(() => { loadYears(); }, [loadYears]);

    const fetchSiteData = useCallback(async () => {
        const siteTabs = ['overview', 'events', 'gallery', 'members', 'settings', 'slider'];
        if (!siteTabs.includes(activeTab)) return;
        setLoading(true);
        try {
            switch (activeTab) {
                case 'overview': { const [eR, gR, mR] = await Promise.all([eventsAPI.getAll(), galleryAPI.getAdminAll(), membersAPI.getAll()]); setEvents((eR.data.data as EventData[]) || []); setGallery((gR.data.data as GalleryItem[]) || []); setMembers((mR.data.data as MemberData[]) || []); break; }
                case 'events': { const r = await eventsAPI.getAll(); setEvents((r.data.data as EventData[]) || []); break; }
                case 'gallery': { const r = await galleryAPI.getAdminAll(); setGallery((r.data.data as GalleryItem[]) || []); break; }
                case 'members': { const r = await membersAPI.getAll(); setMembers((r.data.data as MemberData[]) || []); break; }
                case 'settings': { const r = await settingsAPI.get(); setSettings(r.data.data as SiteSettings); break; }
                case 'slider': { const [sR, eR] = await Promise.all([settingsAPI.get(), eventsAPI.getAll()]); setSettings(sR.data.data as SiteSettings); setEvents((eR.data.data as EventData[]) || []); break; }
            }
        } catch (e) { console.error('fetchSiteData:', e); }
        setLoading(false);
    }, [activeTab]);

     
    useEffect(() => { fetchSiteData(); }, [fetchSiteData]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-nss-blue text-white px-4 md:px-6 py-4 flex justify-between items-center shadow-md flex-shrink-0 relative z-40">
                <div className="flex items-center gap-3 md:gap-4">
                    <button 
                        className="md:hidden p-1.5 hover:bg-white/20 rounded transition"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <h1 className="text-xl font-bold">NSS Admin</h1>
                    {currentAY && (
                        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-sm">
                            <span className="font-medium">AY {currentAY.label}</span>
                            <AYStatusBadge ay={currentAY} />
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 md:hidden" 
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <aside className={`absolute md:relative inset-y-0 left-0 z-50 w-56 bg-white shadow-md transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex-shrink-0 overflow-y-auto`}>
                    <div className="md:hidden flex justify-end p-2 border-b">
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <nav className="py-3">
                        {tabGroups.map(group => (
                            <div key={group.label} className="mb-2">
                                <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
                                {group.tabs.map(tab => (
                                    <button key={tab.id} onClick={() => { setActiveTab(tab.id as TabType); setIsSidebarOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-gray-200 text-gray-600 flex-shrink-0">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
                    ) : (
                        <Suspense fallback={<div className="flex justify-center items-center h-64 text-gray-500 font-medium animate-pulse">Loading component...</div>}>
                            {activeTab === 'overview' && <OverviewTab events={events} gallery={gallery} members={members} currentAY={currentAY} />}
                            {activeTab === 'academic-years' && <AcademicYearsTab years={years} onRefresh={loadYears} isSuperadmin={isSuperadmin} />}
                            {activeTab === 'activity-calendar' && <ActivityCalendarTab events={events} years={years} currentAY={currentAY} />}
                            {activeTab === 'volunteers' && <AYVolunteersTab years={years} currentAY={currentAY} isSuperadmin={isSuperadmin} />}
                            { activeTab === 'core-team' && <CoreTeamTab years={years} currentAY={currentAY} isSuperadmin={isSuperadmin} />}
                            {activeTab === 'attendance' && <AttendanceTab years={years} currentAY={currentAY} />}
                            {activeTab === 'meetings' && <MeetingsTab years={years} currentAY={currentAY} />}
                            {activeTab === 'special-camps' && <SpecialCampsTab years={years} currentAY={currentAY} />}
                            {activeTab === 'audit-logs' && <AuditLogTab />}
                            {activeTab === 'archive' && <ArchiveTab years={years} />}
                            {activeTab === 'events' && <EventsTab events={events} onRefresh={fetchSiteData} showForm={showEventForm} setShowForm={setShowEventForm} editingItem={editingItem} setEditingItem={setEditingItem} years={years} currentAY={currentAY} isSuperadmin={isSuperadmin} />}
                            {activeTab === 'registrations' && <RegistrationsTab events={events} />}
                            {activeTab === 'gallery' && <GalleryTab gallery={gallery} onRefresh={fetchSiteData} showForm={showGalleryForm} setShowForm={setShowGalleryForm} editingItem={editingItem} setEditingItem={setEditingItem} isSuperadmin={isSuperadmin} />}
                            {activeTab === 'slider' && <SliderTab settings={settings} events={events} onRefresh={fetchSiteData} />}
                            {activeTab === 'settings' && <SettingsTab settings={settings} onRefresh={fetchSiteData} />}
                            {activeTab === 'admins' && <AdminsTab />}
                            {activeTab === 'profile' && <ProfileTab />}
                            {activeTab === 'email-service' && <EmailServiceTab />}
                        </Suspense>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
