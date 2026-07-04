


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, username, intel_score, is_admin, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    0,
    FALSE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "reported_by" "uuid",
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "match_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "upvotes" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "user_id" "uuid",
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icon" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "upvotes" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "preview" "text",
    "author_id" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "upvotes" integer DEFAULT 0,
    "views" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "post_count" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."community_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team1" "text" NOT NULL,
    "team2" "text" NOT NULL,
    "tournament" "text",
    "match_time" timestamp without time zone,
    "status" "text" DEFAULT 'upcoming'::"text",
    "result" "text",
    "team1_id" "uuid",
    "team2_id" "uuid",
    "tournament_id" "uuid",
    "score1" integer,
    "score2" integer,
    CONSTRAINT "matches_result_check" CHECK (("result" = ANY (ARRAY['team1_win'::"text", 'team2_win'::"text", 'draw'::"text"]))),
    CONSTRAINT "matches_score1_nonnegative" CHECK (("score1" >= 0)),
    CONSTRAINT "matches_score2_nonnegative" CHECK (("score2" >= 0))
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


COMMENT ON COLUMN "public"."matches"."team1_id" IS 'FK to teams(id) — replaces team1 TEXT during transition';



COMMENT ON COLUMN "public"."matches"."team2_id" IS 'FK to teams(id) — replaces team2 TEXT during transition';



COMMENT ON COLUMN "public"."matches"."tournament_id" IS 'FK to tournaments(id) — replaces tournament TEXT during transition';



COMMENT ON COLUMN "public"."matches"."score1" IS 'Official score for team1 — NULL until match result is confirmed';



COMMENT ON COLUMN "public"."matches"."score2" IS 'Official score for team2 — NULL until match result is confirmed';



CREATE TABLE IF NOT EXISTS "public"."platform_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_name" "text" NOT NULL,
    "status" "text" DEFAULT 'operational'::"text",
    "uptime" numeric DEFAULT 100,
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "match_id" "uuid" NOT NULL,
    "prediction" "text" NOT NULL,
    "result" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "is_correct" boolean
);


ALTER TABLE "public"."predictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "severity" "text" DEFAULT 'info'::"text",
    "message" "text" NOT NULL,
    "resolved" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo" "text",
    "country" "text",
    "founded_year" integer,
    "website" "text",
    "rating" integer DEFAULT 2000,
    "win_rate" numeric(5,2) DEFAULT 50,
    "last_match_time" timestamp with time zone,
    "total_matches" integer DEFAULT 0,
    "recent_form" "text" DEFAULT 'LLLLL'::"text",
    "best_map" "text",
    "worst_map" "text",
    "key_player" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teams_rating_check" CHECK (("rating" >= 0)),
    CONSTRAINT "teams_total_matches_check" CHECK (("total_matches" >= 0)),
    CONSTRAINT "teams_win_rate_check" CHECK ((("win_rate" >= (0)::numeric) AND ("win_rate" <= (100)::numeric)))
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


COMMENT ON TABLE "public"."teams" IS 'Central team information for CS2 professional teams';



COMMENT ON COLUMN "public"."teams"."rating" IS 'Team ELO rating based on match results';



COMMENT ON COLUMN "public"."teams"."win_rate" IS 'Historical win rate percentage';



COMMENT ON COLUMN "public"."teams"."recent_form" IS 'Last 5 match results (W/L/D)';



CREATE TABLE IF NOT EXISTS "public"."tournaments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "prize_pool" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "organizer" "text",
    "location" "text",
    "country" "text",
    "match_count" integer DEFAULT 0,
    "team_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'upcoming'::"text",
    "featured" boolean DEFAULT false,
    "logo" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tournaments_match_count_check" CHECK (("match_count" >= 0)),
    CONSTRAINT "tournaments_status_check" CHECK (("status" = ANY (ARRAY['upcoming'::"text", 'live'::"text", 'completed'::"text"]))),
    CONSTRAINT "tournaments_team_count_check" CHECK (("team_count" >= 0))
);


ALTER TABLE "public"."tournaments" OWNER TO "postgres";


COMMENT ON TABLE "public"."tournaments" IS 'Tournament information for CS2 events';



COMMENT ON COLUMN "public"."tournaments"."match_count" IS 'Number of matches in this tournament (denormalised)';



COMMENT ON COLUMN "public"."tournaments"."team_count" IS 'Number of teams participating (denormalised)';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" "text" NOT NULL,
    "avatar" "text",
    "intel_score" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false,
    "email" "text",
    CONSTRAINT "users_intel_score_non_negative" CHECK (("intel_score" >= 0))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_notes"
    ADD CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_reports"
    ADD CONSTRAINT "admin_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_activity"
    ADD CONSTRAINT "community_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_categories"
    ADD CONSTRAINT "community_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_categories"
    ADD CONSTRAINT "community_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."community_comments"
    ADD CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_tags"
    ADD CONSTRAINT "community_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_tags"
    ADD CONSTRAINT "community_tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_status"
    ADD CONSTRAINT "platform_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_alerts"
    ADD CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournaments"
    ADD CONSTRAINT "tournaments_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



CREATE INDEX "idx_admin_reports_status" ON "public"."admin_reports" USING "btree" ("status");



CREATE INDEX "idx_comments_created_at" ON "public"."comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comments_match_id" ON "public"."comments" USING "btree" ("match_id");



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_community_activity_type" ON "public"."community_activity" USING "btree" ("type");



CREATE INDEX "idx_community_comments_post" ON "public"."community_comments" USING "btree" ("post_id");



CREATE INDEX "idx_community_posts_created" ON "public"."community_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_matches_match_time" ON "public"."matches" USING "btree" ("match_time");



CREATE INDEX "idx_matches_status" ON "public"."matches" USING "btree" ("status");



CREATE INDEX "idx_matches_team1_id" ON "public"."matches" USING "btree" ("team1_id");



CREATE INDEX "idx_matches_team2_id" ON "public"."matches" USING "btree" ("team2_id");



CREATE INDEX "idx_matches_tournament_id" ON "public"."matches" USING "btree" ("tournament_id");



CREATE INDEX "idx_predictions_match_id" ON "public"."predictions" USING "btree" ("match_id");



CREATE INDEX "idx_predictions_result" ON "public"."predictions" USING "btree" ("result");



CREATE INDEX "idx_predictions_user_id" ON "public"."predictions" USING "btree" ("user_id");



CREATE INDEX "idx_system_alerts_resolved" ON "public"."system_alerts" USING "btree" ("resolved");



CREATE INDEX "idx_teams_created_at" ON "public"."teams" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_teams_name" ON "public"."teams" USING "btree" ("name");



CREATE INDEX "idx_teams_rating" ON "public"."teams" USING "btree" ("rating" DESC);



CREATE INDEX "idx_teams_win_rate" ON "public"."teams" USING "btree" ("win_rate" DESC);



CREATE INDEX "idx_tournaments_featured" ON "public"."tournaments" USING "btree" ("featured");



CREATE INDEX "idx_tournaments_name" ON "public"."tournaments" USING "btree" ("name");



CREATE INDEX "idx_tournaments_start_date" ON "public"."tournaments" USING "btree" ("start_date" DESC);



CREATE INDEX "idx_tournaments_status" ON "public"."tournaments" USING "btree" ("status");



CREATE INDEX "idx_users_id" ON "public"."users" USING "btree" ("id");



CREATE INDEX "idx_users_intel_score" ON "public"."users" USING "btree" ("intel_score" DESC);



CREATE INDEX "idx_users_is_admin" ON "public"."users" USING "btree" ("is_admin");



CREATE UNIQUE INDEX "predictions_user_match_unique" ON "public"."predictions" USING "btree" ("user_id", "match_id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_comments"
    ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read access to matches" ON "public"."matches" FOR SELECT USING (true);



CREATE POLICY "Allow public read comments" ON "public"."comments" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read matches" ON "public"."matches" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read predictions" ON "public"."predictions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read users" ON "public"."users" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Authenticated users can comment" ON "public"."community_comments" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can create posts" ON "public"."community_posts" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Public can read categories" ON "public"."community_categories" FOR SELECT USING (true);



CREATE POLICY "Public can read comments" ON "public"."community_comments" FOR SELECT USING (true);



CREATE POLICY "Public can read posts" ON "public"."community_posts" FOR SELECT USING (true);



CREATE POLICY "Public can read tags" ON "public"."community_tags" FOR SELECT USING (true);



CREATE POLICY "Public can view user public data" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Service role only access" ON "public"."community_activity" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can insert their own predictions" ON "public"."predictions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own posts" ON "public"."community_posts" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own predictions" ON "public"."predictions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "matches_admin_delete" ON "public"."matches" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "matches_admin_insert" ON "public"."matches" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "matches_admin_update" ON "public"."matches" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



ALTER TABLE "public"."platform_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_admin_update" ON "public"."teams" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "teams_admin_write" ON "public"."teams" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "teams_public_read" ON "public"."teams" FOR SELECT USING (true);



ALTER TABLE "public"."tournaments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tournaments_admin_update" ON "public"."tournaments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "tournaments_admin_write" ON "public"."tournaments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "tournaments_public_read" ON "public"."tournaments" FOR SELECT USING (true);



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_notes" TO "anon";
GRANT ALL ON TABLE "public"."admin_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_notes" TO "service_role";



GRANT ALL ON TABLE "public"."admin_reports" TO "anon";
GRANT ALL ON TABLE "public"."admin_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_reports" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."community_activity" TO "anon";
GRANT ALL ON TABLE "public"."community_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."community_activity" TO "service_role";



GRANT ALL ON TABLE "public"."community_categories" TO "anon";
GRANT ALL ON TABLE "public"."community_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."community_categories" TO "service_role";



GRANT ALL ON TABLE "public"."community_comments" TO "anon";
GRANT ALL ON TABLE "public"."community_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."community_comments" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts" TO "anon";
GRANT ALL ON TABLE "public"."community_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts" TO "service_role";



GRANT ALL ON TABLE "public"."community_tags" TO "anon";
GRANT ALL ON TABLE "public"."community_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."community_tags" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."platform_status" TO "anon";
GRANT ALL ON TABLE "public"."platform_status" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_status" TO "service_role";



GRANT ALL ON TABLE "public"."predictions" TO "anon";
GRANT ALL ON TABLE "public"."predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."predictions" TO "service_role";



GRANT ALL ON TABLE "public"."system_alerts" TO "anon";
GRANT ALL ON TABLE "public"."system_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."system_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."tournaments" TO "anon";
GRANT ALL ON TABLE "public"."tournaments" TO "authenticated";
GRANT ALL ON TABLE "public"."tournaments" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


