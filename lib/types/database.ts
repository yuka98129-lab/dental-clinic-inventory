export interface Database {
  public: {
    Tables: {
      item_types: {
        Row: {
          id: string;
          category: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          item_type_id: string;
          name: string;
          unit: string;
          current_stock: number;
          low_stock_threshold: number;
          manufacturer: string | null;
          storage_location: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_type_id: string;
          name: string;
          unit: string;
          current_stock?: number;
          low_stock_threshold?: number;
          manufacturer?: string | null;
          storage_location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_type_id?: string;
          name?: string;
          unit?: string;
          current_stock?: number;
          low_stock_threshold?: number;
          manufacturer?: string | null;
          storage_location?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type ItemType = Database["public"]["Tables"]["item_types"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
