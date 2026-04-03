export type {
  AIProvider,
  ExtractionRawResult,
  RawExtraction,
  SubjectMetadata,
  ExtractedUnit,
  ScheduleEntry,
  ExtractedExam,
} from './types';

export { getAIProvider } from './factory';

export {
  getExtractionSystemPrompt,
  getExtractionUserPrompt,
  getExtractionJsonSchema,
} from './extraction-prompt';

export { processExtractionResult } from './extraction-processor';
export type {
  ProcessedExtraction,
  NormalizedScheduleEntry,
} from './extraction-processor';

export { groupTopics, groupTopicsWithAI } from './topic-grouper';
export type {
  GroupedTopic,
  TopicGroupingInput,
} from './topic-grouper';
