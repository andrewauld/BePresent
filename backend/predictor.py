import pandas as pd
from pathlib import Path
import numpy as np

footfall_files = Path("datasets/footfall").glob("*.csv")

footfall_dfs = []
for file in footfall_files:
    df = pd.read_csv(file)
    footfall_dfs.append(df)
footfall = pd.concat(footfall_dfs, ignore_index=True)
footfall["datetime"] = pd.to_datetime(
    footfall["Date"].astype(str) + " " + footfall["Hour"].astype(str),
    format="%d-%b-%y %H:%M",
    dayfirst=True,
    errors="coerce",
)
footfall.drop(columns=["Date", "Hour"], inplace=True)

weather_file = Path("datasets/weather/weather.csv")
weather = pd.read_csv(weather_file, skiprows=2)
weather["datetime"] = pd.to_datetime(weather["time"])
weather.drop(columns=["time"], inplace=True)

data = footfall.merge(weather, on="datetime", how="inner", validate="many_to_one")

hourly  = (
    data.groupby("datetime", as_index=False)
    .agg(
        InCount=("InCount", "sum"),
        OutCount=("OutCount", "sum"),
        temperature=("temperature_2m (°C)", "mean"),
        precipitation=("precipitation (mm)", "mean"),
        cloud_cover=("cloud_cover (%)", "mean"),
    )
    .sort_values("datetime")
)
hourly["hour"] = hourly["datetime"].dt.hour
hourly["dow"] = hourly["datetime"].dt.dayofweek

dow_encodings = pd.get_dummies(hourly["dow"], prefix="dow", drop_first=True)

X = pd.concat(
    [
        hourly[["temperature", "precipitation", "cloud_cover", "hour"]],
        dow_encodings
    ],
    axis=1
).astype(float)

y = hourly["InCount"].astype(float)

mask = X.notna().all(axis=1) & y.notna()
X = X.loc[mask]
y = y.loc[mask]
dt = hourly.loc[mask, "datetime"]

n = len(X)
if n < 20:
    raise ValueError("Not enough data for training!")

split_idx = int(0.8 * n)
X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
dt_train, dt_test = dt.iloc[:split_idx], dt.iloc[split_idx:]

X_train_i = np.c_[np.ones(len(X_train)), X_train.to_numpy()]
X_test_i = np.c_[np.ones(len(X_test)), X_test.to_numpy()]

beta, *_ = np.linalg.lstsq(X_train_i, y_train.to_numpy(), rcond=None)

y_pred = X_test_i @ beta

rmse = float(np.sqrt(np.mean((y_test.to_numpy() - y_pred) ** 2)))
ss_res = float(np.sum((y_test.to_numpy() - y_pred) ** 2))
ss_tot = float(np.sum((y_test.to_numpy() - np.mean(y_test.to_numpy())) ** 2))
r2 = 1.0 - (ss_res / ss_tot if ss_tot != 0 else np.nan)

feature_names = ["intercept"] + X.columns.tolist()
coef_table = pd.DataFrame({"feature": feature_names, "coef": beta})

print("Rows (train/test):", len(X_train), len(X_test))
print(f"Test RMSE: {rmse:.2f}")
print(f"Test R²:   {r2:.3f}")
print("\nCoefficients:")
print(coef_table.sort_values("coef", key=lambda s: s.abs(), ascending=False).to_string(index=False))

preview = pd.DataFrame(
    {"datetime": dt_test.to_numpy(), "actual_InCount": y_test.to_numpy(), "pred_InCount": y_pred}
).head(10)
print("\nPrediction preview:")
print(preview.to_string(index=False))
