import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CreateComplaintPage } from './pages/student/CreateComplaintPage';
import { StudentComplaintDetails } from './pages/student/StudentComplaintDetails';
import { TechnicianDashboard } from './pages/technician/TechnicianDashboard';
import { TechnicianComplaintDetails } from './pages/technician/TechnicianComplaintDetails';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAIReviewPage } from './pages/admin/AdminAIReviewPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';
import { AdminAssetsPage } from './pages/admin/AdminAssetsPage';
import { AdminWorkOrdersPage } from './pages/admin/AdminWorkOrdersPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { TechnicianMaintenancePage } from './pages/technician/TechnicianMaintenancePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { Role } from './types';

const ProtectedRoute: React.FC<{ allowedRoles?: Role[]; children: React.ReactNode }> = ({
  allowedRoles,
  children
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to proper role dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TECHNICIAN') return <Navigate to="/technician/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner message="Loading CampusFix AI..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'TECHNICIAN') return <Navigate to="/technician/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaints/new"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <CreateComplaintPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaints"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaints/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <StudentComplaintDetails />
              </ProtectedRoute>
            }
          />

          {/* Technician Protected Routes */}
          <Route
            path="/technician/dashboard"
            element={
              <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician/complaints"
            element={
              <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician/complaints/:id"
            element={
              <ProtectedRoute allowedRoles={['TECHNICIAN', 'ADMIN']}>
                <TechnicianComplaintDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician/maintenance"
            element={
              <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                <TechnicianMaintenancePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-review"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminAIReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assets"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminAssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/work-orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminWorkOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminInventoryPage />
              </ProtectedRoute>
            }
          />

          {/* Shared Notifications Route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
