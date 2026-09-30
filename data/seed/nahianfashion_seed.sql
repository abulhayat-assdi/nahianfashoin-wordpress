--
-- PostgreSQL database dump
--

\restrict g66P1fy17y1tdXmZUuSx5ie6Z87KTAI1YcczsFez9qD3Qh22h3P0KZFLXRq5Y5s

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blocked_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_items (
    id text NOT NULL,
    type text NOT NULL,
    value text NOT NULL,
    reason text DEFAULT 'No reason specified'::text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: brand_story; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_story (
    id text DEFAULT 'main'::text NOT NULL,
    eyebrow text,
    title text,
    body text,
    body2 text,
    cta_text text,
    founder_name text,
    founder_title text,
    founder_signature text,
    founder_image text,
    care_eyebrow text,
    care_title text,
    impact1_title text,
    impact1_body text,
    impact2_title text,
    impact2_body text,
    impact3_title text,
    impact3_body text,
    farmers_image text
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    show_in_header boolean DEFAULT false NOT NULL,
    show_in_footer boolean DEFAULT false NOT NULL
);


--
-- Name: combo_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.combo_offers (
    id text NOT NULL,
    title text NOT NULL,
    subtitle text,
    price text NOT NULL,
    original_price text,
    image_url text,
    video_url text,
    badge text,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    value numeric(65,30) NOT NULL,
    min_order numeric(65,30),
    max_uses integer DEFAULT 100 NOT NULL,
    used_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    role text DEFAULT 'customer'::text NOT NULL,
    password_hash text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: footer_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.footer_config (
    id integer DEFAULT 1 NOT NULL,
    columns jsonb,
    privacy text,
    terms text,
    newsletter text,
    social text,
    ticker jsonb
);


--
-- Name: home_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.home_config (
    id integer DEFAULT 1 NOT NULL,
    banners jsonb,
    ticker_items jsonb,
    data jsonb,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    order_id text NOT NULL,
    product_id text NOT NULL,
    product_name text NOT NULL,
    price numeric(65,30) NOT NULL,
    quantity integer NOT NULL,
    image_url text,
    color text,
    size text
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    order_id text NOT NULL,
    user_id text,
    customer_name text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    subtotal numeric(65,30) NOT NULL,
    shipping numeric(65,30) NOT NULL,
    discount numeric(65,30) DEFAULT 0 NOT NULL,
    total numeric(65,30) NOT NULL,
    payment_method text NOT NULL,
    amount_paid numeric(65,30) DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    placed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    consignment_id text,
    draft_session_id text,
    capi_sent boolean DEFAULT false NOT NULL,
    ip_address text
);


--
-- Name: pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pages (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    section text NOT NULL,
    content text,
    is_published boolean DEFAULT false NOT NULL,
    header_image text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    show_in_footer boolean DEFAULT false NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id text NOT NULL,
    token text NOT NULL,
    email text NOT NULL,
    type text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_reviews (
    id text NOT NULL,
    product_id text NOT NULL,
    name text NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    detail text,
    description text,
    price text NOT NULL,
    original_price text,
    discount text,
    per_cup_price text,
    packaging text,
    media_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    category text NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_gift boolean DEFAULT false NOT NULL,
    faqs jsonb DEFAULT '[]'::jsonb NOT NULL,
    steeping jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    colors jsonb DEFAULT '[]'::jsonb NOT NULL,
    sizes jsonb DEFAULT '[]'::jsonb NOT NULL,
    video_url text,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id integer DEFAULT 1 NOT NULL,
    site_name text,
    site_tagline text,
    meta_description text,
    contact_email text,
    whatsapp_number text,
    phone_number text,
    instagram_url text,
    facebook_url text,
    currency_code text DEFAULT 'BDT'::text,
    currency_symbol text DEFAULT 'Tk'::text,
    footer_social_heading text
);


--
-- Name: steadfast_api_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.steadfast_api_state (
    id text DEFAULT 'singleton'::text NOT NULL,
    last_call_at timestamp(3) without time zone,
    cooldown_until timestamp(3) without time zone,
    window_start timestamp(3) without time zone,
    window_count integer DEFAULT 0 NOT NULL,
    day_start timestamp(3) without time zone,
    day_count integer DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: steadfast_fraud_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.steadfast_fraud_cache (
    phone text NOT NULL,
    found boolean DEFAULT false NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    success integer DEFAULT 0 NOT NULL,
    cancel integer DEFAULT 0 NOT NULL,
    success_rate integer DEFAULT 0 NOT NULL,
    fraud_reports jsonb,
    fetched_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id text NOT NULL,
    type text DEFAULT 'review'::text NOT NULL,
    name text,
    image_url text,
    quote text,
    title text,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    rating integer DEFAULT 5 NOT NULL,
    video_url text
);


--
-- Data for Name: blocked_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blocked_items (id, type, value, reason, created_at) FROM stdin;
\.


--
-- Data for Name: brand_story; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brand_story (id, eyebrow, title, body, body2, cta_text, founder_name, founder_title, founder_signature, founder_image, care_eyebrow, care_title, impact1_title, impact1_body, impact2_title, impact2_body, impact3_title, impact3_body, farmers_image) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, slug, image_url, is_active, display_order, created_at, show_in_header, show_in_footer) FROM stdin;
96cfb0de-f60c-480a-a5d1-c8524c7a2edb	Borka set	burqa	https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787168205740-373353793.jpg	t	3	2026-08-19 19:24:37.923	t	t
7e3c4519-c0d9-47ab-8f56-e1c4f6deba21	Printed Panjabi 	print-panjabi	https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758829069-704353283.png	t	2	2026-05-22 09:09:32.536	t	t
86ad4e3a-3578-49b8-ab79-db13ebe05d01	Panjabi	panjabi	https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779396611705-385903465.jpg	t	3	2026-05-19 12:03:40.883	t	t
b3650976-bfaa-4776-ae06-f3c015e854de	FIFA JERSEY 2026	fifa_jersey_2026	https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781703001887-296624517.png	t	5	2026-06-17 13:13:30.261	t	t
5fec8d98-9e62-436d-8c06-ff4a804f600e	Embroidery Panjabi 	Premium-Punjabi	https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785169201372-245942260.jpg	t	1	2026-07-27 11:07:41.511	t	t
b9030d0a-26a3-4239-ba10-aee396852af0	Eid Special Combo	eid-special-combo	https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779397975400-661971172.png	t	4	2026-05-21 21:13:09.07	t	t
\.


--
-- Data for Name: combo_offers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.combo_offers (id, title, subtitle, price, original_price, image_url, video_url, badge, is_active, display_order, created_at) FROM stdin;
fb9521b6-b937-41de-b6f4-d58f78aead50	Combo Offer	Premium Style,Better Savings	1499	1950	https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779398388630-386421475.png		-23%	t	0	2026-05-21 21:20:04.96
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupons (id, code, type, value, min_order, max_uses, used_count, is_active, expires_at, created_at) FROM stdin;
9f6df704-57fd-4ed3-b552-ae54bca41559	HELLO	fixed	100.000000000000000000000000000000	\N	100	0	t	2026-05-22 00:00:00	2026-05-20 18:11:14.318
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, email, phone, address, role, password_hash, created_at) FROM stdin;
\.


--
-- Data for Name: footer_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.footer_config (id, columns, privacy, terms, newsletter, social, ticker) FROM stdin;
1	[{"id": "1", "links": [], "heading": "Learn"}, {"id": "2", "links": [{"label": "Panjabi"}, {"label": "Print Panjabi"}], "heading": "Shop"}, {"id": "3", "links": [{"label": "Returns & Exchanges"}, {"label": "Bulk Order"}], "heading": "Support"}, {"id": "4", "links": [{"label": "Account"}, {"label": "Orders"}], "heading": "My Account"}]	Privacy Policy	Terms & Conditions	\N	\N	\N
\.


--
-- Data for Name: home_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_config (id, banners, ticker_items, data, updated_at) FROM stdin;
1	[{"id": "1779150878139", "image_url": "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779397144183-550757453.png"}, {"id": "1780829212361", "image_url": "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1780828929461-529430746.png"}]	["Hello", "This is test announcement", "This is test annoucement 2"]	{"hero_text": {"title": "", "eyebrow": "", "btn_link": "", "btn_text": "", "subtitle": ""}}	2026-07-27 12:37:29.316
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_id, product_name, price, quantity, image_url, color, size) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, order_id, user_id, customer_name, phone, address, subtotal, shipping, discount, total, payment_method, amount_paid, status, placed_at, consignment_id, draft_session_id, capi_sent, ip_address) FROM stdin;
\.


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pages (id, slug, title, section, content, is_published, header_image, created_at, updated_at, show_in_footer) FROM stdin;
8a131794-02da-4113-9c49-d5fb5dad5c0b	test-blog	Test Blog	blog	<h1><em>This is a test blog. </em></h1><p></p>	t	https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/blog/blog-header.jpeg	2026-05-19 12:14:44.573	2026-05-19 12:14:44.573	f
10365fac-33f0-4fb6-a01a-e032b3a9ae0c	returns-exchanges	Returns & Exchanges	support	<h1>Hello</h1><p></p>	t	\N	2026-05-20 19:18:22.855	2026-05-20 19:18:22.855	t
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, token, email, type, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: product_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_reviews (id, product_id, name, rating, comment, created_at) FROM stdin;
52c1c7a2-f605-4ba3-a8dd-bc46b1ce7135	288be3ef-400a-4d68-bed8-f381c1cbb776	মো হোসাইন	5	jemon chaisi temon paisi	2026-07-03 14:06:14.133
04e383f4-9e45-4357-a51b-c081dbc22928	288be3ef-400a-4d68-bed8-f381c1cbb776	মো হোসাইন	5	khub valo	2026-07-03 14:04:08.743
a64e3cf2-9b22-4e44-b657-6f4e3d4a1d42	288be3ef-400a-4d68-bed8-f381c1cbb776	Shourab	5	kapor valo lagse	2026-06-28 05:47:11.783
c6c71afc-220d-421e-a194-96605b20584f	18130206-e719-4722-a1bc-92d70afaf42f	MSI	5	GOOD collection	2026-06-14 08:50:45.47
ebddc97c-afcc-4ee8-a2f9-b0d9111e506a	5d849820-6db7-4128-bc4a-6f2dab616134	sakib	5	good collection,trusted page . best of luck	2026-07-25 13:49:24.054
6508c28e-f71f-404d-b1d7-506bc789811a	5681b2cc-941b-43c2-a770-d5a42efc971f	Shakil	5	Good quality, ভালোই লেগেছে আমার কাছে	2026-08-06 08:59:49.825
e9594de2-f21e-42e1-ace9-10cf5ef3e01e	5681b2cc-941b-43c2-a770-d5a42efc971f	জুবায়ের	5	জিনিসের মান ভালো,	2026-08-06 09:00:41.035
c0497c11-a788-4317-8411-52ed342f15e2	51a09c24-209a-46fc-ab46-81a8aab3ce83	sakib	5	khub valo lagse panjabi ta , n tader behaviour o khub vlo	2026-08-23 19:27:37.537
7ee17e75-5cd2-46b3-bbc6-02123dd5a6e9	51a09c24-209a-46fc-ab46-81a8aab3ce83	rajib	5	dam onujayi good product , i reffer it to others	2026-08-23 19:28:58.664
c7e70a72-918a-453f-abc8-1f4f611028bd	51a09c24-209a-46fc-ab46-81a8aab3ce83	sadiya	5	khub valo peyechi vaia , thank you	2026-08-23 19:29:54.598
618b0bff-5604-475e-8ae8-d4bdb05f0ec1	5681b2cc-941b-43c2-a770-d5a42efc971f	Antor	5	⭐⭐⭐⭐⭐\n\nAlhamdulillah, 3 ta Panjabi ebong 3 ta Pajama order korechilam. Ajke hate peye sotti onek bhalo legeche. ❤️\n\nKaporer quality, color, design ebong fitting—shobkichui prottashar cheye onek bhalo chilo. Panjabigulo dekhte khub sundor ebong porle besh comfortable. Pajamagulor kapor o selaiyer man-o khub bhalo legeche. 👌✨\n\nPackaging sundor chilo ebong shobgulo product bhalo vabe peyechi. Shob miliye amar experience ta onek bhalo hoyeche. 🥰\n\nInshaAllah, samne abar-o order korbo. ❤️\n\n⭐⭐⭐⭐⭐ Highly Recommended! 🌟	2026-08-26 13:04:33.09
2c894dcc-09fa-453b-8bad-c014b82831dd	e6300b6b-7ba7-4e06-a24f-a9beca896dab	Antor	5	⭐⭐⭐⭐⭐\n\nAlhamdulillah, 3 ta Panjabi ebong 3 ta Pajama order korechilam. Ajke hate peye sotti onek bhalo legeche. ❤️\n\nKaporer quality, color, design ebong fitting—shobkichui prottashar cheye onek bhalo chilo. Panjabigulo dekhte khub sundor ebong porle besh comfortable. Pajamagulor kapor o selaiyer man-o khub bhalo legeche. 👌✨\n\nPackaging sundor chilo ebong shobgulo product bhalo vabe peyechi. Shob miliye amar experience ta onek bhalo hoyeche. 🥰\n\nInshaAllah, samne abar-o order korbo. ❤️\n\n⭐⭐⭐⭐⭐ Highly Recommended! 🌟	2026-08-26 13:04:58.681
5944342d-fdc1-4edf-bde3-6ca0e00d96c7	d93d2eea-b9ad-4352-be30-e94ffcbbf13a	bithi	5	ভাইয়া আপনাদের প্রোডাক্ট কোয়ালিটি খুব ভালো যাকে গিফট করেছে তার পছন্দ হয়েছে প্রোডাক্টের মান ভালো	2026-08-28 18:58:43.124
4227bd0f-e3e9-4d61-b4e8-85675facc1e7	56bdfc6e-0331-46a9-be01-727b9f8edb42	Mohammad Shihab	5	Very good quality...	2026-09-01 08:48:22.597
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, slug, name, detail, description, price, original_price, discount, per_cup_price, packaging, media_urls, category, is_available, is_featured, is_gift, faqs, steeping, created_at, colors, sizes, video_url, display_order) FROM stdin;
95287bc4-597b-4b35-ba40-a1b8492822b6	oxford-cotton-febric	Oxford cotton febric 	Soft, Comfortable & Stylish	<p>উন্নতমানের Oxford Cotton Fabric দিয়ে তৈরি এই পাঞ্জাবিটি। কাপড়ের টেক্সচার সুন্দর, পরতে আরামদায়ক এবং দৈনন্দিন ব্যবহার থেকে শুরু করে জুমআ, ঈদ, বিয়ে ও বিভিন্ন অনুষ্ঠানের জন্য উপযোগী।</p><p>✨ Premium Oxford Cotton Fabric</p><p>✨ নরম ও আরামদায়ক</p><p>✨ সুন্দর ও পরিপাটি ফিনিশিং</p><p>✨ টেকসই ও দীর্ঘস্থায়ী</p><p>✨ আধুনিক ও প্রিমিয়াম লুক</p><p>✨ বিভিন্ন সাইজ Available</p><p>Quality, Comfort &amp; Elegance — সবকিছু একসাথে। ❤️</p>	1150			\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789589327004-234047825.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789589322175-600577388.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789589323483-770397207.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789589325651-716322263.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789589326245-973410796.jpg"]	Panjabi	t	t	f	[]	\N	2026-09-16 20:09:39.108	[]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
5d849820-6db7-4128-bc4a-6f2dab616134	pakistani-lace-cottoon	Pakistani lace Cottoon	Be Comfort,Be Stylish 	<h3>Perfect swing quality</h3><h3>Looking gorgeous</h3><p>Soft and comfortable</p><p></p>	980	1320		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781702283548-489470722.jpg"]	Panjabi	t	t	f	[]	\N	2026-06-17 13:19:17.261	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781702323940-600840005.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781702324644-912918693.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781702325377-145366470.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
93703398-5206-4baf-bd33-c95c447c8995	brazil-customised-jersey	Brazil Customised Jersey 	Funny Football Fan Jersey 	<h3>Customized Funny meme Jersey </h3><p>Best quality febric </p><p>Perfect swing quality &amp; finishing </p><p></p>	500	950		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781726333511-948424130.png"]	FIFA JERSEY 2026	t	t	f	[]	\N	2026-06-17 19:59:19.046	[]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}]	\N	0
65c938c3-3c61-45bd-89d0-308d2d465fda	china-vangchur-febricss	China Vangchur Febricss	Be Comfort	<p><span style="color: rgb(8, 8, 9);">PREMIUM COLLECTION<br> সবার চোখ থাকবে আপনার দিকে<br>প্রিমিয়াম সফট পাঞ্জাবি<br>গরমে আরামদায়ক, কালার ফেইড হবে না<br>Make Your Own Style</span></p><h3><br></h3><p></p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402715656-757104033.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-21 22:32:42.002	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402722770-237364660.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402727725-848400014.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402733126-164553381.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
28a88906-9f0a-4e5c-b6b9-997eb7ddbf56	china-vangchur-febriic	China Vangchur Febriic	Be Comfort	<h3><span style="color: rgb(8, 8, 9);">PREMIUM COLLECTION<br> সবার চোখ থাকবে আপনার দিকে<br>প্রিমিয়াম সফট পাঞ্জাবি<br>গরমে আরামদায়ক, কালার ফেইড হবে না<br>Make Your Own Style</span></h3><h3><br></h3><p></p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402848934-852444310.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-21 22:34:59.542	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402855398-759295606.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402862662-660573327.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402866548-231187262.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
f5aec4af-0f89-4f49-b126-5e3af09e356d	china-stitch	China Stitch 	Be Comfort,Be Stylish 	<h3>Perfect swing quality</h3><p>Best finishing </p><p>Looking gorgeous</p><p>Soft and comfortable</p><p></p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480552411-109540701.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 20:09:45.262	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480573574-961411015.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
fcc13efe-900d-4c8f-b418-0a56828e9bce	jafran-fabric-printed-panjabi	Jafran Fabric Printed Panjabi	Stylish Printed Design | Comfortable Fit	<p>স্টাইলিশ ডিজাইন ও আরামদায়ক ফ্যাব্রিকের সুন্দর সমন্বয়ে তৈরি Jafran Fabric Printed Panjabi। উন্নতমানের জাফরান কাপড়ের সাথে আকর্ষণীয় প্রিন্টেড ডিজাইন পাঞ্জাবিটিকে দিয়েছে একটি smart, elegant &amp; premium look।</p><p>✨ Premium Jafran Fabric</p><p>🎨 Stylish Printed Design</p><p>🤍 Soft &amp; Comfortable</p><p>👑 Smart &amp; Elegant Look</p><p>📏 All Sizes Available</p><p>🚚 Cash on Delivery — All Over Bangladesh</p>	850	1250		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758564876-750155704.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758566108-347444561.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-09-18 19:10:07.892	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758573118-557844292.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758574092-50744635.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758575567-391168821.png"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	1
01bd7aab-0064-4399-a1a3-a733a6617772	china-stich-febricss	China Stich Febricss	Style More,Pay Less	<h3><span style="color: rgb(8, 8, 9);">PREMIUM COLLECTION<br> সবার চোখ থাকবে আপনার দিকে<br>প্রিমিয়াম সফট পাঞ্জাবি<br>গরমে আরামদায়ক, কালার ফেইড হবে না<br>Make Your Own Style</span></h3><p></p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779401807869-109437642.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-21 22:21:34.015	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779401827523-488565911.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
b9ee9bf6-4cd8-47bd-a737-abf63bfebc0c	pakistani-cotton-febric	Pakistani Cotton Febric	Be Comfort,Be Stylish 	<p>এই গরমে ফ্যাশন হোক আরামে 🔥</p><p>স্টাইল আর কমফোর্ট—দুটোই যখন একসাথে,</p><p>হালকা কাপড়, ট্রেন্ডি ডিজাইন, আর নিখুঁত ফিনিশ</p><p>গরমের এই মৌসুমে নিজেকে দিন স্টাইলিশ ও কমফোর্টেবল এক নতুন অনুভূ</p><p>তি 🌿</p><p></p>	980	1320		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480117112-590995557.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 20:02:32.384	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480124417-521534712.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480128902-700046019.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480132366-475599088.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
b58164c2-f153-4ff9-8d6d-8985c2a2c9c7	pakistani-cotton-febrics	Pakistani Cotton Febrics	Be Comfort,Be Stylish 	<p>এই গরমে ফ্যাশন হোক আরামে 🔥</p><p>স্টাইল আর কমফোর্ট—দুটোই যখন একসাথে,</p><p>হালকা কাপড়, ট্রেন্ডি ডিজাইন, আর নিখুঁত ফিনিশ</p><p>গরমের এই মৌসুমে নিজেকে দিন স্টাইলিশ ও কমফোর্টেবল এক নতুন অনুভূ</p><p>তি 🌿</p><p></p>	980	1320		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480202071-11490438.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 20:04:00.117	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480208305-999486389.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480210735-969613912.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480212758-504213992.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
4af6690b-5bfb-47a5-9df5-2648838e2b16	pakistani-lace-stepe-cottonn	Pakistani Lace Stepe Cottonn	Premium Style, Better Savings	<h2> প্রিমিয়াম পাকিস্তানি কটন পাঞ্জাবি ও চায়না স্টিচ পায়জামা একসাথে </h2><p> ঈদের স্টাইলে থাকুন এক ধাপ এগিয়ে </p><p> স্টাইল, আরাম আর এলিগেন্স—সব একসাথে</p><p>২০২৬ New Arrivals </p><h3>সারা বাংলাদেশে হোম ডেলিভারি </h3><p></p>	1499	1999	-25%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481077353-860823450.png"]	Eid Special Combo	t	t	f	[]	\N	2026-05-21 21:52:37.988	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481081288-659008805.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481084304-854659281.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481099659-803216785.png"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
7bc305e5-ba85-4bca-9128-a2fa3fdf2788	pakistani-lace-coton	Pakistani lace Coton 	Be Comfort,Be Stylish 	<h3>Perfect swing quality</h3><p>Looking gorgeous</p><p>Soft and comfortable</p><p></p>	980	1320		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781702423091-92754108.jpg"]	Panjabi	t	t	f	[]	\N	2026-06-17 13:21:11.879	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781702434449-744653529.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781702435150-739061961.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781702448618-719184724.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
288be3ef-400a-4d68-bed8-f381c1cbb776	argentina-customised-jersey	Argentina Customised Jersey 	Funny Football Fan Jersey 	<h3>Customized Funny meme Jersey </h3><p>Best quality febric </p><p>Perfect swing quality &amp; finishing </p><p></p>	550	950		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781808637712-960857648.png"]	FIFA JERSEY 2026	t	t	f	[]	\N	2026-06-17 19:56:03.384	[]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "Xxl", "available": true}]	\N	0
9a2d3b83-8161-49af-8c0c-af2cff9f950f	jafran-fabric-printed-panjabii	Jafran Fabric Printed Panjabii	Stylish Printed Design | Comfortable Fit	<p>স্টাইলিশ ডিজাইন ও আরামদায়ক ফ্যাব্রিকের সুন্দর সমন্বয়ে তৈরি Jafran Fabric Printed Panjabi। উন্নতমানের জাফরান কাপড়ের সাথে আকর্ষণীয় প্রিন্টেড ডিজাইন পাঞ্জাবিটিকে দিয়েছে একটি smart, elegant &amp; premium look।</p><p>✨ Premium Jafran Fabric</p><p>🎨 Stylish Printed Design</p><p>🤍 Soft &amp; Comfortable</p><p>👑 Smart &amp; Elegant Look</p><p>📏 All Sizes Available</p><p>🚚 Cash on Delivery — All Over Bangladesh</p>	850	1250		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758667741-415135385.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758668690-950172542.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758669632-316669081.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-09-18 19:11:22.556	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758674475-310287824.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758675386-49839148.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758676708-764865458.png"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	2
54637446-1a9d-433d-822d-d0a4fc4f58d3	pakistani-lace-stepe-cotton	Pakistani Lace Stepe Cotton	Premium Style,Better Savings	<h2> প্রিমিয়াম পাকিস্তানি কটন পাঞ্জাবি ও চায়না স্টিচ পায়জামা একসাথে </h2><h3> ঈদের স্টাইলে থাকুন এক ধাপ এগিয়ে </h3><p> স্টাইল, আরাম আর এলিগেন্স—সব একসাথে</p><h3>২০২৬ New Arrivals </h3><p>সারা বাংলাদেশে হোম ডেলিভারি </p>	1499	1999	-25%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481142424-227280280.png"]	Eid Special Combo	t	t	f	[]	\N	2026-05-21 21:36:48.322	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779399298719-370959327.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779399290139-945015474.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779399558268-264578338.png"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
963f6cb3-2a42-43b1-a96c-a525f4496b4e	china-stich-febrics	China Stich Febrics	Style More,Pay Lees	<h3><span style="color: rgb(8, 8, 9);">PREMIUM COLLECTION<br> সবার চোখ থাকবে আপনার দিকে<br>প্রিমিয়াম সফট পাঞ্জাবি<br>গরমে আরামদায়ক, কালার ফেইড হবে না<br>Make Your Own Style</span></h3><p></p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779401321292-405660926.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-21 22:13:51.512	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779401332585-519443898.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
f677506b-6d9d-484c-926e-ade3984c8a85	china-vangchur-febric	China Vangchur Febric	Be Comfort	<h3><span style="color: rgb(8, 8, 9);">PREMIUM COLLECTION<br> সবার চোখ থাকবে আপনার দিকে<br>প্রিমিয়াম সফট পাঞ্জাবি<br>গরমে আরামদায়ক, কালার ফেইড হবে না<br>Make Your Own Style</span></h3><p></p>	1099	11350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402603033-849942238.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-21 22:30:43.722	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402612338-947331747.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402617597-859233134.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402625535-910017104.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
14d560ef-52fe-4e00-a118-a1605fe74981	pakistani-cotton-fabrics	Pakistani Cotton Fabrics	Be Comfort,Be Stylish 	<h3>এই গরমে ফ্যাশন হোক আরামে 🔥</h3><p>স্টাইল আর কমফোর্ট—দুটোই যখন একসাথে,</p><p>হালকা কাপড়, ট্রেন্ডি ডিজাইন, আর নিখুঁত ফিনিশ</p><p>গরমের এই মৌসুমে নিজেকে দিন স্টাইলিশ ও কমফোর্টেবল এক নতুন অনুভূতি 🌿</p><p></p>	980	1320		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479994703-201042356.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 20:00:36.411	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480010001-226978531.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480016022-781657428.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480019912-313904480.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
e15360fb-1e2d-4e61-85a1-ab9ee78bd3b8	jafran-fabrics-printed-panjabi	Jafran Fabrics Printed Panjabi	Stylish Printed Design | Comfortable Fit	<p>স্টাইলিশ ডিজাইন ও আরামদায়ক ফ্যাব্রিকের সুন্দর সমন্বয়ে তৈরি Jafran Fabric Printed Panjabi। উন্নতমানের জাফরান কাপড়ের সাথে আকর্ষণীয় প্রিন্টেড ডিজাইন পাঞ্জাবিটিকে দিয়েছে একটি smart, elegant &amp; premium look।</p><p>✨ Premium Jafran Fabric</p><p>🎨 Stylish Printed Design</p><p>🤍 Soft &amp; Comfortable</p><p>👑 Smart &amp; Elegant Look</p><p>📏 All Sizes Available</p><p>🚚 Cash on Delivery — All Over Bangladesh</p>	850	1250		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758745217-799777193.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758733699-290906015.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758734600-865456859.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-09-18 19:12:51.273	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758757419-892474203.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758758523-811687461.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1789758759522-932557436.png"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	3
8e2cedb4-a32e-495b-9995-2f2e0926d87c	pakistani-cotton-fabric	Pakistani Cotton Fabric 	Be Comfort,Be Stylish 	<h3>এই গরমে ফ্যাশন হোক আরামে 🔥</h3><p>স্টাইল আর কমফোর্ট—দুটোই যখন একসাথে,</p><p>হালকা কাপড়, ট্রেন্ডি ডিজাইন, আর নিখুঁত ফিনিশ</p><p>গরমের এই মৌসুমে নিজেকে দিন স্টাইলিশ ও কমফোর্টেবল এক নতুন অনুভূতি 🌿</p><p></p>	980	1320		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479863158-632984940.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 19:58:32.96	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479881561-676766371.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479884452-505700654.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479890839-885392331.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
c0dd4f5c-4aec-427f-b753-bf8dc0109705	china-stich	China Stich 	Be Comfort,Be Stylish 	<h3>Perfect swing quality</h3><p>Best finishing </p><p>Looking gorgeous</p><p>Soft and comfortable</p><p></p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480438557-828277549.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 20:07:47.555	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480449110-783861949.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
8859daca-a41c-4914-a65d-8be32183b0c9	glazy-fabricss	Glazy Fabricss	Smart look 	<h3>Perfect swing quality</h3><p>Looking gorgeous</p><p>Soft and comfortable</p><p></p>	999			\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479465143-295680027.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-05-22 19:51:49.642	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479476705-880678564.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479477183-766376785.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	4
6f25cbf8-7233-4160-b331-236e7cd7fe85	glazy-fabrics	Glazy Fabrics 	Smart look 	<h3>Perfect swing quality</h3><p>Looking gorgeous</p><h3>Soft and comfortable</h3><p></p>	999			\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479374303-74710491.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-05-22 19:50:09.032	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479384607-31837053.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479384912-585470624.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	5
bfdb70ec-1ee8-4b8d-9547-0b161089665b	pakistani-lacee-stepe-cotton	Pakistani Lacee Stepe Cotton	Premium Style, Better Savings	<h3><span style="color: rgb(255, 255, 255);">প্রিমিয়াম পাকিস্তানি কটন পাঞ্জাবি ও চায়না স্টিচ পায়জামা একসাথে<br><br>ঈদের স্টাইলে থাকুন এক ধাপ এগিয়ে<br><br>স্টাইল, আরাম আর এলিগেন্স—সব একসাথে<br><br>২০২৬ New Arrivals<br><br>সারা বাংলাদেশে হোম ডেলিভারি<br></span><br></h3><p></p>	1499	1999	-25%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480681708-709340147.png"]	Eid Special Combo	t	t	f	[]	\N	2026-05-21 22:45:09.505	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480697012-182421531.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480699412-132581440.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480701861-933324084.png"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
18130206-e719-4722-a1bc-92d70afaf42f	pakistanii-lace-stepe-cotton	Pakistanii Lace Stepe Cotton	Premium Style,Better Savings	<h3><span style="color: rgb(255, 255, 255);">প্রিমিয়াম পাকিস্তানি কটন পাঞ্জাবি ও চায়না স্টিচ পায়জামা একসাথে<br><br>ঈদের স্টাইলে থাকুন এক ধাপ এগিয়ে<br><br>স্টাইল, আরাম আর এলিগেন্স—সব একসাথে<br><br>২০২৬ New Arrivals<br><br>সারা বাংলাদেশে হোম ডেলিভারি<br></span><br></h3><p></p>	1499	1999	-25%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779480999951-77080414.png"]	Eid Special Combo	t	t	f	[]	\N	2026-05-21 22:39:40.753	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481005359-860685757.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481013020-466034385.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481016777-321918394.png"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
33b42709-2d57-42fe-8e33-708691fe43fb	china-vangchur	China Vangchur-	Be Comfort,Be Stylish 	<h3>Perfect swing quality</h3><p>Best finishing </p><p>Looking gorgeous</p><p>Soft and comfortable</p><p></p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481260440-60248511.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 20:21:47	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481287233-339305461.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
739af382-3d94-487c-a0f9-e4edad6b83ca	china-vangchur-febrics	China Vangchur Febrics	Be Comfort	<h3><span style="color: rgb(8, 8, 9);">PREMIUM COLLECTION<br> সবার চোখ থাকবে আপনার দিকে<br>প্রিমিয়াম সফট পাঞ্জাবি<br>গরমে আরামদায়ক, কালার ফেইড হবে না<br>Make Your Own Style</span></h3><p><br></p>	1099		-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402346582-931806989.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-21 22:27:18.505	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1790789613365-496718546.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402355637-506276258.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402365542-677738042.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779402380817-802058921.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
c7656e9d-8878-4ebc-af0c-6e37e30bba98	china-vangchur1	China Vangchur_1	Be Comfort,Be Stylish 	<h3>Perfect swing quality</h3><p>Best finishing </p><p>Looking gorgeous</p><p>Soft and comfortable</p><p></p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481360148-121418186.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 20:23:09.472	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481366678-660588965.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
58a367b3-364c-46ff-b986-bb079546ea4b	pakistani-lace-cotton	Pakistani lace Cotton 	Be Comfort,Be Stylish 	<h3>Perfect swing quality</h3><p>Looking gorgeous</p><p>Soft and comfortable</p><p></p>	980	1320		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481521492-676745427.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 20:25:54.367	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481535827-226853042.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481536510-665843277.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481537231-134098136.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
cc92e359-ff79-4eba-8588-2f38929db4ad	pakistani-lace-cottonn	Pakistani lace Cottonn	Be Comfort,Be Stylish 	<h3>Perfect swing quality</h3><p>Looking gorgeous</p><p>Soft and comfortable</p><p></p>	980	1320		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481635036-718464523.jpg"]	Panjabi	t	t	f	[]	\N	2026-05-22 20:28:13.77	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481653779-573682669.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481654403-285797766.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779481665912-923712041.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
0dc9b50c-afc1-48bc-b45e-14d034abc1ba	brasil-customised-jersey	Brasil Customised Jersey 	Funny Football Fan Jersey 	<h3>Customized Funny meme Jersey </h3><p>Best quality febric </p><p>Perfect swing quality &amp; finishing </p><p></p>	650	950		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781725994586-701112029.png"]	FIFA JERSEY 2026	t	t	f	[]	\N	2026-06-17 19:53:39.124	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781726002396-721925563.png"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "Xxl", "available": true}]	\N	0
62021a85-d8f6-4595-8fc4-21d4aeba9d2d	argentina-customized-jersey	Argentina Customized Jersey 	Funny Football Fan Jersey 	<h3>Customized Funny meme Jersey </h3><p>Best quality febric </p><p>Perfect swing quality &amp; finishing </p><p></p>	650	950		\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781725405515-766505922.png"]	FIFA JERSEY 2026	t	t	f	[]	\N	2026-06-17 19:43:50.947	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1781725413794-881392480.png"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "Xxl", "available": true}]	\N	0
5681b2cc-941b-43c2-a770-d5a42efc971f	premium-china-cheli-angel-febric	Premium china cheli angel febric 	Premium Quality at an Unbeatable Price.	<h3>Premium China Chelli Angel Fabric Panjabi</h3><p></p><p>এই পাঞ্জাবিতে রয়েছে উন্নত মানের ফেব্রিক, সফট ও আরামদায়ক অনুভূতি, নিখুঁত ফিনিশিং এবং এলিগ্যান্ট ডিজাইন। প্রতিটি বিশেষ মুহূর্তে আপনাকে দেবে প্রিমিয়াম লুক ও আত্মবিশ্বাস।</p><p>✔ Premium China Chelli Angel Fabric</p><p>✔ Soft &amp; Comfortable</p><p>✔ Elegant Finish</p><p>✔ Long-LastingrQuality</p><p>✔ Perfect for Eid, Wedding, Jummah &amp; Special Occasions</p><p>Nahian Fashion – Where Quality Meets Elegance.</p><p></p>	1099		-33%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785155208881-567008754.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785155250987-368148209.jpg"]	Embroidery Panjabi 	t	t	f	[]	\N	2026-07-27 12:28:15.325	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785155229613-42882882.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785155242436-339425858.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
e6300b6b-7ba7-4e06-a24f-a9beca896dab	premium-china-chelli-angel-febrics	Premium China Chelli Angel Febrics	Premium Quality at an Unbeatable Price.	<h3>Premium China Chelli Angel Fabric Panjabi</h3><p></p><p>এই পাঞ্জাবিতে রয়েছে উন্নত মানের ফেব্রিক, সফট ও আরামদায়ক অনুভূতি, নিখুঁত ফিনিশিং এবং এলিগ্যান্ট ডিজাইন। প্রতিটি বিশেষ মুহূর্তে আপনাকে দেবে প্রিমিয়াম লুক ও আত্মবিশ্বাস।</p><p></p><p>✔ Premium China Chelli Angel Fabric</p><p>✔ Soft &amp; Comfortable</p><p>✔ Elegant Finish</p><p>✔ Long-LastingrQuality</p><p>✔ Perfect for Eid, Wedding, Jummah &amp; Special Occasions</p><p></p><p>Nahian Fashion – Where Quality Meets Elegance.</p><p></p><p></p><p></p>	1099		-33%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785155376246-23203260.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785155378525-256157172.jpg"]	Embroidery Panjabi 	t	t	f	[]	\N	2026-07-27 12:33:22.106	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785155385564-258575562.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785155388137-196098470.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
6cdcbde4-58f5-4bf1-ba5a-e2292b8cfef6	premium-china-chelli-angel-febric	Premium China Chelli Angel Febric 	Premium Quality at an Unbeatable Price.	<h3>Premium China Chelli Angel Fabric Panjabi</h3><p></p><p>এই পাঞ্জাবিতে রয়েছে উন্নত মানের ফেব্রিক, সফট ও আরামদায়ক অনুভূতি, নিখুঁত ফিনিশিং এবং এলিগ্যান্ট ডিজাইন। প্রতিটি বিশেষ মুহূর্তে আপনাকে দেবে প্রিমিয়াম লুক ও আত্মবিশ্বাস।</p><p></p><p>✔ Premium China Chelli Angel Fabric</p><p>✔ Soft &amp; Comfortable</p><p>✔ Elegant Finish</p><p>✔ Long-Lasting Quality</p><p>✔ Perfect for Eid, Wedding, Jummah &amp; Special Occasions</p><p></p><p>Nahian Fashion – Where Quality Meets Elegance.</p><p></p>	1099		-33%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785154855336-517228426.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785155652911-818089918.jpg"]	Embroidery Panjabi 	t	t	f	[]	\N	2026-07-27 12:23:05.7	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785154950943-965039044.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785154949614-303982974.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
129d78af-748f-44e2-8591-0c40f58440cb	china-popcorn-febrics	China Popcorn Febrics	Premium China Popcorn Fabric Panjabi	<h3>Premium China Popcorn Fabric-</h3><p>এর তৈরি এই পাঞ্জাবিতে রয়েছে soft texture, comfortable feel, elegant design এবং premium finishing। হালকা ও আরামদায়ক এই পাঞ্জাবি আপনাকে দেবে stylish look ও সারাদিনের স্বাচ্ছন্দ্য।</p><p>✔ Premium China Popcorn Fabric</p><p>✔ Soft &amp; Comfortable</p><p>✔ Elegant Design</p><p>✔ Premium Finishing</p><p>✔ Perfect for Eid, Wedding &amp; Special Occasions</p><p>Nahian Fashion – Where Quality Meets Elegance.</p><p></p>	999	1650	-40%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866254464-678349403.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866274434-644634053.jpg"]	Panjabi	t	t	f	[]	\N	2026-07-27 20:06:36.285	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866324243-638020715.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866326690-219631463.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866330092-271248563.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}]	\N	0
5217fdcb-e2b8-455d-bee4-f60801370b64	china-popcorn-febricss	China Popcorn Febricss 	Premium China Popcorn Fabric Panjabi	<h3>Premium China Popcorn Fabric-</h3><p>এর তৈরি এই পাঞ্জাবিতে রয়েছে soft texture, comfortable feel, elegant design এবং premium finishing। হালকা ও আরামদায়ক এই পাঞ্জাবি আপনাকে দেবে stylish look ও সারাদিনের স্বাচ্ছন্দ্য।</p><p>✔ Premium China Popcorn Fabric</p><p>✔ Soft &amp; Comfortable</p><p>✔ Elegant Design</p><p>✔ Premium Finishing</p><p>✔ Perfect for Eid, Wedding &amp; Special Occasions</p><p>Nahian Fashion – Where Quality Meets Elegance.</p><p></p>	999	1650	-40%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866369570-5367575.jpg"]	Panjabi	t	t	f	[]	\N	2026-07-27 20:08:33.054	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866397728-554369305.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866399956-671657223.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866402419-400452644.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}]	\N	0
51a09c24-209a-46fc-ab46-81a8aab3ce83	premium-china-chelli-angel-febricss	Premium China Chelli Angel Febricss 	Premium Quality at an Unbeatable Price.	<h3>Premium China Chelli Angel Fabric Panjabi</h3><p></p><p>এই পাঞ্জাবিতে রয়েছে উন্নত মানের ফেব্রিক, সফট ও আরামদায়ক অনুভূতি, নিখুঁত ফিনিশিং এবং এলিগ্যান্ট ডিজাইন। প্রতিটি বিশেষ মুহূর্তে আপনাকে দেবে প্রিমিয়াম লুক ও আত্মবিশ্বাস।</p><p></p><p>✔ Premium China Chelli Angel Fabric</p><p>✔ Soft &amp; Comfortable</p><p>✔ Elegant Finish</p><p>✔ Long-Lasting Quality</p><p>✔ Perfect for Eid, Wedding, Jummah &amp; Special Occasions</p><p></p><p>Nahian Fashion – Where Quality Meets Elegance.</p><p></p><p></p><p></p>	1099	1650	-33%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787513057176-306130529.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787513057849-574613512.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787513058586-389652460.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787513058975-465519134.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787513059412-949310530.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787513059766-608949080.jpg"]	Embroidery Panjabi 	t	t	f	[]	\N	2026-07-27 16:24:54.31	[]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}]	\N	0
1148dfbc-c56d-40bf-bef0-c4c4cd8f909a	china-micro-stitch-febric	China Micro stitch Febric 	Premium China Micro Stitch Fabric with Embroidery Panjabi	<p>Premium China Micro Stitch Fabric দিয়ে তৈরি এই পাঞ্জাবিতে রয়েছে elegant embroidery work, soft texture, comfortable fitting এবং premium finishing। সূক্ষ্ম কারুকাজ ও আধুনিক ডিজাইনের সমন্বয়ে এটি আপনাকে দেবে classy ও royal look।</p><p>✔ Premium China Micro Stitch Fabric</p><p>✔ Elegant Embroidery Work</p><p>✔ Soft &amp; Comfortable</p><p>✔ Premium Finishing</p><p>✔ Perfect for Eid, Wedding &amp; Special Occasions</p><p>Nahian Fashion – Where Quality Meets Elegance.</p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785183589977-313647578.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785183590860-910020595.jpg"]	Embroidery Panjabi 	t	t	f	[]	\N	2026-07-27 20:20:17.232	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785183599765-426393132.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
5eb450e4-267a-424a-8788-b188fe437f62	china-micro-stitch-febrics	China Micro stitch Febrics	Premium China Micro Stitch Fabric with Embroidery Panjabi	<p>Premium China Micro Stitch Fabric দিয়ে তৈরি এই পাঞ্জাবিতে রয়েছে elegant embroidery work, soft texture, comfortable fitting এবং premium finishing। সূক্ষ্ম কারুকাজ ও আধুনিক ডিজাইনের সমন্বয়ে এটি আপনাকে দেবে classy ও royal look।</p><p>✔ Premium China Micro Stitch Fabric</p><p>✔ Elegant Embroidery Work</p><p>✔ Soft &amp; Comfortable</p><p>✔ Premium Finishing</p><p>✔ Perfect for Eid, Wedding &amp; Special Occasions</p><p>Nahian Fashion – Where Quality Meets Elegance.</p>	1099	1350	-18%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785183675395-945181883.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785183658408-820165077.jpg"]	Embroidery Panjabi 	t	t	f	[]	\N	2026-07-27 20:21:40.515	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785183690963-981199254.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	0
56bdfc6e-0331-46a9-be01-727b9f8edb42	china-popcorn-febricc	China Popcorn Febricc 	Premium China Popcorn Fabric Panjabi	<h3>Premium China Popcorn Fabric-</h3><p>এর তৈরি এই পাঞ্জাবিতে রয়েছে soft texture, comfortable feel, elegant design এবং premium finishing। হালকা ও আরামদায়ক এই পাঞ্জাবি আপনাকে দেবে stylish look ও সারাদিনের স্বাচ্ছন্দ্য।</p><p>✔ Premium China Popcorn Fabric</p><p>✔ Soft &amp; Comfortable</p><p>✔ Elegant Design</p><p>✔ Premium Finishing</p><p>✔ Perfect for Eid, Wedding &amp; Special Occasions</p><p>Nahian Fashion – Where Quality Meets Elegance.</p>	999	1650	-40%	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786031866152-539616152.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785183181491-834853288.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1788425214613-695656830.jpg"]	Panjabi	t	t	f	[]	\N	2026-07-27 20:14:15.654	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786979928587-116090547.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866475947-481807934.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1785866478271-541479118.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}]	\N	0
23a6037f-4230-46f5-a07f-5cfc36e45414	premium-china-micro-stitch-fabric-printed-panjabii	Premium China Micro Stitch Fabric Printed Panjabii	Premium Printed Panjabi | China Micro Stitch Fabric	<h3>Premium China Micro Stitch Fabric-এর তৈরি এই পাঞ্জাবিতে রয়েছে stylish printed design, soft &amp; comfortable feel এবং premium finishing। আধুনিক ডিজাইন ও উন্নত মানের ফেব্রিকের সমন্বয়ে তৈরি—যারা পছন্দ করেন classy ও sophisticated look, তাদের জন্য উপযুক্ত।</h3><p>✔ Premium China Micro Stitch Fabric</p><p>✔ Stylish Printed Design</p><p>✔ Soft &amp; Comfortable</p><p>✔ Premium Finishing</p><p>✔ Elegant &amp; Modern Look</p><p>Nahian Fashion — Where Quality Meets Elegance.</p><p></p>	850	1100	-23 off	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786386478004-959191907.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-08-10 18:28:35.938	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786386497072-12751953.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786386485243-831766493.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	2
52196c70-4e98-41d3-916b-3073733203b3	glazy-fabric	Glazy Fabric 	Smart look 	<h3>Perfect swing quality </h3><p>Looking gorgeous </p><h3>Soft and comfortable</h3><p></p>	999			\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479188640-967059118.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-05-22 19:47:09.055	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479206210-503741405.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779479206671-585823761.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	6
ea0c2fce-724f-44f9-a91a-d203accfa068	china-stich-cottonn	China Stich Cottonn	Soft & premium	<h3>চায়না স্টিচ কটন ফেব্রিক্স</h3><p>সফট এবং আরামদায়ক</p>	899			\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779441964249-805790480.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-05-22 09:27:21.883	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779442012911-300123543.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779442016666-84357570.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	7
7be07913-236d-47b3-b21c-77ea3eac8473	china-stitch-cotton	China stitch Cotton 	Soft & Premium 	<h3>চায়না স্টিচ কটন ফেব্রিক্স </h3><h3> সফট এবং আরামদায়ক</h3><p></p>	899			\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779441786543-675201663.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-05-22 09:24:00.387	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779441798505-979781512.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779441806171-262867222.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	https://www.facebook.com/share/r/1Da2bDQxrr/	8
0b5c0a07-dfe5-4205-aeb3-93c42c39cafd	china-stich-cotton	China Stich Cotton 	Soft & Premium 	<h3>চায়না স্টিচ কটন ফেব্রিক্স</h3><h3>সফট এবং আরামদায়ক</h3><p></p>	899			\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779441538615-21134576.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-05-22 09:20:18.485	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779441553981-875290899.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1779441575519-369779674.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	9
91a3d94a-fa52-4863-9a39-de23ac237687	premium-china-micro-stitch-fabrics-printed-panjabi	Premium China Micro Stitch Fabrics Printed Panjabi	Premium Printed Panjabi | China Micro Stitch Fabric	<h3>Premium China Micro Stitch Fabric-এর তৈরি এই পাঞ্জাবিতে রয়েছে stylish printed design, soft &amp; comfortable feel এবং premium finishing। আধুনিক ডিজাইন ও উন্নত মানের ফেব্রিকের সমন্বয়ে তৈরি—যারা পছন্দ করেন classy ও sophisticated look, তাদের জন্য উপযুক্ত।</h3><p>✔ Premium China Micro Stitch Fabric</p><p>✔ Stylish Printed Design</p><p>✔ Soft &amp; Comfortable</p><p>✔ Premium Finishing</p><p>✔ Elegant &amp; Modern Look</p><p>Nahian Fashion — Where Quality Meets Elegance.</p><p></p>	850	1100	-23 off	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786386568488-333345713.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-08-10 18:29:47.674	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786386575746-133543784.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786386575982-705716344.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	3
e490f615-f12a-452f-aac1-c92c1e6ae7b3	premium-china-micro-stitch-fabric-printed-panjabi	Premium China Micro Stitch Fabric Printed Panjabi	Premium Printed Panjabi | China Micro Stitch Fabric	<h3>Premium China Micro Stitch Fabric-এর তৈরি এই পাঞ্জাবিতে রয়েছে stylish printed design, soft &amp; comfortable feel এবং premium finishing। আধুনিক ডিজাইন ও উন্নত মানের ফেব্রিকের সমন্বয়ে তৈরি—যারা পছন্দ করেন classy ও sophisticated look, তাদের জন্য উপযুক্ত।</h3><p>✔ Premium China Micro Stitch Fabric</p><p>✔ Stylish Printed Design</p><p>✔ Soft &amp; Comfortable</p><p>✔ Premium Finishing</p><p>✔ Elegant &amp; Modern Look</p><p>Nahian Fashion — Where Quality Meets Elegance.</p><p></p>	850	1100	-23 off	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786387177810-134780610.jpg"]	Printed Panjabi 	t	t	f	[]	\N	2026-08-10 18:40:12.614	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786387184826-957644389.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1786387185163-832697393.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}, {"size": "XXL", "available": true}]	\N	1
5e74e0c5-8660-44af-a8a3-0b2fc315b693	inaya-borka-set	Inaya Borka Set	পর্দায় সৌন্দর্য, স্বাচ্ছন্দ্যে আভিজাত্য ✨	<p>পর্দার সৌন্দর্য, আরাম ও এলিগ্যান্স—সবকিছুর সুন্দর সমন্বয়ে তৈরি Inaya Borka Set। উন্নতমানের ফ্যাব্রিক, পরিপাটি ফিনিশিং ও ডিজাইন</p><p>এটি দৈনন্দিন ব্যবহার থেকে শুরু করে বিশেষ occasions—সবক্ষেত্রেই মানানসই।</p><p>✨ সেটের মধ্যে থাকছে:</p><p>🌹 অরিজিনাল Dubai Cherry Burqa</p><p>🧕 অরিজিনাল China Soft Georgette Hijab &amp; Niqab</p><p>✨ ৩ পার্ট হুডি হিজাব</p><p>🤍 ২ পার্ট নোস নিকাব</p><p>📏 বোরকার সাইজ: 50 / 52 / 54 / 56 / 58</p><p>〰️ ঘের: 180"+</p><p>🧕 হুডি হিজাব: সামনে 45" | পিছনে 50"</p><p>🤍 নোস নিকাব: সামনে 25"</p><p>🚚 সারা বাংলাদেশে Cash on Delivery</p><p>✨ Inaya Borka Set — পর্দায় থাকুক সৌন্দর্য, স্বাচ্ছন্দ্য ও আভিজাত্য।</p>	2500	3200	-22 off	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787168688203-854748019.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787168714347-785488403.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787168715039-280464450.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787168715697-688969999.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787168830650-113487746.jpg"]	Borka set	t	t	f	[]	\N	2026-08-19 19:48:01.705	[]	[{"size": "50", "available": true}, {"size": "52", "available": true}, {"size": "54", "available": true}, {"size": "56", "available": true}, {"size": "58", "available": true}]	\N	1
d93d2eea-b9ad-4352-be30-e94ffcbbf13a	indian-string-popcorn-cotton	Indian String Popcorn Cotton	Premium Cotton Fabric | Soft & Comfortable	<p>Premium Indian String Popcorn Cotton-এর soft texture ও comfortable feel আপনাকে দেবে effortless elegance। </p><p>Stylish design ও premium quality—দৈনন্দিন ব্যবহার থেকে special occasions, সবক্ষেত্রেই perfect choice।</p><p>Nahian Fashion — Where Quality Meets Elegance.</p><p></p>	890	1650	-46 off	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044559100-778556499.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044560393-533183741.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044566214-871043154.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044569998-111447011.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045202593-791322400.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045203126-11521835.jpg"]	Panjabi	t	t	f	[]	\N	2026-08-18 09:17:08.382	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044609894-883859769.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044610680-822295329.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044611121-381758132.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787943599021-94558374.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}]	\N	1
a09a7655-6800-48e6-9818-f4cdb7407958	indian-strinng-popcorn-cotton	Indian Strinng Popcorn Cotton	Premium Cotton Fabric | Soft & Comfortable	<p>Premium Indian String Popcorn Cotton-এর soft texture ও comfortable feel আপনাকে দেবে effortless elegance। </p><p>Stylish design ও premium quality—দৈনন্দিন ব্যবহার থেকে special occasions, সবক্ষেত্রেই perfect choice।</p><p>Nahian Fashion — Where Quality Meets Elegance.</p>	890	1650	-46 off	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045557570-809684923.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045362665-516097514.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045363243-225993541.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045363811-605368156.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045572199-471196434.jpg"]	Panjabi	t	t	f	[]	\N	2026-08-18 09:36:02.749	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045737437-124965984.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045737946-34037523.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045738477-751956683.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045739244-257052843.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}]	\N	3
fbfff822-c27b-44ea-948c-b1764e86e353	indian-string-popcorn-cottonn	Indian String Popcorn Cottonn	Premium Cotton Fabric | Soft & Comfortable	<p>Premium Indian String Popcorn Cotton-এর soft texture ও comfortable feel আপনাকে দেবে effortless elegance। </p><p>Stylish design ও premium quality—দৈনন্দিন ব্যবহার থেকে special occasions, সবক্ষেত্রেই perfect choice।</p><p>Nahian Fashion — Where Quality Meets Elegance.</p>	890	1650	-46 off	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044813457-206425039.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044769604-338643267.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044813898-674474932.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787044898836-694920559.png"]	Panjabi	t	t	f	[]	\N	2026-08-18 09:25:45.001	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045130579-5494608.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045131252-309059620.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045131640-937055663.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045812803-454076166.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}]	\N	2
72b38372-2d26-4b0c-8f70-091230b145fc	indian-string-popcorn-coton	Indian String Popcorn Coton	Premium Cotton Fabric | Soft & Comfortable	<p>Premium Indian String Popcorn Cotton-এর soft texture ও comfortable feel আপনাকে দেবে effortless elegance।</p><p> Stylish design ও premium quality—দৈনন্দিন ব্যবহার থেকে special occasions, সবক্ষেত্রেই perfect choice।</p><p>Nahian Fashion — Where Quality Meets Elegance.</p>	890	1650	-46 off	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045961229-209326387.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787169204216-801562343.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045963210-601482280.png", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045964969-814062079.png"]	Panjabi	t	t	f	[]	\N	2026-08-18 09:40:09.844	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045984859-290503384.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045987024-820114171.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045988934-832180537.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787045989609-376231479.jpg"]	[{"size": "M", "available": true}, {"size": "L", "available": true}, {"size": "XL", "available": true}]	\N	4
0a20b441-d86c-4875-be6e-46649ca681e0	alina-borka-set	✨ Alina Borka Set	পর্দায় সৌন্দর্য, স্বাচ্ছন্দ্যে আভিজাত্য 	<p>💎 আলিনা বোরকা সেট ✨</p><p></p><p>পরিপূর্ণ পর্দা, আরাম ও সৌন্দর্যের সুন্দর সমন্বয় 🌸</p><p></p><p>✨ বোরকা: অরিজিনাল দুবাই চেরি কাপড়</p><p>🧕 হিজাব ও নেকাব: অরিজিনাল Soft China Georgette</p><p></p><p>🔹 হিজাব: সামনে ৪৫" | পিছনে ৫০"</p><p>🔹 নেকাব: সামনে ২৫" | ২ পার্ট হুডি পাইপিং</p><p>📏 বোরকা সাইজ: ৫০ / ৫২ / ৫৪ / ৫৬ / ৫৮</p><p>🚚 সারা বাংলাদেশে হোম ডেলিভারি </p>	2400	3000	-20 off 	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787171705599-372526691.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787171537584-367060997.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787171539075-388121596.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787171722036-543114867.jpg"]	Borka set	t	t	f	[]	\N	2026-08-19 20:32:50.63	[]	[{"size": "50", "available": true}, {"size": "52", "available": true}, {"size": "54", "available": true}, {"size": "56", "available": true}, {"size": "58", "available": true}]	\N	2
3038bc7e-05a2-4511-8777-0c4e018e27df	noor-borka-set	🌙 Noor Borka Set	পর্দায় পবিত্রতা, সৌন্দর্যে আভিজাত্য ✨	<p>🌙 Noor Borka Set — পর্দা, শালীনতা ও আরামের সুন্দর সমন্বয়। হালকা ও আরামদায়ক দুবাই চেরি ফেব্রিকের তৈরি এই সেটটি দৈনন্দিন ব্যবহার থেকে শুরু করে বিশেষ আয়োজন—সবক্ষেত্রেই মানানসই।</p><p>🧕 হিজাব: ১ পার্ট, কুচি দেওয়া ডিজাইন</p><p>🤍 নিকাব: ২ পার্ট, নোস নিকাব</p><p>🧕 হিজাব: ফ্রি সাইজ</p><p>🤍 নিকাব: নোস নিকাব</p><p>✨ মার্জিত ডিজাইন, আরামদায়ক ফ্যাব্রিক ও পরিপাটি ফিনিশিং—আপনার পর্দার জন্য সুন্দর একটি পছন্দ।</p>	2200	2800	-21 off	\N	\N	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787225979512-352743080.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1787225981092-539305605.jpg"]	Borka set	t	t	f	[]	\N	2026-08-20 11:42:31.223	["https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1788111829106-496496231.jpg", "https://pub-8e1611e33efe4d27b57e2c724ec4ecbb.r2.dev/uploads/1788111827926-821509497.jpg"]	[{"size": "50", "available": true}, {"size": "52", "available": true}, {"size": "54", "available": true}, {"size": "56", "available": true}, {"size": "58", "available": true}]	\N	3
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_settings (id, site_name, site_tagline, meta_description, contact_email, whatsapp_number, phone_number, instagram_url, facebook_url, currency_code, currency_symbol, footer_social_heading) FROM stdin;
1	Nahian Fashion	Premium Men’s Panjabi Collection 🧥 Timeless Elegance • Superior Fabric • Comfort✨ 🚚Cash on delivery. All Bangladesh	Premium Men’s Panjabi Collection 🧥 Timeless Elegance • Superior Fabric • Comfort✨ 🚚Cash on delivery. All Bangladesh	nahinmd09@gmail.com	https://wa.me/message/TO4M7NL54JURO1	01812214648	https://www.instagram.com/mdra36137?igsh=ejZ5cGduNWo1YzAw	https://www.facebook.com/nahianfashion1/	BDT	Tk	Contact Us in any way
\.


--
-- Data for Name: steadfast_api_state; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.steadfast_api_state (id, last_call_at, cooldown_until, window_start, window_count, day_start, day_count, updated_at) FROM stdin;
\.


--
-- Data for Name: steadfast_fraud_cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.steadfast_fraud_cache (phone, found, total, success, cancel, success_rate, fraud_reports, fetched_at, updated_at) FROM stdin;
\.


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.testimonials (id, type, name, image_url, quote, title, display_order, created_at, rating, video_url) FROM stdin;
\.


--
-- Name: blocked_items blocked_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_items
    ADD CONSTRAINT blocked_items_pkey PRIMARY KEY (id);


--
-- Name: brand_story brand_story_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_story
    ADD CONSTRAINT brand_story_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: combo_offers combo_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.combo_offers
    ADD CONSTRAINT combo_offers_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: footer_config footer_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.footer_config
    ADD CONSTRAINT footer_config_pkey PRIMARY KEY (id);


--
-- Name: home_config home_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_config
    ADD CONSTRAINT home_config_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: steadfast_api_state steadfast_api_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.steadfast_api_state
    ADD CONSTRAINT steadfast_api_state_pkey PRIMARY KEY (id);


--
-- Name: steadfast_fraud_cache steadfast_fraud_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.steadfast_fraud_cache
    ADD CONSTRAINT steadfast_fraud_cache_pkey PRIMARY KEY (phone);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: blocked_items_value_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX blocked_items_value_key ON public.blocked_items USING btree (value);


--
-- Name: coupons_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);


--
-- Name: customers_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);


--
-- Name: orders_draft_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_draft_session_id_idx ON public.orders USING btree (draft_session_id);


--
-- Name: orders_order_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX orders_order_id_key ON public.orders USING btree (order_id);


--
-- Name: pages_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pages_slug_key ON public.pages USING btree (slug);


--
-- Name: password_reset_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_reset_tokens_token_key ON public.password_reset_tokens USING btree (token);


--
-- Name: products_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_slug_key ON public.products USING btree (slug);


--
-- Name: steadfast_fraud_cache_fetched_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX steadfast_fraud_cache_fetched_at_idx ON public.steadfast_fraud_cache USING btree (fetched_at);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_reviews product_reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict g66P1fy17y1tdXmZUuSx5ie6Z87KTAI1YcczsFez9qD3Qh22h3P0KZFLXRq5Y5s

