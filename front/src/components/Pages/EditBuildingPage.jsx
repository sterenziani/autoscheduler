import React, {useState, useEffect} from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { Formik, useFormikContext } from 'formik';
import LeavePagePrompt from '../Common/LeavePagePrompt'
import structuredClone from '@ungap/structured-clone';
import * as Yup from 'yup';
import FormInputField from '../Common/FormInputField';
import FormInputLabel from '../Common/FormInputLabel';
import { OK, CREATED, UNAUTHORIZED, FORBIDDEN } from '../../services/ApiConstants';
import Roles from '../../resources/RoleConstants';
import ErrorMessage from '../Common/ErrorMessage';

const EXISTING_BUILDING_ERROR = "BUILDING_ALREADY_EXISTS"
const INVALID_NAME_ERROR = "INVALID_NAME"
const DEFAULT_DISTANCE = 45

function EditBuildingPage(props) {
    const BuildingSchema = Yup.object().shape({
        buildingInternalId: Yup.string()
            .min(1, 'forms.errors.building.minCodeLength')
            .max(25, 'forms.errors.building.maxCodeLength')
            .required('forms.errors.building.codeIsRequired'),
        buildingName: Yup.string()
            .min(3, 'forms.errors.building.minNameLength')
            .max(50, 'forms.errors.building.maxNameLength')
            .required('forms.errors.building.nameIsRequired'),
    })

    const navigate = useNavigate()
    const {t} = useTranslation()
    const {id} = useParams()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const user = ApiService.getActiveUser()
    const [building, setBuilding] = useState(null)
    const [buildings, setBuildings] = useState()
    const [distances, setDistances] = useState()


    useEffect(() => {
        if(!user)
            navigate("/login")
    }, [user, navigate])

    const loadBuildings = async () => {
        ApiService.getBuildingDictionary().then((resp) => {
            if (resp && resp.status && resp.status !== OK){
                setLoading(false)
                setError(resp.status)
            }
            else{
                setBuildings(resp.data)
            }
        });
    }

    useEffect( () => {
        const loadBuilding = async () => {
            ApiService.getBuilding(id).then((resp) => {
                if (resp && resp.status && resp.status !== OK){
                    setLoading(false)
                    setError(resp.status)
                }
                else{
                    setBuilding(resp.data)
                    const dist = {}
                    // Set defined distances
                    resp.data.distances.forEach((d) => {
                        if(d.distancedBuildingId !== id){
                            dist[d.distancedBuildingId] = {building: buildings[d.distancedBuildingId], time: Number(d.distance)}
                        }
                    })

                    // Use default for undefined distances
                    for (const [bId, b] of Object.entries(buildings)){
                        if(bId !== id && !dist[bId]) dist[bId] = {building: b, time: DEFAULT_DISTANCE}
                    }
                    setDistances(dist)
                }
            });
        }

        async function execute() {
            if(!buildings)
                await Promise.all([loadBuildings()])
            if(id){
                if(buildings && !building)
                    await Promise.all([loadBuilding(id)])
            }
            else{
                if(buildings && !building){
                    const emptyDist = {}
                    for (const [bId, b] of Object.entries(buildings)){
                        emptyDist[bId] = {building: b, time: DEFAULT_DISTANCE}
                    }
                    setDistances(emptyDist)
                    setBuilding({"name": t("forms.placeholders.buildingName"), "internalId": t("forms.placeholders.buildingCode")})
                }
            }
            if(building && buildings)
                setLoading(false)
        }
        execute();
    },[buildings, id, t, building])

    const onChangeTime = (e, entry) => {
        const distancesCopy = structuredClone(distances)
        distancesCopy[entry.building.id].time = Number(e.target.value)
        setDistances(distancesCopy)
    }

    const [unsavedForm, setUnsavedForm] = useState(false)
    const FormObserver = () => {
        const { values } = useFormikContext()
        useEffect(() => {
            const nameChanged = (building && values.buildingName !== building.name)
            const internalIdChanged = (building && values.buildingInternalId !== building.internalId)
            let distancesChanged = false
            if(distances && building.distances){
                for(const b of building.distances){
                    if(!distancesChanged && b.buildingId !== b.distancedBuildingId && Number(b.distance) !== distances[b.distancedBuildingId].time)
                        distancesChanged = true
                }
            }
            setUnsavedForm(nameChanged || internalIdChanged || distancesChanged)
        }, [values]);
        return null;
    }

    const onSubmit = async (values, { setSubmitting, setFieldError }) => {
        setSubmitting(true);
        if(values.buildingInternalId && values.buildingName)
        {
            const resp = await ApiService.saveBuilding(id, values.buildingName, values.buildingInternalId, distances)
            if(resp.status === OK || resp.status === CREATED){
                navigate("/?tab=buildings")
            }
            else{
                setError(resp.data?.code?? resp.status)
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
    if (error && error !== EXISTING_BUILDING_ERROR && error !== INVALID_NAME_ERROR)
        return <ErrorMessage status={error}/>
    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>{t(id?'forms.editBuilding':'forms.createBuilding')}</title></Helmet>
            </HelmetProvider>
            <div className="p-2 text-center container my-5 bg-grey text-primary rounded">
                <h2 className="mt-3">{t(id?'forms.editBuilding':'forms.createBuilding')}</h2>
                {error && error === EXISTING_BUILDING_ERROR && (<p className="form-error">{t('forms.errors.building.codeAlreadyTaken')}</p>)}
                {error && error === INVALID_NAME_ERROR && (<p className="form-error">{t('forms.errors.invalidName')}</p>)}
                <Formik initialValues={{ buildingName: building.name, buildingInternalId: building.internalId }} validationSchema={BuildingSchema} onSubmit={onSubmit}>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                <Form className="p-3 mx-auto text-center text-primary" onSubmit={handleSubmit}>
                    <LeavePagePrompt when={unsavedForm && !isSubmitting}/>
                    <FormObserver/>

                    <FormInputField
                        id="building-code"
                        label="forms.buildingCode" name="buildingInternalId"
                        placeholder="forms.placeholders.buildingCode"
                        value={values.buildingInternalId} error={errors.buildingInternalId}
                        touched={touched.buildingInternalId} onChange={handleChange} onBlur={handleBlur}
                    />
                    <FormInputField
                        id="building-name"
                        label="forms.buildingName" name="buildingName"
                        placeholder="forms.placeholders.buildingName"
                        value={values.buildingName} error={errors.buildingName}
                        touched={touched.buildingName} onChange={handleChange} onBlur={handleBlur}
                    />
                    {
                        Object.keys(distances).length > 0 &&
                        <Row className='mx-auto form-row text-center'>
                            <FormInputLabel label="forms.timeToDestination"/>
                            <div className="col-md-9">
                            {
                                Object.values(distances).sort((a,b) => a.building.internalId.localeCompare(b.building.internalId)).map((entry, index) => (
                                    <Form.Group controlId={"distance-"+entry.building.id} key={"time-input-"+index} className={'row mx-auto form-row'}>
                                        <Col className="my-auto text-end text-break" xs={3} md={2}>
                                            <Form.Label className="my-auto"><h6 className="my-auto">{entry.building.internalId}</h6></Form.Label>
                                        </Col>
                                        <Col className="pe-0" xs={6} md={8}>
                                            <Form.Control type="number" min={0} value={entry.time} onChange={(e) => onChangeTime(e, entry)}/>
                                        </Col>
                                        <Col className="my-auto text-start mx-0" xs={3} md={2}>
                                            {t("forms.minutes")}
                                        </Col>
                                    </Form.Group>
                                ))
                            }
                            </div>
                        </Row>
                    }
                    <Button className="my-3" variant="secondary" type="submit" disabled={isSubmitting}>{t("forms.save")}</Button>
                </Form>
            )}
            </Formik>
            </div>
        </React.Fragment>
    );
}

export default EditBuildingPage;
