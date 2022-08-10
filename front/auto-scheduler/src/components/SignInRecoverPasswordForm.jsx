import React, { Component } from 'react';
import {Button, Form, Modal} from 'react-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../services/ApiService';
import { OK, CREATED, NOT_FOUND, TIMEOUT, CONFLICT, UNAUTHORIZED } from '../services/ApiConstants';

import FormInputField from './FormInputField';
import { Formik } from 'formik';
import * as Yup from 'yup';

const SignInSchema = Yup.object().shape({
  email: Yup
    .string()
    .max(100, 'register.errors.email.maxLength')
    .email('register.errors.email.invalidEmail')
    .required('register.errors.email.isRequired')
})

class SignInRecoverPasswordForm extends Component {
  state = {
    showPasswordModal: false,
    finished: false,
    bad_connection : false,
    email_not_found: false,
  }

  onSubmit = (values, { setSubmitting }) => {
    console.log("Sending email")
    ApiService.requestPasswordChangeToken(this.state.email).then((data) => {
      if(data && data.status === CREATED)
        this.setState({email_not_found: false, bad_connection : false, finished: true});
      else{
        setSubmitting(false);
        if(data && data.status === NOT_FOUND)
          this.setState({email_not_found: true, bad_connection : false});
        else
          this.setState({email_not_found: false, bad_connection : true});
      }
    });
  }

  switchPasswordModal(){
    this.setState({ showPasswordModal: !this.state.showPasswordModal});
  }

  render(){
    return(
      <React.Fragment>
        <Button variant="link" className="text-white" onClick={() => {this.switchPasswordModal()}}><Translation>{t => t("login.forgotPassword")}</Translation></Button>
        <Modal show={this.state.showPasswordModal} onHide={() => this.switchPasswordModal()} className="color-warning text-black">
          <Modal.Header closeButton>
            <Modal.Title><Translation>{t => t("login.forgotPassword")}</Translation></Modal.Title>
          </Modal.Header>
          {
            this.state.finished? [
              <Modal.Body key="answer-body" className="text-black"><p key="password-email-sent" className="px-5 pt-3">
                <Translation>{t => t("login.emailSent")}</Translation></p>
              </Modal.Body>] : [
              <Formik key="password-formik" initialValues = {{ email: ''}} validationSchema={SignInSchema} onSubmit={this.onSubmit}>
              {
                ({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting}) => (
                <Form className="p-3 mx-auto text-center color-white" onSubmit={ handleSubmit }>
                  <Modal.Body className="text-black">
                    <Translation>{t => t("login.recoverPasswordDescription")}</Translation>
                    {
                      this.state.email_not_found && <p className="form-error"><Translation>{t => t("login.emailNotFound")}</Translation></p>
                    }
                    {
                      this.state.bad_connection && <p className="form-error"><Translation>{t => t("login.errors.badConnection")}</Translation></p>
                    }
                    <FormInputField type="email" label="register.email" name="email" placeholder="register.placeholders.email" color="black"
                        value={ values.email } error={ errors.email } touched={ touched.email } onChange={ handleChange } onBlur={ handleBlur }
                    />
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="grey" onClick={() => {this.switchPasswordModal()}}><Translation>{t => t("modal.cancel")}</Translation></Button>
                    <Button variant="secondary" type="submit" disabled={ isSubmitting }><Translation>{t => t("modal.send")}</Translation></Button>
                  </Modal.Footer>
                </Form>
                )
              }
              </Formik>
            ]
          }
        </Modal>
      </React.Fragment>
    )
  }
}

export default SignInRecoverPasswordForm;
