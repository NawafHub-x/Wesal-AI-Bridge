import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SelectRole = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (role) => {
    setLoading(true);
    if (role === 'Blind') {
      navigate('/audio-mode');
      return;
    }
    if (role === 'Deaf') {
      navigate('/visual-mode');
      return;
    }
    navigate('/select-role');
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
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #1B4332, #081C15)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(27, 67, 50, 0.25)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2v6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 7l5 5 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            margin: '0 0 12px 0',
            letterSpacing: '-0.5px',
            fontStyle: 'italic',
            color: '#1B4332'
          }}>
            Wesal
          </h1>
          <p style={{
            fontSize: '1.1rem',
            opacity: '0.8',
            margin: 0,
            color: '#2D6A4F'
          }}>
            Connecting Deaf and Blind Users
          </p>
        </div>

        {/* Role Selection */}
        <div style={{
          background: 'white',
          border: '1px solid rgba(27, 67, 50, 0.1)',
          borderRadius: '40px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(27, 67, 50, 0.08)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginTop: 0,
            marginBottom: '24px',
            textAlign: 'center',
            color: '#1B4332'
          }}>
            Select Your Role
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Blind User Button */}
            <button
              onClick={() => handleSelectRole('Blind')}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #1B4332, #081C15)',
                border: 'none',
                color: 'white',
                padding: '20px 24px',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 10px 30px rgba(27, 67, 50, 0.2)'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.boxShadow = '0 15px 40px rgba(27, 67, 50, 0.3)')}
              onMouseLeave={(e) => !loading && (e.target.style.boxShadow = '0 10px 30px rgba(27, 67, 50, 0.2)')}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4a3 3 0 100 6 3 3 0 000-6z" fill="white"/>
                <path d="M12 13c-4.97 0-9 2.24-9 5v5h18v-5c0-2.76-4.03-5-9-5z" fill="white"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '700' }}>I am Blind</div>
                <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Audio Interface</div>
              </div>
            </button>

            {/* Deaf User Button */}
            <button
              onClick={() => handleSelectRole('Deaf')}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #40916C, #2D6A4F)',
                border: 'none',
                color: 'white',
                padding: '20px 24px',
                borderRadius: '16px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 10px 30px rgba(64, 145, 108, 0.2)'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.boxShadow = '0 15px 40px rgba(64, 145, 108, 0.3)')}
              onMouseLeave={(e) => !loading && (e.target.style.boxShadow = '0 10px 30px rgba(64, 145, 108, 0.2)')}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4a3 3 0 100 6 3 3 0 000-6z" fill="white"/>
                <path d="M12 13c-4.97 0-9 2.24-9 5v5h18v-5c0-2.76-4.03-5-9-5z" fill="white"/>
                <path d="M3 14v3h18v-3" stroke="white" strokeWidth="2" fill="none"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '700' }}>I am Deaf</div>
                <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Visual Interface</div>
              </div>
            </button>

          </div>
        </div>

        {/* Info Card */}
        <div style={{
          background: 'white',
          border: '1px solid rgba(27, 67, 50, 0.1)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(27, 67, 50, 0.06)'
        }}>
          <p style={{ 
            fontSize: '0.9rem', 
            textAlign: 'center', 
            margin: 0,
            color: '#2D6A4F'
          }}>
            Select your role to continue to the appropriate interface
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
