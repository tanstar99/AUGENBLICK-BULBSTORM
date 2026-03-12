import { Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import Home from "./pages/Home";
import UserDataContext from "./context/UserDataContext";
import { useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";

const App = () => {
  const userData = useSelector((state: any) => state.user.userData);

  return (
    <Layout>
      <ToastContainer
        position="top-left"
        hideProgressBar={true}
        autoClose={1000}
        theme="dark"
        toastStyle={{
          background: "#18181b",
          color: "#fafafa",
          borderRadius: "10px",
          fontWeight: "500",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
      />
      <UserDataContext />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={userData ? <Navigate to="/" /> : <SignUp />} />
        <Route path="/login" element={userData ? <Navigate to="/" /> : <Login />} />
        {/* Placeholders for new routes added to Layout nav */}
        <Route path="/marketplace" element={<div className="text-white p-8">Marketplace Coming Soon</div>} />
        <Route path="/passports" element={<div className="text-white p-8">Passports Coming Soon</div>} />
      </Routes>
    </Layout>
  );
};

export default App;
