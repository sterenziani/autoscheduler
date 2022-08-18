import React, { Component } from 'react';
import {Button, Form, Spinner, Row} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';

const DAYS = ['SUN', 'M', 'T', 'W', 'TH', 'F', 'SAT'];
const DEFAULT_DATE = {day:DAYS[0], startTime:"01:00", endTime:"01:01"}

class SearchForm extends Component {
  state = {
    loading: true,
    error: false,
    user: undefined,
    params: {
      program: undefined,
      term: undefined,
      hours: 24,
      reduceDays: true,
      prioritizeUnlocks: true,
      unavailableTimeSlots: [JSON.parse(JSON.stringify(DEFAULT_DATE))]  // Clone DEFAULT_DATE
    }
  }

  onChangePrograms(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.program = e.target.value;
    this.setState({params: paramsCopy});
  }

  onChangeTerms(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.term = e.target.value;
    this.setState({params: paramsCopy});
  }

  onChangeHours(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.hours = parseInt(e.target.value);
    this.setState({params: paramsCopy});
  }

  onChangePrioritize(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.prioritizeUnlocks = e.target.checked;
    this.setState({params: paramsCopy});
  }

  onChangeReduceDays(e){
    let paramsCopy = Object.assign({}, this.state.params);
    paramsCopy.reduceDays = e.target.checked;
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
    paramsCopy.unavailableTimeSlots.push(JSON.parse(JSON.stringify(DEFAULT_DATE))); // Clone DEFAULT_DATE
    this.setState({params: paramsCopy});
  }

  getPath(studentName) {
    let path = "results";
    var prog = (this.state.params.program)? this.state.params.program:this.state.programs[0];
    var term = (this.state.params.term)? this.state.params.term:this.state.terms[0];
    path += "?program="+prog;
    path += "&term="+term;
    path += "&hours="+this.state.params.hours;
    path += "&reduceDays="+this.state.params.reduceDays;
    path += "&prioritizeUnlocks="+this.state.params.prioritizeUnlocks;
    path += "&userAsking="+studentName;
    if(this.state.params.unavailableTimeSlots){
      this.state.params.unavailableTimeSlots.forEach(slot => {
        if(slot.startTime < slot.endTime)
          path += "&unavailable="+slot.day+"-"+slot.startTime+"-"+slot.endTime;
      });
    }
    return path;
  }

  loadProgramsAndTerms(university){
    ApiService.getPrograms(university).then((dataProg) => {
      let findError = null;
      if (dataProg && dataProg.status && dataProg.status !== OK && dataProg.status !== CREATED)
        findError = dataProg.status;
      if(findError) {
        this.setState({ loading: false, error: true, status: findError});
      }
      else {
        ApiService.getTerms(university).then((dataTerm) => {
          let findError = null;
          if (dataTerm && dataTerm.status && dataTerm.status !== OK && dataTerm.status !== CREATED)
            findError = dataTerm.status;
          if(findError) {
            this.setState({ loading: false, error: true, status: findError});
          }
          else {
            let paramsCopy = Object.assign({}, this.state.params);
            paramsCopy.program = dataProg[0].id;
            paramsCopy.term = dataTerm[0].id;
            this.setState({
              programs:dataProg,
              terms: dataTerm,
              params: paramsCopy,
              loading: false
            });
          }
        });
      }
    });
  }

  componentDidMount() {
    ApiService.getActiveUser().then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED)
        findError = data.status;
      if(findError)
        this.setState({ loading: false, error: true, status: findError});
      else{
        this.setState({ user: data });
        this.loadProgramsAndTerms(data.university.id)
      }
    });
  }

  render(){
    if (this.state.loading === true) {
      return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    }
    if(this.state.error) {
      return <h1>ERROR {this.state.error}</h1>
    }
    return (
      <React.Fragment>
        <Form className="p-3 mx-auto text-center color-white">
          <Form.Group controlId="program" className="row mx-auto form-row">
              <div className="col-4 text-end my-auto text-break">
                <Form.Label className="my-0">
                  <h5 className="my-0"><strong><Translation>{t => t("search.program")}</Translation></strong></h5>
                </Form.Label>
              </div>
              <div className="col-8 text-center">
                <Form.Select value={this.state.params.program} onChange={this.onChangePrograms.bind(this)}>
                  { this.state.programs.map(p => (<option key={p.id} value={p.id}>{p.internalId+" - "+p.name}</option>)) }
                </Form.Select>
              </div>
          </Form.Group>

          <Form.Group controlId="term" className="row mx-auto form-row">
              <div className="col-4 text-end my-auto text-break">
                <Form.Label className="my-0">
                  <h5 className="my-0"><strong><Translation>{t => t("search.term")}</Translation></strong></h5>
                </Form.Label>
              </div>
              <div className="col-8 text-center">
                <Form.Select value={this.state.params.term} onChange={this.onChangeTerms.bind(this)}>
                  { this.state.terms.map(p => (<option key={p.id} value={p.id}>{p.name}</option>)) }
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
              <Form.Check checked={this.state.params.prioritizeUnlocks} className="color-secondary m-0" onChange={this.onChangePrioritize.bind(this)}/>
            </div>
          </Form.Group>

          <Form.Group controlId="reduceDays" className="row mx-auto form-row">
            <div className="col-4 text-end my-auto text-break">
              <Form.Label className="my-0">
                <h5 className="my-0"><strong><Translation>{t => t("search.reduceDays")}</Translation></strong></h5>
              </Form.Label>
            </div>
            <div className="col-8 d-flex align-items-start align-items-center">
              <Form.Check checked={this.state.params.reduceDays} className="m-0" onChange={this.onChangeReduceDays.bind(this)}/>
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
                  <Row key={"timerow-"+index} xs={1} md={6} className="list-row pb-2 pt-3 justify-content-center">
                    <Form.Select id={"day-"+index} className="w-auto mx-1" value={this.state.params.unavailableTimeSlots[index].day} onChange={this.onChangeDay.bind(this)}>
                      { DAYS.map(p => (<option key={p} value={p}>{<Translation>{t => t("days."+p)}</Translation>}</option>)) }
                    </Form.Select>
                    <input type="time" id={"start-"+index} className="w-auto timepicker" value={this.state.params.unavailableTimeSlots[index].startTime} onChange={this.onChangeStartTime.bind(this)}/>
                    <h5 className="my-auto w-auto"><strong>-</strong></h5>
                    <input type="time" id={"end-"+index} className="w-auto timepicker" value={this.state.params.unavailableTimeSlots[index].endTime} onChange={this.onChangeEndTime.bind(this)}/>
                    <i className="bi bi-trash-fill btn color-white w-auto my-auto mx-2" id={"trash-"+index} onClick={this.onClickTrashCan.bind(this)}></i>
                  </Row>
                ))
              }
              <div className="mx-auto align-items-center plus-button-container clickable">
                <i className="bi bi-plus-circle-fill btn btn-lg color-white" onClick={this.onClickPlusSign.bind(this)}></i>
              </div>
            </div>
          </Form.Group>
          <div className="row">
          <div className="col text-center">
            <LinkContainer to={ this.getPath('Newcomer') }>
            <Button className="btn btn-secondary mt-3">Newcomer</Button>
            </LinkContainer>
          </div>
          <div className="col text-center">
            <LinkContainer to={ this.getPath('Algebra') }>
            <Button className="btn btn-secondary mt-3">Algebra + Intro Inf</Button>
            </LinkContainer>
          </div>
          <div className="col text-center">
            <LinkContainer to={ this.getPath('1C') }>
            <Button className="btn btn-secondary mt-3">1° Semester Done</Button>
            </LinkContainer>
          </div>
          <div className="col text-center">
            <LinkContainer to={ this.getPath('2C') }>
            <Button className="btn btn-secondary mt-3">2° Semester Done</Button>
            </LinkContainer>
          </div>
          </div>
        </Form>
      </React.Fragment>
    );
  }
}

export default SearchForm;
