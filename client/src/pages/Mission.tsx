import { Target, Award, Shield, Users, Globe, UserCheck, Zap, Mountain } from 'lucide-react';
import { motion } from 'framer-motion';

const Mission = () => {
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-nss-blue py-16 text-white text-center">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold mb-4"
                >
                    Vision & Mission
                </motion.h1>
                <p className="max-w-2xl mx-auto text-blue-100 text-lg">The guiding principles of the National Service Scheme.</p>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">

                {/* Vision & Mission Grid */}
                <motion.div {...fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border-t-8 border-nss-blue relative overflow-hidden group">
                        <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/2 -translate-y-1/2">
                            <Users className="w-64 h-64" />
                        </div>
                        <h2 className="text-3xl font-bold text-nss-blue mb-6 flex items-center gap-3">
                            <Globe className="w-8 h-8" /> Vision
                        </h2>
                        <p className="text-gray-700 text-lg leading-relaxed">
                            To empower students to understand their communities and participate in problem-solving exercises.
                            To develop socially responsible, empathetic, and proactive youth through community engagement and service.
                            To build and develop students’ personalities through voluntary community service.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-lg border-t-8 border-nss-red relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/2 -translate-y-1/2">
                            <Target className="w-64 h-64" />
                        </div>
                        <h2 className="text-3xl font-bold text-nss-red mb-6 flex items-center gap-3">
                            <Target className="w-8 h-8" /> Mission
                        </h2>
                        <ul className="space-y-4 text-gray-700 text-lg">
                            <li className="flex items-start gap-3">
                                <span className="bg-red-100 text-nss-red p-1 rounded mt-1"><CheckIcon /></span>
                                To engage students in constructive social action programs to build their skills and knowledge.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-red-100 text-nss-red p-1 rounded mt-1"><CheckIcon /></span>
                                To foster a sense of social and civic responsibility and leadership qualities in volunteers.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-red-100 text-nss-red p-1 rounded mt-1"><CheckIcon /></span>
                                To develop the capacity to meet emergencies and natural disasters through community involvement.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-red-100 text-nss-red p-1 rounded mt-1"><CheckIcon /></span>
                                To promote national integration and social harmony by linking the campus with the community.
                            </li>
                        </ul>
                    </div>
                </motion.div>

                {/* Motto */}
                <motion.div {...fadeInUp} className="bg-gradient-to-r from-nss-blue to-blue-900 rounded-3xl p-10 text-center text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-6">NSS Motto</h2>
                        <h3 className="text-5xl md:text-7xl font-extrabold text-yellow-400 mb-8 font-serif">"NOT ME BUT YOU"</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-blue-100">
                            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                                <p>Reminds us of our democratic and social responsibilities.</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                                <p>Emphasizes the need for selfless service.</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                                <p>Teaches empathy and consideration for others.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Objectives */}
                <motion.div {...fadeInUp}>
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Core Objectives</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            "Understand the community in which they work.",
                            "Understand themselves in relation to their community.",
                            "Identify the needs and problems of the community and involve them in problem-solving.",
                            "Develop among themselves a sense of social and civic responsibility.",
                            "Utilise their knowledge in finding practical solutions to individual and community problems.",
                            "Develop competence required for group-living and sharing of responsibilities.",
                            "Gain skills in mobilising community participation.",
                            "Acquire leadership qualities and democratic attitudes.",
                            "Develop capacity to meet emergencies and natural disasters and practise national integration and social harmony."
                        ].map((obj, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 border-nss-blue flex items-start gap-4">
                                <span className="bg-blue-50 text-nss-blue font-bold py-1 px-3 rounded text-sm">{index + 1}</span>
                                <p className="text-gray-700">{obj}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Pledge */}
                <motion.div {...fadeInUp} className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                    <div className="bg-nss-red md:w-1/3 p-10 flex flex-col items-center justify-center text-white text-center">
                        <Shield className="w-20 h-20 mb-6" />
                        <h2 className="text-3xl font-bold">NSS Pledge</h2>
                        <p className="mt-4 opacity-90">A commitment to nation building.</p>
                    </div>
                    <div className="p-10 md:w-2/3 flex flex-col justify-center bg-[url('/assets/pattern.png')]">
                        <div className="space-y-6 text-gray-700 italic text-lg leading-relaxed relative">
                            <p>
                                "I, as a responsible volunteer of the National Service Scheme, solemnly pledge to work selflessly and sincerely for the development of our nation and the welfare of society.
                            </p>
                            <p>
                                I shall always be ready to help others, uphold the values of social justice, equality, and humanity, and actively participate in every activity.
                            </p>
                            <p>
                                I shall utilize my knowledge, efforts, and abilities for the progress of myself, society, and the nation.
                            </p>
                            <p>
                                I shall promote and spread the values of environmental conservation, cleanliness, education, health, and social harmony.
                            </p>
                            <p>
                                I shall uphold the values enshrined in our Constitution, and the welfare of the nation shall be my highest duty."
                            </p>
                            <p className="text-nss-red font-bold text-2xl not-italic text-right">Jai Hind!</p>
                        </div>
                    </div>
                </motion.div>

                {/* Benefits */}
                <motion.div {...fadeInUp}>
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Benefits of Being a Volunteer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-orange-50 p-8 rounded-2xl border border-orange-100">
                            <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
                                <UserCheck className="w-6 h-6" /> Personal Growth
                            </h3>
                            <ul className="space-y-3 text-gray-700">
                                <li>• Become an accomplished social leader</li>
                                <li>• Become an efficient administrator</li>
                                <li>• Develop a deep understanding of human nature</li>
                                <li>• Enhance practical problem-solving & project management skills</li>
                            </ul>
                        </div>
                        <div className="bg-green-50 p-8 rounded-2xl border border-green-100">
                            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                                <Award className="w-6 h-6" /> Professional Advantages
                            </h3>
                            <ul className="space-y-3 text-gray-700">
                                <li>• <span className="font-bold">Certificate:</span> Recognition for working with NGOs.</li>
                                <li>• <span className="font-bold">Internships:</span> Eligibility for government internships.</li>
                                <li>• <span className="font-bold">CV Boost:</span> High value for social work in corporate profiles.</li>
                                <li>• <span className="font-bold">Govt Services:</span> Supplementary marks in entrance exams.</li>
                                <li>• <span className="font-bold">Higher Education:</span> Helpful for MS and further studies.</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Adventure & Camps */}
                <motion.div {...fadeInUp}>
                    <div className="bg-gray-900 rounded-3xl p-10 text-white">
                        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                            <Mountain className="w-8 h-8 text-yellow-500" /> Adventure Programs & Camps
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-xl font-bold text-yellow-500 mb-4">Objectives of Adventure Programme</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <Zap className="w-5 h-5 text-yellow-500 mt-1" />
                                        Promote various adventure activities among NSS volunteers.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Zap className="w-5 h-5 text-yellow-500 mt-1" />
                                        Infuse the sense of love towards the various regions of India.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Zap className="w-5 h-5 text-yellow-500 mt-1" />
                                        Enhance leadership qualities, fraternity, team spirit and risk taking capacity.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Zap className="w-5 h-5 text-yellow-500 mt-1" />
                                        Exposure to new vocational possibilities.
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-yellow-500 mb-4">Camp Activities</h3>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        "National Integration Camps (NIC)", "Republic Day Camp (RDC)", "Adventure Camp",
                                        "Joint Camps", "Ek Bharat Shreshtha Bharat (EBSB)", "Special Camp",
                                        "Regular Camps", "State Level Camp", "Youth Leadership Camp",
                                        "Health Camps", "Avahaan (State Level)"
                                    ].map((camp, i) => (
                                        <span key={i} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm transition-colors border border-white/10">
                                            {camp}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

const CheckIcon = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
)

export default Mission;
