import json
import boto3
from decimal import Decimal
s
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("WaterQualityReading")

def lambda_handler(event, context):
    
    # 1. Get the reading_id from the URL path
    try:
        # This assumes your API Gateway resource is /readings/{reading_id}
        reading_id = event['pathParameters']['reading_id']
    except KeyError:
        return {
            'statusCode': 400,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': 'Missing reading_id in path'})
        }

    # 2. Get the new coordinates from the request body
    try:
        body = json.loads(event.get('body', '{}'))
        new_lat = Decimal(str(body['latitude']))
        new_lon = Decimal(str(body['longitude']))
    except (KeyError, TypeError, ValueError):
        return {
            'statusCode': 400,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': 'Invalid or missing latitude/longitude in body. Must be numbers.'})
        }

    # 3. Update the item in DynamoDB
    try:
        response = table.update_item(
            Key={
                'reading_id': reading_id
            },
            UpdateExpression="SET latitude = :lat, longitude = :lon",
            ExpressionAttributeValues={
                ':lat': new_lat,
                ':lon': new_lon
            },
            ReturnValues="UPDATED_NEW"
        )
        
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "PUT, OPTIONS"
            },
            'body': json.dumps({
                'message': 'Coordinates updated successfully',
                'updatedAttributes': response.get('Attributes', {})
            })
        }
        
    except Exception as e:
        print(f"Error updating item {reading_id}: {str(e)}")
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': 'Could not update item in database', 'details': str(e)})
        }