import React, { useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { useToast } from "./Toast";
import { useSocket } from "../context/SocketContext";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Save,
  X,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const DeliveryPartnerManagement = () => {
  const { addToast } = useToast();
  const { connected, on, off } = useSocket();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    estimatedDeliveryTime: 30,
  });

  useEffect(() => {
    loadPartners();
  }, []);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!connected) return;

    const handleDeliveryPartnerAvailabilityChanged = ({
      partnerId,
      isAvailable,
    }) => {
      console.log("Delivery partner availability changed:", {
        partnerId,
        isAvailable,
      });
      setPartners((prevPartners) =>
        prevPartners.map((partner) =>
          partner._id === partnerId ? { ...partner, isAvailable } : partner
        )
      );
    };

    const handleDeliveryPartnerCreated = (newPartner) => {
      console.log("Delivery partner created:", newPartner);
      setPartners((prevPartners) => [newPartner, ...prevPartners]);
      addToast(
        `New delivery partner created: ${newPartner.username}`,
        "success",
        4000
      );
    };

    const handleDeliveryPartnerUpdated = (updatedPartner) => {
      console.log("Delivery partner updated:", updatedPartner);
      setPartners((prevPartners) =>
        prevPartners.map((partner) =>
          partner._id === updatedPartner._id ? updatedPartner : partner
        )
      );
      addToast(
        `Delivery partner ${updatedPartner.username} updated`,
        "info",
        3000
      );
    };

    const handleDeliveryPartnerDeleted = ({ partnerId }) => {
      console.log("Delivery partner deleted:", partnerId);
      setPartners((prevPartners) =>
        prevPartners.filter((partner) => partner._id !== partnerId)
      );
      addToast("Delivery partner deleted", "info", 3000);
    };

    // Register event listeners
    on(
      "deliveryPartnerAvailabilityChanged",
      handleDeliveryPartnerAvailabilityChanged
    );
    on("deliveryPartnerCreated", handleDeliveryPartnerCreated);
    on("deliveryPartnerUpdated", handleDeliveryPartnerUpdated);
    on("deliveryPartnerDeleted", handleDeliveryPartnerDeleted);

    // Cleanup listeners on unmount
    return () => {
      off(
        "deliveryPartnerAvailabilityChanged",
        handleDeliveryPartnerAvailabilityChanged
      );
      off("deliveryPartnerCreated", handleDeliveryPartnerCreated);
      off("deliveryPartnerUpdated", handleDeliveryPartnerUpdated);
      off("deliveryPartnerDeleted", handleDeliveryPartnerDeleted);
    };
  }, [connected, on, off, addToast]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getDeliveryPartners();
      setPartners(response.data.deliveryPartners || []);
    } catch (error) {
      console.error("Error loading partners:", error);
      addToast("Failed to load delivery partners", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      await authAPI.createDeliveryPartner(formData);
      addToast("Delivery partner created successfully", "success");
      setShowCreateForm(false);
      setFormData({
        username: "",
        email: "",
        password: "",
        estimatedDeliveryTime: 30,
      });
      loadPartners();
    } catch (error) {
      console.error("Error creating partner:", error);
      addToast(
        error.response?.data?.message || "Failed to create delivery partner",
        "error"
      );
    }
  };

  const handleUpdatePartner = async (partnerId, updateData) => {
    try {
      await authAPI.updateDeliveryPartner(partnerId, updateData);
      addToast("Delivery partner updated successfully", "success");
      setEditingPartner(null);
      loadPartners();
    } catch (error) {
      console.error("Error updating partner:", error);
      addToast(
        error.response?.data?.message || "Failed to update delivery partner",
        "error"
      );
    }
  };

  const handleDeletePartner = async (partnerId, partnerName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete delivery partner "${partnerName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await authAPI.deleteDeliveryPartner(partnerId);
      addToast("Delivery partner deleted successfully", "success");
      loadPartners();
    } catch (error) {
      console.error("Error deleting partner:", error);
      addToast(
        error.response?.data?.message || "Failed to delete delivery partner",
        "error"
      );
    }
  };

  const handleToggleAvailability = async (partner) => {
    try {
      await handleUpdatePartner(partner._id, {
        isAvailable: !partner.isAvailable,
      });
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  };

  const EditForm = ({ partner, onSave, onCancel }) => {
    const [editData, setEditData] = useState({
      username: partner.username,
      estimatedDeliveryTime: partner.estimatedDeliveryTime,
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(partner._id, editData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            value={editData.username}
            onChange={(e) =>
              setEditData({ ...editData, username: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Estimated Delivery Time (minutes)
          </label>
          <input
            type="number"
            value={editData.estimatedDeliveryTime}
            onChange={(e) =>
              setEditData({
                ...editData,
                estimatedDeliveryTime: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="1"
            required
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading delivery partners..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Delivery Partner Management
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage your delivery partners and their availability
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </button>
          </div>

          {/* Create Partner Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Create New Delivery Partner
              </h4>
              <form onSubmit={handleCreatePartner} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      minLength="6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Delivery Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedDeliveryTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedDeliveryTime: parseInt(e.target.value),
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Create Partner
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({
                        username: "",
                        email: "",
                        password: "",
                        estimatedDeliveryTime: 30,
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Partners List */}
          <div className="space-y-4">
            {partners.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No delivery partners found</p>
                <p className="text-sm text-gray-400">
                  Create your first delivery partner to get started
                </p>
              </div>
            ) : (
              partners.map((partner) => (
                <div
                  key={partner._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingPartner === partner._id ? (
                    <EditForm
                      partner={partner}
                      onSave={handleUpdatePartner}
                      onCancel={() => setEditingPartner(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {partner.username}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {partner.email}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-600">
                                {partner.estimatedDeliveryTime} min ETA
                              </span>
                            </div>
                            <div className="flex items-center">
                              {partner.isAvailable ? (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  <span className="text-sm">Available</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-red-600">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  <span className="text-sm">Unavailable</span>
                                </div>
                              )}
                            </div>
                            {partner.currentOrder && (
                              <div className="text-sm text-blue-600">
                                Has active order
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleAvailability(partner)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            partner.isAvailable
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          {partner.isAvailable
                            ? "Set Unavailable"
                            : "Set Available"}
                        </button>
                        <button
                          onClick={() => setEditingPartner(partner._id)}
                          className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeletePartner(partner._id, partner.username)
                          }
                          disabled={!!partner.currentOrder}
                          className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            partner.currentOrder
                              ? "Cannot delete partner with active orders"
                              : "Delete partner"
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPartnerManagement;
