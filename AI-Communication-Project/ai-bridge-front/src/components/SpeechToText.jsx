import React, { useEffect, useRef, useState } from "react";

export default function SpeechToText({
  onTranscriptChange,
  onFinalTranscript,
  onListeningChange,
  onErrorMessage,
  controlled = false,
  isActive = false,
  hideUI = false,
}) {
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);

  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage("");
      if (onListeningChange) {
        onListeningChange(true);
      }
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += text + " ";
        } else {
          interimText += text;
        }
      }

      setInterimTranscript(interimText);

      if (finalText.trim() !== "") {
        setTranscript((previousText) => {
          const updatedText = `${previousText} ${finalText}`.trim();

          if (onTranscriptChange) {
            onTranscriptChange(updatedText);
          }

          return updatedText;
        });

        if (onFinalTranscript) {
          onFinalTranscript(finalText.trim());
        }
      }
    };

    recognition.onerror = (event) => {
      const browserError =
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone access was denied. Please allow microphone permissions to use voice input."
          : `Speech recognition error: ${event.error}`;
      setErrorMessage(browserError);
      setIsListening(false);
      if (onListeningChange) {
        onListeningChange(false);
      }
      if (onErrorMessage) {
        onErrorMessage(browserError);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (onListeningChange) {
        onListeningChange(false);
      }

      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch (error) {
          console.log("Recognition restart error:", error);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      recognition.stop();
    };
  }, [onTranscriptChange, onFinalTranscript, onListeningChange, onErrorMessage]);

  useEffect(() => {
    if (!controlled) return;
    if (isActive) {
      startListening();
    } else {
      stopListening();
    }
  }, [controlled, isActive]);

  const startListening = () => {
    if (!recognitionRef.current) return;

    setErrorMessage("");
    shouldListenRef.current = true;

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.log("Recognition start error:", error);
      if (onErrorMessage) {
        onErrorMessage("Could not start microphone. Please try again.");
      }
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    shouldListenRef.current = false;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");

    if (onTranscriptChange) {
      onTranscriptChange("");
    }
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setErrorMessage("Transcript copied successfully.");
    } catch {
      setErrorMessage("Could not copy transcript.");
    }
  };

  if (hideUI) {
    return null;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Speech to Text</h2>

      <p style={styles.description}>
        Speak in English. The system will convert your voice into text.
      </p>

      {!isSupported && <p style={styles.error}>{errorMessage}</p>}

      <div style={styles.statusBox}>
        <span
          style={{
            ...styles.statusDot,
            backgroundColor: isListening ? "#22c55e" : "#ef4444",
          }}
        ></span>

        <span style={styles.statusText}>
          {isListening ? "Listening..." : "Not Listening"}
        </span>
      </div>

      <div style={styles.buttonRow}>
        <button
          onClick={startListening}
          disabled={!isSupported || isListening}
          style={{
            ...styles.button,
            backgroundColor: isListening ? "#9ca3af" : "#2563eb",
          }}
        >
          Start Speaking
        </button>

        <button
          onClick={stopListening}
          disabled={!isSupported || !isListening}
          style={{
            ...styles.button,
            backgroundColor: !isListening ? "#9ca3af" : "#dc2626",
          }}
        >
          Stop
        </button>

        <button onClick={clearTranscript} style={styles.secondaryButton}>
          Clear
        </button>

        <button
          onClick={copyTranscript}
          disabled={!transcript}
          style={styles.secondaryButton}
        >
          Copy Text
        </button>
      </div>

      <div style={styles.outputBox}>
        <h3 style={styles.outputTitle}>Final Text</h3>

        <p style={styles.outputText}>
          {transcript || "Your speech will appear here..."}
        </p>

        {interimTranscript && (
          <>
            <h3 style={styles.outputTitle}>Live Text</h3>
            <p style={styles.interimText}>{interimTranscript}</p>
          </>
        )}
      </div>

      {errorMessage && <p style={styles.message}>{errorMessage}</p>}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "700px",
    margin: "30px auto",
    padding: "24px",
    borderRadius: "18px",
    backgroundColor: "#f8fafc",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "28px",
    marginBottom: "8px",
    color: "#111827",
  },
  description: {
    fontSize: "16px",
    color: "#4b5563",
    marginBottom: "20px",
  },
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  statusDot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
  },
  statusText: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#111827",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "20px",
  },
  button: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    backgroundColor: "white",
    color: "#111827",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  outputBox: {
    minHeight: "180px",
    padding: "18px",
    borderRadius: "14px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
  },
  outputTitle: {
    fontSize: "18px",
    color: "#111827",
    marginBottom: "8px",
  },
  outputText: {
    fontSize: "18px",
    color: "#1f2937",
    lineHeight: "1.7",
  },
  interimText: {
    fontSize: "16px",
    color: "#6b7280",
    fontStyle: "italic",
    lineHeight: "1.6",
  },
  error: {
    color: "#dc2626",
    fontWeight: "bold",
  },
  message: {
    marginTop: "12px",
    color: "#374151",
    fontSize: "14px",
  },
};