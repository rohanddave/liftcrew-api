import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gym } from './gym.entity';
import { GymEquipment } from './gym-equipment.entity';

/**
 * Junction table for the many-to-many relationship between Gym and GymEquipment.
 * Represents the inventory of equipment available at each gym.
 */
@Entity('gym_inventory')
export class GymInventory {
  /**
   * ID of the gym (part of composite primary key)
   */
  @PrimaryColumn()
  gymId: string;

  /**
   * Relationship to the Gym entity
   */
  @ManyToOne(() => Gym, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gymId' })
  gym: Gym;

  /**
   * ID of the equipment (part of composite primary key)
   */
  @PrimaryColumn()
  equipmentId: string;

  /**
   * Relationship to the GymEquipment entity
   */
  @ManyToOne(() => GymEquipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipmentId' })
  equipment: GymEquipment;

  /**
   * Quantity of this equipment available at the gym
   */
  @Column({ default: 1 })
  quantity: number;

  /**
   * Condition of the equipment (e.g., "new", "good", "fair", "needs_repair")
   */
  @Column({ nullable: true })
  condition?: string;

  /**
   * Additional notes about this specific equipment at this gym
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
