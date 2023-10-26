import api from './api';
import Roles from '../resources/RoleConstants';
import { OK, BAD_REQUEST, NOT_FOUND, TIMEOUT, INTERNAL_ERROR, CREATED, TIMEOUT_ERROR } from '../resources/ApiConstants';

const logInEndpoint = '/';
const getActiveUserEndpoint = '/user';
const universityEndpoint = '/university';
const studentEndpoint = '/student';
const setProgramEndpoint = "student/program";

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

        const expirationDate = new Date(0)
        expirationDate.setUTCSeconds(parseUserFromJwt(token).exp);
        ExpStore.setExp(expirationDate)

        const tokenUserData = parseUserFromJwt(token)
        if(tokenUserData.role === Roles.ADMIN) {
            UserStore.setUser({
                id: tokenUserData.id,
                name: Roles.ADMIN,
                email: tokenUserData.email,
                role: tokenUserData.role
            })
            return { status: OK }
        }

        const userData = await api.get(getActiveUserEndpoint, getRequestHeaders())
        if(userData.data.role === Roles.UNIVERSITY){
            const universityData = await api.get(universityEndpoint, getRequestHeaders())
            if(universityData.status === OK)
                userData.data = {...userData.data, name: universityData.data.name, verified: universityData.data.verified, locale: universityData.data.locale}
        }
        if(userData.data.role === Roles.STUDENT){
            const studentData = await api.get(studentEndpoint, getRequestHeaders())
            if(studentData.status === OK)
                userData.data = {...userData.data, name: studentData.data.name, locale: studentData.data.locale}
        }

        UserStore.setUser(userData.data)
        return { status: OK }
    }
    catch(e) {
        if (e.response) return { status: e.response.status, data: e.response.data}
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        else return { status: INTERNAL_ERROR }
    }
}

const signUpStudent = async (name, email, password, universityId, programId) => {
    try {
        const payload = {
            'email': email,
            'password': password,
            "name": name,
            "universityId": universityId,
            "programId": programId,
            "locale": navigator.language
        }

        const createResponse = await api.post(studentEndpoint, payload, getRequestHeaders())
        if(createResponse.status !== CREATED) return createResponse

        const authenticateResponse = await logIn(email, password)
        if(authenticateResponse.status !== OK) return authenticateResponse

        const endpoint = `${setProgramEndpoint}`
        await api.put(endpoint, {"programId": programId}, getRequestHeaders())

        return createResponse
    }
    catch(e) {
        if (e.response) return { status: e.response.status, data: e.response.data}
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        else return { status: INTERNAL_ERROR }
    }
}

const signUpUniversity = async (email, password, name) => {
    try {
        const payload = {
            'email': email,
            'password': password,
            "locale": navigator.language,
            'name': name,
        }
        return await api.post(universityEndpoint, payload, getRequestHeaders())
    }
    catch(e) {
        if (e.response) return { status: e.response.status, data: e.response.data}
        if (e.code && e.code === TIMEOUT_ERROR) return { status: TIMEOUT }
        else return { status: INTERNAL_ERROR }
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

const logOut = async () => {
    deleteUserInStore();
    deleteToken();
    deleteExp();
    return { status: OK }
}

const logOutIfExpiredJwt = async () => {
    const exp = getExp()
    if(!exp)
        return false
    const now = new Date().toISOString()
    const nowEpoch = new Date(now).getTime()
    const expEpoch = new Date(exp).getTime()
    if (exp && expEpoch < nowEpoch){
        logOut()
        return true
    }
    return false
}

const isActiveUserStudent = () => {
    const user = getUserStore()
    if(user && user.role && user.role === Roles.STUDENT)
        return true
    return false
}

const AuthService   = {
    logIn          : logIn,
    signUpStudent  : signUpStudent,
    signUpUniversity: signUpUniversity,
    logOut         : logOut,
    getUserStore   : getUserStore,
    getToken       : getToken,
    getExp         : getExp,
    getRequestHeaders: getRequestHeaders,
    logOutIfExpiredJwt: logOutIfExpiredJwt,
    isActiveUserStudent: isActiveUserStudent
}

export default AuthService;
