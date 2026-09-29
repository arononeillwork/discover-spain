export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      airport_options: {
        Row: {
          detail: string;
          id: number;
          name: string;
          sort_order: number;
          url: string | null;
        };
        Insert: {
          detail: string;
          id?: never;
          name: string;
          sort_order?: number;
          url?: string | null;
        };
        Update: {
          detail?: string;
          id?: never;
          name?: string;
          sort_order?: number;
          url?: string | null;
        };
        Relationships: [];
      };
      content_blocks: {
        Row: {
          body: string;
          key: string;
        };
        Insert: {
          body: string;
          key: string;
        };
        Update: {
          body?: string;
          key?: string;
        };
        Relationships: [];
      };
      guide_steps: {
        Row: {
          detail: string;
          guide_slug: string;
          id: number;
          link_label: string | null;
          link_url: string | null;
          position: number;
          title: string;
        };
        Insert: {
          detail: string;
          guide_slug: string;
          id?: never;
          link_label?: string | null;
          link_url?: string | null;
          position: number;
          title: string;
        };
        Update: {
          detail?: string;
          guide_slug?: string;
          id?: never;
          link_label?: string | null;
          link_url?: string | null;
          position?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guide_steps_guide_slug_fkey";
            columns: ["guide_slug"];
            isOneToOne: false;
            referencedRelation: "guides";
            referencedColumns: ["slug"];
          },
        ];
      };
      guides: {
        Row: {
          category: string;
          cost: string;
          created_at: string;
          documents: string[];
          links: NonNullable<Json>;
          path_position: number | null;
          published: boolean;
          reviewed_on: string;
          slug: string;
          sort_order: number;
          summary: string;
          time_estimate: string;
          tips: string[];
          title: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          cost: string;
          created_at?: string;
          documents?: string[];
          links?: NonNullable<Json>;
          path_position?: number | null;
          published?: boolean;
          reviewed_on?: string;
          slug: string;
          sort_order?: number;
          summary: string;
          time_estimate: string;
          tips?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          cost?: string;
          created_at?: string;
          documents?: string[];
          links?: NonNullable<Json>;
          path_position?: number | null;
          published?: boolean;
          reviewed_on?: string;
          slug?: string;
          sort_order?: number;
          summary?: string;
          time_estimate?: string;
          tips?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      health_points: {
        Row: {
          detail: string;
          id: number;
          section_id: string;
          sort_order: number;
          title: string;
        };
        Insert: {
          detail: string;
          id?: never;
          section_id: string;
          sort_order?: number;
          title: string;
        };
        Update: {
          detail?: string;
          id?: never;
          section_id?: string;
          sort_order?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "health_points_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "health_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      health_sections: {
        Row: {
          id: string;
          intro: string;
          links: NonNullable<Json>;
          sort_order: number;
          title: string;
        };
        Insert: {
          id: string;
          intro: string;
          links?: NonNullable<Json>;
          sort_order?: number;
          title: string;
        };
        Update: {
          id?: string;
          intro?: string;
          links?: NonNullable<Json>;
          sort_order?: number;
          title?: string;
        };
        Relationships: [];
      };
      mortgage_facts: {
        Row: {
          id: number;
          label: string;
          sort_order: number;
          value: string;
        };
        Insert: {
          id?: never;
          label: string;
          sort_order?: number;
          value: string;
        };
        Update: {
          id?: never;
          label?: string;
          sort_order?: number;
          value?: string;
        };
        Relationships: [];
      };
      purchase_fees: {
        Row: {
          fixed_max: number | null;
          fixed_min: number | null;
          id: number;
          name: string;
          new_build_pct: number | null;
          note: string;
          plus_vat: boolean;
          resale_pct: number | null;
          sort_order: number;
        };
        Insert: {
          fixed_max?: number | null;
          fixed_min?: number | null;
          id?: never;
          name: string;
          new_build_pct?: number | null;
          note: string;
          plus_vat?: boolean;
          resale_pct?: number | null;
          sort_order?: number;
        };
        Update: {
          fixed_max?: number | null;
          fixed_min?: number | null;
          id?: never;
          name?: string;
          new_build_pct?: number | null;
          note?: string;
          plus_vat?: boolean;
          resale_pct?: number | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      rate_types: {
        Row: {
          detail: string;
          id: number;
          name: string;
          sort_order: number;
        };
        Insert: {
          detail: string;
          id?: never;
          name: string;
          sort_order?: number;
        };
        Update: {
          detail?: string;
          id?: never;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      resource_links: {
        Row: {
          id: number;
          label: string;
          note: string | null;
          section: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          id?: never;
          label: string;
          note?: string | null;
          section: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          id?: never;
          label?: string;
          note?: string | null;
          section?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [];
      };
      ride_options: {
        Row: {
          airport: string;
          best_for: string;
          booking: string;
          cons: string[];
          highlighted: boolean;
          id: number;
          kind: string;
          name: string;
          pricing: string;
          pros: string[];
          sort_order: number;
          url: string;
        };
        Insert: {
          airport: string;
          best_for: string;
          booking: string;
          cons?: string[];
          highlighted?: boolean;
          id?: never;
          kind: string;
          name: string;
          pricing: string;
          pros?: string[];
          sort_order?: number;
          url: string;
        };
        Update: {
          airport?: string;
          best_for?: string;
          booking?: string;
          cons?: string[];
          highlighted?: boolean;
          id?: never;
          kind?: string;
          name?: string;
          pricing?: string;
          pros?: string[];
          sort_order?: number;
          url?: string;
        };
        Relationships: [];
      };
      trade_categories: {
        Row: {
          name: string;
          sort_order: number;
        };
        Insert: {
          name: string;
          sort_order?: number;
        };
        Update: {
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      tradespeople: {
        Row: {
          areas: string[];
          created_at: string;
          id: string;
          is_placeholder: boolean;
          languages: string[];
          name: string;
          notes: string;
          phone: string;
          recommended_by: string | null;
          status: string;
          submitted_by: string | null;
          trade: string;
          verified: boolean;
          whatsapp: string | null;
        };
        Insert: {
          areas?: string[];
          created_at?: string;
          id?: string;
          is_placeholder?: boolean;
          languages?: string[];
          name: string;
          notes?: string;
          phone: string;
          recommended_by?: string | null;
          status?: string;
          submitted_by?: string | null;
          trade: string;
          verified?: boolean;
          whatsapp?: string | null;
        };
        Update: {
          areas?: string[];
          created_at?: string;
          id?: string;
          is_placeholder?: boolean;
          languages?: string[];
          name?: string;
          notes?: string;
          phone?: string;
          recommended_by?: string | null;
          status?: string;
          submitted_by?: string | null;
          trade?: string;
          verified?: boolean;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tradespeople_trade_fkey";
            columns: ["trade"];
            isOneToOne: false;
            referencedRelation: "trade_categories";
            referencedColumns: ["name"];
          },
        ];
      };
      user_progress: {
        Row: {
          completed_at: string;
          step_id: number;
          user_id: string;
        };
        Insert: {
          completed_at?: string;
          step_id: number;
          user_id?: string;
        };
        Update: {
          completed_at?: string;
          step_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_progress_step_id_fkey";
            columns: ["step_id"];
            isOneToOne: false;
            referencedRelation: "guide_steps";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
