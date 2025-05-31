import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ordersAPI, deliveryAPI } from "../services/api";
import {
  LogOut,
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  MapPin,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const DeliveryPartnerDashboard = () => {
  const { user, logout } = useAuth();
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCurrentOrder(), loadOrderHistory(), loadStats()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentOrder = async () => {
    try {
      const response = await ordersAPI.getCurrentOrder();
      setCurrentOrder(response.data.order || null);
    } catch (error) {
      console.error("Error loading current order:", error);
      setCurrentOrder(null);
    }
  };

  const loadOrderHistory = async () => {
    try {
      const response = await ordersAPI.getOrderHistory();
      const historyData = response.data.orders || response.data || [];
      setOrderHistory(historyData);
    } catch (error) {
      console.error("Error loading order history:", error);
      setOrderHistory([]);
    }
  };

  const loadStats = async () => {
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
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await ordersAPI.updateOrderStatus(orderId, newStatus);
      await loadData(); // Refresh data after status update
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status. Please try again.");
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
      case "READY":
        return "Start Delivery";
      case "OUT_FOR_DELIVERY":
        return "Mark as Delivered";
      default:
        return null;
    }
  };

  const canUpdateStatus = (status) => {
    return status === "READY" || status === "OUT_FOR_DELIVERY";
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
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
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
                        ? stats.averageRating.toFixed(1)
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
                      Order #{currentOrder._id.slice(-6)}
                    </h4>
                    <p className="text-gray-600">
                      Customer: {currentOrder.customerName}
                    </p>
                    <p className="text-gray-600">
                      Phone: {currentOrder.customerPhone}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      currentOrder.status
                    )}`}
                  >
                    {currentOrder.status.replace(/_/g, " ")}
                  </span>
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

                {canUpdateStatus(currentOrder.status) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        handleStatusUpdate(
                          currentOrder._id,
                          getNextStatus(currentOrder.status)
                        )
                      }
                      disabled={updatingStatus}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {updatingStatus ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {getStatusActionText(currentOrder.status)}
                    </button>
                  </div>
                )}
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
                          #{order._id.slice(-6)}
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
  );
};

export default DeliveryPartnerDashboard;
