import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Send, Check, CheckCheck, ArrowLeft, Hand } from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

interface Message {
  id: number;
  text: string;
  sent: boolean;
  delivered: boolean;
  timestamp: Date;
}

export function DeafDashboard() {
  const [detectedSign, setDetectedSign] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! How can I help you today?",
      sent: false,
      delivered: true,
      timestamp: new Date(Date.now() - 60000),
    },
  ]);
  const [incomingMessage, setIncomingMessage] = useState("");
  const navigate = useNavigate();

  // Simulate sign detection
  useEffect(() => {
    const signs = ["Hello", "Thank you", "Help", "Yes", "No"];
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsDetecting(true);
        const randomSign = signs[Math.floor(Math.random() * signs.length)];
        setTimeout(() => {
          setDetectedSign(randomSign);
          setIsDetecting(false);
        }, 500);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Mock incoming message with avatar
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIncomingMessage("I can guide you to the library. It's just 2 blocks north.");
    }, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const handleConfirmAndSend = () => {
    if (detectedSign) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: detectedSign,
        sent: true,
        delivered: false,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      
      // Simulate delivery
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, delivered: true } : msg
          )
        );
      }, 1000);
      
      setDetectedSign("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            aria-label="Go back to login"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Back</span>
          </button>
          <h1 className="text-4xl text-gray-900">Visual Mode</h1>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Camera and Detection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Viewport */}
            <Card className="overflow-hidden rounded-[32px] border-2 border-[#00b8a9]/30 shadow-xl">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video">
                {/* Mock Camera Feed */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-24 h-24 text-white/20" />
                </div>

                {/* AI Bounding Box Overlay */}
                {isDetecting && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 m-12"
                  >
                    <div className="w-full h-full border-4 border-[#00b8a9] rounded-3xl relative">
                      {/* Corner markers */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00b8a9] rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00b8a9] rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00b8a9] rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00b8a9] rounded-bl-lg" />
                      
                      {/* Hand icon in center */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Hand className="w-16 h-16 text-[#00b8a9]" />
                        </motion.div>
                      </div>

                      {/* Detection label */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00b8a9] text-white px-4 py-1 rounded-full text-sm">
                        Detecting...
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Camera active indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-sm">Live</span>
                </div>
              </div>
            </Card>

            {/* Prediction/Draft Box */}
            <Card className="bg-gradient-to-br from-[#00b8a9]/10 to-[#00b8a9]/5 border-2 border-[#00b8a9]/30 p-6 rounded-[32px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00b8a9] to-[#00b8a9]/80 flex items-center justify-center">
                    <Hand className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Detected Sign</p>
                    <p className="text-2xl text-gray-900">
                      {detectedSign || "Waiting for sign..."}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmAndSend}
                  disabled={!detectedSign}
                  className="bg-gradient-to-r from-[#0066cc] to-[#00b8a9] hover:from-[#0066cc]/90 hover:to-[#00b8a9]/90 text-white px-6 py-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send
                </Button>
              </div>

              {detectedSign && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-4 border-t border-gray-200"
                >
                  <p className="text-sm text-gray-600">
                    Confidence: <span className="text-[#00b8a9]">94%</span>
                  </p>
                </motion.div>
              )}
            </Card>

            {/* Incoming Message with Avatar */}
            <AnimatePresence>
              {incomingMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <Card className="bg-white border-2 border-gray-200 p-6 rounded-[32px] shadow-lg">
                    <div className="flex items-start gap-4">
                      {/* 3D Avatar Placeholder */}
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0066cc] to-[#00b8a9] flex items-center justify-center flex-shrink-0">
                        <motion.div
                          animate={{
                            scale: [1, 1.05, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        >
                          <Hand className="w-10 h-10 text-white" />
                        </motion.div>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          Incoming Message
                        </p>
                        <p className="text-2xl text-gray-900 leading-relaxed">
                          {incomingMessage}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Message History */}
          <div className="lg:col-span-1">
            <Card className="bg-white border-2 border-gray-200 rounded-[32px] shadow-lg p-6 h-full">
              <h2 className="text-2xl text-gray-900 mb-6">Message History</h2>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: message.sent ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-2xl ${
                      message.sent
                        ? "bg-gradient-to-r from-[#0066cc] to-[#00b8a9] text-white ml-4"
                        : "bg-gray-100 text-gray-900 mr-4"
                    }`}
                  >
                    <p className="mb-2">{message.text}</p>
                    <div className="flex items-center justify-between text-xs opacity-70">
                      <span>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.sent && (
                        <span>
                          {message.delivered ? (
                            <CheckCheck className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {messages.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                  <p>No messages yet</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
