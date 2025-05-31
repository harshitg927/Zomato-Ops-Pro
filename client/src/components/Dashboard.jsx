import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "./Toast";
import { ordersAPI, deliveryAPI } from "../services/api";
import OrderTable from "./OrderTable";
import CreateOrderModal from "./CreateOrderModal";
import AssignPartnerModal from "./AssignPartnerModal";
import DeliveryPartnerManagement from "./DeliveryPartnerManagement";
import {
  Plus,
  LogOut,
  RefreshCw,
  Users,
  Clock,
  Wifi,
  WifiOff,
  ShoppingBag,
  UserCheck,
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { connected, on, off } = useSocket();
  const { addToast, ToastContainer } = useToast();
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("orders"); // "orders" or "partners"
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    availablePartners: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!connected) return;

    // Listen for order events
    const handleOrderCreated = (newOrder) => {
      console.log("Order created:", newOrder);
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
      loadStats(); // Refresh stats
      addToast(`New order created: #${newOrder.orderId}`, "success", 4000);
    };

    const handleOrderStatusUpdated = (updatedOrder) => {
      console.log("Order status updated:", updatedOrder);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
      loadStats(); // Refresh stats

      const statusMessages = {
        READY: "Order ready for pickup",
        OUT_FOR_DELIVERY: "Order out for delivery",
        DELIVERED: "Order delivered successfully",
      };

      const message =
        statusMessages[updatedOrder.status] ||
        `Order status updated to ${updatedOrder.status.replace(/_/g, " ")}`;
      addToast(`#${updatedOrder.orderId}: ${message}`, "info", 4000);
    };

    const handleOrderAssigned = (assignedOrder) => {
      console.log("Order assigned:", assignedOrder);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === assignedOrder._id ? assignedOrder : order
        )
      );
      loadStats(); // Refresh stats
      loadDeliveryPartners(); // Refresh partners availability
      addToast(
        `Order #${assignedOrder.orderId} assigned to ${assignedOrder.deliveryPartner?.username}`,
        "success",
        5000
      );
    };

    const handleOrderUpdated = (updatedOrder) => {
      console.log("Order updated:", updatedOrder);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
      addToast(`Order #${updatedOrder.orderId} updated`, "info", 3000);
    };

    const handleOrderDeleted = ({ orderId }) => {
      console.log("Order deleted:", orderId);
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order._id !== orderId)
      );
      loadStats(); // Refresh stats
      addToast("Order deleted", "info", 3000);
    };

    const handleDeliveryPartnerAvailabilityChanged = ({
      partnerId,
      isAvailable,
    }) => {
      console.log("Delivery partner availability changed:", {
        partnerId,
        isAvailable,
      });
      loadDeliveryPartners(); // Refresh partners list
      loadStats(); // Refresh stats

      // Find partner info if available in current list
      const partner = deliveryPartners.find((p) => p._id === partnerId);
      const partnerName = partner?.username || "Partner";
      const statusText = isAvailable ? "available" : "unavailable";
      addToast(`${partnerName} is now ${statusText}`, "info", 3000);
    };

    const handleDeliveryPartnerCreated = (newPartner) => {
      console.log("Delivery partner created:", newPartner);
      loadDeliveryPartners(); // Refresh partners list
      loadStats(); // Refresh stats
      addToast(
        `New delivery partner ${newPartner.username} created`,
        "success",
        4000
      );
    };

    const handleDeliveryPartnerUpdated = (updatedPartner) => {
      console.log("Delivery partner updated:", updatedPartner);
      loadDeliveryPartners(); // Refresh partners list
      loadStats(); // Refresh stats
      addToast(
        `Delivery partner ${updatedPartner.username} updated`,
        "info",
        3000
      );
    };

    const handleDeliveryPartnerDeleted = ({ partnerId }) => {
      console.log("Delivery partner deleted:", partnerId);
      loadDeliveryPartners(); // Refresh partners list
      loadStats(); // Refresh stats
      addToast("Delivery partner deleted", "info", 3000);
    };

    // Register event listeners
    on("orderCreated", handleOrderCreated);
    on("orderStatusUpdated", handleOrderStatusUpdated);
    on("orderAssigned", handleOrderAssigned);
    on("orderUpdated", handleOrderUpdated);
    on("orderDeleted", handleOrderDeleted);
    on(
      "deliveryPartnerAvailabilityChanged",
      handleDeliveryPartnerAvailabilityChanged
    );
    on("deliveryPartnerCreated", handleDeliveryPartnerCreated);
    on("deliveryPartnerUpdated", handleDeliveryPartnerUpdated);
    on("deliveryPartnerDeleted", handleDeliveryPartnerDeleted);

    // Cleanup listeners on unmount
    return () => {
      off("orderCreated", handleOrderCreated);
      off("orderStatusUpdated", handleOrderStatusUpdated);
      off("orderAssigned", handleOrderAssigned);
      off("orderUpdated", handleOrderUpdated);
      off("orderDeleted", handleOrderDeleted);
      off(
        "deliveryPartnerAvailabilityChanged",
        handleDeliveryPartnerAvailabilityChanged
      );
      off("deliveryPartnerCreated", handleDeliveryPartnerCreated);
      off("deliveryPartnerUpdated", handleDeliveryPartnerUpdated);
      off("deliveryPartnerDeleted", handleDeliveryPartnerDeleted);
    };
  }, [connected, on, off, addToast, deliveryPartners]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadOrders(), loadDeliveryPartners(), loadStats()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getAllOrders();
      const ordersData = response.data.orders || response.data || [];
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    }
  };

  const loadDeliveryPartners = async () => {
    try {
      const response = await deliveryAPI.getAvailablePartners();
      const partnersData = response.data.partners || response.data || [];
      setDeliveryPartners(partnersData);
    } catch (error) {
      console.error("Error loading delivery partners:", error);
      setDeliveryPartners([]);
    }
  };

  const loadStats = async () => {
    try {
      const [ordersResponse, partnersResponse] = await Promise.all([
        ordersAPI.getAllOrders(),
        deliveryAPI.getAvailablePartners(),
      ]);

      const allOrders = ordersResponse.data.orders || ordersResponse.data || [];
      const allPartners =
        partnersResponse.data.partners || partnersResponse.data || [];

      const activeOrders = allOrders.filter(
        (order) => order.status !== "DELIVERED"
      );

      setStats({
        totalOrders: allOrders.length,
        activeOrders: activeOrders.length,
        availablePartners: allPartners.length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      setStats({
        totalOrders: 0,
        activeOrders: 0,
        availablePartners: 0,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateOrder = async (orderData) => {
    try {
      await ordersAPI.createOrder(orderData);
      await loadData();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating order:", error);
      addToast("Failed to create order. Please try again.", "error", 5000);
      throw error;
    }
  };

  const handleAssignPartner = (order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const handlePartnerAssignment = async (partnerId) => {
    try {
      await ordersAPI.assignDeliveryPartner(selectedOrder._id, partnerId);
      await loadData();
      setShowAssignModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error assigning partner:", error);
      addToast(
        "Failed to assign delivery partner. Please try again.",
        "error",
        5000
      );
      throw error;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const tabs = [
    {
      id: "orders",
      name: "Orders Management",
      icon: ShoppingBag,
    },
    {
      id: "partners",
      name: "Delivery Partners",
      icon: UserCheck,
    },
  ];

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
                  Restaurant Manager Dashboard
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

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200 mt-4">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon
                      className={`-ml-0.5 mr-2 h-5 w-5 ${
                        activeTab === tab.id
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Orders
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalOrders}
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
                    <RefreshCw className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Orders
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.activeOrders}
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
                    <Users className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Available Partners
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.availablePartners}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === "orders" && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Orders Management
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Order
                  </button>
                </div>

                <OrderTable
                  orders={orders}
                  onAssignPartner={handleAssignPartner}
                />
              </div>
            </div>
          )}

          {activeTab === "partners" && <DeliveryPartnerManagement />}
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateOrderModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateOrder}
          />
        )}

        {showAssignModal && selectedOrder && (
          <AssignPartnerModal
            order={selectedOrder}
            partners={deliveryPartners}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedOrder(null);
            }}
            onAssign={handlePartnerAssignment}
          />
        )}
      </div>
    </>
  );
};

export default Dashboard;
