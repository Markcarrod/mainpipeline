export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          industry: string;
          target_industry: string;
          target_location: string;
          target_company_size: string;
          target_job_titles: Json;
          monthly_meeting_target: number;
          monthly_price: number;
          status: "active" | "paused" | "onboarding";
          created_at: string;
        };
      };
      client_integrations: {
        Row: {
          id: string;
          client_id: string;
          provider: string;
          label: string;
          api_key_hint: string | null;
          status: "connected" | "pending" | "needs_attention";
          notes: string | null;
          created_at: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          channel: string;
          status: string;
          messages_sent: number;
          replies: number;
          positive_replies: number;
          meetings_booked: number;
          start_date: string;
          created_at: string;
        };
      };
      meetings: {
        Row: {
          id: string;
          client_id: string;
          /** Optional: links to a Pipeline Portal campaign */
          campaign_id: string | null;
          /** Cal.com unique booking identifier — used for upsert */
          booking_uid: string | null;
          prospect_name: string;
          /** Prospect email from Cal.com attendee */
          prospect_email: string | null;
          /** Legacy email column kept for backwards compatibility */
          email: string;
          company: string;
          job_title: string;
          /** Cal.com event type name e.g. "Discovery Call" */
          event_name: string | null;
          /** Meeting start time (UTC) */
          meeting_start: string | null;
          /** Meeting end time (UTC) */
          meeting_end: string | null;
          /** Legacy single timestamp — kept for backwards compatibility */
          meeting_datetime: string;
          status: "scheduled" | "completed" | "no_show" | "rescheduled" | "cancelled";
          source: string;
          account_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          label: string;
          platform: string;
          status: string;
          daily_limit: number;
          created_at: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: string;
        };
      };
    };
  };
}
