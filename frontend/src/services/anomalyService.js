import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

export const getAnomalyAnalysis = async (trackingRecords) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/anomaly`,
      {
        trackingRecords
      }
    );

    return response.data;

  } catch (error) {

    console.error(
      "Error fetching activity pattern analysis:",
      error
    );

    throw new Error(
      error.response?.data?.message ||
      "Failed to analyze your activity pattern."
    );
  }
};