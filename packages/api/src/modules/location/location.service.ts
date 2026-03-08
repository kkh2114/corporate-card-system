import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { LocationLog } from './entities/location-log.entity';
import { GeocodeResult } from './interfaces/geocode-response.interface';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly kakaoApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(LocationLog)
    private readonly locationLogRepository: Repository<LocationLog>,
  ) {
    this.kakaoApiKey = this.configService.get<string>('KAKAO_REST_API_KEY', '');
  }

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      const response = await axios.get(
        'https://dapi.kakao.com/v2/local/search/address.json',
        {
          params: { query: address },
          headers: { Authorization: `KakaoAK ${this.kakaoApiKey}` },
        },
      );

      const documents = response.data?.documents;
      if (!documents || documents.length === 0) {
        return null;
      }

      const doc = documents[0];
      return {
        latitude: parseFloat(doc.y),
        longitude: parseFloat(doc.x),
        address: doc.address_name || address,
      };
    } catch (error) {
      this.logger.error('Geocoding failed', error);
      return null;
    }
  }

  async saveLocationLog(
    transactionId: string,
    latitude: number,
    longitude: number,
    accuracy: number,
    provider: string,
    timestamp: Date,
  ): Promise<LocationLog> {
    const log = this.locationLogRepository.create({
      transactionId, latitude, longitude, accuracy, provider, timestamp,
    });
    return this.locationLogRepository.save(log);
  }
}
