import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchResults from './pages/SearchResults';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/SignUpPage';
import CoursePage from './pages/CoursePage';
import EditCourseClassPage from './pages/EditCourseClassPage';
import NoMatch from './components/NoMatch';
import './resources/style.scss';

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<SignUpPage />} />
                <Route path="/login" element={<SignUpPage login />} />
                <Route path="/results" element={<SearchResults />} />
                <Route path="/courses/:id" element={<CoursePage />} />
                <Route path="/classes/:id" element={<EditCourseClassPage />} />
                <Route path="/classes/new" element={<EditCourseClassPage />} />
                <Route path="*" element={<NoMatch />} />
            </Routes>
        </Router>
    );
}

export default App;
