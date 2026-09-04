import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePendingApprovals, useApproveEvent, useRejectEvent, useApproveSlider, useRejectSlider, useApproveInnovativeIdea, useRejectInnovativeIdea, useApproveGallery, useRejectGallery } from '../../hooks/useApprovals';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar, Image as ImageIcon, AlertCircle, Lightbulb, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { UseMutationResult } from '@tanstack/react-query';
import { uploadAPI } from '../../services/api';
import type { EventData, SliderImageData, GalleryItem } from '../../services/api';
import type { InnovativeIdea } from '../../types/innovativeIdea';

import { formatDate } from '@/utils/dateFormatter';
export const ApprovalsTab = () => {
    const { data: pending, isLoading, isError } = usePendingApprovals();
    const approveEvent = useApproveEvent();
    const rejectEvent = useRejectEvent();
    const approveSlider = useApproveSlider();
    const rejectSlider = useRejectSlider();

    const approveInnovativeIdea = useApproveInnovativeIdea();
    const rejectInnovativeIdea = useRejectInnovativeIdea();
    const approveGallery = useApproveGallery();
    const rejectGallery = useRejectGallery();

    const [searchParams] = useSearchParams();
    const initialTab = (() => {
        const t = searchParams.get('tab');
        if (t === 'events' || t === 'sliders' || t === 'innovativeIdeas' || t === 'gallery') return t;
        return 'events';
    })();
    const [activeTab, setActiveTab] = useState<'events' | 'sliders' | 'innovativeIdeas' | 'gallery'>(initialTab);
    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    const TABS = ['events', 'sliders', 'innovativeIdeas', 'gallery'] as const;

    const handleTabKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const currentIndex = TABS.indexOf(activeTab);
        const delta = e.key === 'ArrowRight' ? 1 : -1;
        const nextTab = TABS[(currentIndex + delta + TABS.length) % TABS.length];
        setActiveTab(nextTab);
        tabRefs.current[nextTab]?.focus();
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading pending approvals...</div>;
    if (isError) return (
        <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-500 font-medium">Failed to load pending approvals.</p>
        </div>
    );

    const events = pending?.events || [];
    const sliders = pending?.sliderImages || [];
    const innovativeIdeas = pending?.innovativeIdeas || [];
    const galleryItems = pending?.gallery || [];

    const runMutation = (
        mutation: UseMutationResult<unknown, unknown, number, unknown>,
        id: number,
        { successMsg, confirmMsg }: { successMsg: string; confirmMsg?: string }
    ) => {
        if (confirmMsg && !window.confirm(confirmMsg)) return;
        mutation.mutate(id, {
            onSuccess: () => toast.success(successMsg)
        });
    };

    const handleApproveEvent = (id: number) => runMutation(approveEvent, id, { successMsg: 'Event approved' });
    const handleRejectEvent = (id: number) => runMutation(rejectEvent, id, { successMsg: 'Event rejected', confirmMsg: 'Are you sure you want to reject this event?' });
    const handleApproveSlider = (id: number) => runMutation(approveSlider, id, { successMsg: 'Slider image approved' });
    const handleRejectSlider = (id: number) => runMutation(rejectSlider, id, { successMsg: 'Slider image rejected', confirmMsg: 'Are you sure you want to reject this slider image?' });
    const handleApproveGallery = (id: number) => runMutation(approveGallery, id, { successMsg: 'Gallery item approved' });
    const handleRejectGallery = (id: number) => runMutation(rejectGallery, id, { successMsg: 'Gallery item rejected', confirmMsg: 'Are you sure you want to reject this gallery item?' });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Pending Approvals</h2>
                <p className="text-muted-foreground">Review and approve items submitted by admins before they go live.</p>
            </div>

            <div className="flex gap-4 border-b border-gray-200" role="tablist" aria-label="Approval categories" onKeyDown={handleTabKeyDown}>
                <button
                    ref={el => { tabRefs.current['events'] = el; }}
                    role="tab"
                    id="events-tab"
                    aria-selected={activeTab === 'events'}
                    aria-controls="events-panel"
                    className={`py-2 px-4 border-b-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'events' ? 'border-nss-blue text-nss-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('events')}
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Events
                        {events.length > 0 && <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">{events.length}</Badge>}
                    </div>
                </button>
                <button
                    ref={el => { tabRefs.current['sliders'] = el; }}
                    role="tab"
                    id="sliders-tab"
                    aria-selected={activeTab === 'sliders'}
                    aria-controls="sliders-panel"
                    className={`py-2 px-4 border-b-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'sliders' ? 'border-nss-blue text-nss-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('sliders')}
                >
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Home Sliders
                        {sliders.length > 0 && <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">{sliders.length}</Badge>}
                    </div>
                </button>
                <button
                    ref={el => { tabRefs.current['innovativeIdeas'] = el; }}
                    role="tab"
                    id="innovativeIdeas-tab"
                    aria-selected={activeTab === 'innovativeIdeas'}
                    aria-controls="innovativeIdeas-panel"
                    className={`py-2 px-4 border-b-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'innovativeIdeas' ? 'border-nss-blue text-nss-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('innovativeIdeas')}
                >
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Ideas
                        {innovativeIdeas.length > 0 && <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">{innovativeIdeas.length}</Badge>}
                    </div>
                </button>
                <button
                    ref={el => { tabRefs.current['gallery'] = el; }}
                    role="tab"
                    id="gallery-tab"
                    aria-selected={activeTab === 'gallery'}
                    aria-controls="gallery-panel"
                    className={`py-2 px-4 border-b-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === 'gallery' ? 'border-nss-blue text-nss-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('gallery')}
                >
                    <div className="flex items-center gap-2">
                        <ImagePlus className="w-4 h-4" />
                        Gallery
                        {galleryItems.length > 0 && <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">{galleryItems.length}</Badge>}
                    </div>
                </button>
            </div>

            {activeTab === 'events' && (
                <div id="events-panel" role="tabpanel" aria-labelledby="events-tab" className="space-y-4">
                    {events.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">No pending events.</div>
                    ) : (
                        events.map((event: EventData) => (
                            <Card key={event.id} className="overflow-hidden shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between p-6 gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                                            <Badge variant="outline" className="capitalize">{event.type}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                                        <div className="flex gap-4 text-sm text-gray-600">
                                            <span><strong>Date:</strong> {formatDate(event.date)}</span>
                                            <span><strong>Location:</strong> {event.location}</span>
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                                        <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => handleApproveEvent(event.id)} disabled={approveEvent.isPending || rejectEvent.isPending}>
                                            <Check className="w-4 h-4" /> Approve
                                        </Button>
                                        <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-2" onClick={() => handleRejectEvent(event.id)} disabled={approveEvent.isPending || rejectEvent.isPending}>
                                            <X className="w-4 h-4" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'sliders' && (
                <div id="sliders-panel" role="tabpanel" aria-labelledby="sliders-tab" className="space-y-4">
                    {sliders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">No pending slider images.</div>
                    ) : (
                        sliders.map((slider: SliderImageData) => (
                            <Card key={slider.id} className="overflow-hidden shadow-sm flex flex-col">
                                <div className="flex flex-col sm:flex-row p-6 gap-6">
                                    <div className="w-full sm:w-64 h-32 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                        <img 
                                            src={uploadAPI.getFullUrl(slider.url)} 
                                            alt="Slider Preview" 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/a1a1aa?text=Image+Not+Found'; }}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <p className="text-gray-900">{slider.description || <span className="text-gray-400 italic">No description provided</span>}</p>
                                        {slider.eventId && <p className="text-sm text-nss-blue mt-2">Linked to Event ID: {slider.eventId}</p>}
                                    </div>
                                    <div className="flex sm:flex-col justify-center gap-2 shrink-0">
                                        <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 gap-2" onClick={() => handleApproveSlider(slider.id)} disabled={approveSlider.isPending || rejectSlider.isPending}>
                                            <Check className="w-4 h-4" /> Approve
                                        </Button>
                                        <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 flex-1 gap-2" onClick={() => handleRejectSlider(slider.id)} disabled={approveSlider.isPending || rejectSlider.isPending}>
                                            <X className="w-4 h-4" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
            {activeTab === 'innovativeIdeas' && (
                <div id="innovativeIdeas-panel" role="tabpanel" aria-labelledby="innovativeIdeas-tab" className="space-y-4">
                    {innovativeIdeas.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">No pending innovative ideas.</div>
                    ) : (
                        innovativeIdeas.map((idea: InnovativeIdea) => {
                            const isDeletion = idea.deleteRequested;
                            const isUpdate = !isDeletion && !!idea.pendingUpdateData;
                            const approveLabel = isDeletion ? 'Approve Deletion' : isUpdate ? 'Approve Update' : 'Approve';
                            const rejectLabel = isDeletion ? 'Reject Deletion' : isUpdate ? 'Reject Update' : 'Reject';
                            const rejectConfirm = isDeletion
                                ? 'Are you sure you want to reject this deletion request?'
                                : isUpdate
                                ? 'Are you sure you want to reject this update request?'
                                : 'Are you sure you want to reject this idea?';
                            return (
                                <Card key={idea.id} className="overflow-hidden shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between p-6 gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-xl font-semibold text-gray-900">{idea.title}</h3>
                                                <Badge variant="outline" className="capitalize">{idea.category}</Badge>
                                                {isDeletion && (
                                                    <Badge className="bg-red-100 text-red-700 border-red-200">Deletion Request</Badge>
                                                )}
                                                {isUpdate && (
                                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">Update Request</Badge>
                                                )}
                                                {!isDeletion && !isUpdate && (
                                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">New Idea</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 line-clamp-2">{idea.description}</p>
                                            <div className="flex gap-4 text-sm text-gray-600">
                                                <span><strong>Date:</strong> {formatDate(idea.createdAt)}</span>
                                                <span><strong>Volunteer:</strong> {idea.volunteerName}</span>
                                            </div>
                                        </div>
                                        <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                                            <Button
                                                variant="default"
                                                className={`gap-2 text-white ${isDeletion ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                                onClick={() => runMutation(approveInnovativeIdea, idea.id, {
                                                    successMsg: isDeletion ? 'Deletion approved' : isUpdate ? 'Update approved' : 'Idea approved',
                                                    confirmMsg: isDeletion ? 'Are you sure you want to permanently delete this idea?' : undefined
                                                })}
                                                disabled={approveInnovativeIdea.isPending || rejectInnovativeIdea.isPending}
                                            >
                                                <Check className="w-4 h-4" /> {approveLabel}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                                                onClick={() => runMutation(rejectInnovativeIdea, idea.id, {
                                                    successMsg: isDeletion ? 'Deletion rejected' : isUpdate ? 'Update rejected' : 'Idea rejected',
                                                    confirmMsg: rejectConfirm
                                                })}
                                                disabled={approveInnovativeIdea.isPending || rejectInnovativeIdea.isPending}
                                            >
                                                <X className="w-4 h-4" /> {rejectLabel}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'gallery' && (
                <div id="gallery-panel" role="tabpanel" aria-labelledby="gallery-tab" className="space-y-4">
                    {galleryItems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">No pending gallery items.</div>
                    ) : (
                        galleryItems.map((item: GalleryItem) => (
                            <Card key={item.id} className="overflow-hidden shadow-sm flex flex-col">
                                <div className="flex flex-col sm:flex-row p-6 gap-6">
                                    <div className="w-full sm:w-64 h-32 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                        {item.type === 'video' ? (
                                            <video src={uploadAPI.getFullUrl(item.url)} className="w-full h-full object-cover" controls />
                                        ) : (
                                            <img 
                                                src={uploadAPI.getFullUrl(item.url)} 
                                                alt="Gallery Preview" 
                                                className="w-full h-full object-cover" 
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/a1a1aa?text=Image+Not+Found'; }}
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className="text-lg font-semibold text-gray-900">{item.title || 'Untitled'}</h3>
                                        <p className="text-gray-600 mt-1">{item.description || <span className="text-gray-400 italic">No description provided</span>}</p>
                                        {item.eventId && <p className="text-sm text-nss-blue mt-2">Linked to Event ID: {item.eventId}</p>}
                                    </div>
                                    <div className="flex sm:flex-col justify-center gap-2 shrink-0">
                                        <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 gap-2" onClick={() => handleApproveGallery(item.id)} disabled={approveGallery.isPending || rejectGallery.isPending}>
                                            <Check className="w-4 h-4" /> Approve
                                        </Button>
                                        <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 flex-1 gap-2" onClick={() => handleRejectGallery(item.id)} disabled={approveGallery.isPending || rejectGallery.isPending}>
                                            <X className="w-4 h-4" /> Reject
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
