import api from "./client";

export async function getDashboard() {
  const response = await api.get("/api/dashboard");
  return response.data;
}