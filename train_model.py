# train_model.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle

# Step 1: Load the dataset
# The dataset should have 'estimated_diameter', 'relative_velocity', 'miss_distance', and a label 'is_hazardous'
data = pd.read_csv('neo_data.csv')  # Load the dataset (replace with your dataset)

# Step 2: Preprocess and split the data
X = data[['estimated_diameter', 'relative_velocity', 'miss_distance']]  # Features
y = data['is_hazardous']  # Label (1 for hazardous, 0 for non-hazardous)

# Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Step 3: Train the model (Random Forest Classifier)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Step 4: Save the trained model to disk
with open('neo_classifier.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Model trained and saved!")
