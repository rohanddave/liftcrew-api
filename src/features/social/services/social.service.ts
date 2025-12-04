import { Injectable } from '@nestjs/common';
import { CreateFollowRelationDto } from '../dto/create-follow-relation.dto';

@Injectable()
export class SocialService {
  constructor() {}

  createFollowRelation(dto: CreateFollowRelationDto) {

  }

  removeFollowRelation(followerId: string, followeeId: string) {}

  
}
