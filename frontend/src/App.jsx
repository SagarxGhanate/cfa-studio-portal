import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import useAuthStore from './store/authStore';
import api from './services/api';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import AddMember from './pages/AddMember';
import MemberDetail from './pages/MemberDetail';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ImportMembers from './pages/ImportMembers';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import AuditLog from './pages/AuditLog';
import Team from './pages/Team';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Dynamic page titles based on route
const PAGE_TITLES = {
  '/': 'Login',
  '/signup': 'Create Account',
  '/forgot-password': 'Reset Password',
  '/dashboard': 'Dashboard',
  '/members': 'Members',
  '/members/add': 'Add Member',
  '/members/import': 'Import Members',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/audit-log': 'Activity Log',
  '/team': 'Team Management',
};

const PageTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    // Match exact path or check for member detail/edit patterns
    let title = PAGE_TITLES[location.pathname];
    if (!title) {
      if (location.pathname.match(/^\/members\/[^/]+\/edit$/)) {
        title = 'Edit Member';
      } else if (location.pathname.match(/^\/members\/[^/]+$/)) {
        title = 'Member Details';
      } else {
        title = 'Page Not Found';
      }
    }
    document.title = `${title} — CFA Studio`;
  }, [location.pathname]);

  return null;
};

const App = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  // On mount, if we have a token, fetch the user profile
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.data);
          }
        })
        .catch(() => {
          // Token expired or invalid, auto-logout
          logout();
        });
    }
  }, [isAuthenticated]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <PageTitleUpdater />
          <Routes>
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
            />
            <Route 
              path="/signup" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} 
            />
            <Route 
              path="/forgot-password" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} 
            />
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/members" 
              element={<ProtectedRoute><Members /></ProtectedRoute>} 
            />
            <Route 
              path="/members/add" 
              element={<ProtectedRoute><AddMember /></ProtectedRoute>} 
            />
            <Route 
              path="/members/:id" 
              element={<ProtectedRoute><MemberDetail /></ProtectedRoute>} 
            />
            <Route 
              path="/members/:id/edit" 
              element={<ProtectedRoute><AddMember /></ProtectedRoute>} 
            />
            <Route 
              path="/members/import" 
              element={<ProtectedRoute><ImportMembers /></ProtectedRoute>} 
            />
            <Route 
              path="/analytics" 
              element={<ProtectedRoute><Analytics /></ProtectedRoute>} 
            />
            <Route 
              path="/settings" 
              element={<ProtectedRoute><Settings /></ProtectedRoute>} 
            />
            <Route 
              path="/profile" 
              element={<ProtectedRoute><Profile /></ProtectedRoute>} 
            />
            <Route 
              path="/audit-log" 
              element={<ProtectedRoute><AuditLog /></ProtectedRoute>} 
            />
            <Route 
              path="/team" 
              element={<ProtectedRoute><Team /></ProtectedRoute>} 
            />
            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
