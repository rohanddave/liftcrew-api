// common/pagination/paginate.ts
import { Repository, FindManyOptions, ObjectLiteral } from 'typeorm';
import { PaginatedResult, PaginationDto } from './pagination.dto';

export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  paginationDto: PaginationDto,
  options?: FindManyOptions<T>,
): Promise<PaginatedResult<T>> {
  const [data, total] = await repository.findAndCount({
    ...options,
    skip: paginationDto.skip,
    take: paginationDto.limit,
  });

  return PaginatedResult.create(data, total, paginationDto);
}
