import React from 'react';
import { FileText, Download } from 'lucide-react';

const Reports = () => {
    const reports = [
        { id: 1, title: 'Annual Report 2023-24', date: 'March 2024', size: '2.4 MB' },
        { id: 2, title: 'Special Camp Report - Village Palasdeo', date: 'Jan 2024', size: '5.1 MB' },
        { id: 3, title: 'Blood Donation Camp Summary', date: 'Dec 2023', size: '1.2 MB' },
        { id: 4, title: 'Tree Plantation Drive Report', date: 'July 2023', size: '3.0 MB' },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Activity Reports</h1>
            <div className="grid gap-4">
                {reports.map((report) => (
                    <div key={report.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-100 p-3 rounded-full text-nss-red">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{report.title}</h3>
                                <p className="text-sm text-gray-500">{report.date} • {report.size}</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 bg-nss-blue text-white px-4 py-2 rounded text-sm hover:bg-blue-900 transition">
                            <Download className="w-4 h-4" /> Download
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reports;
