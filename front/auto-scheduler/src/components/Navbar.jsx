import React, {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import { reaction } from "mobx"
import { Row, Navbar as BootstrapNavbar } from 'react-bootstrap';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import ApiService from '../services/ApiService';
import AuthService from '../services/AuthService';
import { Link } from 'react-router-dom';
import LinkButton from './LinkButton';
import logo from '../resources/logo.svg';
import withUser from '../hoc/withUser';

function Navbar(props){
    const user = props.user
    const navigate = useNavigate()
    let redirecting = false

    const logOut = () => {
        ApiService.logout()
        navigate("/login")
    }

    return (
        <BootstrapNavbar bg="primary" sticky="top" className="d-flex no-lineheight">
            <div className="ms-5 my-2 col">
                <BootstrapNavbar.Brand as={Link} to="/">
                    <b className="text-light">Auto</b>
                    <b className="text-secondary">Scheduler</b>
                </BootstrapNavbar.Brand>
            </div>
            {
                user && (<div className="me-3 my-2 col">
                            <div className="d-flex justify-content-end flex-wrap">
                                <p className="my-auto me-2 text-end">{user.email}</p>
                                <LinkButton variant="secondary" textKey="logout" onClick={logOut}/>
                            </div>
                        </div>)
            }
        </BootstrapNavbar>
    );
}

export default withUser(Navbar);
