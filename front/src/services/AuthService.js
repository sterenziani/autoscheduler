import api from './api';
import { observable, reaction } from 'mobx';
import { OK, BAD_REQUEST, TIMEOUT } from './ApiConstants';

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

const ExpStore = {
    setExp: exp => localStorage.setItem('exp', JSON.stringify(exp)),
    getExp: () => JSON.parse(localStorage.getItem('exp')),
    removeExp: () => localStorage.removeItem('exp')
}

const userStore = observable({
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

const getExp = () => {
    return ExpStore.getExp();
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
const deleteExp = () => {
    ExpStore.removeExp();
}

const logInEndpoint = '/';

const logIn = async (email, password) => {
    try {
        const credentials = {
            'email': email,
            'password': password
        }
        const response = await api.post(logInEndpoint, credentials, {
            headers : {'Content-Type' : 'application/json'}
        })
        if(response.status === BAD_REQUEST)
            return { status: BAD_REQUEST }
        token = response.headers.authorization
        TokenStore.setToken(token)

        let expirationDate = new Date(0)
        expirationDate.setUTCSeconds(parseUserFromJwt(token).exp);
        ExpStore.setExp(expirationDate)

        const userData = await api.get('student/'+parseUserFromJwt(token).id, { headers: { 'Content-Type': 'application/json' , authorization: "Bearer "+token}})
        UserStore.setUser(userData.data)
        return { status: OK }
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status }
        else
            return { status: TIMEOUT }
    }
}

const parseUserFromJwt = (token) => {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
};

// Calls the login endpoint with its current token in header instead of user:pass as body
const logInWithStore = async () => {
    const savedToken = TokenStore.getToken()
    const savedUser  = UserStore.getUser()
    if(!savedToken && !savedUser)
        return { status : OK }
    try {
        const response = await api.get(logInEndpoint, {
            headers : { authorization : savedToken }
        })
        if(response.status === BAD_REQUEST)
            return { status: BAD_REQUEST }
        token = response.headers.authorization
        userStore.user = response.data
        TokenStore.setToken(token)

        let expirationDate = new Date(0)
        expirationDate.setUTCSeconds(parseUserFromJwt(token).exp)
        ExpStore.setExp(expirationDate)

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
    deleteExp();
    return { status: OK }
}

const logOutIfExpiredJwt = async (email, password) => {
    let exp = getExp()
    if(!exp)
        return
    let now = new Date().toISOString()
    let nowEpoch = new Date(now).getTime()
    let expEpoch = new Date(exp).getTime()
    if (exp && expEpoch < nowEpoch)
        logOut()
}

const AuthService   = {
    logIn          : logIn,
    logInWithStore : logInWithStore,
    logOut         : logOut,
    getUserStore   : getUserStore,
    getToken       : getToken,
    getExp         : getExp,
    logOutIfExpiredJwt: logOutIfExpiredJwt
}

export default AuthService;
