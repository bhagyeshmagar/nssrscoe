import { useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';
import type { SiteSettings } from '../services/api';

const Footer = () => {
    const [settings, setSettings] = useState<SiteSettings>({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await settingsAPI.get();
                setSettings((res.data as any).data || res.data);
            } catch (err) {
                console.error("Failed to fetch footer settings", err);
            }
        };
        fetchSettings();
    }, []);

    return (
        <footer className="bg-gray-900 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">NSS JSPM RSCOE</h3>
                        <p className="text-gray-400 text-sm">
                            Not Me, But You. <br />
                            Service needed by the community, for the community, and with the community.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contact</h3>
                        <p className="text-gray-400 text-sm mb-1">
                            <a href="https://jspmrscoe.edu.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                                JSPM's Rajarshi Shahu College of Engineering
                            </a>
                        </p>
                        <p className="text-gray-400 text-sm">Tathawade, Pune</p>
                        <p className="text-gray-400 text-sm mt-2">Email: {settings.contactEmail || 'nssrscoe073@gmail.com'}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
                        <div className="flex space-x-4">
                            {settings.socialInstagram && (
                                <a href={settings.socialInstagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Instagram</a>
                            )}
                            {settings.socialFacebook && (
                                <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Facebook</a>
                            )}
                            {settings.socialTwitter && (
                                <a href={settings.socialTwitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Twitter</a>
                            )}
                            {settings.socialYoutube && (
                                <a href={settings.socialYoutube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">YouTube</a>
                            )}
                            {!settings.socialInstagram && !settings.socialFacebook && !settings.socialTwitter && !settings.socialYoutube && (
                                <p className="text-gray-500 text-sm">No social links configured yet.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <div>&copy; {new Date().getFullYear()} NSS JSPM RSCOE. All rights reserved.</div>
                    <div className="mt-2 md:mt-0">
                        Made for NSS-RSCOE by Bhagyesh Magar
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
