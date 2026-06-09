 
import { useState, useEffect, useCallback } from 'react';
import type { AcademicYear } from '../../services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    if (ay.isArchived) return <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-300">Archived</Badge>;
    if (ay.isLocked) return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 shadow-none border-red-200 border">🔒 Locked</Badge>;
    if (ay.isCurrent) return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 shadow-none border-green-200 border">Active</Badge>;
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 shadow-none">Draft</Badge>;
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
        blue: 'text-blue-700 bg-blue-50/50',
        green: 'text-green-700 bg-green-50/50',
        purple: 'text-purple-700 bg-purple-50/50',
        orange: 'text-orange-700 bg-orange-50/50',
        red: 'text-red-700 bg-red-50/50',
    };
    const currentClass = colorClasses[color] || colorClasses.blue;

    return (
        <Card className={`${currentClass} shadow-sm border-gray-100`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{count}</div>
            </CardContent>
        </Card>
    );
};

export function useFlash() {
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const flash = useCallback((type: 'ok' | 'err', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 4000);
    }, []);
    return { msg, flash };
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
