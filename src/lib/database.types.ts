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
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean
          name: string
          order: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id: string
          is_default?: boolean
          name: string
          order?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          order?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      category_keywords: {
        Row: {
          category_id: string
          created_at: string
          id: string
          keyword: string
          priority: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          keyword: string
          priority?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          keyword?: string
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_keywords_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category: string | null
          created_at: string
          default_unit: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_unit?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_unit?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      meal_plan_entries: {
        Row: {
          created_at: string
          custom_meal_name: string | null
          id: string
          meal_type: Database["public"]["Enums"]["meal_type_enum"] | null
          plan_date: string
          recipe_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_meal_name?: string | null
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type_enum"] | null
          plan_date: string
          recipe_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          custom_meal_name?: string | null
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type_enum"] | null
          plan_date?: string
          recipe_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_entries_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pantry_items: {
        Row: {
          category_id: string | null
          created_at: string
          expiry_date: string | null
          id: string
          ingredient_id: string
          location: string | null
          min_stock: number | null
          notes: string | null
          price: number | null
          quantity: number
          tags: string[] | null
          target_stock: number | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_id: string
          location?: string | null
          min_stock?: number | null
          notes?: string | null
          price?: number | null
          quantity: number
          tags?: string[] | null
          target_stock?: number | null
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_id?: string
          location?: string | null
          min_stock?: number | null
          notes?: string | null
          price?: number | null
          quantity?: number
          tags?: string[] | null
          target_stock?: number | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pantry_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pantry_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: Json | null
          allergies_restrictions: string | null
          available_equipment: string[] | null
          avatar_url: string | null
          dietary_preference: string | null
          difficulty_preference: string | null
          excluded_ingredients: string[] | null
          gemini_api_key: string | null
          id: string
          max_prep_time: number | null
          preferences: Json | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          allergies?: Json | null
          allergies_restrictions?: string | null
          available_equipment?: string[] | null
          avatar_url?: string | null
          dietary_preference?: string | null
          difficulty_preference?: string | null
          excluded_ingredients?: string[] | null
          gemini_api_key?: string | null
          id: string
          max_prep_time?: number | null
          preferences?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          allergies?: Json | null
          allergies_restrictions?: string | null
          available_equipment?: string[] | null
          avatar_url?: string | null
          dietary_preference?: string | null
          difficulty_preference?: string | null
          excluded_ingredients?: string[] | null
          gemini_api_key?: string | null
          id?: string
          max_prep_time?: number | null
          preferences?: Json | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          id: string
          ingredient_id: string | null
          ingredient_name: string
          notes: string | null
          quantity: number | null
          recipe_id: string
          unit: string | null
        }
        Insert: {
          id?: string
          ingredient_id?: string | null
          ingredient_name: string
          notes?: string | null
          quantity?: number | null
          recipe_id: string
          unit?: string | null
        }
        Update: {
          id?: string
          ingredient_id?: string | null
          ingredient_name?: string
          notes?: string | null
          quantity?: number | null
          recipe_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_recipe_ingredients_ingredient_id"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time_minutes: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          instructions: string
          prep_time_minutes: number | null
          servings: number | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cook_time_minutes?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instructions: string
          prep_time_minutes?: number | null
          servings?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cook_time_minutes?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instructions?: string
          prep_time_minutes?: number | null
          servings?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_products_cache: {
        Row: {
          last_fetched_at: string
          normalized_query: string
          results: Json
        }
        Insert: {
          last_fetched_at?: string
          normalized_query: string
          results: Json
        }
        Update: {
          last_fetched_at?: string
          normalized_query?: string
          results?: Json
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          created_at: string
          id: string
          is_purchased: boolean
          name: string
          quantity: number | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_purchased?: boolean
          name: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_purchased?: boolean
          name?: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_suggestions: {
        Row: {
          category: string | null
          created_at: string
          default_unit: string | null
          frequency: number
          id: string
          last_used: string
          name: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_unit?: string | null
          frequency?: number
          id?: string
          last_used?: string
          name: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_unit?: string | null
          frequency?: number
          id?: string
          last_used?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_category_corrections: {
        Row: {
          corrected_category_id: string
          id: string
          item_name: string
          original_category_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          corrected_category_id: string
          id?: string
          item_name: string
          original_category_id?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          corrected_category_id?: string
          id?: string
          item_name?: string
          original_category_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_category_corrections_corrected_category_id_fkey"
            columns: ["corrected_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_category_corrections_original_category_id_fkey"
            columns: ["original_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      meal_type_enum: "Desayuno" | "Almuerzo" | "Merienda" | "Cena"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
