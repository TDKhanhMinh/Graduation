export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          allow_ai: boolean
          allow_audio: boolean
          allow_images: boolean
          archived_at: string | null
          cover_path: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          event_date: string | null
          id: string
          max_wish_length: number
          owner_id: string
          settings: Json
          slug: string
          submission_mode: string
          theme_key: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          allow_ai?: boolean
          allow_audio?: boolean
          allow_images?: boolean
          archived_at?: string | null
          cover_path?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          max_wish_length?: number
          owner_id: string
          settings?: Json
          slug: string
          submission_mode?: string
          theme_key?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          allow_ai?: boolean
          allow_audio?: boolean
          allow_images?: boolean
          archived_at?: string | null
          cover_path?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          max_wish_length?: number
          owner_id?: string
          settings?: Json
          slug?: string
          submission_mode?: string
          theme_key?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      moderation_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          event_id: string
          id: number
          new_value: Json | null
          old_value: Json | null
          wish_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          event_id: string
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          wish_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          event_id?: string
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          wish_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_audit_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_audit_logs_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "public_wishes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_audit_logs_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
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
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      wish_media: {
        Row: {
          created_at: string
          duration_ms: number | null
          height: number | null
          id: string
          media_type: string
          mime_type: string
          processing_status: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
          width: number | null
          wish_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          height?: number | null
          id?: string
          media_type: string
          mime_type: string
          processing_status?: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
          width?: number | null
          wish_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          height?: number | null
          id?: string
          media_type?: string
          mime_type?: string
          processing_status?: string
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          width?: number | null
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_media_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "public_wishes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wish_media_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_reactions: {
        Row: {
          actor_id: string | null
          actor_key_hash: string | null
          created_at: string
          emoji: string
          id: string
          wish_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_key_hash?: string | null
          created_at?: string
          emoji: string
          id?: string
          wish_id: string
        }
        Update: {
          actor_id?: string | null
          actor_key_hash?: string | null
          created_at?: string
          emoji?: string
          id?: string
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_reactions_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "public_wishes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wish_reactions_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      wishes: {
        Row: {
          approved_at: string | null
          author_id: string | null
          client_request_id: string
          content: string | null
          created_at: string
          deleted_at: string | null
          event_id: string
          id: string
          is_pinned: boolean
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string
          sender_avatar_path: string | null
          sender_name: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          author_id?: string | null
          client_request_id: string
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          event_id: string
          id?: string
          is_pinned?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          sender_avatar_path?: string | null
          sender_name: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          author_id?: string | null
          client_request_id?: string
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          event_id?: string
          id?: string
          is_pinned?: boolean
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string
          sender_avatar_path?: string | null
          sender_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_wishes_view: {
        Row: {
          content: string | null
          created_at: string | null
          event_id: string | null
          id: string | null
          is_pinned: boolean | null
          sender_avatar_path: string | null
          sender_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      moderate_wishes: {
        Args: {
          p_action: string
          p_expected_versions?: Json
          p_reason?: string
          p_wish_ids: string[]
        }
        Returns: {
          audit_id: number
          deleted_at: string
          is_pinned: boolean
          moderation_status: string
          updated_at: string
          wish_id: string
        }[]
      }
      submit_wish_transaction: {
        Args: {
          p_client_request_id: string
          p_content: string
          p_device_hash: string
          p_device_limit?: number
          p_event_id: string
          p_event_limit?: number
          p_ip_hash: string
          p_ip_limit?: number
          p_sender_name: string
          p_window_seconds?: number
        }
        Returns: {
          created_at: string
          max_wish_length: number
          moderation_status: string
          result_code: string
          retry_after_seconds: number
          was_duplicate: boolean
          wish_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

