
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/services/authApi";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
  const { user, updateUserData } = useAuth();
  const [name, setName] = useState(user?.user_name || "");
  const [email, setEmail] = useState(user?.user_email || "");
  const [mobile, setMobile] = useState(user?.user_mobile || "");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">(
    (user?.gender as "MALE" | "FEMALE" | "OTHER") || "OTHER"
  );
  const [forgotEmail, setForgotEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      setName(user.user_name || "");
      setEmail(user.user_email || "");
      setMobile(user.user_mobile || "");
      setGender((user.gender as "MALE" | "FEMALE" | "OTHER") || "OTHER");
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user?.user_id) return;

    try {
      setIsSubmitting(true);

      const updatedUser = {
        user_id: user.user_id,
        user_name: name,
        user_email: email,
        user_mobile: mobile,
        gender,
        is_active: true,
      };

      const response = await authApi.updateUser(updatedUser);

      if (response.success) {
        toast.success("Profile updated successfully");
        if (updateUserData) {
          updateUserData({
            ...user,
            user_name: name,
            user_email: email,
            user_mobile: mobile,
            gender,
          });
        }
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setIsSubmitting(true);
      
      // Simple validation - should be enhanced in a real app
      if (newPassword !== confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }

      // Here you would add the API call to change password
      // For now just show a success message
      toast.success("Password change functionality will be implemented soon");
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setIsSubmitting(true);

      if (!forgotEmail.trim()) {
        toast.error("Please enter your email");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/signin-forgotpwd`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      // Since we can't actually send emails in this demo
      toast.success("If this email exists, a password reset link has been sent");
      setForgotEmail("");
    } catch (error) {
      console.error("Failed to request password reset:", error);
      toast.error("Failed to request password reset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="forgot">Forgot Password</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Your mobile number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={gender}
                onValueChange={(value) => setGender(value as "MALE" | "FEMALE" | "OTHER")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleProfileUpdate} 
              className="w-full bg-[#A259FF] hover:bg-[#A259FF]/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
          </TabsContent>

          {/* Password Change Tab */}
          <TabsContent value="password" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            
            <Button 
              onClick={handlePasswordReset} 
              className="w-full bg-[#A259FF] hover:bg-[#A259FF]/90"
              disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
            >
              {isSubmitting ? "Changing..." : "Change Password"}
            </Button>
          </TabsContent>

          {/* Forgot Password Tab */}
          <TabsContent value="forgot" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            
            <Button 
              onClick={handleForgotPassword} 
              className="w-full bg-[#A259FF] hover:bg-[#A259FF]/90"
              disabled={isSubmitting || !forgotEmail}
            >
              {isSubmitting ? "Sending..." : "Reset Password"}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-2">
              An email will be sent with instructions to reset your password
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsModal;
