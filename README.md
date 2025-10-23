# GitHub Actions POST Request Examples

This repository contains various examples of GitHub Actions workflows that demonstrate how to make HTTPS POST requests using different methods and tools.

## Examples Included

### 1. Curl POST Request Example (`.github/workflows/curl-post-example.yml`)
- Basic POST request with JSON data
- POST with form data
- POST with file upload
- Uses curl command-line tool

### 2. Node.js POST Request Example (`.github/workflows/nodejs-post-example.yml`)
- POST request using axios library
- POST request using native fetch API (Node.js 18+)
- JSON payload with GitHub context data

### 3. Python POST Request Example (`.github/workflows/python-post-example.yml`)
- POST request using requests library
- Form data submission
- File upload with multipart/form-data
- Error handling and timeout configuration

### 4. Webhook Notification Example (`.github/workflows/webhook-notification.yml`)
- Slack webhook notifications
- Discord webhook integration
- Rich message formatting with attachments
- Event-based triggers (push, PR, release)

### 5. Advanced POST Request Example (`.github/workflows/advanced-post-example.yml`)
- Retry logic with exponential backoff
- Authentication flow (OAuth2 client credentials)
- Batch requests to multiple endpoints
- Manual workflow dispatch with inputs

## Required Secrets

To use these workflows, you'll need to configure the following secrets in your repository:

### Basic Secrets
- `API_ENDPOINT` - Your API endpoint URL
- `API_TOKEN` - Authentication token (if required)
- `WEBHOOK_URL` - Webhook URL for notifications

### Additional Secrets (for specific examples)
- `FORM_ENDPOINT` - Endpoint for form data submission
- `FILE_UPLOAD_URL` - Endpoint for file uploads
- `DISCORD_WEBHOOK_URL` - Discord webhook URL
- `SLACK_WEBHOOK_URL` - Slack webhook URL
- `AUTH_ENDPOINT` - OAuth2 authentication endpoint
- `CLIENT_ID` - OAuth2 client ID
- `CLIENT_SECRET` - OAuth2 client secret
- `PROTECTED_ENDPOINT` - Protected API endpoint
- `ENDPOINT_1`, `ENDPOINT_2`, `ENDPOINT_3` - Multiple endpoints for batch requests

## How to Use

1. **Copy the workflow files** to your repository's `.github/workflows/` directory
2. **Configure secrets** in your repository settings (Settings → Secrets and variables → Actions)
3. **Customize the endpoints** and payloads according to your needs
4. **Test the workflows** by pushing to the main branch or using manual dispatch

## Workflow Triggers

Most workflows are configured to trigger on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch
- Release events (for notifications)

You can modify the `on:` section in each workflow to customize when they run.

## Common Use Cases

- **API Integration**: Send data to external APIs when code is pushed
- **Notifications**: Alert teams via Slack/Discord when important events occur
- **Data Synchronization**: Sync repository data with external systems
- **Deployment Hooks**: Trigger deployments or updates in external services
- **Monitoring**: Send metrics or logs to monitoring services

## Best Practices

1. **Use secrets** for sensitive data like API keys and tokens
2. **Add error handling** to handle network failures gracefully
3. **Use timeouts** to prevent workflows from hanging
4. **Test with different payloads** to ensure your API handles them correctly
5. **Monitor webhook delivery** to ensure notifications are being sent
6. **Use retry logic** for critical requests that might fail due to network issues

## Troubleshooting

- Check the Actions tab in your repository to see workflow runs and logs
- Verify that all required secrets are properly configured
- Test your endpoints manually before using them in workflows
- Check network connectivity and firewall rules for your API endpoints
- Review API documentation for required headers and payload formats
# ga-examples
