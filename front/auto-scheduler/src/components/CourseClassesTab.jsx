import React, { Component } from 'react';
import {Spinner, Form} from 'react-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import CourseClassesList from './Lists/CourseClassesList'

class CourseClassesTab extends Component {
  state = {
    loading: true,
    error: false,
    user: this.props.user,
    course: this.props.course,
    terms: null,
    selectedTerm: null
  }

  componentDidMount() {
    this.loadTerms()
  }

  loadTerms(){
    ApiService.getTerms(this.state.user.id).then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED)
        findError = data.status;
      if(findError)
        this.setState({loading: false, error: true, status: findError});
      else
        this.setState({loading: false, terms: data, selectedTerm: data[0]});
    });
  }

  onChangeTerms(e){
    let paramsCopy = Object.assign({}, this.state.params);
    this.setState({selectedTerm: this.state.terms.filter(t => t.id == e.target.value)[0]})
  }

  render(){
    if (this.state.loading === true)
      return <div className="mx-auto py-3"><Spinner animation="border"/></div>
    if(this.state.error)
      return <h1>ERROR {this.state.error}</h1>
    return (
      <React.Fragment>
        <div className="mx-5 py-4">
          <Form.Select className="w-75 m-auto" value={this.state.selectedTerm.id} onChange={this.onChangeTerms.bind(this)}>
            { this.state.terms.map(p => (<option key={p.id} value={p.id}>{p.internalId+" - "+p.name}</option>)) }
          </Form.Select>
          <CourseClassesList user={this.state.user} course={this.state.course} term={this.state.selectedTerm} key={this.state.selectedTerm.id}/>
        </div>
      </React.Fragment>
    );
  }
}

export default CourseClassesTab;
