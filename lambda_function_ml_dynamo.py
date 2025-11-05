import json
import joblib
import boto3
import uuid
import time
import numpy as np
import os
import sklearn  # This will now be loaded from your Layer
import xgboost  # This will also be loaded from your Layer

# --- S3 Model Loading ---
# !! REPLACE WITH YOUR BUCKET NAME !!
BUCKET_NAME = "water-quality-ml-bucket" 
SCALER_KEY = "scaler_final.pkl"
MODEL_KEY = "water_quality_model_final_voting.pkl"

# Path to store models in Lambda's temporary storage
SCALER_PATH = "/tmp/scaler_final.pkl"
MODEL_PATH = "/tmp/water_quality_model_final_voting.pkl"

s3_client = boto3.client('s3')

# Download models ONLY if they don't already exist in /tmp/
if not os.path.exists(SCALER_PATH):
    print("Downloading scaler from S3...")
    s3_client.download_file(BUCKET_NAME, SCALER_KEY, SCALER_PATH)

if not os.path.exists(MODEL_PATH):
    print("Downloading model from S3...")
    s3_client.download_file(BUCKET_NAME, MODEL_KEY, MODEL_PATH)

# Load models from /tmp/
print("Loading models from /tmp/...")
scaler = joblib.load(SCALER_PATH)
model = joblib.load(MODEL_PATH)

# --- DynamoDB Setup ---
AWS_REGION = "us-east-1"
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table('WaterQualityReadings')

def lambda_handler(event, context):
    try:
        # 1. Extract sensor data
        device_id = event.get('device_id', 'unknown')
        sensor_data = event.get('data', {})
        ph = sensor_data.get('ph')
        solids = sensor_data.get('solids')
        turbidity = sensor_data.get('turbidity')

        if None in [ph, solids, turbidity]:
            raise ValueError("Missing one or more sensor readings")

        # 2. Prepare, Scale, and Predict
        features = np.array([[ph, solids, turbidity]])
        scaled_features = scaler.transform(features)
        prediction_result = model.predict(scaled_features)
        is_potable = int(prediction_result[0])

        # 3. Prepare item for DynamoDB
        reading_id = str(uuid.uuid4())
        timestamp_utc = int(time.time())

        item = {
            'reading_id': reading_id,
            'device_id': device_id,
            'timestamp_utc': timestamp_utc,
            'ph': f"{ph:.2f}",
            'solids': f"{solids:.2f}",
            'turbidity': f"{turbidity:.2f}",
            'is_potable': is_potable,
        }

        # 4. Store in DynamoDB
        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Data processed successfully', 'reading_id': reading_id})
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }