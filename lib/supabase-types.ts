export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          instagram_handle: string | null;
          linkedin_slug: string | null;
          instagram_url: string | null;
          linkedin_url: string | null;
          github_username: string | null;
          github_url: string | null;
          status: "active" | "flagged" | "hidden" | "expired";
          created_at: string;
          updated_at: string;
          expires_at: string;
          edit_token_hash: string;
          report_count: number;
        };
        Insert: {
          id: string;
          display_name: string;
          instagram_handle?: string | null;
          linkedin_slug?: string | null;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          github_username?: string | null;
          github_url?: string | null;
          status?: "active" | "flagged" | "hidden" | "expired";
          created_at?: string;
          updated_at?: string;
          expires_at: string;
          edit_token_hash: string;
          report_count?: number;
        };
        Update: {
          id?: string;
          display_name?: string;
          instagram_handle?: string | null;
          linkedin_slug?: string | null;
          instagram_url?: string | null;
          linkedin_url?: string | null;
          github_username?: string | null;
          github_url?: string | null;
          status?: "active" | "flagged" | "hidden" | "expired";
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
          edit_token_hash?: string;
          report_count?: number;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          profile_id: string;
          reason: string | null;
          created_at: string;
          reporter_ip_hash: string;
        };
        Insert: {
          id: string;
          profile_id: string;
          reason?: string | null;
          created_at?: string;
          reporter_ip_hash: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          reason?: string | null;
          created_at?: string;
          reporter_ip_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      admin_profiles: {
        Row: Database["public"]["Tables"]["profiles"]["Row"] & {
          admin_priority: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      expire_profiles: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      report_profile: {
        Args: {
          p_profile_id: string;
          p_report_id: string;
          p_reason: string | null;
          p_reporter_ip_hash: string;
          p_flag_threshold: number;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"][];
      };
      merge_profiles: {
        Args: {
          p_source_profile_id: string;
          p_target_profile_id: string;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"][];
      };
    };
    Enums: Record<PropertyKey, never>;
    CompositeTypes: Record<PropertyKey, never>;
  };
}
