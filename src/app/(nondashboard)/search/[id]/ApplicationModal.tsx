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
import { fetchAuthSession } from "aws-amplify/auth";

// Extend Window interface for Facebook Pixel
declare global {
  interface Window {
    fbq?: (command: string, eventName: string, params?: any) => void;
  }
}

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

  const generateWhatsAppMessage = () => {
    const property = propertyData;
    const room = roomData;
    
    let message = "Hi! I just submitted an application for ";
    
    if (room) {
      message += room.name + " at " + (property?.name || "your property") + ". ";
      message += "\\n\\nRoom Details:\\n";
      message += "- Price: R" + room.pricePerMonth + "/month\\n";
      if (room.securityDeposit && room.securityDeposit > 0) {
        message += "- Security Deposit: R" + room.securityDeposit + "\\n";
      }
      message += "- Room Type: " + room.roomType + "\\n";
    } else {
      message += (property?.name || "your property") + ". ";
    }
    
    if (property?.location) {
      message += "- Location: " + property.location.address + ", " + property.location.city + "\\n";
    }
    
    message += "\\nI'm interested in viewing the property and would like to discuss the application process. Thank you!";
    
    return encodeURIComponent(message);
  };

  const handlePostApplicationRedirect = () => {
    console.log('=== REDIRECT DEBUG START (PROPERTY-ONLY) ===');
    
    let whatsappNumber = null;
    let customLink = null;
    
    // ONLY USE PROPERTY-LEVEL REDIRECT SETTINGS
    if (propertyData) {
      console.log('📍 Using PROPERTY-LEVEL redirect settings only');
      whatsappNumber = (propertyData as any).whatsappNumber;
      customLink = (propertyData as any).customLink;
      
      console.log('🏢 Property redirect:', {
        whatsappNumber,
        customLink
      });
    } else {
      console.log('⚠️ No property data available for redirect');
    }

    const message = generateWhatsAppMessage();
    
    console.log('🎯 Final redirect decision (PROPERTY-ONLY):', {
      whatsappNumber,
      customLink
    });

    if (whatsappNumber && whatsappNumber.trim()) {
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
      
      if (cleanNumber.length < 10) {
        toast.error("Invalid WhatsApp number configured.");
        return;
      }
      
      const whatsappUrl = "https://wa.me/" + cleanNumber + "?text=" + message;
      
      toast.success("Redirecting to WhatsApp...", { duration: 2000 });
      
      // Use a single, more reliable redirect method
      setTimeout(() => {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }, 300);
      
      // Show custom link as secondary option if available
      if (customLink && customLink.trim()) {
        setTimeout(() => {
          toast.info("Or visit the landlord's website:", {
            action: {
              label: "Visit Website",
              onClick: () => window.open(customLink, "_blank")
            },
            duration: 8000,
          });
        }, 1500);
      }
      return;
    }
    
    if (customLink && customLink.trim()) {
      toast.success("Redirecting to property contact...", { duration: 2000 });
      
      // Use a single, more reliable redirect method
      setTimeout(() => {
        window.open(customLink, "_blank", "noopener,noreferrer");
      }, 300);
      return;
    }

    console.log('ℹ️ No redirect configured at property level');
    toast.success("Application submitted successfully! The property manager will contact you soon.");
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
    if (!isAuthenticated || !authUser) {
      // Capture the full absolute URL for proper redirect after sign-in
      const currentUrl = window.location.href;
      const callbackUrl = encodeURIComponent(currentUrl);
      
      console.log('🔐 Authentication required:', {
        currentUrl,
        callbackUrl,
        fullRedirectUrl: "/signin?callbackUrl=" + callbackUrl
      });
      
      toast.error("Authentication Required", {
        description: "You must be logged in as a student to submit an application",
        action: {
          label: "Sign In",
          onClick: () => {
            const redirectUrl = "/signin?callbackUrl=" + callbackUrl;
            console.log('🚀 Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
          }
        }
      });
      return;
    }

    if (authUser.role === "manager" || authUser.role === "admin") {
      toast.error("Access Denied", {
        description: "Only students can submit applications.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const applicationData = {
        ...data,
        applicationDate: new Date().toISOString(),
        status: ApplicationStatus.Pending,
        propertyId: Number(propertyId),
        roomId: roomId ? Number(roomId) : undefined,
        tenantCognitoId: authUser.cognitoInfo?.userId || authUser.id || authUser.email || "",
      };
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      
      if (authUser.provider === "cognito") {
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.idToken?.toString() || "";
          if (token) {
            headers["Authorization"] = "Bearer " + token;
          }
        } catch (authError) {
          console.error("Failed to get Cognito token:", authError);
        }
      }
      
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
      
      const response = await fetch("/api/applications", {
        method: "POST",
        headers,
        body: JSON.stringify(finalFormattedData),
        credentials: "include"
      });
      
      if (!response.ok) {
        let errorMessage = "Failed with status " + response.status;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorMessage + ": " + errorText;
        }
        throw new Error(errorMessage);
      }
      
      toast.success("Application Submitted Successfully!", {
        description: "Processing your request..."
      });
      
      // Track Facebook Pixel AddToCart event
      if (typeof window !== 'undefined' && (window as any).fbq) {
        try {
          (window as any).fbq('track', 'AddToCart', {
            content_name: roomName || propertyData?.name || 'Property Application',
            content_ids: [roomId ? `room_${roomId}` : `property_${propertyId}`],
            content_type: 'product',
            value: roomData?.pricePerMonth || propertyData?.pricePerMonth || 0,
            currency: 'ZAR'
          });
          console.log('Facebook Pixel AddToCart event tracked');
        } catch (fbError) {
          console.error('Failed to track Facebook Pixel event:', fbError);
        }
      }
      
      handlePostApplicationRedirect();
      
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      toast.error("Submission Failed", {
        description: "There was an error submitting your application: " + (error instanceof Error ? error.message : "Unknown error"),
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
            {roomName ? "Apply for " + roomName : "Submit Application for this Property"}
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
