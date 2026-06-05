import { useState } from 'react';
import { Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Column {
    key: string;
    label: string;
}

interface ExportDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[];
    columns: Column[];
    filename: string;
}

export const ExportDataModal = ({ isOpen, onClose, data, columns, filename }: ExportDataModalProps) => {
    const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
        new Set(columns.map(c => c.key))
    );

    if (!isOpen) return null;

    const toggleColumn = (key: string) => {
        const newSelected = new Set(selectedColumns);
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        setSelectedColumns(newSelected);
    };

    const handleExport = () => {
        const selectedColsList = columns.filter(c => selectedColumns.has(c.key));
        
        // Prepare the array of objects mapping the selected headers to their values
        const exportData = data.map(item => {
            const row: Record<string, any> = {};
            selectedColsList.forEach(c => {
                let val = item[c.key];
                if (val === null || val === undefined) val = '';
                if (typeof val === 'object') val = JSON.stringify(val);
                row[c.label] = val;
            });
            return row;
        });

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

        // Write to file and download
        XLSX.writeFile(workbook, `${filename}.xlsx`);
        
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold">Export Data</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Select the columns you want to include in the CSV export ({data.length} records).
                    </p>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                        <label className="flex items-center space-x-2 pb-2 border-b">
                            <input 
                                type="checkbox" 
                                checked={selectedColumns.size === columns.length}
                                onChange={() => {
                                    if (selectedColumns.size === columns.length) {
                                        setSelectedColumns(new Set());
                                    } else {
                                        setSelectedColumns(new Set(columns.map(c => c.key)));
                                    }
                                }}
                                className="rounded text-nss-blue focus:ring-nss-blue"
                            />
                            <span className="font-medium text-sm">Select All</span>
                        </label>
                        {columns.map(col => (
                            <label key={col.key} className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    checked={selectedColumns.has(col.key)}
                                    onChange={() => toggleColumn(col.key)}
                                    className="rounded text-nss-blue focus:ring-nss-blue"
                                />
                                <span className="text-sm text-gray-700">{col.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end space-x-2">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={selectedColumns.size === 0 || data.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        <Download className="w-4 h-4 mr-2" /> Export to Excel
                    </button>
                </div>
            </div>
        </div>
    );
};
