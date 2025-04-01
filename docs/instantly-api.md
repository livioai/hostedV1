# Instantly API Documentation

## Authentication
The API uses an API Key for authentication that should be passed in the `X-API-Key` header.

## Base URL
The base URL for all API endpoints is configurable and passed as `baseUrl` parameter.

## Endpoints

### GET /emails
Retrieves a list of emails.

#### Query Parameters
- `limit` (number): Number of emails per page (default: 50)
- `offset` (number): Pagination offset
- `sort_order` (string): Sort order ("desc" or "asc")
- `is_unread` (boolean): Filter for unread emails
- `include_lead_data` (boolean): Include additional lead data
- `created_before` (string, optional): Filter emails created before this timestamp

#### Response Format
```typescript
interface Email {
  id: string;
  subject: string;
  content_preview: string;
  timestamp_created: string;
  lead_data?: {
    status?: string;
    interest_status?: string;
    labels?: string[];
    note?: string;
  };
}

interface ApiResponse {
  items: Email[];
}
```

#### Example Request
```javascript
const response = await fetch(`${baseUrl}/emails?limit=50&offset=0&sort_order=desc&is_unread=true&include_lead_data=true`, {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
```

## Error Handling
The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting
The API implements rate limiting. When hitting rate limits, the code automatically retries with exponential backoff:
- Initial retry delay: 5 seconds
- Maximum retries: 5
- Delay increases exponentially between retries