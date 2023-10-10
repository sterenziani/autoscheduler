import React, { useState, useEffect} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { Col, Navbar as BootstrapNavbar } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import AuthService from '../../services/AuthService';
import { Link } from 'react-router-dom';
import LinkButton from './LinkButton';
import { ReactComponent as Logo } from '../../resources/logoBauhaus93.svg';

function Navbar(props){
    const [user, setUser] = useState(AuthService.getUserStore())
    const navigate = useNavigate()
    const location = useLocation()

    const logOut = () => {
        ApiService.logout()
        navigate("/login")
    }

    useEffect(() => {
        AuthService.logOutIfExpiredJwt().then((expired) => {
            if(expired)
                navigate("/login")
        })
        setUser(AuthService.getUserStore())
    }, [location, navigate]);


    return (
        <BootstrapNavbar bg="primary" sticky="top" className="d-flex no-lineheight flex-wrap border-bottom border-secondary border-3">
            <Col className="ms-5 my-2 justify-content-start">
                <BootstrapNavbar.Brand as={Link} to="/">
                    <Logo className="navbar-logo"/>
                </BootstrapNavbar.Brand>
            </Col>
            {
                user && (<Col className="me-3 my-2 d-flex justify-content-end">
                            <div className="d-flex text-end flex-wrap">
                                <Col className="mx-auto justify-content-end align-items-center">
                                    <p className="my-auto me-2 text-end fw-bold">{user.name}</p>
                                    <p className="my-auto me-2 text-end fst-italic">{user.email}</p>
                                </Col>
                            </div>
                            <div className="d-flex text-end flex-wrap">
                                <Col className="mx-auto d-flex justify-content-end">
                                    <LinkButton variant="secondary" textKey="logout" onClick={logOut}/>
                                </Col>
                            </div>
                        </Col>)
            }
        </BootstrapNavbar>
    );
}

export default Navbar;
