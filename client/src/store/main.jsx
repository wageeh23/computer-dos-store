import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrefsProvider } from '../shared/prefs.jsx';
import { ToastProvider } from '../shared/toast.jsx';
import { BuildProvider } from './build.jsx';
import StoreLayout from './StoreLayout.jsx';
import Landing from './pages/Landing.jsx';
import Shop from './pages/Shop.jsx';
import Builder from './pages/Builder.jsx';
import Bundles from './pages/Bundles.jsx';
import Streamer from './pages/Streamer.jsx';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrefsProvider>
      <ToastProvider>
        <BuildProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<Landing />} />
                <Route path="shop" element={<Shop />} />
                <Route path="builder" element={<Builder />} />
                <Route path="bundles" element={<Bundles />} />
                <Route path="streamer" element={<Streamer />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </BuildProvider>
      </ToastProvider>
    </PrefsProvider>
  </React.StrictMode>
);
