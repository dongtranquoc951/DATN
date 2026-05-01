import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PublicLayout() {
  return (
    <>
      <Header />
      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
