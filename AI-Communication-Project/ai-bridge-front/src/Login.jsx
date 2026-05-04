import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from './socket';
import './App.css';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  // Check if user has already selected a role
  useEffect(() => {
    const role = localStorage.getItem('bridge_selected_role');
    if (role) {
      setSelectedRole(role);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!password || password.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('bridge_token', data.token);
      localStorage.setItem('bridge_user', JSON.stringify(data.user));

      // Navigate based on role
      if (data.user.role === 'Admin') {
        navigate('/admin-dashboard');
      } else if (data.user.role === 'Deaf') {
        navigate('/visual-mode');
      } else if (data.user.role === 'Blind') {
        navigate('/audio-mode');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9F7F2',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: '#1B4332'
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: '800',
            margin: '0 0 12px 0',
            letterSpacing: '-0.5px',
            fontStyle: 'italic',
            color: '#1B4332'
          }}>
            Wesal
          </h1>
          <p style={{
            fontSize: '1rem',
            opacity: '0.8',
            margin: 0,
            color: '#2D6A4F'
          }}>
            {selectedRole ? `Login as ${selectedRole}` : 'Login to your account'}
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'white',
          border: '1px solid rgba(27, 67, 50, 0.1)',
          borderRadius: '40px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(27, 67, 50, 0.08)'
        }}>
          {error && (
            <div style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '0.95rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Username Field */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#2D6A4F'
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#F9F7F2',
                  border: '2px solid rgba(27, 67, 50, 0.15)',
                  borderRadius: '12px',
                  color: '#1B4332',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#40916C'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(27, 67, 50, 0.15)'}
              />
            </div>

            {/* Password Field */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#2D6A4F'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#F9F7F2',
                  border: '2px solid rgba(27, 67, 50, 0.15)',
                  borderRadius: '12px',
                  color: '#1B4332',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#40916C'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(27, 67, 50, 0.15)'}
              />
            </div>

            {/* Demo Credentials Info */}
            <div style={{
              background: '#D8F3DC',
              border: '1px solid rgba(64, 145, 108, 0.3)',
              color: '#1B4332',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '0.85rem'
            }}>
              <strong>Demo Account:</strong> admin / admin123
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              style={{
                background: 'linear-gradient(135deg, #1B4332, #081C15)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !username || !password ? 0.6 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(27, 67, 50, 0.2)'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.boxShadow = '0 15px 40px rgba(27, 67, 50, 0.3)')}
              onMouseLeave={(e) => !loading && (e.target.style.boxShadow = '0 10px 30px rgba(27, 67, 50, 0.2)')}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            margin: '20px 0',
            textAlign: 'center',
            opacity: '0.5',
            color: '#2D6A4F'
          }}>
            OR
          </div>

          {/* Register Button */}
          <button
            onClick={() => navigate('/register')}
            disabled={loading}
            style={{
              width: '100%',
              background: '#D8F3DC',
              color: '#1B4332',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#40916C')}
            onMouseEnter={(e) => !loading && (e.target.style.color = 'white')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#D8F3DC')}
            onMouseLeave={(e) => !loading && (e.target.style.color = '#1B4332')}
          >
            Create New Account
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/select-role')}
          disabled={loading}
          style={{
            width: '100%',
            background: 'transparent',
            color: '#1B4332',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 0.8,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => !loading && (e.target.style.opacity = '1')}
          onMouseLeave={(e) => !loading && (e.target.style.opacity = '0.8')}
        >
          ← Back to Role Selection
        </button>
      </div>
    </div>
  );
};

export default Login;
