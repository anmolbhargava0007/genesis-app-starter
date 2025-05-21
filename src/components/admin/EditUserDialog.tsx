
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserForManagement } from "@/types/auth";
import { authApi } from "@/services/authApi";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserForManagement | null;
  onUserUpdated: () => void;
}

const formSchema = z.object({
  user_name: z.string().min(2, "Name must be at least 2 characters"),
  user_email: z.string().email("Invalid email address"),
  user_mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    required_error: "Please select a gender",
  }),
  is_active: z.boolean(),
});

const EditUserDialog = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}: EditUserDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_name: user?.user_name || "",
      user_email: user?.user_email || "",
      user_mobile: user?.user_mobile || "",
      gender: (user?.gender as "MALE" | "FEMALE" | "OTHER") || "MALE",
      is_active: user?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        user_name: user.user_name,
        user_email: user.user_email,
        user_mobile: user.user_mobile,
        gender: user.gender as "MALE" | "FEMALE" | "OTHER",
        is_active: user.is_active,
      });
    }
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !user.user_id) return;
    
    setIsLoading(true);
    try {
      const userData: UserForManagement = {
        user_id: user.user_id, // Ensure user_id is provided and not optional
        user_name: values.user_name,
        user_email: values.user_email,
        user_mobile: values.user_mobile,
        gender: values.gender,
        is_active: values.is_active,
      };
      
      const response = await authApi.updateUser(userData);
      
      if (response.success) {
        toast.success("User updated successfully");
        onUserUpdated();
        onClose();
      } else {
        toast.error(response.msg || "Failed to update user");
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Make changes to the user's information here.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="accent-primary h-5 w-5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
