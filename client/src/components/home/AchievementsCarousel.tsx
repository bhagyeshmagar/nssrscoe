import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadAPI } from '@/services/api';
import { useRecentAchievements } from '@/hooks/useAchievements';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Achievement } from '@/types/achievement';

const AchievementSlide = ({ a }: { a: Achievement }) => (
    <div className="relative aspect-[16/7] overflow-hidden rounded-2xl shadow-lg flex-shrink-0 w-full group">
        <img
            src={uploadAPI.getFullUrl(a.imageUrl)}
            alt={a.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white font-bold text-lg leading-snug line-clamp-2 drop-shadow">{a.title}</p>
        </div>
    </div>
);

export const AchievementsCarousel = () => {
    const { data: achievements = [] } = useRecentAchievements(8);
    const [current, setCurrent] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const count = achievements.length;
    // show 2 at a time, so total pages = ceil(count / 2)
    const totalPages = Math.ceil(count / 2);

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCurrent(p => (p + 1) % totalPages);
        }, 4000);
    };

    useEffect(() => {
        if (count > 2) startTimer();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [count]);

    if (count === 0) return null;

    const prev = () => { setCurrent(p => (p - 1 + totalPages) % totalPages); startTimer(); };
    const next = () => { setCurrent(p => (p + 1) % totalPages); startTimer(); };

    const visiblePair = achievements.slice(current * 2, current * 2 + 2);

    return (
        <section className="py-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-400/20 p-2 rounded-lg">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Our Achievements</h2>
                    </div>
                    <Link
                        to="/achievements"
                        className="text-sm text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                    >
                        View All →
                    </Link>
                </div>

                <div
                    className="relative"
                    onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current); }}
                    onMouseLeave={() => { if (count > 2) startTimer(); }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                            {visiblePair.map(a => (
                                <AchievementSlide key={a.id} a={a} />
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Prev/Next */}
                    {totalPages > 1 && (
                        <>
                            <button
                                onClick={prev}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={next}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    {/* Dots */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-1.5 mt-4">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setCurrent(i); startTimer(); }}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-yellow-400 scale-125' : 'bg-white/30 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
