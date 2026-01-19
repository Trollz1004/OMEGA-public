import json
import boto3
from botocore.exceptions import ClientError

def test_bedrock_connection():
    """Test AWS Bedrock connection and Claude Opus 4 model availability"""
    
    # Load configuration
    with open(r'C:\Users\t55o\.opus-bedrock-config.json', 'r') as f:
        config = json.load(f)
    
    # Initialize Bedrock client
    bedrock = boto3.client('bedrock-runtime', region_name=config['region'])
    
    try:
        # Test message for marketing automation
        test_prompt = "Generate a brief marketing email subject line for a new AI product launch."
        
        # Prepare the request
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": config['max_tokens'],
            "messages": [
                {
                    "role": "user",
                    "content": test_prompt
                }
            ]
        })
        
        # Make the request
        response = bedrock.invoke_model(
            body=body,
            modelId=config['model_id'],
            accept='application/json',
            contentType='application/json'
        )
        
        # Parse response
        response_body = json.loads(response.get('body').read())
        
        print("[SUCCESS] Bedrock connection successful!")
        print(f"Model: {config['model_id']}")
        print(f"Region: {config['region']}")
        print(f"Test response: {response_body['content'][0]['text']}")
        
        return True
        
    except ClientError as e:
        print(f"[ERROR] Bedrock connection failed: {e}")
        if "Operation not allowed" in str(e):
            print("[INFO] You need to request model access in AWS Bedrock console")
            print("[INFO] Go to: AWS Console > Bedrock > Model access > Request model access")
        return False

if __name__ == "__main__":
    test_bedrock_connection()