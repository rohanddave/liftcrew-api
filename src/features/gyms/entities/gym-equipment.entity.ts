import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gym } from './gym.entity';

/**
 * Represents gym equipment like machines, bars, barbells, plates, benches, squat racks, etc.
 */
@Entity('gym_equipment')
export class GymEquipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Name of the equipment (e.g., "Barbell", "Squat Rack", "Bench Press")
   */
  @Column()
  name: string;

  /**
   * Type/category of equipment (e.g., "barbell", "machine", "rack", "bench", "plate")
   */
  @Column()
  type: string;

  /**
   * Brand or manufacturer of the equipment (optional)
   */
  @Column({ nullable: true })
  brand?: string;

  /**
   * Model name or number (optional)
   */
  @Column({ nullable: true })
  model?: string;

  /**
   * Description of the equipment
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * URL to an image of the equipment (optional)
   */
  @Column({ nullable: true })
  imageUrl?: string;

  /**
   * Weight of the equipment in kg (for barbells, plates, etc.)
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight?: number;

  /**
   * Many-to-many relationship with Gym through gym_inventory junction table
   */
  @ManyToMany(() => Gym, (gym) => gym.equipment)
  gyms: Gym[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
