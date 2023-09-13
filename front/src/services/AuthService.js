import api from './api';
import Roles from '../resources/RoleConstants';
import { OK, BAD_REQUEST, NOT_FOUND, TIMEOUT, CREATED } from './ApiConstants';

const logInEndpoint = '/';
const signUpUniversityEndpoint = '/university';
const signUpStudentEndpoint = '/student';

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

const getUserStore = () => {
    return UserStore.getUser();
}

const getExp = () => {
    return ExpStore.getExp();
}

const deleteUserInStore = () => {
    UserStore.removeUser()
}

const getRequestHeaders = () => {
    const headerToken = getToken()
    if(!headerToken)
        return { headers : {'Content-Type': 'application/json'} }
    return {
        headers : { 'Content-Type': 'application/json', authorization: "Bearer "+headerToken}
    }
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

const logIn = async (email, password) => {
    try {
        const credentials = {
            'email': email,
            'password': password
        }
        const response = await api.post(logInEndpoint, credentials, getRequestHeaders())
        if(response.status === BAD_REQUEST) {
            return { status: BAD_REQUEST, code: response.body.code }
        }
        token = response.headers.authorization
        if (!token)
            return { status: NOT_FOUND }
        TokenStore.setToken(token)

        let expirationDate = new Date(0)
        expirationDate.setUTCSeconds(parseUserFromJwt(token).exp);
        ExpStore.setExp(expirationDate)

        const tokenUserData = parseUserFromJwt(token)
        if(tokenUserData.role == Roles.ADMIN) {
            UserStore.setUser({
                id: tokenUserData.id,
                name: Roles.ADMIN,
                email: tokenUserData.email,
                role: tokenUserData.role
            })
            return { status: OK }
        }

        const endpoint = tokenUserData.role.toLowerCase() +'/'+ tokenUserData.id
        const userData = await api.get(endpoint, getRequestHeaders())
        UserStore.setUser(userData.data)
        return { status: OK }
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status, data: e.response.data}
        else
            return { status: TIMEOUT }
    }
}

const signUpStudent = async (name, email, password, universityId, programId) => {
    try {
        const payload = {
            'email': email,
            'password': password,
            "programId": programId,
            "name": name
        }
        const response = await api.post(signUpStudentEndpoint, payload, getRequestHeaders())
        return { status: CREATED }
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status, data: e.response.data}
        else
            return { status: TIMEOUT }
    }
}

const signUpUniversity = async (email, password, name) => {
    try {
        const payload = {
            'email': email,
            'password': password,
            'name': name,
        }
        const response = await api.post(signUpUniversityEndpoint, payload, getRequestHeaders())
        return { status: CREATED }
    }
    catch(e) {
        if (e.response)
            return { status: e.response.status, data: e.response.data}
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
        TokenStore.setToken(token)
        UserStore.setUser(response.data)

        let expirationDate = new Date(0)
        expirationDate.setUTCSeconds(parseUserFromJwt(token).exp)
        ExpStore.setExp(expirationDate)

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

const logOutIfExpiredJwt = async () => {
    let exp = getExp()
    if(!exp)
        return false
    let now = new Date().toISOString()
    let nowEpoch = new Date(now).getTime()
    let expEpoch = new Date(exp).getTime()
    if (exp && expEpoch < nowEpoch){
        logOut()
        return true
    }
    return false
}

const AuthService   = {
    logIn          : logIn,
    logInWithStore : logInWithStore,
    signUpStudent  : signUpStudent,
    signUpUniversity: signUpUniversity,
    logOut         : logOut,
    getUserStore   : getUserStore,
    getToken       : getToken,
    getExp         : getExp,
    getRequestHeaders: getRequestHeaders,
    logOutIfExpiredJwt: logOutIfExpiredJwt
}

export default AuthService;
