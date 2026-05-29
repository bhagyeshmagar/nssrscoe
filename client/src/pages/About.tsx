const About = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-nss-blue mb-8 text-center">About Us</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-nss-red">Our Mission</h2>
                    <p className="text-gray-700 mb-6">
                        To understand the community in which we work. To understand ourselves in relation to their community.
                        To identify the needs and problems of the community and involve them in problem-solving.
                    </p>
                    <h2 className="text-2xl font-semibold mb-4 text-nss-red">Our Vision</h2>
                    <p className="text-gray-700">
                        To build the youth with the mind and spirit to serve the society and work for the social upliftment of the down-trodden masses of our nation as a movement.
                    </p>
                </div>
                <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">NSS Team Photo Placeholder</span>
                </div>
            </div>
        </div>
    )
}
export default About;
