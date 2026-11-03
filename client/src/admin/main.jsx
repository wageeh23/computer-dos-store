import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PrefsProvider } from '../shared/prefs.jsx';
import { ToastProvider } from '../shared/toast.jsx';
import { getToken } from './api.js';
import Layout from './Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import Products from './pages/Products.jsx';
import Bundles from './pages/Bundles.jsx';
import AdminBuilder from './pages/AdminBuilder.jsx';
import InvoiceForm from './pages/InvoiceForm.jsx';
import Invoices from './pages/Invoices.jsx';
import InvoiceView from './pages/InvoiceView.jsx';
import Parties from './pages/Parties.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import Settings from './pages/Settings.jsx';
import '../index.css';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrefsProvider>
      <ToastProvider>
        <BrowserRouter basename="/admin">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="builder" element={<AdminBuilder />} />
              <Route path="products" element={<Products />} />
              <Route path="bundles" element={<Bundles />} />
              <Route path="sale/new" element={<InvoiceForm type="sale" />} />
              <Route path="purchase/new" element={<InvoiceForm type="purchase" />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/:id" element={<InvoiceView />} />
              <Route path="parties" element={<Parties />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </PrefsProvider>
  </React.StrictMode>
);
