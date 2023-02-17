import React from 'react';
import AuthService from '../../services/AuthService';
import { reaction } from 'mobx';

const withUser = (WrappedComponent, config) => {
    return (class extends React.Component {
        constructor(props){
            super(props)

            const userStore = AuthService.getUserStore()
            this.state = {}
            this.state.userIsLoggedIn = userStore.isLoggedIn
            this.state.user           = userStore.user

            reaction(
                () => userStore.user,
                () => this.setState({
                    userIsLoggedIn : userStore.isLoggedIn,
                    user           : userStore.user
                })
            )
        }
        render(){
            return <WrappedComponent user={ this.state.user } userIsLoggedIn={ this.state.userIsLoggedIn } {...this.props} />
        }
    })
}

export default withUser;
