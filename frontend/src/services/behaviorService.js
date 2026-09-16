const API_URL = "http://127.0.0.1:5000";

export const analyzeBehavior = async (trackingRecords) => {
  const response = await fetch(`${API_URL}/behavior`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      trackingRecords: trackingRecords || [],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze behavior");
  }

  return await response.json();
};