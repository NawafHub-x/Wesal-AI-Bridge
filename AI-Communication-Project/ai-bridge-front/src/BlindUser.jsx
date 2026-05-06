import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from './socket';
import SpeechToText from './components/SpeechToText';
import { 
  Mic, 
  Volume2, 
  PlusCircle, 
  Trash2, 
  CheckCircle, 
  ArrowLeft,
  Wifi,
  MessageSquare
} from 'lucide-react';

const BlindUser = () => {
  const [incomingText, setIncomingText] = useState(""); 
  const [isListening, setIsListening] = useState(false); 
  const [transcript, setTranscript] = useState(""); 
  const [readyToSend, setReadyToSend] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isReviewMode, setIsReviewMode] = useState(false); // Step 1: Review Mode
  const [composedMessage, setComposedMessage] = useState(""); // For concatenation
  const [lastPartnerMessage, setLastPartnerMessage] = useState(""); // For replay
  const [speechError, setSpeechError] = useState("");
  const [speechToTextResetKey, setSpeechToTextResetKey] = useState(0);
  const transcriptRef = useRef(""); // Keep ref synced for existing decision controls
  const currentAudioRef = useRef(null);
  const navigate = useNavigate();

  const isArabicText = (text) => /[\u0600-\u06FF]/.test(text);

  const requestTtsFeedback = (text) => {
    const cleanText = text?.trim();
    if (!cleanText) return;

    const language = isArabicText(cleanText) ? 'Arabic' : 'English';
    socket.emit('get_tts_feedback', { text: cleanText, language });
  };

  const playAudioFromUrl = (audioUrl) => {
    if (!audioUrl) return;

    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.play().catch((err) => console.error('Audio play failed', err));
    } catch (err) {
      console.error('Error playing TTS audio', err);
    }
  };

  const speakWithBrowser = (text) => {
    if (!text || !window.speechSynthesis) return;
    
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isArabicText(text) ? 'ar-SA' : 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Browser speech synthesis failed', err);
    }
  };

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      requestTtsFeedback('Connected');
      console.log('✅ Connected to server');
    });

    socket.on('receive_message', (data) => {
      console.log('📨 Received message:', data);
      if (data && data.text && !data.text.includes('AI Prediction')) {
        setIncomingText(data.text);
        setLastPartnerMessage(data.text); // Store for replay
        requestTtsFeedback(data.text);
      }
    });

    socket.on('tts_feedback', (data) => {
      if (!data) return;
      if (data.error) {
        console.error('TTS feedback error:', data.error);
        setSpeechError('Voice guidance is temporarily unavailable.');
        // Fallback to browser speech synthesis
        if (data.text) {
          speakWithBrowser(data.text);
        }
        return;
      }

      if (data.audio_url) {
        playAudioFromUrl(data.audio_url);
      } else if (data.audio_base64) {
        playAudioFromUrl(`data:audio/mpeg;base64,${data.audio_base64}`);
      } else if (data.text) {
        // Fallback to browser speech synthesis if no audio provided
        speakWithBrowser(data.text);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from server');
    });

    // Simulate connectivity
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.1);
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('receive_message');
      socket.off('disconnect');
      socket.off('tts_feedback');
    };
  }, []);

  const handleTranscriptChange = (updatedTranscript) => {
    const normalizedTranscript = updatedTranscript.trim();
    setTranscript(normalizedTranscript);
    transcriptRef.current = normalizedTranscript;
    setSpeechError("");
    setIsReviewMode(Boolean(normalizedTranscript));
    setReadyToSend(Boolean(normalizedTranscript));
  };

  const handleFinalTranscript = (finalText) => {
    const normalizedFinalText = finalText.trim().toLowerCase();
    if (!normalizedFinalText) return;

    socket.emit('send_message', {
      text: normalizedFinalText,
      id: Date.now(),
      sender: 'blind'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF7F0',
      color: '#3A5A40',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 32px' }}>
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
            marginBottom: '24px',
            padding: 0,
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#588157'}
          onMouseLeave={(e) => e.target.style.color = '#3A5A40'}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '2.25rem', margin: 0, fontWeight: 800, color: '#3A5A40', fontStyle: 'italic', textTransform: 'uppercase' }}>WESAL</h1>
          
          {/* Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: isConnected ? 'none' : 'pulse 2s infinite'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
                {isConnected ? (
                  <Wifi size={20} color="#588157" />
                ) : (
                  <Wifi size={20} color="#dc2626" />
                )}
              </div>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '0 0 4px 0', color: '#588157' }}>Status</p>
              <p style={{
                fontWeight: 'bold',
                margin: 0,
                color: isConnected ? '#588157' : '#dc2626'
              }}>
                {isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '32px' }}>
        {/* Incoming Message */}
        {incomingText && (
          <div style={{
            background: '#FAF7F0',
            border: '1px solid rgba(27, 67, 50, 0.1)',
            padding: '32px',
            borderRadius: '2.5rem',
            boxShadow: '0 10px 15px -3px rgba(27, 67, 50, 0.1)',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3A5A40, #1B4332)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MessageSquare size={22} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '0 0 8px 0', color: '#588157' }}>Incoming Message</p>
                <p style={{ fontSize: '1.875rem', lineHeight: 1.5, margin: 0, color: '#3A5A40' }}>{incomingText}</p>
              </div>
            </div>
          </div>
        )}

        {/* Push to Speak Button */}
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '48px',
          paddingBottom: '48px'
        }}>
          <button
            onClick={() => {
              setSpeechError("");
              setReadyToSend(false);
              setIsReviewMode(false);
              setIsListening((previous) => !previous);
            }}
            style={{
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: isListening ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #3A5A40, #1B4332)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '48px',
              boxShadow: isListening 
                ? '0 0 60px rgba(220, 38, 38, 0.4)' 
                : '0 20px 60px rgba(27, 67, 50, 0.25)',
              transition: 'all 0.3s',
              position: 'relative',
              transform: isListening ? 'scale(0.95)' : 'scale(1)',
              animation: isListening ? 'pulse 1.5s infinite' : 'none',
              color: 'white',
              fontWeight: 700
            }}
            aria-label="Toggle recording"
          >
            <Mic size={72} color="white" strokeWidth={1.8} />
            {!isListening && (
              <div style={{
                position: 'absolute',
                inset: '0',
                borderRadius: '50%',
                border: '4px solid rgba(64, 145, 108, 0.4)',
                animation: 'pulse-ring 3s infinite',
                pointerEvents: 'none'
              }} />
            )}
          </button>

          <p style={{
            fontSize: '1.25rem',
            marginTop: '24px',
            textAlign: 'center',
            opacity: isListening ? 0.9 : 0.85,
            fontWeight: 600,
            color: '#3A5A40'
          }}>
            {isListening ? 'Recording...' : 'Tap to Start / Tap again to Stop'}
          </p>

          <SpeechToText
            key={speechToTextResetKey}
            controlled
            hideUI
            isActive={isListening}
            onTranscriptChange={handleTranscriptChange}
            onFinalTranscript={handleFinalTranscript}
            onListeningChange={(listening) => {
              setIsListening(listening);
              if (!listening && transcriptRef.current.trim()) {
                setReadyToSend(true);
                setIsReviewMode(true);
                requestTtsFeedback(transcriptRef.current.trim());
              }
            }}
            onErrorMessage={(message) => {
              setSpeechError(message);
              setIsListening(false);
            }}
          />

          {speechError && (
            <p style={{
              marginTop: '14px',
              padding: '10px 16px',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#7f1d1d',
              fontWeight: 600,
              border: '1px solid rgba(220, 38, 38, 0.2)'
            }}>
              {speechError}
            </p>
          )}
        </div>

        {/* Replay Partner's Voice Button */}
        {lastPartnerMessage && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => {
                if (lastPartnerMessage) {
                  requestTtsFeedback(lastPartnerMessage);
                }
              }}
              style={{
                padding: '16px 32px',
                borderRadius: '2.5rem',
                border: 'none',
                background: '#3A5A40',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: '0 10px 15px -3px rgba(27, 67, 50, 0.1)'
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.background = '#2D4A30'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.background = '#3A5A40'; }}
              aria-label="Replay partner's message"
            >
              <Volume2 size={24} /> REPLAY PARTNER'S VOICE
            </button>
          </div>
        )}

        {/* Real-time Transcript */}
        <div style={{
          background: '#FAF7F0',
          border: '1px solid rgba(58, 90, 64, 0.1)',
          padding: '24px',
          borderRadius: '2.5rem',
          boxShadow: '0 10px 15px -3px rgba(27, 67, 50, 0.1)',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out 0.2s both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#588157',
              animation: 'pulse 2s infinite'
            }} />
            <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: 0, color: '#588157' }}>
              {isReviewMode ? '🔊 Review Mode - Listen & Verify' : 'Real-time Transcript'}
            </p>
          </div>
          <p style={{ fontSize: '1.5rem', lineHeight: 1.5, margin: 0, color: '#3A5A40' }}>
            {(composedMessage ? composedMessage + ' ' : '') + transcript || 'Your speech will appear here...'}
          </p>
        </div>

        {/* Decision Matrix - Three Buttons */}
        {readyToSend && (
          <div style={{
            background: '#FAF7F0',
            border: '2px solid rgba(216, 243, 220, 0.6)',
            padding: '32px',
            borderRadius: '2.5rem',
            boxShadow: '0 10px 15px -3px rgba(27, 67, 50, 0.1)',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <p style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#588157',
              margin: '0 0 20px 0',
              textTransform: 'uppercase',
              textAlign: 'center'
            }}>
              Decision Matrix — Choose an Action
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {/* ✅ SEND */}
              <button
                onClick={() => {
                  const textToSend = (composedMessage + ' ' + transcriptRef.current).trim();
                  if (!textToSend) return;
                  socket.emit('send_message', {
                    text: textToSend.toLowerCase(),
                    id: Date.now(),
                    sender: 'blind'
                  });
                  // Clear the Review Mode transcribed text immediately after emitting.
                  // Also bump SpeechToText key to reset its internal transcript state (prevents mixing).
                  transcriptRef.current = '';
                  setTranscript('');
                  setSpeechToTextResetKey((prev) => prev + 1);
                  requestTtsFeedback('Message sent');
                  setReadyToSend(false);
                  setIsReviewMode(false);
                  setComposedMessage("");
                }}
                style={{
                  padding: '28px 24px',
                  borderRadius: '2rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #588157, #3A5A40)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 16px rgba(58, 90, 64, 0.3)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                aria-label="Send message to partner"
              >
                <CheckCircle size={32} /> SEND
              </button>

              {/* ➕ APPEND (Record More) */}
              <button
                onClick={() => {
                  // Append current to composed, then re-enable mic
                  const currentText = transcriptRef.current.trim();
                  if (currentText) {
                    setComposedMessage(prev => prev ? prev + ' ' + currentText : currentText);
                  }
                  // Re-enable microphone for new input
                  setReadyToSend(false);
                  setIsReviewMode(false);
                  setTranscript('');
                  transcriptRef.current = '';
                  setIsListening(true);
                }}
                style={{
                  padding: '28px 24px',
                  borderRadius: '2rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #588157, #3A5A40)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 16px rgba(27, 67, 50, 0.3)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                aria-label="Record more to append"
              >
                <PlusCircle size={32} /> APPEND
              </button>

              {/* 🗑️ RESET */}
              <button
                onClick={() => {
                  // Fully reset state
                  transcriptRef.current = '';
                  setTranscript('');
                  setReadyToSend(false);
                  setIsReviewMode(false);
                  setComposedMessage("");
                  setIncomingText("");
                }}
                style={{
                  padding: '28px 24px',
                  borderRadius: '2rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                aria-label="Reset and start over"
              >
                <Trash2 size={32} /> RESET
              </button>
            </div>
          </div>
        )}

        {/* Accessibility Instructions */}
        <div style={{ textAlign: 'center', opacity: 0.6, marginTop: '16px' }}>
          <p style={{ fontSize: '0.875rem', color: '#2D6A4F' }}>
            Use voice commands: "Read message", "Send message", "Help"
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 60px rgba(0, 102, 204, 0.5);
          }
          50% {
            box-shadow: 0 0 80px rgba(0, 102, 204, 0.7);
          }
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        
        @keyframes pulse-text {
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
};

export default BlindUser;