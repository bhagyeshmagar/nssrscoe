import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const navLinks = [
        { name: 'Home', path: '/' },
        {
            name: 'About',
            path: '/about',
            dropdown: [
                { name: 'Vision & Mission', path: '/about/mission' },
                { name: 'NSS History', path: '/about/history' },
                { name: 'NSS Team & Portfolios', path: '/members' },
            ]
        },
        {
            name: 'Activities',
            path: '/events',
            dropdown: [
                { name: 'Upcoming Events', path: '/events/upcoming' },
                { name: 'Previous Events', path: '/events/past' },
                { name: 'Activity Reports', path: '/events/reports' },
                { name: 'Activity Calendar', path: '/events/calendar' },
            ]
        },
        {
            name: 'Gallery',
            path: '/gallery',
            dropdown: [
                { name: 'Photos', path: '/gallery' },
                { name: 'Videos & Reels', path: '/gallery/videos' },
            ]
        },
        { name: 'Volunteering', path: '/volunteering' },
        { name: 'Register', path: '/register' },
    ];

    const handleDropdownEnter = (name: string) => {
        setActiveDropdown(name);
    }

    const handleDropdownLeave = () => {
        setActiveDropdown(null);
    }

    return (
        <>
            {/* Top Header with Logos and College Info */}
            <div className="bg-white py-2 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img src="/assets/jspm_logo.jpg" alt="JSPM Logo" className="h-16 w-auto object-contain" />
                        <img src="/assets/rscoe_logo.png" alt="RSCOE Logo" className="h-16 w-auto object-contain" />
                    </div>
                    <div className="text-center flex-1 mx-4">
                        <h1 className="text-nss-red font-bold text-lg md:text-xl lg:text-2xl leading-tight">
                            JSPM's Rajarshi Shahu College of Engineering
                        </h1>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">
                            An Empowered Autonomous Institute Affiliated to Savitribai Phule Pune University
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-500">
                            Approved by AICTE, Accredited by NBA (UG Programs), Accredited by NAAC With "A" Grade | MHRD-NIRF Rank: 151-200
                        </p>
                    </div>
                    <div className="flex items-center">
                        <img src="/assets/nss_logo.jpg" alt="NSS Logo" className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-full" />
                    </div>
                </div>
            </div>

            <nav className="bg-nss-blue text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center h-12">

                        <div className="hidden md:block">
                            <div className="flex items-baseline space-x-1">
                                {navLinks.map((link) => (
                                    <div
                                        key={link.name}
                                        className="relative group"
                                        onMouseEnter={() => link.dropdown && handleDropdownEnter(link.name)}
                                        onMouseLeave={handleDropdownLeave}
                                    >
                                        <Link
                                            to={link.path}
                                            className="hover:bg-nss-red px-4 py-3 rounded-t-md text-sm font-medium transition-colors duration-300 flex items-center"
                                        >
                                            {link.name} {link.dropdown && <ChevronDown className="ml-1 w-4 h-4" />}
                                        </Link>
                                        {link.dropdown && activeDropdown === link.name && (
                                            <div className="absolute left-0 mt-0 w-48 rounded-b-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                                <div className="py-1" role="menu" aria-orientation="vertical">
                                                    {link.dropdown.map((subItem) => (
                                                        <Link
                                                            key={subItem.name}
                                                            to={subItem.path}
                                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-nss-blue"
                                                            role="menuitem"
                                                        >
                                                            {subItem.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="ml-4">
                                    <Link to="/login" className="bg-white text-nss-blue hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-300 border border-nss-blue">
                                        NSS Login
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="-mr-2 flex md:hidden w-full justify-between items-center">
                            <span className="font-bold">NSS MENU</span>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-nss-red focus:outline-none"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-nss-blue border-t border-blue-800"
                        >
                            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                                {navLinks.map((link) => (
                                    <div key={link.name}>
                                        <Link
                                            to={link.path}
                                            className="block hover:bg-nss-red px-3 py-2 rounded-md text-base font-medium"
                                            onClick={() => !link.dropdown && setIsOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                        {link.dropdown && (
                                            <div className="pl-4 space-y-1">
                                                {link.dropdown.map(subItem => (
                                                    <Link
                                                        key={subItem.name}
                                                        to={subItem.path}
                                                        className="block hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white"
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        - {subItem.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Link
                                    to="/login"
                                    className="block bg-white text-nss-blue hover:bg-gray-200 px-3 py-2 rounded-md text-base font-medium mt-4 mx-2 text-center"
                                    onClick={() => setIsOpen(false)}
                                >
                                    NSS Login
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
};

export default Navbar;
