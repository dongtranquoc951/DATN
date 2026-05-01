import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import SidebarC from "../components/SidebarC";
import Footer from "../components/Footer";

export default function CommunityLayout() {
  return (
    <>
      <Header />
      <div style={{ display: "flex" }}>
        <SidebarC />
        <main style={{ padding: 20, flex: 1 }}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
}