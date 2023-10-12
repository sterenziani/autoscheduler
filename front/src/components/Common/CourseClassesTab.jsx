import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner, Form } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK } from '../../services/ApiConstants';
import CourseClassesList from '../Lists/CourseClassesList';
import ErrorMessage from '../Common/ErrorMessage';
import { useLocation, useNavigate } from 'react-router-dom';

function CourseClassesTab(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const search = useLocation().search
    const user = props.user;
    const course = props.course;

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()
    const [terms, setTerms] = useState(null)
    const [selectedTerm, setSelectedTerm] = useState(null)

    useEffect( () => {
        if(!terms && loading){
            ApiService.getTerms().then((resp) => {
                if (resp && resp.status && resp.status !== OK)
                    setError(resp.status)
                else{
                    const params = new URLSearchParams(search)
                    const requestedTerm = resp.data.find(t => t.id === params.get('termId'))
                    setTerms(resp.data)
                    setSelectedTerm(requestedTerm? requestedTerm:resp.data[0])
                }
                setLoading(false)
            });
        }
    }, [search, user.id, terms, loading])

    const onChangeTerms = (e) => {
        navigate("/courses/"+course.id+"?termId="+e.target.value)
        setSelectedTerm(terms.filter((t) => t.id === e.target.value)[0])
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={error}/>
    if(!terms || terms.length < 1)
        return <React.Fragment><div className="mx-5 py-4"><p>{t('errors.noTerms')}</p></div></React.Fragment>
    return (
        <React.Fragment>
            <div className="mx-5 py-4">
                <Form.Select id="course-class-term-select" className="w-75 m-auto" value={selectedTerm.id} onChange={onChangeTerms}>
                    { terms.map((p) => ( <option key={p.id} value={p.id}> {p.internalId + ' - ' + p.name} </option>)) }
                </Form.Select>
                <CourseClassesList
                    user={user}
                    course={course}
                    term={selectedTerm}
                    key={selectedTerm.id}
                />
            </div>
        </React.Fragment>
    );
}

export default CourseClassesTab;
