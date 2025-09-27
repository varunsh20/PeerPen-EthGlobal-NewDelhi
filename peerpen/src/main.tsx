import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThirdwebProvider } from "thirdweb/react";
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThirdwebProvider>
      <ChakraProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChakraProvider>
    </ThirdwebProvider>
  </React.StrictMode>
);