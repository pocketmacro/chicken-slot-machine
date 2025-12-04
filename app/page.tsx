"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import LandingPage from "@/components/LandingPage";
import AuthModal from "@/components/AuthModal";
import MainApp from "./MainApp";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();

    // Listen for auth events
    const hubListener = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn" || payload.event === "signedOut") {
        checkUser();
      }
    });

    return () => hubListener();
  }, []);

  const handleSignOut = async () => {
    const { signOut } = await import("aws-amplify/auth");
    await signOut();
    setUser(null);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    checkUser();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (user) {
    return (
      <MainApp
        onSignOut={handleSignOut}
        userEmail={user.signInDetails?.loginId}
      />
    );
  }

  return (
    <>
      <LandingPage onGetStarted={() => setShowAuthModal(true)} />
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}
