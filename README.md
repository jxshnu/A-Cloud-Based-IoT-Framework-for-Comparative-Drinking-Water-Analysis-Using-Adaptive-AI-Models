💧 AWS Serverless Water Quality Monitor

This repository contains the full-stack code for a serverless, real-time water quality monitoring system. An ESP32 microcontroller sends sensor data (pH, turbidity, etc.) to a serverless backend on AWS, which processes the data, runs a machine learning model, and stores it in DynamoDB. A dynamic web frontend then visualizes this data on a Leaflet map.

(Action: Take a screenshot of your working web map and save it as frontend-demo.png in the frontend folder to have it appear here.)

✨ Core Features

IoT Data Ingestion: An ESP32 device sends sensor data to the cloud via HTTP POST.

Serverless Backend: Built with AWS Lambda and API Gateway for zero server management and infinite scalability.

ML Classification: A Lambda function processes incoming data and runs a placeholder ML model to classify water as "potable" or "not potable."

NoSQL Database: Uses Amazon DynamoDB for fast, flexible, and scalable data storage.

Dynamic Frontend: A vanilla HTML/JS/CSS frontend that fetches data and displays it on an interactive Leaflet map.

Admin Mode: A special mode on the frontend to list and geotag new readings that don't have coordinates.

📐 System Architecture

The project is divided into three main data flows:

Data Ingestion (POST):
ESP32 → API Gateway (/readings) → POST Lambda → (Runs ML Model) → DynamoDB (WaterQualityReadings)

Data Retrieval (GET):
Browser (Frontend) → API Gateway (/readings) → GET Lambda → DynamoDB (WaterQualityReadings) → Browser (Map)

Data Updating (PUT):
Browser (Admin Mode) → API Gateway (/readings/{id}) → PUT Lambda → DynamoDB (WaterQualityReadings)

📁 Project Structure

Your file structure [cite: image_45d19c.png] is organized by domain:

water-quality-api/
├── backend/
│   ├── lambda/
│   │   ├── get_readings_lambda/
│   │   │   └── app.py         # (GET Lambda) Fetches all data for the map
│   │   ├── post_reading_lambda/
│   │   │   └── app.py         # (POST Lambda) Saves new data from the ESP32
│   │   └── update_reading_lambda/
│   │       └── app.py         # (PUT Lambda) Updates coordinates from Admin Mode
│   └── sam-template/
│       └── template.yaml      # AWS SAM template to deploy the 3 Lambdas & API
├── frontend/
│   ├── index.html           # The main webpage
│   ├── script.js            # Frontend logic, map rendering, API calls
│   └── style.css            # Styling for the webpage
├── hardware/
│   └── esp32_code/
│       └── esp32_code.ino   # Arduino code for the ESP32 sensor
└── README.md


🚀 Setup & Deployment

To deploy this project, you will need the AWS CLI, AWS SAM CLI, and Docker Desktop installed and running.

1. Backend Deployment (AWS SAM)

The backend (API and 3 Lambdas) is deployed using the AWS Serverless Application Model (SAM).

Navigate to the SAM template directory:

cd backend/sam-template


Important: Your template.yaml must point to the code in the ../lambda/ directory. The CodeUri properties should look like this:

Properties:
  CodeUri: ../lambda/get_readings_lambda/
  ...
Properties:
  CodeUri: ../lambda/post_reading_lambda/
  ...
Properties:
  CodeUri: ../lambda/update_reading_lambda/
  ...


Build the functions using a container (this avoids local Python version issues):

sam build --use-container


Deploy the application to your AWS account:

sam deploy --guided


After deployment, SAM will output your new ApiUrl. Copy this URL.

2. Frontend Deployment (AWS S3)

The frontend is hosted as a static website on S3.

Update API URL: Open frontend/script.js and update the apiUrl variable with the URL you copied from the SAM deployment (e.g., https://epim79rryi.../v1/readings).

Create S3 Bucket:

Go to the AWS S3 console and create a new bucket (e.g., my-water-map-ui).

Uncheck "Block all public access" and acknowledge the warning.

Upload Files: Upload index.html, script.js, and style.css to the bucket.

Enable Static Hosting:

In the bucket's Properties tab, find "Static website hosting" and enable it.

Set the Index document to index.html.

Add Bucket Policy:

In the bucket's Permissions tab, paste the following policy (replace YOUR-BUCKET-NAME):

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}


You can now access your application from the Bucket website endpoint URL.

3. Hardware Deployment (ESP32)

Open hardware/esp32_code/esp32_code.ino in the Arduino IDE.

Update your WiFi credentials (ssid and password).

Update the apiEndpoint variable to your new API Gateway URL (the POST /readings endpoint).

Flash the code to your ESP32.

This project was developed with assistance from an AI. The architecture and code demonstrate a full-stack, serverless IoT solution.
