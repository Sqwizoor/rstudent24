import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsFormData, settingsSchema } from "@/lib/schemas";
import { Form } from "./ui/form";
import { CustomFormField } from "./FormField";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Save, User, Shield, Bell, Key, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  initialData: {
    name: string;
    email: string;
    phoneNumber: string;
  };
  onSubmit: (data: any) => Promise<void>;
  userType: string;
}

const SettingsForm = ({
  initialData,
  onSubmit,
  userType,
}: SettingsFormProps) => {
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      form.reset(initialData);
    }
  };

  const handleSubmit = async (data: SettingsFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      setEditMode(false);
      toast.success("Settings updated successfully", {
        description: "Your profile information has been saved.",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });
    } catch (error) {
      toast.error("Failed to update settings", {
        description: "Please try again later."
      });
      console.error("Error updating settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!initialData.name) return userType[0].toUpperCase();
    
    const nameParts = initialData.name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  return (
    <div className="py-8 px-4 md:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="w-full bg-slate-900 dark:bg-slate-900 rounded-xl p-6 md:p-8 mb-8">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white/10 shadow-xl">
              <AvatarImage src="" alt={initialData.name || 'User'} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xl font-bold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <Badge className="absolute -bottom-2 -right-2 bg-blue-600 text-white border-none px-2 py-1">
              {userType}
            </Badge>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {initialData.name || (initialData.email && initialData.email.split('@')[0]) || userType.charAt(0).toUpperCase() + userType.slice(1)}
            </h1>
            <p className="text-gray-300 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 mb-6 w-full md:w-auto grid grid-cols-3 gap-1">
          <TabsTrigger 
            value="account" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md py-2 text-sm"
          >
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md py-2 text-sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md py-2 text-sm"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="mt-0">
          <Card className={cn("shadow-xl", "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800")}>
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Profile Information</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Update your personal details and contact information</CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <CustomFormField
                    name="name"
                    label="Full Name"
                    disabled={!editMode}
                    className="text-slate-900 dark:text-slate-100"
                  />
                  <CustomFormField
                    name="email"
                    label="Email Address"
                    type="email"
                    disabled={!editMode}
                    className="text-slate-900 dark:text-slate-100"
                  />
                  <CustomFormField
                    name="phoneNumber"
                    label="Phone Number"
                    disabled={!editMode}
                    className="text-slate-900 dark:text-slate-100"
                  />
                  
                  <div className="flex items-center justify-end gap-4 pt-4">
                    {!editMode ? (
                      <Button
                        type="button"
                        onClick={toggleEditMode}
                        variant="outline"
                        className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          onClick={toggleEditMode}
                          variant="outline"
                          className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="mr-2 h-4 w-4 bg-white/30 rounded animate-pulse" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-0">
          <Card className={cn("shadow-xl", "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800")}>
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Security Settings</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Password</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Change your password</p>
                  </div>
                  <Button variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white">
                    <Shield className="h-4 w-4 mr-2" />
                    Setup 2FA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-0">
          <Card className={cn("shadow-xl", "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800")}>
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Notification Preferences</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Email Notifications</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive updates via email</p>
                  </div>
                  <Button variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white">
                    Configure
                  </Button>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">SMS Notifications</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive updates via text message</p>
                  </div>
                  <Button variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsForm;
