import { PartialType } from '@nestjs/mapped-types';
import { CreateGymEquipmentDto } from './create-gym-equipment.dto';

export class UpdateGymEquipmentDto extends PartialType(CreateGymEquipmentDto) {}
