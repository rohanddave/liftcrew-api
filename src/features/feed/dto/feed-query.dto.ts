import { IsEnum, IsISO8601, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { FeedItemType } from '../entities/feed-item.entity';

export class FeedQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @IsOptional()
  @IsEnum(FeedItemType)
  type?: FeedItemType;
}
