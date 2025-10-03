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
import { useCreateApplicationMutation, useGetAuthUserQuery, useGetRoomQuery, useGetPropertyQuery } from "@/state/api";
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
  const { data: authUser } = useGetAuthUserQuery();
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
    if (!roomId || !roomData) {
      return; // No redirect if no room data
    }

    const { redirectType, whatsappNumber, customLink } = roomData;

    if (!redirectType || redirectType === 'NONE') {
      return; // No redirect configured
    }

    const message = generateWhatsAppMessage();

    if (redirectType === 'WHATSAPP' && whatsappNumber) {
      // Redirect to WhatsApp
      const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    } else if (redirectType === 'CUSTOM_LINK' && customLink) {
      // Redirect to custom link
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
        window.open(whatsappUrl, '_blank');
      } else if (customLink) {
        window.open(customLink, '_blank');
      }
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
    if (!authUser || authUser.userRole !== "tenant") {
      toast.error("Authentication Required", {
        description: "You must be logged in as a tenant to submit an application",
        action: {
          label: "Login",
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
        tenantCognitoId: authUser.cognitoInfo.userId,
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
      
      const submitted = false;
      
      // Submitting application via direct fetch
      console.log('Submitting application via direct fetch...');
      
      // Get a fresh token from Amplify Auth
      let token = '';
      try {
        const session = await fetchAuthSession();
        token = session.tokens?.idToken?.toString() || '';
        console.log('Successfully retrieved token from Amplify');
      } catch (authError) {
        console.error('Error fetching auth token:', authError);
        toast.error("Authentication Error", {
          description: "Failed to retrieve authentication token. Please log in again."
        });
        return;
      }
      
      if (!token) {
        toast.error("Authentication Error", {
          description: "You need to be logged in to submit an application. Please log in and try again."
        });
        return;
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
        tenantCognitoId: authUser.cognitoInfo.userId,
      };
      
      console.log('Application data being submitted:', finalFormattedData);
      
      // Send the application data to the server
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalFormattedData),
        credentials: 'include'
      });
      
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
      
      // Handle redirect based on room settings
      const hasRedirect = roomData?.redirectType && roomData.redirectType !== 'NONE';
      
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
        setTimeout(() => {
          handlePostApplicationRedirect();
        }, 500);
      }
    } catch (error) {
      console.error('Application submission error:', error);
      toast.error("Submission Failed", {
        description: `There was an error submitting your application: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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