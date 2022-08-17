import React, { Component } from 'react';
import { Helmet, HelmetProvider } from "react-helmet-async";
import {Spinner, Button} from 'react-bootstrap';
import {Translation} from "react-i18next";
import ApiService from '../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../services/ApiConstants';
import withQuery from '../hoc/withQuery';

const DAYS = ['SUN', 'M', 'T', 'W', 'TH', 'F', 'SAT']

class SearchResults extends Component {
  state = {
    loading: true,
    error: false,
    status: null,
    schedules: [],
    scheduleIndex: 0
  };

  componentDidMount() {
    let params = this.readParams();
    ApiService.getSchedules(params).then((data) => {
      let findError = null;
      if (data && data.status && data.status !== OK && data.status !== CREATED) {
        findError = data.status;
      }
      if(findError) {
        this.setState({
          loading: false,
          error: true,
          status: findError,
        });
      }
      else {
        var tables = []
        data.forEach((s, idx) => {
          tables.push(this.drawTable(this.getTimeTable(s), Number(data[idx].earliest.split(":")[0])-1, Number(data[idx].latest.split(":")[0])+1, idx))
        });
        this.setState({
          schedules: data,
          tables: tables,
          scheduleIndex: 0,
          loading: false,
        });
      }
    });
  }

  readParams(props) {
    if(!props)
      props = this.props;
    const params = {
      program: props.query.get("program"),
      term: props.query.get("term"),
      hours: props.query.get("hours"),
      reduceDays: props.query.get("reduceDays"),
      prioritizeUnlocks: props.query.get("prioritizeUnlocks"),
      unavailableTimeSlots: props.query.getAll("unavailable"),
      userAsking: props.query.get("userAsking"),
    }
    this.setState({params: params});
    return params;
  }

  getTimeTable(schedule){
    var timeTable = {}
    var classColors = {}
    var colorIndex = 0;
    DAYS.forEach(d => {
      timeTable[d] = Array.from({length:24})
    })
    schedule.courseClasses.forEach(c => {
      classColors[c.course] = (colorIndex%8)
      colorIndex++
      c.lectures.forEach(l => {
        let startTime = l.startTime.split(":")
        let endTime = l.endTime.split(":")
        let startHour = (startTime[1]>='50')? Number(startTime[0])+1 : Number(startTime[0])
        let endHour =  (endTime[1]<='10')  ? Number(endTime[0]) : Number(endTime[0])+1
        for(let i=startHour; i < endHour; i++)
          timeTable[l.day][i] = {lecture: l, startHour:startHour, duration: endHour-startHour, courseClass: c, color: classColors[c.course]}
      })
    })
    return timeTable
  }

  drawTable(timeTable, earliest, latest, id){
    return(
      <table key={"t-"+id} className="table table-bordered text-center">
        <thead>
          <tr className="bg-primary border-dark text-white">
            <th className="text-uppercase"></th>
            {
              DAYS.map(d => {
                return(<th key={"t-"+id+"-d-"+d} className="text-uppercase"><Translation>{t => t("days."+d)}</Translation></th>)})
            }
          </tr>
        </thead>
        <tbody>
          {
            Array.from({length:24},(v,k)=>k).map(h => {
              if(h >= earliest && h < latest)
              {
                var contents = {}
                DAYS.forEach(d => {
                  if(timeTable[d][h])
                  {
                    let c = timeTable[d][h]
                    if(timeTable[d][h].startHour === h)
                      contents[d] = <td className={"day-column align-middle bg-color-"+c.color} rowSpan={c.duration}>
                                      <div>
                                        <div className="col">
                                          <b>{c.courseClass.course} - {c.courseClass.courseName}</b>
                                          <i>&nbsp;({c.courseClass.courseClass})</i>
                                        </div>
                                        <div className="col">
                                          {c.lecture.startTime}-{c.lecture.endTime}
                                        </div>
                                      </div>
                                    </td>
                  }
                  else
                    contents[d] = <td className="day-column text-uppercase bg-black"></td>
                })
                return(<tr key={"id-"+id+"h"+h} className="border-dark">
                          <td className="text-uppercase bg-primary text-white">{h+":00"}</td>
                          {DAYS.map(d => <React.Fragment key={"id-"+id+"d-"+d+"h-"+h}>{contents[d]}</React.Fragment>)}
                        </tr>)
              }
              return(<tr className="border-dark" key={"id-"+id+"h"+h}></tr>)
            })
          }
        </tbody>
      </table>
    )
  }

  onClickLeftArrow(e){
    this.setState({scheduleIndex: this.state.scheduleIndex-1})
  }

  onClickRightArrow(e){
    this.setState({scheduleIndex: this.state.scheduleIndex+1})
  }

  render(){
    if (this.state.loading === true) {
      return  <div style={{position: 'absolute', left: '50%', top: '50%',transform: 'translate(-50%, -50%)'}}>
                <Spinner animation="border" variant="primary" />
              </div>
    }
    if(this.state.error) {
      return <h1>ERROR {this.state.error}</h1>
    }
    return (
      <React.Fragment>
        <HelmetProvider>
          <Helmet><title>Results - AutoScheduler</title></Helmet>
        </HelmetProvider>
        <div className="m-5 text-black">
          <div className="d-flex justify-content-center align-items-center">
            {
              (this.state.scheduleIndex > 0)? [<i key="back-e" className="bi bi-arrow-left-circle-fill btn btn-lg arrow-button-big color-primary" onClick={this.onClickLeftArrow.bind(this)}></i>]
              :[<i key="back-d" className="bi bi-arrow-left-circle-fill btn btn-lg arrow-button-big disabled color-disabled"></i>]
            }
            <div key={"schedule-"+this.state.scheduleIndex} className="mx-3 px-5 text-center">
              <h1><Translation>{t => t("results.scheduleNumber", {value:1+this.state.scheduleIndex})}</Translation></h1>
              <p>
                <Translation>{t => t("results.recap", {days:this.state.schedules[this.state.scheduleIndex].days, hours:this.state.schedules[this.state.scheduleIndex].hours})}</Translation><br/>
                <Translation>{t => t("results.timeRange", {earliest:this.state.schedules[this.state.scheduleIndex].earliest, latest:this.state.schedules[this.state.scheduleIndex].latest})}</Translation>
              </p>
            </div>
            {
              (this.state.scheduleIndex < this.state.schedules.length-1)? [<i key="back-e" className="bi bi-arrow-right-circle-fill btn btn-lg arrow-button-big color-primary" onClick={this.onClickRightArrow.bind(this)}></i>]
              :[<i key="back-d" className="bi bi-arrow-right-circle-fill btn btn-lg arrow-button-big disabled color-disabled"></i>]
            }
          </div>
          {
            window.innerWidth>1000 &&
            <div className="container my-3 justify-content-center align-items-center">
              <div className="table-responsive">
              { this.state.tables[this.state.scheduleIndex] }
              </div>
            </div>
          }

          <div className="my-3 d-flex justify-content-center align-items-center">
            <ul className="list-unstyled row container justify-content-center">
            {
              this.state.schedules[this.state.scheduleIndex].courseClasses.map((c, cidx) => {
                return( <li key={"ci-"+cidx} className="list-item col border border-primary py-2">
                          {c.course} - {c.courseName} ({c.courseClass})
                          <ul>{c.lectures.map((l, lidx) => {
                            return(
                              <li key={"li-"+lidx}>
                                <b><Translation>{t => t("days."+l.day)}</Translation>:</b> {l.startTime}-{l.endTime} ({l.building})
                              </li>
                            );})}</ul>
                        </li>);
              })
            }
            </ul>
          </div>
          <div className="text-center"><Button><Translation>{t => t("results.newSearch")}</Translation></Button></div>
        </div>
      </React.Fragment>
    );
  }
}

export default withQuery(SearchResults);
