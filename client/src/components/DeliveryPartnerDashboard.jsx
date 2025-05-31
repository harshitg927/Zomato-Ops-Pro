import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "./Toast";
import { ordersAPI, deliveryAPI } from "../services/api";
import {
  LogOut,
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Wifi,
  WifiOff,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const DeliveryPartnerDashboard = () => {
  const { user, logout } = useAuth();
  const { connected, on, off } = useSocket();
  const { addToast, ToastContainer } = useToast();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedToday: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Wrap data loading functions in useCallback to make them stable dependencies
  const loadCurrentOrder = useCallback(async () => {
    try {
      const response = await ordersAPI.getCurrentOrder();
      setCurrentOrder(response.data.order || null);
    } catch (error) {
      console.error("Error loading current order:", error);
      setCurrentOrder(null);
    }
  }, []);

  const loadOrderHistory = useCallback(async () => {
    try {
      const response = await ordersAPI.getOrderHistory();
      const historyData = response.data.orders || response.data || [];
      setOrderHistory(historyData);
    } catch (error) {
      console.error("Error loading order history:", error);
      setOrderHistory([]);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await deliveryAPI.getStats();
      setStats(
        response.data.stats || {
          totalDeliveries: 0,
          completedToday: 0,
          averageRating: 0,
        }
      );
    } catch (error) {
      console.error("Error loading stats:", error);
      setStats({
        totalDeliveries: 0,
        completedToday: 0,
        averageRating: 0,
      });
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadCurrentOrder(), loadOrderHistory(), loadStats()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [loadCurrentOrder, loadOrderHistory, loadStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!connected) return;

    // Listen for order events relevant to this delivery partner
    const handleOrderAssigned = (assignedOrder) => {
      console.log("Order assigned:", assignedOrder);
      // Check if this order is assigned to current user
      if (
        assignedOrder.deliveryPartner &&
        assignedOrder.deliveryPartner._id === user?._id
      ) {
        setCurrentOrder(assignedOrder);
        loadStats(); // Refresh stats
        loadOrderHistory(); // Refresh history
        addToast(`New order assigned: #${assignedOrder.orderId}`, "info", 6000);
      }
    };

    const handleOrderStatusUpdated = (updatedOrder) => {
      console.log(
        "[DeliveryPartner] Order status updated event received:",
        updatedOrder
      );
      console.log("[DeliveryPartner] Current user ID:", user?._id);
      console.log(
        "[DeliveryPartner] Updated order delivery partner:",
        updatedOrder.deliveryPartner
      );

      // Check if this is the current user's order
      if (
        updatedOrder.deliveryPartner &&
        updatedOrder.deliveryPartner._id === user?._id
      ) {
        console.log("[DeliveryPartner] This is my order, updating state");

        // Update current order if it's the same order
        setCurrentOrder((prevOrder) => {
          console.log("[DeliveryPartner] Previous current order:", prevOrder);

          if (prevOrder && prevOrder._id === updatedOrder._id) {
            console.log(
              `[DeliveryPartner] Updating current order status: ${prevOrder.status} -> ${updatedOrder.status}`
            );

            // Show toast for status updates
            if (updatedOrder.status === "DELIVERED") {
              addToast("Order delivered successfully!", "success", 5000);
              console.log(
                "[DeliveryPartner] Order delivered, clearing current order"
              );
              // Return null to clear current order when delivered
              return null;
            } else {
              addToast(
                `Order status updated to ${updatedOrder.status.replace(
                  /_/g,
                  " "
                )}`,
                "success",
                4000
              );
              console.log("[DeliveryPartner] Returning updated order");
              // Return the updated order
              return updatedOrder;
            }
          }
          console.log(
            "[DeliveryPartner] Not updating current order (different order or no current order)"
          );
          return prevOrder;
        });

        // Update order history
        setOrderHistory((prevHistory) => {
          console.log("[DeliveryPartner] Updating order history");
          return prevHistory.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          );
        });

        loadStats(); // Refresh stats
      } else {
        console.log("[DeliveryPartner] Not my order, ignoring update");
      }
    };

    const handleOrderUpdated = (updatedOrder) => {
      console.log("Order updated:", updatedOrder);
      // Check if this is the current user's order
      if (
        updatedOrder.deliveryPartner &&
        updatedOrder.deliveryPartner._id === user?._id
      ) {
        setCurrentOrder((prevOrder) => {
          if (prevOrder && prevOrder._id === updatedOrder._id) {
            addToast("Order details updated", "info", 3000);
            return updatedOrder;
          }
          return prevOrder;
        });

        // Update order history
        setOrderHistory((prevHistory) =>
          prevHistory.map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          )
        );
      }
    };

    // Register event listeners
    on("orderAssigned", handleOrderAssigned);
    on("orderStatusUpdated", handleOrderStatusUpdated);
    on("orderUpdated", handleOrderUpdated);

    // Cleanup listeners on unmount
    return () => {
      off("orderAssigned", handleOrderAssigned);
      off("orderStatusUpdated", handleOrderStatusUpdated);
      off("orderUpdated", handleOrderUpdated);
    };
  }, [connected, on, off, user?._id, addToast, loadStats, loadOrderHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      console.log(
        `[DeliveryPartner] Updating order ${orderId} status to ${newStatus}`
      );
      console.log(`[DeliveryPartner] Current user ID: ${user?._id}`);
      console.log(`[DeliveryPartner] Current order:`, currentOrder);

      const response = await ordersAPI.updateOrderStatus(orderId, newStatus);
      console.log(
        `[DeliveryPartner] Status update API response:`,
        response.data
      );

      // Don't reload data manually - socket events will handle the update
      console.log(
        "[DeliveryPartner] Status update API call successful, waiting for socket event"
      );
    } catch (error) {
      console.error("[DeliveryPartner] Error updating order status:", error);
      console.error("[DeliveryPartner] Error response:", error.response?.data);

      let errorMessage = "Failed to update order status. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      addToast(errorMessage, "error", 5000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PREPARING":
        return "bg-blue-100 text-blue-800";
      case "READY":
        return "bg-purple-100 text-purple-800";
      case "OUT_FOR_DELIVERY":
        return "bg-orange-100 text-orange-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "PREPARING":
        return "READY";
      case "READY":
        return "OUT_FOR_DELIVERY";
      case "OUT_FOR_DELIVERY":
        return "DELIVERED";
      default:
        return null;
    }
  };

  const getStatusActionText = (currentStatus) => {
    switch (currentStatus) {
      case "PREPARING":
        return "Mark as Ready";
      case "READY":
        return "Start Delivery";
      case "OUT_FOR_DELIVERY":
        return "Mark as Delivered";
      default:
        return null;
    }
  };

  const canUpdateStatus = (status) => {
    return (
      status === "PREPARING" ||
      status === "READY" ||
      status === "OUT_FOR_DELIVERY"
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    try {
      return new Date(timeString).toLocaleTimeString();
    } catch (error) {
      return "Invalid time";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Delivery Partner Dashboard
                </h1>
                <p className="text-gray-600">Welcome back, {user?.username}</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Real-time connection indicator */}
                <div className="flex items-center">
                  {connected ? (
                    <div className="flex items-center text-green-600">
                      <Wifi className="h-4 w-4 mr-1" />
                      <span className="text-xs">Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <WifiOff className="h-4 w-4 mr-1" />
                      <span className="text-xs">Offline</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Deliveries
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalDeliveries}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed Today
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.completedToday}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Average Rating
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.averageRating
                          ? typeof stats.averageRating === "string"
                            ? stats.averageRating
                            : stats.averageRating.toFixed(1)
                          : "N/A"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Order */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Current Assignment
              </h3>

              {currentOrder ? (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        Order #{currentOrder.orderId}
                      </h4>
                      <p className="text-gray-600">
                        Customer: {currentOrder.customerName}
                      </p>
                      <p className="text-gray-600">
                        Phone: {currentOrder.customerPhone}
                      </p>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col items-end">
                      <label className="text-xs text-gray-500 mb-1">
                        Order Status
                      </label>
                      {canUpdateStatus(currentOrder.status) ? (
                        <div className="relative">
                          <select
                            value={currentOrder.status}
                            onChange={(e) => {
                              if (e.target.value !== currentOrder.status) {
                                handleStatusUpdate(
                                  currentOrder._id,
                                  e.target.value
                                );
                              }
                            }}
                            disabled={updatingStatus}
                            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 min-w-[160px]"
                          >
                            <option value={currentOrder.status}>
                              {currentOrder.status.replace(/_/g, " ")} (Current)
                            </option>
                            {getNextStatus(currentOrder.status) && (
                              <option
                                value={getNextStatus(currentOrder.status)}
                              >
                                →{" "}
                                {getNextStatus(currentOrder.status).replace(
                                  /_/g,
                                  " "
                                )}
                              </option>
                            )}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(
                            currentOrder.status
                          )}`}
                        >
                          {currentOrder.status.replace(/_/g, " ")}
                        </span>
                      )}
                      {updatingStatus && (
                        <div className="flex items-center mt-1">
                          <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                          <span className="text-xs text-gray-500">
                            Updating...
                          </span>
                        </div>
                      )}
                      {canUpdateStatus(currentOrder.status) &&
                        !updatingStatus && (
                          <p className="text-xs text-gray-400 mt-1 text-right">
                            Select next status to update
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Delivery Address
                      </h5>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1 mr-2" />
                        <p className="text-gray-600">
                          {currentOrder.deliveryAddress}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">
                        Order Details
                      </h5>
                      <p className="text-gray-600">
                        Prep Time: {currentOrder.prepTime || "N/A"} mins
                      </p>
                      <p className="text-gray-600">
                        Dispatch Time: {formatTime(currentOrder.dispatchTime)}
                      </p>
                      <p className="text-gray-600">
                        Created: {formatDate(currentOrder.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h5 className="font-medium text-gray-900 mb-2">Items</h5>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {currentOrder.items?.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>{item.name}</span>
                            <span>Qty: {item.quantity}</span>
                          </li>
                        )) || <li>No items available</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No current assignment
                  </h4>
                  <p className="text-gray-600">
                    You don't have any orders assigned at the moment.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Recent Deliveries
              </h3>

              {orderHistory.length > 0 ? (
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderHistory.slice(0, 10).map((order) => (
                        <tr key={order._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {order.deliveryAddress}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No delivery history
                  </h4>
                  <p className="text-gray-600">
                    Your completed deliveries will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeliveryPartnerDashboard;
