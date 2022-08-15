import React, { Component } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import {Tabs, Tab, Alert} from 'react-bootstrap';
import {Translation} from "react-i18next";
import UniversityProgramsList from './Lists/UniversityProgramsList'
import UniversityCoursesList from './Lists/UniversityCoursesList'
import UniversityBuildingsList from './Lists/UniversityBuildingsList'

const CONTACT_EMAIL = "juan@autoscheduler.com"

class HomePageUniversity extends Component {
  render(){
    return(
      <React.Fragment>
        <HelmetProvider>
          <Helmet><title>AutoScheduler</title></Helmet>
        </HelmetProvider>
        {
          (this.props.user && !this.props.user.verified &&
            <Alert className="m-5" variant="danger"><Translation>{t => t("home.getVerified", {email: CONTACT_EMAIL})}</Translation></Alert>)
        }
        <div className="container my-5">
          <Tabs className="borderless-tabs" defaultActiveKey="programs" fill>
            <Tab className="text-center" eventKey="buildings" title={<Translation>{t => t("tabs.buildings")}</Translation>}>
              <div className="bg-primary rounded-bottom"><UniversityBuildingsList user={this.props.user}/></div>
            </Tab>
            <Tab className="text-center" eventKey="programs" title={<Translation>{t => t("tabs.programs")}</Translation>}>
              <div className="bg-primary rounded-bottom"><UniversityProgramsList user={this.props.user}/></div>
            </Tab>
            <Tab className="text-center" eventKey="courses" title={<Translation>{t => t("tabs.courses")}</Translation>}>
              <div className="bg-primary rounded-bottom"><UniversityCoursesList user={this.props.user}/></div>
            </Tab>
            <Tab className="text-center" eventKey="terms" title={<Translation>{t => t("tabs.terms")}</Translation>}>
              <div className="bg-primary rounded-bottom">TERMS</div>
            </Tab>
          </Tabs>
        </div>
      </React.Fragment>
    );
  }
}

export default HomePageUniversity;
