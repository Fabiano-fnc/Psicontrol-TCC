import { useEffect } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

const Token = (props) => {
  const navigate = useNavigate();

  const search = useLocation().search;
  const token = new URLSearchParams(search).get("token");
  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    localStorage.setItem("authentication_token", token);
    navigate("/select-calendar", { replace: true });
  }, [token, navigate]);

  return null;
};

export default Token;
