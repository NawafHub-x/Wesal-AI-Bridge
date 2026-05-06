import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Eye } from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role) => {
    setLoading(true);
    localStorage.setItem('bridge_selected_role', role);

    if (role === 'Blind') {
      navigate('/audio-mode');
      return;
    }
    navigate('/visual-mode');
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.logoShell}>
          <img src="/assets/logo.jpg" alt="Wesal logo" style={styles.logoImage} />
        </div>

        <h1 style={styles.title}>Wesal</h1>
        <p style={styles.subtitle}>Connecting Deaf and Blind Users</p>

        <div className="role-row" style={styles.roleRow}>
          <button
            className="role-circle role-circle-blind"
            type="button"
            onClick={() => handleRoleSelect('Blind')}
            disabled={loading}
            style={styles.blindButton}
            aria-label="I am Blind"
          >
            <Mic size={72} color="#F9F7F2" />
            <span style={styles.roleLabel}>I am Blind</span>
            <span style={styles.roleSubtext}>Audio Interface</span>
          </button>

          <button
            className="role-circle role-circle-deaf"
            type="button"
            onClick={() => handleRoleSelect('Deaf')}
            disabled={loading}
            style={styles.deafButton}
            aria-label="I am Deaf"
          >
            <Eye size={72} color="#F9F7F2" />
            <span style={styles.roleLabel}>I am Deaf</span>
            <span style={styles.roleSubtext}>Visual Interface</span>
          </button>
        </div>
      </div>

      <style>{`
        .role-row {
          display: flex;
          gap: 2.25rem;
          align-items: center;
          justify-content: center;
          width: 100%;
          flex-wrap: wrap;
        }

        .role-circle {
          transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
        }

        .role-circle svg {
          transition: transform 0.25s ease, opacity 0.25s ease;
        }

        .role-circle:hover:not(:disabled) {
          transform: scale(1.05);
          filter: brightness(1.05);
        }

        .role-circle:hover:not(:disabled) svg {
          transform: scale(1.06);
        }

        @media (max-width: 900px) {
          .role-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

const baseCircle = {
  width: '17rem',
  height: '17rem',
  borderRadius: '9999px',
  border: 'none',
  color: '#F9F7F2',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.7rem',
  cursor: 'pointer',
  boxShadow: '0 16px 40px rgba(27, 67, 50, 0.22)',
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F9F7F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  container: {
    width: '100%',
    maxWidth: '980px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.8rem',
  },
  logoShell: {
    width: '7.2rem',
    height: '7.2rem',
    borderRadius: '2rem',
    background: '#1B4332',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 14px 34px rgba(27, 67, 50, 0.28)',
    overflow: 'hidden',
    marginBottom: '0.8rem',
  },
  logoImage: {
    width: '78%',
    height: '78%',
    objectFit: 'cover',
    borderRadius: '1.1rem',
  },
  title: {
    margin: 0,
    color: '#000000',
    fontSize: '2.6rem',
    fontWeight: 800,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '0 0 1.8rem 0',
    color: '#2D6A4F',
    fontSize: '1.1rem',
    textAlign: 'center',
  },
  roleRow: {
    marginTop: '0.6rem',
  },
  blindButton: {
    ...baseCircle,
    background: '#1B4332',
  },
  deafButton: {
    ...baseCircle,
    background: '#2D6A4F',
  },
  roleLabel: {
    fontSize: '1.28rem',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  roleSubtext: {
    fontSize: '0.95rem',
    opacity: 0.95,
  },
};

export default RoleSelection;
