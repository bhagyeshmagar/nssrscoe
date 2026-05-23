export interface Event {
    id: string;
    title: string;
    date: string;
    description: string;
    shortDescription?: string; // For the card view
    type: 'upcoming' | 'past';
    image: string;
    location: string;
    gallery?: string[]; // For past events
    reportContent?: string; // For past events text
    reportUrl?: string; // For PDF download
}

export const eventsData: Event[] = [
    {
        id: '1',
        title: 'Village Cleanliness Drive',
        date: '2025-01-15',
        type: 'upcoming',
        location: 'Adopted Village',
        image: 'https://images.unsplash.com/photo-1591185082597-4e0ae2b821f7?q=80&w=600&auto=format&fit=crop',
        description: `Join us for our annual Village Cleanliness Drive. We will be visiting our adopted village to conduct a massive cleaning drive, creating awareness about hygiene and sanitation among the villagers. 
    
    This initiative aims to foster a sense of responsibility towards our environment and helps students understand rural dynamics. We will be dividing into teams to cover different sectors of the village. Transportation and refreshments will be provided.`
    },
    {
        id: '2',
        title: 'Blood Donation Camp',
        date: '2024-12-01',
        type: 'past',
        location: 'College Campus',
        image: 'https://images.unsplash.com/photo-1615461168078-83e800971b38?q=80&w=600&auto=format&fit=crop',
        description: 'Annual blood donation drive in association with Red Cross.',
        gallery: [
            'https://images.unsplash.com/photo-1615461168078-83e800971b38?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=600&auto=format&fit=crop'
        ],
        reportContent: 'The Blood Donation Camp was a huge success with over 200 units of blood collected. Students and faculty participated enthusiastically. The Red Cross society appreciated the seamless organization of the event.',
        reportUrl: '#'
    },
    {
        id: '3',
        title: 'Tree Plantation Drive',
        date: '2025-08-23',
        type: 'past',
        location: 'Mhalunge, Pune',
        image: '/assets/tree_plantation_1.png',
        description: 'Tree Plantation Drive organized by The RSCOE N.S.S Unit to promote environmental awareness and encourage students to actively contribute towards a greener and sustainable future.',
        gallery: [
            '/assets/tree_plantation_1.png',
            '/assets/tree_plantation_2.png',
            '/assets/tree_plantation_3.jpg',
            '/assets/tree_plantation_4.jpg'
        ],
        reportContent: 'The NSS Unit of RSCOE successfully organized a Tree Plantation Drive on 23rd August 2025 at Mhalunge, Pune, with the participation of 150 NSS volunteers, CSBS students, and faculty members. The activity began with gathering at the college main gate followed by travel to the plantation site. Volunteers actively planted saplings while ensuring proper spacing, soil covering, and watering. The faculty coordinator, Prof. B. B. Gadekar, guided the students and explained the importance of trees in maintaining ecological balance and combating climate change. Different species of trees were planted to promote biodiversity. The event concluded with a breakfast session and a vote of thanks, fostering teamwork and environmental responsibility among participants.',
        reportUrl: '#'
    }
];
