import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI, galleryAPI, membersAPI, settingsAPI, uploadAPI, eventImagesAPI, volunteersAPI, registrationsAPI } from '../services/api';
import type { EventData, GalleryData, MemberData, SiteSettings, EventImage, VolunteerData, CreateVolunteerData, EventRegistration } from '../services/api';

type TabType = 'overview' | 'events' | 'registrations' | 'gallery' | 'members' | 'volunteers' | 'settings';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(false);

    // Data states
    const [events, setEvents] = useState<any[]>([]);
    const [gallery, setGallery] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [volunteers, setVolunteers] = useState<VolunteerData[]>([]);
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    // Form states
    const [showEventForm, setShowEventForm] = useState(false);
    const [showGalleryForm, setShowGalleryForm] = useState(false);
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [showVolunteerForm, setShowVolunteerForm] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    // Fetch data on mount and tab change
    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'overview':
                    const [evRes, galRes, memRes] = await Promise.all([
                        eventsAPI.getAll(),
                        galleryAPI.getAll(),
                        membersAPI.getAll()
                    ]);
                    setEvents(evRes.data);
                    setGallery(galRes.data);
                    setMembers(memRes.data);
                    break;
                case 'events':
                    const eventsRes = await eventsAPI.getAll();
                    setEvents(eventsRes.data);
                    break;
                case 'gallery':
                    const galleryRes = await galleryAPI.getAll();
                    setGallery(galleryRes.data);
                    break;
                case 'members':
                    const membersRes = await membersAPI.getAll();
                    setMembers(membersRes.data);
                    break;
                case 'volunteers':
                    const volunteersRes = await volunteersAPI.getAll();
                    setVolunteers(volunteersRes.data);
                    break;
                case 'settings':
                    const settingsRes = await settingsAPI.get();
                    setSettings(settingsRes.data);
                    break;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'events', label: 'Events', icon: '📅' },
        { id: 'registrations', label: 'Registrations', icon: '🎟️' },
        { id: 'gallery', label: 'Gallery', icon: '🖼️' },
        { id: 'members', label: 'Members', icon: '👥' },
        { id: 'volunteers', label: 'Volunteers', icon: '🙋' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-nss-blue text-white px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">NSS Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                >
                    Logout
                </button>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white shadow-md min-h-[calc(100vh-72px)]">
                    <nav className="py-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`w-full text-left px-6 py-3 flex items-center gap-3 transition ${activeTab === tab.id
                                    ? 'bg-nss-blue/10 text-nss-blue border-r-4 border-nss-blue font-semibold'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && <OverviewTab events={events} gallery={gallery} members={members} />}
                            {activeTab === 'events' && (
                                <EventsTab
                                    events={events}
                                    onRefresh={fetchData}
                                    showForm={showEventForm}
                                    setShowForm={setShowEventForm}
                                    editingItem={editingItem}
                                    setEditingItem={setEditingItem}
                                />
                            )}
                            {activeTab === 'registrations' && (
                                <RegistrationsTab events={events} />
                            )}
                            {activeTab === 'gallery' && (
                                <GalleryTab
                                    gallery={gallery}
                                    onRefresh={fetchData}
                                    showForm={showGalleryForm}
                                    setShowForm={setShowGalleryForm}
                                    editingItem={editingItem}
                                    setEditingItem={setEditingItem}
                                />
                            )}
                            {activeTab === 'members' && (
                                <MembersTab
                                    members={members}
                                    onRefresh={fetchData}
                                    showForm={showMemberForm}
                                    setShowForm={setShowMemberForm}
                                    editingItem={editingItem}
                                    setEditingItem={setEditingItem}
                                />
                            )}
                            {activeTab === 'volunteers' && (
                                <VolunteersTab
                                    volunteers={volunteers}
                                    onRefresh={fetchData}
                                    showForm={showVolunteerForm}
                                    setShowForm={setShowVolunteerForm}
                                    editingItem={editingItem}
                                    setEditingItem={setEditingItem}
                                />
                            )}
                            {activeTab === 'settings' && (
                                <SettingsTab settings={settings} onRefresh={fetchData} />
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

// Overview Tab Component
const OverviewTab = ({ events, gallery, members }: { events: any[], gallery: any[], members: any[] }) => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Events" count={events.length} color="blue" />
            <StatCard title="Gallery Items" count={gallery.length} color="green" />
            <StatCard title="Team Members" count={members.length} color="purple" />
            <StatCard title="Upcoming Events" count={events.filter(e => e.type === 'upcoming').length} color="orange" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
                {events.slice(0, 5).map((event, idx) => (
                    <div key={idx} className="py-2 border-b last:border-0">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                ))}
                {events.length === 0 && <p className="text-gray-500">No events yet</p>}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                    <p className="text-gray-600">• Go to <strong>Events</strong> tab to manage events</p>
                    <p className="text-gray-600">• Go to <strong>Registrations</strong> to view event visitors</p>
                    <p className="text-gray-600">• Go to <strong>Gallery</strong> tab to add photos</p>
                    <p className="text-gray-600">• Go to <strong>Members</strong> tab to update team</p>
                    <p className="text-gray-600">• Go to <strong>Settings</strong> to customize homepage</p>
                </div>
            </div>
        </div>
    </div>
);

const StatCard = ({ title, count, color }: { title: string, count: number, color: string }) => {
    const colors: Record<string, string> = {
        blue: 'border-blue-500 text-blue-600',
        green: 'border-green-500 text-green-600',
        purple: 'border-purple-500 text-purple-600',
        orange: 'border-orange-500 text-orange-600',
    };
    return (
        <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${colors[color]}`}>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className={`text-3xl font-bold mt-2 ${colors[color].split(' ')[1]}`}>{count}</p>
        </div>
    );
};

// Events Tab Component
const EventsTab = ({ events, onRefresh, showForm, setShowForm, editingItem, setEditingItem }: any) => {
    const [formData, setFormData] = useState<EventData>({
        id: 0, title: '', description: '', date: '', location: '', type: 'upcoming', volunteersCount: 0
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [masterIndex, setMasterIndex] = useState<number>(0);
    const [uploading, setUploading] = useState(false);
    const [existingImages, setExistingImages] = useState<EventImage[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                id: editingItem.id,
                title: editingItem.title,
                description: editingItem.description,
                date: editingItem.date?.split('T')[0] || '',
                location: editingItem.location,
                type: editingItem.type || 'upcoming',
                volunteersCount: editingItem.volunteersCount || 0
            });
            // Fetch existing images for this event
            fetchEventImages(editingItem.id);
            setShowForm(true);
        }
    }, [editingItem]);

    const fetchEventImages = async (eventId: number) => {
        try {
            const response = await eventImagesAPI.getByEvent(eventId);
            setExistingImages(response.data);
        } catch (error) {
            console.error('Error fetching event images:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (masterIndex === index) {
            setMasterIndex(0);
        } else if (masterIndex > index) {
            setMasterIndex(masterIndex - 1);
        }
    };

    const removeExistingImage = async (imageId: number) => {
        if (confirm('Delete this image?')) {
            try {
                await eventImagesAPI.delete(imageId);
                setExistingImages(prev => prev.filter(img => img.id !== imageId));
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        }
    };

    const setExistingMaster = async (imageId: number) => {
        if (editingItem) {
            try {
                await eventImagesAPI.setMaster(editingItem.id, imageId);
                setExistingImages(prev => prev.map(img => ({ ...img, isMaster: img.id === imageId })));
            } catch (error) {
                console.error('Error setting master:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let eventId = editingItem?.id;

            // Save event first
            if (editingItem) {
                await eventsAPI.update(editingItem.id, formData);
            } else {
                const response = await eventsAPI.create(formData);
                eventId = response.data.id;
            }

            // Upload and save new images
            if (selectedFiles.length > 0 && eventId) {
                const uploadedImages = await Promise.all(
                    selectedFiles.map(async (file, index) => {
                        const result = await uploadAPI.uploadFile(file);
                        return {
                            url: result.url,
                            isMaster: index === masterIndex && existingImages.every(img => !img.isMaster),
                            caption: ''
                        };
                    })
                );
                await eventImagesAPI.add(eventId, uploadedImages);
            }

            resetForm();
            onRefresh();
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error saving event');
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this event?')) {
            await eventsAPI.delete(id);
            onRefresh();
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ id: 0, title: '', description: '', date: '', location: '', type: 'upcoming', volunteersCount: 0 });
        setSelectedFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setMasterIndex(0);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Events</h2>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-nss-blue text-white px-4 py-2 rounded hover:bg-blue-900 transition"
                >
                    + Add Event
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Event' : 'Add New Event'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Title" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="border rounded px-3 py-2" />
                            <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="border rounded px-3 py-2" />
                            <input type="text" placeholder="Location" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="border rounded px-3 py-2" />
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as 'upcoming' | 'past' })} className="border rounded px-3 py-2">
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Volunteers Count</label>
                                <input
                                    type="number"
                                    placeholder="Number of volunteers"
                                    min="0"
                                    value={formData.volunteersCount || ''}
                                    onChange={e => setFormData({ ...formData, volunteersCount: parseInt(e.target.value) || 0 })}
                                    className="border rounded px-3 py-2 w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Images (Multiple)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="border rounded px-3 py-2 w-full"
                                />
                                <p className="text-xs text-gray-500 mt-1">First image will be the banner. Click star to set master.</p>
                            </div>
                        </div>

                        {/* Existing Images (when editing) */}
                        {existingImages.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Current Images:</p>
                                <div className="flex flex-wrap gap-2">
                                    {existingImages.map((img) => (
                                        <div key={img.id} className="relative group">
                                            <img
                                                src={uploadAPI.getFullUrl(img.url)}
                                                alt="Event"
                                                className={`h-24 w-24 object-cover rounded border-2 ${img.isMaster ? 'border-yellow-500' : 'border-gray-200'}`}
                                            />
                                            {img.isMaster && (
                                                <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">★ Master</span>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                                                <button type="button" onClick={() => setExistingMaster(img.id)} className="bg-yellow-500 text-white p-1 rounded text-xs">★</button>
                                                <button type="button" onClick={() => removeExistingImage(img.id)} className="bg-red-500 text-white p-1 rounded text-xs">✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">New Images to Upload:</p>
                                <div className="flex flex-wrap gap-2">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className={`h-24 w-24 object-cover rounded border-2 ${masterIndex === index && existingImages.every(img => !img.isMaster) ? 'border-yellow-500' : 'border-gray-200'}`}
                                            />
                                            {masterIndex === index && existingImages.every(img => !img.isMaster) && (
                                                <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">★ Master</span>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                                                <button type="button" onClick={() => setMasterIndex(index)} className="bg-yellow-500 text-white p-1 rounded text-xs">★</button>
                                                <button type="button" onClick={() => removeSelectedFile(index)} className="bg-red-500 text-white p-1 rounded text-xs">✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <textarea placeholder="Description" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="border rounded px-3 py-2 w-full" rows={3} />

                        <div className="flex gap-2">
                            <button type="submit" disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                                {uploading ? 'Uploading...' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Title</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Location</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Volunteers</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event: any) => (
                            <tr key={event.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3">{event.title}</td>
                                <td className="px-4 py-3">{new Date(event.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3">{event.location}</td>
                                <td className="px-4 py-3">{event.volunteersCount || 0}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs ${event.type === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {event.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <button onClick={() => setEditingItem(event)} className="text-blue-600 hover:underline mr-3">Edit</button>
                                    <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No events found. Click "Add Event" to create one.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Registrations Tab Component
const RegistrationsTab = ({ events }: { events: any[] }) => {
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedEventId) {
            fetchRegistrations(Number(selectedEventId));
        } else {
            setRegistrations([]);
        }
    }, [selectedEventId]);

    const fetchRegistrations = async (eventId: number) => {
        setLoading(true);
        try {
            const response = await registrationsAPI.getByEventId(eventId);
            setRegistrations(response.data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Event Registrations</h2>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Event to view registrations:</label>
                <select 
                    value={selectedEventId} 
                    onChange={e => setSelectedEventId(e.target.value)} 
                    className="w-full md:w-1/2 border rounded px-3 py-2"
                >
                    <option value="">-- Select an Event --</option>
                    {events.map((e: any) => (
                        <option key={e.id} value={e.id}>
                            {e.title} ({new Date(e.date).toLocaleDateString()}) - {e.type}
                        </option>
                    ))}
                </select>
            </div>

            {selectedEventId && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-800">
                            Total Registrations: {registrations.length}
                        </h3>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading registrations...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Visitor ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Dept/Year</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Registered At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map(reg => (
                                        <tr key={reg.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-nss-blue">{reg.visitorPassId}</td>
                                            <td className="px-4 py-3 font-medium">{reg.name}</td>
                                            <td className="px-4 py-3">{reg.email}</td>
                                            <td className="px-4 py-3">{reg.phone}</td>
                                            <td className="px-4 py-3">{reg.department} ({reg.year})</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {reg.createdAt ? new Date(reg.createdAt).toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {registrations.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                No registrations found for this event.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Gallery Tab Component - Separate Images and Videos
const GalleryTab = ({ gallery, onRefresh, showForm, setShowForm, editingItem, setEditingItem }: any) => {
    const [formData, setFormData] = useState<GalleryData>({ title: '', url: '', type: 'image' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'videos'>('images');
    const [uploadMediaType, setUploadMediaType] = useState<'image' | 'video'>('image');

    useEffect(() => {
        if (editingItem) {
            setFormData({ title: editingItem.title, url: editingItem.url, type: editingItem.type });
            setFilePreview(uploadAPI.getFullUrl(editingItem.url));
            setUploadMediaType(editingItem.type);
            setShowForm(true);
        }
    }, [editingItem]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setFilePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let url = formData.url;

            // Upload new file if selected
            if (selectedFile) {
                const uploadResult = await uploadAPI.uploadFile(selectedFile);
                url = uploadResult.url;
            }

            if (!url) {
                alert('Please select a file to upload');
                setUploading(false);
                return;
            }

            const galleryData = { ...formData, url, type: uploadMediaType };

            if (editingItem) {
                await galleryAPI.update(editingItem.id, galleryData);
            } else {
                await galleryAPI.create(galleryData);
            }
            resetForm();
            onRefresh();
        } catch (error) {
            console.error('Error saving gallery item:', error);
            alert('Error saving gallery item');
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await galleryAPI.delete(id);
            onRefresh();
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ title: '', url: '', type: 'image' });
        setSelectedFile(null);
        setFilePreview('');
    };

    const openUploadForm = (type: 'image' | 'video') => {
        resetForm();
        setUploadMediaType(type);
        setFormData({ ...formData, type });
        setShowForm(true);
    };

    const images = gallery.filter((item: any) => item.type !== 'video');
    const videos = gallery.filter((item: any) => item.type === 'video');

    return (
        <div>
            {/* Header with tabs */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Gallery</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => openUploadForm('image')}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-1"
                    >
                        📷 Add Image
                    </button>
                    <button
                        onClick={() => openUploadForm('video')}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition flex items-center gap-1"
                    >
                        🎥 Add Video
                    </button>
                </div>
            </div>

            {/* Upload Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6 border-l-4 border-l-nss-blue">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {uploadMediaType === 'video' ? '🎥' : '📷'}
                        {editingItem ? `Edit ${uploadMediaType === 'video' ? 'Video' : 'Image'}` : `Add New ${uploadMediaType === 'video' ? 'Video' : 'Image'}`}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                            <input
                                type="text"
                                placeholder={`Enter ${uploadMediaType} title`}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="border rounded px-3 py-2 w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload {uploadMediaType === 'video' ? 'Video' : 'Image'} *
                            </label>
                            <input
                                type="file"
                                accept={uploadMediaType === 'video' ? 'video/*' : 'image/*'}
                                onChange={handleFileChange}
                                className="border rounded px-3 py-2 w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {uploadMediaType === 'video'
                                    ? 'Supported: MP4, WebM, MOV (max 100MB). Videos will be shown on public Videos page.'
                                    : 'Supported: JPG, PNG, GIF, WebP (max 10MB)'
                                }
                            </p>
                        </div>

                        {filePreview && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Preview:</p>
                                {uploadMediaType === 'video' ? (
                                    <video src={filePreview} controls className="h-40 w-auto rounded border" />
                                ) : (
                                    <img src={filePreview} alt="Preview" className="h-40 w-auto object-cover rounded border" />
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button type="submit" disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                                {uploading ? 'Uploading...' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Media Type Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveMediaTab('images')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition flex items-center justify-center gap-2 ${activeMediaTab === 'images'
                            ? 'text-nss-blue border-b-2 border-nss-blue bg-blue-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        📷 Images <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-sm">{images.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveMediaTab('videos')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition flex items-center justify-center gap-2 ${activeMediaTab === 'videos'
                            ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🎥 Videos <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-sm">{videos.length}</span>
                    </button>
                </div>
            </div>

            {/* Images Grid */}
            {activeMediaTab === 'images' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((item: any) => (
                        <div key={item.id} className="relative group">
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                <img src={uploadAPI.getFullUrl(item.url)} alt={item.title || 'Gallery'} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                                <button onClick={() => setEditingItem(item)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
                            </div>
                            {item.title && <p className="text-sm text-gray-600 mt-1 truncate">{item.title}</p>}
                        </div>
                    ))}
                    {images.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <span className="text-4xl block mb-2">📷</span>
                            No images uploaded yet. Click "Add Image" to get started.
                        </div>
                    )}
                </div>
            )}

            {/* Videos Grid */}
            {activeMediaTab === 'videos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((item: any) => (
                        <div key={item.id} className="relative group bg-black rounded-lg overflow-hidden">
                            <video
                                src={uploadAPI.getFullUrl(item.url)}
                                className="w-full aspect-video object-cover"
                                controls
                            />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => setEditingItem(item)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button>
                            </div>
                            {item.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                                    <p className="text-white font-medium truncate">{item.title}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    {videos.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <span className="text-4xl block mb-2">🎥</span>
                            No videos uploaded yet. Click "Add Video" to get started.
                            <p className="text-sm mt-1">Uploaded videos will appear on the public Videos page.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Members Tab Component
const MembersTab = ({ members, onRefresh, showForm, setShowForm, editingItem, setEditingItem }: any) => {
    const [formData, setFormData] = useState<MemberData>({ name: '', role: '', photoUrl: '', year: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string>('');

    useEffect(() => {
        if (editingItem) {
            setFormData({ name: editingItem.name, role: editingItem.role, photoUrl: editingItem.photoUrl || '', year: editingItem.year || '' });
            setPhotoPreview(editingItem.photoUrl ? uploadAPI.getFullUrl(editingItem.photoUrl) : '');
            setShowForm(true);
        }
    }, [editingItem]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let photoUrl = formData.photoUrl;

            // Upload new file if selected
            if (selectedFile) {
                const uploadResult = await uploadAPI.uploadFile(selectedFile);
                photoUrl = uploadResult.url;
            }

            const memberData = { ...formData, photoUrl };

            if (editingItem) {
                await membersAPI.update(editingItem.id, memberData);
            } else {
                await membersAPI.create(memberData);
            }
            resetForm();
            onRefresh();
        } catch (error) {
            console.error('Error saving member:', error);
            alert('Error saving member');
        }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this member?')) {
            await membersAPI.delete(id);
            onRefresh();
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: '', role: '', photoUrl: '', year: '' });
        setSelectedFile(null);
        setPhotoPreview('');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Team Members</h2>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-nss-blue text-white px-4 py-2 rounded hover:bg-blue-900 transition"
                >
                    + Add Member
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Member' : 'Add New Member'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border rounded px-3 py-2" />
                            <input type="text" placeholder="Role (e.g., Program Officer)" required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="border rounded px-3 py-2" />
                            <input type="text" placeholder="Year (e.g., 2024-25)" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="border rounded px-3 py-2" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="border rounded px-3 py-2 w-full"
                                />
                            </div>
                        </div>

                        {photoPreview && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Photo Preview:</p>
                                <img src={photoPreview} alt="Preview" className="h-24 w-24 object-cover rounded-full border" />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button type="submit" disabled={uploading} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                                {uploading ? 'Uploading...' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {members.map((member: any) => (
                    <div key={member.id} className="bg-white p-6 rounded-lg shadow text-center relative group">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                            {member.photoUrl ? (
                                <img src={uploadAPI.getFullUrl(member.photoUrl)} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">👤</div>
                            )}
                        </div>
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <p className="text-nss-blue font-medium">{member.role}</p>
                        {member.year && <p className="text-gray-500 text-sm">{member.year}</p>}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                            <button onClick={() => setEditingItem(member)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                            <button onClick={() => handleDelete(member.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
                        </div>
                    </div>
                ))}
                {members.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No team members. Click "Add Member" to get started.
                    </div>
                )}
            </div>
        </div>
    );
};

// Volunteers Tab Component
const VolunteersTab = ({ volunteers, onRefresh, showForm, setShowForm, editingItem, setEditingItem }: any) => {
    const [formData, setFormData] = useState<CreateVolunteerData>({ name: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [viewingVolunteer, setViewingVolunteer] = useState<VolunteerData | null>(null);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                name: editingItem.name || '',
                email: editingItem.email || '',
                password: ''
            });
            setShowForm(true);
        }
    }, [editingItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingItem) {
                await volunteersAPI.update(editingItem.id, { name: formData.name, email: formData.email });
            } else {
                if (!formData.password || formData.password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setSaving(false);
                    return;
                }
                await volunteersAPI.create(formData);
            }
            resetForm();
            onRefresh();
        } catch (err: any) {
            console.error('Error saving volunteer:', err);
            setError(err.response?.data?.message || 'Error saving volunteer');
        }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this volunteer?')) {
            try {
                await volunteersAPI.delete(id);
                onRefresh();
            } catch (err) {
                console.error('Error deleting volunteer:', err);
            }
        }
    };

    const handleToggleActive = async (id: number) => {
        try {
            await volunteersAPI.toggleStatus(id);
            onRefresh();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setFormData({ name: '', email: '', password: '' });
        setError('');
    };

    // Volunteer Detail Modal
    const VolunteerDetailModal = () => {
        if (!viewingVolunteer) return null;
        // Use profileData to see data even when profile is incomplete
        const profile = (viewingVolunteer as any).profileData || (viewingVolunteer as any).profile;

        // Required fields for profile completion
        const requiredFields = [
            { key: 'fullName', label: 'Full Name' },
            { key: 'prnNo', label: 'PRN No' },
            { key: 'department', label: 'Department' },
            { key: 'academicYear', label: 'Academic Year' },
            { key: 'nssYear', label: 'NSS Year' },
            { key: 'phoneNo', label: 'Phone Number' },
            { key: 'emailId', label: 'Email ID' },
        ];

        const optionalFields = [
            { key: 'cgpa', label: 'CGPA' },
            { key: 'eligibilityNo', label: 'Eligibility No' },
            { key: 'religion', label: 'Religion' },
            { key: 'caste', label: 'Caste' },
            { key: 'casteCategory', label: 'Caste Category' },
            { key: 'marksheetUrl', label: 'Marksheet' },
        ];

        // Count pending fields
        const getPendingCount = () => {
            if (!profile) return requiredFields.length;
            return requiredFields.filter(f => !profile[f.key]).length;
        };

        const pendingCount = getPendingCount();


        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b bg-nss-blue text-white rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">Volunteer Details</h2>
                                {pendingCount > 0 && (
                                    <span className="text-yellow-300 text-sm">⚠️ {pendingCount} required field(s) pending</span>
                                )}
                            </div>
                            <button onClick={() => setViewingVolunteer(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Basic Info */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                            <div className="w-16 h-16 bg-nss-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {viewingVolunteer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{viewingVolunteer.name}</h3>
                                <p className="text-gray-500">{viewingVolunteer.email}</p>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${viewingVolunteer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {viewingVolunteer.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {/* Profile Status Summary */}
                        <div className={`mb-4 p-3 rounded-lg ${profile ? (pendingCount === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200') : 'bg-red-50 border border-red-200'}`}>
                            {!profile ? (
                                <p className="text-red-700 font-medium">❌ Profile Not Started - Volunteer has not filled any details yet</p>
                            ) : pendingCount === 0 ? (
                                <p className="text-green-700 font-medium">✅ Profile Complete - All required fields are filled</p>
                            ) : (
                                <p className="text-yellow-700 font-medium">⚠️ Profile Incomplete - {pendingCount} required field(s) pending</p>
                            )}
                        </div>

                        {/* Required Fields */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Required Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {requiredFields.map(field => {
                                    const value = profile?.[field.key];
                                    const displayValue = field.key === 'nssYear' && value ? `Year ${value}` : value;
                                    const isPending = !value;
                                    return (
                                        <div key={field.key}>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">
                                                {field.label}
                                                {isPending && <span className="ml-1 text-red-500">*</span>}
                                            </label>
                                            <p className={`px-3 py-2 rounded-lg ${isPending ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-50 text-gray-900'}`}>
                                                {isPending ? '⚠️ Pending' : displayValue}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Optional Fields */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Additional Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {optionalFields.filter(f => f.key !== 'marksheetUrl').map(field => {
                                    const value = profile?.[field.key];
                                    return (
                                        <div key={field.key}>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">{field.label}</label>
                                            <p className="px-3 py-2 rounded-lg bg-gray-50 text-gray-900">{value || '-'}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Marksheet Section */}
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Documents</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Marksheet</label>
                                {profile?.marksheetUrl ? (
                                    <a
                                        href={uploadAPI.getFullUrl(profile.marksheetUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-nss-blue text-white rounded-lg hover:bg-blue-900 transition"
                                    >
                                        📄 View Marksheet
                                    </a>
                                ) : (
                                    <p className="px-3 py-2 rounded-lg bg-yellow-50 text-yellow-600 border border-yellow-200">
                                        📎 Not uploaded yet
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
                        <button
                            onClick={() => { setViewingVolunteer(null); setEditingItem(viewingVolunteer); }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            Edit Account
                        </button>
                        <button
                            onClick={() => setViewingVolunteer(null)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    return (
        <div>
            <VolunteerDetailModal />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Manage Volunteers</h2>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-nss-blue text-white px-4 py-2 rounded hover:bg-blue-900 transition"
                >
                    + Add Volunteer
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Volunteer' : 'Add New Volunteer'}</h3>
                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input type="text" placeholder="Volunteer Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input type="email" placeholder="volunteer@example.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded px-3 py-2" />
                            </div>
                            {!editingItem && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <input type="password" placeholder="Min 6 characters" required={!editingItem} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                            )}
                        </div>
                        {editingItem && <p className="text-sm text-gray-500">Volunteers can change their password from their dashboard.</p>}
                        <div className="flex gap-2">
                            <button type="submit" disabled={saving} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400">{saving ? 'Saving...' : 'Save'}</button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Profile</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Created</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {volunteers.map((volunteer: VolunteerData) => (
                            <tr key={volunteer.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => setViewingVolunteer(volunteer)}
                                        className="text-nss-blue hover:underline font-medium"
                                    >
                                        {volunteer.name}
                                    </button>
                                </td>
                                <td className="px-4 py-3">{volunteer.email}</td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => setViewingVolunteer(volunteer)}
                                        className={(volunteer as any).profile ? 'text-green-600 text-sm hover:underline' : 'text-yellow-600 text-sm hover:underline'}
                                    >
                                        {(volunteer as any).profile ? '✓ View Details' : 'Pending'}
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    <button onClick={() => handleToggleActive(volunteer.id)} className={`px-2 py-1 rounded text-xs ${volunteer.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                                        {volunteer.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => setEditingItem(volunteer)} className="text-blue-600 hover:underline mr-3">Edit</button>
                                    <button onClick={() => handleDelete(volunteer.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {volunteers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No volunteers yet. Click "Add Volunteer" to create one.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Settings Tab Component
const SettingsTab = ({ settings, onRefresh }: { settings: SiteSettings | null, onRefresh: () => void }) => {
    const [formData, setFormData] = useState<SiteSettings>({
        heroTitle: '',
        heroSubtitle: '',
        heroCta: '',
        statEventsCount: '',
        statEventsLabel: '',
        statVolunteersCount: '',
        statVolunteersLabel: '',
        statImpactCount: '',
        statImpactLabel: '',
        aboutMission: '',
        aboutHistory: '',
        homeSliderImages: '[]',
        socialInstagram: '',
        socialFacebook: '',
        socialTwitter: '',
    });
    const [saving, setSaving] = useState(false);
    
    // State for managing home slider images
    const [sliderImages, setSliderImages] = useState<{url: string, description: string}[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData({
                ...settings,
                homeSliderImages: settings.homeSliderImages || '[]'
            });
            try {
                if (settings.homeSliderImages) {
                    setSliderImages(JSON.parse(settings.homeSliderImages));
                }
            } catch (e) {
                console.error('Failed to parse homeSliderImages', e);
            }
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const dataToSave = {
                ...formData,
                homeSliderImages: JSON.stringify(sliderImages)
            };
            await settingsAPI.update(dataToSave);
            alert('Settings saved successfully!');
            onRefresh();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings');
        }
        setSaving(false);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Site Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Hero Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Hero Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" value={formData.heroTitle} onChange={e => setFormData({ ...formData, heroTitle: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="NOT ME, BUT YOU" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                            <input type="text" value={formData.heroSubtitle} onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="National Service Scheme - JSPM RSCOE" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                            <input type="text" value={formData.heroCta} onChange={e => setFormData({ ...formData, heroCta: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Join Us / Register" />
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Statistics Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stat 1 - Events</label>
                            <input type="text" value={formData.statEventsCount} onChange={e => setFormData({ ...formData, statEventsCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="50+" />
                            <input type="text" value={formData.statEventsLabel} onChange={e => setFormData({ ...formData, statEventsLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Events Conducted" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stat 2 - Volunteers</label>
                            <input type="text" value={formData.statVolunteersCount} onChange={e => setFormData({ ...formData, statVolunteersCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="200+" />
                            <input type="text" value={formData.statVolunteersLabel} onChange={e => setFormData({ ...formData, statVolunteersLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Volunteers" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stat 3 - Impact</label>
                            <input type="text" value={formData.statImpactCount} onChange={e => setFormData({ ...formData, statImpactCount: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="1000+" />
                            <input type="text" value={formData.statImpactLabel} onChange={e => setFormData({ ...formData, statImpactLabel: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Lives Impacted" />
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">About Content</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Our Mission</label>
                            <textarea value={formData.aboutMission} onChange={e => setFormData({ ...formData, aboutMission: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="NSS aims to provide hands on experience..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Our History</label>
                            <textarea value={formData.aboutHistory} onChange={e => setFormData({ ...formData, aboutHistory: e.target.value })} className="w-full border rounded px-3 py-2" rows={4} placeholder="Established in..." />
                        </div>
                    </div>
                </div>

                {/* Social Links Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-nss-blue">Social Media Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                            <input type="url" value={formData.socialInstagram || ''} onChange={e => setFormData({ ...formData, socialInstagram: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://instagram.com/nss_jspm_rscoe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                            <input type="url" value={formData.socialFacebook || ''} onChange={e => setFormData({ ...formData, socialFacebook: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://facebook.com/nss_jspm_rscoe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
                            <input type="url" value={formData.socialTwitter || ''} onChange={e => setFormData({ ...formData, socialTwitter: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="https://twitter.com/nss_jspm_rscoe" />
                        </div>
                    </div>
                </div>

                {/* Home Slider Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-nss-blue">Home Slider Images</h3>
                        <span className="text-sm text-gray-500">{sliderImages.length} / 6 Images</span>
                    </div>
                    
                    <div className="space-y-4">
                        {sliderImages.map((img, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 items-start border p-4 rounded bg-gray-50">
                                <div className="w-full md:w-1/3">
                                    <img src={uploadAPI.getFullUrl(img.url)} alt={`Slide ${index + 1}`} className="w-full h-32 object-cover rounded border" />
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Brief Description</label>
                                    <textarea 
                                        value={img.description} 
                                        onChange={e => {
                                            const newImages = [...sliderImages];
                                            newImages[index].description = e.target.value;
                                            setSliderImages(newImages);
                                        }} 
                                        className="w-full border rounded px-3 py-2" 
                                        rows={3} 
                                        placeholder="Enter brief description for this slide..." 
                                    />
                                    <div className="flex justify-end">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const newImages = sliderImages.filter((_, i) => i !== index);
                                                setSliderImages(newImages);
                                            }} 
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sliderImages.length < 6 && (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <label className="cursor-pointer">
                                    <span className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition inline-block">
                                        {uploadingImage ? 'Uploading...' : '+ Add Slider Image'}
                                    </span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        disabled={uploadingImage}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setUploadingImage(true);
                                                try {
                                                    const result = await uploadAPI.uploadFile(file);
                                                    setSliderImages([...sliderImages, { url: result.url, description: '' }]);
                                                } catch (err) {
                                                    console.error('Error uploading slider image', err);
                                                    alert('Error uploading image');
                                                }
                                                setUploadingImage(false);
                                                e.target.value = ''; // Reset input
                                            }
                                        }}
                                    />
                                </label>
                                <p className="text-sm text-gray-500 mt-2">Recommended size: 1920x1080px. You can add {6 - sliderImages.length} more images.</p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="bg-nss-blue text-white px-6 py-3 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </form>
        </div>
    );
};

export default AdminDashboard;
