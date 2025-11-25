import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginLink, setLoginLink] = useState("");

  const handleRequestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/auth/request-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setLoginLink(data.loginLink);
    } catch (error) {
      alert("Failed to request login. Please try again.");
    }
    setLoading(false);
  };

  if (loginLink) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-black via-background to-black flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="glass rounded-3xl p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                Check Your Email
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <p className="text-center text-white/80 text-sm leading-relaxed">
                A login link has been sent to <strong>{email}</strong>. Click the link in your email to log in.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <a href={loginLink} className="block">
                <Button
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold text-lg rounded-xl transition-all duration-300"
                  data-testid="button-open-login-link"
                >
                  Open Login Link
                </Button>
              </a>
              <Button
                variant="outline"
                onClick={() => { setLoginLink(""); setEmail(""); }}
                className="w-full mt-4 text-white border-white/20 hover:bg-white/10 rounded-xl"
              >
                Back
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-background to-black flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 md:p-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
              FitSync Pro
            </h1>
            <p className="text-white/60 text-lg">
              Advanced Health Metrics Dashboard
            </p>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <p className="text-center text-white/80 text-sm leading-relaxed">
              Transform your fitness data into actionable insights. Connect your Google Fit data and unlock advanced analytics powered by AI.
            </p>
          </motion.div>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <a href="/auth/google">
              <Button
                className="w-full h-12 bg-white hover:bg-white/90 text-black font-semibold text-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                data-testid="button-login-google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Login with Google
              </Button>
            </a>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-8 border-t border-white/10"
          >
            <div className="space-y-3">
              {[
                { icon: "📊", text: "9 Advanced Charts" },
                { icon: "🤖", text: "AI-Powered Insights" },
                { icon: "📱", text: "iPad-Native Design" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
