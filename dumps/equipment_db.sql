--
-- PostgreSQL database dump
--

\restrict qKLDX6xAeio50GbNrFGX6midjsTc4aGFXighgLOujXlwWnvhBTDZzGCXjm4TV4K

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

DROP INDEX IF EXISTS public.extinguishers_status;
DROP INDEX IF EXISTS public.extinguishers_serial_number;
DROP INDEX IF EXISTS public.extinguishers_location;
DROP INDEX IF EXISTS public.extinguishers_expiry_date;
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS "extinguishers_serialNumber_key4";
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS "extinguishers_serialNumber_key3";
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS "extinguishers_serialNumber_key2";
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS "extinguishers_serialNumber_key1";
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS "extinguishers_serialNumber_key";
ALTER TABLE IF EXISTS ONLY public.extinguishers DROP CONSTRAINT IF EXISTS extinguishers_pkey;
DROP TABLE IF EXISTS public.extinguishers;
DROP TYPE IF EXISTS public.enum_extinguishers_type;
DROP TYPE IF EXISTS public.enum_extinguishers_status;
DROP TYPE IF EXISTS public.enum_extinguishers_size;
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


SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Data for Name: extinguishers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.extinguishers (id, "serialNumber", location, building, floor, room, type, size, manufacturer, model, "installationDate", "expiryDate", "lastInspectionDate", "nextInspectionDate", status, pressure, notes, "qrCode", "createdBy", "createdAt", "updatedAt") FROM stdin;
7e27606f-5eb0-4285-ac65-13af9b2cf622	SN-123333	Main Lobby	1	2	00	co2	5lbs	Mango	Mfg 2020	2026-06-04	2026-06-05	\N	2027-06-04	active	196lb	Done	\N	c8037056-8a28-4890-9305-21175dc43c99	2026-06-04 09:05:49.815+01	2026-06-04 09:05:49.815+01
13b14a1e-c914-4f4b-89d6-ec807e48fa48	AEreadfa12342	area1	rca	2	12	water	5lbs	rff	Mfg 2020	2026-06-05	2026-06-19	\N	2027-06-05	active	167	area	\N	c8037056-8a28-4890-9305-21175dc43c99	2026-06-04 09:36:07.494+01	2026-06-04 09:36:07.494+01
\.


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
-- Name: extinguishers extinguishers_serialNumber_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extinguishers
    ADD CONSTRAINT "extinguishers_serialNumber_key4" UNIQUE ("serialNumber");


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
-- PostgreSQL database dump complete
--

\unrestrict qKLDX6xAeio50GbNrFGX6midjsTc4aGFXighgLOujXlwWnvhBTDZzGCXjm4TV4K

