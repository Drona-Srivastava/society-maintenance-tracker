import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getMe,
  login as loginRequest,
  updateProfile as updateProfileRequest,
  uploadProfilePicture as uploadProfilePictureRequest,
} from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);

    localStorage.setItem("access_token", data.access_token);
    setUser(data.user);

    return data.user;
  };

  const updateProfile = async (userData) => {
    const updatedUser =
      await updateProfileRequest(userData);

    setUser(updatedUser);

    return updatedUser;
  };

  const uploadProfilePicture = async (file) => {
    const updatedUser =
      await uploadProfilePictureRequest(file);

    setUser(updatedUser);

    return updatedUser;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    updateProfile,
    uploadProfilePicture,
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}