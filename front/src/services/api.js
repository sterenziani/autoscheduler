import { create } from 'axios';

const api = create({
    baseURL : `http://localhost:8080/`,
    timeout : 10000
})

const errorHandler = (error) => {
    return Promise.reject({ ...error })
}

const successHandler = (response) => response;

api.interceptors.response.use(response => successHandler(response), error => errorHandler(error));

export default api;
