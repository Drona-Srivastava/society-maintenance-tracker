import api from "./client";

export async function getComplaints() {
  const response = await api.get("/api/complaints");

  return response.data.items;
}

export async function getComplaint(complaintId) {
  const response = await api.get(
    `/api/complaints/${complaintId}`,
  );

  return response.data;
}

export async function getComplaintHistory(complaintId) {
  const response = await api.get(
    `/api/complaints/${complaintId}/history`,
  );

  return response.data;
}

export async function getComplaintPhoto(complaintId) {
  const response = await api.get(
    `/api/complaints/${complaintId}/photo`,
    {
      responseType: "blob",
    },
  );

  return URL.createObjectURL(response.data);
}

export async function createComplaint({
  category,
  description,
  photo,
}) {
  const formData = new FormData();

  formData.append("category", category);
  formData.append("description", description);

  if (photo) {
    formData.append("photo", photo);
  }

  const response = await api.post(
    "/api/complaints",
    formData,
  );

  return response.data;
}