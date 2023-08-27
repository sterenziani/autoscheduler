import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner, Form } from 'react-bootstrap';
import ApiService from '../../services/ApiService';
import { OK, CREATED } from '../../services/ApiConstants';
import CourseClassesList from '../Lists/CourseClassesList';
import ErrorMessage from '../Common/ErrorMessage';

function CourseClassesTab(props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [status, setStatus] = useState(null);
    const [terms, setTerms] = useState(null);
    const [selectedTerm, setSelectedTerm] = useState(null);
    const user = props.user;
    const course = props.course;

    useEffect( () => {
        ApiService.getTerms(user.id).then((resp) => {
            let findError = null;
            if (resp && resp.status && resp.status !== OK)
                findError = resp.status;
            if (findError){
                setError(true)
                setStatus(findError)
            }
            else{
                setTerms(resp.data)
                setSelectedTerm(resp.data[0])
            }
            setLoading(false)
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onChangeTerms = (e) => {
        // eslint-disable-next-line
        setSelectedTerm(terms.filter((t) => t.id == e.target.value)[0])
    }

    if (loading === true)
        return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if (error)
        return <ErrorMessage status={status}/>
    if(!terms || terms.length < 1)
        return <React.Fragment><div className="mx-5 py-4"><p>{t('errors.noTerms')}</p></div></React.Fragment>
    return (
        <React.Fragment>
            <div className="mx-5 py-4">
                <Form.Select className="w-75 m-auto" value={selectedTerm.id} onChange={onChangeTerms}>
                    { terms.map((p) => ( <option key={p.id} value={p.id}> {p.code + ' - ' + p.name} </option>)) }
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
