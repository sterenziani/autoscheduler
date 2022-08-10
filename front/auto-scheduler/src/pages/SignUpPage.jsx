import React, { Component } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import {Translation} from "react-i18next";
import {Tabs, Tab} from 'react-bootstrap';
import SignUpStudentForm from '../components/SignUpStudentForm'
import SignUpUniversityForm from '../components/SignUpUniversityForm'

class SignUpPage extends Component {
  render(){
    return(
      <React.Fragment>
        <HelmetProvider>
          <Helmet><title>Register - AutoScheduler</title></Helmet>
        </HelmetProvider>
        <div className="container mt-5">
          <Tabs className="borderless-tabs" defaultActiveKey="i_am_student" fill>
            <Tab className="text-center" eventKey="i_am_student" title={<Translation>{t => t("tabs.iAmStudent")}</Translation>}>
              <div className="bg-primary"><SignUpStudentForm/></div>
            </Tab>
            <Tab className="text-center" eventKey="i_am_university" title={<Translation>{t => t("tabs.iAmUniversty")}</Translation>}>
              <div className="bg-primary"><SignUpUniversityForm/></div>
            </Tab>
          </Tabs>
        </div>
      </React.Fragment>
    );
  }
}

export default SignUpPage;
