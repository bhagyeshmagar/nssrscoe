import { useState, useEffect } from 'react';
import { membersAPI, uploadAPI } from '../services/api';

interface Member {
    id: number;
    name: string;
    role: string;
    photoUrl?: string;
    year?: string;
    createdAt: string;
}

const Members = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await membersAPI.getAll();
                setMembers(response.data);
            } catch (error) {
                console.error('Error fetching members:', error);
            }
            setLoading(false);
        };
        fetchMembers();
    }, []);

    // Group members by role
    const groupedMembers = members.reduce((acc, member) => {
        const role = member.role;
        if (!acc[role]) {
            acc[role] = [];
        }
        acc[role].push(member);
        return acc;
    }, {} as Record<string, Member[]>);

    // Define role priority for ordering
    const rolePriority = ['Program Officer', 'Secretary', 'Joint Secretary', 'Treasurer'];

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Core Committee</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">Core Committee</h1>

            {members.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-xl">No team members listed yet.</p>
                    <p className="mt-2">Check back soon for our committee information!</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Show role groups in priority order, then alphabetically */}
                    {Object.keys(groupedMembers)
                        .sort((a, b) => {
                            const aIndex = rolePriority.indexOf(a);
                            const bIndex = rolePriority.indexOf(b);
                            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                            if (aIndex !== -1) return -1;
                            if (bIndex !== -1) return 1;
                            return a.localeCompare(b);
                        })
                        .map((role) => (
                            <div key={role}>
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-2">
                                    {role}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
                                    {groupedMembers[role].map((member) => (
                                        <MemberCard key={member.id} member={member} />
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

const MemberCard = ({ member }: { member: Member }) => (
    <div className="bg-white p-6 rounded-lg shadow-md text-center border-t-4 border-nss-blue hover:shadow-lg transition">
        <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
            {member.photoUrl ? (
                <img
                    src={uploadAPI.getFullUrl(member.photoUrl)}
                    alt={member.name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                    👤
                </div>
            )}
        </div>
        <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
        <p className="text-nss-blue font-medium">{member.role}</p>
        {member.year && (
            <p className="text-gray-500 text-sm mt-1">{member.year}</p>
        )}
    </div>
);

export default Members;
