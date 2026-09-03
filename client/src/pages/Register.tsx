import { useState } from 'react';
import { RegistrationForm } from '../components/register/RegistrationForm';
import { PassLookup } from '../components/register/PassLookup';

const Register = () => {
    const [viewMode, setViewMode] = useState<'register' | 'lookup'>('register');

    return (
        <div className="max-w-3xl mx-auto px-4 py-16">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-nss-blue mb-2">Event Registration</h1>
                <p className="text-gray-600">Register to volunteer for an upcoming NSS event, or look up your approved pass.</p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setViewMode('register')}
                        className={`px-6 py-2 rounded-md font-medium transition ${viewMode === 'register' ? 'bg-white shadow text-nss-blue' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        New Registration
                    </button>
                    <button
                        onClick={() => setViewMode('lookup')}
                        className={`px-6 py-2 rounded-md font-medium transition ${viewMode === 'lookup' ? 'bg-white shadow text-nss-blue' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Check Pass
                    </button>
                </div>
            </div>

            {viewMode === 'register' && <RegistrationForm />}
            {viewMode === 'lookup' && <PassLookup />}
        </div>
    );
};

export default Register;
