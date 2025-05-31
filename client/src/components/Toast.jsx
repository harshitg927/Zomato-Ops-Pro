import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const Toast = ({ message, type = "info", duration = 4000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      case "info":
      default:
        return "text-blue-800";
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 flex items-center p-4 border rounded-lg shadow-lg max-w-sm
        ${getBackgroundColor()} ${getTextColor()}
        transform transition-all duration-300 ease-in-out
        ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <div className="flex items-center">
        {getIcon()}
        <p className="ml-3 text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className={`ml-4 inline-flex text-sm ${getTextColor()} hover:opacity-75`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info", duration = 4000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };

    setToasts((prevToasts) => [...prevToasts, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-0 right-0 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return { addToast, ToastContainer };
};

export default Toast;
