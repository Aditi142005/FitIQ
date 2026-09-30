import BACKEND_URL from "../config/api";
const API_URL = BACKEND_URL;

export async function getCohortAnalysis(userData) {
  try {
    const response = await fetch(
      `${API_URL}/cohort`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Cohort analysis failed"
      );
    }

    return data;

  } catch (error) {
    console.error(
      "Cohort analysis error:",
      error
    );

    throw error;
  }
}