import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import PublicLayout from "./layouts/PublicLayout";
import LearningLayout from "./layouts/LearningLayout";
import CommunityLayout from "./layouts/CommunityLayout";
import MyMap    from "./pages/Home/MyMap/index";
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import LevelList from "./pages/Home/Learning/LevelList";
import PlayLevelLearning from "./pages/Home/Learning/PlayLevel";

import MapList from "./pages/Home/Community/MapList";
import CreateMap from "./pages/Home/MyMap/CreateMap";
import History from "./pages/Home/Community/History";
import PlayLevelCommunity from "./pages/Home/Community/PlayLevel";

import AdminLayout from "./pages/Admin/index";
import UserManager from "./pages/Admin/UserManager/index";
import MapManager from "./pages/Admin/MapManager/index";
import LevelManager from "./pages/Admin/LevelManager/index";
import Profile from "./pages/Home/Profile";
import CateManager from "./pages/Admin/CateManager/index";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ADMIN — bọc ProtectedRoute requireAdmin */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users"      element={<UserManager />} />
          <Route path="maps"       element={<MapManager />} />
          <Route path="levels"     element={<LevelManager />} />
          <Route path="categories" element={<CateManager />} />
        </Route>

        {/* PUBLIC */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Route>



        {/* LEARNING */}
        <Route path="/learning" element={<LearningLayout />}>
          <Route index element={<LevelList />} />
          <Route path="playlevel/:level" element={<PlayLevelLearning />} />
        </Route>
        
        {/* MY MAP — bọc ProtectedRoute, cần đăng nhập */}
        <Route path="/mymap" element={
          <ProtectedRoute>
            <CommunityLayout />
          </ProtectedRoute>
        }>
          <Route index        element={<MyMap />} />
          <Route path="create" element={<CreateMap />} />
        </Route>
        
        {/* COMMUNITY */}
        <Route path="/community" element={<CommunityLayout />}>
          <Route index element={<MapList />} />
          <Route path="history" element={<History />} />
          <Route path=":mapId" element={<PlayLevelCommunity />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}