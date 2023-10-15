import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../Common/FormInputField';
import { OK, CREATED, UNAUTHORIZED, FORBIDDEN } from '../../services/ApiConstants';
import Roles from '../../resources/RoleConstants';
import ErrorMessage from '../Common/ErrorMessage';

const EXISTING_TERM_ERROR = "TERM_ALREADY_EXISTS"
const INVALID_NAME_ERROR = "INVALID_NAME"

function EditTermPage(props) {
    const TermSchema = Yup.object().shape({
        termName: Yup.string()
            .min(3, 'forms.errors.term.minLength')
            .max(25, 'forms.errors.term.maxLength')
            .required('forms.errors.term.isRequired'),
        code: Yup.string()
            .min(1, 'forms.errors.term.minCodeLength')
            .max(25, 'forms.errors.term.maxCodeLength')
            .required('forms.errors.term.codeIsRequired'),
    });

    const navigate = useNavigate()
    const {t} = useTranslation()
    const {id} = useParams()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const [user] = useState(ApiService.getActiveUser())
    const [term, setTerm] = useState(null)
    const [startDate, setStartDate] = useState()

    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [user, navigate])

    useEffect( () => {
        const loadTerm = async () => {
            ApiService.getTerm(id).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setError(resp.status)
                }
                else{
                    const date = new Date(resp.data.startDate)
                    setStartDate(date.toISOString().split('T')[0])
                    setTerm(resp.data)
                }
                setLoading(false)
            });
        }

        async function execute() {
            if(id){
                if(!term) await Promise.all([loadTerm()]);
                else setLoading(false)
            }
            else{
                if(!term){
                    setTerm({"name": t("forms.placeholders.termName"), "internalId": t("forms.placeholders.termCode")})
                    setStartDate(new Date().toISOString().slice(0, 10))
                    setLoading(false)
                }
            }
        }
        if(user) execute()
    },[user, term, id, t])

    const onChangeStartDate = (e) => {
        setStartDate(e.target.value)
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (startDate && values.termName && values.code)
        {
            const published = id? term.published : false
            const browserDate = new Date(startDate)
            const gmtTime = new Date(browserDate.getTime() + browserDate.getTimezoneOffset()*60000)
            const resp = await ApiService.saveTerm(term?(term.id):undefined, values.termName, values.code, gmtTime, published)
            if(resp.status === OK || resp.status === CREATED)
                navigate("/?tab=terms");
            else{
                setError(resp.data?.code?? resp.status)
                setSubmitting(false)
            }
        }
        else {
            setSubmitting(false);
        }
    };

    if(!user)
        return <ErrorMessage status={UNAUTHORIZED}/>
    if(user.role !== Roles.UNIVERSITY)
        return <ErrorMessage status={FORBIDDEN}/>
    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    if (error && error !== EXISTING_TERM_ERROR && error !== INVALID_NAME_ERROR)
        return <ErrorMessage status={error}/>
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editTerm':'forms.createTerm')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editTerm':'forms.createTerm')}</h2>
                {error && error === EXISTING_TERM_ERROR && (<p className="form-error">{t('forms.errors.term.codeAlreadyTaken')}</p>)}
                {error && error === INVALID_NAME_ERROR && (<p className="form-error">{t('forms.errors.invalidName')}</p>)}

                <Formik initialValues={{ termName: term.name, code: term.internalId }} validationSchema={TermSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                    <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                        <FormInputField
                            id="term-code"
                            label="forms.termCode" name="code"
                            placeholder="forms.placeholders.termCode"
                            value={values.code} error={errors.code}
                            touched={touched.code} onChange={handleChange} onBlur={handleBlur}
                        />
                        <FormInputField
                            id="term-name"
                            label="forms.termName" name="termName"
                            placeholder="forms.placeholders.termName"
                            value={values.termName} error={errors.termName}
                            touched={touched.termName} onChange={handleChange} onBlur={handleBlur}
                        />
                        <FormInputField
                            id="term-date" label="forms.startDate"
                            type="date" className="w-100 text-start timepicker"
                            value={startDate} onChange={onChangeStartDate}
                        />
                        {!startDate && (<p className="form-error">{t('forms.errors.term.dateIsRequired')}</p>)}

                        <Button className="my-3" variant="secondary" type="submit" disabled={isSubmitting}>{t("forms.save")}</Button>
                    </Form>
                )}
            </Formik>
            </div>
        </React.Fragment>
    );
}

export default EditTermPage;
