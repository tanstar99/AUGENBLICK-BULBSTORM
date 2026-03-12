import { useContext, useEffect } from "react";
import { AuthDataContext } from "./AuthDataContext";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

const UserDataContext = () => {
  const dispatch = useDispatch();
  const context = useContext(AuthDataContext);
  const serverUrl = context?.serverUrl || "http://localhost:8901";

  const getCurrentUser = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true });
      console.log("Current User Data:", res.data.user);
      dispatch(setUserData(res.data.user));
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, [dispatch, serverUrl]);
  return null;
};

export default UserDataContext;
