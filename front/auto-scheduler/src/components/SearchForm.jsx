import React, { Component } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import {Button, Form, Spinner} from 'react-bootstrap';
import {Translation} from "react-i18next";
import {Link} from 'react-router-dom';
import LinkButton from './LinkButton'

const DAYS = ['M', 'T', 'W', 'TH', 'F', 'SAT', 'SUN'];
const DEFAULT_DATE = {day:"SUN", startTime:"01:00", endTime:"01:01"}

class SearchForm extends Component {
  state = {
    programs: [{id:'S18', name:'S18 - Informática'}, {id:'I03', name:'I03 - Industrial'}],
    periods: [{id:'2022-1Q', name:'2022-1Q'}, {id:'2022-2Q', name:'2022-2Q'}],
    params: {
      title: '',
      program: undefined,
      period: undefined,
      hours: 24,
      reduceDays: true,
      prioritizeUnlocks: true,
      unavailableTimeSlots: [DEFAULT_DATE]
    }
  }

  onChangeTitle(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.title = e.target.value;
    this.setState({params: paramsCopy});
  }

  onChangePrograms(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.program = e.target.value;
    this.setState({params: paramsCopy});
  }

  onChangeHours(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.hours = parseInt(e.target.value);
    this.setState({params: paramsCopy});
  }

  onChangePrioritize(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.prioritizeUnlocks = e.target.value;
    this.setState({params: paramsCopy});
  }

  onChangeReduceDays(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.reduceDays = e.target.value;
    this.setState({params: paramsCopy});
  }

  onChangeDay(e){
    let paramsCopy = Object.assign({}, this.state.params);
    let index = e.target.id.match(/\d/g)[0]
    paramsCopy.unavailableTimeSlots[index].day = e.target.value;
    this.setState({params: paramsCopy});
  }

  onChangeStartTime(e){
    let paramsCopy = Object.assign({}, this.state.params);
    let index = e.target.id.match(/\d/g)[0]
    paramsCopy.unavailableTimeSlots[index].startTime = e.target.value;
    this.setState({params: paramsCopy});
  }

  onChangeEndTime(e){
    let paramsCopy = Object.assign({}, this.state.params);
    let index = e.target.id.match(/\d/g)[0]
    paramsCopy.unavailableTimeSlots[index].endTime = e.target.value;
    this.setState({params: paramsCopy});
  }

  onClickTrashCan(e){
    let paramsCopy = Object.assign({}, this.state.params);
    let index = e.target.id.match(/\d/g)[0]
    paramsCopy.unavailableTimeSlots.splice(index, 1);
    this.setState({params: paramsCopy});
  }

  onClickPlusSign(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.unavailableTimeSlots.push(DEFAULT_DATE);
    this.setState({params: paramsCopy});
  }

  sendForm(e){
    console.log(this.state.params);
  }

  render(){
    return (
      <React.Fragment>
        <HelmetProvider>
          <Helmet><title>Search - AutoScheduler</title></Helmet>
        </HelmetProvider>

        <Form className="p-3 mx-auto text-center">

          <Form.Group controlId="program" className="row mx-auto form-row">
              <div className="col-4 text-end my-auto text-break">
                <Form.Label className="my-0">
                  <h5 className="my-0"><strong><Translation>{t => t("search.program")}</Translation></strong></h5>
                </Form.Label>
              </div>
              <div className="col-8 text-center">
                <Form.Select aria-label="Default select example" value={this.state.params.programs} onChange={this.onChangePrograms.bind(this)}>
                  { this.state.programs.map(p => (<option key={p.id} value={p.id}>{p.name}</option>)) }
                </Form.Select>
              </div>
          </Form.Group>

          <Form.Group controlId="period" className="row mx-auto form-row">
              <div className="col-4 text-end my-auto text-break">
                <Form.Label className="my-0">
                  <h5 className="my-0"><strong><Translation>{t => t("search.period")}</Translation></strong></h5>
                </Form.Label>
              </div>
              <div className="col-8 text-center">
                <Form.Select aria-label="Default select example" value={this.state.params.periods} onChange={this.onChangePrograms.bind(this)}>
                  { this.state.periods.map(p => (<option key={p.id} value={p.id}>{p.name}</option>)) }
                </Form.Select>
              </div>
          </Form.Group>

          <Form.Group controlId="hours" className="row mx-auto form-row">
            <div className="col-4 text-end my-auto text-break">
              <Form.Label className="col text-end my-auto">
                <h5 className="my-0"><strong><Translation>{t => t("search.hoursPerWeek")}</Translation></strong></h5>
              </Form.Label>
            </div>
            <div className="col-8">
              <Form.Control type="number" value={this.state.params.hours} onChange={this.onChangeHours.bind(this)}/>
            </div>
          </Form.Group>

          <Form.Group controlId="prioritize" className="row mx-auto form-row">
            <div className="col-4 text-end my-auto text-break">
              <Form.Label className="my-0">
                <h5 className="my-0"><strong><Translation>{t => t("search.prioritizeUnlocks")}</Translation></strong></h5>
              </Form.Label>
            </div>
            <div className="col-8 d-flex align-items-start align-items-center">
              <Form.Check className="m-0" onChange={this.onChangePrioritize.bind(this)}/>
            </div>
          </Form.Group>

          <Form.Group controlId="reduceDays" className="row mx-auto form-row">
            <div className="col-4 text-end my-auto text-break">
              <Form.Label className="my-0">
                <h5 className="my-0"><strong><Translation>{t => t("search.reduceDays")}</Translation></strong></h5>
              </Form.Label>
            </div>
            <div className="col-8 d-flex align-items-start align-items-center">
              <Form.Check className="m-0" onChange={this.onChangeReduceDays.bind(this)}/>
            </div>
          </Form.Group>

          <Form.Group controlId="unavailableSlots" className="row mx-auto form-row">
            <div className="col-4 text-end my-3 text-break">
              <Form.Label className="my-0">
                <h5 className="my-0"><strong><Translation>{t => t("search.unavailableSlots")}</Translation></strong></h5>
              </Form.Label>
            </div>
            <div className="col-8 align-items-start align-items-center">
              {
                this.state.params.unavailableTimeSlots.map((entry,index) => (
                  <div key={index} className="d-md-flex align-items-center">
                    <Form.Select id={"day-"+index} className="daypicker my-1" value={this.state.params.unavailableTimeSlots[index].day} onChange={this.onChangeDay.bind(this)}>
                      { DAYS.map(p => (<option key={p} value={p}>{<Translation>{t => t("days."+p)}</Translation>}</option>)) }
                    </Form.Select>
                    <div className="d-flex my-1 align-items-start align-items-center">
                      <input type="time" id={"start-"+index} className="mx-2 timepicker" value={this.state.params.unavailableTimeSlots[index].startTime} onChange={this.onChangeStartTime.bind(this)}/>
                      <h5 className="my-0"><strong>-</strong></h5>
                      <input type="time" id={"end-"+index} className="mx-2 timepicker" value={this.state.params.unavailableTimeSlots[index].endTime} onChange={this.onChangeEndTime.bind(this)}/>
                    </div>
                    <i className="bi bi-trash-fill btn color-primary" id={"trash-"+index} onClick={this.onClickTrashCan.bind(this)}></i>
                  </div>
                ))
              }
              <div className="mx-auto align-items-center plus-button-container clickable">
                <i className="bi bi-plus-circle-fill btn btn-lg color-primary" onClick={this.onClickPlusSign.bind(this)}></i>
              </div>
            </div>
          </Form.Group>

          <div className="text-center">
            <Button className="btn btn-primary mt-3" onClick={this.sendForm.bind(this)}><Translation>{t => t("submit")}</Translation></Button>
          </div>
        </Form>
      </React.Fragment>
    );
  }
}

export default SearchForm;
