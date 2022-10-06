import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import ApiService from '../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../components/FormInputField';
import { OK, CREATED } from '../services/ApiConstants';
import NoAccess from '../components/NoAccess';
import Roles from '../resources/RoleConstants';

function EditBuildingPage(props) {
    const BuildingSchema = Yup.object().shape({
        buildingCode: Yup.string()
            .min(1, 'forms.errors.building.minCodeLength')
            .max(25, 'forms.errors.building.maxCodeLength')
            .required('forms.errors.building.codeIsRequired'),
        buildingName: Yup.string()
            .min(3, 'forms.errors.building.minNameLength')
            .max(50, 'forms.errors.building.maxNameLength')
            .required('forms.errors.building.nameIsRequired'),
    });

    const navigate = useNavigate();
    const {t} = useTranslation();
    const {id} = useParams()
    const user = ApiService.getActiveUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [building, setBuilding] = useState(null);
    const [buildings, setBuildings] = useState();
    const [distances, setDistances] = useState();
    const [badConnection, setBadConnection] = useState();

    useEffect(() => {
        if(!user)
            navigate("/login")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect( () => {
        async function execute() {
            if(id){
                if(user && !building && !buildings)
                    await Promise.all([loadBuilding(), loadBuildings(user.id)]);
            }
            else{
                if(user && !buildings)
                    await Promise.all([loadBuildings(user.id)]);
                else if(user && !building && buildings){
                    setBuilding({"name": t("forms.placeholders.buildingName"), "internalId": t("forms.placeholders.buildingCode")})
                    setDistances({})
                }
            }
            if(user && building && buildings)
                setLoading(false)
        }
        execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[building, buildings])

    const loadBuilding = async () => {
        ApiService.getBuilding(id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
                setBuilding(data)
                const dist = {}
                data.distances.forEach((d) => {
                    dist[d.building.internalId] = d
                })
                setDistances(dist)
            }
        });
    }

    const loadBuildings = async (universityId) => {
        ApiService.getBuildings(universityId).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED)
                findError = data.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
                setBuildings(data)
            }
        });
    }

    const onChangeTime = (e, entry) => {
        const distancesCopy = Object.assign([], distances);
        distancesCopy[entry.building.internalId].time = e.target.value;
        setDistances(distancesCopy)
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if (values.buildingCode && values.buildingName)
        {
            const resp = await ApiService.saveBuilding(id, values.buildingCode, values.buildingName, Object.values(distances))
            if(resp.status === OK || resp.status === CREATED){
                navigate("/?tab=buildings")
            }
            else{
                setError(true)
                setStatus(resp.status)
                setSubmitting(false)
            }
        }
        else {
            setSubmitting(false)
        }
    };

    if(user.type !== Roles.UNIVERSITY)
        return <NoAccess/>
    if (loading === true)
        return <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    if (error)
        return <h1>ERROR {status}</h1>;
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editBuilding':'forms.createBuilding')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editBuilding':'forms.createBuilding')}</h2>
                <Formik initialValues={{ buildingName: building.name, buildingCode: building.internalId }} validationSchema={BuildingSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <FormInputField
                        label="forms.buildingCode" name="buildingCode"
                        placeholder="forms.placeholders.buildingCode"
                        value={values.buildingCode} error={errors.buildingCode}
                        touched={touched.buildingCode} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        label="forms.buildingName" name="buildingName"
                        placeholder="forms.placeholders.buildingName"
                        value={values.buildingName} error={errors.buildingName}
                        touched={touched.buildingName} onChange={handleChange} onBlur={handleBlur}
                    />
                    <Form.Group controlId="distance" className="row mx-auto form-row">
                        <div className="col-3 text-break my-1 text-end">
                            <Form.Label>
                                <h5><strong>{t('forms.timeToDestination')}</strong></h5>
                            </Form.Label>
                        </div>
                        <div className="col-9 text-center my-auto">
                        {
                            Object.keys(distances).length > 0? [
                                Object.values(distances).map((entry, index) => (
                                    <Row key={"time-input-"+index}>
                                    <Col className="my-auto text-end text-break" xs={3} md={2}>
                                        <Form.Label className="my-auto"><h6 className="my-auto">{entry.building.name}</h6></Form.Label>
                                    </Col>
                                    <Col className="pe-0" xs={6} md={8}>
                                        <Form.Control type="number" value={entry.time} onChange={(e) => onChangeTime(e, entry)}/>
                                    </Col>
                                    <Col className="my-auto text-start mx-0" xs={3} md={2}>
                                        {t("forms.minutes")}
                                    </Col>
                                    </Row>
                                ))
                            ] : [<div key="no-buildings-msg">{t("forms.onlyBuilding")}</div>]
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

export default EditBuildingPage;
