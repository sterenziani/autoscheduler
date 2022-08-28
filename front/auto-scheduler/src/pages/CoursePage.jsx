import React, { Component } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Translation } from 'react-i18next';
import { Tabs, Tab, Spinner } from 'react-bootstrap';
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import CourseRequirementsList from '../components/Lists/CourseRequirementsList';
import CourseClassesTab from '../components/CourseClassesTab';

class CoursePage extends Component {
    state = {
        loading: true,
        error: false,
        course: null,
    };

    componentDidMount() {
        ApiService.getCourse(this.props.params.id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
            if (findError) this.setState({ loading: false, error: true, status: findError });
            else {
                ApiService.getActiveUser().then((userData) => {
                    let findError = null;
                    if (userData && userData.status && userData.status !== OK && userData.status !== CREATED)
                        findError = userData.status;
                    if (findError) this.setState({ loading: false, error: true, status: findError });
                    else this.setState({ loading: false, user: userData, course: data });
                });
            }
        });
    }

    render() {
        if (this.state.loading === true)
            return (
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            );
        if (this.state.error) return <h1>ERROR {this.state.error}</h1>;
        return (
            <React.Fragment>
                <HelmetProvider>
                    <Helmet>
                        <title>{this.state.course ? this.state.course.internalId : ''} - AutoScheduler</title>
                    </Helmet>
                </HelmetProvider>
                <div className="container my-5">
                    <Tabs className="borderless-tabs" defaultActiveKey={'classes'} fill>
                        <Tab
                            className="text-center"
                            eventKey="required_courses"
                            title={<Translation>{(t) => t('tabs.requiredCourses')}</Translation>}
                        >
                            <div className="bg-primary rounded-bottom">
                                <CourseRequirementsList course={this.state.course} />
                            </div>
                        </Tab>
                        <Tab
                            className="text-center"
                            eventKey="classes"
                            title={<Translation>{(t) => t('tabs.courseClasses')}</Translation>}
                        >
                            <div className="bg-primary rounded-bottom">
                                <CourseClassesTab user={this.state.user} course={this.state.course} />
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </React.Fragment>
        );
    }
}

export default (props) => <CoursePage {...props} params={useParams()} />;
