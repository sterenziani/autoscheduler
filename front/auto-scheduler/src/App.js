import React, { Component, Suspense } from 'react';
import {useParams, BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import Navbar from './components/Navbar';
import SearchForm from './components/SearchForm'
import SearchResults from './components/SearchResults'
import NoMatch from './components/NoMatch'
import './resources/style.scss';

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<SearchForm/>}/>
        <Route path="/results" element={<SearchResults/>}/>
        <Route path="*" element={<NoMatch/>} />
      </Routes>
    </Router>
  );
}

export default App;
