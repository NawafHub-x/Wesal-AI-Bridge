import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Blind');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!password || password.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }
    if (!role) {
      setError('Please select a role');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      setSuccess('✅ Account created successfully! Redirecting to login...');
      
      setFullName('');
      setUsername('');
      setPassword('');
      setRole('Blind');

      localStorage.setItem('bridge_selected_role', role);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError('Connection failed. Please try again.');
      console.error('Registration error:', err);
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
            Create your account
          </p>
        </div>

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

          {success && (
            <div style={{
              background: '#D8F3DC',
              border: '1px solid rgba(64, 145, 108, 0.3)',
              color: '#1B4332',
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '0.95rem'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#2D6A4F'
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
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
                placeholder="Choose a unique username"
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
                placeholder="Create a secure password"
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

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#2D6A4F'
              }}>
                Select Your Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
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
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <option value="Blind" style={{ background: '#F9F7F2', color: '#1B4332' }}>
                  👁️ Blind User (Audio Interface)
                </option>
                <option value="Deaf" style={{ background: '#F9F7F2', color: '#1B4332' }}>
                  👂 Deaf User (Visual Interface)
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #1B4332, #081C15)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(27, 67, 50, 0.2)',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.boxShadow = '0 15px 40px rgba(27, 67, 50, 0.3)')}
              onMouseLeave={(e) => !loading && (e.target.style.boxShadow = '0 10px 30px rgba(27, 67, 50, 0.2)')}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/login')}
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
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default Register;