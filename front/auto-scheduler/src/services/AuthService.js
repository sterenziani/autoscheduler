import api from './api';
import { observable, reaction } from 'mobx';
import { OK, UNAUTHORIZED, TIMEOUT } from './ApiConstants';

const endpoint = '/users';

const TokenStore = {
    setToken: token => localStorage.setItem('token', token),
    getToken: () => localStorage.getItem('token'),
    removeToken: () => localStorage.removeItem('token')
}

const UserStore = {
    setUser: user => localStorage.setItem('user', JSON.stringify(user)),
    getUser: () => JSON.parse(localStorage.getItem('user')),
    removeUser: () => localStorage.removeItem('user')
}

let userStore = observable({
    user: undefined,
    isLoggedIn: false
});

reaction(
    () => userStore.user,
    () => {
        if(!userStore.user)
            userStore.isLoggedIn = false
        else
            userStore.isLoggedIn = true
    }
)

const getUserStore = () => {
    if(!userStore.user)
        userStore.user = UserStore.getUser();
    return userStore;
}

const deleteUserInStore = () => {
    if(userStore.user)
        userStore.user = undefined;
    UserStore.removeUser()
}

let token;
const getToken = () => {
    if(!token)
        token = TokenStore.getToken();
    return token;
}
const deleteToken = () => {
    if(token)
        token = undefined;
    TokenStore.removeToken();
}

const logInEndpoint = endpoint + '/login';

const logIn = async (username, password) => {
    try {
        const response = await api.get(logInEndpoint, {
            headers : {
                authorization : 'Basic ' + btoa(username + ":" + password)
            }
        })
        if(response.status === UNAUTHORIZED)
            return { status: UNAUTHORIZED }
        token = response.headers.authorization;
        userStore.user = response.data;
        TokenStore.setToken(token);
        UserStore.setUser(userStore.user);
        return { status: OK }
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const logInWithStore = async () => {
    const savedToken = TokenStore.getToken()
    const savedUser  = UserStore.getUser()
    if(!savedToken && !savedUser)
        return { status : OK }
    try {
        const response = await api.get(logInEndpoint, {
            headers : {
                authorization : savedToken
            }
        })
        token = response.headers.authorization;
        userStore.user = response.data;
        TokenStore.setToken(token);
        UserStore.setUser(userStore.user);
        return { status: OK }
    }
    catch(e) {
        logOut();
        if (e.response) {
            return { status: e.response.status }
        } else {
            return { status: TIMEOUT }
        }
    }
}

const logOut = async () => {
    deleteUserInStore();
    deleteToken();
    return { status: OK }
}

const AuthService   = {
    logIn          : logIn,
    logInWithStore : logInWithStore,
    logOut         : logOut,
    getUserStore   : getUserStore,
    getToken       : getToken
}

export default AuthService;
