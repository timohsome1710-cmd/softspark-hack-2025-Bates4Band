export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      answer_comments: {
        Row: {
          answer_id: string
          author_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          answer_id: string
          author_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          answer_id?: string
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_comments_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_author: boolean | null
          author_id: string
          content: string
          created_at: string
          id: string
          is_verified: boolean
          question_id: string
          teacher_approved: boolean | null
          teacher_approved_by: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_author?: boolean | null
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_verified?: boolean
          question_id: string
          teacher_approved?: boolean | null
          teacher_approved_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_author?: boolean | null
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          question_id?: string
          teacher_approved?: boolean | null
          teacher_approved_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          chat_room_id: string
          id: string
          is_admin: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          chat_room_id: string
          id?: string
          is_admin?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          chat_room_id?: string
          id?: string
          is_admin?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          group_name: string | null
          id: string
          is_group: boolean
          updated_at: string
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          id?: string
          is_group?: boolean
          updated_at?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          id?: string
          is_group?: boolean
          updated_at?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          reply_to_message_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          reply_to_message_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          reply_to_message_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          major: string | null
          role: Database["public"]["Enums"]["app_role"]
          semester: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          major?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          semester?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          major?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          semester?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      question_views: {
        Row: {
          id: string
          question_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          question_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          question_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          difficulty: string
          has_approved_answer: boolean | null
          has_teacher_approved_answer: boolean | null
          id: string
          images: string[] | null
          latex_content: string | null
          media_files: string[] | null
          media_types: string[] | null
          title: string
          updated_at: string
          videos: string[] | null
          view_count: number
        }
        Insert: {
          author_id: string
          category: string
          content: string
          created_at?: string
          difficulty: string
          has_approved_answer?: boolean | null
          has_teacher_approved_answer?: boolean | null
          id?: string
          images?: string[] | null
          latex_content?: string | null
          media_files?: string[] | null
          media_types?: string[] | null
          title: string
          updated_at?: string
          videos?: string[] | null
          view_count?: number
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          difficulty?: string
          has_approved_answer?: boolean | null
          has_teacher_approved_answer?: boolean | null
          id?: string
          images?: string[] | null
          latex_content?: string | null
          media_files?: string[] | null
          media_types?: string[] | null
          title?: string
          updated_at?: string
          videos?: string[] | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string
          id: number
          is_active: boolean
          season_number: number
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: number
          is_active?: boolean
          season_number: number
          start_date?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: number
          is_active?: boolean
          season_number?: number
          start_date?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          exp_points: number
          id: string
          level: number
          questions_answered: number
          questions_asked: number | null
          season: number
          seasonal_exp: number
          total_exp: number | null
          trophy_rank: Database["public"]["Enums"]["trophy_rank"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exp_points?: number
          id?: string
          level?: number
          questions_answered?: number
          questions_asked?: number | null
          season?: number
          seasonal_exp?: number
          total_exp?: number | null
          trophy_rank?: Database["public"]["Enums"]["trophy_rank"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exp_points?: number
          id?: string
          level?: number
          questions_answered?: number
          questions_asked?: number | null
          season?: number
          seasonal_exp?: number
          total_exp?: number | null
          trophy_rank?: Database["public"]["Enums"]["trophy_rank"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_question_exp: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      award_user_exp: {
        Args: { p_exp_amount: number; p_user_id: string }
        Returns: undefined
      }
      calculate_level_from_total_exp: {
        Args: { total_exp: number }
        Returns: number
      }
      demote_trophy_rank: {
        Args: { current_rank: Database["public"]["Enums"]["trophy_rank"] }
        Returns: Database["public"]["Enums"]["trophy_rank"]
      }
      get_homepage_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_students: number
          questions_solved: number
          this_week_questions: number
        }[]
      }
      get_next_trophy_threshold: {
        Args: { current_rank: Database["public"]["Enums"]["trophy_rank"] }
        Returns: number
      }
      get_trophy_display: {
        Args: { rank: Database["public"]["Enums"]["trophy_rank"] }
        Returns: {
          color: string
          name: string
          next_threshold: number
        }[]
      }
      get_trophy_rank_from_exp: {
        Args: { seasonal_exp: number }
        Returns: Database["public"]["Enums"]["trophy_rank"]
      }
      get_unread_message_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_friends: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          display_name: string
          friend_id: string
          last_active: string
          status: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      increment_question_view: {
        Args: { question_id: string }
        Returns: undefined
      }
      is_chat_room_member: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
      reset_season: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_users_by_name: {
        Args: { search_term: string }
        Returns: {
          avatar_url: string
          display_name: string
          friend_status: string
          id: string
          is_friend: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "teacher"
      trophy_rank:
        | "bronze"
        | "silver"
        | "gold"
        | "platinum"
        | "diamond"
        | "radiant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "teacher"],
      trophy_rank: [
        "bronze",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "radiant",
      ],
    },
  },
} as const
