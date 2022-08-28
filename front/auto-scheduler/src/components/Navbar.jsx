import React, { Component } from 'react';
import { Navbar as BootstrapNavbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../resources/logo.svg';

class Navbar extends Component {
    render() {
        return (
            <BootstrapNavbar bg="primary" sticky="top" className="d-flex no-lineheight">
                <BootstrapNavbar.Brand as={Link} to="/">
                    <div className="ms-5 my-2">
                        <b className="text-light">Auto</b>
                        <b className="text-secondary">Scheduler</b>
                    </div>
                </BootstrapNavbar.Brand>
            </BootstrapNavbar>
        );
    }
}

export default Navbar;
