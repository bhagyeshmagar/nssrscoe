import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { decodeToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { LogOut } from 'lucide-react';

import { ProfileTab } from '../components/volunteer/ProfileTab';
import { PasswordTab } from '../components/volunteer/PasswordTab';
import { VolunteersListTab } from '../components/volunteer/VolunteersListTab';
import { NotificationsTab } from '../components/volunteer/NotificationsTab';
import { MyAttendanceTab } from '../components/volunteer/MyAttendanceTab';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const VolunteerDashboard = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { token, clearAuth } = useAuthStore();
    const [userName] = useState(() => {
        if (token) {
            const decoded = decodeToken(token);
            return decoded?.username || decoded?.email || decoded?.username || 'Volunteer';
        }
        return 'Volunteer';
    });

    useEffect(() => {
        connectSocket();
        
        return () => {
            disconnectSocket();
        };
    }, []);

    const handleLogout = () => {
        clearAuth();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <Card className="mb-6 border-gray-100 shadow-sm">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
                        <div>
                            <CardTitle className="text-2xl font-bold text-nss-blue">Volunteer Dashboard</CardTitle>
                            <CardDescription className="text-base mt-1">Welcome, <span className="font-semibold text-gray-700">{userName}</span></CardDescription>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </CardHeader>
                </Card>

                {/* Message */}
                {message && (
                    <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                {/* Tabs */}
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto bg-white border border-gray-100 shadow-sm rounded-lg p-1 h-auto mb-6 flex-wrap md:flex-nowrap">
                        <TabsTrigger value="profile" className="flex-1 md:flex-none text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-nss-blue min-h-[44px]">
                            📋 <span className="hidden xs:inline">My </span>Profile
                        </TabsTrigger>
                        <TabsTrigger value="volunteers" className="flex-1 md:flex-none text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-nss-blue min-h-[44px]">
                            👥 Volunteers
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex-1 md:flex-none text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-nss-blue min-h-[44px]">
                            🔔 Alerts
                        </TabsTrigger>
                        <TabsTrigger value="attendance" className="flex-1 md:flex-none text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-6 data-[state=active]:bg-blue-50 data-[state=active]:text-nss-blue min-h-[44px]">
                            📅 Attendance
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6 mt-0">
                        <ProfileTab setMessage={setMessage} />
                        <PasswordTab setMessage={setMessage} />
                    </TabsContent>
                    
                    <TabsContent value="volunteers" className="mt-0">
                        <VolunteersListTab />
                    </TabsContent>
                    
                    <TabsContent value="notifications" className="mt-0">
                        <NotificationsTab />
                    </TabsContent>
                    
                    <TabsContent value="attendance" className="mt-0">
                        <MyAttendanceTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default VolunteerDashboard;
