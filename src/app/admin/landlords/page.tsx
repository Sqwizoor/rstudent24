"use client";

import { useUpdateManagerStatusMutation, useDeleteManagerMutation, useGetAuthUserQuery } from "@/state/api";
import { useCognitoLandlords } from "@/hooks/useCognitoLandlords";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, AlertTriangle, Ban, Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

export default function LandlordsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || "all");
  // Define Manager (Cognito landlord) type for TypeScript
  type Manager = {
    username: string;
    userId: string;
    cognitoId?: string;
    email?: string;
    phoneNumber?: string;
    status?: 'Pending' | 'Active' | 'Disabled' | 'Banned' | string;
  };

  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: authUser } = useGetAuthUserQuery();
  const normalizedRole = typeof authUser?.userRole === "string" ? authUser.userRole.toLowerCase() : undefined;

  const { landlords, isLoading, error } = useCognitoLandlords();
  const [updateManagerStatus] = useUpdateManagerStatusMutation();
  const [deleteManager] = useDeleteManagerMutation();

  const filteredManagers = landlords?.filter((manager) => {
    const search = searchTerm.toLowerCase();
    const name = typeof manager.username === "string" ? manager.username.toLowerCase() : "";
    const email = typeof manager.email === "string" ? manager.email.toLowerCase() : "";
    return name.includes(search) || email.includes(search);
  });

  // Pagination logic
  const totalPages = Math.ceil((filteredManagers?.length || 0) / itemsPerPage);
  const paginatedManagers = filteredManagers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = async () => {
    if (!selectedManager || !newStatus) return;
    
    try {
      await updateManagerStatus({
        cognitoId: selectedManager.cognitoId,
        status: newStatus,
        notes: notes
      }).unwrap();
      
      setIsDialogOpen(false);
      setSelectedManager(null);
      setNewStatus("");
      setNotes("");
  // refetch(); // Not needed for Cognito API
    } catch (error) {
      console.error("Failed to update manager status:", error);
    }
  };

  const openStatusDialog = (manager: Manager, initialStatus: string) => {
    setSelectedManager(manager);
    setNewStatus(initialStatus);
    setIsDialogOpen(true);
  };
  
  const openDeleteDialog = (manager: Manager) => {
    setSelectedManager(manager);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteManager = async () => {
    if (!selectedManager) return;
    
    try {
      await deleteManager(selectedManager.cognitoId).unwrap();
      setIsDeleteDialogOpen(false);
      setSelectedManager(null);
  // refetch(); // Not needed for Cognito API
    } catch (error) {
      console.error("Failed to delete manager:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
      case "Active":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case "Disabled":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Disabled</Badge>;
      case "Banned":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Banned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Landlord Management - Managers/Landlords Only</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search landlords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Disabled">Disabled</SelectItem>
            <SelectItem value="Banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full animate-pulse"></div>
          <p className="ml-4 text-sm text-gray-500">Loading landlords from Cognito...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-red-500">{error}</p>
        </Card>
      ) : filteredManagers?.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No landlords found matching your criteria.</p>
          <p className="text-sm text-gray-400 mt-2">This page shows ONLY data from Cognito</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paginatedManagers?.map((manager) => (
            <Card
              key={manager.userId}
              className="p-4 bg-white dark:bg-gray-800 cursor-pointer hover:shadow-md"
              onClick={() => openStatusDialog(manager as Manager, manager.status || 'Active')}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{manager.username}</h3>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-600">LANDLORD/MANAGER</Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{manager.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{manager.phoneNumber}</p>
                  <div className="mt-2">{getStatusBadge(manager.status || "Active")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openStatusDialog(manager as Manager, manager.status || 'Active'); }}>
                    Change Status
                  </Button>
                  <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); openDeleteDialog(manager as Manager); }}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {(filteredManagers?.length || 0) > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredManagers?.length || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Status change dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Landlord Status</DialogTitle>
            <DialogDescription>
              You are about to change {selectedManager?.username || selectedManager?.email}&apos;s status to <strong>{newStatus}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Add notes about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusChange}>
              Confirm Status Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Landlord Account</DialogTitle>
            <DialogDescription>
              {selectedManager?.email === 'manager@example.com' ? (
                <>
                  You are about to delete the demo account for <strong>{selectedManager?.username || selectedManager?.email}</strong>. 
                  This will remove the account and all associated demo properties.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete <strong>{selectedManager?.username || selectedManager?.email}</strong>? 
                  This action cannot be undone and will remove all properties managed by this account.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteManager}>
              {selectedManager?.email === 'manager@example.com' ? 'Delete Demo Account' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
