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

          {/* Email Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleRequestLogin}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="Enter your email (Gmail or any email)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-primary"
              data-testid="input-email"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold text-lg rounded-xl transition-all duration-300"
              data-testid="button-request-login"
            >
              {loading ? "Sending..." : "Send Login Link"}
            </Button>
          </motion.form>

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
