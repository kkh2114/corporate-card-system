import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService, CreateAuditLogDto } from '../../src/modules/audit/audit-log.service';
import { AuditLog } from '../../src/modules/audit/audit-log.entity';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repo: jest.Mocked<Repository<AuditLog>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'log-1' })),
            save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: 'log-1', timestamp: new Date() })),
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repo = module.get(getRepositoryToken(AuditLog));
  });

  describe('create', () => {
    const baseDto: CreateAuditLogDto = {
      actorId: 'user-1',
      actorEmployeeId: 'EMP-001',
      actorRole: 'admin',
      action: 'LOGIN',
      category: 'AUTH',
    };

    it('should create audit log with checksum', async () => {
      const result = await service.create(baseDto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN',
          category: 'AUTH',
          severity: 'INFO',
          checksum: expect.any(String),
        }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(result.id).toBe('log-1');
    });

    it('should default severity to INFO', async () => {
      await service.create(baseDto);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'INFO' }),
      );
    });

    it('should use provided severity', async () => {
      await service.create({ ...baseDto, severity: 'CRITICAL' });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'CRITICAL' }),
      );
    });

    it('should generate unique checksums for sequential logs', async () => {
      const checksums: string[] = [];

      repo.create.mockImplementation((dto: any) => {
        checksums.push(dto.checksum);
        return { ...dto, id: 'log' };
      });

      await service.create({ ...baseDto, action: 'LOGIN' });
      await service.create({ ...baseDto, action: 'LOGOUT' });
      await service.create({ ...baseDto, action: 'VIEW_DATA' });

      // Each checksum should be unique (chain includes previousChecksum)
      const uniqueChecksums = new Set(checksums);
      expect(uniqueChecksums.size).toBe(3);
    });

    it('should chain checksums (each includes previous)', async () => {
      const checksums: string[] = [];

      repo.create.mockImplementation((dto: any) => {
        checksums.push(dto.checksum);
        return { ...dto, id: 'log' };
      });

      await service.create({ ...baseDto, action: 'FIRST' });
      const firstChecksum = checksums[0];

      await service.create({ ...baseDto, action: 'SECOND' });
      const secondChecksum = checksums[1];

      // Checksums should be different (chain property)
      expect(firstChecksum).not.toBe(secondChecksum);
      expect(firstChecksum).toHaveLength(64); // SHA-256
      expect(secondChecksum).toHaveLength(64);
    });
  });

  describe('findByActor', () => {
    it('should query by actorId with limit', async () => {
      await service.findByActor('user-1', 25);
      expect(repo.find).toHaveBeenCalledWith({
        where: { actorId: 'user-1' },
        order: { timestamp: 'DESC' },
        take: 25,
      });
    });

    it('should default limit to 50', async () => {
      await service.findByActor('user-1');
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  describe('findByCategory', () => {
    it('should query by category', async () => {
      await service.findByCategory('AUTH');
      expect(repo.find).toHaveBeenCalledWith({
        where: { category: 'AUTH' },
        order: { timestamp: 'DESC' },
        take: 50,
      });
    });
  });

  describe('findSecurityEvents', () => {
    it('should query security-related events', async () => {
      await service.findSecurityEvents(10);
      expect(repo.find).toHaveBeenCalledWith({
        where: [
          { category: 'SECURITY' },
          { severity: 'CRITICAL' },
          { severity: 'WARNING' },
        ],
        order: { timestamp: 'DESC' },
        take: 10,
      });
    });
  });
});
