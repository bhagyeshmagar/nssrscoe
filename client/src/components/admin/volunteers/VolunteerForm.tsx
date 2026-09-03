import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateVolunteerData, Department } from '../../../services/api';
import { DEPT_LIST } from '../../../lib/constants';

const volunteerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    department: z.string().min(1, 'Department is required'),
    status: z.enum(['regular', 'backup']),
});

interface VolunteerFormData {
    name: string;
    email: string;
    password: string;
    department: string;
    status: 'regular' | 'backup';
}

interface Props {
    isSubmitting: boolean;
    defaultValues?: Partial<CreateVolunteerData>;
    onSubmit: (data: CreateVolunteerData) => void;
    onCancel: () => void;
}

export const VolunteerForm = ({ isSubmitting, defaultValues, onSubmit, onCancel }: Props) => {
    const { register, handleSubmit, formState: { errors } } = useForm<VolunteerFormData>({
        resolver: zodResolver(volunteerSchema),
        defaultValues: {
            name: defaultValues?.name || '',
            email: defaultValues?.email || '',
            password: defaultValues?.password || '',
            department: defaultValues?.department || ('Computer Engineering' as Department),
            status: defaultValues?.status || 'regular',
        }
    });

    const handleFormSubmit = (data: VolunteerFormData) => {
        onSubmit(data as CreateVolunteerData);
    };

    return (
        <div className="mb-6 bg-white rounded-xl shadow p-6 border border-blue-100">
            <h3 className="font-semibold text-gray-700 mb-4">New Volunteer</h3>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Name</label>
                        <input {...register('name')} type="text" className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} />
                        {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input {...register('email')} type="email" className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} />
                        {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Password</label>
                        <input {...register('password')} type="text" className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} />
                        {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Department</label>
                        <select {...register('department')} className={`w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 ${errors.department ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}>
                            {DEPT_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {errors.department && <span className="text-red-500 text-xs mt-1 block">{errors.department.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select {...register('status')} className={`w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 ${errors.status ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}>
                            <option value="regular">Regular</option>
                            <option value="backup">Backup</option>
                        </select>
                        {errors.status && <span className="text-red-500 text-xs mt-1 block">{errors.status.message}</span>}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                        {isSubmitting ? 'Adding...' : 'Add'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={isSubmitting} className="border px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
