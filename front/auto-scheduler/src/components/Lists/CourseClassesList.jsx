import React, { Component } from 'react';
import { Button, Modal, Spinner, Row, Col, Card } from 'react-bootstrap';
import { Translation } from 'react-i18next';
import ApiService from '../../services/ApiService';
import { OK, CREATED, TIMEOUT } from '../../services/ApiConstants';

class CourseClassesList extends Component {
    state = {
        loading: true,
        error: false,
        user: this.props.user,
        course: this.props.course,
        term: this.props.term,
        termClasses: null,
        courseClassToDelete: null,
        showDeleteModal: false,
    };

    componentDidMount() {
        this.loadClasses();
    }

    loadClasses() {
        ApiService.getCourseClassesForTerm(this.state.course.id, this.state.term.id).then((data) => {
            let findError = null;
            if (data && data.status && data.status !== OK && data.status !== CREATED) findError = data.status;
            if (findError) this.setState({ loading: false, error: true, status: findError });
            else this.setState({ termClasses: data, loading: false });
        });
    }

    redirectToEdit(id) {
        console.log('Redirect to /classes/' + id);
    }

    redirectToCreate() {
        console.log('Redirect to /classes/new');
    }

    deleteCourseClass() {
        if (!this.state.courseClassToDelete) return;
        ApiService.deleteCourseClass(this.state.courseClassToDelete);
        const courseClasssCopy = Object.assign({}, this.state).courseClasss;
        this.setState({
            courseClasss: courseClasssCopy,
            showDeleteModal: !this.state.showDeleteModal,
            courseClassToDelete: {},
        });
        this.loadClasses();
    }

    switchDeleteModal() {
        this.setState({ showDeleteModal: !this.state.showDeleteModal, courseClassToDelete: {} });
    }

    switchDeleteModalParam(e) {
        this.setState({ showDeleteModal: !this.state.showDeleteModal, courseClassToDelete: e });
    }

    render() {
        if (this.state.loading === true)
            return (
                <div className="mx-auto py-3">
                    <Spinner animation="border" />
                </div>
            );
        if (this.state.error) return <h1>ERROR {this.state.error}</h1>;
        return (
            <React.Fragment>
                <div className="pt-4">
                    {this.state.termClasses && this.state.termClasses.length > 0
                        ? [
                              <div key="courseClasss-list" className="my-3 container">
                                  <Row xs={1} md={2} lg={3} className="g-4 m-auto justify-content-center">
                                      {this.state.termClasses.map((entry, index) => (
                                          <Card key={'card-' + index} className="m-3 p-0">
                                              <Card.Header className="bg-white text-primary text-start py-0 pe-0 me-0">
                                                  <div className="d-flex ms-1">
                                                      <div className="text-start my-auto me-auto">
                                                          <Card.Title className="m-0 h6">
                                                              {entry.courseClass}
                                                          </Card.Title>
                                                      </div>
                                                      <div className="d-flex my-auto text-center">
                                                          <i
                                                              className="bi bi-pencil-fill btn btn-lg"
                                                              id={'edit-' + index}
                                                              onClick={() => {
                                                                  this.redirectToEdit(entry.id);
                                                              }}
                                                          ></i>
                                                          <i
                                                              className="bi bi-trash-fill btn btn-lg"
                                                              id={'trash-' + index}
                                                              onClick={() => {
                                                                  this.switchDeleteModalParam(entry);
                                                              }}
                                                          ></i>
                                                      </div>
                                                  </div>
                                              </Card.Header>
                                              <Card.Body className="bg-grey text-black">
                                                  {entry.lectures.map((l, lidx) => (
                                                      <Row key={'row-' + index + '-' + lidx}>
                                                          <Col className="text-start">
                                                              <b>
                                                                  <Translation>{(t) => t('days.' + l.day)}</Translation>
                                                                  :
                                                              </b>{' '}
                                                              {l.startTime}-{l.endTime} ({l.building})
                                                          </Col>
                                                      </Row>
                                                  ))}
                                              </Card.Body>
                                          </Card>
                                      ))}
                                  </Row>
                              </div>,
                          ]
                        : [
                              <div key="empty-list">
                                  <Translation>{(t) => t('emptyList')}</Translation>
                              </div>,
                          ]}
                </div>
                <div className="mx-auto align-items-center plus-button-container clickable">
                    <i
                        className="bi bi-plus-circle-fill btn btn-lg color-white plus-button-big"
                        onClick={() => {
                            this.redirectToCreate();
                        }}
                    ></i>
                </div>
                <Modal
                    show={this.state.showDeleteModal}
                    onHide={() => this.switchDeleteModal()}
                    className="color-warning text-black"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>
                            <Translation>{(t) => t('modal.deleteCourseClass')}</Translation>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Translation>
                            {(t) =>
                                t('modal.areYouSureClass', {
                                    code: this.state.course.internalId,
                                    name: this.state.course.name,
                                    class: this.state.courseClassToDelete.courseClass,
                                    term: this.state.term.name,
                                })
                            }
                        </Translation>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="grey"
                            onClick={() => {
                                this.switchDeleteModal();
                            }}
                        >
                            <Translation>{(t) => t('modal.cancel')}</Translation>
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                this.deleteCourseClass(this.state.courseClassToDelete);
                            }}
                        >
                            <Translation>{(t) => t('modal.delete')}</Translation>
                        </Button>
                    </Modal.Footer>
                </Modal>
            </React.Fragment>
        );
    }
}

export default CourseClassesList;
