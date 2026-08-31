"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUpdateManagerStatusMutation, useDeleteManagerMutation, useGetAuthUserQuery, useGetAllManagersQuery } from "@/state/api";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || "all");

  type Manager = {
    username: string;
    userId: string;
    id?: number | string;
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
  const { data: rawManagers, isLoading, error: queryError, refetch } = useGetAllManagersQuery({
    status: selectedStatus === "all" ? undefined : selectedStatus,
    includeDemo: false
  });

  const error = queryError ? "Failed to load landlords directory" : null;

  const landlords: Manager[] = useMemo(() => {
    if (!rawManagers) return [];
    return rawManagers.map((m: any) => ({
      username: m.name || m.email || "Landlord",
      userId: String(m.cognitoId || m.id || m._id),
      id: m.id || m._id,
      cognitoId: String(m.cognitoId || m.userId || m.id || m._id),
      email: m.email || "",
      phoneNumber: m.phoneNumber || "",
      status: m.status || "Active"
    }));
  }, [rawManagers]);

  const [updateManagerStatus] = useUpdateManagerStatusMutation();
  const [deleteManager] = useDeleteManagerMutation();

  const filteredManagers = landlords.filter((manager) => {
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
        cognitoId: (selectedManager.cognitoId ?? selectedManager.userId) as string,
        status: newStatus,
        notes: notes
      }).unwrap();
      
      setIsDialogOpen(false);
      setSelectedManager(null);
      setNewStatus("");
      setNotes("");
      // Refresh landlords list from Cognito
      try { refetch?.(); } catch (e) { console.error('Failed to refetch landlords', e); }
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
      await deleteManager((selectedManager.cognitoId ?? selectedManager.userId) as string).unwrap();
      setIsDeleteDialogOpen(false);
      setSelectedManager(null);
      // Refresh landlords list from Cognito
      try { refetch?.(); } catch (e) { console.error('Failed to refetch landlords', e); }
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
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Landlord & Manager Directory</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage verified property owners, account statuses, and system permissions.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
          <Input
            placeholder="Search landlords by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl border-zinc-800 bg-zinc-900/80 text-xs text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-200">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-200 rounded-xl">
            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
            <SelectItem value="Pending" className="text-xs">Pending</SelectItem>
            <SelectItem value="Active" className="text-xs">Active</SelectItem>
            <SelectItem value="Disabled" className="text-xs">Disabled</SelectItem>
            <SelectItem value="Banned" className="text-xs">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-10 w-10 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
          <p className="mt-3 text-xs font-mono text-zinc-500">Loading verified landlords...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-950/70">
          <p className="text-rose-400 text-xs font-medium">{error}</p>
        </Card>
      ) : filteredManagers?.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-950/70">
          <p className="text-zinc-400 text-xs">No landlords found matching your criteria.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {paginatedManagers?.map((manager) => (
            <Card
              key={manager.userId}
              className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl hover:border-zinc-700/90 transition-all cursor-pointer"
              onClick={() => openStatusDialog(manager as Manager, manager.status || 'Active')}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm">{manager.username}</h3>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono">LANDLORD</Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{manager.email}</p>
                  {manager.phoneNumber && <p className="text-xs text-zinc-500 font-mono mt-0.5">{manager.phoneNumber}</p>}
                  <div className="mt-2.5">{getStatusBadge(manager.status || "Active")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/admin/landlords/${manager.id}`); }} className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-8">
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openStatusDialog(manager as Manager, manager.status || 'Active'); }} className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-8">
                    Change Status
                  </Button>
                  <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); openDeleteDialog(manager as Manager); }} className="rounded-xl text-xs h-8">
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
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                  <SelectItem value="Banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
