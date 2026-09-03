import { useState, Suspense, useMemo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { decodeToken } from '../../services/api';
import ErrorBoundary from '../common/ErrorBoundary';
import { useCurrentAcademicYear } from '../../hooks/useAcademicYears';
import { usePendingApprovals } from '../../hooks/useApprovals';
import { AYStatusBadge } from './Shared';

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
            { id: 'innovative-ideas', label: 'Innovative Ideas', icon: '💡' },
            { id: 'achievements', label: 'Achievements', icon: '🏆' },
            { id: 'email-service', label: 'Email Service', icon: '📧' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
            ...(isSuperadmin ? [
                { id: 'approvals', label: 'Approvals', icon: '✅' },
                { id: 'admins', label: 'Admins', icon: '🔑' }
            ] : []),
        ]
    },
    {
        label: 'Account', tabs: [
            { id: 'profile', label: 'My Profile', icon: '👤' },
        ]
    },
];

export const AdminLayout = () => {
    const { token } = useAuthStore();
    const isSuperadmin = useMemo(() => {
        if (!token) return false;
        try {
            return decodeToken(token)?.role === 'superadmin';
        } catch (err) {
            console.error('Failed to decode token:', err);
            return false;
        }
    }, [token]);
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const { data: currentAY } = useCurrentAcademicYear();
    const { data: pendingData } = usePendingApprovals({ enabled: isSuperadmin }); // Only fetch if superadmin
    const tabGroups = useMemo(() => getTabGroups(isSuperadmin), [isSuperadmin]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header className="bg-nss-blue text-white px-4 md:px-6 py-4 flex justify-between items-center shadow-md flex-shrink-0 relative z-40">
                <div className="flex items-center gap-3 md:gap-4">
                    <button 
                        className="md:hidden p-1.5 hover:bg-white/20 rounded transition"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Open sidebar"
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
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded" aria-label="Close sidebar">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <nav className="py-3">
                        {tabGroups.map(group => (
                            <div key={group.label} className="mb-2">
                                <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
                                {group.tabs.map(tab => (
                                    <NavLink key={tab.id} to={`/admin/${tab.id}`} onClick={() => setIsSidebarOpen(false)}
                                        className={({ isActive }) => `w-full text-left px-4 py-2.5 flex items-center justify-between text-sm transition ${isActive ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        <div className="flex items-center gap-2.5">
                                            <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-gray-200 text-gray-600 flex-shrink-0">{tab.icon}</span>
                                            {tab.label}
                                        </div>
                                        {tab.id === 'approvals' && pendingData && pendingData.totalPending > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                                {pendingData.totalPending}
                                            </span>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                    <ErrorBoundary>
                        <Suspense fallback={<div className="flex justify-center items-center h-64 text-gray-500 font-medium animate-pulse">Loading component...</div>}>
                            <Outlet />
                        </Suspense>
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
};
