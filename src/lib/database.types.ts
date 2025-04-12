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
          icon_name: string | null
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
          icon_name?: string | null
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
          icon_name?: string | null
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
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meal_plan_entries: {
        Row: {
          created_at: string | null
          custom_meal_name: string | null
          id: string
          meal_type: string
          notes: string | null
          plan_date: string
          recipe_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_meal_name?: string | null
          id?: string
          meal_type: string
          notes?: string | null
          plan_date: string
          recipe_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_meal_name?: string | null
          id?: string
          meal_type?: string
          notes?: string | null
          plan_date?: string
          recipe_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_meal_plan_recipes"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name?: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      migration_history: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          restored: boolean | null
          restored_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          restored?: boolean | null
          restored_at?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          restored?: boolean | null
          restored_at?: string | null
          version?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          ingredient_id: string | null
          is_favorite: boolean
          location: string | null
          min_stock: number | null
          name: string
          notes: string | null
          price: number | null
          quantity: number | null
          tags: string[] | null
          target_stock: number | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          ingredient_id?: string | null
          is_favorite?: boolean
          location?: string | null
          min_stock?: number | null
          name: string
          notes?: string | null
          price?: number | null
          quantity?: number | null
          tags?: string[] | null
          target_stock?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          ingredient_id?: string | null
          is_favorite?: boolean
          location?: string | null
          min_stock?: number | null
          name?: string
          notes?: string | null
          price?: number | null
          quantity?: number | null
          tags?: string[] | null
          target_stock?: number | null
          unit?: string | null
          updated_at?: string | null
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
        ]
      }
      planned_recipes: {
        Row: {
          assigned_day: string
          created_at: string
          id: string
          meal_plan_id: string
          meal_type: string | null
          recipe_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_day: string
          created_at?: string
          id?: string
          meal_plan_id: string
          meal_type?: string | null
          recipe_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_day?: string
          created_at?: string
          id?: string
          meal_plan_id?: string
          meal_type?: string | null
          recipe_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_recipes_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          available_equipment: string[] | null
          avatar_url: string | null
          complexity_preference:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          cuisine_preferences: string[] | null
          dietary_restrictions: string[] | null
          difficulty_preference: string | null
          disliked_ingredients: string[] | null
          excluded_ingredients: string[] | null
          font_size: string | null
          gemini_api_key: string | null
          id: string
          last_login: string | null
          max_prep_time: number | null
          notification_preferences: Json | null
          preferred_meal_times: Json | null
          theme: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          available_equipment?: string[] | null
          avatar_url?: string | null
          complexity_preference?:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          cuisine_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          difficulty_preference?: string | null
          disliked_ingredients?: string[] | null
          excluded_ingredients?: string[] | null
          font_size?: string | null
          gemini_api_key?: string | null
          id: string
          last_login?: string | null
          max_prep_time?: number | null
          notification_preferences?: Json | null
          preferred_meal_times?: Json | null
          theme?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          available_equipment?: string[] | null
          avatar_url?: string | null
          complexity_preference?:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          cuisine_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          difficulty_preference?: string | null
          disliked_ingredients?: string[] | null
          excluded_ingredients?: string[] | null
          font_size?: string | null
          gemini_api_key?: string | null
          id?: string
          last_login?: string | null
          max_prep_time?: number | null
          notification_preferences?: Json | null
          preferred_meal_times?: Json | null
          theme?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      recipe_history: {
        Row: {
          created_at: string | null
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes: string | null
          planned_date: string
          rating: number | null
          recipe_id: string
          updated_at: string | null
          user_id: string
          was_cooked: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          planned_date: string
          rating?: number | null
          recipe_id: string
          updated_at?: string | null
          user_id: string
          was_cooked?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          planned_date?: string
          rating?: number | null
          recipe_id?: string
          updated_at?: string | null
          user_id?: string
          was_cooked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_history_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          id: string
          ingredient_id: string | null
          ingredient_name: string | null
          quantity: number | null
          recipe_id: string
          unit: string | null
        }
        Insert: {
          id?: string
          ingredient_id?: string | null
          ingredient_name?: string | null
          quantity?: number | null
          recipe_id: string
          unit?: string | null
        }
        Update: {
          id?: string
          ingredient_id?: string | null
          ingredient_name?: string | null
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
      recipe_ingredients_backup_056: {
        Row: {
          id: string
          ingredient_id: string | null
          ingredient_name: string | null
          quantity: number | null
          recipe_id: string
          unit: string | null
        }
        Insert: {
          id?: string
          ingredient_id?: string | null
          ingredient_name?: string | null
          quantity?: number | null
          recipe_id: string
          unit?: string | null
        }
        Update: {
          id?: string
          ingredient_id?: string | null
          ingredient_name?: string | null
          quantity?: number | null
          recipe_id?: string
          unit?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          category_id: string | null
          cook_time_minutes: number | null
          cooking_methods: string[] | null
          created_at: string
          cuisine_type: string[] | null
          description: string | null
          difficulty_level:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          equipment_needed: string[] | null
          estimated_time: number | null
          id: string
          image_url: string | null
          instructions: string | null
          is_favorite: boolean
          is_generated_base: boolean
          is_public: boolean
          main_ingredients: string[] | null
          nutritional_info: Json | null
          prep_time_minutes: number | null
          seasonal_flags: string[] | null
          servings: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          cook_time_minutes?: number | null
          cooking_methods?: string[] | null
          created_at?: string
          cuisine_type?: string[] | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          equipment_needed?: string[] | null
          estimated_time?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_favorite?: boolean
          is_generated_base?: boolean
          is_public?: boolean
          main_ingredients?: string[] | null
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          seasonal_flags?: string[] | null
          servings?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          cook_time_minutes?: number | null
          cooking_methods?: string[] | null
          created_at?: string
          cuisine_type?: string[] | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          equipment_needed?: string[] | null
          estimated_time?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_favorite?: boolean
          is_generated_base?: boolean
          is_public?: boolean
          main_ingredients?: string[] | null
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          seasonal_flags?: string[] | null
          servings?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes_backup_056: {
        Row: {
          category_id: string | null
          cook_time_minutes: number | null
          cooking_methods: string[] | null
          created_at: string
          cuisine_type: string[] | null
          description: string | null
          difficulty_level:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          equipment_needed: string[] | null
          estimated_time: number | null
          id: string
          image_url: string | null
          instructions: string | null
          is_favorite: boolean
          is_generated_base: boolean
          is_public: boolean
          main_ingredients: string[] | null
          nutritional_info: Json | null
          prep_time_minutes: number | null
          seasonal_flags: string[] | null
          servings: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          cook_time_minutes?: number | null
          cooking_methods?: string[] | null
          created_at?: string
          cuisine_type?: string[] | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          equipment_needed?: string[] | null
          estimated_time?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_favorite?: boolean
          is_generated_base?: boolean
          is_public?: boolean
          main_ingredients?: string[] | null
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          seasonal_flags?: string[] | null
          servings?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          cook_time_minutes?: number | null
          cooking_methods?: string[] | null
          created_at?: string
          cuisine_type?: string[] | null
          description?: string | null
          difficulty_level?:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          equipment_needed?: string[] | null
          estimated_time?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_favorite?: boolean
          is_generated_base?: boolean
          is_public?: boolean
          main_ingredients?: string[] | null
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          seasonal_flags?: string[] | null
          servings?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          id: string
          ingredient_name: string
          is_checked: boolean
          notes: string | null
          quantity: number | null
          recipe_source: string | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          ingredient_name: string
          is_checked?: boolean
          notes?: string | null
          quantity?: number | null
          recipe_source?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          ingredient_name?: string
          is_checked?: boolean
          notes?: string | null
          quantity?: number | null
          recipe_source?: string | null
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
      variety_metrics: {
        Row: {
          frequency_count: Json
          id: string
          last_used: Json
          metric_type: Database["public"]["Enums"]["metric_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          frequency_count?: Json
          id?: string
          last_used?: Json
          metric_type: Database["public"]["Enums"]["metric_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          frequency_count?: Json
          id?: string
          last_used?: Json
          metric_type?: Database["public"]["Enums"]["metric_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_recipe_with_ingredients: {
        Args: {
          recipe_title: string
          recipe_description: string
          recipe_instructions: string
          recipe_prep_time: number
          recipe_cook_time: number
          recipe_servings: number
          recipe_image_url: string
          user_id: string
          ingredients_input: Json[]
        }
        Returns: Json
      }
      find_recipes_by_criteria: {
        Args: {
          p_difficulty?: Database["public"]["Enums"]["complexity_level"]
          p_max_time?: number
          p_cuisine_types?: string[]
          p_cooking_methods?: string[]
          p_seasonal_flag?: string
        }
        Returns: {
          category_id: string | null
          cook_time_minutes: number | null
          cooking_methods: string[] | null
          created_at: string
          cuisine_type: string[] | null
          description: string | null
          difficulty_level:
            | Database["public"]["Enums"]["complexity_level"]
            | null
          equipment_needed: string[] | null
          estimated_time: number | null
          id: string
          image_url: string | null
          instructions: string | null
          is_favorite: boolean
          is_generated_base: boolean
          is_public: boolean
          main_ingredients: string[] | null
          nutritional_info: Json | null
          prep_time_minutes: number | null
          seasonal_flags: string[] | null
          servings: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }[]
      }
      get_most_common_recipes: {
        Args: {
          p_user_id: string
          p_meal_type?: Database["public"]["Enums"]["meal_type"]
          p_limit?: number
        }
        Returns: {
          recipe_id: string
          count: number
        }[]
      }
      restore_recipes_state: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rollback_recipe_changes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      save_recipes_state: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_variety_metric: {
        Args: {
          p_user_id: string
          p_metric_type: Database["public"]["Enums"]["metric_type"]
          p_item: string
        }
        Returns: undefined
      }
      verify_recipe_system_state: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: Json
        }[]
      }
    }
    Enums: {
      complexity_level: "simple" | "medium" | "complex"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      metric_type:
        | "protein_rotation"
        | "cuisine_variety"
        | "cooking_method"
        | "ingredient_usage"
        | "meal_type_balance"
    }
    CompositeTypes: {
      ingredient_input: {
        name: string | null
        quantity: string | null
        unit: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      complexity_level: ["simple", "medium", "complex"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      metric_type: [
        "protein_rotation",
        "cuisine_variety",
        "cooking_method",
        "ingredient_usage",
        "meal_type_balance",
      ],
    },
  },
} as const
