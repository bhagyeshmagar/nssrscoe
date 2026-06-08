import { useState } from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Column {
    key: string;
    label: string;
}

interface ExportDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: unknown[];
    columns: Column[];
    filename: string;
}

export const ExportDataModal = ({ isOpen, onClose, data, columns, filename }: ExportDataModalProps) => {
    const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
        new Set(columns.map(c => c.key))
    );

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
        const exportData = data.map((item: any) => {
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Data</DialogTitle>
                    <DialogDescription>
                        Select the columns you want to include in the Excel export ({data.length} records).
                    </DialogDescription>
                </DialogHeader>
                
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
                            className="rounded text-blue-600 focus:ring-blue-600"
                        />
                        <span className="font-medium text-sm">Select All</span>
                    </label>
                    {columns.map(col => (
                        <label key={col.key} className="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                checked={selectedColumns.has(col.key)}
                                onChange={() => toggleColumn(col.key)}
                                className="rounded text-blue-600 focus:ring-blue-600"
                            />
                            <span className="text-sm text-gray-700">{col.label}</span>
                        </label>
                    ))}
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        onClick={handleExport} 
                        disabled={selectedColumns.size === 0 || data.length === 0}
                    >
                        <Download className="w-4 h-4 mr-2" /> Export to Excel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
