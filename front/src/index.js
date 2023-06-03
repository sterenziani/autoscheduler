import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './services/i18n';
import * as dotenv from 'dotenv';

dotenv.config();

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
