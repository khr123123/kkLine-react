import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@ant-design/v5-patch-for-react-19';
import './styles/global.scss';
import { message } from 'antd';

message.config({
  maxCount: 3,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
