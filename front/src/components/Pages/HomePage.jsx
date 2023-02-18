import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Spinner } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import HomePageUniversity from '../Common/HomePageUniversity';
import HomePageStudent from '../Common/HomePageStudent';
import ApiService from '../../services/ApiService';
import Roles from '../../resources/RoleConstants';

function HomePage(props)  {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true);
    const user = ApiService.getActiveUser()

    useEffect( () => {
        if(!user)
            navigate("/login")
        setLoading(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading === true)
        return (
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        )
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>AutoScheduler</title></Helmet>
            </HelmetProvider>
            {user && user.type === Roles.STUDENT && <HomePageStudent/>}
            {user && user.type === Roles.UNIVERSITY && (<HomePageUniversity user={user}/>)}
        </React.Fragment>
    );
}

export default HomePage;