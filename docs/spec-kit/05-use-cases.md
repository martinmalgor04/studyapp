# 5. Use Cases - Technical Specifications

## 5.1 Use Cases por Release

### MVP Release

| UC-ID | Use Case | Module | Complexity | Estado | Tests |
|-------|----------|--------|------------|--------|-------|
| UC-001 | User Registration | Auth | ⬜ Low | ✅ Completado | 🟢 E2E (3) |
| UC-002 | User Login | Auth | ⬜ Low | ✅ Completado | 🟢 E2E (4) |
| UC-003 | Create Subject | Study | ⬜ Low | ✅ Completado | 🟢 E2E (3) |
| UC-004 | Create Exam | Study | ⬜ Low | ✅ Completado | 🟢 E2E (2) |
| UC-005 | Create Topic (Class) | Study | 🟡 Medium | ✅ Completado | 🟢 E2E (3) |
| UC-006 | Generate Sessions | Study | 🟠 High | ✅ Completado | 🟢 Unit (56) |
| UC-007 | View Dashboard | Study | ⬜ Low | ✅ Completado | 🟢 E2E (5) |

### v1.0 Release

| UC-ID | Use Case | Module | Complexity | Estado | Tests |
|-------|----------|--------|------------|--------|-------|
| UC-008 | Track Session Completion | Study | ⬜ Low | ⏳ En Progreso | ⏳ Pendiente |
| UC-009 | Reschedule Session | Study | 🟡 Medium | ⏳ Pendiente | ⏳ Pendiente |
| UC-010 | Free Study Mode | Study | 🟡 Medium | ✅ Completado | 🟢 Incluido en UC-006 |
| UC-011 | Sync Google Calendar | Calendar | 🟠 High | ⏳ Pendiente | ⏳ Pendiente |
| UC-012 | Send Notifications | Notification | 🟡 Medium | ⏳ Pendiente | ⏳ Pendiente |

### v1.5 Release

| UC-ID | Use Case | Module | Complexity | Estado | Tests |
|-------|----------|--------|------------|--------|-------|
| UC-013 | Track Streaks | Gamification | 🟡 Medium | ⏳ Pendiente | ⏳ Pendiente |
| UC-014 | View Analytics | Analytics | 🟡 Medium | ⏳ Pendiente | ⏳ Pendiente |
| UC-015 | Create Task/TP | Task | ⬜ Low | ⏳ Pendiente | ⏳ Pendiente |

### Additional Features (Implemented)

| UC-ID | Use Case | Module | Complexity | Estado | Tests |
|-------|----------|--------|------------|--------|-------|
| UC-016 | User Logout | Auth | ⬜ Low | ✅ Completado | ⏳ Pendiente |
| UC-017 | View/Edit Profile | Profile | ⬜ Low | ✅ Completado | ⏳ Pendiente |
| UC-018 | Change Password | Profile | ⬜ Low | ✅ Completado | ⏳ Pendiente |
| UC-019 | Delete Account | Profile | 🟡 Medium | ✅ Completado | ⏳ Pendiente |
| UC-020 | View/Manage Sessions | Sessions | 🟡 Medium | ✅ Completado | ⏳ Pendiente |

**Leyenda de Tests:**
- 🟢 Tests implementados y funcionando
- 🟡 Tests parciales o en progreso
- ⏳ Pendiente de implementar

**Total Coverage MVP**: 56 unit tests + 20 E2E tests = 76 tests

---

## 5.2 UC-001: User Registration

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-001 |
| **Priority** | P0 |
| **Module** | Auth |
| **Complexity** | ⬜ Low |
| **Status** | ✅ Completado |
| **Actor** | Anonymous User |

### User Story

```
AS A student
I WANT TO create an account
SO THAT I can save my study data
```

### API Endpoint

```http
POST /api/v1/auth/register

Request:
{
  "email": "student@email.com",
  "password": "SecurePass123!",
  "name": "Juan Pérez"
}

Response 201:
{
  "user": {
    "id": "uuid",
    "email": "student@email.com",
    "name": "Juan Pérez",
    "createdAt": "2026-01-20T10:00:00Z"
  },
  "accessToken": "jwt.token.here"
}

Response 400:
{
  "statusCode": 400,
  "message": ["email must be valid", "password too weak"],
  "error": "Bad Request"
}

Response 409:
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

### Implementation

```typescript
// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }
}

// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}
  
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if email exists
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    // Create user
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword
    });
    
    // Generate token
    const accessToken = this.jwtService.sign({ sub: user.id });
    
    return { user, accessToken };
  }
}

// register.dto.ts
export class RegisterDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number'
  })
  password: string;
  
  @IsString()
  @MinLength(2)
  name: string;
}
```

### Acceptance Criteria

```gherkin
Feature: User Registration

  Scenario: Successful registration
    Given I am on the registration page
    When I enter valid email, password, and name
    And I submit the form
    Then I should be registered
    And I should be logged in automatically
    And I should be redirected to dashboard

  Scenario: Registration with existing email
    Given a user with email "test@email.com" exists
    When I try to register with the same email
    Then I should see error "Email already registered"
    And I should not be registered

  Scenario: Registration with weak password
    When I enter a password without uppercase letter
    Then I should see error about password requirements
```

---

## 5.3 UC-005: Create Topic (Class)

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-005 |
| **Priority** | P0 |
| **Module** | Study |
| **Complexity** | 🟡 Medium |
| **Status** | ✅ Completado |
| **Actor** | Authenticated User |
| **Triggers** | UC-006 (Session Generation) |

### User Story

```
AS A student
I WANT TO register a class/topic I had
SO THAT the system generates study sessions automatically
```

### API Endpoint

```http
POST /api/v1/topics

Headers:
  Authorization: Bearer {token}

Request:
{
  "subjectId": "uuid-subject",
  "examId": "uuid-exam",
  "name": "Varianza y Desvío Estándar",
  "difficulty": "HARD",
  "estimatedHours": 2,
  "classDate": "2026-01-20",
  "notes": "Clase teórica con ejercicios"
}

Response 201:
{
  "topic": {
    "id": "uuid-topic",
    "subjectId": "uuid-subject",
    "examId": "uuid-exam",
    "name": "Varianza y Desvío Estándar",
    "difficulty": "HARD",
    "estimatedHours": 2,
    "classDate": "2026-01-20T00:00:00Z",
    "origin": "CLASS",
    "status": "ACTIVE",
    "createdAt": "2026-01-20T10:00:00Z"
  },
  "sessions": [
    {
      "id": "uuid-session-1",
      "number": 1,
      "scheduledDate": "2026-01-21",
      "durationMinutes": 72,
      "priority": "NORMAL",
      "status": "PENDING"
    },
    // ... more sessions
  ],
  "message": "Topic created with 6 study sessions"
}
```

### Implementation

```typescript
// topics.controller.ts
@Controller('topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}
  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateTopicDto
  ): Promise<CreateTopicResponse> {
    return this.topicsService.create(user.id, dto);
  }
}

// topics.service.ts
@Injectable()
export class TopicsService {
  constructor(
    private readonly topicsRepository: TopicsRepository,
    private readonly examsRepository: ExamsRepository,
    private readonly sessionGenerator: SessionGeneratorService,
    private readonly eventEmitter: EventEmitter2
  ) {}
  
  async create(userId: string, dto: CreateTopicDto): Promise<CreateTopicResponse> {
    // Verify subject belongs to user
    const exam = await this.examsRepository.findById(dto.examId);
    if (!exam || exam.subject.userId !== userId) {
      throw new ForbiddenException('Invalid exam');
    }
    
    // Create topic
    const topic = await this.topicsRepository.create({
      ...dto,
      origin: TopicOrigin.CLASS,
      status: TopicStatus.ACTIVE
    });
    
    // Generate sessions using Strategy Pattern
    const strategy = this.getStrategy(topic.origin);
    const sessions = await strategy.generate(topic, exam);
    
    // Save sessions
    await this.topicsRepository.addSessions(topic.id, sessions);
    
    // Emit domain event
    this.eventEmitter.emit('topic.created', new TopicCreatedEvent(
      topic.id,
      exam.subjectId,
      exam.id,
      topic.difficulty
    ));
    
    return {
      topic,
      sessions,
      message: `Topic created with ${sessions.length} study sessions`
    };
  }
  
  private getStrategy(origin: TopicOrigin): ISessionGeneratorStrategy {
    if (origin === TopicOrigin.CLASS) {
      return new ForwardSessionStrategy();
    }
    return new CountdownSessionStrategy();
  }
}

// create-topic.dto.ts
export class CreateTopicDto {
  @IsUUID()
  subjectId: string;
  
  @IsUUID()
  examId: string;
  
  @IsString()
  @MinLength(3)
  name: string;
  
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;
  
  @IsNumber()
  @Min(0.5)
  @Max(8)
  estimatedHours: number;
  
  @IsDateString()
  classDate: string;
  
  @IsOptional()
  @IsString()
  notes?: string;
}
```

### Sequence Diagram

```
User          Controller        Service         Repository      EventEmitter
 │                │                │                │                │
 │ POST /topics   │                │                │                │
 │───────────────▶│                │                │                │
 │                │ create(dto)    │                │                │
 │                │───────────────▶│                │                │
 │                │                │ findExam()     │                │
 │                │                │───────────────▶│                │
 │                │                │◀───────────────│                │
 │                │                │                │                │
 │                │                │ createTopic()  │                │
 │                │                │───────────────▶│                │
 │                │                │◀───────────────│                │
 │                │                │                │                │
 │                │                │ generate()     │                │
 │                │                │ [Strategy]     │                │
 │                │                │                │                │
 │                │                │ addSessions()  │                │
 │                │                │───────────────▶│                │
 │                │                │◀───────────────│                │
 │                │                │                │                │
 │                │                │ emit(TopicCreated)              │
 │                │                │───────────────────────────────▶│
 │                │                │                │                │
 │                │◀───────────────│                │                │
 │◀───────────────│                │                │                │
 │   201 Created  │                │                │                │
```

---

## 5.4 UC-006: Generate Sessions (Core Algorithm)

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-006 |
| **Priority** | P0 |
| **Module** | Study/Scheduling |
| **Complexity** | 🟠 High |
| **Status** | ✅ Completado |
| **Actor** | System (triggered by UC-005) |

### Business Rules

```typescript
// ============================================
// SPACED REPETITION INTERVALS
// ============================================

// Forward Mode (from class date)
const FORWARD_INTERVALS = {
  EASY:   [1, 5, 12, 25],           // 4 sessions
  MEDIUM: [1, 3, 7, 14, 30],        // 5 sessions
  HARD:   [1, 2, 4, 8, 15, 25]      // 6 sessions
};

// Countdown Mode (days BEFORE exam)
const COUNTDOWN_INTERVALS = {
  EASY:   [30, 20, 12, 5],          // 4 sessions
  MEDIUM: [35, 24, 17, 10, 5],      // 5 sessions
  HARD:   [35, 25, 18, 12, 7, 3]    // 6 sessions
};

// Duration reduction factors
const DURATION_FACTORS = [0.60, 0.35, 0.30, 0.25, 0.20, 0.20];

// ============================================
// PRIORITY CALCULATION
// ============================================

function calculatePriorityScore(params: {
  daysUntilExam: number;
  difficulty: DifficultyLevel;
  sessionNumber: number;
  daysUntilSession: number;
}): number {
  let score = 0;
  
  // Urgency factor (0-40)
  if (params.daysUntilExam <= 7) score += 40;
  else if (params.daysUntilExam <= 14) score += 35;
  else if (params.daysUntilExam <= 21) score += 25;
  else if (params.daysUntilExam <= 30) score += 15;
  else score += 10;
  
  // Difficulty factor (10-30)
  const difficultyMap = { EASY: 10, MEDIUM: 20, HARD: 30 };
  score += difficultyMap[params.difficulty];
  
  // Session number factor (5-20)
  score += Math.max(5, 22 - params.sessionNumber * 2);
  
  // Proximity factor (2-12)
  if (params.daysUntilSession <= 0) score += 12;
  else if (params.daysUntilSession <= 2) score += 10;
  else if (params.daysUntilSession <= 5) score += 7;
  else score += 2;
  
  return score;
}

// Priority levels
// >= 85: CRITICAL 🔴
// >= 70: URGENT 🟠
// >= 50: IMPORTANT 🟡
// >= 30: NORMAL 🟢
// < 30: LOW ⚪

// ============================================
// SLOT FINDING ALGORITHM
// ============================================

const ENERGY_CURVE = {
  6: 0.4, 7: 0.5, 8: 0.6, 9: 0.75, 10: 0.9, 11: 1.0,
  12: 0.7, 13: 0.6, 14: 0.5,
  15: 0.7, 16: 0.9, 17: 1.0, 18: 0.95, 19: 0.85,
  20: 0.7, 21: 0.6, 22: 0.4, 23: 0.3
};

const PREFERRED_SLOTS = [
  { start: 15, end: 19, priority: 1 },  // Afternoon (preferred)
  { start: 9, end: 12, priority: 2 },   // Morning
  { start: 20, end: 22, priority: 3 }   // Night
];

// Skip Sundays
const BLOCKED_DAYS = [0]; // 0 = Sunday
```

### Implementation

```typescript
// session-generator.service.ts
@Injectable()
export class SessionGeneratorService {
  constructor(
    private readonly slotFinder: SlotFinderService,
    private readonly priorityCalculator: PriorityCalculatorService,
    private readonly calendarService: CalendarService
  ) {}
  
  async generateForTopic(
    topic: Topic,
    exam: Exam,
    strategy: ISessionGeneratorStrategy
  ): Promise<Session[]> {
    // Generate base sessions from strategy
    const baseSessions = strategy.generate(topic, exam);
    
    // Find optimal slots for each session
    const sessionsWithSlots: Session[] = [];
    
    for (const session of baseSessions) {
      // Get existing events for that day
      const existingEvents = await this.calendarService.getEventsForDate(
        topic.userId,
        session.scheduledDate
      );
      
      // Find best slot
      const slots = this.slotFinder.findAvailableSlots(
        session.scheduledDate,
        session.durationMinutes,
        existingEvents
      );
      
      if (slots.length > 0) {
        session.scheduledTime = slots[0];
      }
      
      // Calculate priority
      session.priority = this.priorityCalculator.calculate(
        session.scheduledDate,
        exam.date,
        topic.difficulty,
        session.number
      );
      
      sessionsWithSlots.push(session);
    }
    
    return sessionsWithSlots;
  }
}

// forward-session.strategy.ts
@Injectable()
export class ForwardSessionStrategy implements ISessionGeneratorStrategy {
  private readonly INTERVALS: Record<DifficultyLevel, number[]> = {
    EASY: [1, 5, 12, 25],
    MEDIUM: [1, 3, 7, 14, 30],
    HARD: [1, 2, 4, 8, 15, 25]
  };
  
  private readonly DURATION_FACTORS = [0.60, 0.35, 0.30, 0.25, 0.20, 0.20];
  
  generate(topic: Topic, exam: Exam): Session[] {
    const intervals = this.INTERVALS[topic.difficulty];
    const sessions: Session[] = [];
    
    for (let i = 0; i < intervals.length; i++) {
      const sessionDate = addDays(topic.classDate, intervals[i]);
      
      // Don't schedule after exam
      if (sessionDate >= exam.date) continue;
      
      // Skip blocked days (Sunday)
      if (sessionDate.getDay() === 0) {
        sessionDate.setDate(sessionDate.getDate() + 1);
      }
      
      const durationMinutes = Math.round(
        topic.estimatedHours * 60 * this.DURATION_FACTORS[i]
      );
      
      sessions.push(
        Session.create({
          topicId: topic.id,
          number: i + 1,
          scheduledDate: sessionDate,
          durationMinutes,
          status: SessionStatus.PENDING
        })
      );
    }
    
    return sessions;
  }
}
```

---

## 5.5 UC-008: Track Session Completion

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-008 |
| **Priority** | P1 |
| **Module** | Study |
| **Complexity** | ⬜ Low |
| **Status** | ⏳ En Progreso |
| **Actor** | Authenticated User |
| **Side Effects** | Gamification update, Analytics |

### API Endpoint

```http
PATCH /api/v1/sessions/{id}/complete

Headers:
  Authorization: Bearer {token}

Request:
{
  "completed": true,
  "notes": "Revisé todos los ejercicios"
}

Response 200:
{
  "session": {
    "id": "uuid",
    "status": "COMPLETED",
    "completedAt": "2026-01-21T16:30:00Z"
  },
  "stats": {
    "currentStreak": 5,
    "pointsEarned": 10,
    "totalPointsToday": 30
  }
}
```

### Implementation

```typescript
// sessions.service.ts
@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly eventEmitter: EventEmitter2
  ) {}
  
  async markComplete(
    userId: string,
    sessionId: string,
    dto: CompleteSessionDto
  ): Promise<CompleteSessionResponse> {
    const session = await this.sessionsRepository.findById(sessionId);
    
    if (!session || session.topic.userId !== userId) {
      throw new NotFoundException('Session not found');
    }
    
    if (!session.status.canTransitionTo(SessionStatusValue.COMPLETED)) {
      throw new BadRequestException('Session cannot be completed');
    }
    
    // Update session
    session.markCompleted();
    if (dto.notes) session.notes = dto.notes;
    
    await this.sessionsRepository.save(session);
    
    // Emit event for side effects
    this.eventEmitter.emit('session.completed', new SessionCompletedEvent(
      session.id,
      session.topicId,
      userId
    ));
    
    return {
      session,
      stats: await this.getUpdatedStats(userId)
    };
  }
  
  async markIncomplete(
    userId: string,
    sessionId: string
  ): Promise<MarkIncompleteResponse> {
    const session = await this.sessionsRepository.findById(sessionId);
    
    if (!session || session.topic.userId !== userId) {
      throw new NotFoundException('Session not found');
    }
    
    session.markIncomplete();
    session.attempts += 1;
    
    await this.sessionsRepository.save(session);
    
    // Emit event
    this.eventEmitter.emit('session.missed', new SessionMissedEvent(
      session.id,
      session.topicId,
      userId,
      session.attempts
    ));
    
    // Check if can reschedule
    const canReschedule = session.attempts < 2;
    
    return {
      session,
      canReschedule,
      rescheduleOptions: canReschedule 
        ? await this.getRescheduleOptions(session)
        : []
    };
  }
}
```

### State Transitions

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        [completed]              [not completed]
              │                         │
              ▼                         ▼
       ┌────────────┐           ┌─────────────┐
       │ COMPLETED  │           │ INCOMPLETE  │
       └────────────┘           └──────┬──────┘
                                       │
                           ┌───────────┴───────────┐
                           │                       │
                  [reschedule]            [attempts >= 2]
                           │                       │
                           ▼                       ▼
                   ┌─────────────┐         ┌────────────┐
                   │ RESCHEDULED │         │ ABANDONED  │
                   └──────┬──────┘         └────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
        [completed]           [not completed]
              │                       │
              ▼                       ▼
       ┌────────────┐         ┌────────────┐
       │ COMPLETED  │         │ ABANDONED  │
       └────────────┘         └────────────┘
```

---

## 5.6 UC-010: Free Study Mode

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-010 |
| **Priority** | P1 |
| **Module** | Study |
| **Complexity** | 🟡 Medium |
| **Status** | ✅ Completado |
| **Actor** | Authenticated User |

### User Story

```
AS A student preparing for a final exam
I WANT TO plan study sessions for topics without a previous class
SO THAT I can study for finals efficiently with countdown scheduling
```

### API Endpoint

```http
POST /api/v1/topics/free-study

Headers:
  Authorization: Bearer {token}

Request:
{
  "subjectId": "uuid-subject",
  "examId": "uuid-exam",
  "name": "Integrales Definidas",
  "difficulty": "HARD",
  "estimatedHours": 2.5,
  "examDate": "2026-02-15"
}

Response 201:
{
  "topic": {
    "id": "uuid-topic",
    "name": "Integrales Definidas",
    "difficulty": "HARD",
    "origin": "FREE_STUDY",
    "status": "ACTIVE"
  },
  "sessions": [
    {
      "id": "uuid-1",
      "number": 1,
      "scheduledDate": "2026-01-11",
      "durationMinutes": 150,
      "priority": "NORMAL"
    },
    {
      "id": "uuid-2",
      "number": 2,
      "scheduledDate": "2026-01-21",
      "durationMinutes": 90,
      "priority": "NORMAL"
    },
    // ...countdown sessions
  ],
  "message": "Free study topic created with 6 sessions before exam"
}
```

### Implementation

```typescript
// countdown-session.strategy.ts
@Injectable()
export class CountdownSessionStrategy implements ISessionGeneratorStrategy {
  private readonly INTERVALS: Record<DifficultyLevel, number[]> = {
    // Days BEFORE exam date
    EASY: [30, 20, 12, 5],
    MEDIUM: [35, 24, 17, 10, 5],
    HARD: [35, 25, 18, 12, 7, 3]
  };
  
  private readonly DURATION_FACTORS = [1.00, 0.60, 0.40, 0.35, 0.30, 0.25];
  
  generate(topic: Topic, exam: Exam): Session[] {
    const intervals = this.INTERVALS[topic.difficulty];
    const sessions: Session[] = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < intervals.length; i++) {
      const sessionDate = subDays(exam.date, intervals[i]);
      
      // Skip if session would be in the past
      if (sessionDate < today) continue;
      
      // Skip Sundays
      if (sessionDate.getDay() === 0) {
        sessionDate.setDate(sessionDate.getDate() - 1); // Move to Saturday
      }
      
      const durationMinutes = Math.round(
        topic.estimatedHours * 60 * this.DURATION_FACTORS[i]
      );
      
      sessions.push(
        Session.create({
          topicId: topic.id,
          number: i + 1,
          scheduledDate: sessionDate,
          durationMinutes,
          status: SessionStatus.PENDING
        })
      );
    }
    
    return sessions;
  }
}

// topics.service.ts (additional method)
async createFreeStudy(
  userId: string,
  dto: CreateFreeStudyDto
): Promise<CreateTopicResponse> {
  const exam = await this.examsRepository.findById(dto.examId);
  
  if (!exam || exam.subject.userId !== userId) {
    throw new ForbiddenException('Invalid exam');
  }
  
  // Validate minimum time before exam
  const daysUntilExam = differenceInDays(exam.date, new Date());
  if (daysUntilExam < 14) {
    throw new BadRequestException(
      'Need at least 2 weeks before exam for free study mode'
    );
  }
  
  const topic = await this.topicsRepository.create({
    ...dto,
    origin: TopicOrigin.FREE_STUDY,
    status: TopicStatus.ACTIVE
  });
  
  // Use Countdown strategy
  const strategy = new CountdownSessionStrategy();
  const sessions = await this.sessionGenerator.generateForTopic(
    topic,
    exam,
    strategy
  );
  
  await this.topicsRepository.addSessions(topic.id, sessions);
  
  return {
    topic,
    sessions,
    message: `Free study topic created with ${sessions.length} sessions before exam`
  };
}
```

---

## 5.7 UC-013: Track Streaks (Gamification)

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-013 |
| **Priority** | P2 |
| **Module** | Gamification |
| **Complexity** | 🟡 Medium |
| **Status** | ⏳ Pendiente |
| **Actor** | System (event-driven) |

### Business Rules

```typescript
// Streak Rules
// - A streak is consecutive days with at least 1 completed session
// - Streak resets if a day passes with 0 completions
// - Streak is calculated at end of each day (or on completion)

// Points System
const POINTS = {
  SESSION_COMPLETED: 10,
  SESSION_CRITICAL_COMPLETED: 20,  // 2x for critical priority
  STREAK_MILESTONE_7: 50,          // 7 days streak
  STREAK_MILESTONE_30: 200,        // 30 days streak
  FIRST_SESSION_OF_DAY: 5          // Bonus
};

// Levels
const LEVELS = [
  { level: 1, minPoints: 0, name: 'Novato' },
  { level: 2, minPoints: 100, name: 'Aprendiz' },
  { level: 3, minPoints: 300, name: 'Estudiante' },
  { level: 4, minPoints: 600, name: 'Dedicado' },
  { level: 5, minPoints: 1000, name: 'Experto' },
  { level: 6, minPoints: 2000, name: 'Maestro' },
  { level: 7, minPoints: 5000, name: 'Leyenda' }
];
```

### Implementation

```typescript
// gamification.service.ts
@Injectable()
export class GamificationService {
  constructor(
    private readonly userStatsRepository: UserStatsRepository,
    private readonly eventEmitter: EventEmitter2
  ) {}
  
  @OnEvent('session.completed')
  async handleSessionCompleted(event: SessionCompletedEvent): Promise<void> {
    const stats = await this.userStatsRepository.findByUserId(event.userId);
    
    // Calculate points
    let points = POINTS.SESSION_COMPLETED;
    
    if (event.priority === PriorityLevel.CRITICAL) {
      points = POINTS.SESSION_CRITICAL_COMPLETED;
    }
    
    // Check if first session of day
    const todayCompletions = await this.getTodayCompletions(event.userId);
    if (todayCompletions === 1) {
      points += POINTS.FIRST_SESSION_OF_DAY;
    }
    
    // Update streak
    const newStreak = await this.updateStreak(event.userId);
    
    // Check milestones
    if (newStreak === 7) points += POINTS.STREAK_MILESTONE_7;
    if (newStreak === 30) points += POINTS.STREAK_MILESTONE_30;
    
    // Update stats
    stats.points += points;
    stats.currentStreak = newStreak;
    stats.longestStreak = Math.max(stats.longestStreak, newStreak);
    stats.level = this.calculateLevel(stats.points);
    
    await this.userStatsRepository.save(stats);
    
    // Emit streak event
    this.eventEmitter.emit('streak.updated', new StreakUpdatedEvent(
      event.userId,
      newStreak,
      stats.longestStreak
    ));
  }
  
  private async updateStreak(userId: string): Promise<number> {
    const stats = await this.userStatsRepository.findByUserId(userId);
    const today = startOfDay(new Date());
    const lastActivity = startOfDay(stats.lastActivityDate);
    
    const daysDiff = differenceInDays(today, lastActivity);
    
    if (daysDiff === 0) {
      // Same day, streak unchanged
      return stats.currentStreak;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      return stats.currentStreak + 1;
    } else {
      // Gap, reset streak
      return 1;
    }
  }
  
  private calculateLevel(points: number): number {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].minPoints) {
        return LEVELS[i].level;
      }
    }
    return 1;
  }
}
```

### API: Get User Stats

```http
GET /api/v1/gamification/stats

Response 200:
{
  "points": 450,
  "level": 3,
  "levelName": "Estudiante",
  "nextLevelAt": 600,
  "currentStreak": 5,
  "longestStreak": 12,
  "completedToday": 3,
  "completedThisWeek": 18,
  "achievements": [
    { "type": "FIRST_SESSION", "earnedAt": "2026-01-15" },
    { "type": "STREAK_7", "earnedAt": "2026-01-20" }
  ]
}
```

---

## 5.11 UC-016: User Logout

### Description
Permite al usuario cerrar sesión de forma segura, limpiando cookies y redirigiendo al login.

### Actors
- **Estudiante**: Usuario autenticado

### Preconditions
- Usuario está logueado
- Está en cualquier página del dashboard

### Flow
1. Usuario hace click en su email en el navbar
2. Se abre menú desplegable
3. Usuario hace click en "Cerrar Sesión"
4. Sistema cierra sesión en Supabase
5. Sistema limpia cookies de autenticación
6. Sistema redirige a `/login`

### Postconditions
- Usuario deslogueado
- Cookies limpiadas
- Redirigido a login

### UI Components
- `UserMenu` component con dropdown
- Botón "Cerrar Sesión" en dropdown

### Technical Implementation
```typescript
// src/lib/actions/auth.ts
export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
```

### Status
✅ Completado

---

## 5.12 UC-017: View/Edit Profile

### Description
Permite al usuario ver y editar su información personal (nombre).

### Actors
- **Estudiante**: Usuario autenticado

### Preconditions
- Usuario está logueado

### Flow
1. Usuario hace click en su email → menú desplegable
2. Usuario hace click en "Mi Perfil"
3. Sistema navega a `/dashboard/profile`
4. Sistema muestra:
   - Email (read-only)
   - Nombre (editable)
5. Usuario modifica nombre
6. Usuario hace click en "Guardar Cambios"
7. Sistema actualiza `user_metadata.name` en Supabase Auth
8. Sistema muestra mensaje de éxito

### Postconditions
- Nombre actualizado
- Navbar refleja nuevo nombre

### UI Components
- Página: `/dashboard/profile`
- Form con input de nombre
- Email disabled (no editable)

### Status
✅ Completado

---

## 5.13 UC-018: Change Password

### Description
Permite al usuario cambiar su contraseña de forma segura.

### Actors
- **Estudiante**: Usuario autenticado

### Preconditions
- Usuario está logueado
- Usuario está en `/dashboard/profile`

### Flow
1. Usuario ingresa nueva contraseña
2. Usuario confirma contraseña
3. Sistema valida:
   - Ambas contraseñas coinciden
   - Mínimo 6 caracteres
4. Usuario hace click en "Cambiar Contraseña"
5. Sistema actualiza contraseña en Supabase Auth
6. Sistema muestra mensaje de éxito

### Postconditions
- Contraseña actualizada
- Usuario sigue logueado (no requiere re-login)

### Validations
- `newPassword === confirmPassword`
- `newPassword.length >= 6`

### Status
✅ Completado

---

## 5.14 UC-019: Delete Account

### Description
Permite al usuario eliminar permanentemente su cuenta y todos sus datos.

### Actors
- **Estudiante**: Usuario autenticado

### Preconditions
- Usuario está logueado
- Usuario está en `/dashboard/profile`

### Flow
1. Usuario hace click en "Eliminar Cuenta Permanentemente"
2. Sistema muestra confirmación con lista de datos a eliminar
3. Usuario confirma con window.confirm
4. Sistema solicita escribir "ELIMINAR"
5. Usuario escribe "ELIMINAR" exactamente
6. Sistema elimina:
   - Usuario de `public.users` (cascade elimina todo)
7. Sistema cierra sesión
8. Sistema redirige a `/login`

### Postconditions
- Usuario y todos sus datos eliminados permanentemente
- No puede recuperarse

### Validations
- Doble confirmación (confirm + prompt "ELIMINAR")
- Confirmación exacta (case-sensitive)

### Database Cascade
```sql
-- La eliminación en public.users dispara CASCADE en:
subjects -> topics -> sessions
        -> exams
user_stats
```

### Status
✅ Completado

---

## 5.15 UC-020: View/Manage Sessions

### Description
Permite al usuario ver y gestionar todas sus sesiones de estudio programadas en los próximos 7 días, con filtros y acciones completas.

### Actors
- **Estudiante**: Usuario autenticado

### Preconditions
- Usuario está logueado
- Existen temas creados con sesiones generadas

### Flow
1. Usuario hace click en "Sesiones" en el navbar
2. Sistema navega a `/dashboard/sessions`
3. Sistema carga sesiones de próximos 7 días
4. Sistema muestra:
   - Stats rápidas (pendientes/total)
   - Filtros (Estado, Prioridad, Materia)
   - Lista de sesiones agrupadas por día
5. Usuario puede:
   - Filtrar sesiones
   - Marcar como completada (✓)
   - Reagendar sesión (🔄)
   - Eliminar sesión (🗑️)
6. Sistema actualiza estado y revalida cache

### Postconditions
- Sesiones visualizadas
- Estados actualizados en DB
- Dashboard refleja cambios

### UI Components
- Página: `/dashboard/sessions`
- `SessionCard`: Card con badges de prioridad/estado
- `SessionFilters`: 3 selects (Estado, Prioridad, Materia)
- `SessionList`: Lista agrupada por día
- `RescheduleDialog`: Modal para cambiar fecha

### Filtros Disponibles

**Por Estado:**
- Todas
- Pendientes
- Completadas
- Reagendadas
- Abandonadas

**Por Prioridad:**
- Todas
- Crítico
- Urgente
- Importante
- Normal
- Baja

**Por Materia:**
- Todas
- [Lista de materias del usuario]

### Acciones por Sesión

| Acción | Estado Requerido | Resultado |
|--------|------------------|-----------|
| ✓ Completar | PENDING | status = COMPLETED |
| ↩️ Marcar Incompleta | COMPLETED | status = PENDING |
| 🔄 Reagendar | PENDING | scheduled_at = nueva fecha, attempts++ |
| 🗑️ Eliminar | Cualquiera | Delete de DB |

### Technical Implementation

```typescript
// src/lib/actions/sessions.ts
export async function getUpcomingSessions(days = 7) {
  // Query sesiones próximos N días
  // Join con topic + subject + exam
  // Order by scheduled_at
}

export async function updateSessionStatus(id: string, status: SessionStatus) {
  // Update status + updated_at
  // Revalidate paths
}

export async function rescheduleSession(id: string, newDate: string) {
  // Update scheduled_at
  // Increment attempts
  // Set status = RESCHEDULED
}
```

### UI Layout

```
Sesiones de Estudio
───────────────────────────────

Próximos 7 días:  5 / 10 sesiones
✅ 3 completadas  🔄 2 reagendadas

Filtros:
[Estado ▼] [Prioridad ▼] [Materia ▼]

─── Hoy (27 Ene) ───

┌──────────────────────────────┐
│ 🔴 CRÍTICO    ⏰ PENDIENTE   │
│ 📚 Análisis                  │
│ 📝 Integrales - R2           │
│ 📅 15:00hs  ⏱️ 45min         │
│ [✓][🔄][🗑️]                 │
└──────────────────────────────┘

─── Mañana (28 Ene) ───

[SessionCard...]
```

### Status
✅ Completado

---

## 5.16 UC-020: View/Manage Sessions (Expanded)

### Description
Vista dedicada para gestionar sesiones de estudio de los próximos 7 días con filtros múltiples y acciones completas.

### Actors
- **Estudiante**: Usuario autenticado

### Preconditions
- Usuario está logueado
- Existen sesiones generadas

### Main Flow
1. Usuario hace click en "Sesiones" en navbar
2. Sistema navega a `/dashboard/sessions`
3. Sistema carga sesiones próximos 7 días
4. Sistema muestra resumen: X pendientes / Y total
5. Usuario puede aplicar filtros:
   - Por estado (Pendiente, Completada, etc)
   - Por prioridad (Crítico, Urgente, etc)
   - Por materia
6. Usuario visualiza sesiones agrupadas por día
7. Usuario puede realizar acciones:
   - Marcar completada
   - Reagendar (con modal datetime picker)
   - Eliminar

### Alternative Flows

**4a. Reagendar Sesión:**
1. Usuario click en "Reagendar"
2. Sistema abre modal con info de la sesión
3. Sistema muestra warning si attempts >= 2
4. Usuario selecciona nueva fecha/hora
5. Usuario confirma
6. Sistema actualiza scheduled_at e incrementa attempts
7. Sistema marca status = RESCHEDULED

**4b. Marcar Completada:**
1. Usuario click en "Completar"
2. Sistema actualiza status = COMPLETED
3. Sistema refresca vista

**4c. Eliminar Sesión:**
1. Usuario click en eliminar
2. Sistema pide confirmación
3. Usuario confirma
4. Sistema elimina de DB
5. Sistema refresca vista

### Postconditions
- Sesiones visualizadas correctamente
- Estados actualizados
- Dashboard refleja cambios

### Business Rules
- Solo sesiones de próximos 7 días
- Agrupación por día (Hoy, Mañana, Fecha)
- Ordenamiento: fecha + prioridad
- attempts se incrementa en cada reagendado
- Warning si attempts >= 2

### UI Layout

```
╔═══════════════════════════════════════╗
║ Sesiones de Estudio                   ║
║ Próximos 7 días: 5/10 sesiones        ║
║ ✅ 3 completadas  🔄 2 reagendadas     ║
╠═══════════════════════════════════════╣
║ Filtros:                              ║
║ [Estado▼] [Prioridad▼] [Materia▼]    ║
╠═══════════════════════════════════════╣
║ ── Hoy (27 Ene) ──                    ║
║                                       ║
║ ┌─────────────────────────────────┐   ║
║ │ 🔴 CRÍTICO    ⏰ PENDIENTE      │   ║
║ │ 📚 Análisis                     │   ║
║ │ 📝 Integrales - R2              │   ║
║ │ 📅 15:00hs  ⏱️ 45min            │   ║
║ │ [✓ Completar][🔄][🗑️]          │   ║
║ └─────────────────────────────────┘   ║
║                                       ║
║ ── Mañana (28 Ene) ──                 ║
║ [SessionCard...]                      ║
╚═══════════════════════════════════════╝
```

### Technical Implementation

**Server Actions** (`src/lib/actions/sessions.ts`):
```typescript
export async function getUpcomingSessions(days = 7)
export async function updateSessionStatus(id, status)
export async function rescheduleSession(id, newDate)
export async function deleteSession(id)
```

**Components**:
- `SessionCard`: Card con badges y acciones
- `SessionFilters`: 3 selects para filtrar
- `SessionList`: Lista agrupada por día
- `RescheduleDialog`: Modal para cambiar fecha

**Page**: `/dashboard/sessions`

### Integration Points

1. **Navbar**: Link directo "Sesiones"
2. **Dashboard**: Link "Ver todas las sesiones →"
3. **SessionList**: Reusable en dashboard (hoy) y sessions page (7 días)

### Status
✅ Completado

---

## 5.16 UC-012: Send Notifications

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-012 |
| **Priority** | P1 |
| **Module** | Notification |
| **Complexity** | 🟡 Medium |
| **Status** | ⏳ En Progreso |
| **Actor** | System (event-driven) |

### User Story

```
AS A student
I WANT TO receive reminders about my study sessions
SO THAT I don't forget to study and stay on track
```

### Notification Types

| Type | Trigger | Channels | Example |
|------|---------|----------|---------|
| `SESSION_REMINDER` | Sesión programada para hoy | In-App, Email, Telegram | "Hoy tenés 3 sesiones de estudio" |
| `EXAM_APPROACHING` | Examen en 7/3/1 días | In-App, Email, Telegram | "Final de Análisis en 3 días" |
| `STREAK_WARNING` | Día sin sesiones completadas | In-App, Telegram | "Tu racha de 5 días está en riesgo" |
| `ACHIEVEMENT_UNLOCKED` | Nuevo logro desbloqueado | In-App | "Has alcanzado el nivel 'Dedicado'" |
| `SESSION_RESCHEDULED` | Sesión reagendada | In-App | "Tu sesión se movió al 15/02" |
| `GENERAL` | Manual/Admin | In-App, Email | Mensajes del sistema |

### Notification Channels

#### 1. In-App (Base Implementation)
- Se guarda en tabla `notifications` en Supabase.
- Visible en dropdown desde Navbar (campana).
- Marca como leída con click.
- Estado: **Implementar**.

#### 2. Email (Preparado, no implementado)
- Resumen diario a la hora configurada (default 08:00).
- Provider recomendado: Resend (fácil integración).
- Estado: **Stub (infraestructura lista, envío no implementado)**.

#### 3. Telegram (Preparado, no implementado)
- Notificaciones instantáneas vía Bot.
- Requiere Bot Token y Chat ID del usuario.
- Estado: **Stub (infraestructura lista, envío no implementado)**.

### Data Model

#### tabla `notifications` (ya existe)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### tabla `user_settings` (nueva)
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  telegram_notifications BOOLEAN DEFAULT FALSE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  daily_summary_time TIME DEFAULT '08:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Implementation

#### Notification Service (Facade Pattern)

```typescript
// src/lib/services/notifications/notification.service.ts
export class NotificationService {
  private channels: Map<string, INotificationChannel>;

  constructor() {
    this.channels = new Map([
      ['in-app', new InAppChannel()],
      ['email', new EmailChannel()],
      ['telegram', new TelegramChannel()],
    ]);
  }

  async send(notification: NotificationPayload) {
    const settings = await this.getUserSettings(notification.userId);
    
    const activeChannels: string[] = [];
    if (settings.in_app_notifications) activeChannels.push('in-app');
    if (settings.email_notifications) activeChannels.push('email');
    if (settings.telegram_notifications) activeChannels.push('telegram');

    const results = await Promise.allSettled(
      activeChannels.map(channelName => 
        this.channels.get(channelName)?.send(notification)
      )
    );

    return results;
  }
}
```

#### Channel Interface

```typescript
// src/lib/services/notifications/channels/notification-channel.interface.ts
export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface INotificationChannel {
  send(notification: NotificationPayload): Promise<void>;
}
```

#### In-App Channel (Full Implementation)

```typescript
// src/lib/services/notifications/channels/in-app.channel.ts
export class InAppChannel implements INotificationChannel {
  async send(notification: NotificationPayload): Promise<void> {
    const supabase = createClient();
    
    await supabase.from('notifications').insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      read: false,
    });
  }
}
```

#### Email Channel (Stub)

```typescript
// src/lib/services/notifications/channels/email.channel.ts
export class EmailChannel implements INotificationChannel {
  async send(notification: NotificationPayload): Promise<void> {
    // TODO: Implementar con Resend
    console.log('[EMAIL] Sending notification:', notification.title);
    console.log('[EMAIL] To:', notification.userId);
    // await resend.emails.send({ ... });
  }
}
```

#### Telegram Channel (Stub)

```typescript
// src/lib/services/notifications/channels/telegram.channel.ts
export class TelegramChannel implements INotificationChannel {
  async send(notification: NotificationPayload): Promise<void> {
    // TODO: Implementar con Bot API
    console.log('[TELEGRAM] Sending notification:', notification.title);
    console.log('[TELEGRAM] Chat ID:', notification.userId);
    // await fetch(`https://api.telegram.org/bot${token}/sendMessage`, ...);
  }
}
```

### Triggers (Event-Driven)

Las notificaciones se disparan automáticamente cuando ocurren eventos:

```typescript
// Ejemplo: Al crear una sesión
async function generateSessionsForTopic(topic: Topic) {
  const sessions = await sessionGenerator.generate(topic);
  await saveSessions(sessions);
  
  // Trigger notification
  await notificationService.send({
    userId: topic.user_id,
    type: 'SESSION_REMINDER',
    title: 'Nuevas sesiones generadas',
    message: `Se crearon ${sessions.length} sesiones para "${topic.name}"`,
    metadata: { topic_id: topic.id }
  });
}
```

### API Endpoints

```http
GET /api/v1/notifications
Response 200:
{
  "notifications": [
    {
      "id": "uuid",
      "type": "SESSION_REMINDER",
      "title": "Hoy tenés 3 sesiones",
      "message": "Sesiones de Análisis, Algebra y Diseño",
      "read": false,
      "created_at": "2026-01-30T08:00:00Z"
    }
  ],
  "unreadCount": 5
}

PATCH /api/v1/notifications/:id/read
Response 200: { success: true }

GET /api/v1/settings/notifications
Response 200:
{
  "email_notifications": true,
  "telegram_notifications": false,
  "in_app_notifications": true,
  "daily_summary_time": "08:00"
}

PATCH /api/v1/settings/notifications
Request:
{
  "email_notifications": false,
  "telegram_notifications": true
}
Response 200: { success: true }
```

### UI Components

#### Notification Bell (Navbar)

```tsx
export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg">
          <NotificationList notifications={notifications} />
        </div>
      )}
    </div>
  );
}
```

### Status
⏳ En Progreso

---

## 5.17 UC-021: Manage Availability (Time Blocking)

### Description
Permite al usuario definir manualmente sus franjas horarias disponibles para estudio, para que el generador de sesiones no asigne tareas en horarios ocupados (trabajo, clases, sueño).

### Actors
- **Estudiante**: Usuario autenticado

### Preconditions
- Usuario está logueado

### Flow
1. Usuario va a "Configuración" -> "Disponibilidad"
2. Sistema muestra un calendario semanal vacío (Lun-Dom)
3. Usuario puede:
   - Crear bloques de "Tiempo de Estudio" (verde)
   - Crear bloques de "Ocupado" (rojo) - opcional, por defecto todo es ocupado salvo lo verde
   - O definir "Horario Laboral/Clases" y el resto es libre
4. Usuario define, por ejemplo:
   - Lun-Vie: 18:00 - 22:00 (Estudio)
   - Sáb: 10:00 - 14:00 (Estudio)
5. Usuario guarda configuración
6. Sistema almacena las franjas horarias en `user_availability`

### Postconditions
- Las futuras sesiones generadas (UC-006) respetarán estos horarios.
- Si no hay hueco disponible en el día ideal, se moverá al siguiente hueco válido.

### Future Extension (v1.5)
- Integración con Google Calendar para bloquear automáticamente huecos ocupados por eventos externos.

### Data Model
```typescript
interface TimeBlock {
  dayOfWeek: number; // 0-6
  startTime: string; // "18:00"
  endTime: string;   // "22:00"
  type: 'STUDY' | 'BUSY';
}
```

### Status
⏳ Pendiente

---

_Última actualización: Enero 2026_
