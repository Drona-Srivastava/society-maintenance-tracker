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
  const [authError, setAuthError] = useState(null);
  const [authRetry, setAuthRetry] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setAuthError(null);

    getMe()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          setUser(null);
          return;
        }

        console.error("Failed to restore session:", error);

        setAuthError(
          "We couldn't connect to the server. Please try again.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authRetry]);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);

    localStorage.setItem("access_token", data.access_token);
    setUser(data.user);
    setAuthError(null);

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
    setAuthError(null);
  };

  const retryAuth = () => {
    setAuthRetry((value) => value + 1);
  };

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: Boolean(user),
    login,
    logout,
    updateProfile,
    uploadProfilePicture,
    retryAuth,
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
