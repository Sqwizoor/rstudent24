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
import { useCreateApplicationMutation, useGetRoomQuery, useGetPropertyQuery, useGetRoomsQuery } from "@/state/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { ApplicationStatus } from "@/types/prismaTypes";
import { RedirectTypeEnum } from "@/lib/constants";
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
  const { data: roomsData } = useGetRoomsQuery(propertyId);
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
    console.log('=== REDIRECT DEBUG START ===');
    console.log('Room Data:', JSON.stringify(roomData, null, 2));
    console.log('Property Data:', JSON.stringify(propertyData, null, 2));
    console.log('Rooms Data:', JSON.stringify(roomsData, null, 2));
    console.log('Room ID from props:', roomId);
    console.log('Property ID from props:', propertyId);
    
    let redirectData = null;
    
    // For specific room applications, use room data directly
    if (roomData) {
      console.log('FOUND ROOM DATA - checking redirect settings');
      console.log('Room redirect details:', {
        redirectType: roomData.redirectType,
        whatsappNumber: roomData.whatsappNumber,
        customLink: roomData.customLink
      });
      redirectData = roomData;
    } 
    // For property-level applications, try to use the first available room's redirect settings
    else if (propertyData && roomsData && roomsData.length > 0) {
      console.log('PROPERTY APPLICATION - looking for redirect settings from available rooms');
      
      // Find the first room that has redirect settings
      const roomWithRedirect = roomsData.find(room => {
        console.log(`Checking room ${room.name}:`, {
          redirectType: room.redirectType,
          hasWhatsapp: !!room.whatsappNumber,
          hasCustomLink: !!room.customLink
        });
        return room.redirectType && room.redirectType !== RedirectTypeEnum.NONE && (room.whatsappNumber || room.customLink);
      });
      
      if (roomWithRedirect) {
        console.log('FOUND ROOM WITH REDIRECT:', roomWithRedirect.name);
        redirectData = roomWithRedirect;
      }
    }

    if (!redirectData) {
      console.log('NO REDIRECT DATA AVAILABLE - showing fallback message');
      toast.success("Application submitted successfully! The property manager will contact you soon.");
      return;
    }

    const { redirectType, whatsappNumber, customLink } = redirectData;

    console.log('REDIRECT DATA FOUND:', { 
      redirectType, 
      whatsappNumber, 
      customLink,
      hasWhatsapp: !!whatsappNumber,
      hasCustomLink: !!customLink
    });

    if (!redirectType || redirectType === RedirectTypeEnum.NONE) {
      console.log('REDIRECT TYPE IS NONE OR MISSING - showing fallback message');
      toast.success("Application submitted successfully! The property manager will contact you soon.");
      return;
    }

    console.log('PROCEEDING WITH REDIRECT - Type:', redirectType);
    const message = generateWhatsAppMessage();

    // Priority: WhatsApp if number exists, otherwise custom link
    if (redirectType === RedirectTypeEnum.WHATSAPP && whatsappNumber) {
      // Redirect to WhatsApp
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
      console.log('REDIRECTING TO WHATSAPP:', whatsappUrl);
      console.log('Clean WhatsApp number:', cleanNumber);
      toast.success("Redirecting to WhatsApp...");
      setTimeout(() => {
        console.log('Opening WhatsApp window NOW');
        window.open(whatsappUrl, '_blank');
      }, 500);
    } else if (redirectType === RedirectTypeEnum.CUSTOM_LINK && customLink) {
      // Redirect to custom link
      console.log('REDIRECTING TO CUSTOM LINK:', customLink);
      toast.success("Redirecting to property contact...");
      setTimeout(() => {
        window.open(customLink, '_blank');
      }, 500);
    } else if (redirectType === RedirectTypeEnum.BOTH) {
      // Check which options are available and prioritize WhatsApp
      if (whatsappNumber) {
        const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
        console.log('Opening WhatsApp URL from BOTH option:', whatsappUrl);
        console.log('Clean WhatsApp number:', cleanNumber);
        toast.success("Redirecting to WhatsApp...");
        setTimeout(() => {
          console.log('Opening WhatsApp window NOW');
          window.open(whatsappUrl, '_blank');
        }, 500);
        
        // Also show option for custom link if available
        if (customLink) {
          setTimeout(() => {
            toast.info("Or visit the landlord's website:", {
              action: {
                label: "Visit Website",
                onClick: () => window.open(customLink, '_blank')
              },
              duration: 8000,
            });
          }, 1500);
        }
      } else if (customLink) {
        console.log('Opening custom link from BOTH option:', customLink);
        toast.success("Redirecting to property contact...");
        setTimeout(() => {
          window.open(customLink, '_blank');
        }, 500);
      } else {
        // No valid URLs found
        console.log('BOTH option set but no valid URLs');
        toast.success("Application submitted successfully! The property manager will contact you soon.");
      }
    } else {
      console.log('REDIRECT TYPE SET BUT NO VALID URLs FOUND:', { 
        redirectType, 
        hasWhatsappNumber: !!whatsappNumber, 
        hasCustomLink: !!customLink 
      });
      // Show fallback message if redirect type exists but URLs are missing
      toast.success("Application submitted successfully! The property manager will contact you soon.");
    }
    
    console.log('=== REDIRECT DEBUG END ===');
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

    // REQUIRE authentication - only logged in students can submit applications
    if (!isAuthenticated || !authUser) {
      console.error('Authentication required:', {
        isAuthenticated,
        hasAuthUser: !!authUser
      });
      
      // Get current page URL to redirect back after sign in
      const currentUrl = window.location.pathname + window.location.search;
      const callbackUrl = encodeURIComponent(currentUrl);
      
      toast.error("Authentication Required", {
        description: "You must be logged in as a student to submit an application",
        action: {
          label: "Sign In",
          onClick: () => window.location.href = `/signin?callbackUrl=${callbackUrl}`
        }
      });
      return;
    }

    // Only allow students/tenants to submit (block managers and admins)
    if (authUser.role === "manager" || authUser.role === "admin") {
      console.error('Invalid user role for application:', authUser.role);
      
      toast.error("Access Denied", {
        description: "Only students can submit applications. Please sign in with a student account.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare application data
      const applicationData = {
        ...data,
        applicationDate: new Date().toISOString(),
        status: ApplicationStatus.Pending,
        propertyId: typeof propertyId === 'string' ? parseInt(propertyId) : Number(propertyId),
        roomId: roomId ? Number(roomId) : undefined,
        // Include tenantCognitoId from authenticated user
        tenantCognitoId: authUser.cognitoInfo?.userId || authUser.id || authUser.email || '',
      };
      
      // Detailed logging for debugging
      console.log('Application data structure:', JSON.stringify(applicationData, null, 2));
      
      // Ensure propertyId is a number
      if (isNaN(applicationData.propertyId as number)) {
        toast.error("Invalid Property", {
          description: "Failed to identify property. Please try again."
        });
        return;
      }
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Try to get Cognito token if user is authenticated via Cognito
      if (authUser.provider === 'cognito') {
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.idToken?.toString() || '';
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('Using Cognito token for authentication');
          }
        } catch (authError) {
          console.error('Failed to get Cognito token:', authError);
        }
      } else {
        console.log('Using NextAuth session for Google authentication');
      }
      
      // Prepare the final application data
      const currentDate = new Date().toISOString();
      const finalFormattedData = {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        message: data.message,
        applicationDate: currentDate,
        createdAt: currentDate,
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
      
      if (!response.ok) {
        let errorMessage = `Failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Application submission failed:', response.status, errorData);
          errorMessage = errorData.message || `${errorMessage}: ${JSON.stringify(errorData)}`;
        } catch (e) {
          const errorText = await response.text();
          console.error('Application submission failed (non-JSON):', response.status, errorText);
          errorMessage = `${errorMessage}: ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('Application submission successful:', responseData);
      
      // Show success message
      toast.success("Application Submitted Successfully!", {
        description: "Processing your request..."
      });
      
      // Handle redirect BEFORE closing modal to ensure data is still available
      console.log('Calling redirect function NOW (before closing modal)');
      handlePostApplicationRedirect();
      
      // Close modal after redirect is initiated
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Application submission error:', error);
      toast.error("Submission Failed", {
        description: `There was an error submitting your application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 10000,
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