import { McpToolDefinition } from './dto/mcp.dto';

export const MCP_Tools: McpToolDefinition[] = [
  {
    name: 'searchDocs',
    type: 'function',
    description: 'Search for documents by query and tags',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query for document title and content',
        required: true,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum number of results to return',
        required: false,
      },
      {
        name: 'tags',
        type: 'array',
        description: 'Filter by tags',
        required: false,
      },
    ],
  },
  {
    name: 'getDocument',
    type: 'function',
    description: 'Get a specific document by ID',
    parameters: [
      {
        name: 'docId',
        type: 'string',
        description: 'ID of the document to retrieve',
        required: true,
      },
    ],
  },
  {
    name: 'addNote',
    type: 'function',
    description: 'Add a note to a document or create a standalone note',
    parameters: [
      {
        name: 'content',
        type: 'string',
        description: 'Content of the note',
        required: true,
      },
      {
        name: 'docId',
        type: 'string',
        description: 'ID of the document to attach the note to (optional)',
        required: false,
      },
    ],
  },
  {
    name: 'createTask',
    type: 'function',
    description: 'Create a new task',
    parameters: [
      {
        name: 'title',
        type: 'string',
        description: 'Title of the task',
        required: true,
      },
      {
        name: 'description',
        type: 'string',
        description: 'Detailed description of the task',
        required: false,
      },
      {
        name: 'priority',
        type: 'string',
        description: 'Priority level: LOW, MEDIUM, HIGH, URGENT',
        required: false,
      },
      {
        name: 'dueDate',
        type: 'string',
        description: 'Due date in ISO 8601 format',
        required: false,
      },
    ],
  },
  {
    name: 'listTasks',
    type: 'function',
    description: 'List tasks with optional filters',
    parameters: [
      {
        name: 'status',
        type: 'string',
        description: 'Filter by status: TODO, IN_PROGRESS, DONE, CANCELLED',
        required: false,
      },
      {
        name: 'priority',
        type: 'string',
        description: 'Filter by priority: LOW, MEDIUM, HIGH, URGENT',
        required: false,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum number of results',
        required: false,
      },
    ],
  },
  {
    name: 'getUserStats',
    type: 'function',
    description: 'Get user statistics (documents, notes, tasks)',
    parameters: [],
  },
];
