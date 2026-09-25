import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "./components/topbar";
import Sidebar from "./components/sidebar";

const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();


  const toggleSidebar = () => {
    setSidebarOpen((prevState) => !prevState);
  };

  // Fecha o menu lateral ao trocar de página (telas pequenas)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // No início do componente Layout
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden"; 
    } else {
      document.body.style.overflow = "";
    }
  }, [isSidebarOpen]);

  return (
    <div className="layout-container flex h-screen overflow-hidden relative">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#BDE3ED] bg-opacity-40 backdrop-blur-md z-[35] md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}

      <TopBar onMenuClick={toggleSidebar} />

      <div className="main-content flex flex-col flex-1 min-w-0 h-full bg-clara4">
        <main className="flex-1 overflow-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
