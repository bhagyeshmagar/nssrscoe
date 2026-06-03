import React from 'react';

interface PasswordStrengthMeterProps {
    password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
    const calculateStrength = () => {
        let score = 0;
        if (!password) return score;

        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        return score;
    };

    const score = calculateStrength();

    const getStrengthText = () => {
        switch (score) {
            case 0: return 'Very Weak';
            case 1:
            case 2: return 'Weak';
            case 3: return 'Fair';
            case 4: return 'Good';
            case 5: return 'Strong';
            default: return '';
        }
    };

    const getStrengthColor = () => {
        switch (score) {
            case 0:
            case 1:
            case 2: return 'bg-red-500';
            case 3: return 'bg-yellow-500';
            case 4: return 'bg-blue-500';
            case 5: return 'bg-green-500';
            default: return 'bg-gray-200';
        }
    };

    const requirements = [
        { regex: /.{8,}/, text: 'At least 8 characters' },
        { regex: /[A-Z]/, text: 'One uppercase letter' },
        { regex: /[a-z]/, text: 'One lowercase letter' },
        { regex: /[0-9]/, text: 'One number' },
        { regex: /[^A-Za-z0-9]/, text: 'One special character' },
    ];

    return (
        <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">Password Strength</span>
                <span className="text-xs font-medium text-gray-700">{getStrengthText()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 flex space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <div
                        key={level}
                        className={`h-1.5 w-1/5 rounded-full transition-colors duration-300 ${
                            score >= level ? getStrengthColor() : 'bg-gray-200'
                        }`}
                    ></div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-2">
                {requirements.map((req, index) => (
                    <div key={index} className="flex items-center text-xs">
                        {req.regex.test(password) ? (
                            <svg className="w-3 h-3 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        ) : (
                            <svg className="w-3 h-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        )}
                        <span className={req.regex.test(password) ? 'text-gray-700' : 'text-gray-400'}>
                            {req.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
