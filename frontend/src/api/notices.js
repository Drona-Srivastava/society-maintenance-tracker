import api from "./client";

export async function getNotices() {
  const response = await api.get("/api/notices");
  return response.data;
}

export async function getNotice(noticeId) {
  const response = await api.get(
    `/api/notices/${noticeId}`,
  );

  return response.data;
}