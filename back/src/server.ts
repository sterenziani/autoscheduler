import http from 'http';
import app from './app';

const server = http.createServer(app);

const start = async () => {
    server.listen(process.env.PORT, () =>
        console.log(`[Initialization] server up and running in port ${process.env.PORT}`),
    );
};

start()
    .then()
    .catch((err) => console.log(err));
