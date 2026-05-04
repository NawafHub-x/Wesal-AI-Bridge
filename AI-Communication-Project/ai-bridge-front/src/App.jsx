import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DeafUser from './DeafUser';
import BlindUser from './BlindUser';
import Login from './Login';
import Register from './Register';
import SelectRole from './SelectRole';
import AdminDashboard from './AdminDashboard';
import './App.css';

// Protected route wrapper component
const ProtectedRoute = ({ element, requiredRole }) => {
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('bridge_token');
    const user = localStorage.getItem('bridge_user');

    if (!token || !user) {
      setIsValid(false);
      return;
    }

    try {
      const userData = JSON.parse(user);
      
      if (requiredRole && userData.role !== requiredRole) {
        setIsValid(false);
        return;
      }

      setIsValid(true);
    } catch (err) {
      setIsValid(false);
    }
  }, [requiredRole]);

  if (isValid === null) {
    return <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      color: 'white',
      fontSize: '1.2rem'
    }}>Loading...</div>;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return element;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} requiredRole="Admin" />} />
        <Route path="/visual-mode" element={<ProtectedRoute element={<DeafUser />} requiredRole="Deaf" />} />
        <Route path="/audio-mode" element={<ProtectedRoute element={<BlindUser />} requiredRole="Blind" />} />
        
        {/* Legacy routes for backwards compatibility */}
        <Route path="/deaf" element={<Navigate to="/visual-mode" replace />} />
        <Route path="/blind" element={<Navigate to="/audio-mode" replace />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/select-role" replace />} />
      </Routes>
    </Router>
  );
}

const styles = {
  navbar: {
    background: '#1B4332',
    boxShadow: '0 4px 24px rgba(27, 67, 50, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },

  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },

  navBrand: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#fff',
    textDecoration: 'none',
    letterSpacing: '0.5px',
    fontStyle: 'italic',
  },

  navLinks: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },

  navLink: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1rem',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '2px solid transparent',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
  },
};

export default App;