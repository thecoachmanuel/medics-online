import { NextResponse } from 'next/server';

export const runExpressController = async (controller, request, context) => {
  return new Promise(async (resolve) => {
    try {
      // Determine body: request.decryptedBody takes precedence, then request.parsedBody (from middleware), finally await request.json()
      let body = request.decryptedBody || request.parsedBody;
      
      if (!body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        try {
          body = await request.json();
        } catch (e) {
          // ignore if already consumed or empty
        }
      }

      // Parse query params
      const searchParams = request.nextUrl ? Object.fromEntries(request.nextUrl.searchParams) : {};

      // Create mock req
      const req = {
        body: body || {},
        query: searchParams,
        headers: {},
        // Middlewares inject these dynamically:
        userId: request.userId,
        docId: request.docId,
      };

      // Populate headers
      if (request.headers) {
        request.headers.forEach((value, key) => {
          req.headers[key] = value;
        });
      }

      // Map base64 image object to req.file to preserve multer logic
      if (req.body.image && req.body.image.type === 'file') {
        req.file = {
          path: `data:${req.body.image.mimeType};base64,${req.body.image.data}`
        };
      }
      if (req.body.docAvatar && req.body.docAvatar.type === 'file') {
        req.file = {
          path: `data:${req.body.docAvatar.mimeType};base64,${req.body.docAvatar.data}`
        };
      }

      // Create mock res
      const res = {
        json: (data) => {
          resolve(NextResponse.json(data));
        },
        status: (code) => {
          return {
            json: (data) => resolve(NextResponse.json(data, { status: code }))
          };
        }
      };

      // Call the original Express controller
      await controller(req, res);
      
    } catch (error) {
      console.error('Express Adapter Error:', error);
      resolve(NextResponse.json({ success: false, message: error.message }, { status: 500 }));
    }
  });
};
