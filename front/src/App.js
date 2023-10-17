import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import {Outlet} from "react-router-dom";
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
import ResetPasswordPage from './components/Accounts/ResetPasswordPage';
import ErrorMessage from './components/Common/ErrorMessage';
import { NOT_FOUND } from './services/ApiConstants';
import './resources/style.scss';

function App() {
    const NavbarWrapper = () => {
        return (
            <div>
                <Navbar/>
                <Outlet/>
            </div>
        )
    }

    const router = createBrowserRouter([
        {
            path: "/",
            element: <NavbarWrapper/>,
            children: createRoutesFromElements(
                <React.Fragment>
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
                    <Route path="*" element={<ErrorMessage status={NOT_FOUND} />} />
                </React.Fragment>
            )
        }
    ])

    return <RouterProvider router={router}/>
}

export default App;
