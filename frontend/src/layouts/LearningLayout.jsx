import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import SidebarL from "../components/SidebarL";
import Footer from "../components/Footer";

export default function LearningLayout() {
  return (
    <>
      <Header />
      <div style={{ display: "flex" }}>
        <SidebarL />
        <main style={{ padding: 20, flex: 1 }}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
}
