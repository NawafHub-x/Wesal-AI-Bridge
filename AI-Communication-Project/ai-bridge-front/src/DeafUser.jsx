import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from './socket';
import { 
  Video, 
  PlusCircle, 
  Trash2, 
  CheckCircle, 
  Send,
  Mic,
  Volume2,
  Play,
  Pause,
  ArrowLeft
} from 'lucide-react';

const SYNONYM_MAP = {
  hello: ['hello', 'hi', 'hey'],
  love: ['love', 'heart', 'like'],
  ok: ['ok', 'okay', 'fine', 'good'],
  help: ['help', 'assist', 'save'],
  no: ['no', 'never', 'stop'],
  pace: ['pace', 'walk', 'step'],
  angry: ['angry', 'mad', 'furious'],
};

const GIF_BY_CANONICAL = {
  hello: '/assets/signs/hello_sign.gif',
  love: '/assets/signs/love_sign.gif',
  ok: '/assets/signs/ok_sign.gif',
  help: '/assets/signs/help_sign.gif',
  no: '/assets/signs/no_sign.gif',
  pace: '/assets/signs/pace_sgin.gif',
  angry: '/assets/signs/angry_sgin.gif',
};

const mapTextToGifPath = (text = '') => {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;

  const words = normalized.split(/\s+/).filter(Boolean);
  for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (words.some((word) => synonyms.includes(word))) {
      return GIF_BY_CANONICAL[canonical];
    }
  }
  return null;
};

function DeafUser() {
  const [streamActive, setStreamActive] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState("Waiting...");
  const [history, setHistory] = useState([]); 
  const [incomingMessage, setIncomingMessage] = useState({ id: 0, text: "", signUrl: null });
  const [isDetecting, setIsDetecting] = useState(false);
  // Sentence Builder States
  const [compositionBuffer, setCompositionBuffer] = useState("");
  const [isFinalized, setIsFinalized] = useState(false);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('display_sign', (data) => {
      // Message from Blind user (voice converted to sign)
      console.log('📨 Received display_sign event:', data);
      const text = data?.text || '';
      const mappedPath = mapTextToGifPath(text);
      const finalPath = data?.signUrl || mappedPath;
      console.log("Received text:", text, "Mapped Path:", finalPath);
      setIncomingMessage((prev) => ({ id: prev.id + 1, text, signUrl: finalPath }));
    });

    socket.on('new_sign', (data) => {
      const sign = data.sign || 'Waiting...';
      setCurrentPrediction(sign);
      setIsDetecting(true);
      setTimeout(() => setIsDetecting(false), 800);
      console.log('🖐️ New sign detected:', sign);
    });

    socket.on('receive_message', (data) => {
      console.log('📨 Received message event:', data);
      if (data.text) {
        const text = data.text;
        const mappedPath = mapTextToGifPath(text);
        console.log("Received text:", text, "Mapped Path:", mappedPath);
        setIncomingMessage((prev) => ({ id: prev.id + 1, text, signUrl: mappedPath }));
        console.log('📨 Received message from Blind user:', data.text);
      }
    });

    return () => {
      socket.off('display_sign');
      socket.off('new_sign');
      socket.off('receive_message');
    };
  }, []);

  const sendFrame = () => {
    const video = videoRef.current;
    if (video && video.readyState === 4) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      socket.emit('process_frame', { image: dataUrl });
    }
  };

  useEffect(() => {
    if (streamActive) {
      intervalRef.current = setInterval(sendFrame, 500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [streamActive]);

  const handleConfirmSend = () => {
    if (currentPrediction !== "Waiting...") {
      setHistory(prev => [currentPrediction, ...prev].slice(0, 5));
      // Send with deaf_message event instead of send_message
      socket.emit('deaf_message', { text: currentPrediction });
      console.log('📨 Deaf user sending:', currentPrediction);
      setCurrentPrediction("Waiting...");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
        setStreamActive(true); 
      }
    } catch (err) { 
      alert("Enable camera access."); 
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF7F0',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#3A5A40',
              cursor: 'pointer',
              fontSize: '1.125rem',
              marginBottom: '16px',
              padding: 0,
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#588157'}
            onMouseLeave={(e) => e.target.style.color = '#3A5A40'}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '2.25rem', color: '#3A5A40', margin: 0, fontWeight: 800, fontStyle: 'italic', textTransform: 'uppercase' }}>WESAL</h1>
        </div>

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* Camera Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            gridColumn: 'span 2'
          }}>
            {/* Camera Viewport */}
            <div style={{
              overflow: 'hidden',
              borderRadius: '40px',
              border: '6px solid white',
              boxShadow: '0 20px 60px rgba(27, 67, 50, 0.08)',
              backgroundColor: '#1B4332'
            }}>
              <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #1B4332, #081C15)',
                aspectRatio: '16 / 9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }} 
                />
                
                {/* Camera placeholder */}
                {!streamActive && (
                  <div style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Video size={96} color="#FAF7F0" opacity={0.3} />
                  </div>
                )}

                {/* AI Detection Box */}
                {isDetecting && streamActive && (
                  <div style={{
                    position: 'absolute',
                    inset: '48px',
                    border: '4px solid #40916C',
                    borderRadius: '24px',
                    animation: 'slideIn 0.3s ease-out'
                  }}>
                    {/* Corner markers */}
                    {[
                      { top: 0, left: 0, style: { borderTop: '4px solid #40916C', borderLeft: '4px solid #40916C', borderTopLeftRadius: '8px' } },
                      { top: 0, right: 0, style: { borderTop: '4px solid #40916C', borderRight: '4px solid #40916C', borderTopRightRadius: '8px' } },
                      { bottom: 0, left: 0, style: { borderBottom: '4px solid #40916C', borderLeft: '4px solid #40916C', borderBottomLeftRadius: '8px' } },
                      { bottom: 0, right: 0, style: { borderBottom: '4px solid #40916C', borderRight: '4px solid #40916C', borderBottomRightRadius: '8px' } }
                    ].map((corner, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          width: '32px',
                          height: '32px',
                          ...corner.style,
                          ...(corner.top !== undefined && { top: corner.top }),
                          ...(corner.bottom !== undefined && { bottom: corner.bottom }),
                          ...(corner.left !== undefined && { left: corner.left }),
                          ...(corner.right !== undefined && { right: corner.right })
                        }}
                      />
                    ))}
                    
                    {/* Detection label */}
                    <div style={{
                      position: 'absolute',
                      top: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#40916C',
                      color: 'white',
                      padding: '4px 16px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      Detecting...
                    </div>
                  </div>
                )}

                {/* Live indicator */}
                {streamActive && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)',
                    padding: '8px 12px',
                    borderRadius: '20px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      animation: 'pulse 2s infinite'
                    }} />
                    <span style={{ color: 'white', fontSize: '0.875rem' }}>Live</span>
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={streamActive ? () => setStreamActive(false) : startCamera}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: streamActive 
                    ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
                    : 'linear-gradient(135deg, #1B4332, #081C15)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {streamActive ? "STOP CAMERA" : "START CAMERA"}
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={!streamActive || currentPrediction === "Waiting..."}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: (!streamActive || currentPrediction === "Waiting...") 
                    ? 'rgba(0,0,0,0.1)' 
                    : 'linear-gradient(135deg, #1B4332, #2D6A4F)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: (!streamActive || currentPrediction === "Waiting...") ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  opacity: (!streamActive || currentPrediction === "Waiting...") ? 0.5 : 1,
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                CONFIRM & SEND
              </button>
            </div>

            {/* Prediction Box - Top Primary Box */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(58, 90, 64, 0.1), rgba(58, 90, 64, 0.05))',
              border: '2px solid rgba(58, 90, 64, 0.3)',
              padding: '24px',
              borderRadius: '2.5rem',
              boxShadow: '0 8px 32px rgba(58, 90, 64, 0.1)'
            }}>
              <p style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#588157',
                margin: '0 0 8px 0',
                textTransform: 'uppercase'
              }}>
                {isFinalized ? 'Finalized Message' : 'AI Detected Sign:'}
              </p>
              <p style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#3A5A40',
                margin: 0,
                lineHeight: 1.4
              }}>
                {isFinalized ? compositionBuffer : currentPrediction}
              </p>
            </div>

            {/* Sentence Builder - Composition Buffer */}
            {!isFinalized && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(216, 243, 220, 0.6), rgba(216, 243, 220, 0.3))',
                backdropFilter: 'blur(12px)',
                border: '2px solid #D8F3DC',
                padding: '24px',
                borderRadius: '2.5rem',
                boxShadow: '0 8px 32px rgba(27, 67, 50, 0.08)'
              }}>
                <p style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#588157',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase'
                }}>
                  � Sentence Builder - Composition Buffer
                </p>
                <p style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#3A5A40',
                  margin: '0 0 16px 0',
                  lineHeight: 1.4,
                  minHeight: '3rem',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '1rem'
                }}>
                  {compositionBuffer || 'Perform signs to build your sentence...'}
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {/* ➕ ADD Button */}
                  <button
                    onClick={() => {
                      if (currentPrediction !== "Waiting...") {
                        setCompositionBuffer(prev => 
                          prev ? prev + ' ' + currentPrediction : currentPrediction
                        );
                      }
                    }}
                    disabled={currentPrediction === "Waiting..."}
                    style={{
                      flex: 1,
                      padding: '16px 20px',
                      borderRadius: '1rem',
                      border: 'none',
                      background: currentPrediction === "Waiting..." 
                        ? 'rgba(0,0,0,0.08)' 
                        : 'linear-gradient(135deg, #588157, #3A5A40)',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: currentPrediction === "Waiting..." ? 'not-allowed' : 'pointer',
                      opacity: currentPrediction === "Waiting..." ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPrediction !== "Waiting...") e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    aria-label="Add current sign to composition"
                  >
                    <PlusCircle size={20} /> ADD
                  </button>
                  {/* ✔️ FINALIZE Button */}
                  <button
                    onClick={() => {
                      if (compositionBuffer) {
                        setIsFinalized(true);
                      }
                    }}
                    disabled={!compositionBuffer}
                    style={{
                      flex: 1,
                      padding: '16px 20px',
                      borderRadius: '1rem',
                      border: 'none',
                      background: !compositionBuffer 
                        ? 'rgba(0,0,0,0.08)' 
                        : 'linear-gradient(135deg, #40916C, #2D6A4F)',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: !compositionBuffer ? 'not-allowed' : 'pointer',
                      opacity: !compositionBuffer ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (compositionBuffer) e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    aria-label="Finalize message"
                  >
                    <CheckCircle size={20} /> FINALIZE
                  </button>
                  {/* ❌ DELETE Button */}
                  <button
                    onClick={() => {
                      setCompositionBuffer("");
                      setCurrentPrediction("Waiting...");
                    }}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '1rem',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    aria-label="Delete and reset composition"
                  >
                    <Trash2 size={20} /> DELETE
                  </button>
                </div>
              </div>
            )}

            {/* Final Review - Confirm & Send */}
            {isFinalized && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(58, 90, 64, 0.15), rgba(58, 90, 64, 0.08))',
                border: '3px solid #3A5A40',
                padding: '32px',
                borderRadius: '2.5rem',
                boxShadow: '0 12px 48px rgba(58, 90, 64, 0.2)',
                animation: 'slideDown 0.3s ease-out'
              }}>
                <p style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#588157',
                  margin: '0 0 16px 0',
                  textTransform: 'uppercase',
                  textAlign: 'center'
                }}>
                  Ready to Send
                </p>
                <p style={{
                  fontSize: '1.75rem',
                  fontWeight: '800',
                  color: '#3A5A40',
                  margin: '0 0 24px 0',
                  lineHeight: 1.4,
                  textAlign: 'center',
                  padding: '16px',
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: '1rem'
                }}>
                  {compositionBuffer}
                </p>
                <button
                  onClick={() => {
                    if (compositionBuffer) {
                      setHistory(prev => [compositionBuffer, ...prev].slice(0, 5));
                      socket.emit('deaf_message', { text: compositionBuffer });
                      console.log('📨 Deaf user sending:', compositionBuffer);
                      // Reset all states
                      setCompositionBuffer("");
                      setIsFinalized(false);
                      setCurrentPrediction("Waiting...");
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '20px 32px',
                    borderRadius: '1rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3A5A40, #588157)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'transform 0.2s',
                    boxShadow: '0 8px 24px rgba(58, 90, 64, 0.3)'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  aria-label="Confirm and send to partner"
                >
                  <Send size={24} /> CONFIRM & SEND TO PARTNER
                </button>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* History */}
            <div style={{
              background: 'white',
              border: '1px solid rgba(27, 67, 50, 0.1)',
              padding: '24px',
              borderRadius: '40px',
              boxShadow: '0 4px 24px rgba(27, 67, 50, 0.06)'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#1B4332',
                margin: '0 0 16px 0'
              }}>
                Sent Messages
              </h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {history.length > 0 ? (
                  history.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: '#D8F3DC',
                        marginBottom: '8px',
                        fontSize: '0.9rem',
                        borderLeft: '3px solid #40916C',
                        color: '#2D6A4F'
                      }}
                    >
                      <span style={{ color: '#40916C', marginRight: '8px' }}>✓</span>
                      {h}
                    </div>
                  ))
                ) : (
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#9ca3af',
                    fontStyle: 'italic'
                  }}>
                    No messages sent yet
                  </p>
                )}
              </div>
            </div>

            {/* Incoming Message */}
            <div style={{
              background: 'white',
              border: '1px solid rgba(27, 67, 50, 0.1)',
              padding: '24px',
              borderRadius: '40px',
              boxShadow: '0 4px 24px rgba(27, 67, 50, 0.06)'
            }}>
              <h2 style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#1B4332',
                margin: '0 0 16px 0'
              }}>
                Partner's Message
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <p style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#2D6A4F',
                    margin: '0 0 8px 0',
                    textTransform: 'uppercase'
                  }}>
                    They Said:
                  </p>
                  <p style={{
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    color: '#1B4332',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {incomingMessage.text || "Waiting..."}
                  </p>
                </div>
                {/* Render GIF (if available) with transparency effect */}
                <div style={{
                  width: '100%',
                  minHeight: '16rem',
                  background: '#FAF7F0',
                  border: '2px solid #3A5A40',
                  borderRadius: '2.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(58, 90, 64, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {incomingMessage.signUrl ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: '#000000',
                      borderRadius: '15px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px'
                    }}>
                      {console.log('🎬 Rendering image with src:', incomingMessage.signUrl, 'for text:', incomingMessage.text)}
                      <img
                        key={incomingMessage.id}
                        src={incomingMessage.signUrl}
                        alt={incomingMessage.text || 'sign'}
                        onError={(e) => {
                          console.error('❌ Image failed to load:', e.target.src);
                          e.target.style.display = 'none';
                        }}
                        onLoad={(e) => {
                          console.log('✅ Image loaded successfully:', e.target.src);
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          pointerEvents: 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      justifyContent: 'center',
                      color: '#588157',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#588157',
                        animation: 'pulse 2s infinite'
                      }} />
                      <span>{incomingMessage.text ? incomingMessage.text : 'Waiting for sign...'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default DeafUser;