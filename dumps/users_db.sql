--
-- PostgreSQL database dump
--

\restrict KebRLgaPb3mIrsujGzBAesyrnsSBEonCDSBMJBDCM8NbxfxR0kRqNKT60NpeNib

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

ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS "refresh_tokens_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.otp_codes DROP CONSTRAINT IF EXISTS otp_codes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.maintenance_logs DROP CONSTRAINT IF EXISTS "maintenance_logs_inspectionId_fkey";
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
DROP INDEX IF EXISTS public.users_email;
DROP INDEX IF EXISTS public.otp_codes_user_id_purpose_is_used;
DROP INDEX IF EXISTS public.otp_codes_expires_at;
DROP INDEX IF EXISTS public.otp_codes_email_purpose_is_used;
DROP INDEX IF EXISTS public.inspections_status;
DROP INDEX IF EXISTS public.inspections_scheduled_date;
DROP INDEX IF EXISTS public.inspections_extinguisher_id;
DROP INDEX IF EXISTS public.extinguishers_status;
DROP INDEX IF EXISTS public.extinguishers_serial_number;
DROP INDEX IF EXISTS public.extinguishers_location;
DROP INDEX IF EXISTS public.extinguishers_expiry_date;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key9;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key8;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key7;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key6;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key5;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key4;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key30;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key3;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key29;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key28;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key27;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key26;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key25;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key24;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key23;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key22;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key21;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key20;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key2;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key19;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key18;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key17;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key16;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key15;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key14;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key13;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key12;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key11;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key10;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key1;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.otp_codes DROP CONSTRAINT IF EXISTS otp_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.inspections DROP CONSTRAINT IF EXISTS inspections_pkey;
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS "extinguishers_serialNumber_key3";
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS "extinguishers_serialNumber_key2";
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS "extinguishers_serialNumber_key1";
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS "extinguishers_serialNumber_key";
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS extinguishers_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP TABLE IF EXISTS public.otp_codes;
DROP TABLE IF EXISTS public.maintenance_logs;
DROP TABLE IF EXISTS public.inspections;
DROP TABLE IF EXISTS public.extinguishers;
DROP TABLE IF EXISTS public.audit_logs;
DROP TYPE IF EXISTS public.enum_users_role;
DROP TYPE IF EXISTS public.enum_maintenance_logs_status;
DROP TYPE IF EXISTS public.enum_inspections_type;
DROP TYPE IF EXISTS public.enum_inspections_status;
DROP TYPE IF EXISTS public.enum_inspections_result;
DROP TYPE IF EXISTS public.enum_extinguishers_type;
DROP TYPE IF EXISTS public.enum_extinguishers_status;
DROP TYPE IF EXISTS public.enum_extinguishers_size;
DROP TYPE IF EXISTS public.enum_audit_logs_status;
--
-- Name: enum_audit_logs_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_audit_logs_status AS ENUM (
    'success',
    'failure'
);


--
-- Name: enum_extinguishers_size; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_extinguishers_size AS ENUM (
    '2.5lbs',
    '5lbs',
    '9lbs',
    '12lbs',
    '20lbs'
);


--
-- Name: enum_extinguishers_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_extinguishers_status AS ENUM (
    'active',
    'expired',
    'maintenance',
    'decommissioned',
    'missing'
);


--
-- Name: enum_extinguishers_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_extinguishers_type AS ENUM (
    'water',
    'co2',
    'foam',
    'dry_chemical',
    'wet_chemical',
    'halon'
);


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


--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_role AS ENUM (
    'admin',
    'inspector',
    'user'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    "userId" uuid,
    action character varying(100) NOT NULL,
    resource character varying(100),
    "resourceId" character varying(100),
    "oldValues" jsonb,
    "newValues" jsonb,
    "ipAddress" character varying(45),
    "userAgent" character varying(500),
    status public.enum_audit_logs_status DEFAULT 'success'::public.enum_audit_logs_status,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: extinguishers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extinguishers (
    id uuid NOT NULL,
    "serialNumber" character varying(50) NOT NULL,
    location character varying(200) NOT NULL,
    building character varying(100),
    floor character varying(20),
    room character varying(50),
    type public.enum_extinguishers_type NOT NULL,
    size public.enum_extinguishers_size NOT NULL,
    manufacturer character varying(100),
    model character varying(100),
    "installationDate" date NOT NULL,
    "expiryDate" date NOT NULL,
    "lastInspectionDate" date,
    "nextInspectionDate" date,
    status public.enum_extinguishers_status DEFAULT 'active'::public.enum_extinguishers_status,
    pressure character varying(20),
    notes text,
    "qrCode" character varying(500),
    "createdBy" uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


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
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_codes (
    id uuid NOT NULL,
    user_id uuid,
    email character varying(100) NOT NULL,
    otp_code character varying(10) NOT NULL,
    purpose character varying(50) DEFAULT 'login'::character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "isRevoked" boolean DEFAULT false,
    "userAgent" character varying(500),
    "ipAddress" character varying(45),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    "firstName" character varying(50) NOT NULL,
    "lastName" character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role public.enum_users_role DEFAULT 'user'::public.enum_users_role,
    "isActive" boolean DEFAULT true,
    "mustChangePassword" boolean DEFAULT true,
    "isEmailVerified" boolean DEFAULT false,
    phone character varying(20),
    department character varying(100),
    "lastLoginAt" timestamp with time zone,
    "passwordChangedAt" timestamp with time zone,
    "profileImage" character varying(500),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "userId", action, resource, "resourceId", "oldValues", "newValues", "ipAddress", "userAgent", status, "createdAt") FROM stdin;
9ea42192-6f6a-4fb8-ab78-4c0bd830597a	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	success	2026-06-04 07:57:45.087+01
7229e8c7-2cf5-4281-bd4f-73e39af24eb2	399a1630-283b-467c-a353-e975c8f23c3e	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	success	2026-06-04 07:58:13.954+01
f0b7d46b-d5cd-41ec-b706-ff176d164f1d	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	success	2026-06-04 08:00:12.765+01
d8ada61e-1ab6-46f2-8c82-dc9bd5b8585d	399a1630-283b-467c-a353-e975c8f23c3e	USER_CREATED	users	d48c2b9a-4798-4b61-8f24-e2831b8aede2	\N	{"role": "user", "email": "ukmeuk1@gmail.com", "welcomeEmailSent": true}	\N	\N	success	2026-06-04 08:01:19.564+01
81dc98cd-7f5c-4638-841d-57881d668475	d48c2b9a-4798-4b61-8f24-e2831b8aede2	LOGIN_FAILED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	failure	2026-06-04 08:02:06.027+01
5a2c30c2-b55c-4844-88e5-8978d61375f8	d48c2b9a-4798-4b61-8f24-e2831b8aede2	LOGIN_FAILED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	failure	2026-06-04 08:02:10.876+01
543e3714-d895-407e-9919-75ed51945867	d48c2b9a-4798-4b61-8f24-e2831b8aede2	LOGIN_FAILED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	failure	2026-06-04 08:07:41.872+01
1df38844-1067-4814-9677-7723ffcbabaf	d48c2b9a-4798-4b61-8f24-e2831b8aede2	LOGIN_FAILED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	failure	2026-06-04 08:07:43.371+01
e3fa770d-8565-457b-b80b-dc0625975dc9	7a9370e3-4e69-4a55-bf65-2d771e3a1478	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:23:05.077+01
16184f80-c89a-405f-8b0e-f039aeb494b5	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	success	2026-06-04 08:48:47.273+01
6aaeba3c-c8c7-4545-ba70-01298a7d4e14	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	axios/1.17.0	success	2026-06-04 08:49:44.148+01
1e57fff5-c819-4b22-8040-3f8df1c6349e	399a1630-283b-467c-a353-e975c8f23c3e	OTP_VERIFIED	\N	\N	\N	\N	::1	axios/1.17.0	success	2026-06-04 08:49:44.226+01
53389d0b-81b6-440b-ad25-9ff39eab2243	399a1630-283b-467c-a353-e975c8f23c3e	PASSWORD_RESET_REQUESTED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:51:59.938+01
5c73d02b-4f64-4052-8f77-bf14461add11	399a1630-283b-467c-a353-e975c8f23c3e	PASSWORD_RESET	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:52:44.222+01
e0b4646d-0f83-43e7-b440-79ac151d4f72	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:53:00.38+01
f3902f9e-335f-4fd6-9c9b-fc4d0605df79	399a1630-283b-467c-a353-e975c8f23c3e	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:53:16.857+01
4e37fa2f-d0ca-4f17-a7d1-475c760feaad	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:53:31.114+01
cda79e3d-2b54-4310-8a80-445e1fb58050	399a1630-283b-467c-a353-e975c8f23c3e	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:53:50.843+01
a824417f-47a6-4835-8f3d-61d447e6fb26	7a9370e3-4e69-4a55-bf65-2d771e3a1478	PASSWORD_RESET_REQUESTED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:56:27.337+01
fb95f05f-dc29-40d9-9d26-caa48813d3af	7a9370e3-4e69-4a55-bf65-2d771e3a1478	PASSWORD_RESET_REQUESTED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:56:36.433+01
02ba81f7-8acc-4f0b-a2d7-ef4f21a7b9b2	ffd566ca-bd90-4167-b2e7-0e08c01cac58	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:59:31.435+01
0c78e308-cf57-4f86-9113-71f13da8a5dd	ffd566ca-bd90-4167-b2e7-0e08c01cac58	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 08:59:56.577+01
b35d5277-806d-47bd-8528-e7c0d808ff8e	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:02:08.027+01
23f47977-d8c9-4dff-9ef5-915c948001a3	399a1630-283b-467c-a353-e975c8f23c3e	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:02:22.636+01
e96e95bf-d478-4fcf-8828-873dbb95adfd	c8037056-8a28-4890-9305-21175dc43c99	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:04:03.068+01
20b686d4-d64f-46be-b001-c8cf2aaac7ab	c8037056-8a28-4890-9305-21175dc43c99	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:04:35.537+01
f0613234-33e6-4ede-baa5-c0b881ea172a	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:06:39.053+01
e02f3a52-770a-4dcc-a620-a64b9bbeb991	399a1630-283b-467c-a353-e975c8f23c3e	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:06:54.667+01
63d89b13-b673-4854-b2e5-3bf63dae4b11	ffd566ca-bd90-4167-b2e7-0e08c01cac58	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:11:44.963+01
53d7e88a-a37e-41c4-9600-e7191e16d872	ffd566ca-bd90-4167-b2e7-0e08c01cac58	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:11:58.515+01
abadb7bb-b2e4-4665-a8e7-a76bc30279a6	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:19:18.382+01
648fa689-901f-4efa-8164-e8045e3cac3c	399a1630-283b-467c-a353-e975c8f23c3e	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:19:32.089+01
da2cbd84-5ffe-4f3c-b5f4-bf959c77c9de	ffd566ca-bd90-4167-b2e7-0e08c01cac58	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:20:05.798+01
74fd0c32-494d-437e-8fec-43a1c287d4f8	ffd566ca-bd90-4167-b2e7-0e08c01cac58	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:20:40.02+01
736a97a3-38ba-4aa5-853c-386e1447dbe5	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:31:23.18+01
af33f0e8-b921-4970-b926-471e382ea7a0	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:31:56.677+01
cb4eafcf-964e-427f-99a4-8fc16f689a85	399a1630-283b-467c-a353-e975c8f23c3e	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:32:45.849+01
21cb15d6-44b3-4c99-8e82-e25ed41a64c8	c8037056-8a28-4890-9305-21175dc43c99	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:34:26.941+01
33b91dad-db96-4def-9578-f074c448c95d	c8037056-8a28-4890-9305-21175dc43c99	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:34:41.086+01
e9c35fef-4f28-48a3-adf1-2f067a146dcc	399a1630-283b-467c-a353-e975c8f23c3e	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:37:10.75+01
eaa4b8db-05d5-4be4-8135-a7250a88d8ca	399a1630-283b-467c-a353-e975c8f23c3e	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:37:22.317+01
6c37ac03-bf0a-4f9b-a712-d4d100258afa	ffd566ca-bd90-4167-b2e7-0e08c01cac58	LOGIN_OTP_SENT	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:38:24.759+01
09a7ec72-557b-4b00-926f-1f0757ef3a34	ffd566ca-bd90-4167-b2e7-0e08c01cac58	OTP_VERIFIED	\N	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	success	2026-06-04 09:38:37.847+01
\.


--
-- Data for Name: extinguishers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.extinguishers (id, "serialNumber", location, building, floor, room, type, size, manufacturer, model, "installationDate", "expiryDate", "lastInspectionDate", "nextInspectionDate", status, pressure, notes, "qrCode", "createdBy", "createdAt", "updatedAt") FROM stdin;
db729a1c-ee9d-457e-ac2c-2ae580c6f1b9	TWZ-KGL-001	Kigali City Tower — Ground Floor	Kigali City Tower	G	Lobby	co2	5lbs	Amerex	B500	2023-01-15	2026-01-15	\N	2024-01-15	active	195 PSI	\N	\N	ffd566ca-bd90-4167-b2e7-0e08c01cac58	2026-06-04 07:52:21.331+01	2026-06-04 07:52:21.331+01
32b739a8-08c7-4ce2-b823-9c8aca75f7a3	TWZ-KGL-002	CHIC Building — Server Room	CHIC Building	2	Server Room	dry_chemical	9lbs	Kidde	ProLine	2022-06-01	2025-06-01	\N	2023-05-31	active	180 PSI	\N	\N	ffd566ca-bd90-4167-b2e7-0e08c01cac58	2026-06-04 07:52:21.337+01	2026-06-04 07:52:21.337+01
6af5f87e-41c2-403d-bacc-9fc026b8cb20	TWZ-KGL-003	Kigali Convention Centre — Hall A	KCC	1	Hall A	foam	12lbs	Ansul	A411	2021-03-20	2024-03-20	\N	2022-03-20	expired	175 PSI	\N	\N	ffd566ca-bd90-4167-b2e7-0e08c01cac58	2026-06-04 07:52:21.339+01	2026-06-04 07:52:21.339+01
d45d9080-c74d-441c-9ec2-2229296617d4	TWZ-KGL-004	Remera Industrial Park — Warehouse B	Warehouse B	1	Loading Bay	water	2.5lbs	Badger	W250	2024-02-10	2027-02-10	\N	2025-02-10	active	200 PSI	\N	\N	ffd566ca-bd90-4167-b2e7-0e08c01cac58	2026-06-04 07:52:21.341+01	2026-06-04 07:52:21.341+01
2dd802f0-c03b-4e3f-a678-7b70cdde7cf4	TWZ-KGL-005	Nyarutarama Office Park — Block C	Block C	3	Corridor	co2	20lbs	Amerex	B456	2023-09-01	2026-09-01	\N	2024-09-01	maintenance	190 PSI	\N	\N	ffd566ca-bd90-4167-b2e7-0e08c01cac58	2026-06-04 07:52:21.343+01	2026-06-04 07:52:21.343+01
\.


--
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inspections (id, "extinguisherId", "scheduledBy", "assignedInspector", "scheduledDate", "completedDate", status, type, result, findings, notes, "nextInspectionDate", "notifiedAt", "createdAt", "updatedAt") FROM stdin;
a1ba13a3-fffc-4647-9c07-84d74ba2b22c	db729a1c-ee9d-457e-ac2c-2ae580c6f1b9	ffd566ca-bd90-4167-b2e7-0e08c01cac58	7a9370e3-4e69-4a55-bf65-2d771e3a1478	2026-06-11 07:52:23.322+01	\N	scheduled	routine	\N	\N	Quarterly inspection — Kigali City Tower	\N	\N	2026-06-04 07:52:23.323+01	2026-06-04 07:52:23.323+01
cbeb3561-e8db-4431-8443-bc2abb92d94d	32b739a8-08c7-4ce2-b823-9c8aca75f7a3	ffd566ca-bd90-4167-b2e7-0e08c01cac58	7a9370e3-4e69-4a55-bf65-2d771e3a1478	2025-11-01 00:00:00+00	2025-11-02 00:00:00+00	completed	annual	passed	Pressure gauge in normal range. Seal intact.	CHIC Building server room	\N	\N	2026-06-04 07:52:23.333+01	2026-06-04 07:52:23.333+01
\.


--
-- Data for Name: maintenance_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.maintenance_logs (id, "extinguisherId", "inspectionId", "performedBy", "actionDate", "actionsTaken", "conditionsNoted", "partsReplaced", cost, "nextServiceDate", status, "createdAt", "updatedAt") FROM stdin;
84d4b852-6e43-4cc0-9e51-a87428ddb5b6	32b739a8-08c7-4ce2-b823-9c8aca75f7a3	cbeb3561-e8db-4431-8443-bc2abb92d94d	7a9370e3-4e69-4a55-bf65-2d771e3a1478	2025-11-02	Replaced pressure gauge seal. Verified discharge hose.	Minor dust on unit exterior — cleaned.	["pressure gauge seal"]	45.50	\N	completed	2026-06-04 07:52:23.336+01	2026-06-04 07:52:23.336+01
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otp_codes (id, user_id, email, otp_code, purpose, expires_at, is_used, created_at) FROM stdin;
4c4d1c54-a4a1-47c0-b8aa-e40c24ece7df	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	806030	login	2026-06-04 08:07:42.169+01	t	2026-06-04 07:57:42.174+01
c9b69e50-7b39-4f62-87ae-4789364479e9	7a9370e3-4e69-4a55-bf65-2d771e3a1478	ukemuk1@gmail.com	614976	login	2026-06-04 08:33:02.372+01	f	2026-06-04 08:23:02.388+01
e9aad603-c8c3-44ea-bfb7-63b60b0b2146	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	333131	login	2026-06-04 08:10:10.071+01	t	2026-06-04 08:00:10.084+01
807d4293-426f-4673-96c2-531212ed5bb6	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	767092	login	2026-06-04 08:58:43.573+01	t	2026-06-04 08:48:43.589+01
ebf3ec86-485e-4944-8c7d-054efd29afb7	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	810417	login	2026-06-04 08:59:40.401+01	t	2026-06-04 08:49:40.407+01
f54d008c-93a0-477a-90d9-94dff3983d08	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	579942	reset	2026-06-04 09:01:55.17+01	t	2026-06-04 08:51:55.176+01
9886755d-f38a-497e-9ad1-dd567cc81770	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	152256	login	2026-06-04 09:02:57.004+01	t	2026-06-04 08:52:57.013+01
75103380-0b92-43ae-aa79-aad4df080bce	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	604594	login	2026-06-04 09:03:27.697+01	t	2026-06-04 08:53:27.704+01
030ed857-131c-47e4-90d1-6ca0d098f914	7a9370e3-4e69-4a55-bf65-2d771e3a1478	ukemuk1@gmail.com	739100	reset	2026-06-04 09:06:07.311+01	t	2026-06-04 08:56:07.313+01
5a4163b4-1f84-4dd4-ac7d-a4a92a228b72	7a9370e3-4e69-4a55-bf65-2d771e3a1478	ukemuk1@gmail.com	593733	reset	2026-06-04 09:06:32.749+01	f	2026-06-04 08:56:32.759+01
ef507436-5e39-48e1-bb22-455ab40aa72d	ffd566ca-bd90-4167-b2e7-0e08c01cac58	cabledie@gmail.com	469379	login	2026-06-04 09:09:27.381+01	t	2026-06-04 08:59:27.46+01
03ac4053-bca4-4ab4-bea8-cb9fa6408139	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	907612	login	2026-06-04 09:12:02.377+01	t	2026-06-04 09:02:02.384+01
df060000-194e-406b-a337-3a515cee7b9a	c8037056-8a28-4890-9305-21175dc43c99	devroom210@gmail.com	941328	login	2026-06-04 09:13:59.438+01	t	2026-06-04 09:03:59.445+01
e2a77320-edbe-4c2f-917f-62604a362a20	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	356686	login	2026-06-04 09:16:34.166+01	t	2026-06-04 09:06:34.171+01
c3fbef7e-dc26-4a97-b396-b8fcf127c821	ffd566ca-bd90-4167-b2e7-0e08c01cac58	cabledie@gmail.com	719710	login	2026-06-04 09:21:40.654+01	t	2026-06-04 09:11:40.663+01
32bc011a-3dec-48ed-9ee8-22c8cb0f2726	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	661868	login	2026-06-04 09:29:13.908+01	t	2026-06-04 09:19:13.916+01
046c49c3-6742-4d47-bff1-908af596c094	ffd566ca-bd90-4167-b2e7-0e08c01cac58	cabledie@gmail.com	126913	login	2026-06-04 09:30:02.688+01	t	2026-06-04 09:20:02.694+01
53a276dd-528a-4a74-b6f2-5f7498b62ad8	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	479806	login	2026-06-04 09:41:19.667+01	t	2026-06-04 09:31:19.677+01
1b7e031d-96a5-41d6-ac28-596243e1972c	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	423862	login	2026-06-04 09:41:52.644+01	t	2026-06-04 09:31:52.649+01
2b45066c-7cba-48b3-ab9b-33cbc81763b2	c8037056-8a28-4890-9305-21175dc43c99	devroom210@gmail.com	177915	login	2026-06-04 09:44:22.635+01	t	2026-06-04 09:34:22.638+01
5f092ab3-76df-497a-8a2e-99ac66189d3f	399a1630-283b-467c-a353-e975c8f23c3e	benmu91@gmail.com	546908	login	2026-06-04 09:47:07.601+01	t	2026-06-04 09:37:07.604+01
0fbdbafc-2782-4ebf-8dc6-2cad1f89a6ba	ffd566ca-bd90-4167-b2e7-0e08c01cac58	cabledie@gmail.com	650216	login	2026-06-04 09:48:19.199+01	t	2026-06-04 09:38:19.208+01
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, "userId", token, "expiresAt", "isRevoked", "userAgent", "ipAddress", "createdAt", "updatedAt") FROM stdin;
006ec8a3-8b4d-44cb-ad42-fad91f4de62e	399a1630-283b-467c-a353-e975c8f23c3e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTlhMTYzMC0yODNiLTQ2N2MtYTM1My1lOTc1YzhmMjNjM2UiLCJqdGkiOiIwM2QxMWNmZS1kZDZjLTRlNmUtOTJmMC01Nzc3MTVjNzVlMDgiLCJpYXQiOjE3ODA1NTYyOTMsImV4cCI6MTc4MTE2MTA5M30.ry2ODQTRSGekAwBRqxmLl5UzIWl-C7nfgKvmz4Vp5Xg	2026-06-11 07:58:13.947+01	t	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.6.31 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36	::1	2026-06-04 07:58:13.947+01	2026-06-04 08:52:44.219+01
670f0819-c8f3-4ea0-b071-c0b8893e8d48	399a1630-283b-467c-a353-e975c8f23c3e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTlhMTYzMC0yODNiLTQ2N2MtYTM1My1lOTc1YzhmMjNjM2UiLCJqdGkiOiJmNzM0YWIwMC0zMjM1LTQ0M2YtYmJiZC0xZGM4ZGE4NTc4OWEiLCJpYXQiOjE3ODA1NTkzODQsImV4cCI6MTc4MTE2NDE4NH0.8r2plvK7ZU0QGay5MYVqpg44VU3cPngSa-DyAHQOQfA	2026-06-11 08:49:44.222+01	t	axios/1.17.0	::1	2026-06-04 08:49:44.223+01	2026-06-04 08:52:44.219+01
4dc709f1-147c-4b91-858c-5ad13fad1d61	399a1630-283b-467c-a353-e975c8f23c3e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTlhMTYzMC0yODNiLTQ2N2MtYTM1My1lOTc1YzhmMjNjM2UiLCJqdGkiOiI0ZThlNDA3NC1iYzY5LTQ5MDItYjRkMS1kODZiNDk0NjJjNWMiLCJpYXQiOjE3ODA1NTk1OTYsImV4cCI6MTc4MTE2NDM5Nn0.OtTXLWYb3N5UmusYapALNm0_GoLUYevgkQvkMuWzffM	2026-06-11 08:53:16.84+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 08:53:16.84+01	2026-06-04 08:53:16.84+01
0416010d-03fb-4905-ba35-f5e97018cae7	399a1630-283b-467c-a353-e975c8f23c3e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTlhMTYzMC0yODNiLTQ2N2MtYTM1My1lOTc1YzhmMjNjM2UiLCJqdGkiOiIxNjc2ZDc1NC0yMGE0LTQxODMtYmNlNS1hMTE3MzhkY2ZmZGYiLCJpYXQiOjE3ODA1NTk2MzAsImV4cCI6MTc4MTE2NDQzMH0.r3y6eCayrHpR0-R2CEGW7qNaqZO5Z_13CU_Vg1VOE40	2026-06-11 08:53:50.839+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 08:53:50.84+01	2026-06-04 08:53:50.84+01
d7271da1-43d1-4493-89f0-109f9b5649fa	ffd566ca-bd90-4167-b2e7-0e08c01cac58	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZmQ1NjZjYS1iZDkwLTQxNjctYjJlNy0wZTA4YzAxY2FjNTgiLCJqdGkiOiIwMGFjMjZmNi0wZDI3LTRmNzYtOTMyZC1iMmUxMjQ1ZTIyZjIiLCJpYXQiOjE3ODA1NTk5OTYsImV4cCI6MTc4MTE2NDc5Nn0.vFMvPeI-K6-az33PLP3Xrae5jq1p2AWE0OQlU0QZuBk	2026-06-11 08:59:56.571+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 08:59:56.571+01	2026-06-04 08:59:56.571+01
de2747d8-17bd-4562-877a-364dec874c14	399a1630-283b-467c-a353-e975c8f23c3e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTlhMTYzMC0yODNiLTQ2N2MtYTM1My1lOTc1YzhmMjNjM2UiLCJqdGkiOiI0NDUzOTYyNy0xOTIwLTQwMDYtOTdhNC01OWQxYTAxYWExODQiLCJpYXQiOjE3ODA1NjAxNDIsImV4cCI6MTc4MTE2NDk0Mn0.zQfHNkQXNnmqzhcW9FSqC9IBxDEKrCs78DVu6AEAjnE	2026-06-11 09:02:22.632+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:02:22.632+01	2026-06-04 09:02:22.632+01
0ab19b3c-f0c2-4727-9b0d-7b619b8c48f6	c8037056-8a28-4890-9305-21175dc43c99	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjODAzNzA1Ni04YTI4LTQ4OTAtOTMwNS0yMTE3NWRjNDNjOTkiLCJqdGkiOiJiMjkzMGMzNS1mYTA0LTRjZDUtYjYyYi01YzM1MGJiOWRlNGQiLCJpYXQiOjE3ODA1NjAyNzUsImV4cCI6MTc4MTE2NTA3NX0.4XUdCaGmvAPaSzRLItlLedBTu6Kx4F9kpWtuYwO1c-w	2026-06-11 09:04:35.534+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:04:35.534+01	2026-06-04 09:04:35.534+01
f68fe754-016b-40ad-80a3-a5e6423508a7	399a1630-283b-467c-a353-e975c8f23c3e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTlhMTYzMC0yODNiLTQ2N2MtYTM1My1lOTc1YzhmMjNjM2UiLCJqdGkiOiI1YTU2MWRiYy04ZTk2LTRmMTQtYjU4NC1kNTEyOGM4NmU1MDgiLCJpYXQiOjE3ODA1NjA0MTQsImV4cCI6MTc4MTE2NTIxNH0.7dBK5T0i-vLyphwdiUZix2-QPySicwVdoFt09RldgoY	2026-06-11 09:06:54.663+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:06:54.663+01	2026-06-04 09:06:54.663+01
ab1fdac9-704a-499f-8512-ddfcd468a7ef	ffd566ca-bd90-4167-b2e7-0e08c01cac58	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZmQ1NjZjYS1iZDkwLTQxNjctYjJlNy0wZTA4YzAxY2FjNTgiLCJqdGkiOiI5YWM5Njc3Ni1kYjdhLTRkOTMtODA2Ni03NDM0YzZlN2VmNTMiLCJpYXQiOjE3ODA1NjA3MTgsImV4cCI6MTc4MTE2NTUxOH0.iQBBjug6cmK1vbxbDwsSV1WptgeWhDKUFViRmFlJDZ8	2026-06-11 09:11:58.51+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:11:58.51+01	2026-06-04 09:11:58.51+01
7d6abb05-f5b6-407c-864f-b623f0d55d95	399a1630-283b-467c-a353-e975c8f23c3e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTlhMTYzMC0yODNiLTQ2N2MtYTM1My1lOTc1YzhmMjNjM2UiLCJqdGkiOiIwZjNiYTQyZS01MDcxLTRhZmMtODlmMC0xOGM0NGM4ZmVmY2EiLCJpYXQiOjE3ODA1NjExNzIsImV4cCI6MTc4MTE2NTk3Mn0.tKrDBO02ariYkasZacUQXX90Tzsn_UBWgC2J29WSuT4	2026-06-11 09:19:32.082+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:19:32.082+01	2026-06-04 09:19:32.082+01
83424b4c-4d67-4ecf-bd9c-baee961d2a5b	ffd566ca-bd90-4167-b2e7-0e08c01cac58	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZmQ1NjZjYS1iZDkwLTQxNjctYjJlNy0wZTA4YzAxY2FjNTgiLCJqdGkiOiJmYTI4MWJiMy1mN2I0LTQwYTctOTlhMy01MmYwZWIzMjdjNDUiLCJpYXQiOjE3ODA1NjEyNDAsImV4cCI6MTc4MTE2NjA0MH0.QFiPOxKIBGgqd_rqDaFBRPJldxMwsT-lo9fOlZm2QPo	2026-06-11 09:20:40.017+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:20:40.017+01	2026-06-04 09:20:40.017+01
b16a87ed-f6be-4cc0-8fb6-aaa6e6fdb6ad	399a1630-283b-467c-a353-e975c8f23c3e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTlhMTYzMC0yODNiLTQ2N2MtYTM1My1lOTc1YzhmMjNjM2UiLCJqdGkiOiJjZGQ0NDI0OS1kNzBhLTQzNWQtYWFmNC1mOTQ3MDc3NTdlYWMiLCJpYXQiOjE3ODA1NjE5NjUsImV4cCI6MTc4MTE2Njc2NX0.oJaZCJPYYHeu_qU_Dl_5Mo1lMjUYmRUp22bLQD-FVuw	2026-06-11 09:32:45.846+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:32:45.846+01	2026-06-04 09:32:45.846+01
6f1e32a9-5b76-4b66-a736-a51216bfefbe	c8037056-8a28-4890-9305-21175dc43c99	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjODAzNzA1Ni04YTI4LTQ4OTAtOTMwNS0yMTE3NWRjNDNjOTkiLCJqdGkiOiJiNzVmODYxYS1hM2NmLTQ3NWQtOWVhYy1mMDViMDY5NjI0NTUiLCJpYXQiOjE3ODA1NjIwODEsImV4cCI6MTc4MTE2Njg4MX0.DPMSggvzGcVRwakgAdz98TI-MyLBxozpgMzbCAZyPGI	2026-06-11 09:34:41.083+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:34:41.083+01	2026-06-04 09:34:41.083+01
6c623f46-5862-4b2c-8061-1597682f8cf7	399a1630-283b-467c-a353-e975c8f23c3e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTlhMTYzMC0yODNiLTQ2N2MtYTM1My1lOTc1YzhmMjNjM2UiLCJqdGkiOiIxYzQ1MGRkMS04Y2UyLTQ4NDUtYjFjMC1mODRjZWZlNzNhZWQiLCJpYXQiOjE3ODA1NjIyNDIsImV4cCI6MTc4MTE2NzA0Mn0.rL6anaScJOK-64GQvwRyN7UNPrpHnhqQ4v0ImH41Nj4	2026-06-11 09:37:22.314+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:37:22.314+01	2026-06-04 09:37:22.314+01
cf39e74b-8af3-4b7f-8eae-4e7a5ecfbe2c	ffd566ca-bd90-4167-b2e7-0e08c01cac58	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZmQ1NjZjYS1iZDkwLTQxNjctYjJlNy0wZTA4YzAxY2FjNTgiLCJqdGkiOiIzZWI4ZjJlMS0zODlkLTQ0YWMtYjk0NC1mODY3MjRjYmZmZDciLCJpYXQiOjE3ODA1NjIzMTcsImV4cCI6MTc4MTE2NzExN30.GXLeih8BMnr67qAbeznDfM0frnzPUS526Y7Jef-h6ZI	2026-06-11 09:38:37.842+01	f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	::1	2026-06-04 09:38:37.842+01	2026-06-04 09:38:37.842+01
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, "firstName", "lastName", email, password, role, "isActive", "mustChangePassword", "isEmailVerified", phone, department, "lastLoginAt", "passwordChangedAt", "profileImage", "createdAt", "updatedAt") FROM stdin;
7a9370e3-4e69-4a55-bf65-2d771e3a1478	Jean Bosco	Uwimana	ukemuk1@gmail.com	$2b$12$MUDrAEiI1z26mO2mf8RIquE10yFyvRJ7QdgIN8Dz0FP6m962CrJ3u	inspector	f	f	t	+250788111001	Field Inspections — Kigali	\N	\N	\N	2026-06-04 07:52:19.626+01	2026-06-04 09:00:06.514+01
d48c2b9a-4798-4b61-8f24-e2831b8aede2	Melisa	UK	ukmeuk1@gmail.com	$2b$12$VUkSgPstceTR2zHpJakba.MmXVtktLaqyDoe.k31yLsKEhw1uTE1.	user	f	t	t			\N	\N	\N	2026-06-04 08:01:16.74+01	2026-06-04 09:00:06.518+01
c8037056-8a28-4890-9305-21175dc43c99	Patrick	Niyonsenga	devroom210@gmail.com	$2b$12$MUDrAEiI1z26mO2mf8RIquE10yFyvRJ7QdgIN8Dz0FP6m962CrJ3u	user	t	f	t	+250787333003	Facilities — Gasabo	2026-06-04 09:34:41.085+01	\N	\N	2026-06-04 07:52:19.633+01	2026-06-04 09:34:41.085+01
399a1630-283b-467c-a353-e975c8f23c3e	Ben	Admin	benmu91@gmail.com	$2b$12$oT8LkWw9iP5rVtkZ50xiB.qpLuYB34.N0xl0pSurlDSLrWSjSaLee	admin	t	f	t	+250788000000	TWZ HQ — Kigali	2026-06-04 09:37:22.316+01	2026-06-04 08:52:44.202+01	\N	2026-06-04 07:52:19.609+01	2026-06-04 09:37:22.316+01
ffd566ca-bd90-4167-b2e7-0e08c01cac58	Marie Chantal	Mukamazimpaka	cabledie@gmail.com	$2b$12$MUDrAEiI1z26mO2mf8RIquE10yFyvRJ7QdgIN8Dz0FP6m962CrJ3u	inspector	t	f	t	+250789222002	Field Inspections — Kigali	2026-06-04 09:38:37.844+01	\N	\N	2026-06-04 07:52:19.63+01	2026-06-04 09:38:37.845+01
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: extinguishers extinguishers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT extinguishers_pkey PRIMARY KEY (id);


--
-- Name: extinguishers extinguishers_serialNumber_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT "extinguishers_serialNumber_key" UNIQUE ("serialNumber");


--
-- Name: extinguishers extinguishers_serialNumber_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT "extinguishers_serialNumber_key1" UNIQUE ("serialNumber");


--
-- Name: extinguishers extinguishers_serialNumber_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT "extinguishers_serialNumber_key2" UNIQUE ("serialNumber");


--
-- Name: extinguishers extinguishers_serialNumber_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT "extinguishers_serialNumber_key3" UNIQUE ("serialNumber");


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
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- Name: users users_email_key10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key10 UNIQUE (email);


--
-- Name: users users_email_key11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key11 UNIQUE (email);


--
-- Name: users users_email_key12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key12 UNIQUE (email);


--
-- Name: users users_email_key13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key13 UNIQUE (email);


--
-- Name: users users_email_key14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key14 UNIQUE (email);


--
-- Name: users users_email_key15; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key15 UNIQUE (email);


--
-- Name: users users_email_key16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key16 UNIQUE (email);


--
-- Name: users users_email_key17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key17 UNIQUE (email);


--
-- Name: users users_email_key18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key18 UNIQUE (email);


--
-- Name: users users_email_key19; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key19 UNIQUE (email);


--
-- Name: users users_email_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key2 UNIQUE (email);


--
-- Name: users users_email_key20; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key20 UNIQUE (email);


--
-- Name: users users_email_key21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key21 UNIQUE (email);


--
-- Name: users users_email_key22; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key22 UNIQUE (email);


--
-- Name: users users_email_key23; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key23 UNIQUE (email);


--
-- Name: users users_email_key24; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key24 UNIQUE (email);


--
-- Name: users users_email_key25; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key25 UNIQUE (email);


--
-- Name: users users_email_key26; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key26 UNIQUE (email);


--
-- Name: users users_email_key27; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key27 UNIQUE (email);


--
-- Name: users users_email_key28; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key28 UNIQUE (email);


--
-- Name: users users_email_key29; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key29 UNIQUE (email);


--
-- Name: users users_email_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key3 UNIQUE (email);


--
-- Name: users users_email_key30; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key30 UNIQUE (email);


--
-- Name: users users_email_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key4 UNIQUE (email);


--
-- Name: users users_email_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key5 UNIQUE (email);


--
-- Name: users users_email_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key6 UNIQUE (email);


--
-- Name: users users_email_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key7 UNIQUE (email);


--
-- Name: users users_email_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key8 UNIQUE (email);


--
-- Name: users users_email_key9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key9 UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: extinguishers_expiry_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extinguishers_expiry_date ON public.extinguishers USING btree ("expiryDate");


--
-- Name: extinguishers_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extinguishers_location ON public.extinguishers USING btree (location);


--
-- Name: extinguishers_serial_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX extinguishers_serial_number ON public.extinguishers USING btree ("serialNumber");


--
-- Name: extinguishers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX extinguishers_status ON public.extinguishers USING btree (status);


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
-- Name: otp_codes_email_purpose_is_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX otp_codes_email_purpose_is_used ON public.otp_codes USING btree (email, purpose, is_used);


--
-- Name: otp_codes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX otp_codes_expires_at ON public.otp_codes USING btree (expires_at);


--
-- Name: otp_codes_user_id_purpose_is_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX otp_codes_user_id_purpose_is_used ON public.otp_codes USING btree (user_id, purpose, is_used);


--
-- Name: users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email ON public.users USING btree (email);


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maintenance_logs maintenance_logs_inspectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT "maintenance_logs_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES public.inspections(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: otp_codes otp_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KebRLgaPb3mIrsujGzBAesyrnsSBEonCDSBMJBDCM8NbxfxR0kRqNKT60NpeNib

