"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getUserVehicles, deleteVehicle } from "./actions";
import { VehicleForm } from "./components/VehicleForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2, Car } from "lucide-react";
import { toast } from "sonner";
import { PublicVehicle, vehicleTypeLabels } from "./types";
import Loading from "./components/Loading";

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="bg-[#1A3C34] text-white border-none">
      <DialogHeader>
        <DialogTitle className="text-white">Are you sure?</DialogTitle>
      </DialogHeader>
      <div className="py-4 text-gray-300">
        This will permanently delete this vehicle. This action cannot be undone.
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onClose}
          className="bg-transparent hover:bg-black/20"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="bg-red-600 hover:bg-red-700"
        >
          Delete
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default function VehicleManagement() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<PublicVehicle | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  // Fetch vehicles via react-query
  const {
    data: vehicles = [],
    isLoading,
    isError,
    error,
    refetch: refechVehicle,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getUserVehicles,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: async (result) => {
      if (result.success) {
        toast.success("Vehicle deleted successfully");
        await refechVehicle();
      } else {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  const openDeleteConfirmation = (id: string) => {
    setVehicleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!vehicleToDelete) return;
    deleteMutation.mutate(vehicleToDelete);
    setVehicleToDelete(null);
  };

  const handleEdit = (vehicle: PublicVehicle) => {
    setEditingVehicle(vehicle);
    setEditDialogOpen(true);
  };

  const handleAddSuccess = () => {
    setAddDialogOpen(false);
    refechVehicle();
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setEditingVehicle(null);
    refechVehicle();
  };

  return (
    <Card className="bg-[#1A3C34] text-white border-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white flex items-center gap-2">
            <Car className="h-5 w-5" />
            My Vehicles
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage your vehicle information
          </CardDescription>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1A3C34] border-none">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Vehicle</DialogTitle>
            </DialogHeader>
            <VehicleForm onSuccess={handleAddSuccess} />
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-gray-400">
            <Loading />
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-red-500">
            Error: {error?.message}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 bg-black/20 rounded-lg border border-dashed border-gray-700">
            <Car className="h-12 w-12 text-gray-500 mb-2" />
            <p className="text-lg font-medium">No vehicles added yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add your vehicle details to use them when creating rides
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-gray-700"
              >
                <div className="flex items-center">
                  <div className="rounded-full bg-emerald-700 p-2 mr-3">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {vehicleTypeLabels[vehicle.type] || vehicle.type}
                    </p>
                    <p className="text-sm text-gray-400">
                      {vehicle.vehicleNumber}{" "}
                      {vehicle.model ? `(${vehicle.model})` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(vehicle)}
                    className="hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteConfirmation(vehicle.id)}
                    className="hover:bg-red-500/20 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {editingVehicle && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-[#1A3C34] border-none">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Vehicle</DialogTitle>
            </DialogHeader>
            <VehicleForm
              vehicle={{
                id: editingVehicle.id,
                type: editingVehicle.type,
                vehicleNumber: editingVehicle.vehicleNumber,
                model: editingVehicle.model || undefined,
              }}
              onSuccess={handleEditSuccess}
            />
          </DialogContent>
        </Dialog>
      )}

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
