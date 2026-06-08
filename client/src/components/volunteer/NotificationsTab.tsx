import { useEffect } from 'react';
import type { AppNotification } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useNotificationStore } from '../../stores/notificationStore';

export const NotificationsTab = () => {
    const { 
        notifications, 
        loading, 
        fetchNotifications, 
        addNotification, 
        markAsRead, 
        markAllAsRead 
    } = useNotificationStore();

    useEffect(() => {
        fetchNotifications();

        const socket = getSocket();
        if (socket) {
            socket.on('new_notification', (notification: AppNotification) => {
                addNotification(notification);
            });
        }

        return () => {
            if (socket) {
                socket.off('new_notification');
            }
        };
    }, [addNotification, fetchNotifications]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">My Notifications</h2>
                {notifications.some(n => !n.isRead) && (
                    <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:underline">
                        Mark all as read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                    You have no notifications.
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(notification => (
                        <div key={notification.id} className={`p-4 rounded-lg border ${notification.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`font-bold ${notification.isRead ? 'text-gray-700' : 'text-blue-900'}`}>{notification.title}</h3>
                                    <p className="text-gray-600 text-sm mt-1">{notification.body}</p>
                                    <p className="text-xs text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                                </div>
                                {!notification.isRead && (
                                    <button onClick={() => markAsRead(notification.id)} className="text-xs bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50">
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
