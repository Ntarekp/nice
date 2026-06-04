--
-- PostgreSQL database dump
--

\restrict NNjZOeFY07kmIMAtcR7w3QhhcxAJtsU1o1VsllcQYrqdOo2lMpKnhWzgWhCdfrL

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.maintenance_logs DROP CONSTRAINT IF EXISTS "maintenance_logs_inspectionId_fkey";
DROP INDEX IF EXISTS public.inspections_status;
DROP INDEX IF EXISTS public.inspections_scheduled_date;
DROP INDEX IF EXISTS public.inspections_extinguisher_id;
ALTER TABLE IF EXISTS ONLY public.maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.inspections DROP CONSTRAINT IF EXISTS inspections_pkey;
DROP TABLE IF EXISTS public.maintenance_logs;
DROP TABLE IF EXISTS public.inspections;
DROP TYPE IF EXISTS public.enum_maintenance_logs_status;
DROP TYPE IF EXISTS public.enum_inspections_type;
DROP TYPE IF EXISTS public.enum_inspections_status;
DROP TYPE IF EXISTS public.enum_inspections_result;
--
-- Name: enum_inspections_result; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_inspections_result AS ENUM (
    'passed',
    'failed',
    'needs_maintenance',
    'decommissioned'
);


--
-- Name: enum_inspections_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_inspections_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'missed',
    'cancelled'
);


--
-- Name: enum_inspections_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_inspections_type AS ENUM (
    'routine',
    'annual',
    'emergency',
    'post_maintenance',
    'compliance'
);


--
-- Name: enum_maintenance_logs_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_maintenance_logs_status AS ENUM (
    'completed',
    'pending_parts',
    'decommissioned'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: inspections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inspections (
    id uuid NOT NULL,
    "extinguisherId" uuid NOT NULL,
    "scheduledBy" uuid NOT NULL,
    "assignedInspector" uuid,
    "scheduledDate" timestamp with time zone NOT NULL,
    "completedDate" timestamp with time zone,
    status public.enum_inspections_status DEFAULT 'scheduled'::public.enum_inspections_status,
    type public.enum_inspections_type DEFAULT 'routine'::public.enum_inspections_type,
    result public.enum_inspections_result,
    findings text,
    notes text,
    "nextInspectionDate" date,
    "notifiedAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: maintenance_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_logs (
    id uuid NOT NULL,
    "extinguisherId" uuid NOT NULL,
    "inspectionId" uuid,
    "performedBy" uuid NOT NULL,
    "actionDate" date NOT NULL,
    "actionsTaken" text NOT NULL,
    "conditionsNoted" text,
    "partsReplaced" jsonb DEFAULT '[]'::jsonb,
    cost numeric(10,2),
    "nextServiceDate" date,
    status public.enum_maintenance_logs_status DEFAULT 'completed'::public.enum_maintenance_logs_status,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inspections (id, "extinguisherId", "scheduledBy", "assignedInspector", "scheduledDate", "completedDate", status, type, result, findings, notes, "nextInspectionDate", "notifiedAt", "createdAt", "updatedAt") FROM stdin;
5d5f2e2b-9f1d-49ff-8f11-c6ca3e37315e	7e27606f-5eb0-4285-ac65-13af9b2cf622	c8037056-8a28-4890-9305-21175dc43c99	ffd566ca-bd90-4167-b2e7-0e08c01cac58	2026-06-06 09:06:00+01	\N	scheduled	annual	\N	\N	Need inspection	\N	2026-06-04 09:19:47.38+01	2026-06-04 09:06:23.846+01	2026-06-04 09:19:47.381+01
6239b4c4-12d8-4d39-b256-8093dd9b0f03	7e27606f-5eb0-4285-ac65-13af9b2cf622	c8037056-8a28-4890-9305-21175dc43c99	ffd566ca-bd90-4167-b2e7-0e08c01cac58	2026-06-12 09:37:00+01	\N	in_progress	emergency	\N	\N	emergerncy insepctrtrt	\N	2026-06-04 09:37:41.865+01	2026-06-04 09:36:42.462+01	2026-06-04 09:38:54.295+01
\.


--
-- Data for Name: maintenance_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_logs (id, "extinguisherId", "inspectionId", "performedBy", "actionDate", "actionsTaken", "conditionsNoted", "partsReplaced", cost, "nextServiceDate", status, "createdAt", "updatedAt") FROM stdin;
4876747f-0e3f-4044-b40e-b79889c9b5fb	7e27606f-5eb0-4285-ac65-13af9b2cf622	\N	ffd566ca-bd90-4167-b2e7-0e08c01cac58	2026-06-04	Soolved	ad	[]	\N	2026-07-04	completed	2026-06-04 09:12:50.034+01	2026-06-04 09:12:50.034+01
909fdb82-4627-4d2b-a861-c90e98ea431b	7e27606f-5eb0-4285-ac65-13af9b2cf622	\N	ffd566ca-bd90-4167-b2e7-0e08c01cac58	2026-06-04	Replace nooz;e	Damaged	[]	\N	2026-06-19	completed	2026-06-04 09:39:51.097+01	2026-06-04 09:39:51.097+01
\.


--
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- Name: maintenance_logs maintenance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_pkey PRIMARY KEY (id);


--
-- Name: inspections_extinguisher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inspections_extinguisher_id ON public.inspections USING btree ("extinguisherId");


--
-- Name: inspections_scheduled_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inspections_scheduled_date ON public.inspections USING btree ("scheduledDate");


--
-- Name: inspections_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inspections_status ON public.inspections USING btree (status);


--
-- Name: maintenance_logs maintenance_logs_inspectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT "maintenance_logs_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES public.inspections(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict NNjZOeFY07kmIMAtcR7w3QhhcxAJtsU1o1VsllcQYrqdOo2lMpKnhWzgWhCdfrL

