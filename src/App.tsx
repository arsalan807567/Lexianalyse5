/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { UploadView } from './views/Upload';
import { AnalysisResultView } from './views/AnalysisResult';
import { PricingView } from './views/Pricing';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthView } from './views/Auth';
import { AuthActionView } from './views/AuthAction';
import { useEffect } from 'react';

import { SupportView } from './views/Support';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  // Enforce professional verification policy
  if (!user.emailVerified) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthView />} />
          <Route path="/auth/action" element={<AuthActionView />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/documents" element={<ProtectedRoute><UploadView /></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><AnalysisResultView /></ProtectedRoute>} />
            <Route path="/pricing" element={<PricingView />} />
            <Route path="/limits" element={<PricingView />} />
            <Route path="/support" element={<SupportView />} />
            <Route path="/settings" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
