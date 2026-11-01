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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          order_count: number
          phone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          order_count?: number
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          order_count?: number
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_events: {
        Row: {
          created_at: string
          id: string
          label: string
          order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_files: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          order_id: string
          path: string
          size: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          order_id: string
          path: string
          size?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          order_id?: string
          path?: string
          size?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          amount_paid: number
          breakdown: Json
          client_email: string
          client_id: string | null
          client_name: string
          client_phone: string
          complexity: string
          created_at: string
          deadline: string
          delivery_format: string
          id: string
          is_repeat: boolean
          notes: string | null
          paid_at: string | null
          payment_ref: string | null
          payment_status: string
          quantity: number
          service_key: string
          status: string
          tracking_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          amount_paid?: number
          breakdown?: Json
          client_email: string
          client_id?: string | null
          client_name: string
          client_phone: string
          complexity?: string
          created_at?: string
          deadline: string
          delivery_format?: string
          id?: string
          is_repeat?: boolean
          notes?: string | null
          paid_at?: string | null
          payment_ref?: string | null
          payment_status?: string
          quantity?: number
          service_key: string
          status?: string
          tracking_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          amount_paid?: number
          breakdown?: Json
          client_email?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string
          complexity?: string
          created_at?: string
          deadline?: string
          delivery_format?: string
          id?: string
          is_repeat?: boolean
          notes?: string | null
          paid_at?: string | null
          payment_ref?: string | null
          payment_status?: string
          quantity?: number
          service_key?: string
          status?: string
          tracking_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_settings: {
        Row: {
          binding_base: number
          binding_per_50_pages: number
          complexity_advanced: number
          complexity_expert: number
          complexity_standard: number
          id: number
          print_per_page: number
          returning_discount_pct: number
          updated_at: string
          urgency_24h_pct: number
          urgency_72h_pct: number
          urgency_7d_pct: number
        }
        Insert: {
          binding_base?: number
          binding_per_50_pages?: number
          complexity_advanced?: number
          complexity_expert?: number
          complexity_standard?: number
          id?: number
          print_per_page?: number
          returning_discount_pct?: number
          updated_at?: string
          urgency_24h_pct?: number
          urgency_72h_pct?: number
          urgency_7d_pct?: number
        }
        Update: {
          binding_base?: number
          binding_per_50_pages?: number
          complexity_advanced?: number
          complexity_expert?: number
          complexity_standard?: number
          id?: number
          print_per_page?: number
          returning_discount_pct?: number
          updated_at?: string
          urgency_24h_pct?: number
          urgency_72h_pct?: number
          urgency_7d_pct?: number
        }
        Relationships: []
      }
      service_rates: {
        Row: {
          base_rate: number
          floor_price: number
          label: string
          service_key: string
          sort_order: number
          unit_label: string
          updated_at: string
        }
        Insert: {
          base_rate: number
          floor_price: number
          label: string
          service_key: string
          sort_order?: number
          unit_label?: string
          updated_at?: string
        }
        Update: {
          base_rate?: number
          floor_price?: number
          label?: string
          service_key?: string
          sort_order?: number
          unit_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      app_role: "admin" | "client"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "client"],
    },
  },
} as const
