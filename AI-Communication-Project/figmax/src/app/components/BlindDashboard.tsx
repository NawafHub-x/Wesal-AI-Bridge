import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Wifi, WifiOff, Volume2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "@/app/components/ui/card";

export function BlindDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");
  const navigate = useNavigate();

  // Simulate connectivity check
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.1); // 90% uptime simulation
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mock incoming message
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIncomingMessage("Hello! How can I help you today?");
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const handlePushToSpeak = () => {
    setIsSpeaking(true);
    setTranscript("Listening...");
    
    // Simulate speech recognition
    setTimeout(() => {
      setTranscript("Yes, I need help with directions to the library.");
      setTimeout(() => {
        setIsSpeaking(false);
      }, 500);
    }, 2000);
  };

  const handleRelease = () => {
    if (isSpeaking) {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          aria-label="Go back to login"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-lg">Back</span>
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-4xl">Audio Mode</h1>
          
          {/* Connectivity Status */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{
                scale: isOnline ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: isOnline ? Infinity : 0,
              }}
            >
              {isOnline ? (
                <Wifi className="w-8 h-8 text-green-400" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-400" />
              )}
            </motion.div>
            <div>
              <p className="text-sm opacity-80">Status</p>
              <p className={`font-bold ${isOnline ? "text-green-400" : "text-red-400"}`}>
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto grid gap-8">
        {/* Incoming Message */}
        <AnimatePresence>
          {incomingMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-8 rounded-[32px]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00b8a9] to-[#00b8a9]/80 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm opacity-80 mb-2">Incoming Message</p>
                    <p className="text-3xl leading-relaxed">{incomingMessage}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Push to Speak Button */}
        <div className="flex flex-col items-center justify-center py-12">
          <motion.button
            onMouseDown={handlePushToSpeak}
            onMouseUp={handleRelease}
            onTouchStart={handlePushToSpeak}
            onTouchEnd={handleRelease}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: isSpeaking
                ? [
                    "0 0 0 0 rgba(0, 102, 204, 0.7)",
                    "0 0 0 40px rgba(0, 102, 204, 0)",
                    "0 0 0 0 rgba(0, 102, 204, 0)",
                  ]
                : "0 0 60px rgba(0, 102, 204, 0.5)",
            }}
            transition={{
              duration: 1.5,
              repeat: isSpeaking ? Infinity : 0,
            }}
            className="w-80 h-80 rounded-full bg-gradient-to-br from-[#0066cc] to-[#0066cc]/80 flex items-center justify-center shadow-2xl relative group"
            aria-label="Push to speak"
          >
            <motion.div
              animate={{
                scale: isSpeaking ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: isSpeaking ? Infinity : 0,
              }}
            >
              <Mic className="w-32 h-32 text-white" />
            </motion.div>

            {/* Ripple effect when not speaking */}
            {!isSpeaking && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-white/30"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />
            )}
          </motion.button>

          <motion.p
            className="text-2xl mt-8 text-center"
            animate={{
              opacity: isSpeaking ? [1, 0.5, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: isSpeaking ? Infinity : 0,
            }}
          >
            {isSpeaking ? "Listening..." : "Hold to Speak"}
          </motion.p>
        </div>

        {/* Real-time Transcript */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-[#0066cc]/20 to-[#00b8a9]/20 backdrop-blur-lg border-[#0066cc]/30 p-6 rounded-[32px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#0066cc] animate-pulse" />
              <p className="text-sm opacity-80">Real-time Transcript</p>
            </div>
            <p className="text-2xl min-h-[80px] leading-relaxed">
              {transcript || "Your speech will appear here..."}
            </p>
          </Card>
        </motion.div>

        {/* Accessibility Instructions */}
        <div className="text-center opacity-60 mt-4">
          <p className="text-sm">
            Use voice commands: "Read message", "Send message", "Help"
          </p>
        </div>
      </div>
    </div>
  );
}
