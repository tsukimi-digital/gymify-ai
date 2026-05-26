import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

const LandingPage    = lazy(() => import('./views/LandingPage'));
const OnboardingPage = lazy(() => import('./views/OnboardingPage'));
const GeneratingPage = lazy(() => import('./views/GeneratingPage'));
const DashboardPage  = lazy(() => import('./views/DashboardPage'));
const WorkoutPage    = lazy(() => import('./views/WorkoutPage'));
const PlanPage       = lazy(() => import('./views/PlanPage'));
const HistoryPage    = lazy(() => import('./views/HistoryPage'));
const ProfilePage    = lazy(() => import('./views/ProfilePage'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { userId, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-dvh bg-zinc-950" />;
  if (!userId) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/generating" element={<GeneratingPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/workout/:sessionId" element={<PrivateRoute><WorkoutPage /></PrivateRoute>} />
        <Route path="/plan" element={<PrivateRoute><PlanPage /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
