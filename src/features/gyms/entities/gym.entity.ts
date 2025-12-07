import { User } from 'src/features/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GymEquipment } from './gym-equipment.entity';

@Entity('gyms')
export class Gym {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column('decimal', { precision: 10, scale: 6 })
  lat: number;

  @Column('decimal', { precision: 10, scale: 6 })
  lng: number;

  @ManyToMany(() => User, (user) => user.gyms)
  members: User[];

  @OneToMany(() => User, (user) => user.homeGym)
  homeMembers: User[];

  /**
   * Many-to-many relationship with GymEquipment through gym_inventory junction table
   */
  @ManyToMany(() => GymEquipment, (equipment) => equipment.gyms)
  @JoinTable({
    name: 'gym_inventory',
    joinColumn: { name: 'gymId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'equipmentId', referencedColumnName: 'id' },
  })
  equipment: GymEquipment[];
}
