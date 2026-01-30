# 6. Database Schema

## 6.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
}

enum ExamType {
  PARTIAL      // Parcial
  RECOVERY     // Recuperatorio
  FINAL        // Final
}

enum ExamModality {
  THEORETICAL  // Teórico
  PRACTICAL    // Práctico
  MIXED        // Mixto
}

enum TopicOrigin {
  CLASS        // Desde clase
  FREE_STUDY   // Estudio libre
}

enum TopicStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
}

enum SessionStatus {
  PENDING
  COMPLETED
  INCOMPLETE
  RESCHEDULED
  ABANDONED
}

enum PriorityLevel {
  CRITICAL
  URGENT
  IMPORTANT
  NORMAL
  LOW
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// ============================================
// MODELS
// ============================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String
  avatarUrl     String?   @map("avatar_url")
  
  // Settings
  timezone      String    @default("America/Argentina/Buenos_Aires")
  studyHoursMin Int       @default(8)  @map("study_hours_min")
  studyHoursMax Int       @default(22) @map("study_hours_max")
  
  // OAuth
  googleId      String?   @unique @map("google_id")
  googleToken   String?   @map("google_token")
  
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  // Relations
  subjects      Subject[]
  userStats     UserStats?
  notifications Notification[]
  
  @@map("users")
}

model Subject {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  name        String
  color       String?   // Hex color for UI
  status      String    @default("active") // active, archived
  
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  exams       Exam[]
  topics      Topic[]
  tasks       Task[]
  
  @@unique([userId, name])
  @@index([userId])
  @@map("subjects")
}

model Exam {
  id          String       @id @default(uuid())
  subjectId   String       @map("subject_id")
  type        ExamType
  number      Int          // 1, 2, 3... or 99 for final
  modality    ExamModality
  date        DateTime
  grade       Float?
  notes       String?
  
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  
  // Relations
  subject     Subject      @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  topics      Topic[]
  
  // Computed (can use Prisma middleware or view)
  // daysUntil: computed from date
  
  @@unique([subjectId, type, number])
  @@index([subjectId])
  @@index([date])
  @@map("exams")
}

model Topic {
  id              String        @id @default(uuid())
  subjectId       String        @map("subject_id")
  examId          String        @map("exam_id")
  name            String
  difficulty      DifficultyLevel
  estimatedHours  Float         @map("estimated_hours")
  classDate       DateTime?     @map("class_date")
  origin          TopicOrigin
  status          TopicStatus   @default(ACTIVE)
  notes           String?
  
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  
  // Relations
  subject         Subject       @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  exam            Exam          @relation(fields: [examId], references: [id], onDelete: Cascade)
  sessions        Session[]
  
  @@index([subjectId])
  @@index([examId])
  @@index([status])
  @@map("topics")
}

model Session {
  id              String         @id @default(uuid())
  topicId         String         @map("topic_id")
  number          Int            // R1, R2, R3...
  scheduledDate   DateTime       @map("scheduled_date")
  scheduledTime   String?        @map("scheduled_time") // "15:00"
  durationMinutes Int            @map("duration_minutes")
  priority        PriorityLevel
  priorityScore   Int            @map("priority_score")
  status          SessionStatus  @default(PENDING)
  attempts        Int            @default(0)
  
  // Calendar sync
  calendarEventId String?        @map("calendar_event_id")
  
  // Completion tracking
  completedAt     DateTime?      @map("completed_at")
  notes           String?
  
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  
  // Relations
  topic           Topic          @relation(fields: [topicId], references: [id], onDelete: Cascade)
  
  @@index([topicId])
  @@index([scheduledDate])
  @@index([status])
  @@index([priority])
  @@map("sessions")
}

model Task {
  id              String      @id @default(uuid())
  subjectId       String      @map("subject_id")
  title           String
  description     String?
  estimatedHours  Float       @map("estimated_hours")
  deadline        DateTime
  status          TaskStatus  @default(TODO)
  progress        Int         @default(0) // 0-100
  
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")
  completedAt     DateTime?   @map("completed_at")
  
  // Relations
  subject         Subject     @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  
  @@index([subjectId])
  @@index([deadline])
  @@index([status])
  @@map("tasks")
}

model UserStats {
  id              String    @id @default(uuid())
  userId          String    @unique @map("user_id")
  
  // Points & Level
  points          Int       @default(0)
  level           Int       @default(1)
  
  // Streaks
  currentStreak   Int       @default(0) @map("current_streak")
  longestStreak   Int       @default(0) @map("longest_streak")
  lastActivityAt  DateTime? @map("last_activity_at")
  
  // Aggregated stats
  totalSessions   Int       @default(0) @map("total_sessions")
  completedSess   Int       @default(0) @map("completed_sessions")
  totalMinutes    Int       @default(0) @map("total_minutes")
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievements    Achievement[]
  
  @@map("user_stats")
}

model Achievement {
  id          String    @id @default(uuid())
  userStatsId String    @map("user_stats_id")
  type        String    // FIRST_SESSION, STREAK_7, STREAK_30, etc.
  earnedAt    DateTime  @default(now()) @map("earned_at")
  
  // Relations
  userStats   UserStats @relation(fields: [userStatsId], references: [id], onDelete: Cascade)
  
  @@unique([userStatsId, type])
  @@map("achievements")
}

model Notification {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  type        String    // SESSION_REMINDER, DAILY_SUMMARY, STREAK_ALERT
  title       String
  body        String
  data        Json?     // Additional data
  read        Boolean   @default(false)
  sentAt      DateTime  @default(now()) @map("sent_at")
  
  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, read])
  @@index([sentAt])
  @@map("notifications")
}
```

---

## 6.2 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │
│ email        │──────────────────────────────────────────────┐
│ password_hash│                                              │
│ name         │                                              │
│ google_id    │                                              │
│ timezone     │                                              │
│ created_at   │                                              │
└──────┬───────┘                                              │
       │                                                      │
       │ 1:N                                                  │ 1:1
       ▼                                                      ▼
┌──────────────┐       ┌──────────────┐              ┌──────────────┐
│   subjects   │       │    exams     │              │  user_stats  │
├──────────────┤       ├──────────────┤              ├──────────────┤
│ id (PK)      │       │ id (PK)      │              │ id (PK)      │
│ user_id (FK) │◀──────│ subject_id   │◀─┐           │ user_id (FK) │
│ name         │  1:N  │ type         │  │           │ points       │
│ color        │       │ number       │  │           │ level        │
│ status       │       │ modality     │  │           │ current_streak│
└──────┬───────┘       │ date         │  │           │ longest_streak│
       │               │ grade        │  │           └──────┬───────┘
       │               └──────┬───────┘  │                  │
       │                      │          │                  │ 1:N
       │ 1:N                  │ 1:N      │                  ▼
       ▼                      ▼          │           ┌──────────────┐
┌──────────────┐       ┌──────────────┐  │           │ achievements │
│    topics    │       │   sessions   │  │           ├──────────────┤
├──────────────┤       ├──────────────┤  │           │ id (PK)      │
│ id (PK)      │──────▶│ id (PK)      │  │           │user_stats_id │
│ subject_id   │◀──────│ topic_id (FK)│  │           │ type         │
│ exam_id (FK) │───────┼──────────────┘  │           │ earned_at    │
│ name         │       │ number         │           └──────────────┘
│ difficulty   │       │ scheduled_date │
│ estimated_hrs│       │ scheduled_time │
│ class_date   │       │ duration_mins  │
│ origin       │       │ priority       │
│ status       │       │ priority_score │
└──────────────┘       │ status         │
                       │ attempts       │
                       │ calendar_event │
                       │ completed_at   │
                       └────────────────┘

┌──────────────┐       ┌──────────────┐
│    tasks     │       │notifications │
├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │
│ subject_id   │◀──┐   │ user_id (FK) │◀── (from users)
│ title        │   │   │ type         │
│ description  │   │   │ title        │
│ estimated_hrs│   │   │ body         │
│ deadline     │   │   │ data (JSON)  │
│ status       │   │   │ read         │
│ progress     │   │   │ sent_at      │
└──────────────┘   │   └──────────────┘
                   │
                   └── (from subjects)
```

---

## 6.3 Indexes Strategy

### Performance Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Subjects
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_subjects_user_status ON subjects(user_id, status);

-- Exams
CREATE INDEX idx_exams_subject_id ON exams(subject_id);
CREATE INDEX idx_exams_date ON exams(date);
CREATE INDEX idx_exams_upcoming ON exams(subject_id, date) 
  WHERE date > NOW();

-- Topics
CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_topics_exam_id ON topics(exam_id);
CREATE INDEX idx_topics_status ON topics(status);

-- Sessions (most queried table)
CREATE INDEX idx_sessions_topic_id ON sessions(topic_id);
CREATE INDEX idx_sessions_date ON sessions(scheduled_date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_priority ON sessions(priority);

-- Composite indexes for common queries
CREATE INDEX idx_sessions_date_status ON sessions(scheduled_date, status);
CREATE INDEX idx_sessions_user_date ON sessions(topic_id, scheduled_date)
  -- For "get sessions for user on date" - needs join

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) 
  WHERE read = false;
```

---

## 6.4 Common Queries

### Dashboard: Today's Sessions

```sql
-- Get today's sessions for a user, ordered by priority
SELECT 
  s.*,
  t.name as topic_name,
  t.difficulty,
  sub.name as subject_name,
  sub.color as subject_color,
  e.date as exam_date,
  e.type as exam_type
FROM sessions s
JOIN topics t ON s.topic_id = t.id
JOIN subjects sub ON t.subject_id = sub.id
JOIN exams e ON t.exam_id = e.id
WHERE sub.user_id = $1
  AND s.scheduled_date = CURRENT_DATE
  AND s.status IN ('PENDING', 'RESCHEDULED')
ORDER BY s.priority_score DESC, s.scheduled_time ASC;
```

### Weekly Overview

```sql
-- Get sessions for the week
SELECT 
  DATE(s.scheduled_date) as day,
  COUNT(*) as total_sessions,
  SUM(s.duration_minutes) as total_minutes,
  SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN s.priority = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count
FROM sessions s
JOIN topics t ON s.topic_id = t.id
JOIN subjects sub ON t.subject_id = sub.id
WHERE sub.user_id = $1
  AND s.scheduled_date BETWEEN $2 AND $3
GROUP BY DATE(s.scheduled_date)
ORDER BY day;
```

### Upcoming Exams with Progress

```sql
-- Get exams with completion rate
SELECT 
  e.*,
  sub.name as subject_name,
  COUNT(DISTINCT t.id) as topic_count,
  COUNT(DISTINCT s.id) as session_count,
  SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_sessions,
  ROUND(
    100.0 * SUM(CASE WHEN s.status = 'COMPLETED' THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(s.id), 0),
    1
  ) as completion_rate
FROM exams e
JOIN subjects sub ON e.subject_id = sub.id
LEFT JOIN topics t ON t.exam_id = e.id
LEFT JOIN sessions s ON s.topic_id = t.id
WHERE sub.user_id = $1
  AND e.date > CURRENT_DATE
GROUP BY e.id, sub.name
ORDER BY e.date ASC;
```

### User Statistics

```sql
-- Aggregate user study stats
SELECT 
  us.*,
  (SELECT COUNT(*) FROM sessions s 
   JOIN topics t ON s.topic_id = t.id 
   JOIN subjects sub ON t.subject_id = sub.id 
   WHERE sub.user_id = us.user_id 
     AND s.status = 'COMPLETED' 
     AND DATE(s.completed_at) = CURRENT_DATE
  ) as completed_today,
  (SELECT COUNT(*) FROM sessions s 
   JOIN topics t ON s.topic_id = t.id 
   JOIN subjects sub ON t.subject_id = sub.id 
   WHERE sub.user_id = us.user_id 
     AND s.status = 'COMPLETED' 
     AND s.completed_at >= DATE_TRUNC('week', CURRENT_DATE)
  ) as completed_this_week
FROM user_stats us
WHERE us.user_id = $1;
```

---

## 6.5 Migrations

### Initial Migration

```sql
-- migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE difficulty_level AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE exam_type AS ENUM ('PARTIAL', 'RECOVERY', 'FINAL');
CREATE TYPE exam_modality AS ENUM ('THEORETICAL', 'PRACTICAL', 'MIXED');
CREATE TYPE topic_origin AS ENUM ('CLASS', 'FREE_STUDY');
CREATE TYPE topic_status AS ENUM ('ACTIVE', 'ARCHIVED', 'COMPLETED');
CREATE TYPE session_status AS ENUM ('PENDING', 'COMPLETED', 'INCOMPLETE', 'RESCHEDULED', 'ABANDONED');
CREATE TYPE priority_level AS ENUM ('CRITICAL', 'URGENT', 'IMPORTANT', 'NORMAL', 'LOW');
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
  study_hours_min INT DEFAULT 8,
  study_hours_max INT DEFAULT 22,
  google_id VARCHAR(255) UNIQUE,
  google_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  type exam_type NOT NULL,
  number INT NOT NULL,
  modality exam_modality NOT NULL,
  date DATE NOT NULL,
  grade DECIMAL(3,1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, type, number)
);

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  difficulty difficulty_level NOT NULL,
  estimated_hours DECIMAL(4,2) NOT NULL,
  class_date DATE,
  origin topic_origin NOT NULL,
  status topic_status DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  number INT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INT NOT NULL,
  priority priority_level NOT NULL,
  priority_score INT NOT NULL,
  status session_status DEFAULT 'PENDING',
  attempts INT DEFAULT 0,
  calendar_event_id VARCHAR(255),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  estimated_hours DECIMAL(4,2) NOT NULL,
  deadline DATE NOT NULL,
  status task_status DEFAULT 'TODO',
  progress INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  level INT DEFAULT 1,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  total_sessions INT DEFAULT 0,
  completed_sessions INT DEFAULT 0,
  total_minutes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_stats_id UUID NOT NULL REFERENCES user_stats(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_stats_id, type)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_exams_subject_id ON exams(subject_id);
CREATE INDEX idx_exams_date ON exams(date);
CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_topics_exam_id ON topics(exam_id);
CREATE INDEX idx_sessions_topic_id ON sessions(topic_id);
CREATE INDEX idx_sessions_date ON sessions(scheduled_date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_date_status ON sessions(scheduled_date, status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
