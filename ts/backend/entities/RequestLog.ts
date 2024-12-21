import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class RequestLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  source: string;

  @Column()
  numValues: number;

  @Column("text")
  extractedData: string;

  @Column()
  requestTime: string;
}