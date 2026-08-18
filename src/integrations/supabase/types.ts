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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: number
          lesson_slug: string | null
          path: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: number
          lesson_slug?: string | null
          path?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: number
          lesson_slug?: string | null
          path?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          body: string
          id: string
          key: string
          label: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          id?: string
          key: string
          label: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          id?: string
          key?: string
          label?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_sources: {
        Row: {
          id: string
          lesson_id: string
          organization: string | null
          published_on: string | null
          sort_order: number
          title: string
          url: string
        }
        Insert: {
          id?: string
          lesson_id: string
          organization?: string | null
          published_on?: string | null
          sort_order?: number
          title: string
          url: string
        }
        Update: {
          id?: string
          lesson_id?: string
          organization?: string | null
          published_on?: string | null
          sort_order?: number
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          category: string
          challenge: Json
          created_at: string
          difficulty: string
          emoji: string
          example: Json
          explanation: Json
          id: string
          interactive: Json | null
          level_id: string | null
          minutes: number
          recap: Json
          slug: string
          sort_order: number
          status: string
          summary: string
          title: string
          updated_at: string
          xp: number
        }
        Insert: {
          category?: string
          challenge?: Json
          created_at?: string
          difficulty?: string
          emoji?: string
          example?: Json
          explanation?: Json
          id?: string
          interactive?: Json | null
          level_id?: string | null
          minutes?: number
          recap?: Json
          slug: string
          sort_order?: number
          status?: string
          summary?: string
          title: string
          updated_at?: string
          xp?: number
        }
        Update: {
          category?: string
          challenge?: Json
          created_at?: string
          difficulty?: string
          emoji?: string
          example?: Json
          explanation?: Json
          id?: string
          interactive?: Json | null
          level_id?: string | null
          minutes?: number
          recap?: Json
          slug?: string
          sort_order?: number
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          created_at: string
          emoji: string
          id: string
          locked: boolean
          number: number
          published: boolean
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          locked?: boolean
          number: number
          published?: boolean
          sort_order?: number
          subtitle?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          locked?: boolean
          number?: number
          published?: boolean
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          accepts: Json
          answer: string
          explanation: string
          id: string
          kind: string
          lesson_id: string
          options: Json
          prompt: string
          sort_order: number
          type: string
          xp: number
        }
        Insert: {
          accepts?: Json
          answer?: string
          explanation?: string
          id?: string
          kind?: string
          lesson_id: string
          options?: Json
          prompt: string
          sort_order?: number
          type?: string
          xp?: number
        }
        Update: {
          accepts?: Json
          answer?: string
          explanation?: string
          id?: string
          kind?: string
          lesson_id?: string
          options?: Json
          prompt?: string
          sort_order?: number
          type?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          author_name: string
          avatar_url: string | null
          contact_email: string | null
          default_language: string
          extra_links: Json
          favicon_url: string | null
          ga_measurement_id: string | null
          id: number
          instagram_url: string | null
          logo_url: string | null
          seo_description: string | null
          seo_title: string | null
          site_description: string
          site_name: string
          social_image_url: string | null
          telegram_url: string | null
          updated_at: string
        }
        Insert: {
          author_name?: string
          avatar_url?: string | null
          contact_email?: string | null
          default_language?: string
          extra_links?: Json
          favicon_url?: string | null
          ga_measurement_id?: string | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          site_description?: string
          site_name?: string
          social_image_url?: string | null
          telegram_url?: string | null
          updated_at?: string
        }
        Update: {
          author_name?: string
          avatar_url?: string | null
          contact_email?: string | null
          default_language?: string
          extra_links?: Json
          favicon_url?: string | null
          ga_measurement_id?: string | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          site_description?: string
          site_name?: string
          social_image_url?: string | null
          telegram_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
