import { useState, useEffect } from 'react';
import type { AcademicYear } from '../../services/api';

export type TabType =
    | 'overview' | 'academic-years' | 'volunteers' | 'core-team'
    | 'attendance' | 'special-camps' | 'archive' | 'activity-calendar'
    | 'events' | 'registrations' | 'gallery' | 'members' | 'settings' | 'admins' | 'profile';

export const getTabGroups = (isSuperadmin: boolean) => [
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

export const DEPT_LIST: import('../../services/api').Department[] = [
    'Computer Engineering',
    'Computer Science and Business Systems',
    'Information Technology',
    'Electronics and Telecommunication',
    'Electrical Engineering',
    'Automation and Robotics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Bachelor of Computer Applications',
];

export const AYStatusBadge = ({ ay }: { ay: AcademicYear }) => {
    if (ay.isArchived) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600 font-medium">Archived</span>;
    if (ay.isLocked) return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">🔒 Locked</span>;
    if (ay.isCurrent) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">Active</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">Draft</span>;
};

export const CapBar = ({ regular, cap }: { regular: number; cap: number }) => {
    const pct = Math.min(100, Math.round((regular / cap) * 100));
    const colour = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-yellow-500' : 'bg-emerald-500';
    return (
        <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Regular Volunteers</span>
                <span className={pct >= 100 ? 'text-red-600 font-bold' : ''}>{regular} / {cap}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

export const StatCard = ({ title, count, color }: { title: string; count: number | string; color: string }) => {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600 border-blue-200 bg-blue-50',
        green: 'text-green-600 border-green-200 bg-green-50',
        purple: 'text-purple-600 border-purple-200 bg-purple-50',
        orange: 'text-orange-600 border-orange-200 bg-orange-50',
        red: 'text-red-600 border-red-200 bg-red-50',
    };
    const currentClass = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`p-6 rounded-lg border shadow-sm ${currentClass}`}>
            <h3 className="text-lg font-semibold mb-2 opacity-80">{title}</h3>
            <p className="text-3xl font-bold">{count}</p>
        </div>
    );
};

export function useFlash() {
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const flash = (type: 'ok' | 'err', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 4000);
    };
    const flashString = (text: string) => {
        setMsg({ type: 'ok', text });
        setTimeout(() => setMsg(null), 4000);
    };
    return { msg, flash, flashString };
}

export function useAYSelector(years: AcademicYear[], currentAY: AcademicYear | null) {
    const [selectedAyId, setSelectedAyId] = useState<number>(currentAY?.id ?? (years[0]?.id || 0));
    
    useEffect(() => {
        if (!selectedAyId && years.length > 0) {
            setSelectedAyId(currentAY?.id ?? years[0].id);
        }
    }, [currentAY, years, selectedAyId]);

    const selectedAY = years.find(y => y.id === selectedAyId) || null;

    return { selectedAyId, setSelectedAyId, selectedAY };
}
