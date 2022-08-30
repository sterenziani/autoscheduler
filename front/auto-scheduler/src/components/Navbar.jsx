import React from 'react';
import { Navbar as BootstrapNavbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import LinkButton from './LinkButton';
import logo from '../resources/logo.svg';

function Navbar(props){
    const user = props.user

    return (
        <BootstrapNavbar bg="primary" sticky="top" className="d-flex no-lineheight">
            <div className="ms-5 my-2 col">
                <BootstrapNavbar.Brand as={Link} to="/">
                    <b className="text-light">Auto</b>
                    <b className="text-secondary">Scheduler</b>
                </BootstrapNavbar.Brand>
            </div>
            {
                user && (<div className="me-3 my-2 col text-end">
                            <LinkButton variant="secondary" textKey="logout" href="/register"/>
                        </div>)
            }
        </BootstrapNavbar>
    );
}

export default Navbar;
