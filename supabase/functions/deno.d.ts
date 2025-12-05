// Type definitions for Deno runtime in Supabase Edge Functions

declare const Deno: {
  env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  };
};

// Allow imports from URLs (Deno feature)
declare module "https://*" {
  const content: any;
  export default content;
  export * from content;
}

declare module "https://esm.sh/*" {
  const content: any;
  export default content;
  export * from content;
}

declare module "https://deno.land/*" {
  const content: any;
  export default content;
  export * from content;
}

