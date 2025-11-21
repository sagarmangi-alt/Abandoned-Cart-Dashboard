# MongoDB Connection Setup

This dashboard currently uses mock data. To connect to your actual MongoDB database, follow these steps:

## Option 1: MongoDB Data API (Recommended for Lovable Cloud)

1. Go to your MongoDB Atlas dashboard
2. Navigate to Data API section
3. Enable Data API and create an API key
4. Update the edge function `supabase/functions/fetch-mongodb-data/index.ts`:

```typescript
const MONGODB_DATA_API_URL = 'https://data.mongodb-api.com/app/<your-app-id>/endpoint/data/v1/action/find';
const MONGODB_API_KEY = '<your-api-key>'; // Store this as a secret in Lovable Cloud

const response = await fetch(MONGODB_DATA_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-key': MONGODB_API_KEY,
  },
  body: JSON.stringify({
    dataSource: 'n8nuser',
    database: 'abandon_cart',
    collection: 'abandoned_carts',
    filter: {},
  }),
});

const result = await response.json();
return new Response(
  JSON.stringify(result.documents || []),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
```

## Option 2: Direct MongoDB Connection

For a direct connection, you'll need to use a MongoDB driver compatible with Deno. This is more complex and requires setting up proper authentication.

## Current Mock Data

The dashboard is currently displaying mock data with 3 sample records to demonstrate the functionality. This allows you to see the dashboard design and features before connecting to your actual database.

## Next Steps

1. Set up MongoDB Data API in your Atlas dashboard
2. Store the API key securely in Lovable Cloud secrets
3. Update the edge function with your connection details
4. Test the connection
5. Deploy and enjoy real-time data!
