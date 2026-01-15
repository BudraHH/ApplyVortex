-- ==========================================
-- FILE: 001_common_and_master_data.sql
-- DESCRIPTION: Core extensions, utilities, and master reference data (Skills, Portals).
-- CREATED: 2025-12-28 (Refactored)
-- ==========================================

SET client_min_messages TO WARNING; -- Suppress benign "does not exist" notices during re-runs

-- ==========================================
-- 1. EXTENSIONS & GLOBAL UTILITIES
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- Reusable trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. DOMAIN: SKILLS CATALOG
-- ==========================================

-- Skills Table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category SMALLINT NOT NULL,
    sub_category SMALLINT NOT NULL DEFAULT 9999, -- 9999: OTHER
    aliases TEXT[], -- Alternative names for fuzzy matching
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Skills Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_name_lower ON skills(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_sub_category ON skills(sub_category);
CREATE INDEX IF NOT EXISTS idx_skills_is_verified ON skills(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_skills_aliases ON skills USING GIN(aliases);
CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON skills USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_skills_search ON skills USING GIN(
    to_tsvector('english', COALESCE(name, ''))
);

-- Skills Triggers
DROP TRIGGER IF EXISTS trg_skills_updated_at ON skills;
CREATE TRIGGER trg_skills_updated_at 
    BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Normalize skill name
CREATE OR REPLACE FUNCTION normalize_skill_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name := TRIM(NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_skill_name ON skills;
CREATE TRIGGER trg_normalize_skill_name 
    BEFORE INSERT OR UPDATE OF name ON skills
    FOR EACH ROW EXECUTE FUNCTION normalize_skill_name();

-- Skills Functions
CREATE OR REPLACE FUNCTION search_skills(p_query TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    category SMALLINT,
    sub_category SMALLINT,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, s.name, s.category, s.sub_category,
        GREATEST(
            similarity(s.name, p_query),
            (SELECT MAX(similarity(alias, p_query)) FROM unnest(s.aliases) AS alias)
        ) AS sim
    FROM skills s
    WHERE 
        s.name ILIKE '%' || p_query || '%' OR
        EXISTS (SELECT 1 FROM unnest(s.aliases) AS alias WHERE alias ILIKE '%' || p_query || '%')
    ORDER BY sim DESC, s.name ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_or_create_skill(p_name TEXT)
RETURNS UUID AS $$
DECLARE
    v_skill_id UUID;
    v_normalized_name TEXT;
BEGIN
    v_normalized_name := TRIM(p_name);
    -- Try match
    SELECT id INTO v_skill_id FROM skills WHERE LOWER(name) = LOWER(v_normalized_name) LIMIT 1;
    -- Try alias
    IF v_skill_id IS NULL THEN
        SELECT id INTO v_skill_id FROM skills WHERE v_normalized_name = ANY(aliases) LIMIT 1;
    END IF;
    -- Create
    IF v_skill_id IS NULL THEN
        -- Fallback: 999=OTHER (Category), 9999=OTHER (Sub-category)
        INSERT INTO skills (name, category, sub_category, is_verified) 
        VALUES (v_normalized_name, 999, 9999, FALSE)
        RETURNING id INTO v_skill_id;
    END IF;
    RETURN v_skill_id;
END;
$$ LANGUAGE plpgsql;

-- Skills Seed Data
INSERT INTO skills (name, category, sub_category, is_verified, aliases) VALUES
    -- 1: PROGRAMMING_LANGUAGES
    ('Python', 1, 1, TRUE, ARRAY['python', 'py', 'python3']),
    ('JavaScript', 1, 1, TRUE, ARRAY['JS', 'javascript', 'es6']),
    ('Java', 1, 1, TRUE, ARRAY['java', 'jdk']),
    ('C++', 1, 1, TRUE, ARRAY['cpp', 'cplusplus']),
    ('C#', 1, 1, TRUE, ARRAY['csharp', 'c-sharp']),
    ('TypeScript', 1, 1, TRUE, ARRAY['TS', 'typescript']),
    ('Go', 1, 1, TRUE, ARRAY['golang', 'go-lang']),
    ('Rust', 1, 1, TRUE, ARRAY['rust-lang']),
    ('Swift', 1, 1, TRUE, ARRAY['swift']),
    ('Kotlin', 1, 1, TRUE, ARRAY['kotlin']),
    ('PHP', 1, 1, TRUE, ARRAY['php']),
    ('Ruby', 1, 1, TRUE, ARRAY['ruby']),
    ('C', 1, 1, TRUE, ARRAY['c-lang']),
    ('Scala', 1, 1, TRUE, ARRAY['scala']),
    ('R', 1, 1, TRUE, ARRAY['r-lang']),
    ('Dart', 1, 1, TRUE, ARRAY['dart']),
    ('Perl', 1, 1, TRUE, ARRAY['perl']),
    ('Lua', 1, 1, TRUE, ARRAY['lua']),
    ('Haskell', 1, 1, TRUE, ARRAY['haskell']),
    ('Elixir', 1, 1, TRUE, ARRAY['elixir']),

    -- 2: FRONTEND
    ('React', 1, 2, TRUE, ARRAY['ReactJS', 'React.js', 'react']),
    ('Angular', 1, 2, TRUE, ARRAY['AngularJS', 'angular', 'ng']),
    ('Vue.js', 1, 2, TRUE, ARRAY['Vue', 'vuejs', 'vue']),
    ('Svelte', 1, 2, TRUE, ARRAY['SvelteJS', 'svelte']),
    ('Next.js', 1, 2, TRUE, ARRAY['NextJS', 'next']),
    ('Nuxt.js', 1, 2, TRUE, ARRAY['nuxt']),
    ('HTML5', 1, 2, TRUE, ARRAY['HTML', 'html5']),
    ('CSS3', 1, 2, TRUE, ARRAY['CSS', 'css3']),
    ('Tailwind CSS', 1, 2, TRUE, ARRAY['Tailwind', 'tailwind']),
    ('Bootstrap', 1, 2, TRUE, ARRAY['bootstrap']),
    ('Sass', 1, 2, TRUE, ARRAY['scss']),
    ('Less', 1, 2, TRUE, ARRAY['less']),
    ('Webpack', 1, 2, TRUE, ARRAY['webpack']),
    ('Vite', 1, 2, TRUE, ARRAY['vite']),
    ('Babel', 1, 2, TRUE, ARRAY['babel']),
    ('jQuery', 1, 2, TRUE, ARRAY['jquery']),
    ('Redux', 1, 2, TRUE, ARRAY['redux']),
    ('Recoil', 1, 2, TRUE, ARRAY['recoil']),
    ('Zustand', 1, 2, TRUE, ARRAY['zustand']),
    ('SolidJS', 1, 2, TRUE, ARRAY['solid']),

    -- 3: BACKEND
    ('Node.js', 1, 3, TRUE, ARRAY['NodeJS', 'node']),
    ('Express.js', 1, 3, TRUE, ARRAY['Express', 'express']),
    ('Django', 1, 3, TRUE, ARRAY['django']),
    ('Flask', 1, 3, TRUE, ARRAY['flask']),
    ('FastAPI', 1, 3, TRUE, ARRAY['fastapi']),
    ('Spring Boot', 1, 3, TRUE, ARRAY['Spring', 'spring-boot']),
    ('Ruby on Rails', 1, 3, TRUE, ARRAY['Rails', 'RoR']),
    ('ASP.NET Core', 1, 3, TRUE, ARRAY['.NET Core', 'asp.net']),
    ('NestJS', 1, 3, TRUE, ARRAY['nestjs']),
    ('Laravel', 1, 3, TRUE, ARRAY['laravel']),
    ('Symfony', 1, 3, TRUE, ARRAY['symfony']),
    ('Koa.js', 1, 3, TRUE, ARRAY['koa']),
    ('Phoenix', 1, 3, TRUE, ARRAY['phoenix']),
    ('Gin', 1, 3, TRUE, ARRAY['gin-gonic']),
    ('Echo', 1, 3, TRUE, ARRAY['echo']),
    ('Hapi.js', 1, 3, TRUE, ARRAY['hapi']),
    ('AdonisJS', 1, 3, TRUE, ARRAY['adonis']),
    ('Micronaut', 1, 3, TRUE, ARRAY['micronaut']),
    ('Quarkus', 1, 3, TRUE, ARRAY['quarkus']),
    ('Sanic', 1, 3, TRUE, ARRAY['sanic']),

    -- 4: FULL_STACK
    ('MERN Stack', 1, 4, TRUE, ARRAY['MERN']),
    ('MEAN Stack', 1, 4, TRUE, ARRAY['MEAN']),
    ('MEVN Stack', 1, 4, TRUE, ARRAY['MEVN']),
    ('LAMP Stack', 1, 4, TRUE, ARRAY['LAMP']),
    ('JAMstack', 1, 4, TRUE, ARRAY['jamstack']),
    ('T3 Stack', 1, 4, TRUE, ARRAY['t3-stack']),
    ('Meteor.js', 1, 4, TRUE, ARRAY['Meteor', 'meteor']),
    ('Remix', 1, 4, TRUE, ARRAY['remix']),
    ('RedwoodJS', 1, 4, TRUE, ARRAY['redwood']),
    ('Blazor', 1, 4, TRUE, ARRAY['blazor']),
    ('Next.js Fullstack', 1, 4, TRUE, ARRAY['next-fullstack']),
    ('Nuxt.js Fullstack', 1, 4, TRUE, ARRAY['nuxt-fullstack']),
    ('Supabase', 1, 4, TRUE, ARRAY['supabase']),
    ('Firebase', 1, 4, TRUE, ARRAY['firebase']),
    ('Amplify', 1, 4, TRUE, ARRAY['aws-amplify']),
    ('Appwrite', 1, 4, TRUE, ARRAY['appwrite']),
    ('PocketBase', 1, 4, TRUE, ARRAY['pocketbase']),
    ('Hasura', 1, 4, TRUE, ARRAY['hasura']),
    ('Strapi', 1, 4, TRUE, ARRAY['strapi']),
    ('KeystoneJS', 1, 4, TRUE, ARRAY['keystone']),

    -- 5: MOBILE
    ('React Native', 1, 5, TRUE, ARRAY['RN', 'react-native']),
    ('Flutter', 1, 5, TRUE, ARRAY['flutter']),
    ('Android SDK', 1, 5, TRUE, ARRAY['Android', 'android-sdk', 'android-development']),
    ('iOS SDK', 1, 5, TRUE, ARRAY['iOS', 'ios-sdk', 'ios-development']),
    ('SwiftUI', 1, 5, TRUE, ARRAY['swiftui']),
    ('Jetpack Compose', 1, 5, TRUE, ARRAY['compose']),
    ('Xamarin', 1, 5, TRUE, ARRAY['xamarin']),
    ('Maui', 1, 5, TRUE, ARRAY['.NET MAUI', 'maui']),
    ('Ionic', 1, 5, TRUE, ARRAY['ionic']),
    ('Cordova', 1, 5, TRUE, ARRAY['cordova']),
    ('Capacitor', 1, 5, TRUE, ARRAY['capacitor']),
    ('NativeScript', 1, 5, TRUE, ARRAY['nativescript']),
    ('Expo', 1, 5, TRUE, ARRAY['expo']),
    ('Unity Mobile', 1, 5, TRUE, ARRAY['unity-mobile']),
    ('Unreal Mobile', 1, 5, TRUE, ARRAY['unreal-mobile']),
    ('Kivy', 1, 5, TRUE, ARRAY['kivy']),
    ('Corona SDK', 1, 5, TRUE, ARRAY['corona']),
    ('PhoneGap', 1, 5, TRUE, ARRAY['phonegap']),
    ('Objective-C Mobile', 1, 5, TRUE, ARRAY['objc-mobile']),
    ('Java Mobile', 1, 5, TRUE, ARRAY['java-mobile']),

    -- 6: DATABASES
    ('PostgreSQL', 1, 6, TRUE, ARRAY['Postgres', 'postgres', 'psql']),
    ('MySQL', 1, 6, TRUE, ARRAY['mysql']),
    ('MongoDB', 1, 6, TRUE, ARRAY['Mongo', 'mongodb']),
    ('Redis', 1, 6, TRUE, ARRAY['redis']),
    ('SQLite', 1, 6, TRUE, ARRAY['sqlite']),
    ('MariaDB', 1, 6, TRUE, ARRAY['mariadb']),
    ('Oracle Database', 1, 6, TRUE, ARRAY['oracle-db']),
    ('Microsoft SQL Server', 1, 6, TRUE, ARRAY['mssql', 'sql-server']),
    ('Cassandra', 1, 6, TRUE, ARRAY['cassandra']),
    ('Elasticsearch', 1, 6, TRUE, ARRAY['elastic', 'elk']),
    ('DynamoDB', 1, 6, TRUE, ARRAY['dynamodb']),
    ('Firestore', 1, 6, TRUE, ARRAY['firestore']),
    ('CouchDB', 1, 6, TRUE, ARRAY['couchdb']),
    ('Neo4j', 1, 6, TRUE, ARRAY['neo4j']),
    ('CockroachDB', 1, 6, TRUE, ARRAY['cockroach']),
    ('ScyllaDB', 1, 6, TRUE, ARRAY['scylla']),
    ('InfluxDB', 1, 6, TRUE, ARRAY['influx']),
    ('TimescaleDB', 1, 6, TRUE, ARRAY['timescale']),
    ('Realm', 1, 6, TRUE, ARRAY['realm']),
    ('Supabase Database', 1, 6, TRUE, ARRAY['supabase-db']),

    -- 7: SOFTWARE_DEV (Desktop/Embedded/Game)
    ('Electron', 1, 7, TRUE, ARRAY['electron', 'electronjs']),
    ('Qt', 1, 7, TRUE, ARRAY['qt']),
    ('WPF', 1, 7, TRUE, ARRAY['wpf']),
    ('WinForms', 1, 7, TRUE, ARRAY['windows-forms']),
    ('GTK', 1, 7, TRUE, ARRAY['gtk']),
    ('Unreal Engine', 1, 7, TRUE, ARRAY['unreal']),
    ('Unity', 1, 7, TRUE, ARRAY['unity3d']),
    ('Godot', 1, 7, TRUE, ARRAY['godot']),
    ('OpenGL', 1, 7, TRUE, ARRAY['opengl']),
    ('Vulkan', 1, 7, TRUE, ARRAY['vulkan']),
    ('DirectX', 1, 7, TRUE, ARRAY['directx']),
    ('Arduino', 1, 7, TRUE, ARRAY['arduino-platform']),
    ('Raspberry Pi', 1, 7, TRUE, ARRAY['rpi']),
    ('ESP32', 1, 7, TRUE, ARRAY['esp32']),
    ('STM32', 1, 7, TRUE, ARRAY['stm32']),
    ('FPGA', 1, 7, TRUE, ARRAY['fpga']),
    ('Verilog', 1, 7, TRUE, ARRAY['verilog']),
    ('VHDL', 1, 7, TRUE, ARRAY['vhdl']),
    ('RTOS', 1, 7, TRUE, ARRAY['rtos']),
    ('CUDA', 1, 7, TRUE, ARRAY['cuda']),

    -- 8: DATA_AND_ANALYTICS
    ('Apache Spark', 1, 8, TRUE, ARRAY['Spark', 'spark']),
    ('Hadoop', 1, 8, TRUE, ARRAY['hadoop']),
    ('Kafka', 1, 8, TRUE, ARRAY['kafka']),
    ('Airflow', 1, 8, TRUE, ARRAY['airflow']),
    ('Snowflake', 1, 8, TRUE, ARRAY['snowflake']),
    ('Databricks', 1, 8, TRUE, ARRAY['databricks']),
    ('BigQuery', 1, 8, TRUE, ARRAY['bigquery']),
    ('Redshift', 1, 8, TRUE, ARRAY['redshift']),
    ('Tableau', 1, 8, TRUE, ARRAY['tableau']),
    ('Power BI', 1, 8, TRUE, ARRAY['power-bi']),
    ('Looker', 1, 8, TRUE, ARRAY['looker']),
    ('dbt', 1, 8, TRUE, ARRAY['data-build-tool']),
    ('Prefect', 1, 8, TRUE, ARRAY['prefect']),
    ('Flink', 1, 8, TRUE, ARRAY['flink']),
    ('Hive', 1, 8, TRUE, ARRAY['hive']),
    ('Presto', 1, 8, TRUE, ARRAY['presto']),
    ('Trino', 1, 8, TRUE, ARRAY['trino']),
    ('ETL', 1, 8, TRUE, ARRAY['Extract Transform Load']),
    ('Data Warehousing', 1, 8, TRUE, ARRAY['DWH']),
    ('Data Lake', 1, 8, TRUE, ARRAY['data-lake']),

    -- 9: AI_ML
    ('TensorFlow', 1, 9, TRUE, ARRAY['TF', 'tensorflow']),
    ('PyTorch', 1, 9, TRUE, ARRAY['pytorch']),
    ('Scikit-learn', 1, 9, TRUE, ARRAY['sklearn']),
    ('Keras', 1, 9, TRUE, ARRAY['keras']),
    ('Pandas', 1, 9, TRUE, ARRAY['pandas']),
    ('NumPy', 1, 9, TRUE, ARRAY['numpy']),
    ('SciPy', 1, 9, TRUE, ARRAY['scipy']),
    ('Matplotlib', 1, 9, TRUE, ARRAY['matplotlib']),
    ('Seaborn', 1, 9, TRUE, ARRAY['seaborn']),
    ('OpenCV', 1, 9, TRUE, ARRAY['opencv']),
    ('NLP', 1, 9, TRUE, ARRAY['Natural Language Processing']),
    ('LLM', 1, 9, TRUE, ARRAY['Large Language Model', 'LLMs']),
    ('OpenAI API', 1, 9, TRUE, ARRAY['OpenAI', 'gpt']),
    ('Hugging Face', 1, 9, TRUE, ARRAY['huggingface']),
    ('LangChain', 1, 9, TRUE, ARRAY['langchain']),
    ('LlamaIndex', 1, 9, TRUE, ARRAY['llamaindex']),
    ('XGBoost', 1, 9, TRUE, ARRAY['xgboost']),
    ('LightGBM', 1, 9, TRUE, ARRAY['lightgbm']),
    ('Jupyter', 1, 9, TRUE, ARRAY['jupyter-notebook']),
    ('MLflow', 1, 9, TRUE, ARRAY['mlflow']),
@
    -- 10: DEVOPS_CLOUD
    ('Docker', 1, 10, TRUE, ARRAY['docker']),
    ('Kubernetes', 1, 10, TRUE, ARRAY['k8s', 'kubernetes']),
    ('AWS', 1, 10, TRUE, ARRAY['Amazon Web Services', 'aws-cloud']),
    ('Azure', 1, 10, TRUE, ARRAY['Microsoft Azure', 'azure-cloud']),
    ('Google Cloud', 1, 10, TRUE, ARRAY['GCP', 'google-cloud-platform']),
    ('Jenkins', 1, 10, TRUE, ARRAY['jenkins']),
    ('GitHub Actions', 1, 10, TRUE, ARRAY['GHA']),
    ('GitLab CI', 1, 10, TRUE, ARRAY['gitlab-ci']),
    ('CircleCI', 1, 10, TRUE, ARRAY['circleci']),
    ('Terraform', 1, 10, TRUE, ARRAY['terraform']),
    ('Ansible', 1, 10, TRUE, ARRAY['ansible']),
    ('Prometheus', 1, 10, TRUE, ARRAY['prometheus']),
    ('Grafana', 1, 10, TRUE, ARRAY['grafana']),
    ('ELK Stack', 1, 10, TRUE, ARRAY['elk-stack']),
    ('Nginx', 1, 10, TRUE, ARRAY['nginx']),
    ('Linux', 1, 10, TRUE, ARRAY['linux-admin']),
    ('Bash', 1, 10, TRUE, ARRAY['shell-scripting', 'bash']),
    ('DigitalOcean', 1, 10, TRUE, ARRAY['digitalocean']),
    ('Heroku', 1, 10, TRUE, ARRAY['heroku']),
    ('Vercel', 1, 10, TRUE, ARRAY['vercel']),

    -- 11: SECURITY
    ('Penetration Testing', 1, 11, TRUE, ARRAY['Pentesting']),
    ('Ethical Hacking', 1, 11, TRUE, ARRAY['hacking']),
    ('OWASP', 1, 11, TRUE, ARRAY['owasp-top-10']),
    ('Cryptography', 1, 11, TRUE, ARRAY['crypto']),
    ('Network Security', 1, 11, TRUE, ARRAY['netsec']),
    ('Metasploit', 1, 11, TRUE, ARRAY['metasploit']),
    ('Burp Suite', 1, 11, TRUE, ARRAY['burp']),
    ('Wireshark', 1, 11, TRUE, ARRAY['wireshark']),
    ('Nmap', 1, 11, TRUE, ARRAY['nmap']),
    ('Kali Linux', 1, 11, TRUE, ARRAY['kali']),
    ('IAM', 1, 11, TRUE, ARRAY['Identity and Access Management']),
    ('OAuth', 1, 11, TRUE, ARRAY['oauth2', 'openid']),
    ('SAML', 1, 11, TRUE, ARRAY['saml']),
    ('CISSP', 1, 11, TRUE, ARRAY['cissp-cert']),
    ('CEH', 1, 11, TRUE, ARRAY['ceh-cert']),
    ('SIEM', 1, 11, TRUE, ARRAY['siem']),
    ('Splunk', 1, 11, TRUE, ARRAY['splunk-security']),
    ('AppSec', 1, 11, TRUE, ARRAY['Application Security']),
    ('GDPR', 1, 11, TRUE, ARRAY['gdpr-compliance']),
    ('SOC2', 1, 11, TRUE, ARRAY['soc2']),

    -- 12: QA_TESTING
    ('Selenium', 1, 12, TRUE, ARRAY['selenium-webdriver']),
    ('Cypress', 1, 12, TRUE, ARRAY['cypress-io']),
    ('Playwright', 1, 12, TRUE, ARRAY['playwright-test']),
    ('Puppeteer', 1, 12, TRUE, ARRAY['puppeteer']),
    ('JUnit', 1, 12, TRUE, ARRAY['junit']),
    ('TestNG', 1, 12, TRUE, ARRAY['testng']),
    ('PyTest', 1, 12, TRUE, ARRAY['pytest']),
    ('Jest', 1, 12, TRUE, ARRAY['jest']),
    ('Mocha', 1, 12, TRUE, ARRAY['mocha']),
    ('Chai', 1, 12, TRUE, ARRAY['chai']),
    ('Postman', 1, 12, TRUE, ARRAY['postman-api-testing']),
    ('SoapUI', 1, 12, TRUE, ARRAY['soapui']),
    ('JMeter', 1, 12, TRUE, ARRAY['jmeter']),
    ('LoadRunner', 1, 12, TRUE, ARRAY['loadrunner']),
    ('K6', 1, 12, TRUE, ARRAY['k6-load-testing']),
    ('Appium', 1, 12, TRUE, ARRAY['appium']),
    ('Cucumber', 1, 12, TRUE, ARRAY['cucumber']),
    ('BDD', 1, 12, TRUE, ARRAY['Behavior Driven Development']),
    ('TDD', 1, 12, TRUE, ARRAY['Test Driven Development']),
    ('Manual Testing', 1, 12, TRUE, ARRAY['manual-qa']),

    -- 13: DESIGN
    ('Figma', 1, 13, TRUE, ARRAY['figma']),
    ('Adobe XD', 1, 13, TRUE, ARRAY['xd']),
    ('Sketch', 1, 13, TRUE, ARRAY['sketch-app']),
    ('Photoshop', 1, 13, TRUE, ARRAY['ps', 'adobe-photoshop']),
    ('Illustrator', 1, 13, TRUE, ARRAY['ai', 'adobe-illustrator']),
    ('InDesign', 1, 13, TRUE, ARRAY['indesign']),
    ('After Effects', 1, 13, TRUE, ARRAY['ae']),
    ('Premiere Pro', 1, 13, TRUE, ARRAY['premiere']),
    ('InVision', 1, 13, TRUE, ARRAY['invision']),
    ('Zeplin', 1, 13, TRUE, ARRAY['zeplin']),
    ('Canva', 1, 13, TRUE, ARRAY['canva']),
    ('Blender', 1, 13, TRUE, ARRAY['blender']),
    ('Maya', 1, 13, TRUE, ARRAY['maya']),
    ('UI Design', 1, 13, TRUE, ARRAY['User Interface Design']),
    ('UX Design', 1, 13, TRUE, ARRAY['User Experience Design']),
    ('User Research', 1, 13, TRUE, ARRAY['ux-research']),
    ('Wireframing', 1, 13, TRUE, ARRAY['wireframes']),
    ('Prototyping', 1, 13, TRUE, ARRAY['prototypes']),
    ('Typography', 1, 13, TRUE, ARRAY['typography']),
    ('Color Theory', 1, 13, TRUE, ARRAY['color-theory']),

    -- 14: ARCHITECTURE
    ('Microservices', 1, 14, TRUE, ARRAY['micro-services']),
    ('Monolith', 1, 14, TRUE, ARRAY['monolithic-architecture']),
    ('Serverless', 1, 14, TRUE, ARRAY['serverless-arch']),
    ('Event-Driven', 1, 14, TRUE, ARRAY['EDA']),
    ('REST API', 1, 14, TRUE, ARRAY['RESTful']),
    ('GraphQL', 1, 14, TRUE, ARRAY['graphql-api']),
    ('gRPC', 1, 14, TRUE, ARRAY['grpc']),
    ('SOAP', 1, 14, TRUE, ARRAY['soap-api']),
    ('System Design', 1, 14, TRUE, ARRAY['sys-design', 'HLD', 'LLD']),
    ('Design Patterns', 1, 14, TRUE, ARRAY['GoF', 'software-patterns']),
    ('SOLID', 1, 14, TRUE, ARRAY['SOLID-principles']),
    ('DRY', 1, 14, TRUE, ARRAY['Don''t Repeat Yourself']),
    ('KISS', 1, 14, TRUE, ARRAY['Keep It Simple Stupid']),
    ('DDD', 1, 14, TRUE, ARRAY['Domain-Driven Design']),
    ('Clean Architecture', 1, 14, TRUE, ARRAY['clean-arch']),
    ('Hexagonal Architecture', 1, 14, TRUE, ARRAY['ports-and-adapters']),
    ('MVC', 1, 14, TRUE, ARRAY['Model View Controller']),
    ('MVVM', 1, 14, TRUE, ARRAY['Model View ViewModel']),
    ('UML', 1, 14, TRUE, ARRAY['Unified Modeling Language']),
    ('SOA', 1, 14, TRUE, ARRAY['Service Oriented Architecture']),

    -- 0: NONE (SOFT_SKILLS)
    ('Agile', 99, 0, TRUE, ARRAY['agile-methodology']),
    ('Scrum', 99, 0, TRUE, ARRAY['scrum']),
    ('Kanban', 99, 0, TRUE, ARRAY['kanban']),
    ('Jira', 99, 0, TRUE, ARRAY['jira-software']),
    ('Confluence', 99, 0, TRUE, ARRAY['confluence']),
    ('Trello', 99, 0, TRUE, ARRAY['trello']),
    ('Asana', 99, 0, TRUE, ARRAY['asana']),
    ('Monday.com', 99, 0, TRUE, ARRAY['monday']),
    ('Project Management', 99, 0, TRUE, ARRAY['PM']),
    ('Product Management', 99, 0, TRUE, ARRAY['PdM']),
    ('Roadmapping', 99, 0, TRUE, ARRAY['product-roadmap']),
    ('Backlog Management', 99, 0, TRUE, ARRAY['backlog']),
    ('Sprint Planning', 99, 0, TRUE, ARRAY['sprint']),
    ('Stakeholder Management', 99, 0, TRUE, ARRAY['stakeholders']),
    ('Risk Management', 99, 0, TRUE, ARRAY['risk-mitigation']),
    ('Budgeting', 99, 0, TRUE, ARRAY['budget-management']),
    ('Leadership', 99, 0, TRUE, ARRAY['team-lead']),
    ('Mentoring', 99, 0, TRUE, ARRAY['mentorship']),
    ('Conflict Resolution', 99, 0, TRUE, ARRAY['conflict-mgmt']),
    ('PMP', 99, 0, TRUE, ARRAY['Project Management Professional']),

    -- 16: EMERGING_TECH
    ('Blockchain', 1, 16, TRUE, ARRAY['blockchain']),
    ('Solidity', 1, 16, TRUE, ARRAY['solidity']),
    ('Ethereum', 1, 16, TRUE, ARRAY['eth']),
    ('Smart Contracts', 1, 16, TRUE, ARRAY['smart-contracts']),
    ('NFT', 1, 16, TRUE, ARRAY['Non-Fungible Token']),
    ('Web3', 1, 16, TRUE, ARRAY['web3']),
    ('DeFi', 1, 16, TRUE, ARRAY['Decentralized Finance']),
    ('IoT', 1, 16, TRUE, ARRAY['Internet of Things']),
    ('Embedded C', 1, 16, TRUE, ARRAY['embedded-c']),
    ('MQTT', 1, 16, TRUE, ARRAY['mqtt']),
    ('Zigbee', 1, 16, TRUE, ARRAY['zigbee']),
    ('LoRaWAN', 1, 16, TRUE, ARRAY['lora']),
    ('ARKit', 1, 16, TRUE, ARRAY['arkit']),
    ('ARCore', 1, 16, TRUE, ARRAY['arcore']),
    ('Virtual Reality', 1, 16, TRUE, ARRAY['VR']),
    ('Augmented Reality', 1, 16, TRUE, ARRAY['AR']),
    ('Metaverse', 1, 16, TRUE, ARRAY['metaverse']),
    ('Quantum Computing', 1, 16, TRUE, ARRAY['quantum']),
    ('Qiskit', 1, 16, TRUE, ARRAY['qiskit']),
    ('Generative AI', 1, 16, TRUE, ARRAY['GenAI']),

    -- 17: CORE_CS
    ('Algorithms', 1, 17, TRUE, ARRAY['algo']),
    ('Data Structures', 1, 17, TRUE, ARRAY['DSA']),
    ('Big O Notation', 1, 17, TRUE, ARRAY['complexity-analysis']),
    ('Operating Systems', 1, 17, TRUE, ARRAY['OS']),
    ('Computer Networks', 1, 17, TRUE, ARRAY['networking', 'TCP/IP']),
    ('Database Management', 1, 17, TRUE, ARRAY['DBMS']),
    ('Compilers', 1, 17, TRUE, ARRAY['compiler-design']),
    ('Computer Architecture', 1, 17, TRUE, ARRAY['computer-org']),
    ('Discrete Mathematics', 1, 17, TRUE, ARRAY['discrete-math']),
    ('Automata Theory', 1, 17, TRUE, ARRAY['automata']),
    ('Distributed Systems', 1, 17, TRUE, ARRAY['distributed-computing']),
    ('Cryptography', 1, 17, TRUE, ARRAY['crypto-theory']),
    ('Parallel Computing', 1, 17, TRUE, ARRAY['parallel-processing']),
    ('Multithreading', 1, 17, TRUE, ARRAY['concurrency']),
    ('Memory Management', 1, 17, TRUE, ARRAY['garbage-collection']),
    ('Pointers', 1, 17, TRUE, ARRAY['memory-pointers']),
    ('Linux Kernel', 1, 17, TRUE, ARRAY['kernel-dev']),
    ('Shell Scripting', 1, 17, TRUE, ARRAY['bash-script']),
    ('Regular Expressions', 1, 17, TRUE, ARRAY['regex']),
    ('Recursion', 1, 17, TRUE, ARRAY['recursive-algo']),

    -- 0: NONE (SOFT_SKILLS)
    ('Finance', 99, 0, TRUE, ARRAY['financial-services']),
    ('Accounting', 99, 0, TRUE, ARRAY['accounting']),
    ('Marketing', 99, 0, TRUE, ARRAY['marketing']),
    ('Sales', 99, 0, TRUE, ARRAY['sales']),
    ('E-commerce', 99, 0, TRUE, ARRAY['ecommerce']),
    ('Healthcare', 99, 0, TRUE, ARRAY['health-tech']),
    ('Supply Chain', 99, 0, TRUE, ARRAY['logistics']),
    ('HR', 99, 0, TRUE, ARRAY['Human Resources']),
    ('Recruiting', 99, 0, TRUE, ARRAY['talent-acquisition']),
    ('Customer Service', 99, 0, TRUE, ARRAY['support']),
    ('Business Strategy', 99, 0, TRUE, ARRAY['strategy']),
    ('Operations', 99, 0, TRUE, ARRAY['ops']),
    ('Consulting', 99, 0, TRUE, ARRAY['business-consulting']),
    ('Legal', 99, 0, TRUE, ARRAY['compliance-legal']),
    ('Real Estate', 99, 0, TRUE, ARRAY['realty']),
    ('Manufacturing', 99, 0, TRUE, ARRAY['industrial']),
    ('Banking', 99, 0, TRUE, ARRAY['fintech']),
    ('Insurance', 99, 0, TRUE, ARRAY['insurtech']),
    ('Retail', 99, 0, TRUE, ARRAY['retail-management']),
    ('Digital Marketing', 99, 0, TRUE, ARRAY['seo-marketing']),

    -- 0: NONE (SOFT_SKILLS)
    ('Microsoft Office', 99, 0, TRUE, ARRAY['office-suite']),
    ('Excel', 99, 0, TRUE, ARRAY['ms-excel']),
    ('PowerPoint', 99, 0, TRUE, ARRAY['ppt']),
    ('Word', 99, 0, TRUE, ARRAY['ms-word']),
    ('Outlook', 99, 0, TRUE, ARRAY['email']),
    ('Google Workspace', 99, 0, TRUE, ARRAY['g-suite']),
    ('Slack', 99, 0, TRUE, ARRAY['slack-app']),
    ('Zoom', 99, 0, TRUE, ARRAY['zoom-meeting']),
    ('Teams', 99, 0, TRUE, ARRAY['ms-teams']),
    ('Public Speaking', 99, 0, TRUE, ARRAY['presentation-skills']),
    ('Technical Writing', 99, 0, TRUE, ARRAY['documentation']),
    ('Communication', 99, 0, TRUE, ARRAY['verbal-communication']),
    ('Teamwork', 99, 0, TRUE, ARRAY['collaboration']),
    ('Problem Solving', 99, 0, TRUE, ARRAY['troubleshooting']),
    ('Time Management', 99, 0, TRUE, ARRAY['scheduling']),
    ('Critical Thinking', 99, 0, TRUE, ARRAY['analysis']),
    ('Emotional Intelligence', 99, 0, TRUE, ARRAY['EQ']),
    ('Creativity', 99, 0, TRUE, ARRAY['ideation']),
    ('Adaptability', 99, 0, TRUE, ARRAY['flexibility']),
    ('Negotiation', 99, 0, TRUE, ARRAY['persuasion'])
ON CONFLICT (name) DO NOTHING;
