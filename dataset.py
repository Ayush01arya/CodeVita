import requests
import pandas as pd

API_KEY = 'GOqDZwKM82drnqmifuAf6VfVcSUTDvrpnyrVtccp'
start_date = '2022-01-01'
end_date = '2022-01-07'
NASA_NEO_URL = f'https://api.nasa.gov/neo/rest/v1/feed?start_date={start_date}&end_date={end_date}&api_key={API_KEY}'

response = requests.get(NASA_NEO_URL)
data = response.json()

# Parse the data and create a DataFrame
neo_list = []
for date in data['near_earth_objects']:
    for neo in data['near_earth_objects'][date]:
        diameter = neo['estimated_diameter']['kilometers']['estimated_diameter_max']
        velocity = float(neo['close_approach_data'][0]['relative_velocity']['kilometers_per_second'])
        distance = float(neo['close_approach_data'][0]['miss_distance']['kilometers'])
        is_hazardous = 1 if neo['is_potentially_hazardous_asteroid'] else 0

        neo_list.append([diameter, velocity, distance, is_hazardous])

# Create a DataFrame
df = pd.DataFrame(neo_list, columns=['estimated_diameter', 'relative_velocity', 'miss_distance', 'is_hazardous'])

# Save to CSV
df.to_csv('neo_data.csv', index=False)
print('NEO data saved to neo_data.csv')
