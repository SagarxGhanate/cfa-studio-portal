import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
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

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
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
    <ToastProvider>
      <BrowserRouter>
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
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
