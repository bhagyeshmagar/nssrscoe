import React from 'react';

const Calendar = () => {
    return (
        <div className="max-w-5xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Activity Calendar 2024-25</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-nss-blue text-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Month</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Tentative Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Activity</th>
                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Type</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">June</td>
                            <td className="px-6 py-4 whitespace-nowrap">5th June</td>
                            <td className="px-6 py-4">World Environment Day & Tree Plantation</td>
                            <td className="px-6 py-4"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Field Work</span></td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">June</td>
                            <td className="px-6 py-4 whitespace-nowrap">21st June</td>
                            <td className="px-6 py-4">International Yoga Day</td>
                            <td className="px-6 py-4"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Health</span></td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">July</td>
                            <td className="px-6 py-4 whitespace-nowrap">Second Week</td>
                            <td className="px-6 py-4">Orientation Program for New Volunteers</td>
                            <td className="px-6 py-4"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Campus</span></td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">August</td>
                            <td className="px-6 py-4 whitespace-nowrap">15th August</td>
                            <td className="px-6 py-4">Independence Day Celebration</td>
                            <td className="px-6 py-4"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">National</span></td>
                        </tr>
                        {/* Add more rows */}
                    </tbody>
                </table>
            </div>
            <p className="mt-4 text-sm text-gray-500 italic text-center">* Dates are tentative and subject to change as per university guidelines.</p>
        </div>
    );
};

export default Calendar;
