import { CustomFormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ApplicationFormData, applicationSchema } from "@/lib/schemas";
import { useCreateApplicationMutation, useGetRoomQuery, useGetPropertyQuery } from "@/state/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { ApplicationStatus } from "@/types/prismaTypes";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
// Used for direct token import in the fallback authentication path
import { fetchAuthSession } from "aws-amplify/auth";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  roomId?: number;
  roomName?: string;
}

const ApplicationModal = ({
  isOpen,
  onClose,
  propertyId,
  roomId,
  roomName,
}: ApplicationModalProps) => {
  const [createApplication] = useCreateApplicationMutation();
  const { user: authUser, isAuthenticated } = useUnifiedAuth();
  const { data: roomData } = useGetRoomQuery({ propertyId, roomId: roomId! }, { skip: !roomId });
  const { data: propertyData } = useGetPropertyQuery(propertyId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to generate WhatsApp message with property and room info
  const generateWhatsAppMessage = () => {
    const property = propertyData;
    const room = roomData;
    
    let message = `Hi! I just submitted an application for `;
    
    if (room) {
      message += `${room.name} at ${property?.name || 'your property'}. `;
      message += `\n\nRoom Details:\n`;
      message += `- Price: R${room.pricePerMonth}/month\n`;
      if (room.securityDeposit && room.securityDeposit > 0) {
        message += `- Security Deposit: R${room.securityDeposit}\n`;
      }
      if (room.topUp && room.topUp > 0) {
        message += `- Top-up: R${room.topUp}\n`;
      }
      message += `- Room Type: ${room.roomType}\n`;
      message += `- Capacity: ${room.capacity} person(s)\n`;
    } else {
      message += `${property?.name || 'your property'}. `;
      message += `\n\nProperty Price: R${property?.price}/month\n`;
    }
    
    if (property?.location) {
      message += `- Location: ${property.location.address}, ${property.location.city}\n`;
    }
    
    message += `\nI'm interested in viewing the property and would like to discuss the application process. Thank you!`;
    
    return encodeURIComponent(message);
  };

  // Function to handle redirect after successful application
  const handlePostApplicationRedirect = () => {
    // Only rooms have redirect settings, not properties
    if (!roomData) {
      console.log('No room data available - redirect only works for room applications');
      return; // No redirect data available for property-level applications
    }

    const { redirectType, whatsappNumber, customLink } = roomData;

    if (!redirectType || redirectType === 'NONE') {
      console.log('No redirect configured or redirect type is NONE');
      return; // No redirect configured
    }

    console.log('Redirect configured:', { redirectType, whatsappNumber: !!whatsappNumber, customLink: !!customLink });
    const message = generateWhatsAppMessage();

    if (redirectType === 'WHATSAPP' && whatsappNumber) {
      // Redirect to WhatsApp
      const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
      console.log('Opening WhatsApp URL:', whatsappUrl);
      window.open(whatsappUrl, '_blank');
    } else if (redirectType === 'CUSTOM_LINK' && customLink) {
      // Redirect to custom link
      console.log('Opening custom link:', customLink);
      window.open(customLink, '_blank');
    } else if (redirectType === 'BOTH') {
      // Show both options in the success toast
      if (whatsappNumber && customLink) {
        toast.success("Application Submitted Successfully!", {
          description: "Choose how you'd like to continue:",
          action: {
            label: "WhatsApp",
            onClick: () => {
              const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
              window.open(whatsappUrl, '_blank');
            }
          },
          // Add custom link button through DOM manipulation or use a custom toast
          duration: 10000, // Keep toast longer for user to make choice
        });
        
        // Create a secondary action for the custom link
        setTimeout(() => {
          toast.info("Or visit the landlord's website:", {
            action: {
              label: "Visit Website",
              onClick: () => window.open(customLink, '_blank')
            },
            duration: 8000,
          });
        }, 1000);
      } else if (whatsappNumber) {
        const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
        console.log('Opening WhatsApp URL from BOTH option:', whatsappUrl);
        window.open(whatsappUrl, '_blank');
      } else if (customLink) {
        console.log('Opening custom link from BOTH option:', customLink);
        window.open(customLink, '_blank');
      }
    } else {
      console.log('No valid redirect configuration found:', { redirectType, whatsappNumber: !!whatsappNumber, customLink: !!customLink });
    }
  };

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      message: "",
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    console.log('onSubmit called with data:', data);
    
    // Debug logging to see authentication state
    console.log('Debug - Auth state:', {
      isAuthenticated,
      authUser: authUser ? {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
        provider: authUser.provider
      } : null
    });

    if (!isAuthenticated || !authUser) {
      console.error('Authentication failed:', {
        isAuthenticated,
        hasAuthUser: !!authUser,
        userRole: authUser?.role
      });
      
      toast.error("Authentication Required", {
        description: "You must be logged in to submit an application",
        action: {
          label: "Login",
          onClick: () => window.location.href = "/signin"
        }
      });
      return;
    }

    // Allow tenants and students to apply (reject managers and admins)
    if (authUser.role === "manager" || authUser.role === "admin") {
      console.error('Invalid user role for application:', authUser.role);
      
      toast.error("Access Denied", {
        description: "Only students can submit applications",
        action: {
          label: "Login as Student",
          onClick: () => window.location.href = "/signin"
        }
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare application data with explicit typing
      const applicationData = {
        ...data,
        applicationDate: new Date().toISOString(),
        // Use the enum value directly - this is what the API expects
        status: ApplicationStatus.Pending,
        // Always ensure propertyId is a number
        propertyId: typeof propertyId === 'string' ? parseInt(propertyId) : Number(propertyId),
        tenantCognitoId: authUser.cognitoInfo?.userId || authUser.id || authUser.email || '',
      };
      
      // Detailed logging for debugging
      console.log('Application data structure:', JSON.stringify(applicationData, null, 2));
      console.log('Property ID type:', typeof applicationData.propertyId);
      console.log('tenantCognitoId present:', !!applicationData.tenantCognitoId);
      
      // Ensure propertyId is a number
      if (isNaN(applicationData.propertyId as number)) {
        toast.error("Invalid Property", {
          description: "Failed to identify property. Please try again."
        });
        return;
      }
      
      // Debug log to verify data
      console.log('Preparing to submit application:', applicationData);
      
      // Try to get Cognito token for managers, but don't fail for students
      let token = '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Only try to get Cognito token if user is authenticated via Cognito
      if (authUser.provider === 'cognito') {
        try {
          const session = await fetchAuthSession();
          token = session.tokens?.idToken?.toString() || '';
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Using Cognito token for authentication');
          }
        } catch (authError) {
          console.error('Failed to get Cognito token for manager:', authError);
        }
      } else {
        console.log('Using session-based auth for students (NextAuth/Google)');
        // For students using NextAuth/Google, don't need to set Authorization header
        // The server will check NextAuth session automatically
      }
      
      // Prepare the application data with proper types
      const currentDate = new Date().toISOString();
      const finalFormattedData = {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        message: data.message,
        applicationDate: currentDate,
        createdAt: currentDate, // Add createdAt for display in applications page
        status: ApplicationStatus.Pending,
        propertyId: Number(propertyId),
        roomId: roomId ? Number(roomId) : undefined,
        tenantCognitoId: applicationData.tenantCognitoId,
      };
      
      console.log('Application data being submitted:', finalFormattedData);
      console.log('Request headers:', headers);
      
      // Send the application data to the server
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers,
        body: JSON.stringify(finalFormattedData),
        credentials: 'include' // Important for NextAuth session cookies
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = `Failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Application submission failed:', response.status, errorData);
          errorMessage = `${errorMessage}: ${errorData.message || JSON.stringify(errorData)}`;
        } catch (e) {
          // If not JSON, try to get text
          const errorText = await response.text();
          console.error('Application submission failed (non-JSON):', response.status, errorText);
          errorMessage = `${errorMessage}: ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('Application submission successful:', responseData);
      
      // Handle redirect based on room settings (only rooms have redirect settings)
      const hasRedirect = roomData?.redirectType && roomData.redirectType !== 'NONE';
      
      console.log('Checking for redirect:', { 
        hasRoomData: !!roomData, 
        hasPropertyData: !!propertyData, 
        redirectType: roomData?.redirectType,
        hasRedirect 
      });
      
      if (hasRedirect) {
        toast.success("Application Submitted Successfully!", {
          description: "Redirecting you to contact the landlord..."
        });
      } else {
        toast.success("Application Submitted", {
          description: "Your application has been successfully submitted."
        });
      }
      
      onClose();
      
      // Delay redirect slightly to allow modal to close
      if (hasRedirect) {
        console.log('Starting redirect in 500ms');
        setTimeout(() => {
          handlePostApplicationRedirect();
        }, 500);
      } else {
        console.log('No redirect configured');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      toast.error("Submission Failed", {
        description: `There was an error submitting your application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 10000, // Keep error visible longer
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader className="mb-4">
          <DialogTitle>
            {roomName ? `Apply for ${roomName}` : 'Submit Application for this Property'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(
            (data) => {
              console.log('Form validation passed, calling onSubmit');
              onSubmit(data);
            },
            (errors) => {
              console.error('Form validation failed:', errors);
              toast.error("Form Validation Error", {
                description: "Please check your form inputs and try again."
              });
            }
          )} className="space-y-5">
            <CustomFormField
              name="name"
              label="Name"
              type="text"
              placeholder="Enter your full name"
            />
            <CustomFormField
              name="email"
              label="Email"
              type="email"
              placeholder="Enter your email address"
            />
            <CustomFormField
              name="phoneNumber"
              label="Phone Number"
              type="text"
              placeholder="Enter your phone number"
            />
            <CustomFormField
              name="message"
              label="Message (Optional)"
              type="textarea"
              placeholder="Enter any additional information"
            />
            <Button 
              type="submit" 
              className="bg-primary-700 text-white w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;