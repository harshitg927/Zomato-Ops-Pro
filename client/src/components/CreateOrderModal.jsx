import React, { useState } from "react";
import { X, Plus, Minus, AlertCircle } from "lucide-react";

const CreateOrderModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    customerInfo: {
      name: "",
      phone: "",
      address: "",
    },
    items: [{ name: "", quantity: 1, price: 0 }],
    prepTime: 15,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCustomerInfoChange = (field, value) => {
    setFormData({
      ...formData,
      customerInfo: {
        ...formData.customerInfo,
        [field]: value,
      },
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]:
        field === "quantity" || field === "price" ? Number(value) : value,
    };
    setFormData({
      ...formData,
      items: newItems,
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        items: newItems,
      });
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const validateForm = () => {
    if (!formData.customerInfo.name.trim()) {
      return "Customer name is required";
    }
    if (!formData.customerInfo.phone.trim()) {
      return "Customer phone is required";
    }
    if (!formData.customerInfo.address.trim()) {
      return "Customer address is required";
    }
    if (formData.prepTime < 1) {
      return "Prep time must be at least 1 minute";
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.name.trim()) {
        return `Item ${i + 1} name is required`;
      }
      if (item.quantity < 1) {
        return `Item ${i + 1} quantity must be at least 1`;
      }
      if (item.price < 0) {
        return `Item ${i + 1} price cannot be negative`;
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // Calculate total amount before sending
      const totalAmount = calculateTotal();
      const orderDataWithTotal = {
        ...formData,
        totalAmount,
      };

      console.log(orderDataWithTotal);
      await onSubmit(orderDataWithTotal);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Create New Order
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Customer Information
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={formData.customerInfo.name}
                  onChange={(e) =>
                    handleCustomerInfoChange("name", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={formData.customerInfo.phone}
                  onChange={(e) =>
                    handleCustomerInfoChange("phone", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  required
                  rows={2}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={formData.customerInfo.address}
                  onChange={(e) =>
                    handleCustomerInfoChange("address", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-900">Order Items</h4>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 border rounded-md"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Item name"
                      required
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      required
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      required
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(index, "price", e.target.value)
                      }
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Preparation Time (minutes)
            </label>
            <input
              type="number"
              min="1"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.prepTime}
              onChange={(e) =>
                setFormData({ ...formData, prepTime: Number(e.target.value) })
              }
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">
                Total Amount:
              </span>
              <span className="text-lg font-bold text-gray-900">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

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
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
