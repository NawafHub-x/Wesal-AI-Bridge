import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Radio, Eye, Phone } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";

export function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();

  const handleUserTypeSelection = (type: "blind" | "deaf") => {
    if (phoneNumber.length >= 10) {
      navigate(`/${type}`);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc] via-[#0066cc] to-[#00b8a9]" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight mb-4">
            Bridge
          </h1>
          <p className="text-xl md:text-2xl text-white/90">
            Connecting Through Understanding
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl p-8 rounded-[32px]">
            {/* Phone Input */}
            <div className="mb-8">
              <label
                htmlFor="phone"
                className="block text-white mb-3 opacity-90"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-6 text-lg bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white/50 rounded-3xl"
                />
              </div>
            </div>

            {/* User Type Selection */}
            <div className="space-y-4">
              <p className="text-white text-center mb-4 opacity-90">
                I am...
              </p>

              {/* Blind User Card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUserTypeSelection("blind")}
                disabled={phoneNumber.length < 10}
                className="w-full group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Card className="backdrop-blur-lg bg-white/95 hover:bg-white border-2 border-transparent hover:border-[#0066cc] shadow-lg p-6 rounded-3xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0066cc] to-[#0066cc]/80 flex items-center justify-center flex-shrink-0">
                      <Radio className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-2xl mb-1 text-gray-900 group-hover:text-[#0066cc] transition-colors">
                        Blind
                      </h3>
                      <p className="text-gray-600">
                        Audio & Tactile Experience
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.button>

              {/* Deaf User Card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUserTypeSelection("deaf")}
                disabled={phoneNumber.length < 10}
                className="w-full group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Card className="backdrop-blur-lg bg-white/95 hover:bg-white border-2 border-transparent hover:border-[#00b8a9] shadow-lg p-6 rounded-3xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00b8a9] to-[#00b8a9]/80 flex items-center justify-center flex-shrink-0">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-2xl mb-1 text-gray-900 group-hover:text-[#00b8a9] transition-colors">
                        Deaf
                      </h3>
                      <p className="text-gray-600">
                        Visual & Gesture Experience
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.button>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-white/80 text-sm max-w-md">
            Accessibility first. Screen readers and high contrast modes fully supported.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
