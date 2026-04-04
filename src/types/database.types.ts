export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string;
          created_at: string | null;
          description: string;
          icon: string | null;
          id: string;
          name: string;
          points: number | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description: string;
          icon?: string | null;
          id?: string;
          name: string;
          points?: number | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          points?: number | null;
        };
        Relationships: [];
      };
      ai_extractions: {
        Row: {
          created_at: string;
          document_type: string | null;
          error_message: string | null;
          file_name: string;
          file_url: string;
          id: string;
          model_used: string | null;
          processed_result: Json | null;
          processing_time_ms: number | null;
          provider: string | null;
          raw_response: Json | null;
          status: string;
          subject_id: string | null;
          tokens_used: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          document_type?: string | null;
          error_message?: string | null;
          file_name: string;
          file_url: string;
          id?: string;
          model_used?: string | null;
          processed_result?: Json | null;
          processing_time_ms?: number | null;
          provider?: string | null;
          raw_response?: Json | null;
          status?: string;
          subject_id?: string | null;
          tokens_used?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          document_type?: string | null;
          error_message?: string | null;
          file_name?: string;
          file_url?: string;
          id?: string;
          model_used?: string | null;
          processed_result?: Json | null;
          processing_time_ms?: number | null;
          provider?: string | null;
          raw_response?: Json | null;
          status?: string;
          subject_id?: string | null;
          tokens_used?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_extractions_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
        ];
      };
      availability_slots: {
        Row: {
          created_at: string | null;
          day_of_week: number;
          end_time: string;
          id: string;
          is_enabled: boolean | null;
          start_time: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_enabled?: boolean | null;
          start_time: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_enabled?: boolean | null;
          start_time?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      exams: {
        Row: {
          category: Database['public']['Enums']['exam_category'];
          created_at: string | null;
          date: string;
          description: string | null;
          id: string;
          modality: Database['public']['Enums']['exam_modality'];
          number: number | null;
          subject_id: string;
          updated_at: string | null;
        };
        Insert: {
          category: Database['public']['Enums']['exam_category'];
          created_at?: string | null;
          date: string;
          description?: string | null;
          id?: string;
          modality?: Database['public']['Enums']['exam_modality'];
          number?: number | null;
          subject_id: string;
          updated_at?: string | null;
        };
        Update: {
          category?: Database['public']['Enums']['exam_category'];
          created_at?: string | null;
          date?: string;
          description?: string | null;
          id?: string;
          modality?: Database['public']['Enums']['exam_modality'];
          number?: number | null;
          subject_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'exams_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          message: string;
          metadata: Json | null;
          read: boolean | null;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message: string;
          metadata?: Json | null;
          read?: boolean | null;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string;
          metadata?: Json | null;
          read?: boolean | null;
          title?: string;
          type?: Database['public']['Enums']['notification_type'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      sessions: {
        Row: {
          actual_duration: number | null;
          adjusted_for_conflict: boolean | null;
          attempts: number | null;
          completed_at: string | null;
          completion_rating: string | null;
          created_at: string | null;
          duration: number;
          exam_id: string | null;
          google_calendar_synced_at: string | null;
          google_event_id: string | null;
          id: string;
          number: number;
          original_scheduled_at: string | null;
          priority: Database['public']['Enums']['priority'];
          scheduled_at: string;
          session_type: Database['public']['Enums']['session_type'];
          started_at: string | null;
          status: Database['public']['Enums']['session_status'] | null;
          subject_id: string;
          topic_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          actual_duration?: number | null;
          adjusted_for_conflict?: boolean | null;
          attempts?: number | null;
          completed_at?: string | null;
          completion_rating?: string | null;
          created_at?: string | null;
          duration: number;
          exam_id?: string | null;
          google_calendar_synced_at?: string | null;
          google_event_id?: string | null;
          id?: string;
          number: number;
          original_scheduled_at?: string | null;
          priority: Database['public']['Enums']['priority'];
          scheduled_at: string;
          session_type?: Database['public']['Enums']['session_type'];
          started_at?: string | null;
          status?: Database['public']['Enums']['session_status'] | null;
          subject_id: string;
          topic_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          actual_duration?: number | null;
          adjusted_for_conflict?: boolean | null;
          attempts?: number | null;
          completed_at?: string | null;
          completion_rating?: string | null;
          created_at?: string | null;
          duration?: number;
          exam_id?: string | null;
          google_calendar_synced_at?: string | null;
          google_event_id?: string | null;
          id?: string;
          number?: number;
          original_scheduled_at?: string | null;
          priority?: Database['public']['Enums']['priority'];
          scheduled_at?: string;
          session_type?: Database['public']['Enums']['session_type'];
          started_at?: string | null;
          status?: Database['public']['Enums']['session_status'] | null;
          subject_id?: string;
          topic_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_exam_id_fkey';
            columns: ['exam_id'];
            isOneToOne: false;
            referencedRelation: 'exams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sessions_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sessions_topic_id_fkey';
            columns: ['topic_id'];
            isOneToOne: false;
            referencedRelation: 'topics';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      subject_stats: {
        Row: {
          completed_sessions: number | null;
          created_at: string | null;
          id: string;
          level: number | null;
          points: number | null;
          subject_id: string;
          total_sessions: number | null;
          updated_at: string | null;
          user_stats_id: string;
        };
        Insert: {
          completed_sessions?: number | null;
          created_at?: string | null;
          id?: string;
          level?: number | null;
          points?: number | null;
          subject_id: string;
          total_sessions?: number | null;
          updated_at?: string | null;
          user_stats_id: string;
        };
        Update: {
          completed_sessions?: number | null;
          created_at?: string | null;
          id?: string;
          level?: number | null;
          points?: number | null;
          subject_id?: string;
          total_sessions?: number | null;
          updated_at?: string | null;
          user_stats_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subject_stats_user_stats_id_fkey';
            columns: ['user_stats_id'];
            isOneToOne: false;
            referencedRelation: 'user_stats';
            referencedColumns: ['id'];
          },
        ];
      };
      subjects: {
        Row: {
          ai_extraction_id: string | null;
          bibliography: Json | null;
          created_at: string | null;
          description: string | null;
          evaluation_criteria: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          professors: string[] | null;
          schedule: Json | null;
          semester: Database['public']['Enums']['semester_type'] | null;
          status: Database['public']['Enums']['subject_status'];
          total_hours: number | null;
          updated_at: string | null;
          user_id: string;
          weekly_hours: number | null;
          year: number | null;
        };
        Insert: {
          ai_extraction_id?: string | null;
          bibliography?: Json | null;
          created_at?: string | null;
          description?: string | null;
          evaluation_criteria?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          professors?: string[] | null;
          schedule?: Json | null;
          semester?: Database['public']['Enums']['semester_type'] | null;
          status?: Database['public']['Enums']['subject_status'];
          total_hours?: number | null;
          updated_at?: string | null;
          user_id: string;
          weekly_hours?: number | null;
          year?: number | null;
        };
        Update: {
          ai_extraction_id?: string | null;
          bibliography?: Json | null;
          created_at?: string | null;
          description?: string | null;
          evaluation_criteria?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          professors?: string[] | null;
          schedule?: Json | null;
          semester?: Database['public']['Enums']['semester_type'] | null;
          status?: Database['public']['Enums']['subject_status'];
          total_hours?: number | null;
          updated_at?: string | null;
          user_id?: string;
          weekly_hours?: number | null;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'subjects_ai_extraction_id_fkey';
            columns: ['ai_extraction_id'];
            isOneToOne: false;
            referencedRelation: 'ai_extractions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subjects_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          priority: Database['public']['Enums']['priority'];
          status: Database['public']['Enums']['task_status'] | null;
          subject_id: string | null;
          title: string;
          type: Database['public']['Enums']['task_type'];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority: Database['public']['Enums']['priority'];
          status?: Database['public']['Enums']['task_status'] | null;
          subject_id?: string | null;
          title: string;
          type: Database['public']['Enums']['task_type'];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: Database['public']['Enums']['priority'];
          status?: Database['public']['Enums']['task_status'] | null;
          subject_id?: string | null;
          title?: string;
          type?: Database['public']['Enums']['task_type'];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      topics: {
        Row: {
          created_at: string | null;
          description: string | null;
          difficulty: Database['public']['Enums']['difficulty'];
          exam_id: string | null;
          hours: number;
          id: string;
          name: string;
          source: Database['public']['Enums']['topic_source'];
          source_date: string | null;
          subject_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          difficulty: Database['public']['Enums']['difficulty'];
          exam_id?: string | null;
          hours: number;
          id?: string;
          name: string;
          source: Database['public']['Enums']['topic_source'];
          source_date?: string | null;
          subject_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          difficulty?: Database['public']['Enums']['difficulty'];
          exam_id?: string | null;
          hours?: number;
          id?: string;
          name?: string;
          source?: Database['public']['Enums']['topic_source'];
          source_date?: string | null;
          subject_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'topics_exam_id_fkey';
            columns: ['exam_id'];
            isOneToOne: false;
            referencedRelation: 'exams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'topics_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['id'];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          id: string;
          unlocked_at: string | null;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          id?: string;
          unlocked_at?: string | null;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          id?: string;
          unlocked_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'achievements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_achievements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_settings: {
        Row: {
          created_at: string | null;
          daily_summary_time: string | null;
          email_notifications: boolean | null;
          google_access_token: string | null;
          google_calendar_enabled: boolean | null;
          google_calendar_last_sync: string | null;
          google_refresh_token: string | null;
          google_token_expiry: string | null;
          in_app_notifications: boolean | null;
          onboarding_completed: boolean | null;
          study_end_hour: string | null;
          study_start_hour: string | null;
          telegram_notifications: boolean | null;
          theme_preference: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          daily_summary_time?: string | null;
          email_notifications?: boolean | null;
          google_access_token?: string | null;
          google_calendar_enabled?: boolean | null;
          google_calendar_last_sync?: string | null;
          google_refresh_token?: string | null;
          google_token_expiry?: string | null;
          in_app_notifications?: boolean | null;
          onboarding_completed?: boolean | null;
          study_end_hour?: string | null;
          study_start_hour?: string | null;
          telegram_notifications?: boolean | null;
          theme_preference?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          daily_summary_time?: string | null;
          email_notifications?: boolean | null;
          google_access_token?: string | null;
          google_calendar_enabled?: boolean | null;
          google_calendar_last_sync?: string | null;
          google_refresh_token?: string | null;
          google_token_expiry?: string | null;
          in_app_notifications?: boolean | null;
          onboarding_completed?: boolean | null;
          study_end_hour?: string | null;
          study_start_hour?: string | null;
          telegram_notifications?: boolean | null;
          theme_preference?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_stats: {
        Row: {
          completed_sessions: number | null;
          created_at: string | null;
          current_streak: number | null;
          id: string;
          last_activity_date: string | null;
          longest_streak: number | null;
          total_points: number | null;
          total_sessions: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_sessions?: number | null;
          created_at?: string | null;
          current_streak?: number | null;
          id?: string;
          last_activity_date?: string | null;
          longest_streak?: number | null;
          total_points?: number | null;
          total_sessions?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_sessions?: number | null;
          created_at?: string | null;
          current_streak?: number | null;
          id?: string;
          last_activity_date?: string | null;
          longest_streak?: number | null;
          total_points?: number | null;
          total_sessions?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_stats_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          name: string | null;
          telegram_chat_id: string | null;
          telegram_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id: string;
          name?: string | null;
          telegram_chat_id?: string | null;
          telegram_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string | null;
          telegram_chat_id?: string | null;
          telegram_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      exam_category: 'PARCIAL' | 'RECUPERATORIO' | 'FINAL' | 'TP';
      exam_modality: 'THEORY' | 'PRACTICE' | 'THEORY_PRACTICE';
      notification_type:
        | 'SESSION_REMINDER'
        | 'EXAM_APPROACHING'
        | 'STREAK_WARNING'
        | 'ACHIEVEMENT_UNLOCKED'
        | 'SESSION_RESCHEDULED'
        | 'GENERAL';
      priority: 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'LOW';
      semester_type: 'ANNUAL' | 'FIRST' | 'SECOND';
      session_status: 'PENDING' | 'COMPLETED' | 'INCOMPLETE' | 'RESCHEDULED' | 'ABANDONED';
      session_type: 'REVIEW' | 'PRE_CLASS';
      subject_status: 'CURSANDO' | 'APROBADA' | 'REGULAR' | 'LIBRE';
      task_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      task_type: 'TP' | 'HOMEWORK' | 'PROJECT' | 'OTHER';
      topic_source: 'CLASS' | 'FREE_STUDY' | 'PROGRAM';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      difficulty: ['EASY', 'MEDIUM', 'HARD'],
      exam_category: ['PARCIAL', 'RECUPERATORIO', 'FINAL', 'TP'],
      exam_modality: ['THEORY', 'PRACTICE', 'THEORY_PRACTICE'],
      notification_type: [
        'SESSION_REMINDER',
        'EXAM_APPROACHING',
        'STREAK_WARNING',
        'ACHIEVEMENT_UNLOCKED',
        'SESSION_RESCHEDULED',
        'GENERAL',
      ],
      priority: ['CRITICAL', 'URGENT', 'IMPORTANT', 'NORMAL', 'LOW'],
      semester_type: ['ANNUAL', 'FIRST', 'SECOND'],
      session_status: ['PENDING', 'COMPLETED', 'INCOMPLETE', 'RESCHEDULED', 'ABANDONED'],
      session_type: ['REVIEW', 'PRE_CLASS'],
      subject_status: ['CURSANDO', 'APROBADA', 'REGULAR', 'LIBRE'],
      task_status: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      task_type: ['TP', 'HOMEWORK', 'PROJECT', 'OTHER'],
      topic_source: ['CLASS', 'FREE_STUDY', 'PROGRAM'],
    },
  },
} as const;
