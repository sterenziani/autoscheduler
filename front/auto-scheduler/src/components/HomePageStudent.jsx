import React, { Component } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import {Tabs, Tab} from 'react-bootstrap';
import {Translation} from "react-i18next";
import SearchForm from '../components/SearchForm'
import StudentCourseLog from '../components/Lists/StudentCourseLog'

class HomePageStudent extends Component {
  render(){
    return(
      <React.Fragment>
        <HelmetProvider>
          <Helmet><title>Search - AutoScheduler</title></Helmet>
        </HelmetProvider>
        <div className="container mt-5">
          <Tabs className="borderless-tabs" defaultActiveKey="schedule_form" fill>
            <Tab className="text-center" eventKey="classes" title={<Translation>{t => t("tabs.courseLog")}</Translation>}>
              <div className="bg-primary"><StudentCourseLog/></div>
            </Tab>
            <Tab className="text-center" eventKey="schedule_form" title={<Translation>{t => t("tabs.findSchedule")}</Translation>}>
              <div className="bg-primary"><SearchForm/></div>
            </Tab>
          </Tabs>
        </div>
      </React.Fragment>
    );
  }
}

export default HomePageStudent;
