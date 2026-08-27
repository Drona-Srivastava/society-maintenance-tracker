import api from "./client";

export const login = async (email, password) => {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const register = async (userData) => {
  const response = await api.post("/api/auth/register", userData);

  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/api/auth/me");

  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await api.patch("/api/auth/profile", userData);

  return response.data;
};

export async function uploadProfilePicture(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/api/auth/profile-picture",
    formData,
  );

  return response.data;
}

export const forgotPassword = async (email) => {
  const response = await api.post(
    "/api/auth/forgot-password",
    {
      email,
    },
  );

  return response.data;
};

export const verifyResetOTP = async (
  email,
  otp,
) => {
  const response = await api.post(
    "/api/auth/verify-reset-otp",
    {
      email,
      otp,
    },
  );

  return response.data;
};

export const resetPassword = async (
  email,
  otp,
  newPassword,
) => {
  const response = await api.post(
    "/api/auth/reset-password",
    {
      email,
      otp,
      new_password: newPassword,
    },
  );

  return response.data;
};