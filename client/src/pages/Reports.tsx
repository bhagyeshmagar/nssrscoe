import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { academicYearsAPI, uploadAPI } from '../services/api';
import type { AcademicYear } from '../services/api';

const Reports = () => {
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await academicYearsAPI.getAll();
                const resData = res.data as unknown as { data?: AcademicYear[] } | AcademicYear[];
                const yrs = ('data' in resData && resData.data) ? resData.data : resData as AcademicYear[];
                setYears(Array.isArray(yrs) ? yrs : []);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        load();
    }, []);

    // Flatten to a single list of reports
    const reports = years.flatMap(ay => {
        const arr = [];
        if (ay.regularActivityReportUrl) {
            arr.push({
                id: `${ay.id}-regular`,
                ayLabel: ay.label,
                title: `Regular Activity Report ${ay.label}`,
                url: uploadAPI.getFullUrl(ay.regularActivityReportUrl)
            });
        }
        if (ay.specialCampReportUrl) {
            arr.push({
                id: `${ay.id}-camp`,
                ayLabel: ay.label,
                title: `Special Camp Report ${ay.label}`,
                url: uploadAPI.getFullUrl(ay.specialCampReportUrl)
            });
        }
        return arr;
    });

    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Activity Reports</h1>
            
            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : reports.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">No activity reports have been uploaded yet.</div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-red-100 p-3 rounded-full text-nss-red flex-shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{report.title}</h3>
                                    <p className="text-sm text-gray-500">Academic Year: {report.ayLabel}</p>
                                </div>
                            </div>
                            <a href={report.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-nss-blue text-white px-4 py-2 rounded text-sm hover:bg-blue-900 transition flex-shrink-0 whitespace-nowrap">
                                <Download className="w-4 h-4" /> Download
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reports;
