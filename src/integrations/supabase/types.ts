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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          organization_id: string
        }
        Insert: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          organization_id: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          accessories: string | null
          brand: string
          client_id: string
          condition: string | null
          created_at: string
          id: string
          model: string
          organization_id: string
          serial_number: string | null
          type: string
          updated_at: string
        }
        Insert: {
          accessories?: string | null
          brand: string
          client_id: string
          condition?: string | null
          created_at?: string
          id?: string
          model: string
          organization_id: string
          serial_number?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          accessories?: string | null
          brand?: string
          client_id?: string
          condition?: string | null
          created_at?: string
          id?: string
          model?: string
          organization_id?: string
          serial_number?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          buy_price: number
          category: string
          created_at: string
          id: string
          min_quantity: number
          name: string
          organization_id: string
          quantity: number
          sell_price: number
          sku: string | null
          supplier: string | null
          updated_at: string
        }
        Insert: {
          buy_price?: number
          category?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name: string
          organization_id: string
          quantity?: number
          sell_price?: number
          sku?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          buy_price?: number
          category?: string
          created_at?: string
          id?: string
          min_quantity?: number
          name?: string
          organization_id?: string
          quantity?: number
          sell_price?: number
          sku?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          lines: Json
          notes: string | null
          organization_id: string
          paid_amount: number
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          quote_id: string | null
          reference: string
          repair_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          total_ht: number
          total_ttc: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          lines?: Json
          notes?: string | null
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          quote_id?: string | null
          reference: string
          repair_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_ht?: number
          total_ttc?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          lines?: Json
          notes?: string | null
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          quote_id?: string | null
          reference?: string
          repair_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_ht?: number
          total_ttc?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repairs"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          invoice_prefix: string
          logo_url: string | null
          name: string
          phone: string | null
          quote_prefix: string
          siret: string | null
          updated_at: string
          vat_rate: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          quote_prefix?: string
          siret?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          quote_prefix?: string
          siret?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          client_id: string | null
          created_at: string
          device_id: string | null
          id: string
          lines: Json
          notes: string | null
          organization_id: string
          reference: string
          repair_id: string | null
          status: Database["public"]["Enums"]["quote_status"]
          total_ht: number
          total_ttc: number
          updated_at: string
          valid_until: string | null
          vat_rate: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          lines?: Json
          notes?: string | null
          organization_id: string
          reference: string
          repair_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          total_ht?: number
          total_ttc?: number
          updated_at?: string
          valid_until?: string | null
          vat_rate?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          lines?: Json
          notes?: string | null
          organization_id?: string
          reference?: string
          repair_id?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          total_ht?: number
          total_ttc?: number
          updated_at?: string
          valid_until?: string | null
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repairs"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_templates: {
        Row: {
          avg_price: number | null
          avg_time_minutes: number
          created_at: string
          created_by: string | null
          device_brand: string | null
          device_model: string | null
          device_type: string
          difficulty: string
          id: string
          is_public: boolean
          organization_id: string | null
          parts_needed: Json | null
          repair_type: string
          tips: string | null
          updated_at: string
        }
        Insert: {
          avg_price?: number | null
          avg_time_minutes?: number
          created_at?: string
          created_by?: string | null
          device_brand?: string | null
          device_model?: string | null
          device_type: string
          difficulty?: string
          id?: string
          is_public?: boolean
          organization_id?: string | null
          parts_needed?: Json | null
          repair_type: string
          tips?: string | null
          updated_at?: string
        }
        Update: {
          avg_price?: number | null
          avg_time_minutes?: number
          created_at?: string
          created_by?: string | null
          device_brand?: string | null
          device_model?: string | null
          device_type?: string
          difficulty?: string
          id?: string
          is_public?: boolean
          organization_id?: string | null
          parts_needed?: Json | null
          repair_type?: string
          tips?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      repairs: {
        Row: {
          client_id: string | null
          created_at: string
          device_id: string | null
          diagnostic: string | null
          estimated_completion: string | null
          estimated_price: number | null
          final_price: number | null
          id: string
          internal_notes: string | null
          issue: string
          organization_id: string
          parts_used: Json | null
          photos: Json | null
          reference: string
          status: Database["public"]["Enums"]["repair_status"]
          technician_id: string | null
          technician_message: string | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          device_id?: string | null
          diagnostic?: string | null
          estimated_completion?: string | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          internal_notes?: string | null
          issue: string
          organization_id: string
          parts_used?: Json | null
          photos?: Json | null
          reference: string
          status?: Database["public"]["Enums"]["repair_status"]
          technician_id?: string | null
          technician_message?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          device_id?: string | null
          diagnostic?: string | null
          estimated_completion?: string | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          internal_notes?: string | null
          issue?: string
          organization_id?: string
          parts_used?: Json | null
          photos?: Json | null
          reference?: string
          status?: Database["public"]["Enums"]["repair_status"]
          technician_id?: string | null
          technician_message?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repairs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
          profile_id: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
          profile_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          profile_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technicians_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technicians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      create_deposit_repair: {
        Args: {
          _client_name: string
          _client_phone: string
          _deposit_code: string
          _device_brand: string
          _device_model: string
          _device_type: string
          _issue: string
        }
        Returns: Json
      }
      get_user_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "technician"
      invoice_status: "brouillon" | "envoyee" | "payee" | "partiel" | "annulee"
      payment_method: "cb" | "especes" | "virement" | "cheque" | "autre"
      quote_status: "brouillon" | "envoye" | "accepte" | "refuse"
      repair_status:
        | "nouveau"
        | "diagnostic"
        | "en_cours"
        | "en_attente_piece"
        | "termine"
        | "pret_a_recuperer"
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
      app_role: ["admin", "technician"],
      invoice_status: ["brouillon", "envoyee", "payee", "partiel", "annulee"],
      payment_method: ["cb", "especes", "virement", "cheque", "autre"],
      quote_status: ["brouillon", "envoye", "accepte", "refuse"],
      repair_status: [
        "nouveau",
        "diagnostic",
        "en_cours",
        "en_attente_piece",
        "termine",
        "pret_a_recuperer",
      ],
    },
  },
} as const
