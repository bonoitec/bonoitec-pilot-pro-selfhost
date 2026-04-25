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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          id: string
          target_description: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          target_description?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_description?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_quantity: number
          name: string
          organization_id: string
          price: number
          quantity: number
          sku: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          name: string
          organization_id: string
          price?: number
          quantity?: number
          sku?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          name?: string
          organization_id?: string
          price?: number
          quantity?: number
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string
          id: string
          published: boolean
          published_at: string | null
          read_time_minutes: number | null
          sections: Json
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          category: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt: string
          id?: string
          published?: boolean
          published_at?: string | null
          read_time_minutes?: number | null
          sections?: Json
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string | null
          read_time_minutes?: number | null
          sections?: Json
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
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
      device_catalog: {
        Row: {
          brand: string
          category: string
          color_variants: Json | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          model: string
          model_number: string | null
          release_year: number | null
          storage_variants: Json | null
          updated_at: string
        }
        Insert: {
          brand: string
          category?: string
          color_variants?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          model: string
          model_number?: string | null
          release_year?: number | null
          storage_variants?: Json | null
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          color_variants?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          model?: string
          model_number?: string | null
          release_year?: number | null
          storage_variants?: Json | null
          updated_at?: string
        }
        Relationships: []
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
          compatible_brand: string | null
          compatible_model: string | null
          created_at: string
          device_compatibility: string | null
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
          compatible_brand?: string | null
          compatible_model?: string | null
          created_at?: string
          device_compatibility?: string | null
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
          compatible_brand?: string | null
          compatible_model?: string | null
          created_at?: string
          device_compatibility?: string | null
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
      inventory_price_history: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          new_price: number
          old_price: number
          organization_id: string
          supplier: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          new_price?: number
          old_price?: number
          organization_id: string
          supplier?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          new_price?: number
          old_price?: number
          organization_id?: string
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_price_history_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_price_history_organization_id_fkey"
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
      notification_logs: {
        Row: {
          body: string
          channel: string
          created_at: string
          error_message: string | null
          id: string
          organization_id: string
          recipient: string
          repair_id: string
          status: string
          subject: string | null
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id: string
          recipient: string
          repair_id: string
          status?: string
          subject?: string | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          organization_id?: string
          recipient?: string
          repair_id?: string
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repairs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          status_trigger: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          status_trigger: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          status_trigger?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          ape_code: string | null
          article_categories: Json
          checklist_label: string
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          google_review_url: string | null
          id: string
          intake_checklist_items: Json | null
          invoice_footer: string | null
          invoice_prefix: string
          legal_status: string | null
          logo_url: string | null
          name: string
          past_due_since: string | null
          phone: string | null
          plan_name: string | null
          postal_code: string | null
          quote_prefix: string
          siret: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          vat_enabled: boolean
          vat_number: string | null
          vat_rate: number
          website: string | null
        }
        Insert: {
          address?: string | null
          ape_code?: string | null
          article_categories?: Json
          checklist_label?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          google_review_url?: string | null
          id?: string
          intake_checklist_items?: Json | null
          invoice_footer?: string | null
          invoice_prefix?: string
          legal_status?: string | null
          logo_url?: string | null
          name: string
          past_due_since?: string | null
          phone?: string | null
          plan_name?: string | null
          postal_code?: string | null
          quote_prefix?: string
          siret?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          vat_enabled?: boolean
          vat_number?: string | null
          vat_rate?: number
          website?: string | null
        }
        Update: {
          address?: string | null
          ape_code?: string | null
          article_categories?: Json
          checklist_label?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          google_review_url?: string | null
          id?: string
          intake_checklist_items?: Json | null
          invoice_footer?: string | null
          invoice_prefix?: string
          legal_status?: string | null
          logo_url?: string | null
          name?: string
          past_due_since?: string | null
          phone?: string | null
          plan_name?: string | null
          postal_code?: string | null
          quote_prefix?: string
          siret?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          vat_enabled?: boolean
          vat_number?: string | null
          vat_rate?: number
          website?: string | null
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
      purchase_history: {
        Row: {
          created_at: string
          id: string
          inventory_id: string | null
          notes: string | null
          order_number: string | null
          organization_id: string
          purchased_at: string
          quantity: number
          supplier: string | null
          total_ht: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id?: string | null
          notes?: string | null
          order_number?: string | null
          organization_id: string
          purchased_at?: string
          quantity?: number
          supplier?: string | null
          total_ht?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string | null
          notes?: string | null
          order_number?: string | null
          organization_id?: string
          purchased_at?: string
          quantity?: number
          supplier?: string | null
          total_ht?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_history_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_history_organization_id_fkey"
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
      rate_limit_hits: {
        Row: {
          created_at: string
          id: string
          key: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      repair_messages: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          organization_id: string
          read_at: string | null
          repair_id: string
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          organization_id: string
          read_at?: string | null
          repair_id: string
          sender_name?: string | null
          sender_type: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          organization_id?: string
          read_at?: string | null
          repair_id?: string
          sender_name?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_messages_repair_id_fkey"
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
          back_condition: number | null
          client_id: string | null
          created_at: string
          customer_signature_url: string | null
          device_id: string | null
          diagnostic: string | null
          estimated_completion: string | null
          estimated_price: number | null
          estimated_time_minutes: number | null
          final_price: number | null
          frame_condition: number | null
          id: string
          intake_checklist: Json | null
          internal_notes: string | null
          issue: string
          labor_cost: number | null
          organization_id: string
          parts_used: Json | null
          payment_method: string | null
          photos: Json | null
          reference: string
          repair_ended_at: string | null
          repair_started_at: string | null
          screen_condition: number | null
          services_used: Json | null
          status: Database["public"]["Enums"]["repair_status"]
          technician_id: string | null
          technician_message: string | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          back_condition?: number | null
          client_id?: string | null
          created_at?: string
          customer_signature_url?: string | null
          device_id?: string | null
          diagnostic?: string | null
          estimated_completion?: string | null
          estimated_price?: number | null
          estimated_time_minutes?: number | null
          final_price?: number | null
          frame_condition?: number | null
          id?: string
          intake_checklist?: Json | null
          internal_notes?: string | null
          issue: string
          labor_cost?: number | null
          organization_id: string
          parts_used?: Json | null
          payment_method?: string | null
          photos?: Json | null
          reference: string
          repair_ended_at?: string | null
          repair_started_at?: string | null
          screen_condition?: number | null
          services_used?: Json | null
          status?: Database["public"]["Enums"]["repair_status"]
          technician_id?: string | null
          technician_message?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          back_condition?: number | null
          client_id?: string | null
          created_at?: string
          customer_signature_url?: string | null
          device_id?: string | null
          diagnostic?: string | null
          estimated_completion?: string | null
          estimated_price?: number | null
          estimated_time_minutes?: number | null
          final_price?: number | null
          frame_condition?: number | null
          id?: string
          intake_checklist?: Json | null
          internal_notes?: string | null
          issue?: string
          labor_cost?: number | null
          organization_id?: string
          parts_used?: Json | null
          payment_method?: string | null
          photos?: Json | null
          reference?: string
          repair_ended_at?: string | null
          repair_started_at?: string | null
          screen_condition?: number | null
          services_used?: Json | null
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
          {
            foreignKeyName: "repairs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          compatible_brand: string | null
          compatible_categories: Json | null
          compatible_model: string | null
          created_at: string
          default_price: number
          description: string | null
          estimated_time_minutes: number
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          compatible_brand?: string | null
          compatible_categories?: Json | null
          compatible_model?: string | null
          created_at?: string
          default_price?: number
          description?: string | null
          estimated_time_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          compatible_brand?: string | null
          compatible_categories?: Json | null
          compatible_model?: string | null
          created_at?: string
          default_price?: number
          description?: string | null
          estimated_time_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          received_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          received_at?: string
        }
        Relationships: []
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
      trial_history: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          organization_id: string | null
          trial_end_date: string | null
          trial_start_date: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          organization_id?: string | null
          trial_end_date?: string | null
          trial_start_date?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          organization_id?: string | null
          trial_end_date?: string | null
          trial_start_date?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _admin_log_action: {
        Args: {
          _action: string
          _details: Json
          _target_description: string
          _target_id: string
          _target_type: string
        }
        Returns: undefined
      }
      _require_reason: { Args: { _reason: string }; Returns: undefined }
      _require_super_admin: { Args: never; Returns: undefined }
      admin_bulk_seed_device_catalog: {
        Args: { _devices: Json; _reason: string }
        Returns: number
      }
      admin_change_user_role: {
        Args: {
          _new_role: string
          _org_id: string
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      admin_create_blog_post: {
        Args: {
          _author: string
          _category: string
          _cover_image_url: string
          _excerpt: string
          _read_time: number
          _reason: string
          _sections: Json
          _slug: string
          _title: string
        }
        Returns: string
      }
      admin_delete_blog_post: {
        Args: { _confirm_title: string; _id: string; _reason: string }
        Returns: undefined
      }
      admin_delete_device_catalog: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      admin_delete_organization: {
        Args: { _confirm_name: string; _org_id: string; _reason: string }
        Returns: undefined
      }
      admin_delete_user: {
        Args: { _confirm_email: string; _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_extend_trial: {
        Args: { _days: number; _org_id: string; _reason: string }
        Returns: undefined
      }
      admin_get_audit_log: {
        Args: { _action_filter?: string; _limit?: number; _offset?: number }
        Returns: Json
      }
      admin_get_organization_detail: {
        Args: { _org_id: string }
        Returns: Json
      }
      admin_get_organizations: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          client_count: number
          created_at: string
          email: string
          id: string
          invoice_count: number
          last_repair_at: string
          name: string
          phone: string
          plan_name: string
          repair_count: number
          siret: string
          stripe_customer_id: string
          stripe_subscription_id: string
          subscription_status: string
          total_count: number
          total_paid_ttc: number
          trial_end_date: string
          trial_start_date: string
          user_count: number
        }[]
      }
      admin_get_platform_stats: { Args: never; Returns: Json }
      admin_get_rate_limit_hits: {
        Args: { _limit?: number }
        Returns: {
          hits_1h: number
          key: string
          last_hit_at: string
        }[]
      }
      admin_get_recent_activity: { Args: { _limit?: number }; Returns: Json }
      admin_get_users: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          created_at: string
          email: string
          email_confirmed_at: string
          full_name: string
          last_sign_in_at: string
          organization_id: string
          organization_name: string
          role: string
          total_count: number
          user_id: string
        }[]
      }
      admin_grant_subscription: {
        Args: {
          _months: number
          _org_id: string
          _plan: string
          _reason: string
        }
        Returns: undefined
      }
      admin_list_blog_posts: {
        Args: { _include_drafts?: boolean; _limit?: number; _offset?: number }
        Returns: {
          author: string
          category: string
          cover_image_url: string
          created_at: string
          excerpt: string
          id: string
          published: boolean
          published_at: string
          read_time_minutes: number
          sections: Json
          slug: string
          title: string
          total_count: number
          updated_at: string
        }[]
      }
      admin_log_password_reset: {
        Args: {
          _actor_id: string
          _reason: string
          _target_email: string
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_promote_super_admin: {
        Args: { _org_id: string; _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_set_blog_published: {
        Args: { _id: string; _published: boolean; _reason: string }
        Returns: undefined
      }
      admin_set_subscription_active: {
        Args: { _active: boolean; _org_id: string; _reason: string }
        Returns: undefined
      }
      admin_update_blog_post: {
        Args: {
          _author: string
          _category: string
          _cover_image_url: string
          _excerpt: string
          _id: string
          _read_time: number
          _reason: string
          _sections: Json
          _slug: string
          _title: string
        }
        Returns: undefined
      }
      admin_update_organization: {
        Args: {
          _email: string
          _name: string
          _org_id: string
          _phone: string
          _reason: string
          _siret: string
        }
        Returns: undefined
      }
      admin_update_user: {
        Args: { _full_name: string; _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_upsert_device_catalog: {
        Args: {
          _brand: string
          _category: string
          _color_variants: Json
          _id: string
          _is_active: boolean
          _model: string
          _model_number: string
          _reason: string
          _release_year: number
          _storage_variants: Json
        }
        Returns: string
      }
      admin_verify_user_email: {
        Args: { _reason: string; _user_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: { _key: string; _max_requests?: number; _window_seconds?: number }
        Returns: boolean
      }
      cleanup_rate_limit_hits: { Args: never; Returns: undefined }
      create_deposit_repair:
        | {
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
        | {
            Args: {
              _client_city?: string
              _client_email?: string
              _client_first_name?: string
              _client_last_name?: string
              _client_name: string
              _client_phone: string
              _client_postal_code?: string
              _deposit_code: string
              _device_brand: string
              _device_model: string
              _device_type: string
              _issue: string
            }
            Returns: Json
          }
      get_org_safe_data: {
        Args: never
        Returns: {
          address: string
          ape_code: string
          article_categories: Json
          checklist_label: string
          city: string
          country: string
          created_at: string
          email: string
          google_review_url: string
          id: string
          intake_checklist_items: Json
          invoice_footer: string
          invoice_prefix: string
          legal_status: string
          logo_url: string
          name: string
          phone: string
          plan_name: string
          postal_code: string
          quote_prefix: string
          siret: string
          subscription_status: string
          trial_end_date: string
          trial_start_date: string
          updated_at: string
          vat_enabled: boolean
          vat_number: string
          vat_rate: number
          website: string
        }[]
      }
      get_published_blog_posts: {
        Args: never
        Returns: {
          author: string
          category: string
          cover_image_url: string
          excerpt: string
          id: string
          published_at: string
          read_time_minutes: number
          sections: Json
          slug: string
          title: string
        }[]
      }
      get_repair_by_tracking_code: { Args: { _code: string }; Returns: Json }
      get_repair_messages_by_tracking: {
        Args: { _tracking_code: string }
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
      is_super_admin: { Args: never; Returns: boolean }
      mark_messages_read_by_tracking: {
        Args: { _sender_type?: string; _tracking_code: string }
        Returns: Json
      }
      org_has_write_access: { Args: { _org_id: string }; Returns: boolean }
      send_customer_message: {
        Args: {
          _content: string
          _sender_name?: string
          _tracking_code: string
        }
        Returns: Json
      }
      validate_deposit_code: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "technician" | "super_admin"
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
        | "devis_en_attente"
        | "devis_valide"
        | "pret_reparation"
        | "reparation_en_cours"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "technician", "super_admin"],
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
        "devis_en_attente",
        "devis_valide",
        "pret_reparation",
        "reparation_en_cours",
      ],
    },
  },
} as const
