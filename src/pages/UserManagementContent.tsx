
import React from "react";
import UserTable from "@/components/admin/UserTable";

const UserManagementContent = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      <div className="bg-card rounded-md shadow">
        <div className="p-6">
          <UserTable />
        </div>
      </div>
    </div>
  );
};

export default UserManagementContent;
