
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { authApi } from "@/services/authApi";
import { UserForManagement } from "@/types/auth";
import EditUserDialog from "./EditUserDialog";
import { toast } from "sonner";
import ChatHistoryDialog from "./ChatHistoryDialog";

const UserTable = () => {
  const [users, setUsers] = useState<UserForManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserForManagement | null>(null);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await authApi.getUsers(2); // GUEST users
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: UserForManagement) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleRoleHistory = (userId: number) => {
    setViewingUserId(userId);
    setIsHistoryDialogOpen(true);
  };

  const handleUserUpdated = () => {
    fetchUsers();
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse">Loading users...</div>
        </div>
      ) : (
        <Table>
          <TableCaption>List of guest users in the system</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.No.</TableHead>
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-24 text-center">Role History</TableHead>
              <TableHead className="w-16 text-center">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{user.user_id}</TableCell>
                  <TableCell>{user.user_name}</TableCell>
                  <TableCell>{user.user_email}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRoleHistory(user.user_id)}
                    >
                      History
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Edit User Dialog */}
      <EditUserDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        user={editingUser}
        onUserUpdated={handleUserUpdated}
      />

      {/* Chat History Dialog */}
      {viewingUserId && (
        <ChatHistoryDialog
          isOpen={isHistoryDialogOpen}
          onClose={() => setIsHistoryDialogOpen(false)}
          userId={viewingUserId}
        />
      )}
    </div>
  );
};

export default UserTable;
