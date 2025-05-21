
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new workspace route
    navigate("/workspace", { replace: true });
  }, [navigate]);

  return <div>Redirecting...</div>;
};

export default Dashboard;
