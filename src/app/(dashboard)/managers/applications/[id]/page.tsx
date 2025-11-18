"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  useGetAuthUserQuery,
  useUpdateApplicationStatusMutation,
} from "@/state/api";
import {
  ArrowLeft,
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ApplicationDetail {
  id: number;
  status: "Approved" | "Denied" | "Pending";
  applicationDate: string;
  name: string;
  email: string;
  phoneNumber: string;
  message?: string;
  propertyId: number;
  roomId?: number;
  tenantCognitoId?: string;
  property: {
    id: number;
    name: string;
    address: string;
    pricePerMonth: number;
    unit?: string;
    location?: {
      address: string;
      city: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  room?: {
    id: number;
    name: string;
    pricePerMonth: number;
  };
  tenant?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

const ApplicationDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch application details
  useEffect(() => {
    const fetchApplication = async () => {
      // Wait for auth to complete loading
      if (authLoading) {
        return;
      }

      // Check if user is authenticated
      if (!authUser) {
        setError("Authentication required. Please sign in.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get authentication token (for Cognito users)
        let authHeaders: HeadersInit = {
          "Content-Type": "application/json",
        };

        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.idToken?.toString();
          if (token) {
            authHeaders = {
              ...authHeaders,
              "Authorization": `Bearer ${token}`,
            };
          }
        } catch (err) {
          console.log("No Cognito session, using NextAuth cookies");
        }

        const response = await fetch(
          `/api/applications/${applicationId}`,
          {
            method: 'GET',
            headers: authHeaders,
            credentials: 'include', // Include cookies for NextAuth authentication
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            setError("Authentication required. Please sign in again.");
          } else if (response.status === 404) {
            setError("Application not found");
          } else if (response.status === 403) {
            setError("You don't have permission to view this application");
          } else {
            setError("Failed to load application details");
          }
          return;
        }

        const data = await response.json();
        setApplication(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching application:", err);
        setError("Failed to load application details");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId, authUser, authLoading]);

  const handleStatusChange = async (newStatus: "Approved" | "Denied" | "Pending") => {
    if (!application) return;

    try {
      setUpdatingStatus(true);
      const result = await updateApplicationStatus({
        id: application.id,
        status: newStatus,
      }).unwrap();

      setApplication((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
      toast.success(`Application ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error("Failed to update application status:", error);
      toast.error("Could not update application status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const StatusBadge = ({ status }: { status: "Approved" | "Denied" | "Pending" }) => {
    const statusConfig = {
      Approved: {
        color: "bg-green-500/20 text-green-400 border-green-500/50",
        icon: <CheckCircle className="w-4 h-4 mr-2" />,
      },
      Denied: {
        color: "bg-red-500/20 text-red-400 border-red-500/50",
        icon: <XCircle className="w-4 h-4 mr-2" />,
      },
      Pending: {
        color: "bg-amber-500/20 text-amber-400 border-amber-500/50",
        icon: <Clock className="w-4 h-4 mr-2" />,
      },
    };

    const config = statusConfig[status];

    return (
      <Badge
        className={`px-3 py-1.5 ${config.color} flex items-center font-medium border`}
      >
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-slate-950 dark:text-white bg-white text-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-10 w-32 mb-8 dark:bg-gray-800 bg-gray-200" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 dark:bg-gray-800 bg-gray-200 rounded-lg" />
              <Skeleton className="h-64 dark:bg-gray-800 bg-gray-200 rounded-lg" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 dark:bg-gray-800 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen dark:bg-slate-950 dark:text-white bg-white text-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-8 dark:text-blue-400 text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </button>

          <Card className="p-8 text-center dark:bg-red-900/20 bg-red-50 dark:border-red-800 border-red-200">
            <h1 className="text-2xl font-bold dark:text-red-400 text-red-600 mb-4">
              {error}
            </h1>
            <Button
              onClick={() => router.push("/managers/applications")}
              className="dark:bg-blue-600 bg-blue-600 text-white hover:opacity-90"
            >
              Return to Applications
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const formattedDate = formatDistanceToNow(
    new Date(application.applicationDate),
    { addSuffix: true }
  );

  return (
    <div className="min-h-screen dark:bg-slate-950 dark:text-white bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header with back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-8 dark:text-blue-400 text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Applicant Information */}
            <Card className="p-6 dark:bg-slate-900 dark:border-gray-800 bg-white border-gray-200">
              <h2 className="text-2xl font-bold mb-6 dark:text-white text-gray-900">
                Applicant Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b dark:border-gray-800 border-gray-200">
                  <div className="w-16 h-16 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center">
                    <User className="w-8 h-8 dark:text-gray-400 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold dark:text-white text-gray-900">
                      {application.name}
                    </h3>
                    <p className="dark:text-gray-400 text-gray-600">Applicant</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 dark:text-gray-400 text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm dark:text-gray-400 text-gray-600">Email</p>
                      <p className="dark:text-white text-gray-900 font-medium">
                        {application.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 dark:text-gray-400 text-gray-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm dark:text-gray-400 text-gray-600">Phone</p>
                      <p className="dark:text-white text-gray-900 font-medium">
                        {application.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {application.message && (
                  <div className="pt-4 mt-4 border-t dark:border-gray-800 border-gray-200">
                    <p className="text-sm dark:text-gray-400 text-gray-600 mb-2">
                      Additional Message
                    </p>
                    <p className="dark:bg-gray-800 bg-gray-100 p-4 rounded-lg dark:text-gray-300 text-gray-700">
                      {application.message}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Property Information */}
            <Card className="p-6 dark:bg-slate-900 dark:border-gray-800 bg-white border-gray-200">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white text-gray-900">
                <Building className="w-6 h-6" />
                Property & Unit Details
              </h2>

              <div className="space-y-4">
                {/* Property */}
                <div className="pb-4 border-b dark:border-gray-800 border-gray-200">
                  <h3 className="font-semibold dark:text-white text-gray-900 mb-3">
                    Property
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm dark:text-gray-400 text-gray-600">Name</p>
                      <p className="dark:text-white text-gray-900 font-medium">
                        {application.property.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm dark:text-gray-400 text-gray-600">Address</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 dark:text-gray-400 text-gray-500 mt-1 flex-shrink-0" />
                        <p className="dark:text-white text-gray-900 font-medium">
                          {application.property.location?.address || application.property.address}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm dark:text-gray-400 text-gray-600">
                        Monthly Rent
                      </p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 dark:text-green-400 text-green-600" />
                        <p className="dark:text-white text-gray-900 font-medium">
                          R{application.property.pricePerMonth.toLocaleString(
                            "en-ZA"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Room Information (if applicable) */}
                {application.room && (
                  <div>
                    <h3 className="font-semibold dark:text-white text-gray-900 mb-3">
                      Selected Room
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm dark:text-gray-400 text-gray-600">
                          Room Name
                        </p>
                        <p className="dark:text-white text-gray-900 font-medium">
                          {application.room.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm dark:text-gray-400 text-gray-600">
                          Room Monthly Rent
                        </p>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 dark:text-green-400 text-green-600" />
                          <p className="dark:text-white text-gray-900 font-medium">
                            R{application.room.pricePerMonth.toLocaleString(
                              "en-ZA"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Application Timeline */}
            <Card className="p-6 dark:bg-slate-900 dark:border-gray-800 bg-white border-gray-200">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white text-gray-900">
                <Calendar className="w-6 h-6" />
                Application Timeline
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full dark:bg-blue-400 bg-blue-600 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium dark:text-white text-gray-900">
                      Application Submitted
                    </p>
                    <p className="text-sm dark:text-gray-400 text-gray-600">
                      {new Date(application.applicationDate).toLocaleDateString(
                        "en-ZA",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                    <p className="text-xs dark:text-gray-500 text-gray-500 mt-1">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                {application.status !== "Pending" && (
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                      application.status === "Approved"
                        ? "dark:bg-green-400 bg-green-600"
                        : "dark:bg-red-400 bg-red-600"
                    }`} />
                    <div>
                      <p className="font-medium dark:text-white text-gray-900">
                        Application {application.status}
                      </p>
                      <p className="text-sm dark:text-gray-400 text-gray-600">
                        Status updated by you
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Sidebar - Actions & Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Status Card */}
            <Card className="p-6 dark:bg-slate-900 dark:border-gray-800 bg-white border-gray-200">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
                Application Status
              </h3>

              <div className="mb-6">
                <StatusBadge status={application.status} />
              </div>

              <div className="text-sm dark:text-gray-400 text-gray-600 mb-4">
                {application.status === "Pending" && (
                  <p>This application is awaiting your decision.</p>
                )}
                {application.status === "Approved" && (
                  <p>You have approved this application.</p>
                )}
                {application.status === "Denied" && (
                  <p>You have denied this application.</p>
                )}
              </div>

              {application.status === "Pending" && (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleStatusChange("Approved")}
                    disabled={updatingStatus}
                    className="w-full bg-green-700 text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleStatusChange("Denied")}
                    disabled={updatingStatus}
                    className="w-full bg-red-700 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny
                  </Button>
                </div>
              )}

              {application.status === "Approved" && (
                <div className="space-y-2">
                  <Button
                    className="w-full dark:bg-gray-800 bg-gray-100 dark:text-gray-200 text-gray-700 hover:opacity-80"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Documents
                  </Button>
                  <Button
                    onClick={() => handleStatusChange("Pending")}
                    disabled={updatingStatus}
                    className="w-full dark:bg-gray-800 bg-gray-100 dark:text-gray-200 text-gray-700 hover:opacity-80"
                  >
                    Revert to Pending
                  </Button>
                </div>
              )}

              {application.status === "Denied" && (
                <Button
                  onClick={() => handleStatusChange("Pending")}
                  disabled={updatingStatus}
                  className="w-full dark:bg-gray-800 bg-gray-100 dark:text-gray-200 text-gray-700 hover:opacity-80"
                >
                  Revert to Pending
                </Button>
              )}
            </Card>

            {/* Quick Links */}
            <Card className="p-6 dark:bg-slate-900 dark:border-gray-800 bg-white border-gray-200">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
                Quick Actions
              </h3>

              <div className="space-y-2">
                <Link
                  href={`/managers/properties/${application.property.id}`}
                  className="flex items-center gap-2 p-3 rounded-lg dark:bg-gray-800 bg-gray-100 dark:text-gray-200 text-gray-700 hover:opacity-80 transition-opacity"
                >
                  <Building className="w-4 h-4" />
                  View Property
                </Link>

                <button
                  className="w-full flex items-center gap-2 p-3 rounded-lg dark:bg-gray-800 bg-gray-100 dark:text-gray-200 text-gray-700 hover:opacity-80 transition-opacity"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact Applicant
                </button>
              </div>
            </Card>

            {/* Application Info */}
            <Card className="p-6 dark:bg-slate-900 dark:border-gray-800 bg-white border-gray-200">
              <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
                Application Info
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="dark:text-gray-400 text-gray-600">Application ID</p>
                  <p className="dark:text-white text-gray-900 font-mono font-medium">
                    #{application.id}
                  </p>
                </div>

                <div>
                  <p className="dark:text-gray-400 text-gray-600">Submitted</p>
                  <p className="dark:text-white text-gray-900">
                    {new Date(
                      application.applicationDate
                    ).toLocaleDateString("en-ZA")}
                  </p>
                </div>

                {application.tenantCognitoId && (
                  <div>
                    <p className="dark:text-gray-400 text-gray-600">Tenant ID</p>
                    <p className="dark:text-white text-gray-900 font-mono text-xs break-all">
                      {application.tenantCognitoId}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;
