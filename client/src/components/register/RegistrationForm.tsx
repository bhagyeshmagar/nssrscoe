import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { registrationsAPI, eventsAPI, DEPARTMENTS } from '../../services/api';
import type { EventData } from '../../services/api';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { formatDate } from '@/utils/dateFormatter';
const registrationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    department: z.string().min(1, 'Department is required'),
    year: z.string().min(1, 'Year is required'),
    eventId: z.string().min(1, 'Event selection is required')
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const RegistrationForm = () => {
    const [events, setEvents] = useState<EventData[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submittedEmail, setSubmittedEmail] = useState('');

    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: { name: '', email: '', phone: '', department: '', year: '', eventId: '' },
    });

    useEffect(() => {
        eventsAPI.getAll().then(res => {
            const upcoming = (res.data.data || []).filter(e => e.type === 'upcoming');
            setEvents(upcoming);
            if (upcoming.length > 0) {
                setValue('eventId', upcoming[0].id.toString());
            }
        }).catch(() => {});
    }, [setValue]);

    const onRegistrationSubmit = async (data: RegistrationFormData) => {
        setSubmitError('');
        try {
            await registrationsAPI.create({ ...data, eventId: Number(data.eventId) });
            setSubmittedEmail(data.email);
            setSubmitted(true);
        } catch (err: any) {
            setSubmitError(err?.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    const resetRegistration = () => {
        setSubmitted(false);
        reset({ name: '', email: '', phone: '', department: '', year: '', eventId: events.length > 0 ? events[0].id.toString() : '' });
        setSubmitError('');
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-nss-blue" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Submitted!</h2>
                <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
                    Thank you for registering. Your application is now <span className="font-semibold text-yellow-600">pending admin approval</span>.
                    We will review it shortly.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 text-left max-w-md w-full mb-6 space-y-3">
                    <div className="flex items-start gap-2.5 text-green-700 text-sm">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Once approved, your <strong>Volunteering Pass</strong> will be emailed to <strong className="text-green-800">{submittedEmail}</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-green-700 text-sm">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>You can also check your pass status anytime using the <strong>Check Pass</strong> tab above with your Pass ID.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-green-700 text-sm">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Please carry your pass (digital or printed) to the event venue.</span>
                    </div>
                </div>
                <Button variant="outline" onClick={resetRegistration} className="text-gray-500">
                    Register Another Person
                </Button>
            </div>
        );
    }

    return (
        <Card className="border-t-4 border-t-nss-red shadow-lg">
            <CardHeader>
                <CardTitle>Volunteer Details</CardTitle>
                <CardDescription>Fill in your details. Your pass will be emailed after admin approval.</CardDescription>
            </CardHeader>
            <div className="mx-6 mb-2 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                    After submitting, your registration will be reviewed by the admin.
                    If approved, your <strong>Volunteering Pass</strong> will be sent to your email address.
                </span>
            </div>
            <CardContent className="pt-4">
                <form onSubmit={handleSubmit(onRegistrationSubmit)} className="space-y-5">
                    {submitError && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-2.5 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {submitError}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                            <Input id="name" {...register('name')} placeholder="Bhagyesh Magar" className={errors.name ? 'border-red-500' : ''} />
                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email Address <span className="text-red-500">*</span>
                                <span className="ml-1 text-xs text-blue-500 font-normal">(pass sent here)</span>
                            </Label>
                            <Input id="email" type="email" {...register('email')} placeholder="[EMAIL_ADDRESS]" className={errors.email ? 'border-red-500' : ''} />
                            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                            <Input id="phone" type="tel" {...register('phone')} placeholder="+91 88063 92572" className={errors.phone ? 'border-red-500' : ''} />
                            {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Department <span className="text-red-500">*</span></Label>
                            <Controller
                                name="department"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[...DEPARTMENTS, 'Other'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Year <span className="text-red-500">*</span></Label>
                            <Controller
                                name="year"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={errors.year ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FE">First Year (FE)</SelectItem>
                                            <SelectItem value="SE">Second Year (SE)</SelectItem>
                                            <SelectItem value="TE">Third Year (TE)</SelectItem>
                                            <SelectItem value="BE">Final Year (BE)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.year && <p className="text-sm text-red-500 mt-1">{errors.year.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Event <span className="text-red-500">*</span></Label>
                            <Controller
                                name="eventId"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={errors.eventId ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select event" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {events.map(ev => (
                                                <SelectItem key={ev.id} value={ev.id.toString()}>
                                                    {ev.title} – {formatDate(ev.date)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.eventId && <p className="text-sm text-red-500 mt-1">{errors.eventId.message}</p>}
                            {events.length === 0 && <p className="text-red-500 text-xs mt-1">No upcoming events available.</p>}
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isSubmitting || events.length === 0}
                        className="w-full bg-nss-blue hover:bg-blue-900 transition-colors py-6 text-lg"
                    >
                        {isSubmitting
                            ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting…</>
                            : 'Submit Registration'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
