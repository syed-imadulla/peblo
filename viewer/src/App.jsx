import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ShowDetails from './pages/ShowDetails';
import EpisodePlayer from './pages/EpisodePlayer';
import Search from './pages/Search';
import Profile from './pages/Profile';

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="show/:slug" element={<ShowDetails />} />
          <Route path="episode/:contentGroup" element={<EpisodePlayer />} />
          <Route path="search" element={<Search />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </LanguageProvider>
  );
}

export default App;
