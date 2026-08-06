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
      cleanup_run_logs: {
        Row: {
          error_details: string | null
          id: string
          orphans_deleted_bytes: number
          orphans_deleted_count: number
          rejected_deleted_bytes: number
          rejected_deleted_count: number
          run_ended_at: string | null
          run_started_at: string
          status: string
        }
        Insert: {
          error_details?: string | null
          id?: string
          orphans_deleted_bytes?: number
          orphans_deleted_count?: number
          rejected_deleted_bytes?: number
          rejected_deleted_count?: number
          run_ended_at?: string | null
          run_started_at?: string
          status: string
        }
        Update: {
          error_details?: string | null
          id?: string
          orphans_deleted_bytes?: number
          orphans_deleted_count?: number
          rejected_deleted_bytes?: number
          rejected_deleted_count?: number
          run_ended_at?: string | null
          run_started_at?: string
          status?: string
        }
        Relationships: []
      }
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
          experience_preset: string
          effect_intensity: string
          effect_quality: string
          wall_layout: string
          qr_visible: boolean
          qr_cta: string
          animation_speed: string
          id: string
          max_wish_length: number
          media_quota_bytes: number
          media_reserved_bytes: number
          media_usage_bytes: number
          poster_quota_bytes: number
          poster_reserved_bytes: number
          poster_usage_bytes: number
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
          experience_preset?: string
          effect_intensity?: string
          effect_quality?: string
          wall_layout?: string
          qr_visible?: boolean
          qr_cta?: string
          animation_speed?: string
          id?: string
          max_wish_length?: number
          media_quota_bytes?: number
          media_reserved_bytes?: number
          media_usage_bytes?: number
          poster_quota_bytes?: number
          poster_reserved_bytes?: number
          poster_usage_bytes?: number
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
          experience_preset?: string
          effect_intensity?: string
          effect_quality?: string
          wall_layout?: string
          qr_visible?: boolean
          qr_cta?: string
          animation_speed?: string
          id?: string
          max_wish_length?: number
          media_quota_bytes?: number
          media_reserved_bytes?: number
          media_usage_bytes?: number
          poster_quota_bytes?: number
          poster_reserved_bytes?: number
          poster_usage_bytes?: number
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
      poster_documents: {
        Row: {
          id: string
          event_id: string
          document_version: number
          template_id: string
          template_version: number
          ratio: string
          document_json: Json
          revision: number
          thumbnail_path: string | null
          export_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          document_version?: number
          template_id: string
          template_version: number
          ratio: string
          document_json: Json
          revision?: number
          thumbnail_path?: string | null
          export_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          document_version?: number
          template_id?: string
          template_version?: number
          ratio?: string
          document_json?: Json
          revision?: number
          thumbnail_path?: string | null
          export_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poster_documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      poster_assets: {
        Row: {
          id: string
          document_id: string
          event_id: string
          asset_id: string
          asset_role: string
          storage_bucket: string
          storage_path: string
          mime_type: string
          size_bytes: number
          width: number | null
          height: number | null
          metadata: Json
          processing_status: string
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          event_id: string
          asset_id: string
          asset_role: string
          storage_bucket?: string
          storage_path: string
          mime_type: string
          size_bytes: number
          width?: number | null
          height?: number | null
          metadata?: Json
          processing_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          event_id?: string
          asset_id?: string
          asset_role?: string
          storage_bucket?: string
          storage_path?: string
          mime_type?: string
          size_bytes?: number
          width?: number | null
          height?: number | null
          metadata?: Json
          processing_status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poster_assets_document_id_event_id_fkey"
            columns: ["document_id", "event_id"]
            isOneToOne: false
            referencedRelation: "poster_documents"
            referencedColumns: ["id", "event_id"]
          },
        ]
      }
      poster_asset_upload_sessions: {
        Row: {
          id: string
          document_id: string
          event_id: string
          asset_id: string
          storage_bucket: string
          storage_path: string
          mime_type: string
          max_size_bytes: number
          reservation_bytes: number
          created_at: string
          expires_at: string
          consumed_at: string | null
        }
        Insert: {
          id?: string
          document_id: string
          event_id: string
          asset_id: string
          storage_bucket?: string
          storage_path: string
          mime_type: string
          max_size_bytes: number
          reservation_bytes?: number
          created_at?: string
          expires_at: string
          consumed_at?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          event_id?: string
          asset_id?: string
          storage_bucket?: string
          storage_path?: string
          mime_type?: string
          max_size_bytes?: number
          reservation_bytes?: number
          created_at?: string
          expires_at?: string
          consumed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poster_asset_upload_sessions_document_id_event_id_fkey"
            columns: ["document_id", "event_id"]
            isOneToOne: false
            referencedRelation: "poster_documents"
            referencedColumns: ["id", "event_id"]
          },
        ]
      },
      media_upload_sessions: {
        Row: {
          asset_role: string
          client_request_id: string
          consumed_at: string | null
          created_at: string
          event_id: string
          expires_at: string
          id: string
          max_size_bytes: number
          media_type: string
          mime_type: string
          reservation_bytes: number | null
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          asset_role: string
          client_request_id: string
          consumed_at?: string | null
          created_at?: string
          event_id: string
          expires_at: string
          id?: string
          max_size_bytes: number
          media_type: string
          mime_type: string
          reservation_bytes?: number | null
          storage_bucket?: string
          storage_path: string
        }
        Update: {
          asset_role?: string
          client_request_id?: string
          consumed_at?: string | null
          created_at?: string
          event_id?: string
          expires_at?: string
          id?: string
          max_size_bytes?: number
          media_type?: string
          mime_type?: string
          reservation_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_upload_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      realtime_wall_events: {
        Row: {
          action: string
          created_at: string
          event_id: string
          id: number
          payload: Json | null
          wish_id: string
        }
        Insert: {
          action: string
          created_at?: string
          event_id: string
          id?: never
          payload?: Json | null
          wish_id: string
        }
        Update: {
          action?: string
          created_at?: string
          event_id?: string
          id?: never
          payload?: Json | null
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "realtime_wall_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
            isOneToOne: true
            referencedRelation: "public_wishes_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wish_media_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: true
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
          media: Json | null
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
      create_media_upload_session: {
        Args: {
          p_asset_role: string
          p_client_request_id: string
          p_event_id: string
          p_expires_at: string
          p_max_size_bytes: number
          p_media_type: string
          p_mime_type: string
          p_storage_bucket: string
          p_storage_path: string
        }
        Returns: string
      }
      create_poster_asset_upload_session: {
        Args: {
          p_asset_id: string
          p_document_id: string
          p_event_id: string
          p_expires_at: string
          p_max_size_bytes: number
          p_mime_type: string
          p_storage_path: string
        }
        Returns: string
      }
      get_poster_assets_to_cleanup: {
        Args: never
        Returns: {
          size_bytes: number
          storage_path: string
        }[]
      },
      get_media_to_cleanup: {
        Args: never
        Returns: {
          cleanup_type: string
          media_id: string
          size_bytes: number
          storage_path: string
        }[]
      }
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
      submit_wish_transaction:
        | {
            Args: {
              p_client_request_id: string
              p_content: string
              p_device_hash: string
              p_device_limit?: number
              p_event_id: string
              p_event_limit?: number
              p_ip_hash: string
              p_ip_limit?: number
              p_media_duration_ms?: number
              p_media_height?: number
              p_media_mime_type?: string
              p_media_path?: string
              p_media_size_bytes?: number
              p_media_type?: string
              p_media_width?: number
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
        | {
            Args: {
              p_client_request_id: string
              p_content: string
              p_device_hash: string
              p_device_limit?: number
              p_event_id: string
              p_event_limit?: number
              p_ip_hash: string
              p_ip_limit?: number
              p_media_duration_ms?: number
              p_media_height?: number
              p_media_mime_type?: string
              p_media_path?: string
              p_media_size_bytes?: number
              p_media_type?: string
              p_media_width?: number
              p_sender_avatar_path: string
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
      toggle_wish_reaction: {
        Args: {
          p_actor_id: string
          p_actor_key_hash: string
          p_emoji: string
          p_wish_id: string
        }
        Returns: boolean
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
