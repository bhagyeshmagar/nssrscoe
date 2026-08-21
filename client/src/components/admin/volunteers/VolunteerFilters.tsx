import { DEPT_LIST } from '../../../lib/constants';

interface FilterState {
    dept: string;
    status: '' | 'regular' | 'backup';
    search: string;
    sortBy: 'name' | 'department';
}

interface Props {
    searchInput: string;
    setSearchInput: (v: string) => void;
    filter: FilterState;
    setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
    setPage: (p: number) => void;
}

export const VolunteerFilters = ({ searchInput, setSearchInput, filter, setFilter, setPage }: Props) => {
    return (
        <div className="flex gap-3 mb-4 flex-wrap">
            <input 
                type="text" 
                placeholder="Search..." 
                value={searchInput} 
                onChange={e => { setSearchInput(e.target.value); setPage(1); }} 
                className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <select 
                value={filter.dept} 
                onChange={e => { setFilter(f => ({ ...f, dept: e.target.value })); setPage(1); }} 
                className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">All Departments</option>
                {DEPT_LIST.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select 
                value={filter.status} 
                onChange={e => { setFilter(f => ({ ...f, status: e.target.value as '' | 'regular' | 'backup' })); setPage(1); }} 
                className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">All Statuses</option>
                <option value="regular">Regular</option>
                <option value="backup">Backup</option>
            </select>
            <select 
                value={filter.sortBy} 
                onChange={e => { setFilter(f => ({ ...f, sortBy: e.target.value as 'name' | 'department' })); setPage(1); }} 
                className="border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="name">Sort by Name</option>
                <option value="department">Sort by Department</option>
            </select>
        </div>
    );
};
