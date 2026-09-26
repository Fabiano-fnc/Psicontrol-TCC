import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "./session";

const RequireAuth = () => {
  if (!getToken()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default RequireAuth;
