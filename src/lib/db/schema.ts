import { relations } from 'drizzle-orm';
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

// Tabela de usuários
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  level: integer('level').notNull(), // 1: aluno, 2: professor, 3: admin
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de relacionamento aluno-professor
export const studentTrainer = pgTable('student_trainer', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .notNull()
    .references(() => users.id),
  trainerId: integer('trainer_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de mensagens
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id')
    .notNull()
    .references(() => users.id),
  receiverId: integer('receiver_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relacionamentos
export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: 'sentMessages' }),
  receivedMessages: many(messages, { relationName: 'receivedMessages' }),
  students: many(studentTrainer, { relationName: 'trainer' }),
  trainers: many(studentTrainer, { relationName: 'student' }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sentMessages',
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: 'receivedMessages',
  }),
}));

export const studentTrainerRelations = relations(studentTrainer, ({ one }) => ({
  student: one(users, {
    fields: [studentTrainer.studentId],
    references: [users.id],
    relationName: 'student',
  }),
  trainer: one(users, {
    fields: [studentTrainer.trainerId],
    references: [users.id],
    relationName: 'trainer',
  }),
})); 