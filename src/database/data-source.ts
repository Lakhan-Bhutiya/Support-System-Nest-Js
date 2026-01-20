import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { TicketAuditLog } from '../audit/entities/ticket-audit.entity';
import { Notification } from '../notifications/entities/notification.entity';
import 'dotenv/config';
import 'reflect-metadata';


export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: String(process.env.DB_PASSWORD), // ensure string
    database: process.env.DB_NAME,
  entities: [User, Ticket, TicketAuditLog, Notification],
  migrations: ['src/database/migrations/*.ts'],
});
