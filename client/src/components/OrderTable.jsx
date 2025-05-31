import React from "react";
import { User, Clock, UserPlus } from "lucide-react";

const OrderTable = ({ orders, onAssignPartner }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "PREPARING":
        return "bg-yellow-100 text-yellow-800";
      case "READY":
        return "bg-blue-100 text-blue-800";
      case "OUT_FOR_DELIVERY":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Safety check: ensure orders is an array
  const safeOrders = Array.isArray(orders) ? orders : [];

  if (safeOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new order.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
              Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prep Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dispatch Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Delivery Partner
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {safeOrders.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {order.orderId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {order.customerInfo?.name || "N/A"}
                </div>
                <div className="text-sm text-gray-500">
                  {order.customerInfo?.phone || "N/A"}
                </div>
              </td>
              <td className="px-6 py-4 w-64">
                <div className="text-sm text-gray-900 space-y-1">
                  {(order.items || []).map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded text-xs"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600">
                        {item.quantity}x @ {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {formatCurrency(order.totalAmount || 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {order.prepTime} min
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {order.dispatchTime ? `${order.dispatchTime} min` : "Not set"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {order.deliveryPartner ? (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {order.deliveryPartner.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        ETA: {order.deliveryPartner.estimatedDeliveryTime}min
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">Not assigned</span>
                    <button
                      onClick={() => onAssignPartner(order)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                      title="Assign Partner"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Assign
                    </button>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(order.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
