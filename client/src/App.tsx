import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loaded pages for performance optimization
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Members = lazy(() => import('./pages/Members'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const VolunteerDashboard = lazy(() => import('./pages/VolunteerDashboard'));
const Mission = lazy(() => import('./pages/Mission'));
const History = lazy(() => import('./pages/History'));
const Reports = lazy(() => import('./pages/Reports'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Videos = lazy(() => import('./pages/Videos'));
const Volunteering = lazy(() => import('./pages/Volunteering'));
const UpcomingEvents = lazy(() => import('./pages/UpcomingEvents'));
const PastEvents = lazy(() => import('./pages/PastEvents'));
const EventDetail = lazy(() => import('./pages/EventDetail'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nss-blue"></div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
