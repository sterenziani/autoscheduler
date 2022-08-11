import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchResults from './components/SearchResults'
import HomePage from './pages/HomePage'
import SignUpPage from './pages/SignUpPage'
import NoMatch from './components/NoMatch'
import './resources/style.scss';

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/register" element={<SignUpPage/>}/>
        <Route path="/login" element={<SignUpPage login/>}/>
        <Route path="/results" element={<SearchResults/>}/>
        <Route path="*" element={<NoMatch/>} />
      </Routes>
    </Router>
  );
}

export default App;
