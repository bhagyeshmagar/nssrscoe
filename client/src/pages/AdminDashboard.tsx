import { useState, useEffect, useCallback } from 'react';
import {
    eventsAPI, galleryAPI, membersAPI, settingsAPI,
    academicYearsAPI, decodeToken
} from '../services/api';
import type { SiteSettings, AcademicYear } from '../services/api';

import { AYStatusBadge } from '../components/admin/Shared';
import { OverviewTab } from '../components/admin/OverviewTab';
import { AcademicYearsTab } from '../components/admin/AcademicYearsTab';
import { ActivityCalendarTab } from '../components/admin/ActivityCalendarTab';
import { AYVolunteersTab } from '../components/admin/AYVolunteersTab';
import { CoreTeamTab } from '../components/admin/CoreTeamTab';
import { AttendanceTab } from '../components/admin/AttendanceTab';
import { SpecialCampsTab } from '../components/admin/SpecialCampsTab';
import { ArchiveTab } from '../components/admin/ArchiveTab';
import { EventsTab } from '../components/admin/EventsTab';
import { RegistrationsTab } from '../components/admin/RegistrationsTab';
import { GalleryTab } from '../components/admin/GalleryTab';
import { MembersTab } from '../components/admin/MembersTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import { AdminsTab } from '../components/admin/AdminsTab';
import { ProfileTab } from '../components/admin/ProfileTab';

type TabType =
    | 'overview' | 'academic-years' | 'volunteers' | 'core-team'
    | 'attendance' | 'special-camps' | 'archive' | 'activity-calendar'
    | 'events' | 'registrations' | 'gallery' | 'members' | 'settings' | 'admins' | 'profile';

const getTabGroups = (isSuperadmin: boolean) => [
    {
        label: 'AY Platform', tabs: [
            { id: 'overview', label: 'Overview', icon: '🏠' },
            { id: 'academic-years', label: 'Academic Years', icon: '🏛️' },
            { id: 'activity-calendar', label: 'Activity Calendar', icon: '📅' },
            { id: 'volunteers', label: 'Volunteers', icon: '🦾' },
            { id: 'core-team', label: 'Core Team', icon: '👥' },
            { id: 'attendance', label: 'Attendance', icon: '🧾' },
            { id: 'special-camps', label: 'Special Camps', icon: '⛺' },
            { id: 'archive', label: 'Archive', icon: '🗄️' },
        ]
    },
    {
        label: 'Site Management', tabs: [
            { id: 'events', label: 'Events', icon: '🎯' },
            { id: 'registrations', label: 'Registrations', icon: '📝' },
            { id: 'gallery', label: 'Gallery', icon: '🖼️' },
            { id: 'members', label: 'Members', icon: '👥' },
            ...(isSuperadmin ? [{ id: 'settings', label: 'Settings', icon: '⚙️' }] : []),
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
    const token = localStorage.getItem('token');
    const isSuperadmin = token ? decodeToken(token)?.role === 'superadmin' : false;
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [years, setYears] = useState<AcademicYear[]>([]);
    const [currentAY, setCurrentAY] = useState<AcademicYear | null>(null);

    const [events, setEvents] = useState<any[]>([]);
    const [gallery, setGallery] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    const [showEventForm, setShowEventForm] = useState(false);
    const [showGalleryForm, setShowGalleryForm] = useState(false);
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const tabGroups = getTabGroups(isSuperadmin);

    const loadYears = useCallback(async () => {
        try {
            const [allRes, currRes] = await Promise.all([
                academicYearsAPI.getAll(),
                academicYearsAPI.getCurrent().catch(() => ({ data: { data: null } })),
            ]);
            const yearsArr = (allRes.data as any)?.data ?? allRes.data;
            const currentAyObj = (currRes.data as any)?.data ?? null;
            setYears(Array.isArray(yearsArr) ? yearsArr : []);
            setCurrentAY(currentAyObj);
        } catch { setYears([]); }
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadYears(); }, [loadYears]);

    const fetchSiteData = useCallback(async () => {
        const siteTabs = ['overview', 'events', 'gallery', 'members', 'settings'];
        if (!siteTabs.includes(activeTab)) return;
        setLoading(true);
        try {
            switch (activeTab) {
                case 'overview': { const [eR, gR, mR] = await Promise.all([eventsAPI.getAll(), galleryAPI.getAll(), membersAPI.getAll()]); setEvents(eR.data); setGallery(gR.data); setMembers(mR.data); break; }
                case 'events': { const r = await eventsAPI.getAll(); setEvents(r.data); break; }
                case 'gallery': { const r = await galleryAPI.getAll(); setGallery(r.data); break; }
                case 'members': { const r = await membersAPI.getAll(); setMembers(r.data); break; }
                case 'settings': { const r = await settingsAPI.get(); setSettings(r.data); break; }
            }
        } catch (e) { console.error('fetchSiteData:', e); }
        setLoading(false);
    }, [activeTab]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

                <main className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
                    ) : (
                        <>
                            {activeTab === 'overview' && <OverviewTab events={events} gallery={gallery} members={members} />}
                            {activeTab === 'academic-years' && <AcademicYearsTab years={years} onRefresh={loadYears} isSuperadmin={isSuperadmin} />}
                            {activeTab === 'activity-calendar' && <ActivityCalendarTab years={years} currentAY={currentAY} />}
                            {activeTab === 'volunteers' && <AYVolunteersTab years={years} currentAY={currentAY} />}
                            {activeTab === 'core-team' && <CoreTeamTab years={years} currentAY={currentAY} />}
                            {activeTab === 'attendance' && <AttendanceTab years={years} currentAY={currentAY} />}
                            {activeTab === 'special-camps' && <SpecialCampsTab years={years} currentAY={currentAY} />}
                            {activeTab === 'archive' && <ArchiveTab years={years} />}
                            {activeTab === 'events' && <EventsTab events={events} onRefresh={fetchSiteData} showForm={showEventForm} setShowForm={setShowEventForm} editingItem={editingItem} setEditingItem={setEditingItem} />}
                            {activeTab === 'registrations' && <RegistrationsTab events={events} />}
                            {activeTab === 'gallery' && <GalleryTab gallery={gallery} onRefresh={fetchSiteData} showForm={showGalleryForm} setShowForm={setShowGalleryForm} editingItem={editingItem} setEditingItem={setEditingItem} />}
                            {activeTab === 'members' && <MembersTab members={members} onRefresh={fetchSiteData} showForm={showMemberForm} setShowForm={setShowMemberForm} editingItem={editingItem} setEditingItem={setEditingItem} />}
                            {activeTab === 'settings' && <SettingsTab settings={settings} onRefresh={fetchSiteData} />}
                            {activeTab === 'admins' && <AdminsTab />}
                            {activeTab === 'profile' && <ProfileTab />}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
