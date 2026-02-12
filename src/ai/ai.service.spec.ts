import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AiProviderFactory } from './providers/ai-provider.factory';
import { DocsService } from '../docs/docs.service';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SummarizeDto, SummaryLength } from './dto/ai.dto';
import { AskQuestionRequestDto, SemanticSearchRequestDto } from './dto/rag.dto';

describe('AiService', () => {
  let service: AiService;
  let providerFactory: AiProviderFactory;
  let docsService: DocsService;
  let embeddingService: EmbeddingService;
  let prisma: PrismaService;

  const mockProvider = {
    summarize: jest.fn(),
    answerQuestion: jest.fn(),
    getName: jest.fn().mockReturnValue('mock-provider'),
  };

  const mockAiProviderFactory = {
    getProvider: jest.fn().mockResolvedValue(mockProvider),
    getAvailableProviders: jest.fn(),
  };

  const mockDocsService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEmbeddingService = {
    generateEmbedding: jest.fn(),
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: AiProviderFactory, useValue: mockAiProviderFactory },
        { provide: DocsService, useValue: mockDocsService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    providerFactory = module.get<AiProviderFactory>(AiProviderFactory);
    docsService = module.get<DocsService>(DocsService);
    embeddingService = module.get<EmbeddingService>(EmbeddingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('summarize', () => {
    const userId = 'user-123';

    it('should summarize text content successfully', async () => {
      const dto: SummarizeDto = {
        text: 'Some long text content that needs summarizing and should definitely be longer than 50 characters to pass validation checks in the service.',
        length: SummaryLength.SHORT,
      };

      mockProvider.summarize.mockResolvedValue({
        result: 'Short summary',
        model: 'gpt-4',
        inputTokens: 10,
        outputTokens: 5,
      });

      const result = await service.summarize(dto, userId);

      expect(mockAiProviderFactory.getProvider).toHaveBeenCalled();
      expect(mockProvider.summarize).toHaveBeenCalledWith(
        expect.stringContaining(dto.text),
        SummaryLength.SHORT,
      );
      expect(result.summary).toBe('Short summary');
    });

    it('should summarize document content successfully', async () => {
      const dto: SummarizeDto = {
        docId: 'doc-123',
        length: SummaryLength.MEDIUM,
      };

      mockDocsService.findOne.mockResolvedValue({
        id: 'doc-123',
        title: 'Doc Title',
        content: 'Document content goes here and it must be sufficiently long to verify that the summarization logic works correctly without throwing validation errors.',
      });

      mockProvider.summarize.mockResolvedValue({
        result: 'Doc summary',
        model: 'gpt-4',
        inputTokens: 20,
        outputTokens: 10,
      });

      const result = await service.summarize(dto, userId);

      expect(mockDocsService.findOne).toHaveBeenCalledWith('doc-123', userId);
      expect(mockDocsService.update).toHaveBeenCalledWith('doc-123', userId, { summary: 'Doc summary' });
      expect(result.summary).toBe('Doc summary');
    });

    it('should throw BadRequestException if both text and docId provided', async () => {
      const dto: SummarizeDto = {
        text: 'text',
        docId: 'doc-123',
      };

      await expect(service.summarize(dto, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if document not found', async () => {
      mockDocsService.findOne.mockResolvedValue(null);
      const dto: SummarizeDto = { docId: 'doc-123' };

      await expect(service.summarize(dto, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('semanticSearch', () => {
    const userId = 'user-123';

    it('should perform semantic search successfully', async () => {
      const dto: SemanticSearchRequestDto = {
        query: 'search query',
        topK: 2,
      };

      const mockEmbedding = [0.1, 0.2, 0.3];
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);

      const mockResults = [
        { docId: 'doc-1', content: 'Content 1', similarity: 0.9 },
        { docId: 'doc-2', content: 'Content 2', similarity: 0.8 },
      ];
      mockPrismaService.$queryRaw.mockResolvedValue(mockResults);

      const result = await service.semanticSearch(dto, userId);

      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith('search query');
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].docId).toBe('doc-1');
    });

    it('should handle search errors', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Embedding failed'));

      const dto: SemanticSearchRequestDto = { query: 'fail' };

      await expect(service.semanticSearch(dto, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('askQuestion', () => {
    const userId = 'user-123';

    it('should answer question using RAG', async () => {
      const dto: AskQuestionRequestDto = {
        question: 'What is X?',
      };

      // Mock semantic search internal call by mocking dependencies
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1]);
      mockPrismaService.$queryRaw.mockResolvedValue([
        { docId: 'doc-1', content: 'Context about X', similarity: 0.9 }
      ]);

      mockProvider.answerQuestion.mockResolvedValue({
        result: 'X is ...',
        model: 'gpt-4',
      });

      const result = await service.askQuestion(dto, userId);

      expect(mockProvider.answerQuestion).toHaveBeenCalledWith(
        'What is X?',
        expect.stringContaining('Context about X')
      );
      expect(result.answer).toBe('X is ...');
      expect(result.contextUsed).toContain('doc-1');
    });

    it('should return no relevant info message if search yields no results', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1]);
      mockPrismaService.$queryRaw.mockResolvedValue([]); // No results

      const dto: AskQuestionRequestDto = { question: 'Unknown?' };

      const result = await service.askQuestion(dto, userId);

      expect(result.answer).toContain("couldn't find any relevant information");
      expect(mockProvider.answerQuestion).not.toHaveBeenCalled();
    });
  });

  describe('extractKeyPoints', () => {
    it('should extract key points successfully', async () => {
      const text = 'Point 1. Point 2. Point 3.';
      const count = 3;

      mockProvider.summarize.mockResolvedValue({
        result: '1. Key point 1\n2. Key point 2\n3. Key point 3',
        model: 'gpt-4',
      });

      const result = await service.extractKeyPoints(text, count);

      expect(mockProvider.summarize).toHaveBeenCalledWith(
        expect.stringContaining('Extract the 3 most important key points'),
        SummaryLength.MEDIUM,
      );
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Key point 1');
    });

    it('should handle extraction errors', async () => {
      mockProvider.summarize.mockRejectedValue(new Error('Extraction failed'));
      await expect(service.extractKeyPoints('text')).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateBulkSummaries', () => {
    const userId = 'user-123';

    it('should generate summaries for multiple documents', async () => {
      const docIds = ['doc-1', 'doc-2'];

      // Mock findOne for each doc
      mockDocsService.findOne.mockResolvedValueOnce({ id: 'doc-1', content: 'Content 1 is now long enough to be summarized by the AI service without issues...........' });
      mockDocsService.findOne.mockResolvedValueOnce({ id: 'doc-2', content: 'Content 2 is also long enough to be summarized by the AI service without issues...........' });

      mockProvider.summarize.mockResolvedValue({
        result: 'Summary',
        model: 'gpt-4',
      });

      const results = await service.generateBulkSummaries(docIds, userId);

      expect(results).toHaveLength(2);
      expect(results[0].docId).toBe('doc-1');
      expect(results[1].docId).toBe('doc-2');
      expect(mockDocsService.update).toHaveBeenCalledTimes(2);
    });

    it('should handle errors for individual documents', async () => {
      const docIds = ['doc-1', 'doc-2'];

      // First doc fails
      mockDocsService.findOne.mockRejectedValueOnce(new Error('Doc not found'));
      // Second doc succeeds
      mockDocsService.findOne.mockResolvedValueOnce({ id: 'doc-2', content: 'Content 2 is also long enough to be summarized by the AI service without issues...........' });
      mockProvider.summarize.mockResolvedValue({ result: 'Summary' });

      const results = await service.generateBulkSummaries(docIds, userId);

      expect(results).toHaveLength(2);
      expect(results[0].error).toBeDefined(); // First failed
      expect(results[1].summary).toBe('Summary'); // Second succeeded
    });
  });

  describe('getAiStatus', () => {
    it('should return AI status', async () => {
      mockAiProviderFactory.getAvailableProviders.mockResolvedValue(['openai', 'anthropic']);
      mockConfigService.get.mockReturnValue('gpt-4');

      const result = await service.getAiStatus();

      expect(result.available).toBe(true);
      expect(result.providers).toContain('openai');
      expect(result.currentProvider).toBe('mock-provider');
      expect(result.model).toBe('gpt-4');
    });

    it('should return unavailable status on error', async () => {
      mockAiProviderFactory.getAvailableProviders.mockRejectedValue(new Error('Error'));

      const result = await service.getAiStatus();

      expect(result.available).toBe(false);
      expect(result.providers).toEqual([]);
    });
  });
});
