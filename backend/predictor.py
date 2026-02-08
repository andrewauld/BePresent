import pandas as pd
from pathlib import Path

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
print(data)
