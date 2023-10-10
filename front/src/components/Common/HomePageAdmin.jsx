import React, {useState} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import UniversityUsersList from '../Lists/UniversityUsersList';
import { Form } from 'react-bootstrap';

function HomePageAdmin(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [inputText, setInputText] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const filter = inputText
        setInputText("")
        navigate('/?filter='+filter)
    };

    return (
        <React.Fragment>
            <HelmetProvider>
                <Helmet><title>AutoScheduler</title></Helmet>
            </HelmetProvider>
            {props.user && (
                <div className="container my-5 text-center bg-primary rounded">
                    <Form className="pt-5 px-5 pb-3" onSubmit={handleSubmit}>
                        <Form.Control
                            type='text'
                            placeholder={t('home.search')}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                    </Form>
                    <UniversityUsersList user={props.user}/>
                </div>
            )}
        </React.Fragment>
    );
}

export default HomePageAdmin;
