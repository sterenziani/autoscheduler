import React, { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Spinner } from 'react-bootstrap';
import HomePageUniversity from '../components/HomePageUniversity';
import HomePageStudent from '../components/HomePageStudent';
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';

function HomePage(props)  {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect( () => {
        ApiService.getActiveUser().then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else
                setUser(data)
            setLoading(false)
        });
    }, [])

    if (loading === true)
        return (
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    if (error)
        return <h1>ERROR {error}</h1>;
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>AutoScheduler</title></Helmet>
            </HelmetProvider>
            {user && user.type === 'student' && <HomePageStudent />}
            {user && user.type === 'university' && (<HomePageUniversity user={user} />)}
        </React.Fragment>
    );
}

export default HomePage;
