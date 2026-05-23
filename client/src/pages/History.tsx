import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Award } from 'lucide-react';

const History = () => {
    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-nss-blue py-16 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/assets/pattern.png')]"></div>
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold mb-4 relative z-10"
                >
                    NSS History
                </motion.h1>
                <p className="text-blue-200 text-lg relative z-10">The journey of service and nation-building.</p>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16 space-y-24">

                {/* Section 1: Concept & Beginning */}
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="md:w-1/2"
                    >
                        <div className="relative">
                            <div className="absolute -inset-4 bg-orange-200 rounded-full opacity-50 blur-2xl"></div>
                            <img
                                src="/assets/gandhi.png"
                                alt="Mahatma Gandhi"
                                className="relative rounded-2xl shadow-xl w-full max-w-sm mx-auto border-4 border-white"
                            />
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="md:w-1/2 space-y-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <Calendar className="w-6 h-6" />
                            </span>
                            <h2 className="text-3xl font-bold text-gray-800">Concept & Beginning</h2>
                        </div>
                        <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
                            <p>
                                The concept of launching the National Service Scheme (NSS) originated from the ideas of <strong>Mahatma Gandhi</strong> and <strong>Jawaharlal Nehru</strong>.
                            </p>
                            <p>
                                In <strong>January 1950</strong>, Dr. S. Radhakrishnan, the Chairman of the University Education Commission, organized a meeting to discuss how to implement the “ideal” education model inspired by the Gandhian era.
                            </p>
                            <p>
                                In <strong>1952</strong>, during the First Five-Year Plan, a proposal was made to organize student camps emphasizing social service and physical labor.
                            </p>
                            <p>
                                In <strong>1958</strong>, Jawaharlal Nehru suggested that a scheme should be designed for college and university students to engage in rural community service for a period of nine months to one year after completing their degree education.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Section 2: Development of Committee */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="md:w-1/2"
                    >
                        <div className="relative">
                            <div className="absolute -inset-4 bg-blue-200 rounded-full opacity-50 blur-2xl"></div>
                            <img
                                src="/assets/vivekananda.png"
                                alt="Youth Inspiration"
                                className="relative rounded-2xl shadow-xl w-full max-w-sm mx-auto border-4 border-white"
                            />
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="md:w-1/2 space-y-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="p-2 bg-blue-100 rounded-lg text-nss-blue">
                                <Users className="w-6 h-6" />
                            </span>
                            <h2 className="text-3xl font-bold text-gray-800">Development (1959–1969)</h2>
                        </div>
                        <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
                            <p>
                                In <strong>1959</strong>, a committee was established under the chairmanship of <strong>Dr. C. D. Deshmukh</strong> to prepare such a scheme.
                            </p>
                            <p>
                                In <strong>1960</strong>, Prof. K. G. Saiyidain studied various countries and submitted a report titled “National Service for the Youth.”
                            </p>
                            <p>
                                In <strong>1964</strong>, Dr. D. S. Kothari recommended that students should participate in organized social service programs.
                            </p>
                            <p className="bg-blue-50 p-4 rounded-lg border-l-4 border-nss-blue font-medium text-nss-blue">
                                In <strong>May 1969</strong>, a meeting of the Vice-Chancellors’ Subcommittee was held, during which a draft of the National Service Scheme (NSS) was prepared.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Section 3: NSS Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="bg-white rounded-3xl shadow-xl p-8 md:p-12 overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-nss-blue opacity-5 rounded-bl-full"></div>

                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                        <div className="md:w-1/3 flex justify-center">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-nss-blue opacity-20 blur-xl rounded-full group-hover:opacity-30 transition duration-500"></div>
                                <img
                                    src="/assets/nss_badge_desc.png"
                                    alt="NSS Badge"
                                    className="relative w-48 h-48 md:w-64 md:h-64 object-contain transition-transform duration-500 hover:scale-105"
                                />
                            </div>
                        </div>

                        <div className="md:w-2/3 space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-red-100 rounded-lg text-nss-red">
                                    <Award className="w-6 h-6" />
                                </span>
                                <h2 className="text-3xl font-bold text-gray-800">NSS Badge: The Symbol</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow border border-gray-100">
                                    <h4 className="font-bold text-nss-blue mb-2 text-lg">Konark Wheel (8 Spokes)</h4>
                                    <p className="text-gray-600">Represents the 24 hours of the day (Ashta Prahar). Reminds the volunteer to be ready to serve the nation day and night.</p>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow border border-gray-100">
                                    <h4 className="font-bold text-nss-red mb-2 text-lg">Red Color</h4>
                                    <p className="text-gray-600">Symbolizes the passionate, active, and energetic blood of the youth.</p>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow border border-gray-100 md:col-span-2">
                                    <h4 className="font-bold text-blue-800 mb-2 text-lg">Blue Color</h4>
                                    <p className="text-gray-600">Represents the sky — vast and limitless — symbolizing the broad and selfless spirit of the NSS volunteer who is willing to dedicate time for the welfare of humanity.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default History;
