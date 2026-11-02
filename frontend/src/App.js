import React from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/LoginPage/Login";
import Token from "./utils/token/token";
import SelectCalendarPage from "./pages/SelectCalendarPage/SelectCalendarPage";
import Dashboard from "./pages/DashboardPage/Dashboard";
import CustomersPage from "./pages/CustomerPage/CustomersPage";
import IncomePage from "./pages/IncomePage/IncomePage";
import Layout from "./utils/Layout/layout";
import Toaster from "./utils/notification/Toaster";
import ArchivedPage from "./pages/ArchivedPage/ArchivedPage";
import UserPage from "./pages/UserPage/UserPage";
import ProfileCustomerPage from "./pages/ProfileCustomerPage/ProfileCustomerPage";
import RequireAuth from "./utils/auth/RequireAuth";

const App = () => {
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/token" element={<Token />} />
        <Route element={<RequireAuth />}>
          <Route path="/select-calendar" element={<SelectCalendarPage />} />
          <Route element={<Layout />}>
            <Route path="/create-event-form" element={<Dashboard />} />
            <Route path="/customers" element={<CustomersPage />} />
            {/* O cadastro fica em /customers; a rota antiga só abre o formulário lá */}
            <Route
              path="/create-customer"
              element={
                <Navigate to="/customers" replace state={{ newCustomer: {} }} />
              }
            />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/archived" element={<ArchivedPage />} />
            <Route path="/user" element={<UserPage />} />
            <Route
              path="/customers/:customerId/profile"
              element={<ProfileCustomerPage />}
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
