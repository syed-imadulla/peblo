import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ShowsList from './pages/ShowsList';
import ShowForm from './pages/ShowForm';
import EpisodesList from './pages/EpisodesList';
import EpisodeForm from './pages/EpisodeForm';
import Validation from './pages/Validation';
import Publish from './pages/Publish';
import PublishHistory from './pages/PublishHistory';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="shows" element={<ShowsList />} />
        <Route path="shows/new" element={<ShowForm />} />
        <Route path="shows/:id/edit" element={<ShowForm />} />
        <Route path="episodes" element={<EpisodesList />} />
        <Route path="episodes/new" element={<EpisodeForm />} />
        <Route path="episodes/:id/edit" element={<EpisodeForm />} />
        <Route path="validation" element={<Validation />} />
        <Route path="publish" element={<Publish />} />
        <Route path="publish-history" element={<PublishHistory />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
