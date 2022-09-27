import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchResults from './pages/SearchResults';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/SignUpPage';
import CoursePage from './pages/CoursePage';
import EditCoursePage from './pages/EditCoursePage';
import EditCourseClassPage from './pages/EditCourseClassPage';
import EditTermPage from './pages/EditTermPage';
import EditProgramPage from './pages/EditProgramPage';
import EditBuildingPage from './pages/EditBuildingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NoMatch from './components/NoMatch';
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
