import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [signs, setSigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [newSign, setNewSign] = useState({ symbol: '', meaning: '' });
  const [submitting, setSubmitting] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('bridge_token');
    const user = localStorage.getItem('bridge_user');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'Admin') {
      navigate('/');
      return;
    }

    // Fetch users and signs
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('bridge_token');

    try {
      // Fetch users
      const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

      // Fetch signs
      const signsResponse = await fetch('http://localhost:5000/api/admin/signs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!signsResponse.ok) throw new Error('Failed to fetch signs');
      const signsData = await signsResponse.json();
      setSigns(signsData.signs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    const token = localStorage.getItem('bridge_token');
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');
      
      // Refresh users list
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddSign = async (e) => {
    e.preventDefault();
    if (!newSign.symbol || !newSign.meaning) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('bridge_token');

    try {
      const response = await fetch('http://localhost:5000/api/admin/signs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: newSign.symbol,
          meaning: newSign.meaning
        })
      });

      if (!response.ok) throw new Error('Failed to add sign');
      
      const data = await response.json();
      setSigns([...signs, data.sign]);
      setNewSign({ symbol: '', meaning: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSign = async (signId) => {
    if (!window.confirm('Are you sure you want to delete this sign?')) return;

    const token = localStorage.getItem('bridge_token');
    try {
      const response = await fetch(`http://localhost:5000/api/admin/signs/${signId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete sign');
      
      // Refresh signs list
      const updatedSigns = signs.filter(s => s.id !== signId);
      setSigns(updatedSigns);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bridge_token');
    localStorage.removeItem('bridge_user');
    localStorage.removeItem('bridge_selected_role');
    navigate('/select-role');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      color: 'white',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: '700',
            margin: '0 0 8px 0'
          }}>
            Admin Dashboard
          </h1>
          <p style={{
            fontSize: '1rem',
            opacity: '0.8',
            margin: 0
          }}>
            Manage users and sign library
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#fca5a5',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.3)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
        >
          Logout
        </button>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.95rem'
          }}>
            {error}
            <button
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#fca5a5',
                cursor: 'pointer',
                float: 'right',
                fontSize: '1.2rem'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'users' ? 'rgba(0, 102, 204, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid #0066cc' : '3px solid transparent',
              color: activeTab === 'users' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('signs')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'signs' ? 'rgba(0, 184, 169, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'signs' ? '3px solid #00b8a9' : '3px solid transparent',
              color: activeTab === 'signs' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            Sign Library ({signs.length})
          </button>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            fontSize: '1.2rem',
            opacity: '0.8'
          }}>
            Loading...
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                {users.length === 0 ? (
                  <div style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    opacity: '0.7'
                  }}>
                    No users found
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.95rem'
                    }}>
                      <thead>
                        <tr style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255, 255, 255, 0.02)'
                        }}>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: '600',
                            opacity: '0.9'
                          }}>ID</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: '600',
                            opacity: '0.9'
                          }}>Username</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: '600',
                            opacity: '0.9'
                          }}>Full Name</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: '600',
                            opacity: '0.9'
                          }}>Role</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'left',
                            fontWeight: '600',
                            opacity: '0.9'
                          }}>Created</th>
                          <th style={{
                            padding: '16px',
                            textAlign: 'center',
                            fontWeight: '600',
                            opacity: '0.9'
                          }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user, idx) => (
                          <tr
                            key={user.id}
                            style={{
                              borderBottom: idx < users.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                              background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                            }}
                          >
                            <td style={{ padding: '16px' }}>{user.id}</td>
                            <td style={{ padding: '16px' }}>{user.username}</td>
                            <td style={{ padding: '16px' }}>{user.full_name || '-'}</td>
                            <td style={{ padding: '16px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                background: user.role === 'Admin' 
                                  ? 'rgba(124, 58, 237, 0.2)' 
                                  : user.role === 'Deaf'
                                  ? 'rgba(0, 184, 169, 0.2)'
                                  : 'rgba(0, 102, 204, 0.2)',
                                color: user.role === 'Admin' 
                                  ? '#d8b4fe' 
                                  : user.role === 'Deaf'
                                  ? '#a7f3d0'
                                  : '#bfdbfe'
                              }}>
                                {user.role}
                              </span>
                            </td>
                            <td style={{ padding: '16px' }}>
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={user.role === 'Admin' && users.filter(u => u.role === 'Admin').length === 1}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  border: '1px solid rgba(239, 68, 68, 0.5)',
                                  color: '#fca5a5',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  transition: 'all 0.3s ease',
                                  opacity: user.role === 'Admin' && users.filter(u => u.role === 'Admin').length === 1 ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                  if (!(user.role === 'Admin' && users.filter(u => u.role === 'Admin').length === 1)) {
                                    e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Signs Tab */}
            {activeTab === 'signs' && (
              <div>
                {/* Add New Sign Form */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    marginTop: 0,
                    marginBottom: '16px',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    Add New Sign to Library
                  </h3>
                  <form onSubmit={handleAddSign} style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    gap: '12px',
                    alignItems: 'flex-end'
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.9rem',
                        opacity: '0.9'
                      }}>
                        Symbol
                      </label>
                      <input
                        type="text"
                        value={newSign.symbol}
                        onChange={(e) => setNewSign({ ...newSign, symbol: e.target.value })}
                        placeholder="e.g., hello"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '0.95rem',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ flex: 2, minWidth: '300px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.9rem',
                        opacity: '0.9'
                      }}>
                        Meaning
                      </label>
                      <input
                        type="text"
                        value={newSign.meaning}
                        onChange={(e) => setNewSign({ ...newSign, meaning: e.target.value })}
                        placeholder="Description of the sign"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '0.95rem',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        background: 'linear-gradient(135deg, #00b8a9, #00a896)',
                        color: 'white',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        opacity: submitting ? 0.7 : 1,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => !submitting && (e.target.style.boxShadow = '0 8px 20px rgba(0, 184, 169, 0.3)')}
                      onMouseLeave={(e) => !submitting && (e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)')}
                    >
                      {submitting ? 'Adding...' : 'Add Sign'}
                    </button>
                  </form>
                </div>

                {/* Signs Table */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  {signs.length === 0 ? (
                    <div style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      opacity: '0.7'
                    }}>
                      No signs in library yet. Add the first one!
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.95rem'
                      }}>
                        <thead>
                          <tr style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(255, 255, 255, 0.02)'
                          }}>
                            <th style={{
                              padding: '16px',
                              textAlign: 'left',
                              fontWeight: '600',
                              opacity: '0.9'
                            }}>ID</th>
                            <th style={{
                              padding: '16px',
                              textAlign: 'left',
                              fontWeight: '600',
                              opacity: '0.9'
                            }}>Symbol</th>
                            <th style={{
                              padding: '16px',
                              textAlign: 'left',
                              fontWeight: '600',
                              opacity: '0.9'
                            }}>Meaning</th>
                            <th style={{
                              padding: '16px',
                              textAlign: 'center',
                              fontWeight: '600',
                              opacity: '0.9'
                            }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {signs.map((sign, idx) => (
                            <tr
                              key={sign.id}
                              style={{
                                borderBottom: idx < signs.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                              }}
                            >
                              <td style={{ padding: '16px' }}>{sign.id}</td>
                              <td style={{ padding: '16px', fontWeight: '600' }}>{sign.symbol}</td>
                              <td style={{ padding: '16px' }}>{sign.meaning}</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleDeleteSign(sign.id)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    color: '#fca5a5',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
