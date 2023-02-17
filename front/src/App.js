import React, {useState, useEffect} from 'react';
import { Spinner } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Common/Navbar';
import SearchResults from './components/Pages/SearchResults';
import HomePage from './components/Pages/HomePage';
import SignUpPage from './components/Pages/SignUpPage';
import CoursePage from './components/Pages/CoursePage';
import EditCoursePage from './components/Pages/EditCoursePage';
import EditCourseClassPage from './components/Pages/EditCourseClassPage';
import EditTermPage from './components/Pages/EditTermPage';
import EditProgramPage from './components/Pages/EditProgramPage';
import EditBuildingPage from './components/Pages/EditBuildingPage';
import ResetPasswordPage from './components/Pages/ResetPasswordPage';
import NoMatch from './components/Common/NoMatch';
import AuthService from './services/AuthService';
import './resources/style.scss';

function App() {
    return (
        <Router>
            <Navbar/>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/register" element={<SignUpPage />} />
                <Route path="/login" element={<SignUpPage login />} />
                <Route path="/results" element={<SearchResults />} />
                <Route path="/courses/:id" element={<CoursePage />} />
                <Route path="/classes/:id" element={<EditCourseClassPage />} />
                <Route path="/classes/new" element={<EditCourseClassPage />} />
                <Route path="/terms/:id" element={<EditTermPage />} />
                <Route path="/terms/new" element={<EditTermPage />} />
                <Route path="/programs/:id" element={<EditProgramPage />} />
                <Route path="/programs/new" element={<EditProgramPage />} />
                <Route path="/courses/new" element={<EditCoursePage />} />
                <Route path="/courses/:id/edit" element={<EditCoursePage />} />
                <Route path="/buildings/:id" element={<EditBuildingPage />} />
                <Route path="/buildings/new" element={<EditBuildingPage />} />
                <Route path="/reset/:token" element={<ResetPasswordPage />} />
                <Route path="*" element={<NoMatch />} />
            </Routes>
        </Router>
    );
}

export default App;
