import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { SummarizeDto, SummaryLength } from './dto/ai.dto';
import { AskQuestionRequestDto, SemanticSearchRequestDto } from './dto/rag.dto';

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;

  const mockAiService = {
    getAiStatus: jest.fn(),
    summarize: jest.fn(),
    answerQuestionLegacy: jest.fn(),
    semanticSearch: jest.fn(),
    askQuestion: jest.fn(),
    extractKeyPoints: jest.fn(),
    generateBulkSummaries: jest.fn(),
  };

  const userId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get<AiService>(AiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return AI status', async () => {
      const mockStatus = {
        available: true,
        providers: ['openai'],
        currentProvider: 'openai',
        model: 'gpt-4',
      };
      mockAiService.getAiStatus.mockResolvedValue(mockStatus);

      const result = await controller.getStatus();
      expect(result).toEqual(mockStatus);
      expect(service.getAiStatus).toHaveBeenCalled();
    });
  });

  describe('summarize', () => {
    it('should call service.summarize with correct parameters', async () => {
      const dto: SummarizeDto = { text: 'content', length: SummaryLength.SHORT };
      const expectedResult = { summary: 'result' };
      mockAiService.summarize.mockResolvedValue(expectedResult);

      const result = await controller.summarize(dto, userId);

      expect(result).toEqual(expectedResult);
      expect(service.summarize).toHaveBeenCalledWith(dto, userId);
    });
  });

  describe('answerQuestionLegacy (chat)', () => {
    it('should call service.answerQuestionLegacy', async () => {
      const dto = { question: 'Q', context: 'C' };
      const expectedResult = { answer: 'A' };
      mockAiService.answerQuestionLegacy.mockResolvedValue(expectedResult);

      const result = await controller.answerQuestionLegacy(dto, userId);

      expect(result).toEqual(expectedResult);
      expect(service.answerQuestionLegacy).toHaveBeenCalledWith(dto, userId);
    });
  });

  describe('semanticSearch', () => {
    it('should call service.semanticSearch', async () => {
      const dto: SemanticSearchRequestDto = { query: 'search' };
      const expectedResult = [{ docId: '1', similarity: 0.9 }];
      mockAiService.semanticSearch.mockResolvedValue(expectedResult);

      const result = await controller.semanticSearch(dto, userId);

      expect(result).toEqual(expectedResult);
      expect(service.semanticSearch).toHaveBeenCalledWith(dto, userId);
    });
  });

  describe('askQuestion', () => {
    it('should call service.askQuestion', async () => {
      const dto: AskQuestionRequestDto = { question: 'Why?' };
      const expectedResult = { answer: 'Because.' };
      mockAiService.askQuestion.mockResolvedValue(expectedResult);

      const result = await controller.askQuestion(dto, userId);

      expect(result).toEqual(expectedResult);
      expect(service.askQuestion).toHaveBeenCalledWith(dto, userId);
    });
  });

  describe('extractKeyPoints', () => {
    it('should return key points and provider info', async () => {
      const dto = { text: 'Points', count: 3 };
      const keyPoints = ['1', '2', '3'];
      mockAiService.extractKeyPoints.mockResolvedValue(keyPoints);
      mockAiService.getAiStatus.mockResolvedValue({ currentProvider: 'gpt' });

      const result = await controller.extractKeyPoints(dto);

      expect(result).toEqual({
        keyPoints,
        count: 3,
        provider: 'gpt',
      });
      expect(service.extractKeyPoints).toHaveBeenCalledWith(dto.text, dto.count);
    });
  });

  describe('bulkSummarize', () => {
    it('should return bulk summary results', async () => {
      const dto = { docIds: ['1', '2'] };
      const mockUser = { sub: userId };
      const serviceResults = [{ docId: '1', summary: 'S' }];
      mockAiService.generateBulkSummaries.mockResolvedValue(serviceResults);

      const result = await controller.bulkSummarize(dto, mockUser as any);

      expect(result.results).toEqual(serviceResults);
      expect(result.total).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(service.generateBulkSummaries).toHaveBeenCalledWith(dto.docIds, userId, SummaryLength.MEDIUM);
    });
  });
});
