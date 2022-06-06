import React, { Component, Suspense } from 'react';
import {useParams, BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import Navbar from './components/Navbar';
import './resources/style.scss';

function App() {
  return (
    <>
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" exact/>
      </Routes>
    </Router>
    </>
  );
}

export default App;
