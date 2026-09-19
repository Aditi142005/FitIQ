const API_URL = "http://127.0.0.1:5000";

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