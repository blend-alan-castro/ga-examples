const http = require('http');
const { URL } = require('url');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const PORT = 3012;

// In-memory storage for documents
const documents = new Map();

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper function to parse multipart/form-data
function parseMultipart(body, boundary) {
  const parts = body.split(`--${boundary}`);
  const result = {};
  
  for (const part of parts) {
    if (!part || part === '--' || part.trim() === '') continue;
    
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    
    const headers = part.substring(0, headerEnd);
    const content = part.substring(headerEnd + 4).replace(/\r\n$/, '');
    
    // Extract field name and filename from headers
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    
    if (nameMatch) {
      const fieldName = nameMatch[1];
      if (filenameMatch) {
        // It's a file
        result[fieldName] = {
          filename: filenameMatch[1],
          content: content,
          contentType: headers.match(/Content-Type:\s*([^\r\n]+)/)?.[1] || 'application/octet-stream'
        };
      } else {
        // It's a regular field
        result[fieldName] = content;
      }
    }
  }
  
  return result;
}

// Helper function to get request body
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString('binary');
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;
  const pathname = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  try {
    // Upload endpoint
    if (method === 'POST' && pathname === '/upload') {
      const contentType = req.headers['content-type'] || '';
      
      if (!contentType.includes('multipart/form-data')) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }));
        return;
      }

      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid multipart boundary' }));
        return;
      }

      const body = await getRequestBody(req);
      const formData = parseMultipart(body, boundary);
      
      // Look for file field (common names: file, document, upload)
      let fileData = formData.file || formData.document || formData.upload;
      
      // If no common name, get first file field
      if (!fileData || !fileData.filename) {
        const fileFields = Object.values(formData).filter(v => typeof v === 'object' && v.filename);
        fileData = fileFields[0];
      }

      if (!fileData || !fileData.filename) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No file provided' }));
        return;
      }

      // Generate unique ID for the document
      const docId = uuidv4();
      
      // Save file to disk
      const filePath = path.join(UPLOADS_DIR, `${docId}_${fileData.filename}`);
      fs.writeFileSync(filePath, fileData.content, 'binary');
      
      // Store metadata in memory
      documents.set(docId, {
        id: docId,
        filename: fileData.filename,
        contentType: fileData.contentType,
        filePath: filePath,
        uploadedAt: new Date().toISOString()
      });

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: docId,
        filename: fileData.filename,
        message: 'File uploaded successfully'
      }));
      return;
    }

    // Get document endpoint
    if (method === 'GET' && pathname.startsWith('/documents/')) {
      const docId = pathname.split('/documents/')[1];
      
      if (!docId) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Document ID required' }));
        return;
      }

      const doc = documents.get(docId);
      
      if (!doc) {
        res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Document not found' }));
        return;
      }

      // Check if file exists on disk
      if (!fs.existsSync(doc.filePath)) {
        res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Document file not found' }));
        return;
      }

      // Read and return the file
      const fileContent = fs.readFileSync(doc.filePath);
      
      res.writeHead(200, {
        ...corsHeaders,
        'Content-Type': doc.contentType,
        'Content-Disposition': `attachment; filename="${doc.filename}"`
      });
      res.end(fileContent);
      return;
    }

    // List all documents endpoint (optional)
    if (method === 'GET' && pathname === '/documents') {
      const docsList = Array.from(documents.values()).map(doc => ({
        id: doc.id,
        filename: doc.filename,
        contentType: doc.contentType,
        uploadedAt: doc.uploadedAt
      }));

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify(docsList));
      return;
    }

    // Default: Return 200 for any other request
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'text/plain' });
    res.end('OK');
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access it at http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /upload - Upload a document`);
  console.log(`  GET /documents/:id - Get a document by ID`);
  console.log(`  GET /documents - List all documents`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

