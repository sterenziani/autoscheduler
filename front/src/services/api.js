import axios from 'axios';
import AuthService from './AuthService'

let apiBaseUrl = 'http://auto-scheduler.xyz/api';
if (process.env.REACT_APP_API_URL !== undefined && process.env.REACT_APP_API_URL !== '') apiBaseUrl = process.env.REACT_APP_API_URL;

const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
      'Content-Type': 'application/json'
    }
});

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
