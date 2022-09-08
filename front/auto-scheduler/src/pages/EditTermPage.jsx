import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row } from 'react-bootstrap';
import ApiService from '../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../components/FormInputField';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import { DAYS, DEFAULT_DATE } from "../services/SystemConstants";

function EditTermPage(props) {
    const TermSchema = Yup.object().shape({
        termName: Yup.string()
            .min(3, 'forms.errors.term.minLength')
            .max(25, 'forms.errors.term.maxLength')
            .required('forms.errors.term.isRequired'),
        internalId: Yup.string()
            .min(1, 'forms.errors.term.minCodeLength')
            .max(25, 'forms.errors.term.maxCodeLength')
            .required('forms.errors.term.codeIsRequired'),
    });

    const navigate = useNavigate();
    const {t} = useTranslation();
    const {id} = useParams()
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [term, setTerm] = useState(null);

    const [startDate, setStartDate] = useState();
    const [programError, setProgramError] = useState();
    const [badConnection, setBadConnection] = useState();

    // ComponentDidMount
    useEffect( () => {
        async function execute() {
            if(!user && !term)
                await Promise.all([loadUser()]);
            if(id){
                if(user && !term)
                    await Promise.all([loadTerm()]);
                if(user && term)
                    setLoading(false)
            }
            else{
                if(user && !term){
                    setTerm({"name": t("forms.placeholders.termName"), "internalId": t("forms.placeholders.termCode")})
                    setStartDate(new Date().toISOString().slice(0, 10))
                    setLoading(false)
                }
            }
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[user, term])

    const loadUser = async () => {
        ApiService.getActiveUser().then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else
                setUser(data)
        })
    }

    const loadTerm = async () => {
        ApiService.getTerm(id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
              setTerm(data)
              setStartDate(data.startDate)
            }
            setLoading(false)
        });
    }

    const onChangeStartDate = (e) => {
        setStartDate(e.target.value)
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (startDate && values.termName && values.internalId)
        {
            const resp = await ApiService.saveTerm(term?(term.id):undefined, values.termName, values.internalId, startDate)
            if(resp.status == OK || resp.status == CREATED)
                navigate("/");
            else{
                setError(true)
                setStatus(resp.status)
                setSubmitting(false);
            }
        }
        else {
            setProgramError(true);
            setSubmitting(false);
        }
    };

    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editClass':'forms.createClass')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editTerm':'forms.createTerm')}</h2>
                <Formik initialValues={{ termName: term.name, internalId: term.internalId }} validationSchema={TermSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <FormInputField
                        label="forms.termName" name="termName"
                        placeholder="forms.placeholders.termName"
                        value={values.termName} error={errors.termName}
                        touched={touched.termName} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        label="forms.termCode" name="internalId"
                        placeholder="forms.placeholders.termCode"
                        value={values.internalId} error={errors.internalId}
                        touched={touched.internalId} onChange={handleChange} onBlur={handleBlur}
                    />
                    <Form.Group controlId="term-startdate" className="row mx-auto form-row">
                        <div className="col-3 text-end my-auto text-break">
                            <Form.Label className="my-0">
                                <h5 className="my-0"><strong>{t('forms.startDate')}</strong></h5>
                            </Form.Label>
                        </div>
                        <div className="col-9 text-center">
                        {
                            <input
                                type="date" id='datepicker' className="w-auto timepicker"
                                value={startDate} onChange={onChangeStartDate}
                            />
                        }
                        </div>
                    </Form.Group>
                    <Button className="my-3" variant="secondary" type="submit" disabled={isSubmitting}>{t("forms.save")}</Button>
                </Form>
            )}
            </Formik>
            </div>
        </React.Fragment>
    );
}

export default EditTermPage;
