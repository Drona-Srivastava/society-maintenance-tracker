import api from "./client";

export async function getAdminDashboard() {
  const response = await api.get("/api/admin/dashboard");

  return response.data;
}

export async function getAdminComplaints(params = {}) {
  const response = await api.get("/api/admin/complaints", {
    params,
  });

  return response.data;
}

export async function updateAdminComplaint(
  complaintId,
  data,
) {
  const response = await api.patch(
    `/api/admin/complaints/${complaintId}`,
    data,
  );

  return response.data;
}

export async function getAdminComplaintHistory(
  complaintId,
) {
  const response = await api.get(
    `/api/admin/complaints/${complaintId}/history`,
  );

  return response.data;
}

/* =========================
   NOTICES
========================= */

export async function getAdminNotices() {
  const response = await api.get("/api/notices");

  return response.data;
}

export async function createAdminNotice(data) {
  const response = await api.post(
    "/api/notices",
    data,
  );

  return response.data;
}

export async function updateAdminNotice(
  noticeId,
  data,
) {
  const response = await api.patch(
    `/api/notices/${noticeId}`,
    data,
  );

  return response.data;
}

export async function deleteAdminNotice(noticeId) {
  await api.delete(`/api/notices/${noticeId}`);
}