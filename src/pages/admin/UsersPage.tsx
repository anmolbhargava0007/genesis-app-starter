
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import UserTable from "@/components/admin/UserTable";

const UsersPage = () => {
  const { userRole } = useAuth();

  // Redirect if not a super admin
  if (userRole !== 1) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      <div className="bg-white rounded-md shadow">
        <div className="p-6">
          <UserTable />
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
