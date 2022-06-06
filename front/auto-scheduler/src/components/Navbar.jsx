import React, { Component } from 'react';
import {Navbar as BootstrapNavbar, Nav} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import Button from './Button'
import logo from '../resources/logo.svg';

class Navbar extends Component {
  render(){
    return (
      <BootstrapNavbar bg="primary" sticky="top" className="d-flex no-lineheight">
        <BootstrapNavbar.Brand as={ Link } to="/">
            <div className="text-secondary">AutoScheduler</div>
        </BootstrapNavbar.Brand>
        <Nav className="text-danger mr-auto flex-grow-1 d-flex my-3">
            Hola Mundo
        </Nav>
      </BootstrapNavbar>
    );
  }
}

export default Navbar;
