"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OTPInput from "@/app/components/OTPInput";
import { HiMail, HiArrowLeft } from "react-icons/hi";
import apiClient from "@/lib/api/client";

type Step = "email" | "otp";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiClient.post("/api/auth/send-otp", { email });
      setStep("otp");
      setResendCountdown(60); // 60 second cooldown
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setError("");
    setLoading(true);

    try {
      await apiClient.post("/api/auth/verify-otp", { email, code: otp });

      // Redirect to original page or home
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendCountdown === 0) {
      handleSendOTP();
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 from-gray-900 bg-gray">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">ZStatus</h1>
          <p className="text-gray-400">Service Monitoring Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {step === "email" ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
                  <HiMail className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-400">
                  Enter your email to receive a login code
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Sending..." : "Send Login Code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={handleBackToEmail}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
              >
                <HiArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Enter Code
                </h2>
                <p className="text-gray-400">
                  We sent a 6-digit code to
                  <br />
                  <span className="text-purple-400 font-medium">{email}</span>
                </p>
              </div>

              <div className="mb-6">
                <OTPInput onComplete={handleVerifyOTP} disabled={loading} />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={resendCountdown > 0 || loading}
                  className="text-sm text-gray-400 hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendCountdown > 0
                    ? `Resend code in ${resendCountdown}s`
                    : "Resend code"}
                </button>
              </div>

              {loading && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-400">Verifying...</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Secure passwordless authentication
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
