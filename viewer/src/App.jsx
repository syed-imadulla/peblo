import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ShowDetails from './pages/ShowDetails';
import Search from './pages/Search';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="show/:slug" element={<ShowDetails />} />
        <Route path="search" element={<Search />} />
      </Route>
    </Routes>
  );
}

export default App;
