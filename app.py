from flask import Flask, jsonify
import requests
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

NASA_API_KEY = 'GOqDZwKM82drnqmifuAf6VfVcSUTDvrpnyrVtccp'  # Get this from https://api.nasa.gov/
NASA_NEO_URL = "https://api.nasa.gov/neo/rest/v1/feed"

# Load the trained model
with open('neo_classifier.pkl', 'rb') as f:
    model = pickle.load(f)


# Helper function to classify NEOs based on diameter, velocity, and distance
def classify_neo(estimated_diameter, relative_velocity, miss_distance):
    # Prepare the input for prediction
    input_features = np.array([[estimated_diameter, relative_velocity, miss_distance]])

    # Predict using the pre-trained model
    prediction = model.predict(input_features)

    # Return 'Hazardous' if the prediction is 1, else 'Non-hazardous'
    return "Potentially Hazardous" if prediction[0] == 1 else "Non-hazardous"


@app.route('/api/neo/<start_date>/<end_date>', methods=['GET'])
def get_neos(start_date, end_date):
    params = {
        'start_date': start_date,
        'end_date': end_date,
        'api_key': NASA_API_KEY
    }
    response = requests.get(NASA_NEO_URL, params=params)

    if response.status_code == 200:
        data = response.json()

        # Process the NEO data and classify each object
        for date in data['near_earth_objects']:
            for neo in data['near_earth_objects'][date]:
                estimated_diameter = neo['estimated_diameter']['kilometers']['estimated_diameter_max']
                relative_velocity = float(neo['close_approach_data'][0]['relative_velocity']['kilometers_per_second'])
                miss_distance = float(neo['close_approach_data'][0]['miss_distance']['kilometers'])

                # Classify the NEO
                classification = classify_neo(estimated_diameter, relative_velocity, miss_distance)

                # Add classification result to the NEO data
                neo['classification'] = classification

        return jsonify(data)
    else:
        return jsonify({"error": "Failed to fetch data", "status_code": response.status_code,
                        "details": response.text}), response.status_code


if __name__ == "__main__":
    app.run(debug=True)
