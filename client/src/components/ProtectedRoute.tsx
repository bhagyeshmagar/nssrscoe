import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { decodeToken } from '../services/api';

interface ProtectedRouteProps {
    children: React.ReactNode;
    adminOnly?: boolean;
    volunteerOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false, volunteerOnly = false }: ProtectedRouteProps) => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    // No token - redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const decoded = decodeToken(token);

    // Invalid/expired token - clear and redirect to login
    if (!decoded) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        return <Navigate to="/login" replace />;
    }

    const userRole = decoded.role;

    // Role-based access control with loop prevention
    if (adminOnly && userRole !== 'admin') {
        // Volunteer trying to access admin page - redirect to volunteer dashboard
        // But only if not already on volunteer route (prevents loop)
        if (!location.pathname.startsWith('/volunteer')) {
            return <Navigate to="/volunteer" replace />;
        }
    }

    if (volunteerOnly && userRole !== 'volunteer') {
        // Admin trying to access volunteer page - redirect to admin dashboard
        // But only if not already on admin route (prevents loop)
        if (!location.pathname.startsWith('/admin')) {
            return <Navigate to="/admin" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
