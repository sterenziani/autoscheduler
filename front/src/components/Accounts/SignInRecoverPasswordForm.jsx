import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Modal } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import ApiService from '../../services/ApiService';
import { CREATED } from '../../resources/ApiConstants';
import FormInputField from '../Common/FormInputField';

const EmailSchema = Yup.object().shape({
    email: Yup.string()
        .max(100, 'register.errors.email.maxLength')
        .email('register.errors.email.invalidEmail')
        .required('register.errors.email.isRequired'),
});

function SignInRecoverPasswordForm(props) {
    const { t } = useTranslation()
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [finished, setFinished] = useState(false)
    const [error, setError] = useState(null)

    const onSubmit = async (values, { setSubmitting }) => {
        const { status, data } = await ApiService.requestPasswordChangeToken(values.email)
        switch (status) {
            case CREATED:
                setError()
                setFinished(true)
                break;
            default:
                setSubmitting(false);
                setError(data?.code?? status)
                break;
        }
    }

    const switchPasswordModal = () => {
        setShowPasswordModal(!showPasswordModal)
    }

    return (
        <React.Fragment>
            <Button variant="link" className="text-white" onClick={() => switchPasswordModal()}>
                {t('login.forgotPassword')}
            </Button>
            <Modal show={showPasswordModal} onHide={() => switchPasswordModal()} className="color-warning text-black">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {t('login.forgotPassword')}
                    </Modal.Title>
                </Modal.Header>
                {finished
                    ? [
                          <Modal.Body key="answer-body" className="text-black">
                              <p key="password-email-sent" className="px-5 pt-3 text-center">
                                  {t('login.emailSent')}
                              </p>
                          </Modal.Body>,
                      ]
                    : [
                          <Formik
                              key="password-formik"
                              initialValues={{ email: '' }}
                              validationSchema={EmailSchema}
                              onSubmit={onSubmit}
                          >
                              {({
                                  values,
                                  errors,
                                  touched,
                                  handleChange,
                                  handleBlur,
                                  handleSubmit,
                                  isSubmitting,
                              }) => (
                                  <Form className="p-3 mx-auto text-center color-white" onSubmit={handleSubmit}>
                                      <Modal.Body className="text-black">
                                        {t('login.recoverPasswordDescription')}
                                          {error && (<p className="form-error">{t('register.errors.codes.'+error)}</p>)}
                                          <FormInputField
                                              type="email"
                                              label="register.email"
                                              name="email"
                                              id="email-reset-password"
                                              placeholder="register.placeholders.email"
                                              autoComplete="email"
                                              color="black"
                                              value={values.email}
                                              error={errors.email}
                                              touched={touched.email}
                                              onChange={handleChange}
                                              onBlur={handleBlur}
                                          />
                                      </Modal.Body>
                                      <Modal.Footer>
                                          <Button variant="grey" onClick={() => switchPasswordModal()}>
                                              {t('modal.cancel')}
                                          </Button>
                                          <Button variant="secondary" type="submit" disabled={isSubmitting}>
                                              {t('modal.send')}
                                          </Button>
                                      </Modal.Footer>
                                  </Form>
                              )}
                          </Formik>,
                      ]}
            </Modal>
        </React.Fragment>
    )
}

export default SignInRecoverPasswordForm;
