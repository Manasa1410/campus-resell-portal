/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import API from "../services/api";
import Icon from "./ui/Icon";

const NotificationDropdown = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get("/notifications");
      setNotifications(data.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();

      const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin);
      socket.emit("join", user._id);

      socket.on("newNotification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });

      return () => {
        socket.off("newNotification");
        socket.disconnect();
      };
    }
  }, [user?._id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;

    try {
      await API.delete("/notifications/clear");
      setNotifications([]);
      toast.success("Notifications cleared");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear notifications");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        aria-label="Notifications"
      >
        <Icon name="bell" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full border-2 border-white bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white dark:border-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">Notifications</h3>
            <div className="flex gap-3">
              <button className="text-[10px] font-bold uppercase text-blue-600 hover:underline" onClick={fetchNotifications}>
                Refresh
              </button>
              {notifications.length > 0 && (
                <button className="text-[10px] font-bold uppercase text-red-600 hover:underline" onClick={clearAll}>
                  Clear All
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No notifications yet</p>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification._id}
                  onClick={() => markRead(notification._id)}
                  className={`block w-full border-b p-4 text-left transition last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                    !notification.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <p className="text-sm leading-snug text-slate-800 dark:text-slate-100">{notification.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
