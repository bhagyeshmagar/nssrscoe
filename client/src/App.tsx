import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Gallery from './pages/Gallery';
import Members from './pages/Members';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import VolunteerDashboard from './pages/VolunteerDashboard';
import ProtectedRoute from './components/ProtectedRoute';

import Mission from './pages/Mission';
import History from './pages/History';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import Videos from './pages/Videos';
import Volunteering from './pages/Volunteering';

import UpcomingEvents from './pages/UpcomingEvents';
import PastEvents from './pages/PastEvents';
import EventDetail from './pages/EventDetail';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />

            {/* About Routes */}
            <Route path="/about" element={<About />} />
            <Route path="/about/mission" element={<Mission />} />
            <Route path="/about/history" element={<History />} />

            {/* Activity/Event Routes */}
            <Route path="/events" element={<UpcomingEvents />} />
            <Route path="/events/upcoming" element={<UpcomingEvents />} />
            <Route path="/events/past" element={<PastEvents />} />
            <Route path="/events/:id" element={<EventDetail />} />

            <Route path="/events/reports" element={<Reports />} />
            <Route path="/events/calendar" element={<Calendar />} />

            {/* Gallery Routes */}
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/videos" element={<Videos />} />

            {/* Other Routes */}
            <Route path="/members" element={<Members />} />
            <Route path="/volunteering" element={<Volunteering />} />
            <Route path="/register" element={<Register />} />

            {/* Unified Login Route */}
            <Route path="/login" element={<Login />} />
            {/* Legacy admin login redirect */}
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />

            {/* Admin Routes - Admin Only */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Volunteer Routes - Volunteer Only */}
            <Route
              path="/volunteer/*"
              element={
                <ProtectedRoute volunteerOnly>
                  <VolunteerDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

