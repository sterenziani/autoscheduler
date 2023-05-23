import http from 'http';
import app from './app';

const server = http.createServer(app);

const start = async () => {
    server.listen(3000, () => console.log(`[Initialization] server up and running in port 3000`));
};

start()
    .then()
    .catch((err) => console.log(err));
