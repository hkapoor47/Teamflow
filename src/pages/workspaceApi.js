const API_BASE_URL = "http://65.0.11.153:5001/api";


// =====================================================
// TOKEN
// =====================================================

export function getToken() {
  return localStorage.getItem("token");
}


// =====================================================
// CURRENT USER ID
// =====================================================

export function getCurrentUserId() {
  try {
    const token = getToken();

    if (!token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      atob(parts[1])
    );

    return (
      payload.userId ??
      payload.id ??
      payload.sub ??
      null
    );

  } catch (error) {

    console.error(
      "Unable to read user ID:",
      error
    );

    return null;
  }
}


// =====================================================
// GET API
// =====================================================

export async function apiGet(path) {

  const token = getToken();

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      },
    }
  );


  const text =
    await response.text();


  let data = {};

  try {

    data = text
      ? JSON.parse(text)
      : {};

  } catch {

    data = {};

  }


  if (!response.ok) {

    throw new Error(
      data?.message ||
      `Request failed: ${response.status}`
    );

  }


  return data;
}


// =====================================================
// ARRAY NORMALIZER
// =====================================================

export function getArray(
  data,
  keys = []
) {

  if (Array.isArray(data)) {
    return data;
  }


  for (const key of keys) {

    if (
      Array.isArray(
        data?.[key]
      )
    ) {

      return data[key];

    }

  }


  return [];
}


// =====================================================
// STATUS NORMALIZER
// =====================================================

export function normalizeStatus(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .toUpperCase();
}


// =====================================================
// DATE FORMAT
// =====================================================

export function formatDate(
  value
) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


// =====================================================
// EXPORT API BASE URL
// =====================================================

export {
  API_BASE_URL,
};