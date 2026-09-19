import os
import joblib
import pandas as pd
import shap
from sklearn.ensemble import RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
DATA_PATH = "data/FitIQ_FitLife360_Cleaned_Foundation.csv"

def create_prediction_dataset():

    df = pd.read_csv(DATA_PATH)

    df["date"] = pd.to_datetime(df["date"])

    df = df.sort_values(
        ["participant_id", "date"]
    ).reset_index(drop=True)

    feature_columns = [
        "participant_id",
        "date",
        "age",
        "height_cm",
        "weight_kg",
        "fitiq_bmi",
        "daily_steps",
        "duration_minutes",
        "hours_sleep",
        "hydration_level",
        "stress_level"
    ]

    df = df[feature_columns]

    # Find the first future observation at least 7 days later.
    prediction_parts = []

    for participant_id, group in df.groupby("participant_id"):

        group = group.sort_values("date").reset_index(drop=True)

        dates = group["date"].tolist()

        future_indices = []
        j = 0

        for i in range(len(group)):

            target_date = dates[i] + pd.Timedelta(days=7)

            while j < len(group) and dates[j] < target_date:
                j += 1

            if j < len(group):
                future_indices.append(j)
            else:
                future_indices.append(None)

        group["future_index"] = future_indices

        group["future_bmi"] = [
            group.loc[int(index), "fitiq_bmi"]
            if pd.notna(index)
            else None
            for index in group["future_index"]
        ]

        # Target = change in BMI
        group["bmi_change"] = (
            group["future_bmi"] - group["fitiq_bmi"]
        )

        prediction_parts.append(group)

    prediction_df = pd.concat(
        prediction_parts,
        ignore_index=True
    )

    prediction_df = prediction_df.dropna(
        subset=["bmi_change"]
    )

    prediction_df = prediction_df.drop(
        columns=["date", "future_index", "future_bmi"]
    )

    return prediction_df.reset_index(drop=True)

def train_prediction_model(prediction_df):

    # Separate features and target
    X = prediction_df.drop(columns=["bmi_change", "participant_id"])
    y = prediction_df["bmi_change"]

    # Keep participant IDs only for splitting
    groups = prediction_df["participant_id"]

    # Split participants, not individual rows
    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.2,
        random_state=42
    )

    train_idx, test_idx = next(
        splitter.split(X, y, groups=groups)
    )

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]

    print("\n===== TRAIN / TEST SPLIT =====")
    print("Training samples:", len(X_train))
    print("Testing samples:", len(X_test))
    print("Training participants:", groups.iloc[train_idx].nunique())
    print("Testing participants:", groups.iloc[test_idx].nunique())

    # Random Forest Regression
    model = RandomForestRegressor(
        n_estimators=50,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )

    print("\n===== TRAINING MODEL =====")

    model.fit(
        X_train,
        y_train
    )

    print("Training completed.")
    model_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "models"
    )

    os.makedirs(model_dir, exist_ok=True)

    model_path = os.path.join(
      model_dir,
      "fitiq_bmi_change_model.pkl"
    )

    joblib.dump(model, model_path)

    print("\nModel saved to:")
    print(model_path)
    # Predictions
    predictions = model.predict(X_test)

    # Evaluation
    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = mean_squared_error(
        y_test,
        predictions
    ) ** 0.5

    r2 = r2_score(
        y_test,
        predictions
    )

    print("\n===== MODEL PERFORMANCE =====")
    print(f"MAE  : {mae:.4f}")
    print(f"RMSE : {rmse:.4f}")
    print(f"R²   : {r2:.4f}")

        # Feature importance
    print("\n===== FEATURE IMPORTANCE =====")

    importance = model.feature_importances_

    feature_importance = pd.DataFrame({
        "feature": X.columns,
        "importance": importance
    })

    feature_importance = feature_importance.sort_values(
        "importance",
        ascending=False
    )

    print(feature_importance)
    return model, X_test

def explain_prediction_model(model, X_test):

    print("\n===== SHAP ANALYSIS =====")

    # Use a small sample for fast SHAP calculation
    X_sample = X_test.sample(
        n=min(500, len(X_test)),
        random_state=42
    )

    explainer = shap.TreeExplainer(model)

    shap_values = explainer.shap_values(X_sample)

    # Average absolute SHAP value for each feature
    shap_importance = pd.DataFrame({
        "feature": X_sample.columns,
        "mean_abs_shap": abs(shap_values).mean(axis=0)
    })

    shap_importance = shap_importance.sort_values(
        "mean_abs_shap",
        ascending=False
    )

    print(shap_importance)

    return shap_importance
if __name__ == "__main__":

    data = create_prediction_dataset()

    print("\n===== PREDICTION DATASET =====")
    print("Shape:", data.shape)

    print("\n===== COLUMNS =====")
    print(data.columns.tolist())

    print("\n===== SAMPLE =====")
    print(data.head())

    print("\n===== MISSING VALUES =====")
    print(data.isnull().sum())

    print("\n===== BMI CHANGE SUMMARY =====")
    print(data["bmi_change"].describe())

    model, X_test = train_prediction_model(data)

    explain_prediction_model(
      model,
      X_test
)