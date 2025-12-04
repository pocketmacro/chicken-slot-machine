"use client";

import { useState } from "react";
import { signIn, signUp, confirmSignUp } from "aws-amplify/auth";
import Image from "next/image";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "confirm">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn({ username: email, password });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      setMode("confirm");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await confirmSignUp({ username: email, confirmationCode });
      await signIn({ username: email, password });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to confirm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
        >
          ×
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/pocket-macro-logo.png"
              alt="Pocket Macro"
              width={60}
              height={60}
              className="mb-3"
            />
            <h2 className="text-3xl font-bold text-gray-900">
              {mode === "confirm" ? "Confirm Email" : mode === "signup" ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-600 mt-2">
              {mode === "confirm"
                ? "Check your email for the code"
                : mode === "signup"
                ? "Sign up to start winning prizes"
                : "Sign in to start spinning"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {mode === "confirm" ? (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmation Code
                </label>
                <input
                  type="text"
                  required
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter code from email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? "Confirming..." : "Confirm"}
              </button>
            </form>
          ) : mode === "signup" ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Min. 8 characters"
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must include uppercase, lowercase, number, and symbol
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Don't have an account? Sign Up
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
