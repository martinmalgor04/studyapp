# 4. Domain Model (DDD)

## 4.1 Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            STUDY APP                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────┐    ┌───────────────────┐    ┌───────────────┐  │
│   │  IDENTITY         │    │  STUDY            │    │  ENGAGEMENT   │  │
│   │  CONTEXT          │    │  CONTEXT          │    │  CONTEXT      │  │
│   │                   │    │                   │    │               │  │
│   │  • User           │───▶│  • Subject        │───▶│  • Streak     │  │
│   │  • Profile        │    │  • Exam           │    │  • Points     │  │
│   │  • Settings       │    │  • Topic          │    │  • Level      │  │
│   │                   │    │  • Session        │    │  • Achievement│  │
│   └───────────────────┘    │  • Schedule       │    └───────────────┘  │
│                            └─────────┬─────────┘                       │
│                                      │                                  │
│                            ┌─────────▼─────────┐    ┌───────────────┐  │
│                            │  SCHEDULING       │    │  ANALYTICS    │  │
│                            │  CONTEXT          │    │  CONTEXT      │  │
│                            │                   │    │               │  │
│                            │  • TimeSlot       │───▶│  • Stats      │  │
│                            │  • CalendarEvent  │    │  • Report     │  │
│                            │  • Priority       │    │  • Trend      │  │
│                            └───────────────────┘    └───────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4.2 Study Context - Aggregates

### 4.2.1 Subject Aggregate

```typescript
// Subject es el Aggregate Root
// Contiene Exams como entidades hijas

┌─────────────────────────────────────────────────────────┐
│                    SUBJECT AGGREGATE                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Subject (Aggregate Root)            │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  id: SubjectId                                   │   │
│  │  userId: UserId                                  │   │
│  │  name: string                                    │   │
│  │  status: SubjectStatus                          │   │
│  │  createdAt: Date                                │   │
│  │  updatedAt: Date                                │   │
│  │                                                  │   │
│  │  + addExam(exam: Exam): void                    │   │
│  │  + removeExam(examId: ExamId): void             │   │
│  │  + getUpcomingExams(): Exam[]                   │   │
│  │  + archive(): void                              │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                               │
│                         │ 1:N                           │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  Exam (Entity)                   │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  id: ExamId                                      │   │
│  │  type: ExamType                                  │   │
│  │  number: number (1, 2, 99 for final)            │   │
│  │  date: Date                                      │   │
│  │  modality: ExamModality                         │   │
│  │  grade?: number                                  │   │
│  │                                                  │   │
│  │  + daysUntil(): number                          │   │
│  │  + isPassed(): boolean                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2.2 Topic Aggregate

```typescript
// Topic es el Aggregate Root
// Contiene Sessions como entidades hijas

┌─────────────────────────────────────────────────────────┐
│                     TOPIC AGGREGATE                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │               Topic (Aggregate Root)             │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  id: TopicId                                     │   │
│  │  subjectId: SubjectId                           │   │
│  │  examId: ExamId                                  │   │
│  │  name: string                                    │   │
│  │  difficulty: Difficulty                         │   │
│  │  estimatedHours: number                         │   │
│  │  classDate?: Date                               │   │
│  │  origin: TopicOrigin                            │   │
│  │  status: TopicStatus                            │   │
│  │                                                  │   │
│  │  + generateSessions(strategy): Session[]        │   │
│  │  + addSession(session: Session): void           │   │
│  │  + getCompletedSessions(): Session[]            │   │
│  │  + getCompletionRate(): number                  │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                               │
│                         │ 1:N                           │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │                Session (Entity)                  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  id: SessionId                                   │   │
│  │  number: number (R1, R2, R3...)                 │   │
│  │  scheduledDate: Date                            │   │
│  │  scheduledTime?: TimeSlot                       │   │
│  │  durationMinutes: number                        │   │
│  │  priority: Priority                             │   │
│  │  status: SessionStatus                          │   │
│  │  attempts: number                               │   │
│  │  calendarEventId?: string                       │   │
│  │  completedAt?: Date                             │   │
│  │                                                  │   │
│  │  + markCompleted(): void                        │   │
│  │  + markIncomplete(): void                       │   │
│  │  + reschedule(newDate: Date): void             │   │
│  │  + abandon(): void                              │   │
│  │  + canReschedule(): boolean                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4.3 Value Objects

```typescript
// ============================================
// DIFFICULTY
// ============================================
enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

class Difficulty {
  private constructor(private readonly level: DifficultyLevel) {}
  
  static easy(): Difficulty { return new Difficulty(DifficultyLevel.EASY); }
  static medium(): Difficulty { return new Difficulty(DifficultyLevel.MEDIUM); }
  static hard(): Difficulty { return new Difficulty(DifficultyLevel.HARD); }
  
  getIntervals(): number[] {
    const intervals = {
      [DifficultyLevel.EASY]: [1, 5, 12, 25],
      [DifficultyLevel.MEDIUM]: [1, 3, 7, 14, 30],
      [DifficultyLevel.HARD]: [1, 2, 4, 8, 15, 25]
    };
    return intervals[this.level];
  }
  
  getSessionCount(): number {
    return this.getIntervals().length;
  }
  
  getDurationFactor(sessionNumber: number): number {
    const factors = [0.60, 0.35, 0.30, 0.25, 0.20, 0.20];
    return factors[Math.min(sessionNumber - 1, factors.length - 1)];
  }
}

// ============================================
// PRIORITY
// ============================================
enum PriorityLevel {
  CRITICAL = 'CRITICAL',   // >= 85
  URGENT = 'URGENT',       // >= 70
  IMPORTANT = 'IMPORTANT', // >= 50
  NORMAL = 'NORMAL',       // >= 30
  LOW = 'LOW'              // < 30
}

class Priority {
  private constructor(
    private readonly level: PriorityLevel,
    private readonly score: number
  ) {}
  
  static fromScore(score: number): Priority {
    if (score >= 85) return new Priority(PriorityLevel.CRITICAL, score);
    if (score >= 70) return new Priority(PriorityLevel.URGENT, score);
    if (score >= 50) return new Priority(PriorityLevel.IMPORTANT, score);
    if (score >= 30) return new Priority(PriorityLevel.NORMAL, score);
    return new Priority(PriorityLevel.LOW, score);
  }
  
  getLevel(): PriorityLevel { return this.level; }
  getScore(): number { return this.score; }
  
  getEmoji(): string {
    const emojis = {
      [PriorityLevel.CRITICAL]: '🔴',
      [PriorityLevel.URGENT]: '🟠',
      [PriorityLevel.IMPORTANT]: '🟡',
      [PriorityLevel.NORMAL]: '🟢',
      [PriorityLevel.LOW]: '⚪'
    };
    return emojis[this.level];
  }
}

// ============================================
// SESSION STATUS
// ============================================
enum SessionStatusValue {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  INCOMPLETE = 'INCOMPLETE',
  RESCHEDULED = 'RESCHEDULED',
  ABANDONED = 'ABANDONED'
}

class SessionStatus {
  private constructor(private readonly value: SessionStatusValue) {}
  
  static pending(): SessionStatus { 
    return new SessionStatus(SessionStatusValue.PENDING); 
  }
  
  canTransitionTo(newStatus: SessionStatusValue): boolean {
    const validTransitions = {
      [SessionStatusValue.PENDING]: [
        SessionStatusValue.COMPLETED, 
        SessionStatusValue.INCOMPLETE,
        SessionStatusValue.ABANDONED
      ],
      [SessionStatusValue.INCOMPLETE]: [
        SessionStatusValue.RESCHEDULED, 
        SessionStatusValue.ABANDONED
      ],
      [SessionStatusValue.RESCHEDULED]: [
        SessionStatusValue.COMPLETED, 
        SessionStatusValue.ABANDONED
      ],
      [SessionStatusValue.COMPLETED]: [],
      [SessionStatusValue.ABANDONED]: []
    };
    return validTransitions[this.value].includes(newStatus);
  }
}

// ============================================
// TIME SLOT
// ============================================
class TimeSlot {
  private constructor(
    private readonly startHour: number,
    private readonly endHour: number
  ) {
    if (startHour < 0 || startHour > 23) throw new Error('Invalid hour');
    if (endHour < startHour) throw new Error('End must be after start');
  }
  
  static create(start: number, end: number): TimeSlot {
    return new TimeSlot(start, end);
  }
  
  overlaps(other: TimeSlot): boolean {
    return this.startHour < other.endHour && this.endHour > other.startHour;
  }
  
  getDurationHours(): number {
    return this.endHour - this.startHour;
  }
}

// ============================================
// EXAM TYPE
// ============================================
enum ExamType {
  PARTIAL = 'PARTIAL',           // Parcial
  RECOVERY = 'RECOVERY',         // Recuperatorio
  FINAL = 'FINAL'                // Final
}

enum ExamModality {
  THEORETICAL = 'THEORETICAL',   // Teórico
  PRACTICAL = 'PRACTICAL',       // Práctico
  MIXED = 'MIXED'                // Mixto
}

// ============================================
// TOPIC ORIGIN
// ============================================
enum TopicOrigin {
  CLASS = 'CLASS',               // Desde una clase
  FREE_STUDY = 'FREE_STUDY'      // Estudio libre
}
```

---

## 4.4 Domain Services

### 4.4.1 Spaced Repetition Service

```typescript
interface ISessionGeneratorStrategy {
  generate(topic: Topic, exam: Exam): Session[];
}

// Forward Strategy (desde clase hacia parcial)
class ForwardSessionStrategy implements ISessionGeneratorStrategy {
  generate(topic: Topic, exam: Exam): Session[] {
    const intervals = topic.difficulty.getIntervals();
    const sessions: Session[] = [];
    
    for (let i = 0; i < intervals.length; i++) {
      const sessionDate = addDays(topic.classDate, intervals[i]);
      
      // Skip si la sesión cae después del examen
      if (sessionDate >= exam.date) continue;
      
      const duration = topic.estimatedHours * 60 * 
                       topic.difficulty.getDurationFactor(i + 1);
      
      sessions.push(Session.create({
        number: i + 1,
        scheduledDate: sessionDate,
        durationMinutes: Math.round(duration),
        priority: this.calculatePriority(sessionDate, exam, topic.difficulty)
      }));
    }
    
    return sessions;
  }
}

// Countdown Strategy (desde examen hacia atrás)
class CountdownSessionStrategy implements ISessionGeneratorStrategy {
  private readonly INTERVALS = {
    EASY: [30, 20, 12, 5],
    MEDIUM: [35, 24, 17, 10, 5],
    HARD: [35, 25, 18, 12, 7, 3]
  };
  
  generate(topic: Topic, exam: Exam): Session[] {
    const intervals = this.INTERVALS[topic.difficulty.getLevel()];
    const sessions: Session[] = [];
    const today = new Date();
    
    for (let i = 0; i < intervals.length; i++) {
      const sessionDate = subDays(exam.date, intervals[i]);
      
      // Skip si la sesión cae antes de hoy
      if (sessionDate < today) continue;
      
      const duration = topic.estimatedHours * 60 * 
                       this.getDurationFactor(i, intervals.length);
      
      sessions.push(Session.create({
        number: i + 1,
        scheduledDate: sessionDate,
        durationMinutes: Math.round(duration),
        priority: this.calculatePriority(sessionDate, exam, topic.difficulty)
      }));
    }
    
    return sessions;
  }
}
```

### 4.4.2 Priority Calculator Service

```typescript
class PriorityCalculatorService {
  calculate(
    sessionDate: Date,
    examDate: Date,
    difficulty: Difficulty,
    sessionNumber: number
  ): Priority {
    let score = 0;
    
    // Factor 1: Urgencia (0-40 puntos)
    const daysUntilExam = differenceInDays(examDate, sessionDate);
    if (daysUntilExam <= 7) score += 40;
    else if (daysUntilExam <= 14) score += 35;
    else if (daysUntilExam <= 21) score += 25;
    else if (daysUntilExam <= 30) score += 15;
    else score += 10;
    
    // Factor 2: Dificultad (10-30 puntos)
    const difficultyScores = { EASY: 10, MEDIUM: 20, HARD: 30 };
    score += difficultyScores[difficulty.getLevel()];
    
    // Factor 3: Número de repaso (5-20 puntos)
    score += Math.max(5, 22 - sessionNumber * 2);
    
    // Factor 4: Proximidad (2-12 puntos)
    const daysUntilSession = differenceInDays(sessionDate, new Date());
    if (daysUntilSession <= 0) score += 12;
    else if (daysUntilSession <= 2) score += 10;
    else if (daysUntilSession <= 5) score += 7;
    else score += 2;
    
    return Priority.fromScore(score);
  }
}
```

### 4.4.3 Slot Finder Service

```typescript
interface ISlotFinderService {
  findAvailableSlots(
    date: Date,
    durationMinutes: number,
    existingEvents: CalendarEvent[]
  ): TimeSlot[];
}

class SlotFinderService implements ISlotFinderService {
  private readonly ENERGY_CURVE: Record<number, number> = {
    6: 0.4, 7: 0.5, 8: 0.6, 9: 0.75, 10: 0.9, 11: 1.0,
    12: 0.7, 13: 0.6, 14: 0.5,
    15: 0.7, 16: 0.9, 17: 1.0, 18: 0.95, 19: 0.85,
    20: 0.7, 21: 0.6, 22: 0.4, 23: 0.3
  };
  
  private readonly PREFERRED_RANGES = [
    { start: 15, end: 19, priority: 1 },  // Tarde (preferida)
    { start: 9, end: 12, priority: 2 },   // Mañana
    { start: 20, end: 22, priority: 3 }   // Noche
  ];
  
  findAvailableSlots(
    date: Date,
    durationMinutes: number,
    existingEvents: CalendarEvent[]
  ): TimeSlot[] {
    // Skip domingos
    if (date.getDay() === 0) return [];
    
    const candidates: ScoredSlot[] = [];
    
    for (const range of this.PREFERRED_RANGES) {
      for (let hour = range.start; hour <= range.end - 1; hour++) {
        const slot = TimeSlot.create(hour, hour + Math.ceil(durationMinutes / 60));
        
        if (this.isSlotAvailable(slot, existingEvents)) {
          const score = this.scoreSlot(slot, range.priority);
          candidates.push({ slot, score });
        }
      }
    }
    
    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(c => c.slot);
  }
  
  private scoreSlot(slot: TimeSlot, rangePriority: number): number {
    const energy = this.ENERGY_CURVE[slot.startHour] || 0.5;
    const priorityScore = (4 - rangePriority) * 10;
    return energy * 50 + priorityScore;
  }
}
```

---

## 4.5 Domain Events

```typescript
// ============================================
// EVENTS
// ============================================

abstract class DomainEvent {
  readonly occurredOn: Date = new Date();
  abstract readonly eventType: string;
}

class TopicCreatedEvent extends DomainEvent {
  readonly eventType = 'topic.created';
  
  constructor(
    readonly topicId: string,
    readonly subjectId: string,
    readonly examId: string,
    readonly difficulty: string
  ) {
    super();
  }
}

class SessionCompletedEvent extends DomainEvent {
  readonly eventType = 'session.completed';
  
  constructor(
    readonly sessionId: string,
    readonly topicId: string,
    readonly userId: string
  ) {
    super();
  }
}

class SessionMissedEvent extends DomainEvent {
  readonly eventType = 'session.missed';
  
  constructor(
    readonly sessionId: string,
    readonly topicId: string,
    readonly userId: string,
    readonly attemptNumber: number
  ) {
    super();
  }
}

class StreakUpdatedEvent extends DomainEvent {
  readonly eventType = 'streak.updated';
  
  constructor(
    readonly userId: string,
    readonly currentStreak: number,
    readonly longestStreak: number
  ) {
    super();
  }
}

// ============================================
// EVENT HANDLERS
// ============================================

@Injectable()
class SessionCompletedHandler {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly analyticsService: AnalyticsService
  ) {}
  
  @OnEvent('session.completed')
  async handle(event: SessionCompletedEvent): Promise<void> {
    await this.gamificationService.addPoints(event.userId, 10);
    await this.gamificationService.updateStreak(event.userId);
    await this.analyticsService.trackCompletion(event);
  }
}
```

---

## 4.6 Entity Relationships (ERD)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIPS                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│   USER   │       │  SUBJECT │       │   EXAM   │       │  TOPIC   │
├──────────┤       ├──────────┤       ├──────────┤       ├──────────┤
│ id (PK)  │──┐    │ id (PK)  │──┐    │ id (PK)  │──┐    │ id (PK)  │
│ email    │  │    │ userId   │◀─┘    │subjectId │◀─┘    │ examId   │◀─┐
│ name     │  │    │ name     │  │    │ type     │  │    │ name     │  │
│ password │  │    │ status   │  │    │ number   │  │    │difficulty│  │
│ settings │  │    │          │  │    │ date     │  │    │ hours    │  │
└──────────┘  │    └──────────┘  │    │ modality │  │    │classDate │  │
              │                  │    │ grade    │  │    │ status   │  │
              │                  │    └──────────┘  │    └────┬─────┘  │
              │                  │                  │         │        │
              │                  │                  └─────────┼────────┘
              │                  │                            │
              │                  │                            │ 1:N
              │                  │                            ▼
              │                  │                     ┌──────────┐
              │                  │                     │ SESSION  │
              │                  │                     ├──────────┤
              │                  │                     │ id (PK)  │
              │                  │                     │ topicId  │◀───┘
              │                  │                     │ number   │
              │                  │                     │ date     │
              │                  │                     │ time     │
              │                  │                     │ duration │
              │                  │                     │ priority │
              │                  │                     │ status   │
              │                  │                     │ attempts │
              │                  │                     │calendarId│
              │                  │                     └──────────┘
              │                  │
              │    ┌─────────────┼─────────────┐
              │    │             │             │
              │    ▼             │             ▼
        ┌──────────┐       ┌──────────┐  ┌──────────┐
        │USER_STATS│       │   TASK   │  │ACHIEVEMENT│
        ├──────────┤       ├──────────┤  ├──────────┤
        │ userId   │◀──────│ userId   │  │ userId   │◀───┘
        │ points   │       │subjectId │  │ type     │
        │ streak   │       │ title    │  │ earnedAt │
        │ level    │       │ deadline │  │          │
        │longestStr│       │ status   │  │          │
        └──────────┘       └──────────┘  └──────────┘
```
