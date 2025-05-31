import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import DeliveryPartnerDashboard from "./components/DeliveryPartnerDashboard";
import LoadingSpinner from "./components/LoadingSpinner";

// Protected Route Component with role-based redirection
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user role is not allowed, redirect to appropriate dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    if (user?.role === "manager") {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.role === "delivery_partner") {
      return <Navigate to="/delivery-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to appropriate dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === "manager") {
      return <Navigate to="/dashboard" replace />;
    } else if (user?.role === "delivery_partner") {
      return <Navigate to="/delivery-dashboard" replace />;
    }
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="h-full">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-dashboard"
            element={
              <ProtectedRoute allowedRoles={["delivery_partner"]}>
                <DeliveryPartnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <Navigate
                to={
                  user?.role === "manager"
                    ? "/dashboard"
                    : user?.role === "delivery_partner"
                    ? "/delivery-dashboard"
                    : "/login"
                }
                replace
              />
            }
          />
          <Route
            path="*"
            element={
              <Navigate
                to={
                  user?.role === "manager"
                    ? "/dashboard"
                    : user?.role === "delivery_partner"
                    ? "/delivery-dashboard"
                    : "/login"
                }
                replace
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
