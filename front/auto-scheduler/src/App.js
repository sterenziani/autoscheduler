import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchResults from './components/SearchResults'
import MainPageUser from './pages/MainPageUser'
import NoMatch from './components/NoMatch'
import './resources/style.scss';

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<MainPageUser/>}/>
        <Route path="/results" element={<SearchResults/>}/>
        <Route path="*" element={<NoMatch/>} />
      </Routes>
    </Router>
  );
}

export default App;
