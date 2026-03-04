import type { Lesson, World } from '../types/curriculum';

export const WORLDS: World[] = [
  {
    id: 1,
    name: 'Foundations',
    description: 'Master the basics of HTTP, servers, and the web',
    color: '#3b82f6',
    locked: false,
    lessons: [],
  },
  {
    id: 2,
    name: 'APIs',
    description: 'Learn to design and consume APIs',
    color: '#22c55e',
    locked: true,
    lessons: [],
  },
  {
    id: 3,
    name: 'Backend',
    description: 'Build server-side applications',
    color: '#a855f7',
    locked: true,
    lessons: [],
  },
  {
    id: 4,
    name: 'Data',
    description: 'Handle caching, state, and persistence',
    color: '#f59e0b',
    locked: true,
    lessons: [],
  },
  {
    id: 5,
    name: 'Production',
    description: 'Deploy and scale real applications',
    color: '#ef4444',
    locked: true,
    lessons: [],
  },
];

export const LESSONS: Lesson[] = [
  // World 1: Foundations
  {
    id: '1.1',
    worldId: 1,
    worldName: 'Foundations',
    title: 'What is a Server?',
    description: 'Understanding servers as processes that listen for requests',
    xp: 50,
    prerequisites: [],
    duration: 15,
    sections: [
      {
        id: '1.1-concept',
        type: 'concept',
        title: 'The Server Concept',
        content: 'At its core, a server is just a program that listens for incoming requests. Unlike regular scripts that run once and exit, servers stay running continuously, waiting for connections.',
        visualComponent: 'ServerLifecycle',
      },
      {
        id: '1.1-code',
        type: 'code',
        title: 'Looking at Our Server',
        content: 'Here is the entry point of our Cloudflare Worker. It listens for HTTP requests and routes them to the appropriate handler.',
        codeExample: {
          file: 'worker/src/index.ts',
          code: `export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Route the request
    if (url.pathname === '/api/extract') {
      return handleExtract(request, env);
    }
    
    if (url.pathname === '/api/image') {
      return handleImage(request);
    }
    
    return new Response('Not Found', { status: 404 });
  }
}`,
          highlights: [1, 4, 5],
        },
      },
      {
        id: '1.1-quiz',
        type: 'quiz',
        title: 'Quick Check',
        content: 'Test your understanding',
        quiz: {
          passingScore: 80,
          questions: [
            {
              id: 'q1',
              type: 'single',
              question: 'What is the primary difference between a server and a regular script?',
              options: [
                'Servers are written in different languages',
                'Servers run continuously and listen for requests',
                'Servers are always on the cloud',
                'Servers require authentication',
              ],
              correctAnswer: 'Servers run continuously and listen for requests',
              explanation: 'Servers are long-running processes that listen for incoming connections, while scripts typically execute once and exit.',
            },
            {
              id: 'q2',
              type: 'single',
              question: 'What does a server listen on?',
              options: [
                'A database',
                'A port',
                'A file',
                'A variable',
              ],
              correctAnswer: 'A port',
              explanation: 'Servers listen on specific ports (like 8787, 3000, 80) for incoming connections.',
            },
          ],
        },
      },
      {
        id: '1.1-challenge',
        type: 'challenge',
        title: 'Your First Challenge',
        content: 'Implement a simple route handler',
        challenge: {
          id: 'challenge-1-1',
          title: 'Add a Health Check Endpoint',
          description: 'Add a route that responds to GET /health with a JSON response: {"status": "ok"}',
          starterCode: `export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // TODO: Add a route for /health that returns {"status": "ok"}
    
    return new Response('Not Found', { status: 404 });
  }
}`,
          solution: `export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
}`,
          tests: [
            {
              input: { pathname: '/health' },
              expected: { status: 'ok' },
              description: 'Should return status ok for /health',
            },
          ],
          hints: [
            'Use url.pathname to check the path',
            'Return a Response with JSON.stringify()',
            'Set the Content-Type header to application/json',
          ],
        },
      },
    ],
  },
  {
    id: '1.2',
    worldId: 1,
    worldName: 'Foundations',
    title: 'HTTP Protocol',
    description: 'Understanding the language of the web',
    xp: 75,
    prerequisites: ['1.1'],
    duration: 20,
    sections: [
      {
        id: '1.2-concept',
        type: 'concept',
        title: 'HTTP Basics',
        content: 'HTTP (Hypertext Transfer Protocol) is the foundation of data communication on the web. It defines how messages are formatted and transmitted.',
        visualComponent: 'HttpPacketAnatomy',
      },
      {
        id: '1.2-code',
        type: 'code',
        title: 'HTTP in Action',
        content: 'Look at how we make HTTP requests in the frontend to call our backend API.',
        codeExample: {
          file: 'src/lib/extractArticle.ts',
          code: `export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to extract article');
  }
  
  return response.json();
}`,
          highlights: [3, 4, 5, 6, 7],
        },
      },
      {
        id: '1.2-quiz',
        type: 'quiz',
        title: 'Test Your Knowledge',
        content: 'Check your understanding of HTTP',
        quiz: {
          passingScore: 80,
          questions: [
            {
              id: 'q1',
              type: 'single',
              question: 'Which HTTP method is used to retrieve data?',
              options: ['POST', 'GET', 'DELETE', 'PUT'],
              correctAnswer: 'GET',
              explanation: 'GET is used to request data from a server. POST is for creating data, PUT for updating, DELETE for removing.',
            },
            {
              id: 'q2',
              type: 'single',
              question: 'What does the Content-Type header specify?',
              options: [
                'The size of the response',
                'The format of the request/response body',
                'The server type',
                'The authentication method',
              ],
              correctAnswer: 'The format of the request/response body',
              explanation: 'Content-Type tells the receiver what format the body is in (JSON, HTML, etc.).',
            },
          ],
        },
      },
    ],
  },
  {
    id: '1.3',
    worldId: 1,
    worldName: 'Foundations',
    title: 'URLs & Routing',
    description: 'How URLs map to code',
    xp: 75,
    prerequisites: ['1.2'],
    duration: 20,
    sections: [
      {
        id: '1.3-concept',
        type: 'concept',
        title: 'URL Structure',
        content: 'URLs (Uniform Resource Locators) are addresses that tell the browser where to find resources.',
        visualComponent: 'UrlBreakdown',
      },
      {
        id: '1.3-code',
        type: 'code',
        title: 'Routing in Practice',
        content: 'See how different URL paths trigger different handlers in our worker.',
        codeExample: {
          file: 'worker/src/index.ts',
          code: `const url = new URL(request.url);

// Extract different parts of the URL
console.log(url.protocol);  // 'https:'
console.log(url.hostname);  // 'api.xarticle.co'
console.log(url.pathname);  // '/api/extract'
console.log(url.search);    // '?format=json'

// Route based on pathname
switch (url.pathname) {
  case '/api/extract':
    return handleExtract(request, env);
  case '/api/image':
    return handleImage(request);
  default:
    return new Response('Not Found', { status: 404 });
}`,
          highlights: [8, 9, 10, 11, 12],
        },
      },
      {
        id: '1.3-quiz',
        type: 'quiz',
        title: 'Routing Quiz',
        content: 'Test your routing knowledge',
        quiz: {
          passingScore: 80,
          questions: [
            {
              id: 'q1',
              type: 'single',
              question: 'In the URL https://api.example.com/users?id=123, what is the pathname?',
              options: ['/users', '/users?id=123', 'https://api.example.com', 'id=123'],
              correctAnswer: '/users',
              explanation: 'The pathname is just the path portion: /users. The query string (?id=123) is separate.',
            },
          ],
        },
      },
    ],
  },
  {
    id: '1.4',
    worldId: 1,
    worldName: 'Foundations',
    title: 'Status Codes & Headers',
    description: 'Communicating state via HTTP',
    xp: 75,
    prerequisites: ['1.3'],
    duration: 20,
    sections: [
      {
        id: '1.4-concept',
        type: 'concept',
        title: 'HTTP Status Codes',
        content: 'Status codes tell the client what happened with their request.',
        visualComponent: 'StatusCodeWheel',
      },
      {
        id: '1.4-code',
        type: 'code',
        title: 'Using Status Codes',
        content: 'See how our API uses different status codes to communicate results.',
        codeExample: {
          file: 'worker/src/routes/extract.ts',
          code: `if (!url) {
  return new Response(JSON.stringify({ error: 'URL is required' }), {
    status: 400,  // Bad Request
    headers: { 'Content-Type': 'application/json' }
  });
}

try {
  const article = await extractContent(url);
  return new Response(JSON.stringify(article), {
    status: 200,  // OK
    headers: { 'Content-Type': 'application/json' }
  });
} catch (error) {
  return new Response(JSON.stringify({ error: 'Extraction failed' }), {
    status: 500,  // Internal Server Error
    headers: { 'Content-Type': 'application/json' }
  });
}`,
          highlights: [2, 9, 16],
        },
      },
      {
        id: '1.4-quiz',
        type: 'quiz',
        title: 'Status Code Quiz',
        content: 'Match scenarios to codes',
        quiz: {
          passingScore: 80,
          questions: [
            {
              id: 'q1',
              type: 'single',
              question: 'Which status code indicates success?',
              options: ['404', '500', '200', '401'],
              correctAnswer: '200',
              explanation: '200 OK means the request was successful. 404 is Not Found, 500 is Server Error, 401 is Unauthorized.',
            },
            {
              id: 'q2',
              type: 'single',
              question: 'What does a 404 status code mean?',
              options: [
                'Server error',
                'Resource not found',
                'Unauthorized access',
                'Success',
              ],
              correctAnswer: 'Resource not found',
              explanation: '404 means the server could not find the requested resource at that URL.',
            },
          ],
        },
      },
    ],
  },
  {
    id: '1.5',
    worldId: 1,
    worldName: 'Foundations',
    title: 'The Request Lifecycle',
    description: 'End-to-end flow from browser to server and back',
    xp: 100,
    prerequisites: ['1.4'],
    duration: 25,
    sections: [
      {
        id: '1.5-concept',
        type: 'concept',
        title: 'Complete Journey',
        content: 'Follow a request from the moment you type a URL until the page renders.',
        visualComponent: 'RequestLifecycle',
      },
      {
        id: '1.5-quiz',
        type: 'quiz',
        title: 'Lifecycle Quiz',
        content: 'Order the steps correctly',
        quiz: {
          passingScore: 80,
          questions: [
            {
              id: 'q1',
              type: 'code-analysis',
              question: 'What is the correct order of these steps?\n1. Browser renders the page\n2. DNS lookup\n3. Server processes request\n4. HTTP response sent',
              options: ['2,3,4,1', '3,2,4,1', '2,3,1,4', '3,4,2,1'],
              correctAnswer: '2,3,4,1',
              explanation: 'First DNS lookup, then server processes, then response sent, finally browser renders.',
            },
          ],
        },
      },
      {
        id: '1.5-summary',
        type: 'summary',
        title: 'World 1 Complete!',
        content: 'You now understand the fundamentals: servers, HTTP, URLs, status codes, and the request lifecycle. Ready for APIs?',
      },
    ],
  },
  // World 2: APIs (condensed for brevity)
  {
    id: '2.1',
    worldId: 2,
    worldName: 'APIs',
    title: 'What is an API?',
    description: 'Understanding Application Programming Interfaces',
    xp: 50,
    prerequisites: ['1.5'],
    duration: 15,
    sections: [
      {
        id: '2.1-concept',
        type: 'concept',
        title: 'API Concept',
        content: 'An API is like a restaurant menu - it tells you what you can order and what you will get.',
        visualComponent: 'ApiContract',
      },
    ],
  },
  {
    id: '2.2',
    worldId: 2,
    worldName: 'APIs',
    title: 'RESTful Design',
    description: 'Designing clean, resource-based APIs',
    xp: 75,
    prerequisites: ['2.1'],
    duration: 20,
    sections: [
      {
        id: '2.2-concept',
        type: 'concept',
        title: 'REST Principles',
        content: 'REST organizes APIs around resources and uses HTTP methods to operate on them.',
        visualComponent: 'RestResourceTree',
      },
    ],
  },
  {
    id: '2.3',
    worldId: 2,
    worldName: 'APIs',
    title: 'JSON & Data Formats',
    description: 'Working with structured data',
    xp: 75,
    prerequisites: ['2.2'],
    duration: 20,
    sections: [
      {
        id: '2.3-concept',
        type: 'concept',
        title: 'JSON Structure',
        content: 'JSON is the most common data format for APIs.',
        visualComponent: 'JsonTree',
      },
    ],
  },
  {
    id: '2.4',
    worldId: 2,
    worldName: 'APIs',
    title: 'Making Requests',
    description: 'Calling APIs from the client',
    xp: 75,
    prerequisites: ['2.3'],
    duration: 20,
    sections: [
      {
        id: '2.4-concept',
        type: 'concept',
        title: 'fetch() API',
        content: 'The modern way to make HTTP requests in JavaScript.',
        visualComponent: 'FetchFlow',
      },
    ],
  },
  {
    id: '2.5',
    worldId: 2,
    worldName: 'APIs',
    title: 'Handling Responses',
    description: 'Parsing and validating API responses',
    xp: 100,
    prerequisites: ['2.4'],
    duration: 25,
    sections: [
      {
        id: '2.5-concept',
        type: 'concept',
        title: 'Response Pipeline',
        content: 'Safely handling API responses requires validation and error handling.',
        visualComponent: 'ResponsePipeline',
      },
    ],
  },
  // World 3: Backend
  {
    id: '3.1',
    worldId: 3,
    worldName: 'Backend',
    title: 'Serverless & Edge',
    description: 'Understanding serverless architecture',
    xp: 75,
    prerequisites: ['2.5'],
    duration: 20,
    sections: [
      {
        id: '3.1-concept',
        type: 'concept',
        title: 'Serverless Architecture',
        content: 'Serverless functions run on-demand without managing servers.',
        visualComponent: 'ServerlessComparison',
      },
    ],
  },
  {
    id: '3.2',
    worldId: 3,
    worldName: 'Backend',
    title: 'Routing & Handlers',
    description: 'Request routing patterns',
    xp: 75,
    prerequisites: ['3.1'],
    duration: 20,
    sections: [
      {
        id: '3.2-concept',
        type: 'concept',
        title: 'Router Pattern',
        content: 'Routers direct incoming requests to the appropriate handler.',
        visualComponent: 'RouterDecisionTree',
      },
    ],
  },
  {
    id: '3.3',
    worldId: 3,
    worldName: 'Backend',
    title: 'Processing Requests',
    description: 'Extracting and validating request data',
    xp: 75,
    prerequisites: ['3.2'],
    duration: 20,
    sections: [
      {
        id: '3.3-concept',
        type: 'concept',
        title: 'Request Parsing',
        content: 'Backend code needs to extract data from the request object.',
        visualComponent: 'RequestAnatomy',
      },
    ],
  },
  {
    id: '3.4',
    worldId: 3,
    worldName: 'Backend',
    title: 'Building Responses',
    description: 'Constructing proper HTTP responses',
    xp: 75,
    prerequisites: ['3.3'],
    duration: 20,
    sections: [
      {
        id: '3.4-concept',
        type: 'concept',
        title: 'Response Builder',
        content: 'Creating well-formed responses with proper headers and bodies.',
        visualComponent: 'ResponseBuilder',
      },
    ],
  },
  {
    id: '3.5',
    worldId: 3,
    worldName: 'Backend',
    title: 'Error Handling',
    description: 'Reliable error handling patterns',
    xp: 100,
    prerequisites: ['3.4'],
    duration: 25,
    sections: [
      {
        id: '3.5-concept',
        type: 'concept',
        title: 'Error Flow',
        content: 'Proper error handling ensures your API is reliable and debuggable.',
        visualComponent: 'ErrorFlow',
      },
    ],
  },
  // World 4: Data
  {
    id: '4.1',
    worldId: 4,
    worldName: 'Data',
    title: 'Caching Fundamentals',
    description: 'Speed up responses with caching',
    xp: 75,
    prerequisites: ['3.5'],
    duration: 20,
    sections: [
      {
        id: '4.1-concept',
        type: 'concept',
        title: 'Cache Layers',
        content: 'Caching stores expensive computation results for faster retrieval.',
        visualComponent: 'CacheLayers',
      },
    ],
  },
  {
    id: '4.2',
    worldId: 4,
    worldName: 'Data',
    title: 'External APIs',
    description: 'Integrating third-party services',
    xp: 75,
    prerequisites: ['4.1'],
    duration: 20,
    sections: [
      {
        id: '4.2-concept',
        type: 'concept',
        title: 'API Integration',
        content: 'Calling external services from your backend.',
        visualComponent: 'ExternalApiNetwork',
      },
    ],
  },
  {
    id: '4.3',
    worldId: 4,
    worldName: 'Data',
    title: 'Data Transformation',
    description: 'Parsing and transforming data',
    xp: 75,
    prerequisites: ['4.2'],
    duration: 20,
    sections: [
      {
        id: '4.3-concept',
        type: 'concept',
        title: 'ETL Pipeline',
        content: 'Extract, Transform, Load - the data processing pattern.',
        visualComponent: 'EtlPipeline',
      },
    ],
  },
  {
    id: '4.4',
    worldId: 4,
    worldName: 'Data',
    title: 'State Management',
    description: 'Managing state across requests',
    xp: 75,
    prerequisites: ['4.3'],
    duration: 20,
    sections: [
      {
        id: '4.4-concept',
        type: 'concept',
        title: 'Stateful vs Stateless',
        content: 'Understanding when and how to persist state.',
        visualComponent: 'StateComparison',
      },
    ],
  },
  {
    id: '4.5',
    worldId: 4,
    worldName: 'Data',
    title: 'Data Flow Architecture',
    description: 'Complete data pipeline design',
    xp: 100,
    prerequisites: ['4.4'],
    duration: 25,
    sections: [
      {
        id: '4.5-concept',
        type: 'concept',
        title: 'Full Data Flow',
        content: 'Architecting data flows from source to destination.',
        visualComponent: 'CompleteDataFlow',
      },
    ],
  },
  // World 5: Production
  {
    id: '5.1',
    worldId: 5,
    worldName: 'Production',
    title: 'Authentication',
    description: 'Securing your APIs',
    xp: 75,
    prerequisites: ['4.5'],
    duration: 20,
    sections: [
      {
        id: '5.1-concept',
        type: 'concept',
        title: 'Auth Flows',
        content: 'Understanding tokens, sessions, and API keys.',
        visualComponent: 'AuthFlow',
      },
    ],
  },
  {
    id: '5.2',
    worldId: 5,
    worldName: 'Production',
    title: 'CORS',
    description: 'Cross-Origin Resource Sharing',
    xp: 75,
    prerequisites: ['5.1'],
    duration: 20,
    sections: [
      {
        id: '5.2-concept',
        type: 'concept',
        title: 'CORS Explained',
        content: 'How browsers handle cross-origin requests.',
        visualComponent: 'CorsFlow',
      },
    ],
  },
  {
    id: '5.3',
    worldId: 5,
    worldName: 'Production',
    title: 'Testing',
    description: 'Testing strategies for backends',
    xp: 75,
    prerequisites: ['5.2'],
    duration: 20,
    sections: [
      {
        id: '5.3-concept',
        type: 'concept',
        title: 'Testing Pyramid',
        content: 'Unit, integration, and end-to-end testing.',
        visualComponent: 'TestingPyramid',
      },
    ],
  },
  {
    id: '5.4',
    worldId: 5,
    worldName: 'Production',
    title: 'Deployment',
    description: 'CI/CD and deployment strategies',
    xp: 75,
    prerequisites: ['5.3'],
    duration: 20,
    sections: [
      {
        id: '5.4-concept',
        type: 'concept',
        title: 'CI/CD Pipeline',
        content: 'Automated build, test, and deployment.',
        visualComponent: 'CicdPipeline',
      },
    ],
  },
  {
    id: '5.5',
    worldId: 5,
    worldName: 'Production',
    title: 'The Complete System',
    description: 'Full-stack architecture review',
    xp: 150,
    prerequisites: ['5.4'],
    duration: 30,
    sections: [
      {
        id: '5.5-concept',
        type: 'concept',
        title: 'Complete Architecture',
        content: 'Putting it all together - the full system.',
        visualComponent: 'CompleteSystem',
      },
      {
        id: '5.5-summary',
        type: 'summary',
        title: 'Congratulations!',
        content: 'You have completed all 25 lessons and mastered backend engineering fundamentals!',
      },
    ],
  },
];

// Link lessons to worlds
WORLDS.forEach(world => {
  world.lessons = LESSONS.filter(l => l.worldId === world.id);
});
