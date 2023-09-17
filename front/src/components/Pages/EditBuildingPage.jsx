import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FormInputField from '../Common/FormInputField';
import { OK, CREATED, UNAUTHORIZED, FORBIDDEN } from '../../services/ApiConstants';
import Roles from '../../resources/RoleConstants';
import ErrorMessage from '../Common/ErrorMessage';

const EXISTING_BUILDING_ERROR = "BUILDING_ALREADY_EXISTS"

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
    const [user] = useState(ApiService.getActiveUser())
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [building, setBuilding] = useState(null);
    const [buildings, setBuildings] = useState();
    const [distances, setDistances] = useState();


    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [user, navigate])

    const loadBuildings = async (universityId) => {
        ApiService.getBuildingDictionary(universityId).then((resp) => {
            let findError = null;
            if (resp && resp.status && resp.status !== OK)
                findError = resp.status;
            if (findError){
                setLoading(false)
                setError(true)
                setStatus(findError)
            }
            else{
                setBuildings(resp.data)
            }
        });
    }

    useEffect( () => {
        const loadBuilding = async () => {
            ApiService.getBuilding(id).then((resp) => {
                let findError = null;
                if (resp && resp.status && resp.status !== OK)
                    findError = resp.status;
                if (findError){
                    setLoading(false)
                    setError(true)
                    setStatus(findError)
                }
                else{
                    setBuilding(resp.data)
                    const dist = {}
                    resp.data.distances.forEach((d) => dist[d.buildingId] = {building: buildings[d.buildingId], time: d.time})
                    setDistances(dist)
                }
            });
        }

        async function execute() {
            if(!buildings)
                await Promise.all([loadBuildings(user.id)]);
            if(id){
                if(buildings && !building)
                    await Promise.all([loadBuilding(id)]);
            }
            else{
                if(buildings && !building){
                    const emptyDist = {}
                    for (const [bId, b] of Object.entries(buildings)){
                        emptyDist[bId] = {building: b, time: 0}
                    }
                    setDistances(emptyDist)
                    setBuilding({"name": t("forms.placeholders.buildingName"), "code": t("forms.placeholders.buildingCode")})
                }
            }
            if(building && buildings)
                setLoading(false)
        }
        if(user) execute();
    },[user, buildings, id, t, building])

    const onChangeTime = (e, entry) => {
        const distancesCopy = Object.assign([], distances)
        distancesCopy[entry.building.id].time = Number(e.target.value);
        setDistances(distancesCopy)
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if(values.buildingCode && values.buildingName)
        {
            const resp = await ApiService.saveBuilding(id, values.buildingName, values.buildingCode, distances)
            if(resp.status === OK || resp.status === CREATED){
                navigate("/?tab=buildings")
            }
            else{
                setError(resp.data.code)
                setStatus(resp.status)
                setSubmitting(false)
            }
        }
        else {
            setSubmitting(false)
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
    if (error && error !== EXISTING_BUILDING_ERROR)
        return <ErrorMessage status={status}/>
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editBuilding':'forms.createBuilding')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editBuilding':'forms.createBuilding')}</h2>
                {error && (<p className="form-error">{t('forms.errors.building.codeAlreadyTaken')}</p>)}
                <Formik initialValues={{ buildingName: building.name, buildingCode: building.code }} validationSchema={BuildingSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <FormInputField
                        id="building-code"
                        label="forms.buildingCode" name="buildingCode"
                        placeholder="forms.placeholders.buildingCode"
                        value={values.buildingCode} error={errors.buildingCode}
                        touched={touched.buildingCode} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        id="building-name"
                        label="forms.buildingName" name="buildingName"
                        placeholder="forms.placeholders.buildingName"
                        value={values.buildingName} error={errors.buildingName}
                        touched={touched.buildingName} onChange={handleChange} onBlur={handleBlur}
                    />
                    <Row className="mx-auto form-row">
                        <div className="col-3 text-break my-1 text-end">
                            <h5><strong>{t('forms.timeToDestination')}</strong></h5>
                        </div>
                        <div className="col-9 text-center my-auto">
                        {
                            Object.keys(distances).length > 0? [
                                Object.values(distances).map((entry, index) => (
                                    <Form.Group controlId={"distance-"+entry.building.id} key={"time-input-"+index} className={'row mx-auto form-row'}>
                                        <Col className="my-auto text-end text-break" xs={3} md={2}>
                                            <Form.Label className="my-auto"><h6 className="my-auto">{entry.building.code}</h6></Form.Label>
                                        </Col>
                                        <Col className="pe-0" xs={6} md={8}>
                                            <Form.Control type="number" value={entry.time} onChange={(e) => onChangeTime(e, entry)}/>
                                        </Col>
                                        <Col className="my-auto text-start mx-0" xs={3} md={2}>
                                            {t("forms.minutes")}
                                        </Col>
                                    </Form.Group>
                                ))
                            ] : [<div key="no-buildings-msg">{t("forms.onlyBuilding")}</div>]
                        }
                        </div>
                    </Row>
                    <Button className="my-3" variant="secondary" type="submit" disabled={isSubmitting}>{t("forms.save")}</Button>
                </Form>
            )}
            </Formik>
            </div>
        </React.Fragment>
    );
}

export default EditBuildingPage;
