export type {
  AIProvider,
  AIExtractionErrorDetail,
  AIErrorCategory,
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

export {
  processExtractionResult,
  mergeExamsWithScheduleDates,
} from './extraction-processor';
export type {
  ProcessedExtraction,
  NormalizedScheduleEntry,
} from './extraction-processor';

export { groupTopics, groupTopicsWithAI } from './topic-grouper';
export type {
  GroupedTopic,
  GroupTopicsWithAIResult,
  TopicGroupingInput,
} from './topic-grouper';
