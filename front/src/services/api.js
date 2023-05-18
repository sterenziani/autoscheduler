import axios from 'axios';
import AuthService from './AuthService'

const api = axios.create({
    baseURL : process.env.REACT_APP_API_URL,
    timeout : 10000
})

const errorHandler = (error) => {
    return Promise.reject({ ...error })
}

const successHandler = (response) => response;

api.interceptors.request.use(function (config) {
    // Do something before request is sent
    AuthService.logOutIfExpiredJwt()
    return config
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });

api.interceptors.response.use(response => successHandler(response), error => errorHandler(error));

export default api;
