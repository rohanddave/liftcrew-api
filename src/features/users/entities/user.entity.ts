import { Gym } from 'src/features/gyms/entities/gym.entity';
import {
  AfterLoad,
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
   * User's height in centimeters.
   */
  @Column()
  height: number;

  /**
   * User's weight in kilograms.
   */
  @Column()
  weight: number;

  /**
   * User's date of birth.
   * Stored as a Date to calculate age dynamically.
   */
  @Column({ type: 'date' })
  birthdate: Date;

  /**
   * URL to the user's profile image.
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

  /**
   * Total kudos points received on user's posts.
   */
  @Column({ default: 0 })
  kudosCount: number;

  // Non-persisted field - calculated on load
  age: number;

  @AfterLoad()
  calculateAge() {
    if (this.birthdate) {
      const today = new Date();
      const birthDate = new Date(this.birthdate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      this.age = age;
    }
  }
}
