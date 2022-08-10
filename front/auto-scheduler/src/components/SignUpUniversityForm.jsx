import React, { Component } from 'react';
import {Button, Form} from 'react-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT, CONFLICT } from '../services/ApiConstants';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuildingColumns } from '@fortawesome/free-solid-svg-icons';

import FormInputField from './FormInputField';
import { Formik } from 'formik';
import * as Yup from 'yup';

const CONTACT_EMAIL = "juan@autoscheduler.com"

const SignUpSchema = Yup.object().shape({
    email: Yup
        .string()
        .max(100, 'register.errors.email.maxLength')
        .email('register.errors.email.invalidEmail')
        .required('register.errors.email.isRequired'),
    password: Yup
        .string()
        .min(6, 'register.errors.password.requiredLength')
        .max(100, 'register.errors.password.maxLength')
        .required('register.errors.password.isRequired'),
    repeat_password: Yup
        .string()
        .when('password', (password, schema) => {
            return schema.test({
              test: repeat_password => !!password && repeat_password === password,
              message: 'register.errors.repeatPassword.passwordsMismatch'
            })
          })
        .required('register.errors.repeatPassword.isRequired'),
    name: Yup
        .string()
        .min(4, 'register.errors.name.requiredLength')
        .max(100, 'register.errors.name.maxLength')
        .required('register.errors.email.isRequired'),
})

class SignUpUniversityForm extends Component {
  state = {
    bad_connection: false,
    loading: true,
    error: false
  }

  register = async (values, setSubmitting, setFieldError) => {
    const { status, conflicts } = await ApiService.registerUniversity(values.email, values.password, values.name)
    switch(status){
      case CREATED:
        this.authenticate(values)
        break;
      case CONFLICT:
        setSubmitting(false)
        conflicts.forEach(conflict => {
          setFieldError(conflict.field, conflict.i18Key)
        })
        break;
      default:
        setSubmitting(false)
        this.setState({ bad_connection : true })
        break;
    }
  }

  authenticate = async (values) => {
    const { status } = await ApiService.login(values.username, values.password)
    switch(status){
      case OK:
        console.log("Redirect")
        break;
      default:
        console.log("Log in failed")
        this.props.activateRedirect("login")
        break;
    }
  }

  onSubmit = (values, { setSubmitting, setFieldError }) => {
    setSubmitting(true);
    this.register(values, setSubmitting, setFieldError);
  }

  render(){
    return(
      <Formik initialValues = {{ email: '', password: '', repeat_password: '', name: '' }} validationSchema={SignUpSchema} onSubmit = {this.onSubmit}>
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting}) => (
        <Form className="p-3 mx-auto text-center color-white" onSubmit={ handleSubmit }>
          {
            this.state.bad_connection && <p className="form-error"><Translation>{t => t("register.errors.badConnection")}</Translation></p>
          }
          <FontAwesomeIcon size='3x' icon={faBuildingColumns}/>

          <FormInputField type="text" label="register.name" name="name" placeholder="register.placeholders.name"
              value={ values.name } error={ errors.name } touched={ touched.name }
              onChange={ handleChange } onBlur={ handleBlur }
          />

          <FormInputField label="register.email" name="email" placeholder="register.placeholders.emailUniversity"
              value={ values.email } error={ errors.email } touched={ touched.email }
              onChange={ handleChange } onBlur={ handleBlur }
          />

          <FormInputField type="password" label="register.password" name="password" placeholder="register.placeholders.password"
              value={ values.password } error={ errors.password } touched={ touched.password }
              onChange={ handleChange } onBlur={ handleBlur }
          />

          <FormInputField type="password" label="register.repeatPassword" name="repeat_password" placeholder="register.placeholders.password"
              value={ values.repeat_password } error={ errors.repeat_password } touched={ touched.repeat_password }
              onChange={ handleChange } onBlur={ handleBlur }
          />

          <p className="col-7 mx-auto"><Translation>{t => t("register.pleaseContact", {email:CONTACT_EMAIL})}</Translation></p>

          <Button variant="secondary" type="submit" disabled={ isSubmitting }><Translation>{t => t("register.submit")}</Translation></Button>
        </Form>
      )}
      </Formik>
    )
  }
}

export default SignUpUniversityForm;
