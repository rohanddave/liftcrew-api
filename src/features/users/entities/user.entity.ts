import { Gym } from 'src/features/gyms/entities/gym.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique username for the user.
   */
  @Column({ unique: true })
  username: string;

  /**
   * Unique email address of the user.
   */
  @Column({ unique: true })
  email: string;

  /**
   * Full name of the user.
   */
  @Column()
  name: string;

  @Column()
  height: number;

  @Column()
  weight: number;

  @Column()
  age: number;

  /**
   * URL to the user’s profile image.
   */
  @Column({ nullable: true })
  imageUrl?: string;

  @ManyToMany(() => Gym, (gym) => gym.members)
  @JoinTable({
    name: 'user_gyms',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'gym_id', referencedColumnName: 'id' },
  })
  gyms: Gym[];

  @ManyToOne(() => Gym, (gym) => gym.homeMembers, { nullable: true })
  @JoinColumn({ name: 'home_gym_id' })
  homeGym: Gym;

  @Column({ nullable: true })
  homeGymId: string;
}
