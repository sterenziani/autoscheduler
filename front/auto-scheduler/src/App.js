import React, { Component, Suspense } from 'react';
import {useParams, BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import Navbar from './components/Navbar';
import SearchForm from './components/SearchForm'
import './resources/style.scss';

function App() {
  return (
    <Router>
      <Navbar/>
      <SearchForm/>
      <Routes>
        <Route path="/" exact/>
      </Routes>
    </Router>
  );
}

export default App;
