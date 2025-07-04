import { getStats } from './controller';
import * as handler from './handler';

// Mock do handler
jest.mock('./handler');
const mockHandler = handler as jest.Mocked<typeof handler>;

describe('Analytics Controller', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return analytics data successfully', async () => {
      // Given
      const mockAnalyticsData = {
        rooms: 10,
        bookings: 25,
        users: 15,
        week: 5,
        members: 30
      };
      mockHandler.getStatsHandler.mockResolvedValue({
        data: mockAnalyticsData
      });

      // When
      await getStats(req, res);

      // Then
      expect(mockHandler.getStatsHandler).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAnalyticsData);
    });

    it('should handle JSON parseable error', async () => {
      // Given
      const errorData = {
        roomsError: 'Room error',
        bookingsError: 'Booking error'
      };
      mockHandler.getStatsHandler.mockResolvedValue({
        error: JSON.stringify(errorData)
      });

      // When
      await getStats(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erro ao buscar estatísticas.',
        errors: errorData
      });
    });

    it('should handle non-JSON error', async () => {
      // Given
      const errorMessage = 'Simple error message';
      mockHandler.getStatsHandler.mockResolvedValue({
        error: errorMessage
      });

      // When
      await getStats(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erro ao buscar estatísticas.',
        errors: errorMessage
      });
    });

    it('should handle unexpected errors', async () => {
      // Given
      mockHandler.getStatsHandler.mockRejectedValue(new Error('Unexpected error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // When
      await getStats(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erro ao obter estatísticas.'
      });
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar estatísticas:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});