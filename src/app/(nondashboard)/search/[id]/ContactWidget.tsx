import { Button } from "@/components/ui/button";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useSignInRedirect } from "@/hooks/useSignInRedirect";
import { useRouter } from "next/navigation";
import React from "react";

interface ContactWidgetProps {
  onOpenModal: () => void;
}

const ContactWidget = ({ onOpenModal }: ContactWidgetProps) => {
  const { user: authUser, isAuthenticated } = useUnifiedAuth();
  const router = useRouter();
  const { signinUrl } = useSignInRedirect();

  const handleButtonClick = () => {
    console.log('ContactWidget button clicked', { isAuthenticated, authUser: authUser ? { id: authUser.id, role: authUser.role } : null });
    
    if (isAuthenticated && authUser) {
      console.log('Opening modal from ContactWidget');
      onOpenModal();
    } else {
      console.log('Redirecting to signin');
      router.push(signinUrl);
    }
  };

  return (
    <div className="bg-white border border-primary-200 rounded-2xl p-7 h-fit min-w-[300px]">
      {/* Application Form */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Interested in this property?</h3>
        <p className="text-sm text-gray-600">Submit an application to get in touch with the property manager.</p>
      </div>
      
      <Button
        className="w-full bg-primary-700 text-white hover:bg-primary-600"
        onClick={handleButtonClick}
      >
        {isAuthenticated && authUser ? "Submit Application" : "Sign In to Apply"}
      </Button>

      <hr className="my-4" />
      <div className="text-sm">
        <div className="text-primary-600 mb-1">Language: English, Bahasa.</div>
        <div className="text-primary-600">
          Open by appointment on Monday - Sunday
        </div>
      </div>
    </div>
  );
};

export default ContactWidget;