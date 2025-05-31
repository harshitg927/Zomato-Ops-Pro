import React, { useState } from "react";
import { X, User, Clock, AlertCircle } from "lucide-react";

const AssignPartnerModal = ({ order, partners, onClose, onAssign }) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPartnerId) {
      setError("Please select a delivery partner");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onAssign(selectedPartnerId);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to assign delivery partner"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateDispatchTime = (partnerId) => {
    const partner = partners.find((p) => p._id === partnerId);
    if (partner && order.prepTime) {
      return order.prepTime + partner.estimatedDeliveryTime;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Assign Delivery Partner
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Order Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Order Details
          </h4>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Order ID:</strong> {order.orderId}
            </p>
            <p>
              <strong>Customer:</strong> {order.customerInfo.name}
            </p>
            <p>
              <strong>Prep Time:</strong> {order.prepTime} minutes
            </p>
            <p>
              <strong>Items:</strong> {order.items.length} item(s)
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Delivery Partners
            </label>

            {partners.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No available partners
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  All delivery partners are currently busy.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {partners.map((partner) => (
                  <div
                    key={partner._id}
                    className={`relative rounded-lg border p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedPartnerId === partner._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedPartnerId(partner._id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="partner"
                        value={partner._id}
                        checked={selectedPartnerId === partner._id}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {partner.username}
                            </p>
                            <p className="text-sm text-gray-500">
                              {partner.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {partner.estimatedDeliveryTime} min ETA
                            </div>
                            {selectedPartnerId === partner._id && (
                              <div className="text-sm font-medium text-blue-600 mt-1">
                                Dispatch: {calculateDispatchTime(partner._id)}{" "}
                                min
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {partners.length > 0 && (
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedPartnerId}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Assigning..." : "Assign Partner"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AssignPartnerModal;
