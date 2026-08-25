import React, { useState, useEffect } from 'react';
import { 
  Plus, Target, Layers, Trash2, Check, X, BookOpen, ClipboardList, 
  ListChecks, Activity, Download, Upload, Flame, Newspaper, Brain, 
  ArrowRight, Clock, AlertTriangle, Eye, EyeOff, SpellCheck, RotateCcw,
  BookMarked, FlameKindling, Sparkles, Swords, Loader2, Play
} from 'lucide-react';
import { getKey, setKey } from './supabaseClient';
import MockTestEngine from './MockTestEngine';

const EXAM_DATES = { AFCAT: '2027-01-31', CDS: '2027-04-11', CAPF: '2027-07-15', CGL: '2027-08-15' };
const SUBJECTS = ['Reasoning', 'Quant', 'Polity', 'History', 'Geography', 'Science', 'Economy', 'Current Affairs', 'English', 'Writing'];
const EXAMS = ['SSC', 'CDS', 'AFCAT', 'CAPF'];
const ERROR_TYPES = ['conceptual', 'calculation', 'silly', 'time-pressure'];
const SRS_INTERVALS = [1, 3, 7, 14, 30, 60];
const STRATEGIES = ['merit', 'rank-1'];

// Complete Superset Syllabus mapped to authoritative standard textbooks
const RESOURCES = [
  {
    id: 'polity',
    subject: 'Polity',
    name: 'Indian Polity & Governance',
    bookRef: 'M. Laxmikant — Indian Polity (7th Ed.)',
    chapters: [
      { name: 'Historical Background & Constituent Assembly', tier1: true, refChapter: 'Ch 1 & 2' },
      { name: 'Salient Features, Sources & Preamble', tier1: true, refChapter: 'Ch 3 & 4' },
      { name: 'Union & its Territory (Articles 1-4)', tier1: false, refChapter: 'Ch 5' },
      { name: 'Citizenship (Articles 5-11, CAA & NRC concepts)', tier1: false, refChapter: 'Ch 6' },
      { name: 'Fundamental Rights (Articles 12-35 & Writs)', tier1: true, refChapter: 'Ch 7' },
      { name: 'Directive Principles of State Policy (DPSP: 36-51)', tier1: true, refChapter: 'Ch 8' },
      { name: 'Fundamental Duties (Article 51A & Committees)', tier1: true, refChapter: 'Ch 9' },
      { name: 'Amendment of the Constitution & Basic Structure', tier1: true, refChapter: 'Ch 10 & 11' },
      { name: 'Parliamentary vs Presidential & Federal Structure', tier1: false, refChapter: 'Ch 12 & 13' },
      { name: 'Inter-State Relations & Centre-State Financial/Admin Ties', tier1: true, refChapter: 'Ch 14 & 15' },
      { name: 'Emergency Provisions (Articles 352, 356, 360)', tier1: true, refChapter: 'Ch 16' },
      { name: 'President: Election, Powers, Veto, Pardoning (Art 72)', tier1: true, refChapter: 'Ch 17' },
      { name: 'Vice-President: Role & Powers', tier1: false, refChapter: 'Ch 18' },
      { name: 'Prime Minister & Union Council of Ministers', tier1: false, refChapter: 'Ch 19 & 20' },
      { name: 'Cabinet Committees & Secretariat', tier1: false, refChapter: 'Ch 21' },
      { name: 'Parliament: Lok Sabha, Rajya Sabha & Speaker Powers', tier1: true, refChapter: 'Ch 22 (Part I)' },
      { name: 'Parliamentary Proceedings, Motions, Bills & Budgeting', tier1: true, refChapter: 'Ch 22 (Part II)' },
      { name: 'Parliamentary Committees (PAC, Estimates, CoPU)', tier1: true, refChapter: 'Ch 23' },
      { name: 'Supreme Court: Jurisdiction, Writs & Landmark Cases', tier1: true, refChapter: 'Ch 26' },
      { name: 'Judicial Review, Judicial Activism & PIL', tier1: true, refChapter: 'Ch 27 & 28' },
      { name: 'Governor: Discretionary Powers & Ordinances', tier1: true, refChapter: 'Ch 30' },
      { name: 'Chief Minister & State Council of Ministers', tier1: false, refChapter: 'Ch 31 & 32' },
      { name: 'State Legislature: Assembly & Legislative Council', tier1: false, refChapter: 'Ch 33' },
      { name: 'High Courts & Subordinate Courts', tier1: true, refChapter: 'Ch 34 & 35' },
      { name: 'Tribunals (CAT, NGT & Armed Forces Tribunal AFT)', tier1: true, refChapter: 'Ch 36' },
      { name: 'Panchayati Raj (73rd Constitutional Amendment Act)', tier1: true, refChapter: 'Ch 38' },
      { name: 'Municipalities & Urban Local Bodies (74th CAA)', tier1: true, refChapter: 'Ch 39' },
      { name: 'Constitutional Bodies: Election Commission & CAG', tier1: true, refChapter: 'Ch 43 & 51' },
      { name: 'Constitutional Bodies: UPSC, SPSC & Finance Commission', tier1: true, refChapter: 'Ch 44 & 45' },
      { name: 'Constitutional Bodies: National Commissions (SC, ST, OBC)', tier1: false, refChapter: 'Ch 47-49' },
      { name: 'Non-Constitutional Bodies: NITI Aayog, NHRC, CIC, CVC, Lokpal', tier1: true, refChapter: 'Ch 53-57' },
      { name: 'Special Provisions: Scheduled & Tribal Areas (5th & 6th Sched)', tier1: true, refChapter: 'Ch 41' },
      { name: 'Official Language Provisions & Special Directives', tier1: false, refChapter: 'Ch 61' }
    ]
  },
  {
    id: 'history',
    subject: 'History',
    name: 'Comprehensive History & Culture',
    bookRef: 'Spectrum Modern India (Rajiv Ahir) + NCERT Ancient/Medieval',
    chapters: [
      { name: 'Prehistoric Period & Indus Valley Civilization (IVC)', tier1: true, refChapter: 'RS Sharma Ancient NCERT Ch 4-6' },
      { name: 'Vedic Age: Early & Later Vedic Polity, Society & Texts', tier1: true, refChapter: 'RS Sharma Ancient NCERT Ch 7-8' },
      { name: 'Buddhism & Jainism: Philosophy, Councils, Literature & Sects', tier1: true, refChapter: 'RS Sharma Ancient NCERT Ch 9' },
      { name: 'Mahajanapadas, Magadha Rise & Mauryan Empire (Ashoka Edicts)', tier1: true, refChapter: 'RS Sharma Ancient NCERT Ch 12-14' },
      { name: 'Post-Mauryan Dynasties: Sungas, Satavahanas, Kushans', tier1: false, refChapter: 'RS Sharma Ancient NCERT Ch 15' },
      { name: 'Gupta Empire: Golden Age Administration, Science & Literature', tier1: true, refChapter: 'RS Sharma Ancient NCERT Ch 19' },
      { name: 'Post-Gupta Period: Harshavardhana & Regional Kingdoms', tier1: false, refChapter: 'RS Sharma Ancient NCERT Ch 21' },
      { name: 'Sangam Period & South Indian Dynasties (Cholas, Cheras, Pandyas)', tier1: true, refChapter: 'RS Sharma Ancient NCERT Ch 16' },
      { name: 'Indian Art & Architecture: Temple Styles (Nagara, Dravida, Vesara)', tier1: true, refChapter: 'Nitin Singhania Art & Culture Ch 1' },
      { name: 'Classical & Folk Dances, Music, Puppetry & UNESCO Sites', tier1: true, refChapter: 'Nitin Singhania Art & Culture Ch 2 & 5' },
      { name: 'Early Medieval India, Tripartite Struggle & Arab Invasions', tier1: false, refChapter: 'Satish Chandra Medieval NCERT Ch 1-3' },
      { name: 'Delhi Sultanate: Slave, Khilji, Tughlaq, Sayyid, Lodi Dynasties', tier1: true, refChapter: 'Satish Chandra Medieval NCERT Ch 6-8' },
      { name: 'Sultanate Administration, Economy, Architecture & Iqta System', tier1: true, refChapter: 'Satish Chandra Medieval NCERT Ch 9' },
      { name: 'Vijayanagara & Bahmani Empires: Polity, Foreign Travelers, Art', tier1: true, refChapter: 'Satish Chandra Medieval NCERT Ch 10' },
      { name: 'Bhakti & Sufi Movements: Saints, Literature & Impact', tier1: true, refChapter: 'Satish Chandra Medieval NCERT Ch 11' },
      { name: 'Mughal Empire: Babur to Aurangzeb Policies & Battles', tier1: true, refChapter: 'Satish Chandra Medieval NCERT Ch 12-15' },
      { name: 'Mughal Administration: Mansabdari, Jagirdari & Land Revenue', tier1: true, refChapter: 'Satish Chandra Medieval NCERT Ch 16' },
      { name: 'Maratha Empire: Shivaji Administration, Chauth/Sardeshmukhi, Peshwas', tier1: true, refChapter: 'Satish Chandra Medieval NCERT Ch 18' },
      { name: 'Advent of European Powers & Carnatic Wars', tier1: false, refChapter: 'Spectrum Modern India Ch 3 & 4' },
      { name: 'British Expansion: Battle of Plassey, Buxar & Anglo-Mysore/Maratha Wars', tier1: true, refChapter: 'Spectrum Modern India Ch 5' },
      { name: 'British Administrative Systems: Subsidiary Alliance & Doctrine of Lapse', tier1: true, refChapter: 'Spectrum Modern India Ch 6' },
      { name: 'Economic Impact: Land Revenue (Zamindari, Ryotwari, Mahalwari) & Drain Theory', tier1: true, refChapter: 'Spectrum Modern India Ch 7' },
      { name: 'Tribal, Peasant & Civil Uprisings before 1857', tier1: true, refChapter: 'Spectrum Modern India Ch 8' },
      { name: 'Revolt of 1857: Causes, Leaders, Centers & Suppression', tier1: true, refChapter: 'Spectrum Modern India Ch 9' },
      { name: 'Socio-Religious Reform Movements (Raja Ram Mohan, Dayanand, Vivekananda)', tier1: true, refChapter: 'Spectrum Modern India Ch 10 & 11' },
      { name: 'Development of Indian Press, Civil Services & Modern Education', tier1: true, refChapter: 'Spectrum Modern India Ch 26-28' },
      { name: 'Foundation of INC, Safety Valve Theory & Early Political Associations', tier1: false, refChapter: 'Spectrum Modern India Ch 12' },
      { name: 'Moderate Phase & Economic Nationalism (1885–1905)', tier1: false, refChapter: 'Spectrum Modern India Ch 13' },
      { name: 'Partition of Bengal (1905), Swadeshi Movement & Surat Split (1907)', tier1: true, refChapter: 'Spectrum Modern India Ch 14' },
      { name: 'Morley-Minto Reforms (1909), Ghadar Party & Home Rule League', tier1: true, refChapter: 'Spectrum Modern India Ch 15' },
      { name: 'Gandhi Arrival, Champaran, Kheda, Ahmedabad & Rowlatt Satyagraha', tier1: true, refChapter: 'Spectrum Modern India Ch 16' },
      { name: 'Non-Cooperation Movement (1920) & Khilafat Agitation', tier1: true, refChapter: 'Spectrum Modern India Ch 17' },
      { name: 'Swarajists, Simon Commission, Nehru Report & Lahore Session (Purna Swaraj)', tier1: true, refChapter: 'Spectrum Modern India Ch 18 & 19' },
      { name: 'Revolutionary Nationalism (HSRA, Bhagat Singh, Surya Sen)', tier1: true, refChapter: 'Spectrum Modern India Ch 20' },
      { name: 'Civil Disobedience Movement & Dandi March (1930)', tier1: true, refChapter: 'Spectrum Modern India Ch 21' },
      { name: 'Gandhi-Irwin Pact, Round Table Conferences & Poona Pact', tier1: true, refChapter: 'Spectrum Modern India Ch 22' },
      { name: 'Government of India Act 1935 & 1937 Provincial Elections', tier1: true, refChapter: 'Spectrum Modern India Ch 23' },
      { name: 'August Offer, Individual Satyagraha & Cripps Mission (1942)', tier1: true, refChapter: 'Spectrum Modern India Ch 24' },
      { name: 'Quit India Movement, Royal Indian Navy (RIN) Mutiny & INA (Bose)', tier1: true, refChapter: 'Spectrum Modern India Ch 25' },
      { name: 'Wavell Plan, Cabinet Mission, Mountbatten Plan & Partition (1947)', tier1: true, refChapter: 'Spectrum Modern India Ch 26' },
      { name: 'Integration of Princely States & Post-Independence Consolidation', tier1: false, refChapter: 'Spectrum Modern India Ch 27' }
    ]
  },
  {
    id: 'geography',
    subject: 'Geography',
    name: 'Indian & Physical World Geography',
    bookRef: 'NCERT Class 11 (Physical/India) + GC Leong Physical Geography',
    chapters: [
      { name: 'Solar System, Earth Motion, Latitudes, Longitudes & Time Zones', tier1: true, refChapter: 'GC Leong Ch 1 & 2' },
      { name: 'Interior of the Earth, Seismic Waves & Continental Drift', tier1: true, refChapter: 'NCERT Class 11 Physical Ch 2 & 3' },
      { name: 'Plate Tectonics, Sea Floor Spreading & Mountain Building', tier1: true, refChapter: 'NCERT Class 11 Physical Ch 4' },
      { name: 'Earthquakes, Volcanoes, Landforms & Rock Classification', tier1: true, refChapter: 'GC Leong Ch 3 & 4' },
      { name: 'Weathering, Mass Wasting, Fluvial, Glacial & Aeolian Landforms', tier1: false, refChapter: 'GC Leong Ch 5-8' },
      { name: 'Atmospheric Structure, Composition & Heat Budget', tier1: true, refChapter: 'NCERT Class 11 Physical Ch 8 & 9' },
      { name: 'Atmospheric Pressure, Planetary Wind Systems & Jet Streams', tier1: true, refChapter: 'NCERT Class 11 Physical Ch 10' },
      { name: 'Air Masses, Fronts, Temperate & Tropical Cyclones', tier1: true, refChapter: 'NCERT Class 11 Physical Ch 11' },
      { name: 'Humidity, Condensation, Precipitation & World Climatic Regions', tier1: true, refChapter: 'GC Leong Part 2 (Ch 13-25)' },
      { name: 'Ocean Relief, Salinity, Temperature & Coral Reefs', tier1: true, refChapter: 'NCERT Class 11 Physical Ch 12 & 13' },
      { name: 'Ocean Currents, Tides & Marine Resources', tier1: true, refChapter: 'NCERT Class 11 Physical Ch 14' },
      { name: 'India: Location, Frontiers, Coastline, Islands & Exclusive Economic Zone', tier1: true, refChapter: 'NCERT Class 11 India Physical Ch 1' },
      { name: 'Physiography: The Himalayas, Major Passes & Structural Divisions', tier1: true, refChapter: 'NCERT Class 11 India Physical Ch 2' },
      { name: 'Physiography: Northern Plains, Peninsular Plateau & Coastal Plains', tier1: true, refChapter: 'NCERT Class 11 India Physical Ch 2' },
      { name: 'Drainage: Himalayan River Systems (Indus, Ganga, Brahmaputra)', tier1: true, refChapter: 'NCERT Class 11 India Physical Ch 3' },
      { name: 'Drainage: Peninsular Rivers (Godavari, Krishna, Cauvery, Narmada, Tapi)', tier1: true, refChapter: 'NCERT Class 11 India Physical Ch 3' },
      { name: 'Indian Monsoon: Origin Mechanism, El Niño, La Niña, IOD & Seasons', tier1: true, refChapter: 'NCERT Class 11 India Physical Ch 4' },
      { name: 'Soils of India: Types, Classification, Erosion & Conservation', tier1: true, refChapter: 'NCERT Class 11 India Physical Ch 6' },
      { name: 'Natural Vegetation, Forests of India & Forest Survey Metrics', tier1: true, refChapter: 'NCERT Class 11 India Physical Ch 5' },
      { name: 'Agriculture: Cropping Patterns, Kharif/Rabi/Zaid & Major Cash Crops', tier1: true, refChapter: 'NCERT Class 12 India People & Economy Ch 5' },
      { name: 'Irrigation, Multipurpose River Valley Projects & Dam Infrastructure', tier1: true, refChapter: 'NCERT Class 12 India People & Economy Ch 6' },
      { name: 'Mineral & Energy Resources: Coal, Petroleum, Renewables, Atomic Minerals', tier1: true, refChapter: 'NCERT Class 12 India People & Economy Ch 7' },
      { name: 'Industrial Belts & Infrastructure Corridors of India', tier1: false, refChapter: 'NCERT Class 12 India People & Economy Ch 8' },
      { name: 'Transport: National Highways, Dedicated Freight Corridors & Inland Waterways', tier1: true, refChapter: 'NCERT Class 12 India People & Economy Ch 10' },
      { name: 'Demography, Census Data, Urbanization & Tribal Demographics', tier1: true, refChapter: 'NCERT Class 12 India People & Economy Ch 1-3' }
    ]
  },
  {
    id: 'science',
    subject: 'Science',
    name: 'General Science (PCB)',
    bookRef: 'NCERT Science (Class 9 & 10) + Lucent General Science',
    chapters: [
      { name: 'Units, Dimensions, Significant Figures & Measuring Instruments', tier1: true, refChapter: 'Lucent Science (Physics Unit 1)' },
      { name: 'Kinematics: Velocity, Acceleration, Projectile & Circular Motion', tier1: false, refChapter: 'NCERT Class 9 Ch 8 (Motion)' },
      { name: 'Dynamics: Newton Laws, Friction, Momentum & Impulse', tier1: true, refChapter: 'NCERT Class 9 Ch 9 (Force & Laws)' },
      { name: 'Work, Power, Energy & Conservation of Mechanical Energy', tier1: true, refChapter: 'NCERT Class 9 Ch 11' },
      { name: 'Universal Gravitation, Escape Velocity & Kepler Laws', tier1: true, refChapter: 'NCERT Class 9 Ch 10' },
      { name: 'Fluids: Hydrostatic Pressure, Pascal Law, Archimedes Principle & Viscosity', tier1: true, refChapter: 'NCERT Class 9 Ch 10' },
      { name: 'Heat, Temperature Scales, Thermal Expansion & Modes of Transmission', tier1: true, refChapter: 'Lucent Science (Physics Heat Unit)' },
      { name: 'Thermodynamics: Laws, Specific Heat & Latent Heat Concepts', tier1: false, refChapter: 'Lucent Science (Physics Unit 3)' },
      { name: 'Optics: Reflection, Refraction, Total Internal Reflection & Dispersion', tier1: true, refChapter: 'NCERT Class 10 Ch 10' },
      { name: 'Lenses, Mirrors, Ray Diagrams & Optical Instruments (Human Eye Defects)', tier1: true, refChapter: 'NCERT Class 10 Ch 11' },
      { name: 'Wave Motion, Sound Waves, Doppler Effect & Ultrasound/Infrasound', tier1: true, refChapter: 'NCERT Class 9 Ch 12' },
      { name: 'Electrostatics, Electric Current, Ohm Law, Resistance & Power', tier1: true, refChapter: 'NCERT Class 10 Ch 12' },
      { name: 'Magnetic Effects of Current, Motors, Generators & Electromagnetic Induction', tier1: true, refChapter: 'NCERT Class 10 Ch 13' },
      { name: 'Nuclear Physics: Radioactivity, Half-Life, Nuclear Fission & Fusion', tier1: true, refChapter: 'Lucent Science (Modern Physics)' },
      { name: 'Matter & Its States, Separation Techniques & Colloids/Suspensions', tier1: false, refChapter: 'NCERT Class 9 Ch 1 & 2' },
      { name: 'Atomic Structure: Thomson, Rutherford, Bohr Models & Quantum Numbers', tier1: true, refChapter: 'NCERT Class 9 Ch 3 & 4' },
      { name: 'Chemical Bonding: Ionic, Covalent, Hydrogen Bonds & Coordinate Bonds', tier1: true, refChapter: 'Lucent Science (Chemistry Unit 3)' },
      { name: 'Periodic Table: Modern Periodic Law, Electronegativity, Ionization Energy', tier1: true, refChapter: 'NCERT Class 10 Ch 5' },
      { name: 'Chemical Reactions, Stoichiometry & Types of Reactions', tier1: false, refChapter: 'NCERT Class 10 Ch 1' },
      { name: 'Acids, Bases, Salts, pH Scale & Everyday Applications', tier1: true, refChapter: 'NCERT Class 10 Ch 2' },
      { name: 'Metals & Non-Metals: Reactivity Series, Extraction & Metallurgy', tier1: true, refChapter: 'NCERT Class 10 Ch 3' },
      { name: 'Carbon & Its Compounds: Allotropes, Hydrocarbons & Functional Groups', tier1: true, refChapter: 'NCERT Class 10 Ch 4' },
      { name: 'Polymers, Synthetic Fibers, Soaps, Detergents & Explosives', tier1: true, refChapter: 'NCERT Class 8 Ch 3' },
      { name: 'Environmental Chemistry: Greenhouse Gases, Acid Rain & Ozone Depletion', tier1: true, refChapter: 'NCERT Class 10 Ch 15 & 16' },
      { name: 'Cell: Structure, Organelles (Mitochondria, Ribosome, Chloroplast) & Cell Division', tier1: true, refChapter: 'NCERT Class 9 Ch 5' },
      { name: 'Plant Tissues (Xylem, Phloem) & Animal Tissues (Connective, Nervous)', tier1: true, refChapter: 'NCERT Class 9 Ch 6' },
      { name: 'Plant Physiology: Photosynthesis, Transpiration & Plant Hormones', tier1: true, refChapter: 'NCERT Class 10 Ch 6 & 7' },
      { name: 'Human Digestive System, Enzymes & Nutritional Components', tier1: true, refChapter: 'NCERT Class 10 Ch 6' },
      { name: 'Human Circulatory System: Heart, Blood Vessels, Blood Groups & Lymph', tier1: true, refChapter: 'NCERT Class 10 Ch 6' },
      { name: 'Human Respiratory System & Cellular Respiration', tier1: true, refChapter: 'NCERT Class 10 Ch 6' },
      { name: 'Human Excretory System: Kidney Structure & Nephron Mechanism', tier1: true, refChapter: 'NCERT Class 10 Ch 6' },
      { name: 'Human Nervous System: Brain Anatomy, Reflex Arc & Neurons', tier1: true, refChapter: 'NCERT Class 10 Ch 7' },
      { name: 'Endocrine System: Hormones, Glands (Thyroid, Pituitary, Adrenal) & Disorders', tier1: true, refChapter: 'NCERT Class 10 Ch 7' },
      { name: 'Human Reproduction & Embryonic Development Basics', tier1: false, refChapter: 'NCERT Class 10 Ch 8' },
      { name: 'Genetics: Mendel Laws, DNA/RNA Structure, Chromosomes & Heredity', tier1: true, refChapter: 'NCERT Class 10 Ch 9' },
      { name: 'Microorganisms, Human Diseases (Bacterial, Viral, Protozoan) & Vaccines', tier1: true, refChapter: 'NCERT Class 9 Ch 13' }
    ]
  },
  {
    id: 'economy',
    subject: 'Economy',
    name: 'Indian Economy & Macroeconomics',
    bookRef: 'Mrunal Patel Pillar Notes + NCERT Class 12 Macroeconomics',
    chapters: [
      { name: 'National Income Accounting: GDP, GNP, NNP, Real vs Nominal GDP & GVA', tier1: true, refChapter: 'Mrunal Pillar 1A + NCERT Macro Ch 2' },
      { name: 'Inflation: Types (Demand-pull, Cost-push), WPI, CPI, PPI & Core Inflation', tier1: true, refChapter: 'Mrunal Pillar 1B' },
      { name: 'Monetary Policy: RBI Functions, Repo, Reverse Repo, CRR, SLR, OMO & MPC', tier1: true, refChapter: 'Mrunal Pillar 1C' },
      { name: 'Indian Banking System: Commercial Banks, NPA Management, IBC & Basel Accords', tier1: true, refChapter: 'Mrunal Pillar 1D' },
      { name: 'NBFCs, Small Finance Banks, Payment Banks & Digital Public Infrastructure (UPI)', tier1: false, refChapter: 'Mrunal Pillar 1E' },
      { name: 'Fiscal Policy: Union Budget Components, Revenue/Capital Receipts & Expenditure', tier1: true, refChapter: 'Mrunal Pillar 2A + NCERT Macro Ch 5' },
      { name: 'Deficits: Fiscal Deficit, Revenue Deficit, Primary Deficit & FRBM Act', tier1: true, refChapter: 'Mrunal Pillar 2B' },
      { name: 'Indian Tax Structure: Direct vs Indirect Taxes, GST Council, Rates & Compliance', tier1: true, refChapter: 'Mrunal Pillar 2C' },
      { name: 'Financial Markets: Money Market Instruments (T-Bills, Commercial Paper, CD)', tier1: true, refChapter: 'Mrunal Pillar 3A' },
      { name: 'Capital Markets: Primary/Secondary Markets, SEBI, IPOs, Bonds & Stock Exchanges', tier1: true, refChapter: 'Mrunal Pillar 3B' },
      { name: 'External Sector: Balance of Payments (Current & Capital Account), CAD & Forex', tier1: true, refChapter: 'Mrunal Pillar 4A + NCERT Macro Ch 6' },
      { name: 'Exchange Rate Dynamics: NEER, REER, Rupee Depreciation & Hedging', tier1: true, refChapter: 'Mrunal Pillar 4B' },
      { name: 'International Financial Institutions: IMF, World Bank Group, WTO & ADB', tier1: true, refChapter: 'Mrunal Pillar 4C' },
      { name: 'Poverty, Inequality (Gini Coefficient, Lorenz Curve) & Multidimensional Poverty', tier1: true, refChapter: 'Mrunal Pillar 5A' },
      { name: 'Employment: Unemployment Types, Labor Force Participation Rate & Skilling', tier1: true, refChapter: 'Mrunal Pillar 5B' },
      { name: 'Agriculture Economy: MSP Regime, APMC Reforms, Fertilizer Subsidies & Food Security', tier1: true, refChapter: 'Mrunal Pillar 6A' },
      { name: 'Industrial Policies, Disinvestment, National Monetization Pipeline & PLI Schemes', tier1: true, refChapter: 'Mrunal Pillar 6B' }
    ]
  },
  {
    id: 'quant',
    subject: 'Quant',
    name: 'Quantitative Aptitude & Advanced Math',
    bookRef: 'RS Aggarwal Quantitative Aptitude + Quantum CAT (Sarvesh Verma)',
    chapters: [
      { name: 'Number System, Divisibility Rules, Unit Digits & Remainder Theorems', tier1: true, refChapter: 'Quantum CAT Module 1' },
      { name: 'HCF & LCM, Surds, Indices & Simplification Shortcuts', tier1: true, refChapter: 'RS Aggarwal Ch 2 & 9' },
      { name: 'Percentages, Base Shifts & Successive Percentage Changes', tier1: true, refChapter: 'RS Aggarwal Ch 10' },
      { name: 'Profit, Loss, Markup & Discount Calculations', tier1: true, refChapter: 'RS Aggarwal Ch 11' },
      { name: 'Simple Interest & Compound Interest (Installments & Annuities)', tier1: true, refChapter: 'RS Aggarwal Ch 12 & 13' },
      { name: 'Ratio, Proportion & Variations', tier1: true, refChapter: 'RS Aggarwal Ch 14' },
      { name: 'Averages, Weighted Averages & Age Problems', tier1: true, refChapter: 'RS Aggarwal Ch 6 & 8' },
      { name: 'Mixtures, Alligations & Replacement Formulae', tier1: true, refChapter: 'Quantum CAT Alligations Unit' },
      { name: 'Time & Work, Efficiency & Alternate Day Concepts', tier1: true, refChapter: 'RS Aggarwal Ch 15' },
      { name: 'Pipes & Cisterns', tier1: true, refChapter: 'RS Aggarwal Ch 16' },
      { name: 'Time, Speed & Distance, Average Speed & Relative Speed', tier1: true, refChapter: 'RS Aggarwal Ch 17' },
      { name: 'Trains, Platforms, Boats & Streams', tier1: true, refChapter: 'RS Aggarwal Ch 18 & 19' },
      { name: 'Races & Linear/Circular Tracks', tier1: false, refChapter: 'Quantum CAT TSD Section' },
      { name: 'Partnership & Profit Sharing Ratios', tier1: false, refChapter: 'RS Aggarwal Ch 14' },
      { name: 'Basic Algebra: Identities, Factorization & Simplification', tier1: true, refChapter: 'Advance Maths Algebra Unit 1' },
      { name: 'Linear Equations & Quadratic Equations (Roots & Nature)', tier1: true, refChapter: 'Advance Maths Algebra Unit 2' },
      { name: 'Progressions: Arithmetic (AP), Geometric (GP) & Harmonic (HP)', tier1: true, refChapter: 'Quantum CAT Progressions' },
      { name: 'Set Theory, Venn Diagrams & Relations (CDS specific)', tier1: true, refChapter: 'Pathfinder CDS Mathematics Ch 5' },
      { name: 'Logarithms & Properties (CDS pure question bank)', tier1: true, refChapter: 'Pathfinder CDS Mathematics Ch 6' },
      { name: 'Lines, Angles, Transversals & Triangles: Congruency & Similarity', tier1: true, refChapter: 'Advance Maths Geometry Unit 1' },
      { name: 'Centers of Triangles: Centroid, Incenter, Orthocenter, Circumcenter', tier1: true, refChapter: 'Advance Maths Geometry Unit 2' },
      { name: 'Quadrilaterals, Polygons & Circle Geometry (Chords, Secants, Tangents)', tier1: true, refChapter: 'Advance Maths Geometry Unit 3' },
      { name: 'Mensuration 2D: Triangles, Quadrilaterals, Circles, Sectors (Area & Perimeter)', tier1: true, refChapter: 'RS Aggarwal Ch 24' },
      { name: 'Mensuration 3D: Cube, Cuboid, Cylinder, Cone, Sphere, Hemisphere & Frustum', tier1: true, refChapter: 'RS Aggarwal Ch 25' },
      { name: 'Trigonometric Ratios, Standard Angles & Fundamental Identities', tier1: true, refChapter: 'Advance Maths Trigonometry' },
      { name: 'Heights & Distances (Angle of Elevation & Depression)', tier1: true, refChapter: 'Advance Maths Trigonometry Unit 3' },
      { name: 'Coordinate Geometry: Distance, Section Formula, Slope, Line Equations', tier1: true, refChapter: 'Advance Maths Coordinate Geometry' },
      { name: 'Statistics: Mean, Median, Mode, Standard Deviation & Variance', tier1: true, refChapter: 'Pathfinder CDS Statistics' },
      { name: 'Probability: Classical, Conditional & Combinatorial Problems', tier1: true, refChapter: 'Quantum CAT Probability' },
      { name: 'Data Interpretation: Tables, Bar Charts, Pie Charts, Line Graphs & Radar', tier1: true, refChapter: 'RS Aggarwal DI Section' }
    ]
  },
  {
    id: 'reasoning',
    subject: 'Reasoning',
    name: 'General Intelligence & Reasoning',
    bookRef: 'RS Aggarwal Non-Verbal + MK Pandey Analytical Reasoning',
    chapters: [
      { name: 'Analogy & Classification (Word, Number, Letter)', tier1: true, refChapter: 'RS Aggarwal Verbal Ch 1 & 2' },
      { name: 'Number Series, Alphabet Series, Mixed Series & Missing Terms', tier1: true, refChapter: 'RS Aggarwal Verbal Ch 3 & 4' },
      { name: 'Coding-Decoding: Letter Shifting, Substitution, Matrix & Binary', tier1: true, refChapter: 'RS Aggarwal Verbal Ch 5' },
      { name: 'Blood Relations: Coded, Decoded & Direct Relations', tier1: true, refChapter: 'RS Aggarwal Verbal Ch 6' },
      { name: 'Direction Sense & Distance (Shadow & Angle Turns)', tier1: true, refChapter: 'RS Aggarwal Verbal Ch 8' },
      { name: 'Order, Ranking & Comparison Tests', tier1: true, refChapter: 'RS Aggarwal Verbal Ch 12' },
      { name: 'Syllogisms (Standard, Possibility & Only a Few cases)', tier1: true, refChapter: 'MK Pandey Analytical Reasoning Ch 4' },
      { name: 'Venn Diagrams (Geometric & Logical Venn)', tier1: true, refChapter: 'RS Aggarwal Verbal Ch 9' },
      { name: 'Seating Arrangement (Linear, Circular, Facing In/Out, Rectangular)', tier1: true, refChapter: 'MK Pandey Analytical Reasoning Ch 7' },
      { name: 'Puzzles: Floor, Box, Month-Date & Multi-Variable Constraints', tier1: true, refChapter: 'MK Pandey Analytical Reasoning Ch 8' },
      { name: 'Inequalities: Direct & Coded Statement Inequalities', tier1: false, refChapter: 'MK Pandey Analytical Reasoning Ch 5' },
      { name: 'Clocks & Calendars (Angle, Gain/Loss, Day Calculation)', tier1: true, refChapter: 'RS Aggarwal Verbal Ch 14 & 15' },
      { name: 'Statement & Assumptions', tier1: true, refChapter: 'MK Pandey Analytical Reasoning Ch 1' },
      { name: 'Statement & Conclusions / Inferences', tier1: true, refChapter: 'MK Pandey Analytical Reasoning Ch 2' },
      { name: 'Statement & Arguments (Strong vs Weak)', tier1: true, refChapter: 'MK Pandey Analytical Reasoning Ch 3' },
      { name: 'Course of Action & Cause-Effect Relationships', tier1: true, refChapter: 'MK Pandey Analytical Reasoning Ch 6' },
      { name: 'Figure Series & Pattern Completion', tier1: true, refChapter: 'RS Aggarwal Non-Verbal Ch 1 & 3' },
      { name: 'Figure Analogy & Classification (Odd One Out)', tier1: true, refChapter: 'RS Aggarwal Non-Verbal Ch 2 & 4' },
      { name: 'Mirror Images & Water Images', tier1: true, refChapter: 'RS Aggarwal Non-Verbal Ch 5 & 6' },
      { name: 'Paper Folding & Paper Cutting', tier1: true, refChapter: 'RS Aggarwal Non-Verbal Ch 8 & 9' },
      { name: 'Embedded Figures & Hidden Shapes', tier1: true, refChapter: 'RS Aggarwal Non-Verbal Ch 7' },
      { name: 'Figure Matrix & Rule Detection', tier1: true, refChapter: 'RS Aggarwal Non-Verbal Ch 11' },
      { name: 'Cube & Dice (Open Dice, Folded Dice, Opposite Faces)', tier1: true, refChapter: 'RS Aggarwal Non-Verbal Ch 10' },
      { name: 'Dot Situation & Spatial Ability (AFCAT specific)', tier1: true, refChapter: 'Pathfinder AFCAT Non-Verbal Section' },
      { name: 'Counting of Figures (Triangles, Squares, Rectangles, Lines)', tier1: true, refChapter: 'RS Aggarwal Non-Verbal Ch 12' }
    ]
  },
  {
    id: 'english',
    subject: 'English',
    name: 'English Language & Verbal Ability',
    bookRef: 'SP Bakshi Objective General English + Word Power Made Easy',
    chapters: [
      { name: 'Parts of Speech & Fundamental Sentence Structures', tier1: false, refChapter: 'SP Bakshi Unit 1' },
      { name: 'Tenses: Rules, Exceptions, Sequence of Tenses & Conditionals', tier1: true, refChapter: 'SP Bakshi Ch 1' },
      { name: 'Subject-Verb Agreement (Syntax & Irregular Rules)', tier1: true, refChapter: 'SP Bakshi Ch 3' },
      { name: 'Nouns, Pronouns, Modifiers & Ambiguous References', tier1: false, refChapter: 'SP Bakshi Ch 4 & 5' },
      { name: 'Articles & Determinations', tier1: false, refChapter: 'SP Bakshi Ch 2' },
      { name: 'Prepositions & Fixed Prepositional Phrases', tier1: true, refChapter: 'SP Bakshi Ch 8' },
      { name: 'Conjunctions, Inversion Rules & Parallelism', tier1: true, refChapter: 'SP Bakshi Ch 9' },
      { name: 'Active & Passive Voice (Transformation of Complex Sentences)', tier1: true, refChapter: 'SP Bakshi Ch 6' },
      { name: 'Direct & Indirect Speech (Narration Rules for Interrogative/Imperative)', tier1: true, refChapter: 'SP Bakshi Ch 7' },
      { name: 'Common Error Spotting & Grammatical Faults', tier1: true, refChapter: 'SP Bakshi Revision Exercises A-D' },
      { name: 'Sentence Improvement & Phrase Replacement', tier1: true, refChapter: 'SP Bakshi Section B' },
      { name: 'Sentence Completion & Fill in the Blanks', tier1: false, refChapter: 'SP Bakshi Section B' },
      { name: 'Cloze Test: Contextual Word Filling & Grammar Integration', tier1: true, refChapter: 'SP Bakshi Section B Unit 3' },
      { name: 'Para Jumbles & Sentence Rearrangement (S1-S6 sequence)', tier1: true, refChapter: 'SP Bakshi Section B Unit 4' },
      { name: 'Reading Comprehension: Tone, Central Idea, Inference & Vocabulary in Context', tier1: true, refChapter: 'SP Bakshi Section B Unit 5' },
      { name: 'Vocabulary: High-Frequency Root Words, Prefixes & Suffixes', tier1: true, refChapter: 'Word Power Made Easy' },
      { name: 'Synonyms & Antonyms (Context-Driven)', tier1: true, refChapter: 'Black Book of English Vocabulary' },
      { name: 'Idioms, Phrases & Phrasal Verbs', tier1: true, refChapter: 'Black Book of English Vocabulary' },
      { name: 'One Word Substitution (OWS)', tier1: true, refChapter: 'Black Book of English Vocabulary' },
      { name: 'Spelling Correction & Commonly Confused Homophones', tier1: true, refChapter: 'SP Bakshi Section C' }
    ]
  },
  {
    id: 'writing',
    subject: 'Writing',
    name: 'Descriptive Mastery & SSB/CAPF Strategic Analysis',
    bookRef: 'Internal Security (Ashok Kumar IPS) + IDSA Strategic Monograms',
    chapters: [
      { name: 'Essay Writing: Structural Architecture (Hook, Thesis, Dimensions, Way Forward)', tier1: true, refChapter: 'Drishti IAS Essay Frameworks' },
      { name: 'Precis Writing: Rules, Word-Count Condensation & Strict Objective Framing', tier1: true, refChapter: 'Wren & Martin Descriptive Grammar' },
      { name: 'Report Writing: Standard Government & Administrative Format', tier1: true, refChapter: 'CAPF Paper 2 Manual' },
      { name: 'Argument Writing: For vs Against Balanced Evidence Generation', tier1: true, refChapter: 'CAPF Paper 2 Manual' },
      { name: 'Subjective Reading Comprehension: Answer Formulation Methodology', tier1: true, refChapter: 'CAPF Paper 2 Manual' },
      { name: 'Theme 1: Internal Security (Left Wing Extremism, Insurgency in North East)', tier1: true, refChapter: 'Ashok Kumar IPS Ch 1 & 2' },
      { name: 'Theme 2: Border Management & Coastal Security Infrastructure', tier1: true, refChapter: 'Ashok Kumar IPS Ch 4' },
      { name: 'Theme 3: Modern Warfare (Cyber Warfare, Drones, AI in Defence, C4ISR)', tier1: true, refChapter: 'IDSA Monograms on Cyber/Drones' },
      { name: 'Theme 4: India’s Neighborhood First Policy & South Asia Dynamics', tier1: true, refChapter: 'MEA Annual Reports / Rajiv Sikri' },
      { name: 'Theme 5: Indo-Pacific Strategy, QUAD, I2U2 & Maritime Geopolitics', tier1: true, refChapter: 'ORF Indo-Pacific Strategy Briefs' },
      { name: 'Theme 6: Indian Economy: 5 Trillion Goal, Manufacturing & Job Creation', tier1: true, refChapter: 'Economic Survey Chapter 1 & 2' },
      { name: 'Theme 7: Social Issues: Women Empowerment, Health & Education Policy', tier1: true, refChapter: 'NITI Aayog Strategy for New India' },
      { name: 'Theme 8: Climate Change, Renewable Energy Transition & COP Commitments', tier1: true, refChapter: 'MoEFCC Annual Report' },
      { name: 'Theme 9: Agriculture Reforms, Tech in Farming & Food Processing', tier1: true, refChapter: 'NITI Aayog Agri Taskforce' },
      { name: 'Theme 10: Democratic Institutions, Electoral Reforms & Cooperative Federalism', tier1: true, refChapter: 'Law Commission Reports' }
    ]
  }
];

const DEFAULT_BOOKS = [
  { title: 'Thinking in Systems', author: 'Donella Meadows' },
  { title: 'Atomic Habits', author: 'James Clear' },
  { title: 'Deep Work', author: 'Cal Newport' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
  { title: 'The Elements of Style', author: 'Strunk & White' }
];

const ANALYSIS_FRAMEWORK = [
  'cause', 
  'stakeholders', 
  'mechanism', 
  'effects', 
  'counterArguments', 
  'historicalParallel', 
  'position'
];

const FRAMEWORK_LABELS = { 
  cause: 'Root Cause & Background', 
  stakeholders: 'Key Stakeholders & Interests', 
  mechanism: 'Mechanism — How it Works', 
  effects: 'Multilateral / National Effects', 
  counterArguments: 'Counter-Arguments / For vs. Against (SSB/CAPF)', 
  historicalParallel: 'Historical Parallel', 
  position: 'Your Reasoned Synthesis / Stand' 
};

function daysSince(dateStr) { if (!dateStr) return 999; return Math.floor((new Date() - new Date(dateStr)) / 86400000); }
function daysUntil(dateStr) { return Math.ceil((new Date(dateStr) - new Date()) / 86400000); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

function isTodaySunday() { return new Date().getDay() === 0; }
function isTodayMonthEnd() {
  const d = new Date();
  const tomorrow = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return tomorrow.getDate() === 1;
}

export default function PrepOS() {
  const [tab, setTab] = useState('dashboard');
  const [subtab, setSubtab] = useState('priority');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [books, setBooks] = useState([]);
  const [audit, setAudit] = useState([]);
  const [srs, setSrs] = useState({});
  const [analyses, setAnalyses] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(6.0);
  const [vocabList, setVocabList] = useState([]);
  const [feed, setFeed] = useState({ sections: {}, error: null, loadingFeed: true });
  const [revealedSrs, setRevealedSrs] = useState({});

  // Mock Mode Switch ('in-app' | 'external-log')
  const [mockMode, setMockMode] = useState('in-app');

  // Vocab State
  const [rawWordsInput, setRawWordsInput] = useState('');
  const [rawIdiomsInput, setRawIdiomsInput] = useState('');
  const [manualQuizMode, setManualQuizMode] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizRevealed, setQuizRevealed] = useState(false);

  // AI Agent States
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [activeDrill, setActiveDrill] = useState(null);
  const [drillAnswers, setDrillAnswers] = useState({});
  const [sparringResult, setSparringResult] = useState(null);

  useEffect(() => {
    (async () => {
      setSessions(await getKey('sessions', []));
      setTopics(await getKey('topics', []));
      setChecklist(await getKey('checklist', {}));
      const b = await getKey('books', null);
      setBooks(b || DEFAULT_BOOKS.map((x, i) => ({ id: i + 1, title: x.title, author: x.author, totalPages: 0, pagesRead: 0, status: 'not-started' })));
      setAudit(await getKey('audit', []));
      setSrs(await getKey('srs', {}));
      setAnalyses(await getKey('analyses', []));
      setDailyTarget(await getKey('dailyTarget', 6.0));
      setVocabList(await getKey('vocabList', []));
      setLoading(false);
    })();
    loadFeed();
  }, []);

  async function loadFeed() {
    try {
      const res = await fetch('/.netlify/functions/feed');
      if (!res.ok) throw new Error('feed unavailable');
      const data = await res.json();
      setFeed({ sections: data.sections || {}, error: null, loadingFeed: false });
    } catch (e) {
      setFeed({ sections: {}, error: 'Live feed unavailable. Ensure serverless function is deployed.', loadingFeed: false });
    }
  }

  function pushAudit(summary, list = audit) {
    const next = [{ ts: new Date().toISOString(), summary }, ...list].slice(0, 300);
    setAudit(next); setKey('audit', next);
  }

  // --- Daily Log Logic ---
  const [sessForm, setSessForm] = useState({ subject: SUBJECTS[0], hours: '', notes: '' });
  function addSession() {
    if (!sessForm.hours) return;
    const entry = { id: Date.now(), date: todayStr(), subject: sessForm.subject, hours: Number(sessForm.hours), notes: sessForm.notes };
    const next = [entry, ...sessions];
    setSessions(next); setKey('sessions', next);
    pushAudit(`Logged ${sessForm.hours}h — ${sessForm.subject}`);
    setSessForm({ subject: SUBJECTS[0], hours: '', notes: '' });
  }
  function deleteSession(id) { const next = sessions.filter(s => s.id !== id); setSessions(next); setKey('sessions', next); }

  function updateDailyTarget(val) {
    const num = Number(val) || 0;
    setDailyTarget(num);
    setKey('dailyTarget', num);
  }

  // --- Multi-Stage Checklist Logic ---
  function cycleChapterRevision(resId, idx) {
    const key = `${resId}-${idx}`;
    const curLevel = checklist[key] || 0;
    const nextLevel = (curLevel + 1) % 4;
    const next = { ...checklist, [key]: nextLevel };
    setChecklist(next); 
    setKey('checklist', next);
    pushAudit(`Updated revision level to R${nextLevel} for ${resId} [Ch ${idx + 1}]`);
  }

  // --- Vocab Engine Logic ---
  function submitDailyVocab() {
    const date = todayStr();
    const newItems = [];
    const delimiter = /[\-\:\u2013]/;

    const wordsLines = rawWordsInput.split('\n').map(l => l.trim()).filter(Boolean);
    wordsLines.forEach(line => {
      const parts = line.split(delimiter);
      const term = parts[0]?.trim();
      const meaning = parts.slice(1).join(' - ').trim() || 'No definition added';
      if (term) {
        newItems.push({ id: Date.now() + Math.random(), date, term, meaning, type: 'word', score: 0 });
      }
    });

    const idiomsLines = rawIdiomsInput.split('\n').map(l => l.trim()).filter(Boolean);
    idiomsLines.forEach(line => {
      const parts = line.split(delimiter);
      const term = parts[0]?.trim();
      const meaning = parts.slice(1).join(' - ').trim() || 'No definition added';
      if (term) {
        newItems.push({ id: Date.now() + Math.random(), date, term, meaning, type: 'idiom', score: 0 });
      }
    });

    if (newItems.length === 0) return;

    const next = [...newItems, ...vocabList];
    setVocabList(next);
    setKey('vocabList', next);
    pushAudit(`Logged ${wordsLines.length} words & ${idiomsLines.length} idioms to Vocab Bank`);
    setRawWordsInput('');
    setRawIdiomsInput('');
  }

  function deleteVocabItem(id) {
    const next = vocabList.filter(v => v.id !== id);
    setVocabList(next);
    setKey('vocabList', next);
  }

  const isSunday = isTodaySunday();
  const isMonthEnd = isTodayMonthEnd();
  const isQuizDay = isSunday || isMonthEnd || manualQuizMode;

  function getQuizPool() {
    if (isMonthEnd) {
      const currentMonth = todayStr().slice(0, 7);
      return vocabList.filter(v => v.date && v.date.startsWith(currentMonth));
    }
    return vocabList.filter(v => daysSince(v.date) <= 7);
  }

  const activeQuizPool = getQuizPool();

  function gradeQuizItem(correct) {
    const currentItem = activeQuizPool[quizIdx];
    if (currentItem) {
      const nextList = vocabList.map(v => v.id === currentItem.id ? { ...v, score: correct ? v.score + 1 : Math.max(0, v.score - 1) } : v);
      setVocabList(nextList);
      setKey('vocabList', nextList);
    }
    setQuizRevealed(false);
    if (quizIdx + 1 < activeQuizPool.length) {
      setQuizIdx(quizIdx + 1);
    } else {
      setQuizIdx(0);
      alert('Audit Complete! Mastered vocab items updated in your bank.');
    }
  }

  // --- Mocks with Speed & Diagnostic Forensics ---
  const initialSubject = SUBJECTS[0];
  const initialMatchRes = RESOURCES.find(r => r.subject?.toLowerCase() === initialSubject.toLowerCase() || r.id?.toLowerCase() === initialSubject.toLowerCase());
  const initialFirstChap = initialMatchRes && initialMatchRes.chapters.length > 0 ? initialMatchRes.chapters[0].name : '';

  const [tForm, setTForm] = useState({ 
    subject: initialSubject, 
    topic: initialFirstChap, 
    exams: [], 
    totalQ: '', correctQ: '', wrongQ: '', time: '', 
    predicted: '', errorType: '', isMock: false, strategy: 'merit', 
    benchmark: '', memoryTrap: '' 
  });
  const [tError, setTError] = useState('');
  
  function toggleExam(ex) { setTForm(f => ({ ...f, exams: f.exams.includes(ex) ? f.exams.filter(x => x !== ex) : [...f.exams, ex] })); }
  
  function submitTopic(customPayload = null) {
    const sourceData = customPayload || tForm;
    const total = Number(sourceData.totalQ) || 0;
    const correct = Number(sourceData.correctQ) || 0;
    const wrong = Number(sourceData.wrongQ) || 0;
    const timeSpent = Number(sourceData.time) || 0;

    if (!sourceData.topic.trim() || sourceData.exams.length === 0 || total === 0) { 
      if (!customPayload) setTError('Enter topic, exam(s), and valid question metrics.'); 
      return; 
    }

    const accuracy = Math.round((correct / total) * 100);
    const negativePenalty = (wrong * 0.33);
    const netScore = Math.max(0, correct - negativePenalty);
    const secPerCorrect = correct > 0 ? Math.round((timeSpent * 60) / correct) : 0;

    setTError('');
    const entry = { 
      id: Date.now(), 
      date: todayStr(), 
      subject: sourceData.subject, 
      topic: sourceData.topic.trim(), 
      exams: sourceData.exams, 
      totalQ: total,
      correctQ: correct,
      wrongQ: wrong,
      accuracy, 
      predicted: Number(sourceData.predicted) || accuracy, 
      time: timeSpent, 
      secPerCorrect,
      netScore: Number(netScore.toFixed(2)),
      errorType: sourceData.errorType || '', 
      isMock: sourceData.isMock || false, 
      strategy: sourceData.strategy || 'merit', 
      benchmark: sourceData.benchmark ? Number(sourceData.benchmark) : null,
      memoryTrap: (sourceData.memoryTrap || '').trim()
    };

    const next = [entry, ...topics];
    setTopics(next); setKey('topics', next);

    const key = sourceData.subject + '::' + entry.topic;
    const cur = srs[key] || { box: 0 };
    let box = entry.accuracy >= 80 ? Math.min(cur.box + 1, SRS_INTERVALS.length - 1) : entry.accuracy < 50 ? 0 : cur.box;
    const nextSrs = { 
      ...srs, 
      [key]: { 
        box, 
        lastSeen: entry.date, 
        subject: sourceData.subject, 
        topic: entry.topic,
        memoryTrap: entry.memoryTrap || cur.memoryTrap || ''
      } 
    };
    setSrs(nextSrs); setKey('srs', nextSrs);

    pushAudit(`${entry.isMock ? 'Mock' : 'Practice'} logged — ${entry.subject}/${entry.topic} (${entry.accuracy}% acc)`);
    if (!customPayload) {
      setTForm({ subject: initialSubject, topic: initialFirstChap, exams: [], totalQ: '', correctQ: '', wrongQ: '', time: '', predicted: '', errorType: '', isMock: false, strategy: 'merit', benchmark: '', memoryTrap: '' });
    }
  }
  function deleteTopic(id) { const next = topics.filter(t => t.id !== id); setTopics(next); setKey('topics', next); }

  function updateBook(id, field, value) {
    const next = books.map(b => b.id === id ? { ...b, [field]: value, status: field === 'pagesRead' && b.totalPages && Number(value) >= b.totalPages ? 'done' : field === 'pagesRead' && Number(value) > 0 ? 'reading' : b.status } : b);
    setBooks(next); setKey('books', next);
  }

  function reviewSrs(key, correct) {
    const cur = srs[key]; if (!cur) return;
    const box = correct ? Math.min(cur.box + 1, SRS_INTERVALS.length - 1) : 0;
    const next = { ...srs, [key]: { ...cur, box, lastSeen: todayStr() } };
    setSrs(next); setKey('srs', next);
    setRevealedSrs(prev => ({ ...prev, [key]: false }));
  }

  // --- Analysis Bank & Bridge Logic ---
  const emptyAnalysis = { topic: '', source: '', cause: '', stakeholders: '', mechanism: '', effects: '', counterArguments: '', historicalParallel: '', position: '' };
  const [aForm, setAForm] = useState(emptyAnalysis);
  
  function sendFeedToAnalysis(item) {
    setAForm({
      ...emptyAnalysis,
      topic: item.title,
      source: item.link
    });
    setTab('analysis');
  }

  function submitAnalysis() {
    if (!aForm.topic.trim()) return;
    const entry = { id: Date.now(), date: todayStr(), ...aForm, topic: aForm.topic.trim() };
    const next = [entry, ...analyses];
    setAnalyses(next); setKey('analyses', next);
    pushAudit(`Structured analysis logged — ${entry.topic}`);
    setAForm(emptyAnalysis);
  }
  function deleteAnalysis(id) { const next = analyses.filter(a => a.id !== id); setAnalyses(next); setKey('analyses', next); }

  // --- AI Agent Tool Integrations ---
  async function triggerAgentDrill(prescription) {
    setLoadingAgent(true);
    setDrillAnswers({});
    try {
      const res = await fetch('/.netlify/functions/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_trap_drill',
          payload: {
            subject: prescription.subject,
            topic: prescription.topic,
            errorType: prescription.errorType,
            memoryTrap: prescription.memoryTrap
          }
        })
      });
      if (!res.ok) throw new Error('Agent service error');
      const drillData = await res.json();
      setActiveDrill(drillData);
      pushAudit(`AI Diagnostic Drill synthesized for ${prescription.topic}`);
    } catch (e) {
      alert('AI Agent could not synthesize drill. Verify GEMINI_API_KEY on Netlify.');
    } finally {
      setLoadingAgent(false);
    }
  }

  async function triggerSparringAgent(analysisObj) {
    setLoadingAgent(true);
    try {
      const res = await fetch('/.netlify/functions/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'spar_argument',
          payload: {
            topic: analysisObj.topic,
            userPosition: analysisObj.position || 'Not explicitly stated',
            currentPoints: `Cause: ${analysisObj.cause}. Effects: ${analysisObj.effects}. Counter: ${analysisObj.counterArguments}`
          }
        })
      });
      if (!res.ok) throw new Error('Sparring service error');
      const result = await res.json();
      setSparringResult({ topic: analysisObj.topic, ...result });
      pushAudit(`SSB/CAPF AI Sparring completed on ${analysisObj.topic}`);
    } catch (e) {
      alert('SSB Sparring Agent unavailable. Verify GEMINI_API_KEY on Netlify.');
    } finally {
      setLoadingAgent(false);
    }
  }

  // --- Diagnostic Forensic Agent Computations ---
  function computeDiagnosticsAndWeakAreas() {
    const weakChapterMap = {};
    const prescriptions = [];

    topics.forEach(t => {
      if (t.accuracy < 65 || t.errorType === 'conceptual') {
        const lowerTopic = t.topic.toLowerCase();

        RESOURCES.forEach(res => {
          if (res.subject.toLowerCase() === t.subject.toLowerCase() || t.subject.toLowerCase().includes(res.id)) {
            res.chapters.forEach((chap, idx) => {
              const lowerChap = chap.name.toLowerCase();
              const words = lowerTopic.split(' ').filter(w => w.length > 3);
              const isMatch = lowerChap.includes(lowerTopic) || words.some(w => lowerChap.includes(w));

              if (isMatch) {
                const key = `${res.id}-${idx}`;
                weakChapterMap[key] = {
                  subject: res.subject,
                  resName: res.name,
                  bookRef: res.bookRef,
                  chapterName: chap.name,
                  refChapter: chap.refChapter,
                  lastAccuracy: t.accuracy,
                  errorType: t.errorType,
                  memoryTrap: t.memoryTrap
                };
              }
            });
          }
        });

        prescriptions.push({
          id: t.id,
          date: t.date,
          subject: t.subject,
          topic: t.topic,
          accuracy: t.accuracy,
          errorType: t.errorType,
          memoryTrap: t.memoryTrap,
          bookRef: RESOURCES.find(r => r.subject.toLowerCase() === t.subject.toLowerCase())?.bookRef || 'Standard Recommended Text'
        });
      }
    });

    return { weakChapterMap, prescriptions };
  }

  function computePriority() {
    const map = {};
    topics.forEach(e => {
      const key = e.subject + '::' + e.topic;
      if (!map[key]) map[key] = { subject: e.subject, topic: e.topic, exams: new Set(), accSum: 0, count: 0, lastDate: e.date };
      e.exams.forEach(x => map[key].exams.add(x));
      map[key].accSum += e.accuracy; map[key].count += 1;
      if (e.date > map[key].lastDate) map[key].lastDate = e.date;
    });
    return Object.values(map).map(v => {
      const avgAcc = v.accSum / v.count, examWeight = v.exams.size, days = daysSince(v.lastDate);
      const priority = (1 - avgAcc / 100) * (1 + examWeight * 0.3) * (1 + Math.min(days, 60) / 30);
      return { subject: v.subject, topic: v.topic, avgAcc, examWeight, days, priority };
    }).sort((a, b) => b.priority - a.priority);
  }

  function computeCalibration() {
    if (topics.length === 0) return { brier: null, rows: [] };
    const rows = topics.slice(0, 25);
    const brier = topics.reduce((s, e) => s + Math.pow((e.predicted / 100) - (e.accuracy / 100), 2), 0) / topics.length;
    return { brier, rows };
  }

  function computeDue() {
    return Object.entries(srs).map(([key, v]) => {
      const interval = SRS_INTERVALS[v.box], days = daysSince(v.lastSeen);
      return { key, subject: v.subject, topic: v.topic, box: v.box, days, interval, overdueBy: days - interval, memoryTrap: v.memoryTrap };
    }).filter(x => x.overdueBy >= 0).sort((a, b) => b.overdueBy - a.overdueBy);
  }

  function computeErrors() {
    const counts = {};
    topics.filter(t => t.errorType).forEach(t => { counts[t.errorType] = (counts[t.errorType] || 0) + 1; });
    return { counts, log: topics.filter(t => t.errorType) };
  }

  function streak() {
    const dates = new Set(sessions.map(s => s.date));
    let d = 0, cur = new Date();
    while (dates.has(cur.toISOString().slice(0, 10))) { d++; cur.setDate(cur.getDate() - 1); }
    return d;
  }

  function todayHours() {
    return sessions.filter(s => s.date === todayStr()).reduce((sum, s) => sum + s.hours, 0);
  }

  function weeklyHours() {
    const last7 = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); }).reverse();
    return last7.map(date => ({ date, hours: sessions.filter(s => s.date === date).reduce((a, s) => a + s.hours, 0) }));
  }

  function exportBackup() {
    const data = { sessions, topics, checklist, books, audit, srs, analyses, dailyTarget, vocabList, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `prep-os-backup-${todayStr()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const fields = { sessions: setSessions, topics: setTopics, checklist: setChecklist, books: setBooks, audit: setAudit, srs: setSrs, analyses: setAnalyses, vocabList: setVocabList };
        Object.entries(fields).forEach(([k, setter]) => { if (data[k]) { setter(data[k]); setKey(k, data[k]); } });
        if (data.dailyTarget) { setDailyTarget(data.dailyTarget); setKey('dailyTarget', data.dailyTarget); }
      } catch { alert('Invalid backup file format.'); }
    };
    reader.readAsText(file);
  }

  if (loading) return <div className="p-6 text-slate-400 font-mono text-sm bg-slate-950 min-h-screen">loading prep-os...</div>;

  const { weakChapterMap, prescriptions } = computeDiagnosticsAndWeakAreas();
  const priority = computePriority();
  const { brier, rows } = computeCalibration();
  const due = computeDue();
  const errors = computeErrors();
  const wHours = weeklyHours();
  const maxH = Math.max(1, ...wHours.map(w => w.hours));
  const tHours = todayHours();
  const targetPct = Math.min(100, Math.round((tHours / (dailyTarget || 1)) * 100));

  const totalChapters = RESOURCES.reduce((a, r) => a + r.chapters.length, 0);
  const masteredChapters = Object.values(checklist).filter(v => v >= 3).length;

  const TABS = [
    { id: 'dashboard', label: 'dashboard', icon: Activity },
    { id: 'log', label: 'daily log', icon: Plus },
    { id: 'vocab', label: 'vocab & idioms', icon: SpellCheck },
    { id: 'checklist', label: 'syllabus (r1-r3)', icon: ListChecks },
    { id: 'mocks', label: 'mocks & speed', icon: ClipboardList },
    { id: 'analytics', label: 'analytics', icon: Target },
    { id: 'analysis', label: 'analysis bank', icon: Brain },
    { id: 'feed', label: 'current affairs', icon: Newspaper },
    { id: 'audit', label: 'audit log', icon: Layers },
    { id: 'books', label: 'books', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-3">
      <div className="bg-slate-950 text-slate-200 rounded-xl border border-slate-800 max-w-3xl mx-auto font-sans">
        
        {/* Top Header - Centered Title Layout */}
        <div className="px-5 py-4 border-b border-slate-800 grid grid-cols-3 items-center">
          <div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <Flame size={12} className="text-amber-500" /> {streak()} day streak
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-semibold tracking-wider text-slate-100 uppercase">
              Muntazir Mehdi <span className="text-teal-400">PREP LOG</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={exportBackup} className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-teal-400 transition" title="Export backup"><Download size={14} /></button>
            <label className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-teal-400 transition cursor-pointer" title="Import backup">
              <Upload size={14} /><input type="file" accept=".json" onChange={importBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-none">
          {TABS.map(t => {
            const Icon = t.icon, active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-colors ${active ? 'border-teal-500 text-teal-400 bg-teal-950/20' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* TAB 1: DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-5">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock size={13} className="text-teal-400" />
                    <span>Daily Target: <span className="text-teal-400 font-semibold">{tHours}h</span> / {dailyTarget}h</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>Goal:</span>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={dailyTarget} 
                      onChange={e => updateDailyTarget(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 w-12 text-center text-slate-200"
                    />
                    <span>h</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full transition-all duration-300 ${targetPct >= 100 ? 'bg-emerald-400' : 'bg-teal-500'}`} style={{ width: `${targetPct}%` }} />
                </div>
              </div>

              {Object.keys(weakChapterMap).length > 0 && (
                <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-mono">
                    <FlameKindling size={15} className="text-rose-400 animate-pulse" />
                    <span><strong>Forensics Alert:</strong> {Object.keys(weakChapterMap).length} Weak Syllabus Chapters identified for immediate re-reading.</span>
                  </div>
                  <button onClick={() => { setTab('analytics'); setSubtab('diagnostics'); }} className="text-xs font-mono px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-rose-200 rounded transition flex items-center gap-1">
                    <span>Prescriptions</span> &rarr;
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(EXAM_DATES).map(([ex, date]) => (
                  <div key={ex} className="bg-slate-900 rounded-xl p-3.5 border border-slate-800/80">
                    <div className="text-xs text-slate-500 font-mono">{ex}</div>
                    <div className="text-lg font-mono text-teal-400">{daysUntil(date)}d</div>
                    <div className="text-[11px] text-slate-600">{date}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-xs text-slate-500 font-mono mb-2">velocity — last 7 days</div>
                <div className="flex items-end gap-2 h-24 bg-slate-900 rounded-xl p-3 border border-slate-800/80">
                  {wHours.map(w => (
                    <div key={w.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <div className="text-[10px] font-mono text-slate-500">{w.hours || ''}</div>
                      <div className="w-full bg-teal-600 rounded-t" style={{ height: `${(w.hours / maxH) * 60}px`, minHeight: w.hours ? '4px' : '0px' }} />
                      <div className="text-[10px] text-slate-600 font-mono">{w.date.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80"><div className="text-base font-mono text-slate-100">{vocabList.length}</div><div className="text-[11px] text-slate-500">vocab items</div></div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80"><div className="text-base font-mono text-slate-100">{masteredChapters}/{totalChapters}</div><div className="text-[11px] text-slate-500">R3 done</div></div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80"><div className="text-base font-mono text-slate-100">{topics.filter(t => t.isMock).length}</div><div className="text-[11px] text-slate-500">mocks</div></div>
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80"><div className="text-base font-mono text-slate-100">{analyses.length}</div><div className="text-[11px] text-slate-500">analyses</div></div>
              </div>

              {priority.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 font-mono mb-2">urgent priority — weakest retained concepts</div>
                  <div className="space-y-1.5">
                    {priority.slice(0, 3).map((p, i) => (
                      <div key={i} className="bg-slate-900 rounded-lg px-3 py-2 text-xs flex justify-between border border-slate-800/60">
                        <span className="text-slate-300">{p.subject} / {p.topic}</span>
                        <span className="text-amber-400 font-mono">{p.avgAcc.toFixed(0)}% avg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAILY LOG */}
          {tab === 'log' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select value={sessForm.subject} onChange={e => setSessForm(f => ({ ...f, subject: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
                <input type="number" step="0.5" placeholder="hours spent" value={sessForm.hours} onChange={e => setSessForm(f => ({ ...f, hours: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" />
              </div>
              <textarea placeholder="Core subtopics covered / key breakthroughs / traps noticed" value={sessForm.notes} onChange={e => setSessForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" rows={2} />
              <button onClick={addSession} className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm transition">log study session</button>
              
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                {sessions.slice(0, 10).map(s => (
                  <div key={s.id} className="flex justify-between items-center text-xs bg-slate-900 rounded-lg px-3 py-2 border border-slate-800/60">
                    <div><span className="text-slate-300 font-mono">{s.date} · {s.subject}</span> <span className="text-slate-500 ml-1">{s.notes}</span></div>
                    <div className="flex items-center gap-3"><span className="font-mono text-teal-400 font-semibold">{s.hours}h</span><button onClick={() => deleteSession(s.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={13} /></button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VOCAB & IDIOMS (BLACK BOOK ENGINE) */}
          {tab === 'vocab' && (
            <div className="space-y-5">
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-xs font-mono uppercase text-teal-400 font-semibold flex items-center gap-1.5">
                    <SpellCheck size={14} />
                    <span>Black Book Vocab & Idioms Engine</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Target: 30 Words + 10 Idioms daily &bull; Automated Sunday & Month-End Audits
                  </div>
                </div>
                <button
                  onClick={() => { setManualQuizMode(!manualQuizMode); setQuizIdx(0); setQuizRevealed(false); }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded font-mono border border-slate-700 transition flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  <span>{manualQuizMode ? 'Exit Audit' : 'Trigger Drill'}</span>
                </button>
              </div>

              {isQuizDay ? (
                <div className="space-y-4">
                  <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3 text-xs text-amber-300 font-mono flex items-center justify-between">
                    <span>
                      {isMonthEnd ? '🚨 MONTH-END RETENTION MEGA-AUDIT (All Month Items)' : isSunday ? '⚡ SUNDAY WEEKLY RETENTION AUDIT (Last 7 Days)' : '🎯 MANUAL AUDIT DRILL ACTIVE'}
                    </span>
                    <span>{activeQuizPool.length > 0 ? `${quizIdx + 1}/${activeQuizPool.length}` : '0 Items'}</span>
                  </div>

                  {activeQuizPool.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-mono text-xs">
                      No vocab items found in this audit window. Log daily words to populate Sunday tests.
                    </div>
                  ) : (
                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center space-y-4">
                      <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 inline-block uppercase">
                        {activeQuizPool[quizIdx]?.type} &bull; Logged {activeQuizPool[quizIdx]?.date}
                      </div>

                      <div className="text-2xl font-semibold text-slate-100 tracking-wide font-serif">
                        {activeQuizPool[quizIdx]?.term}
                      </div>

                      {quizRevealed ? (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-teal-300 font-sans text-sm">
                          {activeQuizPool[quizIdx]?.meaning}
                        </div>
                      ) : (
                        <button
                          onClick={() => setQuizRevealed(true)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono border border-slate-700 transition"
                        >
                          Reveal Definition & Meaning
                        </button>
                      )}

                      {quizRevealed && (
                        <div className="flex justify-center gap-3 pt-2">
                          <button
                            onClick={() => gradeQuizItem(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-700 text-xs font-mono transition"
                          >
                            <Check size={14} /> Remembered
                          </button>
                          <button
                            onClick={() => gradeQuizItem(false)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 text-xs font-mono transition"
                          >
                            <X size={14} /> Forgot / Need Review
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 flex justify-between">
                        <span>30 Daily Words (Black Book)</span>
                        <span className="text-slate-600">Term - Meaning (1 per line)</span>
                      </label>
                      <textarea
                        value={rawWordsInput}
                        onChange={e => setRawWordsInput(e.target.value)}
                        placeholder={`Ephemeral - short-lived\nUbiquitous - present everywhere\nAltruistic - selfless concern for others`}
                        rows={6}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs placeholder-slate-600 text-slate-200 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 flex justify-between">
                        <span>10 Idioms / Phrasal Verbs</span>
                        <span className="text-slate-600">Idiom - Meaning (1 per line)</span>
                      </label>
                      <textarea
                        value={rawIdiomsInput}
                        onChange={e => setRawIdiomsInput(e.target.value)}
                        placeholder={`Burn the midnight oil - work late into night\nBreak the ice - initiate conversation\nCall off - cancel an event`}
                        rows={6}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs placeholder-slate-600 text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={submitDailyVocab}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm transition"
                  >
                    audit & save daily vocab
                  </button>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-xs text-slate-500 font-mono flex justify-between">
                      <span>Logged Vocab Vault ({vocabList.length} items stored)</span>
                      <span className="text-teal-400">Locked on Sundays for Quizzes</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {vocabList.slice(0, 12).map(item => (
                        <div key={item.id} className="bg-slate-900 rounded-lg p-2.5 text-xs border border-slate-800/80 flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-slate-200 font-serif">{item.term}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">{item.meaning}</div>
                            <div className="text-[10px] text-slate-600 font-mono mt-1">
                              {item.date} &bull; {item.type} {item.score > 0 ? `&bull; Score ${item.score}` : ''}
                            </div>
                          </div>
                          <button onClick={() => deleteVocabItem(item.id)} className="text-slate-600 hover:text-red-400 ml-2">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 3-STAGE REVISION CHECKLIST */}
          {tab === 'checklist' && (
            <div className="space-y-6">
              <div className="text-xs text-slate-500 font-mono flex items-center justify-between">
                <span>Multi-Stage Revision Flow: Click chapter to cycle [Unread] &rarr; [R1] &rarr; [R2] &rarr; [R3 Mastered]</span>
                <span className="text-teal-400 font-medium">{masteredChapters}/{totalChapters} Mastered</span>
              </div>

              {RESOURCES.map(r => {
                const total = r.chapters.length;
                const r3Count = r.chapters.filter((_, i) => (checklist[`${r.id}-${i}`] || 0) >= 3).length;
                return (
                  <div key={r.id} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-sm font-medium text-slate-200">{r.name}</div>
                      <div className="text-xs font-mono text-slate-500">{r3Count}/{total} R3</div>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mb-2">Book: {r.bookRef}</div>
                    
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mb-3 overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${(r3Count / total) * 100}%` }} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {r.chapters.map((c, i) => {
                        const key = `${r.id}-${i}`;
                        const level = checklist[key] || 0;
                        const isWeakArea = !!weakChapterMap[key];

                        const levelStyles = [
                          'text-slate-500 border-slate-800 bg-slate-950/40',
                          'text-amber-300 border-amber-900/60 bg-amber-950/20',
                          'text-teal-300 border-teal-900/60 bg-teal-950/20',
                          'text-emerald-400 border-emerald-800/80 bg-emerald-950/30 font-medium'
                        ];
                        const levelLabels = ['Unread', 'R1 Done', 'R2 Done', 'R3 Mastered'];

                        return (
                          <button 
                            key={i} 
                            onClick={() => cycleChapterRevision(r.id, i)} 
                            className={`text-left text-xs px-2.5 py-2 rounded-lg flex items-center justify-between border transition ${
                              isWeakArea ? 'border-rose-500/80 bg-rose-950/30 ring-1 ring-rose-500/50 shadow-lg shadow-rose-950/50' : levelStyles[level]
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {isWeakArea && (
                                <span className="flex h-2 w-2 relative flex-shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                              )}
                              {c.tier1 && <span className="text-amber-400 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 flex-shrink-0">★ Tier 1</span>}
                              <span className={`truncate ${isWeakArea ? 'text-rose-200 font-semibold' : ''}`}>{c.name}</span>
                            </div>

                            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                              {isWeakArea && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-700 animate-pulse">
                                  READ: {c.refChapter}
                                </span>
                              )}
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700/50">
                                {levelLabels[level]}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: MOCKS & SPEED (DUAL-MODE ENGINE) */}
          {tab === 'mocks' && (
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setMockMode('in-app')}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition flex items-center justify-center gap-1.5 ${
                    mockMode === 'in-app' ? 'bg-teal-950 text-teal-300 border border-teal-700' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Play size={13} />
                  <span>Take Test In-App (Real-Time Simulator)</span>
                </button>
                <button
                  onClick={() => setMockMode('external-log')}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition flex items-center justify-center gap-1.5 ${
                    mockMode === 'external-log' ? 'bg-teal-950 text-teal-300 border border-teal-700' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Plus size={13} />
                  <span>Log External Mock Score</span>
                </button>
              </div>

              {/* IN-APP REAL-TIME TEST ENGINE (With RESOURCES Passed Down) */}
              {mockMode === 'in-app' ? (
                <MockTestEngine 
                  subjects={SUBJECTS} 
                  exams={EXAMS} 
                  resources={RESOURCES}
                  onCompleteTest={(attempt) => submitTopic(attempt)} 
                />
              ) : (
                /* MANUAL EXTERNAL LOG ENGINE (With Dynamic Subject/Chapter Dropdowns) */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={tForm.subject} 
                      onChange={e => {
                        const newSubj = e.target.value;
                        const matchRes = RESOURCES.find(r => r.subject?.toLowerCase() === newSubj.toLowerCase() || r.id?.toLowerCase() === newSubj.toLowerCase());
                        const firstChap = matchRes && matchRes.chapters.length > 0 ? matchRes.chapters[0].name : '';
                        setTForm(f => ({ ...f, subject: newSubj, topic: firstChap }));
                      }} 
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select 
                      value={tForm.topic} 
                      onChange={e => setTForm(f => ({ ...f, topic: e.target.value }))}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    >
                      {(RESOURCES.find(r => r.subject?.toLowerCase() === tForm.subject.toLowerCase() || r.id?.toLowerCase() === tForm.subject.toLowerCase())?.chapters || []).map(chap => (
                        <option key={chap.name} value={chap.name}>{chap.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {EXAMS.map(ex => (
                      <button key={ex} onClick={() => toggleExam(ex)} className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${tForm.exams.includes(ex) ? 'bg-teal-950 border-teal-600 text-teal-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                        {ex}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <input type="number" placeholder="Total Qs" value={tForm.totalQ} onChange={e => setTForm(f => ({ ...f, totalQ: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs placeholder-slate-600 text-slate-200" />
                    <input type="number" placeholder="Correct" value={tForm.correctQ} onChange={e => setTForm(f => ({ ...f, correctQ: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs placeholder-slate-600 text-emerald-400 font-mono" />
                    <input type="number" placeholder="Wrong" value={tForm.wrongQ} onChange={e => setTForm(f => ({ ...f, wrongQ: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs placeholder-slate-600 text-red-400 font-mono" />
                    <input type="number" placeholder="Time (min)" value={tForm.time} onChange={e => setTForm(f => ({ ...f, time: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs placeholder-slate-600 text-slate-200" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Predicted Accuracy %" value={tForm.predicted} onChange={e => setTForm(f => ({ ...f, predicted: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs placeholder-slate-600 text-slate-200" />
                    <input placeholder="Memory Trap / Active Recall Cue" value={tForm.memoryTrap} onChange={e => setTForm(f => ({ ...f, memoryTrap: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs placeholder-slate-600 text-slate-200" />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {ERROR_TYPES.map(et => (
                      <button key={et} onClick={() => setTForm(f => ({ ...f, errorType: f.errorType === et ? '' : et }))} className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition ${tForm.errorType === et ? 'bg-amber-950 border-amber-600 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                        {et}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => setTForm(f => ({ ...f, isMock: !f.isMock }))} className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition ${tForm.isMock ? 'bg-teal-950 border-teal-600 text-teal-300' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                      Full Mock Exam
                    </button>
                    {tForm.isMock && (
                      <>
                        <select value={tForm.strategy} onChange={e => setTForm(f => ({ ...f, strategy: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200">{STRATEGIES.map(s => <option key={s}>{s}</option>)}</select>
                        <input type="number" placeholder="topper benchmark %" value={tForm.benchmark} onChange={e => setTForm(f => ({ ...f, benchmark: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs w-36 placeholder-slate-600 text-slate-200" />
                      </>
                    )}
                  </div>

                  {tError && <div className="text-xs text-red-400 font-mono">{tError}</div>}
                  <button onClick={() => submitTopic()} className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm transition">log performance metrics</button>
                </div>
              )}

              {/* Mocks Attempt History Bank */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs font-mono text-slate-500">Attempted Mocks & Practice History</div>
                {topics.slice(0, 8).map(t => (
                  <div key={t.id} className="text-xs bg-slate-900 rounded-xl p-3 border border-slate-800/80">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <span className="font-mono text-slate-200 font-medium">{t.subject} / {t.topic}</span>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {t.totalQ} Qs · {t.correctQ}C / {t.wrongQ}W {t.secPerCorrect ? `· ${t.secPerCorrect}s/correct` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono px-2 py-0.5 rounded text-xs ${t.accuracy >= 75 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                          {t.accuracy}% Acc
                        </span>
                        <button onClick={() => deleteTopic(t.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    {t.memoryTrap && (
                      <div className="text-[11px] bg-slate-950 px-2.5 py-1.5 rounded text-amber-300/90 font-mono mt-1 border border-slate-800 flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" />
                        <span>Trap: {t.memoryTrap}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS & DIAGNOSTIC FORENSICS */}
          {tab === 'analytics' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {['diagnostics', 'priority', 'calibration', 'srs', 'errors'].map(s => (
                  <button key={s} onClick={() => setSubtab(s)} className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${subtab === s ? 'bg-teal-950 text-teal-300 border border-teal-600' : 'bg-slate-900 text-slate-500 border border-slate-700'}`}>
                    {s === 'diagnostics' ? '🚨 diagnostics & readings' : s}
                  </button>
                ))}
              </div>

              {activeDrill && (
                <div className="bg-slate-900 border-2 border-teal-500/80 rounded-2xl p-5 mb-5 space-y-4 animate-fade-in shadow-2xl">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>AI Diagnostic Forensics & 5-Trap Adaptive Drill</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{activeDrill.topicDiagnostic}</p>
                      <p className="text-[11px] text-amber-300 font-mono mt-0.5">Recommended Study: {activeDrill.recommendedChapterReRead}</p>
                    </div>
                    <button onClick={() => setActiveDrill(null)} className="text-slate-500 hover:text-slate-300 p-1">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {activeDrill.questions.map((q, qIdx) => {
                      const selected = drillAnswers[qIdx];
                      const isAnswered = selected !== undefined;
                      const isCorrect = selected === q.correctIndex;

                      return (
                        <div key={qIdx} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                          <div className="text-xs text-slate-200 font-medium">
                            <span className="text-teal-400 font-mono mr-1.5">Q{qIdx + 1}.</span>
                            {q.question}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selected === optIdx;
                              let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800';

                              if (isAnswered) {
                                if (optIdx === q.correctIndex) {
                                  btnStyle = 'bg-emerald-950 border-emerald-600 text-emerald-300 font-semibold';
                                } else if (isThisSelected) {
                                  btnStyle = 'bg-rose-950 border-rose-600 text-rose-300';
                                } else {
                                  btnStyle = 'bg-slate-900/50 border-slate-800/40 text-slate-600';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  disabled={isAnswered}
                                  onClick={() => setDrillAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                                  className={`text-left text-xs p-2.5 rounded-lg border transition ${btnStyle}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {isAnswered && (
                            <div className={`p-2.5 rounded-lg text-xs font-mono mt-2 border ${isCorrect ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'}`}>
                              <div className="font-semibold">{isCorrect ? '✓ Correct Reasoning' : '✗ Distractor Trap Triggered'}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{q.trapExplanation}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {subtab === 'diagnostics' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500 font-mono">
                    diagnostic agent forensics &bull; extracts identified weak areas and provides exact chapter reading prescriptions + AI adaptive trap drills
                  </div>

                  {prescriptions.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-10 bg-slate-900/40 rounded-xl border border-slate-800">
                      Zero critical weak areas detected. Maintain high-accuracy mock execution.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions.map((p, i) => (
                        <div key={i} className="bg-slate-900 border border-rose-900/50 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-mono text-rose-400 flex items-center gap-1.5 font-semibold">
                                <AlertTriangle size={13} />
                                <span>WEAK AREA IDENTIFIED: {p.subject} &bull; {p.topic}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Logged Accuracy: <span className="text-rose-400 font-bold">{p.accuracy}%</span> &bull; Error Type: <span className="text-amber-300">{p.errorType || 'Unclassified'}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                              Re-read Required
                            </span>
                          </div>

                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                            <div className="text-teal-400 font-mono text-[11px] flex items-center gap-1">
                              <BookMarked size={12} />
                              <span>Standard Resource Prescription:</span>
                            </div>
                            <div className="text-slate-200 font-medium">{p.bookRef}</div>
                            {p.memoryTrap && (
                              <div className="text-[11px] text-amber-400/90 font-mono pt-1">
                                Core Trap Noted: {p.memoryTrap}
                              </div>
                            )}
                          </div>

                          <button
                            disabled={loadingAgent}
                            onClick={() => triggerAgentDrill(p)}
                            className="mt-2 w-full py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-200 text-xs font-mono rounded-lg flex items-center justify-center gap-1.5 transition"
                          >
                            {loadingAgent ? (
                              <><Loader2 size={13} className="animate-spin" /><span>Synthesizing Adaptive Trap Drill...</span></>
                            ) : (
                              <><Sparkles size={13} className="text-rose-400" /><span>Generate 5-Question AI Diagnostic Drill</span></>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subtab === 'priority' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-mono mb-2">priority = (1-acc) &times; (1 + 0.3&times;exam_weight) &times; (1 + days_since/30)</div>
                  {priority.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no topics logged yet</div>}
                  {priority.map((p, i) => (
                    <div key={i} className="bg-slate-900 rounded-lg px-3 py-2.5 border border-slate-800/60">
                      <div className="flex justify-between mb-1"><span className="text-sm text-slate-200">{p.subject}/{p.topic}</span><span className="text-xs font-mono text-amber-400">{p.priority.toFixed(2)}</span></div>
                      <div className="flex gap-3 text-xs text-slate-500 font-mono"><span>avg {p.avgAcc.toFixed(0)}%</span><span>{p.examWeight} exams</span><span>{p.days}d ago</span></div>
                    </div>
                  ))}
                </div>
              )}

              {subtab === 'calibration' && (
                <div className="space-y-3">
                  {brier === null ? <div className="text-sm text-slate-500 text-center py-8">no data yet</div> : (
                    <>
                      <div className="bg-slate-900 rounded-xl px-4 py-3 flex justify-between items-center border border-slate-800">
                        <div><div className="text-xs text-slate-500 font-mono">brier calibration score</div><div className="text-xs text-slate-600">closer to 0.00 = zero overconfidence</div></div>
                        <div className="text-xl font-mono text-teal-400">{brier.toFixed(3)}</div>
                      </div>
                      {rows.map(r => (
                        <div key={r.id} className="text-xs bg-slate-900 rounded-lg px-3 py-2 border border-slate-800/60">
                          <div className="flex justify-between mb-1"><span className="text-slate-300 font-mono">{r.subject}/{r.topic}</span><span className={`font-mono ${Math.abs(r.accuracy - r.predicted) <= 10 ? 'text-teal-400' : 'text-amber-400'}`}>&Delta;{r.accuracy - r.predicted}</span></div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1"><div className="h-full bg-slate-600" style={{ width: r.predicted + '%' }} /></div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-teal-500" style={{ width: r.accuracy + '%' }} /></div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {subtab === 'srs' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 font-mono mb-2">active recall queue &bull; recall core trap before checking answer</div>
                  {due.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no overdue topics due for recall</div>}
                  {due.map(d => {
                    const isRevealed = revealedSrs[d.key];
                    return (
                      <div key={d.key} className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-slate-200">{d.subject} / {d.topic}</div>
                            <div className="text-[11px] text-slate-500 font-mono">Box {d.box} &bull; Overdue by {d.overdueBy}d</div>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => reviewSrs(d.key, true)} className="p-2 rounded-lg bg-teal-950 text-teal-400 border border-teal-800/60"><Check size={14} /></button>
                            <button onClick={() => reviewSrs(d.key, false)} className="p-2 rounded-lg bg-red-950 text-red-400 border border-red-800/60"><X size={14} /></button>
                          </div>
                        </div>

                        {d.memoryTrap && (
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-mono text-slate-500">RECALL HOOK</span>
                              <button onClick={() => setRevealedSrs(prev => ({ ...prev, [d.key]: !prev[d.key] }))} className="text-slate-400 hover:text-teal-400 flex items-center gap-1 text-[10px] font-mono">
                                {isRevealed ? <><EyeOff size={11} /> hide</> : <><Eye size={11} /> reveal trap</>}
                              </button>
                            </div>
                            {isRevealed ? (
                              <p className="text-amber-300/90 font-mono text-xs">{d.memoryTrap}</p>
                            ) : (
                              <p className="text-slate-600 italic">Click reveal to verify what mistake or trap you noted...</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {subtab === 'errors' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {ERROR_TYPES.map(et => (
                      <div key={et} className="bg-slate-900 rounded-lg px-2 py-2 text-center border border-slate-800/80">
                        <div className="text-lg font-mono text-amber-400">{errors.counts[et] || 0}</div>
                        <div className="text-xs text-slate-500">{et}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {errors.log.slice(0, 15).map(e => (
                      <div key={e.id} className="text-xs bg-slate-900 rounded-lg px-3 py-2 flex justify-between border border-slate-800/60">
                        <span className="text-slate-300">{e.subject}/{e.topic}</span>
                        <span className="text-amber-400 font-mono">{e.errorType}</span>
                      </div>
                    ))}
                    {errors.log.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no errors logged yet</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ANALYSIS BANK */}
          {tab === 'analysis' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 font-mono mb-1">structured analytical synthesis for descriptive papers & ssb lecturettes</div>
              <input placeholder="topic (e.g. India-Middle East Corridor, Semiconductor Mission)" value={aForm.topic} onChange={e => setAForm(f => ({ ...f, topic: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" />
              <input placeholder="source url" value={aForm.source} onChange={e => setAForm(f => ({ ...f, source: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" />
              
              {ANALYSIS_FRAMEWORK.map(field => (
                <div key={field}>
                  <label className="text-xs text-slate-400 font-mono block mb-1">{FRAMEWORK_LABELS[field]}</label>
                  <textarea value={aForm[field]} onChange={e => setAForm(f => ({ ...f, [field]: e.target.value }))} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder-slate-600 text-slate-200" />
                </div>
              ))}
              
              <button onClick={submitAnalysis} className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-medium rounded-lg py-2.5 text-sm transition">save structured analysis</button>

              {sparringResult && (
                <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-2xl p-5 my-4 space-y-4 shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
                        <Swords size={14} />
                        <span>SSB Interviewer & CAPF Adversarial Sparring</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium mt-1">Topic: {sparringResult.topic}</p>
                    </div>
                    <button onClick={() => setSparringResult(null)} className="text-slate-500 hover:text-slate-300 p-1">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <div className="text-[11px] font-mono text-rose-400 font-semibold mb-1">CHALLENGING COUNTER-ARGUMENTS:</div>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                        {sparringResult.counterArguments.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                      <div className="text-[11px] font-mono text-amber-400 font-semibold mb-1">CONSTITUTIONAL / DATA BLIND SPOT:</div>
                      <p className="text-xs text-slate-300">{sparringResult.dataOrConstitutionalCitationMissed}</p>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono text-teal-400 font-semibold">3-MINUTE SSB LECTURETTE STRUCTURE:</div>
                      <div className="text-xs text-slate-300 space-y-1.5">
                        <div><strong className="text-teal-300 font-mono text-[11px]">1. Hook (30s):</strong> {sparringResult.lecturetteSkeleton.introHook}</div>
                        <div><strong className="text-teal-300 font-mono text-[11px]">2. Drivers (60s):</strong> {sparringResult.lecturetteSkeleton.keyDrivers}</div>
                        <div><strong className="text-teal-300 font-mono text-[11px]">3. Challenges (60s):</strong> {sparringResult.lecturetteSkeleton.criticalChallenges}</div>
                        <div><strong className="text-teal-300 font-mono text-[11px]">4. Way Forward (30s):</strong> {sparringResult.lecturetteSkeleton.strategicWayForward}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-xs text-slate-500 font-mono">saved analyses bank ({analyses.length})</div>
                {analyses.map(a => (
                  <details key={a.id} className="bg-slate-900 rounded-xl p-3 text-xs border border-slate-800">
                    <summary className="cursor-pointer text-slate-200 flex justify-between items-center font-medium">
                      <span>{a.topic} <span className="text-slate-500 font-mono text-[11px]">· {a.date}</span></span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.preventDefault(); triggerSparringAgent(a); }}
                          className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded font-mono text-[10px] flex items-center gap-1 transition"
                        >
                          <Swords size={11} />
                          <span>AI Spar</span>
                        </button>
                        <button onClick={(e) => { e.preventDefault(); deleteAnalysis(a.id); }} className="text-slate-600 hover:text-red-400"><Trash2 size={12} /></button>
                      </div>
                    </summary>
                    <div className="mt-3 space-y-2 text-slate-400 border-t border-slate-800/60 pt-2">
                      {ANALYSIS_FRAMEWORK.map(f => a[f] && (
                        <div key={f}>
                          <span className="text-teal-400/90 font-mono text-[11px] block">{FRAMEWORK_LABELS[f]}:</span> 
                          <span className="text-slate-300 text-xs">{a[f]}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: CURRENT AFFAIRS */}
          {tab === 'feed' && (
            <div className="space-y-6">
              <div>
                <div className="text-xs text-slate-500 font-mono mb-3">5 curated topics per domain &bull; &le;30 days old &bull; click 'analyze' to bridge directly</div>
                {feed.loadingFeed && <div className="text-sm text-slate-500 py-4">loading filtered intelligence feeds...</div>}
                {feed.error && <div className="text-xs text-amber-400 bg-amber-950/30 rounded-lg px-3 py-2">{feed.error}</div>}

                <div className="space-y-5">
                  {Object.entries(feed.sections).map(([sectionName, articles]) => (
                    <div key={sectionName} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-xs font-mono uppercase tracking-wider text-teal-400 font-medium">{sectionName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">top {articles.length}</div>
                      </div>
                      
                      <div className="space-y-2">
                        {articles.length === 0 ? (
                          <div className="text-xs text-slate-600 py-1">no articles found within 30 days</div>
                        ) : (
                          articles.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-950/70 rounded-lg px-3 py-2.5 border border-slate-800/60 flex items-start justify-between gap-3 group"
                            >
                              <a href={item.link} target="_blank" rel="noreferrer" className="flex-1">
                                <div className="text-xs text-slate-200 group-hover:text-teal-300 line-clamp-2 leading-relaxed">
                                  {item.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                                  <span className="text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{item.source}</span>
                                  <span>•</span>
                                  <span>{item.date}</span>
                                </div>
                              </a>
                              <button 
                                onClick={() => sendFeedToAnalysis(item)}
                                className="px-2 py-1 bg-slate-900 hover:bg-teal-950 text-slate-400 hover:text-teal-300 border border-slate-700 hover:border-teal-700 rounded text-[10px] font-mono whitespace-nowrap flex items-center gap-1 transition"
                                title="Send headline directly to Analysis Bank"
                              >
                                <span>Analyze</span>
                                <ArrowRight size={10} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: AUDIT LOG */}
          {tab === 'audit' && (
            <div className="space-y-1.5">
              {audit.length === 0 && <div className="text-sm text-slate-500 text-center py-8">no activity logged yet</div>}
              {audit.map((a, i) => (
                <div key={i} className="text-xs bg-slate-900 rounded-lg px-3 py-2 flex justify-between border border-slate-800/60">
                  <span className="text-slate-300">{a.summary}</span>
                  <span className="text-slate-600 font-mono">{new Date(a.ts).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 10: BOOKS */}
          {tab === 'books' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-mono mb-2">systems thinking and mental models library</div>
              {books.map(b => (
                <div key={b.id} className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                  <div className="flex justify-between mb-2">
                    <div><div className="text-sm text-slate-200 font-medium">{b.title}</div><div className="text-xs text-slate-500">{b.author}</div></div>
                    <span className={`text-xs font-mono self-start ${b.status === 'done' ? 'text-teal-400' : b.status === 'reading' ? 'text-amber-400' : 'text-slate-600'}`}>{b.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="read" value={b.pagesRead || ''} onChange={e => updateBook(b.id, 'pagesRead', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs w-20 text-slate-200" />
                    <span className="text-slate-600 text-xs">/</span>
                    <input type="number" placeholder="total" value={b.totalPages || ''} onChange={e => updateBook(b.id, 'totalPages', Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs w-20 text-slate-200" />
                    {b.totalPages > 0 && <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-2"><div className="h-full bg-teal-500" style={{ width: `${Math.min(100, (b.pagesRead / b.totalPages) * 100)}%` }} /></div>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}