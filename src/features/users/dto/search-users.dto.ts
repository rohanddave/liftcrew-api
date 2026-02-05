import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/pagination';

export class SearchUsersDto extends PaginationDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}
