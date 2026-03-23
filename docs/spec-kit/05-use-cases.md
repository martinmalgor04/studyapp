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
| UC-008 | Track Session Completion | Study | ⬜ Low | ✅ Completado | 🟢 Implementado |
| UC-009 | Reschedule Session | Study | 🟡 Medium | ✅ Completado | 🟢 Implementado |
| UC-010 | Free Study Mode | Study | 🟡 Medium | ✅ Completado | 🟢 Incluido en UC-006 |
| UC-011 | Google Calendar Integration | Calendar | 🟠 High | 🟡 ~90% | 🟡 Casi completo |
| UC-011a | Export Sessions to Google Calendar | Calendar | 🟡 Medium | ✅ Completado | 🟢 Implementado |
| UC-011b | Import Availability from Google Calendar | Calendar | 🟠 High | 🟡 Backend ✅ | 🟡 Falta UI preview |
| UC-011c | Detect Schedule Conflicts | Calendar | 🟠 High | 🟡 Backend ✅ | 🟡 Falta UI badges |
| UC-011d | Sync Session Updates | Calendar | 🟡 Medium | 🟡 Handler ✅ | 🟡 Falta activar emit |
| UC-012 | Send Notifications | Notification | 🟡 Medium | ✅ Completado | 🟢 Implementado |

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
| **Status** | ✅ Completado |
| **Actor** | Authenticated User |
| **Side Effects** | Gamification hooks preparados (OCP), Analytics |

### Features Implementadas

1. **Completion Rating**: Modal con opciones Fácil/Normal/Difícil al completar sesiones
2. **Timer Pomodoro**: Contador de 25min + 5min descanso con visualización circular
3. **Study Mode**: Modal fullscreen con timer integrado
4. **Estado INCOMPLETE**: Para sesiones parcialmente completadas con opción de reagendar el tiempo restante
5. **Auto-Abandono**: Sesiones vencidas > 48hs se marcan automáticamente como ABANDONED
6. **Notificaciones**: Alertas para sesiones vencidas > 24hs
7. **Event System**: Arquitectura extensible (OCP) para gamificación futura

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

## 5.7 UC-011: Google Calendar Integration (Parent Use Case)

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-011 |
| **Priority** | P1 |
| **Module** | Calendar |
| **Complexity** | 🟠 High |
| **Status** | 🟡 ~90% (UC-011a ✅, 011b/c backend ✅, falta UI polish y activar 011d) |
| **Actor** | Authenticated User |

### User Story

```
AS A student with a busy schedule
I WANT StudyApp to sync bidirectionally with my Google Calendar
SO THAT:
- My study sessions appear in Google Calendar alongside other events
- StudyApp knows when I'm busy and avoids conflicts automatically
- Changes in either calendar are reflected in the other
```

### Overview - Sincronización Bilateral Completa

La integración con Google Calendar funciona de forma **bidireccional y continua**:

#### Flujo Bidireccional

```
    ┌──────────────────────────────────────────────────────┐
    │              Google Calendar                          │
    │  (Clases, Reuniones, Eventos personales)            │
    └────────────────┬────────────────▲────────────────────┘
                     │                │
        ①Leer eventos│                │③Exportar sesiones
         (conflictos)│                │  (visibilidad)
                     │                │
                     ▼                │
    ┌──────────────────────────────────────────────────────┐
    │                   StudyApp                            │
    │                                                       │
    │  ②Detecta horarios libres → Genera sesiones         │
    │  ④Actualiza si cambian eventos en Google             │
    └──────────────────────────────────────────────────────┘
```

### Subcasos de Uso

| Sub-UC | Name | Status | Description |
|--------|------|--------|-------------|
| **UC-011a** | Export Sessions to Google Calendar | ✅ Completado | Exporta sesiones pendientes de StudyApp → Google Calendar |
| **UC-011b** | Import Events for Availability | 🟡 Backend ✅ | Lee eventos ocupados → detecta horarios libres automáticamente (falta preview UI) |
| **UC-011c** | Detect Schedule Conflicts | 🟡 Backend ✅ | Verifica conflictos en tiempo real antes de programar sesiones (falta UI badges) |
| **UC-011d** | Continuous Sync | 🟡 Handler ✅ | Mantiene sincronizados cambios bidireccionales (falta activar emit) |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      StudyApp                                │
│                                                               │
│  ┌──────────────┐        ┌──────────────────┐               │
│  │   Sessions   │◄───────┤ Session Generator│               │
│  │   (Local DB) │        └──────────────────┘               │
│  └──────┬───────┘                 │                          │
│         │                          │                          │
│         │ UC-011a: Export          │ UC-011b: Read            │
│         │ (Unidirectional)         │ (Import Free Slots)      │
│         ▼                          ▼                          │
│  ┌─────────────────────────────────────────────┐             │
│  │      GoogleCalendarService                   │             │
│  └─────────────────────────────────────────────┘             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                   OAuth 2.0 │ (Scopes: calendar + calendar.readonly)
                            │
                            ▼
        ┌────────────────────────────────────┐
        │      Google Calendar API            │
        │  - calendar.events (read/write)     │
        │  - calendar.readonly (read all)     │
        └────────────────────────────────────┘
```

### OAuth Scopes Required

| Scope | Purpose | Used By |
|-------|---------|---------|
| `https://www.googleapis.com/auth/calendar.events` | Crear/editar/eliminar eventos | UC-011a, UC-011d |
| `https://www.googleapis.com/auth/calendar.readonly` | Leer todos los eventos del calendario | UC-011b, UC-011c |

**⚠️ IMPORTANTE**: Actualmente solo está implementado el scope `calendar.events`. Para UC-011b y UC-011c se debe agregar `calendar.readonly`.

---

## 5.7.1 UC-011a: Export Sessions to Google Calendar

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-011a |
| **Priority** | P1 |
| **Module** | Calendar |
| **Complexity** | 🟡 Medium |
| **Status** | ✅ Completado |
| **Actor** | Authenticated User |
| **Parent** | UC-011 |

### User Story

```
AS A student
I WANT TO export my study sessions to Google Calendar
SO THAT I can see them alongside my other events
```

### Flow

1. Usuario va a `/dashboard/settings`
2. Usuario hace click en "Conectar Google Calendar"
3. Sistema redirige a OAuth de Google
4. Usuario autoriza permisos (`calendar.events`)
5. Google redirige con authorization code
6. Sistema intercambia code por access_token + refresh_token
7. Sistema guarda tokens en `user_settings`
8. Usuario hace click en "Sincronizar Sesiones"
9. Sistema:
   - Lee todas las sesiones PENDING del usuario
   - Crea un evento en Google Calendar por cada sesión
   - Formato: `{topic.name} - R{session.number}`
   - Horario: `scheduled_at` + `duration` minutos
   - Color: Azul (colorId: 9)
10. Sistema muestra mensaje: "X sesiones sincronizadas"

### API Endpoint

```http
POST /api/v1/calendar/sync
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "synced": 15,
  "errors": 0,
  "message": "15 sesiones sincronizadas exitosamente"
}
```

### Implementation

**Archivo**: `src/lib/services/google-calendar.service.ts`

```typescript
async createEventForSession(
  tokens: GoogleTokens, 
  session: Session
): Promise<string | null> {
  this.oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

  const startDate = new Date(session.scheduled_at);
  const endDate = new Date(startDate.getTime() + session.duration * 60 * 1000);

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `${session.topic.name} - R${session.number}`,
      description: `Materia: ${session.subject.name}\nDuración: ${session.duration}min`,
      start: { dateTime: startDate.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
      end: { dateTime: endDate.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
      colorId: '9', // Azul
    },
  });

  return response.data.id || null;
}
```

### UI Location

- **Settings Page**: `/dashboard/settings`
  - Botón: "Conectar Google Calendar"
  - Estado: Conectado / Desconectado
  - Botón: "Sincronizar Sesiones" (solo si conectado)

### Status

✅ **Completado** - Implementado en commit anterior

---

## 5.7.2 UC-011b: Import Events for Availability

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-011b |
| **Priority** | P1 |
| **Module** | Calendar + Onboarding + Scheduling |
| **Complexity** | 🟠 High |
| **Status** | ✅ Completado (base), 🔄 En refinamiento |
| **Actor** | New User (Onboarding) or Existing User (Settings) |
| **Parent** | UC-011 |

### User Story

```
AS A student with a busy calendar
I WANT StudyApp to read my Google Calendar bidirectionally
SO THAT:
- It automatically detects when I'm free to study
- It avoids scheduling sessions when I have other commitments
- It updates availability when my schedule changes
```

### Problem Solved

**Antes**: 
- Usuario debe configurar manualmente horarios disponibles (Lun-Vie 08-12, 13-17, etc.)
- Si cambia su horario de clases, debe actualizar manualmente
- Sesiones pueden programarse sobre otros eventos (conflictos)

**Después**: 
- StudyApp lee Google Calendar de forma continua
- Detecta eventos ocupados (clases, reuniones, trabajo)
- Genera `availability_slots` automáticamente en horarios libres
- **Se adapta automáticamente** a cambios en el calendario externo
- **Previene conflictos** al verificar disponibilidad en tiempo real

### Flow - Onboarding

1. Usuario completa registro
2. Sistema redirige a `/onboarding`
3. Sistema muestra 2 opciones:

   **Opción A: Manual** (actual)
   - Seleccionar turnos predefinidos (Mañana/Tarde/Noche)
   
   **Opción B: Desde Google Calendar** (nuevo)
   - Botón: "Importar desde Google Calendar"

4. Usuario elige **Opción B**
5. Sistema inicia OAuth con scope `calendar.readonly`
6. Usuario autoriza permisos
7. Sistema lee eventos del próximo mes
8. Sistema aplica algoritmo de detección de slots libres:

```typescript
// Algoritmo
FOR cada día de la semana (Lun-Dom):
  FOR cada hora del día (06:00 - 23:00):
    IF NO hay evento en ese rango de 1 hora:
      Marcar hora como "libre"
    END IF
  END FOR
  
  // Consolidar horas libres en slots contiguos
  Agrupar horas libres consecutivas en slots
  
  // Filtrar slots demasiado cortos
  Eliminar slots < 30 minutos
END FOR
```

9. Sistema genera `availability_slots` para cada slot libre detectado
10. Sistema muestra preview de disponibilidad detectada
11. Usuario puede ajustar manualmente si lo desea
12. Usuario confirma
13. Sistema guarda slots en DB
14. Sistema marca `onboarding_completed = true`
15. Sistema redirige a `/dashboard`

### Flow - Settings (Existing User)

**Paso 1: Elegir método de configuración**

1. Usuario va a `/dashboard/settings/availability`
2. Sistema muestra dos opciones destacadas:

   ```
   ┌─────────────────────────────────────────────────────┐
   │  ¿Cómo querés configurar tus horarios?              │
   │                                                      │
   │  [ ] 📅 Configuración Manual                        │
   │      Elegir días y horarios manualmente             │
   │                                                      │
   │  [✓] 🔗 Conectar con Google Calendar ⭐             │
   │      Sincronización automática y continua           │
   │      Detecta horarios libres de tu calendario       │
   │      Se actualiza cuando cambian tus eventos        │
   │                                                      │
   │      [Conectar Google Calendar]                     │
   └─────────────────────────────────────────────────────┘
   ```

**Paso 2: Conectar y sincronizar**

3. Usuario hace click en **"Conectar Google Calendar"**
4. Si no está conectado: iniciar OAuth con scopes:
   - `calendar.events` (crear eventos)
   - `calendar.readonly` (leer eventos)
5. Usuario autoriza permisos en Google
6. Sistema lee eventos del próximo mes
7. Sistema aplica algoritmo de detección de slots libres
8. Sistema muestra preview de disponibilidad detectada vs. actual

**Paso 3: Configurar estrategia de importación**

9. Sistema pregunta: "¿Reemplazar o combinar?"
   - **Reemplazar**: Borra slots manuales actuales, usa solo los detectados
   - **Combinar**: Mantiene slots manuales + agrega importados
10. Usuario confirma estrategia

**Paso 4: Activar sincronización continua**

11. Sistema guarda:
    - `availability_slots` detectados en DB
    - Token de Google Calendar para sincronización futura
    - Timestamp de última sincronización
12. Sistema activa sincronización continua (cada 15 min)
13. Sistema muestra mensaje de éxito:
    ```
    ✅ Google Calendar conectado exitosamente
    🔄 Sincronización continua activada
    
    A partir de ahora:
    - Tus horarios libres se actualizarán automáticamente
    - StudyApp evitará conflictos con eventos de Google
    - Las sesiones se ajustarán si cambia tu agenda
    ```

**Paso 5: Re-sincronización manual (opcional)**

14. Usuario puede forzar actualización en cualquier momento:
    - Botón: **"Actualizar desde Google Calendar"**
    - Útil para revisar cambios antes de aplicarlos

### Algorithm: Free Slot Detection

```typescript
interface CalendarEvent {
  start: Date;
  end: Date;
  summary: string;
}

interface TimeSlot {
  day_of_week: number; // 0-6
  start_time: string;   // "09:00"
  end_time: string;     // "11:30"
}

async function detectFreeSlots(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
  minSlotDuration: number = 30 // minutos
): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = [];
  
  // Iterar cada día en el rango
  for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dayStart = new Date(date).setHours(6, 0, 0, 0);   // 06:00
    const dayEnd = new Date(date).setHours(23, 0, 0, 0);    // 23:00
    
    // Obtener eventos de ese día
    const dayEvents = events.filter(e => 
      e.start >= dayStart && e.start < dayEnd
    ).sort((a, b) => a.start - b.start);
    
    // Encontrar gaps entre eventos
    let currentTime = dayStart;
    
    for (const event of dayEvents) {
      const gap = (event.start - currentTime) / 60000; // minutos
      
      if (gap >= minSlotDuration) {
        slots.push({
          day_of_week: dayOfWeek,
          start_time: formatTime(currentTime),
          end_time: formatTime(event.start),
        });
      }
      
      currentTime = Math.max(currentTime, event.end);
    }
    
    // Gap final del día (último evento → 23:00)
    const finalGap = (dayEnd - currentTime) / 60000;
    if (finalGap >= minSlotDuration) {
      slots.push({
        day_of_week: dayOfWeek,
        start_time: formatTime(currentTime),
        end_time: formatTime(dayEnd),
      });
    }
  }
  
  // Consolidar slots repetidos por día de semana
  return consolidateWeeklyPattern(slots);
}

function consolidateWeeklyPattern(slots: TimeSlot[]): TimeSlot[] {
  // Agrupar por day_of_week
  // Si un slot se repite en 3+ semanas → considerarlo patrón
  // Ejemplo: Si Lunes 09-11 aparece 4 semanas seguidas → crear slot fijo
}
```

### Data Flow

```
Google Calendar Events
  ↓
[Read via calendar.readonly scope]
  ↓
CalendarEvent[]
  ↓
[detectFreeSlots() algorithm]
  ↓
TimeSlot[] (day + start + end)
  ↓
[Preview UI - user confirms]
  ↓
availability_slots table (INSERT)
```

### UI Components

**Nueva página**: `/onboarding` (modificar)

Agregar card:

```tsx
<div className="grid gap-6 sm:grid-cols-2">
  {/* Opción A: Manual */}
  <button onClick={() => setMode('manual')}>
    <CalendarIcon />
    <h3>Configurar Manualmente</h3>
    <p>Elegir turnos predefinidos</p>
  </button>

  {/* Opción B: Google Calendar (NUEVO) */}
  <button onClick={handleImportFromGoogle}>
    <GoogleIcon />
    <h3>Importar desde Google Calendar</h3>
    <p>Detectar automáticamente horarios libres</p>
  </button>
</div>
```

**Nueva página**: `/dashboard/settings/availability` (modificar)

Agregar botón:

```tsx
<Button onClick={handleImportFromGoogle}>
  <GoogleIcon className="mr-2" />
  Importar desde Google Calendar
</Button>
```

### API Endpoints

```http
POST /api/v1/availability/import-from-google
Headers:
  Authorization: Bearer {token}

Request:
{
  "startDate": "2026-02-01",
  "endDate": "2026-03-01",
  "minSlotDuration": 30,
  "strategy": "REPLACE" | "MERGE"
}

Response 200:
{
  "slotsDetected": 42,
  "slotsCreated": 35,
  "slotsMerged": 7,
  "preview": [
    { "day_of_week": 1, "start_time": "09:00", "end_time": "11:30" },
    { "day_of_week": 1, "start_time": "14:00", "end_time": "17:00" },
    // ...
  ]
}
```

### Implementation Files

**Nuevos archivos**:
- `src/lib/services/availability-importer.service.ts` - Lógica de detección de slots
- `src/lib/actions/availability.ts` (modificar) - Agregar `importFromGoogleCalendar()`
- `src/app/(auth)/onboarding/page.tsx` (modificar) - Agregar opción de importar
- `src/components/features/availability/import-preview-dialog.tsx` - Preview de slots detectados

**Modificar**:
- `src/app/api/auth/google/route.ts` - Agregar scope `calendar.readonly`
- `src/lib/services/google-calendar.service.ts` - Agregar método `readEvents()`

### Database Impact

**Tabla**: `availability_slots` (ya existe)

No requiere migration adicional. Solo INSERT de nuevos slots.

### Edge Cases

| Caso | Solución |
|------|----------|
| Usuario sin eventos en Google Calendar | Mostrar mensaje: "No se detectaron eventos. ¿Deseas configurar manualmente?" |
| Todos los días completamente ocupados | Warning: "No se encontraron slots libres de 30+ min. Revisa tu calendario." |
| Eventos recurrentes no detectados | Google Calendar API devuelve instancias expandidas → no es problema |
| Usuario tiene calendario de múltiples zonas horarias | Normalizar todo a `America/Argentina/Buenos_Aires` |
| Slots detectados muy fragmentados (ej: 20 slots de 30min) | Aplicar threshold: solo slots >= 1 hora |

### Status

⏳ **Pendiente de Implementación**

---

## 5.7.3 UC-011c: Detect Schedule Conflicts

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-011c |
| **Priority** | P2 |
| **Module** | Calendar |
| **Complexity** | 🟠 High |
| **Status** | ⏳ Pendiente |
| **Actor** | Automated System (Session Generator) |
| **Parent** | UC-011 |

### User Story

```
AS A student
I WANT StudyApp to avoid scheduling sessions during my existing events
SO THAT I don't have overlapping commitments
```

### Flow

1. **Trigger**: Sistema va a generar sesiones para un nuevo topic (UC-006)
2. Sistema verifica si usuario tiene Google Calendar conectado
3. Si conectado:
   a. Para cada sesión a programar:
      - Consultar Google Calendar API en esa fecha/hora
      - Verificar si hay eventos en conflicto
   b. Si hay conflicto:
      - Buscar próximo slot disponible en `availability_slots`
      - Verificar nuevamente en Google Calendar
      - Repetir hasta encontrar slot libre
   c. Programar sesión en slot sin conflictos
4. Si no conectado:
   - Generar sesiones normalmente (solo con `availability_slots` locales)

### Algorithm

```typescript
async function findConflictFreeSlot(
  preferredDate: Date,
  duration: number, // minutos
  userId: string
): Promise<Date> {
  const tokens = await getGoogleTokens(userId);
  if (!tokens) return preferredDate; // Fallback: sin Google Calendar
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  let candidate = preferredDate;
  let attempts = 0;
  const MAX_ATTEMPTS = 14; // Buscar hasta 2 semanas adelante
  
  while (attempts < MAX_ATTEMPTS) {
    // Verificar conflictos en Google Calendar
    const endTime = new Date(candidate.getTime() + duration * 60000);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: candidate.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
    });
    
    const conflicts = response.data.items || [];
    
    if (conflicts.length === 0) {
      // No hay conflictos, usar este slot
      return candidate;
    }
    
    // Hay conflicto, buscar siguiente slot disponible
    candidate = await getNextAvailableSlot(userId, candidate);
    attempts++;
  }
  
  // Si no encuentra slot sin conflictos en 2 semanas, usar el preferido (con warning)
  console.warn(`No conflict-free slot found for session after ${attempts} attempts`);
  return preferredDate;
}
```

### Integration Point

**Modificar**: `src/lib/services/session-generator.service.ts`

```typescript
async generateSessions(topic: Topic, exam: Exam): Promise<Session[]> {
  const intervals = this.getIntervals(topic.difficulty);
  const sessions: Session[] = [];
  
  for (let i = 0; i < intervals.length; i++) {
    let scheduledAt = this.calculateDate(topic, intervals[i]);
    
    // 🆕 NUEVO: Verificar conflictos con Google Calendar
    if (await this.isGoogleCalendarConnected(topic.userId)) {
      scheduledAt = await this.findConflictFreeSlot(
        scheduledAt,
        this.calculateDuration(topic, i),
        topic.userId
      );
    }
    
    sessions.push({
      number: i + 1,
      scheduledAt,
      duration: this.calculateDuration(topic, i),
      priority: this.priorityCalculator.calculate({...}),
    });
  }
  
  return sessions;
}
```

### UI Indicator

Cuando se genera un topic con detección de conflictos:

```tsx
<Alert variant="info">
  ✓ Sesiones programadas evitando conflictos con tu Google Calendar
</Alert>
```

### Performance Considerations

- **API Rate Limit**: Google Calendar API tiene límite de 10,000 requests/día
- **Caching**: Cachear eventos de Google Calendar por 1 hora para evitar llamadas repetidas
- **Batch Processing**: Si se generan múltiples topics, agrupar verificaciones

### Status

⏳ **Pendiente de Implementación**

---

## 5.7.4 UC-011d: Continuous Sync (Bidirectional)

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-011d |
| **Priority** | P2 (después de UC-011b + UC-011c) |
| **Module** | Calendar + Background Jobs |
| **Complexity** | 🟠 High |
| **Status** | ⏳ Pendiente |
| **Actor** | Automated System (Background Jobs + Event Listeners) |
| **Parent** | UC-011 |

### User Story

```
AS A student with Google Calendar connected
I WANT StudyApp to sync continuously and bidirectionally
SO THAT:
- My session updates reflect in Google Calendar automatically
- Changes in Google Calendar update my availability in StudyApp
- Both calendars are always synchronized without manual intervention
```

### Sync Scenarios (Bidirectional)

#### Dirección 1: StudyApp → Google Calendar (Exportar cambios)

| Acción en StudyApp | Acción en Google Calendar | Evento Disparador |
|-------------------|---------------------------|-------------------|
| Sesión completada | Evento marcado como completado (color verde) | `session.completed` |
| Sesión reagendada | Evento actualizado con nueva fecha/hora | `session.rescheduled` |
| Sesión eliminada | Evento eliminado de calendario | `session.deleted` |
| Sesión abandonada | Evento marcado como cancelado (color rojo) | `session.abandoned` |
| Nueva sesión generada | Evento creado automáticamente | `session.created` |

#### Dirección 2: Google Calendar → StudyApp (Detectar cambios externos)

| Acción en Google Calendar | Acción en StudyApp | Frecuencia |
|--------------------------|-------------------|------------|
| Evento nuevo agregado | Actualiza `availability_slots`, verifica conflictos con sesiones existentes | Cada 15 min (polling) |
| Evento modificado (hora) | Recalcula disponibilidad, reagenda sesiones si hay nuevos conflictos | Cada 15 min |
| Evento eliminado | Libera ese horario para sesiones | Cada 15 min |
| Evento recurrente modificado | Actualiza patrón de disponibilidad semanal | Cada 15 min |

### Implementation Strategy

#### Fase 1: Event-Driven Sync (StudyApp → Google)

```typescript
// src/lib/services/session-events.ts
@OnEvent('session.completed')
async handleSessionCompleted(event: SessionCompletedEvent) {
  // Existing: Update user_stats, streaks
  await this.updateUserStats(event.userId);
  
  // 🆕 NEW: Update Google Calendar
  const hasGoogleCalendar = await this.googleCalendarService.isConnected(event.userId);
  
  if (hasGoogleCalendar) {
    await this.googleCalendarService.updateEventStatus(
      event.userId,
      event.sessionId,
      'COMPLETED'
    );
  }
}

@OnEvent('session.rescheduled')
async handleSessionRescheduled(event: SessionRescheduledEvent) {
  const hasGoogleCalendar = await this.googleCalendarService.isConnected(event.userId);
  
  if (hasGoogleCalendar) {
    await this.googleCalendarService.updateEventDateTime(
      event.userId,
      event.sessionId,
      event.newScheduledAt,
      event.duration
    );
  }
}

@OnEvent('session.deleted')
async handleSessionDeleted(event: SessionDeletedEvent) {
  const hasGoogleCalendar = await this.googleCalendarService.isConnected(event.userId);
  
  if (hasGoogleCalendar) {
    await this.googleCalendarService.deleteEvent(
      event.userId,
      event.googleEventId
    );
  }
}
```

#### Fase 2: Polling-Based Sync (Google → StudyApp)

```typescript
// Background Job (ejecuta cada 15 minutos)
// supabase/functions/sync-google-calendar/index.ts

export async function syncGoogleCalendarForUser(userId: string) {
  // 1. Obtener última sincronización
  const lastSync = await getLastSyncTimestamp(userId);
  
  // 2. Consultar eventos modificados desde lastSync
  const calendar = google.calendar('v3');
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: lastSync.toISOString(),
    timeMax: addMonths(new Date(), 1).toISOString(),
    singleEvents: true,
    orderBy: 'updated',
  });
  
  const events = response.data.items || [];
  
  if (events.length === 0) {
    // Sin cambios
    return { updated: false };
  }
  
  // 3. Detectar cambios relevantes
  const changes = analyzeChanges(events, lastSync);
  
  if (changes.hasAvailabilityImpact) {
    // 4. Recalcular availability_slots
    const newSlots = await detectFreeSlots(events);
    await updateAvailabilitySlots(userId, newSlots);
    
    // 5. Verificar conflictos con sesiones existentes
    const conflicts = await checkSessionConflicts(userId, events);
    
    if (conflicts.length > 0) {
      // 6. Notificar al usuario
      await notifyUser(userId, {
        type: 'SCHEDULE_CONFLICT',
        title: 'Cambios en tu Google Calendar',
        message: `${conflicts.length} sesiones pueden tener conflictos. Revisá tu agenda.`,
        actions: [
          { label: 'Revisar Sesiones', url: '/dashboard/sessions' },
          { label: 'Reagendar Automáticamente', action: 'auto-reschedule' }
        ]
      });
    }
  }
  
  // 7. Actualizar timestamp de última sync
  await updateLastSyncTimestamp(userId, new Date());
  
  return { updated: true, conflicts: conflicts.length };
}

// Ejecutar para todos los usuarios con Google Calendar conectado
serve(async () => {
  const usersWithGoogleCalendar = await getUsersWithGoogleCalendar();
  
  const results = await Promise.allSettled(
    usersWithGoogleCalendar.map(user => syncGoogleCalendarForUser(user.id))
  );
  
  return new Response(JSON.stringify({
    totalUsers: usersWithGoogleCalendar.length,
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length
  }));
});
```

#### Fase 3: Webhooks (Futuro - Real-time sync)

```typescript
// Google Calendar Push Notifications
// https://developers.google.com/calendar/api/guides/push

// 1. Registrar webhook al conectar Google Calendar
async function subscribeToCalendarChanges(userId: string) {
  const calendar = google.calendar('v3');
  
  const response = await calendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: `studyapp-${userId}`,
      type: 'web_hook',
      address: `https://tu-dominio.vercel.app/api/webhooks/google-calendar`,
      expiration: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 días
    }
  });
  
  // Guardar channel info para renovar después
  await saveWebhookChannel(userId, response.data);
}

// 2. Endpoint para recibir notificaciones
// src/app/api/webhooks/google-calendar/route.ts
export async function POST(request: Request) {
  const channelId = request.headers.get('X-Goog-Channel-ID');
  const resourceState = request.headers.get('X-Goog-Resource-State');
  
  if (resourceState === 'sync') {
    // Inicial sync, ignorar
    return new Response('OK', { status: 200 });
  }
  
  // Obtener userId del channelId
  const userId = extractUserIdFromChannel(channelId);
  
  // Disparar sync inmediato
  await syncGoogleCalendarForUser(userId);
  
  return new Response('OK', { status: 200 });
}
```

### Frequency & Performance

| Método | Latencia | Costo API | Complejidad | Estado |
|--------|----------|-----------|-------------|--------|
| **Event-Driven** (StudyApp → Google) | Instantáneo | 1 call/acción | Baja | ✅ A implementar |
| **Polling** (Google → StudyApp) | 15 minutos | 1 call/user cada 15min | Media | ⏳ Fase 1 |
| **Webhooks** (Google → StudyApp) | <1 segundo | Solo cuando hay cambios | Alta | 🔮 Futuro |

### Database Changes

```sql
-- Agregar columna para tracking de sincronización
ALTER TABLE user_settings
ADD COLUMN google_calendar_last_sync TIMESTAMPTZ,
ADD COLUMN google_calendar_webhook_id VARCHAR(255),
ADD COLUMN google_calendar_webhook_expiration TIMESTAMPTZ;

-- Agregar columna para vincular sesiones con eventos de Google
ALTER TABLE sessions
ADD COLUMN google_event_id VARCHAR(255),
ADD INDEX idx_sessions_google_event_id (google_event_id);
```

### Implementation

**Event Listeners** (arquitectura existente):

```typescript
// src/lib/services/session-events.ts (modificar)

@OnEvent('session.completed')
async handleSessionCompleted(event: SessionCompletedEvent) {
  // Existing: actualizar user_stats, rachas, etc.
  
  // 🆕 NUEVO: Actualizar Google Calendar
  await this.googleCalendarService.updateEventStatus(
    event.userId,
    event.sessionId,
    'COMPLETED'
  );
}

@OnEvent('session.rescheduled')
async handleSessionRescheduled(event: SessionRescheduledEvent) {
  // 🆕 NUEVO: Actualizar fecha en Google Calendar
  await this.googleCalendarService.updateEventDateTime(
    event.userId,
    event.sessionId,
    event.newDate,
    event.duration
  );
}

@OnEvent('session.deleted')
async handleSessionDeleted(event: SessionDeletedEvent) {
  // 🆕 NUEVO: Eliminar evento de Google Calendar
  await this.googleCalendarService.deleteEvent(
    event.userId,
    event.googleEventId
  );
}
```

**Agregar a GoogleCalendarService**:

```typescript
async updateEventStatus(
  userId: string,
  sessionId: string,
  status: SessionStatus
): Promise<void> {
  const tokens = await this.getTokens(userId);
  const eventId = await this.getGoogleEventId(sessionId);
  
  const colorId = {
    COMPLETED: '10', // Verde
    ABANDONED: '11', // Rojo
    PENDING: '9',    // Azul
  }[status];
  
  await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: { colorId },
  });
}
```

### Database Changes

**Migration necesaria**: Agregar columna `google_event_id` a tabla `sessions`

```sql
ALTER TABLE sessions ADD COLUMN google_event_id VARCHAR(255);
CREATE INDEX idx_sessions_google_event_id ON sessions(google_event_id);
```

Esto permite vincular una sesión de StudyApp con su evento en Google Calendar.

### Status

⏳ **Pendiente de Implementación**

---

## 5.8 UC-013: Track Streaks (Gamification)

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

#### 1. In-App (Implementado)
- Se guarda en tabla `notifications` en Supabase.
- Visible en dropdown desde Navbar (campana).
- Marca como leída con click.
- Auto-refresh cada 60 segundos.
- Estado: **Funcional**.

#### 2. Email con Resend (Implementado)
- Envío de notificaciones por email con templates HTML.
- Configurado con Resend API.
- Dominio: onboarding@resend.dev (sandbox).
- Estado: **Funcional**.

#### 3. Telegram (Preparado, no implementado)
- Notificaciones instantáneas vía Bot.
- Requiere crear Bot con @BotFather.
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

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-021 |
| **Priority** | P0 |
| **Module** | Scheduling |
| **Complexity** | 🟡 Medium |
| **Status** | ⏳ Pendiente |
| **Actor** | Authenticated User |

### User Story

```
AS A student
I WANT TO define my weekly study hours
SO THAT sessions are scheduled only when I'm free
```

### Flow

1. Usuario va a "Configuración" -> "Disponibilidad"
2. Sistema muestra un calendario semanal (Lunes a Domingo)
3. Usuario puede:
   - Crear bloques de "Tiempo de Estudio" (verde)
   - Definir hora inicio y fin para cada día
   - Copiar configuración de un día a otro
4. Usuario guarda configuración
5. Sistema valida que `start_time < end_time` y no haya solapamientos
6. Sistema guarda slots en DB

### Data Model

#### tabla `availability_slots`
```sql
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday...
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);
```

### API Endpoints

```http
GET /api/v1/availability
Response 200:
[
  { "day": 1, "start": "18:00", "end": "22:00", "enabled": true },
  { "day": 3, "start": "18:00", "end": "22:00", "enabled": true },
  { "day": 6, "start": "10:00", "end": "14:00", "enabled": true }
]

POST /api/v1/availability
Request:
{
  "slots": [
    { "day": 1, "start": "18:00", "end": "22:00" },
    ...
  ]
}
```

### Integration with Session Generator

El `SessionGeneratorService` usará estos slots para asignar `scheduled_at`.

```typescript
// Pseudo-code logic
function findNextAvailableSlot(date: Date, duration: number): Date {
  const dayOfWeek = date.getDay();
  const slots = availabilitySlots.filter(s => s.day === dayOfWeek);
  
  // Si no hay slots hoy, buscar mañana...
  if (!slots.length) return findNextAvailableSlot(addDays(date, 1), duration);
  
  // Verificar si cabe la sesión en el slot
  // ...
}
```

### UI Components

- **WeeklyScheduler**: Componente interactivo para seleccionar horas (tipo Google Calendar week view o lista de días con inputs de rango).

### Status
⏳ Pendiente

---

## 5.18 UC-022: Onboarding - Availability Setup

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-022 |
| **Priority** | P0 |
| **Module** | Onboarding |
| **Complexity** | 🟡 Medium |
| **Status** | ⏳ Pendiente |
| **Actor** | New User (post-registration) |

### User Story

```
AS A new student
I WANT TO configure my study hours during onboarding
SO THAT I can start using the app without complex configuration
```

### Flow

1. Usuario completa el registro exitosamente
2. Sistema redirige automáticamente a `/onboarding`
3. Sistema muestra wizard de 2 pasos:

**Paso 1: Selección de Turnos**
- Título: "¿Cuándo preferís estudiar?"
- Opciones (selección múltiple con cards grandes):
  - Mañana (08:00 - 12:00) - Icono: Sol
  - Tarde (13:00 - 17:00) - Icono: Sol con nubes
  - Noche (18:00 - 22:00) - Icono: Luna

**Paso 2: Fines de Semana**
- Pregunta: "¿Incluir fines de semana?"
- Toggle Sí/No
- Si sí: aplica los turnos seleccionados a Sábado y Domingo

4. Usuario hace click en "Finalizar"
5. Sistema:
   - Traduce selección a `availability_slots` concretos
   - Si selecciona Mañana + Tarde: crea 2 slots (08-12 y 13-17), NO los une
   - Guarda slots en DB para Lun-Vie (o Lun-Dom si incluye weekend)
   - Marca `onboarding_completed = true` en `user_settings`
6. Sistema redirige a `/dashboard`

### Data Mapping

| Selección | Días | Slots Generados |
|-----------|------|-----------------|
| Mañana | Lun-Vie | 5 días × 1 slot (08:00-12:00) = 5 slots |
| Tarde | Lun-Vie | 5 días × 1 slot (13:00-17:00) = 5 slots |
| Noche | Lun-Vie | 5 días × 1 slot (18:00-22:00) = 5 slots |
| Mañana + Tarde | Lun-Vie | 5 días × 2 slots = 10 slots |
| Todas | Lun-Dom + Weekend | 7 días × 3 slots = 21 slots |

### API Endpoint

```http
POST /api/v1/onboarding/availability
Request:
{
  "shifts": ["MORNING", "NIGHT"],
  "includeWeekends": true
}

Response 200:
{
  "slotsCreated": 14,
  "onboardingCompleted": true
}
```

### Status
⏳ Pendiente

---

## 5.19 UC-023: AI Video Generation

### Specification

| Field | Value |
|-------|-------|
| **ID** | UC-023 |
| **Priority** | P3 (v2.0) |
| **Module** | Content Generation |
| **Complexity** | 🔴 Very High |
| **Status** | ⏳ Pendiente |
| **Actor** | Authenticated User |

### User Story

```
AS A student studying complex topics
I WANT TO generate explanatory videos with AI
SO THAT I can understand difficult concepts visually
```

### Flow

1. Usuario está en el detalle de un tema (ej: "Integrales Dobles")
2. Usuario hace click en botón "Generar Video Explicativo"
3. Sistema muestra modal de confirmación:
   - "Esto tomará 2-5 minutos"
   - "El video se generará en segundo plano"
4. Usuario confirma
5. Sistema dispara job asíncrono (Edge Function o API)
6. Background process:
   a. Envía nombre del tema + contexto a Gemini API
   b. Gemini genera guión con explicaciones + código Manim
   c. Python ejecuta Manim para renderizar video MP4
   d. Video se sube a Supabase Storage
   e. Se actualiza `topics.video_url` en DB
   f. (Opcional) Se envía notificación "Tu video está listo"
7. Usuario ve el video embebido en el detalle del tema

### Tech Stack

#### IA: Google Gemini
- API: Gemini 1.5 Pro
- Prompt: "Genera código Manim para explicar {topic} de forma visual"
- Output: Script Python con animaciones

#### Video: Manim (Community Edition)
- Librería: `manim-ce`
- Renderiza animaciones matemáticas estilo 3Blue1Brown
- Output: MP4 720p

#### Backend: Supabase Edge Function
```typescript
// supabase/functions/generate-video/index.ts
import { serve } from 'std/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

serve(async (req) => {
  const { topicName, topicDescription } = await req.json();
  
  // 1. Generar guión con Gemini
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  const prompt = `Genera código Python con Manim para explicar "${topicName}".
  Descripción: ${topicDescription}
  
  Requisitos:
  - Animación de 2-3 minutos
  - Incluir título, definición y ejemplos visuales
  - Código limpio y ejecutable
  `;
  
  const result = await model.generateContent(prompt);
  const manimCode = result.response.text();
  
  // 2. Ejecutar Python + Manim (en contenedor Docker)
  const videoBuffer = await executeManimScript(manimCode);
  
  // 3. Subir a Supabase Storage
  const videoUrl = await uploadToStorage(videoBuffer, topicId);
  
  // 4. Actualizar topic
  await supabase.from('topics').update({ video_url: videoUrl }).eq('id', topicId);
  
  return new Response(JSON.stringify({ videoUrl }));
});
```

### Data Model

Modificar tabla `topics`:
```sql
ALTER TABLE topics
ADD COLUMN video_url TEXT,
ADD COLUMN video_status TEXT CHECK (video_status IN ('PENDING', 'GENERATING', 'READY', 'FAILED')),
ADD COLUMN video_generated_at TIMESTAMPTZ;
```

### UI Components

#### Botón en TopicCard
```tsx
{topic.video_url ? (
  <button onClick={() => openVideoPlayer(topic.video_url)}>
    Ver Video
  </button>
) : (
  <button onClick={() => generateVideo(topic.id)}>
    Generar Video con IA
  </button>
)}
```

#### Video Player Modal
- Player embebido con controles
- Botón de descargar
- Opción de regenerar si no gustó

### API Endpoint

```http
POST /api/v1/topics/{id}/generate-video

Response 202 (Accepted):
{
  "message": "Video generation started",
  "jobId": "uuid",
  "estimatedTime": "3-5 minutes"
}

GET /api/v1/topics/{id}/video-status
Response 200:
{
  "status": "READY",
  "videoUrl": "https://...",
  "generatedAt": "2026-02-05T12:00:00Z"
}
```

### Example Manim Code (Generated by Gemini)

```python
from manim import *

class IntegralesDobles(Scene):
    def construct(self):
        # Título
        title = Text("Integrales Dobles", font_size=48)
        self.play(Write(title))
        self.wait()
        self.play(FadeOut(title))
        
        # Definición
        definition = MathTex(
            r"\iint_D f(x,y) \, dA"
        ).scale(1.5)
        self.play(Write(definition))
        
        # Región de integración
        axes = Axes(x_range=[0, 3], y_range=[0, 3])
        region = Polygon(
            axes.c2p(0, 0),
            axes.c2p(2, 0),
            axes.c2p(2, 2),
            axes.c2p(0, 2),
            fill_opacity=0.3,
            fill_color=BLUE
        )
        
        self.play(Create(axes), Create(region))
        # ...más animaciones
```

### Infrastructure Requirements

1. **Docker Container** con Python + Manim instalado
2. **Supabase Edge Function** (Deno runtime)
3. **Supabase Storage Bucket** para videos
4. **Gemini API Key** en environment vars
5. **Queue/Job System** para procesar async (opcional: Supabase Functions ya son async)

### Pricing & Limits

- **Gemini API:** Gratis hasta 60 requests/minuto
- **Manim Render:** ~30-60 segundos por video
- **Storage:** Supabase Free tier: 1GB (suficiente para MVP)
- **Bandwidth:** Considerar CDN si escala

### Status
⏳ Pendiente (v2.0)

### Dependencies

- Gemini API Key
- Python 3.10+
- Manim Community v0.18+
- FFmpeg
- LaTeX (para fórmulas matemáticas)
- Docker (para sandbox de ejecución)

---

_Última actualización: Febrero 2026_
