-- ============================================================================
-- SEED DATA: 20 entries per table for AI Content Repurposer
-- Database: content_repurposer (MySQL)
-- ============================================================================

USE content_repurposer;

-- Clear existing data (in reverse dependency order)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE generated_outputs;
TRUNCATE TABLE repurpose_jobs;
TRUNCATE TABLE contents;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Also clear audit log if it exists
-- TRUNCATE TABLE job_audit_log;  -- Skipped: table may not exist yet

-- ============================================================================
-- TABLE: users (20 entries)
-- ============================================================================
INSERT INTO users (user_id, name, email, password_hash, created_at, updated_at) VALUES
('u001-aaaa-bbbb-cccc-000000000001', 'Nikhil Sharma', 'nikhil@example.com', '$2b$12$LJ3b5F.Ghk8vN1xI9mQ7aeZM7KcJdJr5H9YsXvPzM1aR4t6bO2qKe', '2025-11-01 09:00:00', NULL),
('u002-aaaa-bbbb-cccc-000000000002', 'Priya Patel', 'priya@example.com', '$2b$12$XT4d7G.Jhl9wO2yJ0nR8bfAN8LdKfKs6I0ZtYwQaO2bS5u7cP3rLf', '2025-11-02 10:15:00', NULL),
('u003-aaaa-bbbb-cccc-000000000003', 'Arjun Reddy', 'arjun@example.com', '$2b$12$MK5e8H.Kim0xP3zK1oS9cgBO9MeLgLt7J1AuZxRbP3cT6v8dQ4sMg', '2025-11-05 11:30:00', NULL),
('u004-aaaa-bbbb-cccc-000000000004', 'Sneha Gupta', 'sneha@example.com', '$2b$12$NL6f9I.Ljn1yQ4aL2pT0dhCP0NfMhMu8K2BvAyScQ4dU7w9eR5tNh', '2025-11-08 14:00:00', NULL),
('u005-aaaa-bbbb-cccc-000000000005', 'Rahul Verma', 'rahul@example.com', '$2b$12$OM7g0J.Mko2zR5bM3qU1eiDQ1OgNiNv9L3CwBzTdR5eV8x0fS6uOi', '2025-11-10 08:45:00', NULL),
('u006-aaaa-bbbb-cccc-000000000006', 'Ananya Singh', 'ananya@example.com', '$2b$12$PN8h1K.Nlp3aS6cN4rV2fjER2PhOjOw0M4DxCaUeS6fW9y1gT7vPj', '2025-11-12 16:20:00', NULL),
('u007-aaaa-bbbb-cccc-000000000007', 'Vikram Joshi', 'vikram@example.com', '$2b$12$QO9i2L.Omq4bT7dO5sW3gkFS3QiPkPx1N5EyDbVfT7gX0z2hU8wQk', '2025-11-15 12:00:00', NULL),
('u008-aaaa-bbbb-cccc-000000000008', 'Meera Nair', 'meera@example.com', '$2b$12$RP0j3M.Pnr5cU8eP6tX4hlGT4RjQlQy2O6FzEcWgU8hY1a3iV9xRl', '2025-11-18 09:30:00', NULL),
('u009-aaaa-bbbb-cccc-000000000009', 'Karan Malhotra', 'karan@example.com', '$2b$12$SQ1k4N.Qos6dV9fQ7uY5imHU5SkRmRz3P7GaFdXhV9iZ2b4jW0ySm', '2025-11-20 13:45:00', NULL),
('u010-aaaa-bbbb-cccc-000000000010', 'Divya Iyer', 'divya@example.com', '$2b$12$TR2l5O.Rpt7eW0gR8vZ6jnIV6TlSnSa4Q8HbGeYiW0ja3c5kX1zTn', '2025-11-22 10:00:00', NULL),
('u011-aaaa-bbbb-cccc-000000000011', 'Amit Chauhan', 'amit@example.com', '$2b$12$US3m6P.Squ8fX1hS9wA7koJW7UmToTb5R9IcHfZjX1kb4d6lY2aUo', '2025-11-25 15:30:00', NULL),
('u012-aaaa-bbbb-cccc-000000000012', 'Roshni Das', 'roshni@example.com', '$2b$12$VT4n7Q.Trv9gY2iT0xB8lpKX8VnUpUc6S0JdIgAkY2lc5e7mZ3bVp', '2025-12-01 08:00:00', NULL),
('u013-aaaa-bbbb-cccc-000000000013', 'Siddharth Rao', 'siddharth@example.com', '$2b$12$WU5o8R.Usw0hZ3jU1yC9mqLY9WoVqVd7T1KeJhBlZ3md6f8nA4cWq', '2025-12-03 11:15:00', NULL),
('u014-aaaa-bbbb-cccc-000000000014', 'Pooja Mehta', 'pooja@example.com', '$2b$12$XV6p9S.Vtx1iA4kV2zD0nrMZ0XpWrWe8U2LfKiCmA4ne7g9oB5dXr', '2025-12-05 14:30:00', NULL),
('u015-aaaa-bbbb-cccc-000000000015', 'Rohit Kumar', 'rohit@example.com', '$2b$12$YW7q0T.Wuy2jB5lW3aE1osPa1YqXsXf9V3MgLjDnB5of8h0pC6eYs', '2025-12-08 09:00:00', NULL),
('u016-aaaa-bbbb-cccc-000000000016', 'Kavya Bhat', 'kavya@example.com', '$2b$12$ZX8r1U.Xvz3kC6mX4bF2ptQb2ZrYtYg0W4NhMkEoC6pg9i1qD7fZt', '2025-12-10 16:45:00', NULL),
('u017-aaaa-bbbb-cccc-000000000017', 'Aditya Saxena', 'aditya@example.com', '$2b$12$AY9s2V.Ywa4lD7nY5cG3quRc3AsZuZh1X5OiNlFpD7qh0j2rE8gAu', '2025-12-12 12:30:00', NULL),
('u018-aaaa-bbbb-cccc-000000000018', 'Neha Tiwari', 'neha@example.com', '$2b$12$BZ0t3W.Zxb5mE8oZ6dH4rvSd4BtAvAi2Y6PjOmGqE8ri1k3sF9hBv', '2025-12-15 10:00:00', NULL),
('u019-aaaa-bbbb-cccc-000000000019', 'Manish Dubey', 'manish@example.com', '$2b$12$CA1u4X.Ayc6nF9pA7eI5swTe5CuBwBj3Z7QkPnHrF9sj2l4tG0iCw', '2025-12-18 08:15:00', NULL),
('u020-aaaa-bbbb-cccc-000000000020', 'Shruti Kapoor', 'shruti@example.com', '$2b$12$DB2v5Y.Bzd7oG0qB8fJ6txUf6DvCxCk4A8RlQoIsG0tk3m5uH1jDx', '2025-12-20 14:00:00', NULL);

-- ============================================================================
-- TABLE: contents (20 entries)
-- ============================================================================
INSERT INTO contents (content_id, user_id, original_text, source_url, language, title, created_at) VALUES
('c001-aaaa-bbbb-cccc-000000000001', 'u001-aaaa-bbbb-cccc-000000000001', 'Artificial Intelligence is transforming the way businesses operate by automating complex decision-making processes. From predictive analytics to intelligent automation, AI is becoming essential for competitive advantage.', 'https://blog.example.com/ai-business', 'English', 'AI in Business Operations', '2025-11-10 09:30:00'),
('c002-aaaa-bbbb-cccc-000000000002', 'u001-aaaa-bbbb-cccc-000000000001', 'Cloud computing has revolutionized IT infrastructure, enabling organizations to scale dynamically without massive upfront hardware investments. The shift to cloud-native architectures is accelerating across industries.', 'https://blog.example.com/cloud-computing', 'English', 'Cloud Computing Guide', '2025-11-15 10:00:00'),
('c003-aaaa-bbbb-cccc-000000000003', 'u002-aaaa-bbbb-cccc-000000000002', 'Machine learning algorithms can be broadly categorized into supervised, unsupervised, and reinforcement learning. Each category serves different use cases from classification to generative modeling.', NULL, 'English', 'ML Algorithm Overview', '2025-11-12 11:00:00'),
('c004-aaaa-bbbb-cccc-000000000004', 'u002-aaaa-bbbb-cccc-000000000002', 'La inteligencia artificial esta transformando la manera en que las empresas operan, automatizando procesos complejos de toma de decisiones y mejorando la eficiencia operativa.', NULL, 'Spanish', 'IA en Negocios', '2025-11-18 13:00:00'),
('c005-aaaa-bbbb-cccc-000000000005', 'u003-aaaa-bbbb-cccc-000000000003', 'The future of remote work is shaped by digital collaboration tools, asynchronous communication, and trust-based management. Companies that embrace flexibility will attract top talent globally.', 'https://medium.com/remote-work-future', 'English', 'Future of Remote Work', '2025-11-20 14:30:00'),
('c006-aaaa-bbbb-cccc-000000000006', 'u003-aaaa-bbbb-cccc-000000000003', 'Cybersecurity threats are evolving rapidly with the rise of AI-powered attacks and zero-day exploits. Organizations must adopt zero-trust architectures and continuous monitoring strategies.', NULL, 'English', 'Cybersecurity Trends 2026', '2025-11-25 09:00:00'),
('c007-aaaa-bbbb-cccc-000000000007', 'u004-aaaa-bbbb-cccc-000000000004', 'Sustainable technology practices are becoming essential for modern enterprises seeking to reduce their carbon footprint while maintaining operational efficiency and innovation.', 'https://greenbiz.com/sustainable-tech', 'English', 'Green Tech Practices', '2025-11-28 10:30:00'),
('c008-aaaa-bbbb-cccc-000000000008', 'u005-aaaa-bbbb-cccc-000000000005', 'DevOps methodology bridges the gap between development and operations through continuous integration, continuous delivery, and infrastructure as code practices.', NULL, 'English', 'DevOps Best Practices', '2025-12-01 08:15:00'),
('c009-aaaa-bbbb-cccc-000000000009', 'u005-aaaa-bbbb-cccc-000000000005', 'Le cloud computing a revolutionne linfrastructure informatique, permettant aux organisations de dimensionner dynamiquement sans investissements materiels massifs.', NULL, 'French', 'Guide du Cloud Computing', '2025-12-03 12:00:00'),
('c010-aaaa-bbbb-cccc-000000000010', 'u006-aaaa-bbbb-cccc-000000000006', 'Data engineering pipelines form the backbone of modern analytics platforms, enabling real-time data processing, transformation, and loading at massive scale.', 'https://datablog.io/pipelines', 'English', 'Data Engineering Pipelines', '2025-12-05 15:00:00'),
('c011-aaaa-bbbb-cccc-000000000011', 'u007-aaaa-bbbb-cccc-000000000007', 'Blockchain technology extends beyond cryptocurrency into supply chain management, healthcare records, and digital identity verification systems.', NULL, 'English', 'Blockchain Beyond Crypto', '2025-12-07 09:45:00'),
('c012-aaaa-bbbb-cccc-000000000012', 'u008-aaaa-bbbb-cccc-000000000008', 'User experience design principles focus on creating intuitive, accessible, and delightful digital interfaces that prioritize user needs and business goals simultaneously.', 'https://uxdesign.cc/principles', 'English', 'UX Design Principles', '2025-12-09 11:30:00'),
('c013-aaaa-bbbb-cccc-000000000013', 'u009-aaaa-bbbb-cccc-000000000009', 'Edge computing brings computation closer to data sources, reducing latency and bandwidth consumption dramatically while enabling real-time processing for IoT applications.', NULL, 'English', 'Edge Computing Explained', '2025-12-11 14:00:00'),
('c014-aaaa-bbbb-cccc-000000000014', 'u010-aaaa-bbbb-cccc-000000000010', 'Agile project management emphasizes iterative development, cross-functional teams, and continuous feedback loops to deliver value faster and adapt to change efficiently.', 'https://agile.guide/overview', 'English', 'Agile Management Guide', '2025-12-13 10:15:00'),
('c015-aaaa-bbbb-cccc-000000000015', 'u011-aaaa-bbbb-cccc-000000000011', 'Natural Language Processing enables machines to understand, interpret, and generate human language at scale, powering chatbots, translation services, and content analysis tools.', NULL, 'English', 'NLP Applications in 2026', '2025-12-15 13:00:00'),
('c016-aaaa-bbbb-cccc-000000000016', 'u012-aaaa-bbbb-cccc-000000000012', 'Kubernetes orchestration simplifies container management at scale, offering automated scaling, self-healing, and declarative deployment configurations for microservices.', 'https://k8s.io/intro', 'English', 'Kubernetes for Beginners', '2025-12-17 08:30:00'),
('c017-aaaa-bbbb-cccc-000000000017', 'u013-aaaa-bbbb-cccc-000000000013', 'Product-led growth strategies focus on using the product itself as the primary driver of customer acquisition, retention, and expansion in SaaS businesses.', NULL, 'English', 'Product-Led Growth', '2025-12-19 16:00:00'),
('c018-aaaa-bbbb-cccc-000000000018', 'u014-aaaa-bbbb-cccc-000000000014', 'GraphQL provides a flexible query language for APIs, allowing clients to request exactly the data they need, reducing over-fetching and improving frontend performance.', 'https://graphql.org/learn', 'English', 'GraphQL vs REST', '2025-12-21 09:00:00'),
('c019-aaaa-bbbb-cccc-000000000019', 'u015-aaaa-bbbb-cccc-000000000015', 'KI im Geschaeftsbetrieb veraendert die Art wie Unternehmen komplexe Entscheidungen treffen und operative Prozesse automatisieren.', NULL, 'German', 'KI im Geschaeft', '2025-12-23 11:45:00'),
('c020-aaaa-bbbb-cccc-000000000020', 'u016-aaaa-bbbb-cccc-000000000016', 'Microservices architecture decomposes applications into small, independently deployable services for maximum flexibility, fault isolation, and technology diversity.', NULL, 'English', 'Microservices Architecture', '2025-12-25 14:30:00');

-- ============================================================================
-- TABLE: repurpose_jobs (20 entries)
-- ============================================================================
INSERT INTO repurpose_jobs (job_id, content_id, target_platform, target_language, status, created_at, completed_at) VALUES
('j001-aaaa-bbbb-cccc-000000000001', 'c001-aaaa-bbbb-cccc-000000000001', 'linkedin', 'English', 'completed', '2025-11-10 10:00:00', '2025-11-10 10:02:00'),
('j002-aaaa-bbbb-cccc-000000000002', 'c001-aaaa-bbbb-cccc-000000000001', 'twitter', 'English', 'completed', '2025-11-10 10:05:00', '2025-11-10 10:06:30'),
('j003-aaaa-bbbb-cccc-000000000003', 'c002-aaaa-bbbb-cccc-000000000002', 'email', 'English', 'completed', '2025-11-15 10:30:00', '2025-11-15 10:33:00'),
('j004-aaaa-bbbb-cccc-000000000004', 'c003-aaaa-bbbb-cccc-000000000003', 'linkedin', 'English', 'completed', '2025-11-12 11:30:00', '2025-11-12 11:32:00'),
('j005-aaaa-bbbb-cccc-000000000005', 'c003-aaaa-bbbb-cccc-000000000003', 'instagram', 'English', 'failed', '2025-11-12 11:45:00', NULL),
('j006-aaaa-bbbb-cccc-000000000006', 'c004-aaaa-bbbb-cccc-000000000004', 'twitter', 'Spanish', 'completed', '2025-11-18 13:30:00', '2025-11-18 13:31:30'),
('j007-aaaa-bbbb-cccc-000000000007', 'c005-aaaa-bbbb-cccc-000000000005', 'youtube_script', 'English', 'completed', '2025-11-20 15:00:00', '2025-11-20 15:05:00'),
('j008-aaaa-bbbb-cccc-000000000008', 'c005-aaaa-bbbb-cccc-000000000005', 'linkedin', 'English', 'completed', '2025-11-20 15:10:00', '2025-11-20 15:12:00'),
('j009-aaaa-bbbb-cccc-000000000009', 'c006-aaaa-bbbb-cccc-000000000006', 'twitter', 'English', 'pending', '2025-11-25 09:30:00', NULL),
('j010-aaaa-bbbb-cccc-000000000010', 'c007-aaaa-bbbb-cccc-000000000007', 'instagram', 'English', 'completed', '2025-11-28 11:00:00', '2025-11-28 11:02:00'),
('j011-aaaa-bbbb-cccc-000000000011', 'c008-aaaa-bbbb-cccc-000000000008', 'linkedin', 'English', 'completed', '2025-12-01 08:45:00', '2025-12-01 08:47:00'),
('j012-aaaa-bbbb-cccc-000000000012', 'c009-aaaa-bbbb-cccc-000000000009', 'email', 'French', 'failed', '2025-12-03 12:30:00', NULL),
('j013-aaaa-bbbb-cccc-000000000013', 'c010-aaaa-bbbb-cccc-000000000010', 'youtube_shorts', 'English', 'completed', '2025-12-05 15:30:00', '2025-12-05 15:32:00'),
('j014-aaaa-bbbb-cccc-000000000014', 'c011-aaaa-bbbb-cccc-000000000011', 'twitter', 'English', 'completed', '2025-12-07 10:15:00', '2025-12-07 10:16:30'),
('j015-aaaa-bbbb-cccc-000000000015', 'c012-aaaa-bbbb-cccc-000000000012', 'linkedin', 'English', 'pending', '2025-12-09 12:00:00', NULL),
('j016-aaaa-bbbb-cccc-000000000016', 'c013-aaaa-bbbb-cccc-000000000013', 'email', 'English', 'completed', '2025-12-11 14:30:00', '2025-12-11 14:33:00'),
('j017-aaaa-bbbb-cccc-000000000017', 'c014-aaaa-bbbb-cccc-000000000014', 'twitter', 'Hindi', 'completed', '2025-12-13 10:45:00', '2025-12-13 10:47:00'),
('j018-aaaa-bbbb-cccc-000000000018', 'c015-aaaa-bbbb-cccc-000000000015', 'youtube_script', 'English', 'processing', '2025-12-15 13:30:00', NULL),
('j019-aaaa-bbbb-cccc-000000000019', 'c016-aaaa-bbbb-cccc-000000000016', 'linkedin', 'English', 'completed', '2025-12-17 09:00:00', '2025-12-17 09:02:00'),
('j020-aaaa-bbbb-cccc-000000000020', 'c017-aaaa-bbbb-cccc-000000000017', 'instagram', 'English', 'failed', '2025-12-19 16:30:00', NULL);

-- ============================================================================
-- TABLE: generated_outputs (20 entries)
-- ============================================================================
INSERT INTO generated_outputs (output_id, job_id, output_text, format_type, is_edited, created_at, updated_at) VALUES
('o001-aaaa-bbbb-cccc-000000000001', 'j001-aaaa-bbbb-cccc-000000000001', 'AI is no longer a buzzword - it is the backbone of modern business operations. From predictive analytics to automated workflows, enterprises are leveraging AI for competitive advantage.', 'linkedin_post', 0, '2025-11-10 10:02:00', NULL),
('o002-aaaa-bbbb-cccc-000000000002', 'j002-aaaa-bbbb-cccc-000000000002', 'AI is transforming business! Predictive analytics, automated workflows, smarter decisions. The future is here. #AI #Business #Tech', 'tweet', 0, '2025-11-10 10:06:30', NULL),
('o003-aaaa-bbbb-cccc-000000000003', 'j003-aaaa-bbbb-cccc-000000000003', 'Subject: Your Weekly Tech Brief - Cloud Computing Revolution\n\nDear Reader,\nCloud computing continues to reshape IT infrastructure enabling organizations to scale dynamically.', 'email_newsletter', 1, '2025-11-15 10:33:00', '2025-11-16 09:00:00'),
('o004-aaaa-bbbb-cccc-000000000004', 'j004-aaaa-bbbb-cccc-000000000004', 'Understanding ML Algorithms: Supervised learning uses labeled data, unsupervised finds hidden patterns, and RL learns through trial and error. Here is your guide.', 'linkedin_post', 0, '2025-11-12 11:32:00', NULL),
('o005-aaaa-bbbb-cccc-000000000005', 'j006-aaaa-bbbb-cccc-000000000006', 'La IA esta transformando los negocios! Analitica predictiva, flujos automatizados y decisiones mas inteligentes. #IA #Negocios', 'tweet', 0, '2025-11-18 13:31:30', NULL),
('o006-aaaa-bbbb-cccc-000000000006', 'j007-aaaa-bbbb-cccc-000000000007', 'INTRO: Hey everyone! Today we are diving deep into the future of remote work. Let me start with a question - how has your work setup changed in the last 3 years?', 'youtube_script', 1, '2025-11-20 15:05:00', '2025-11-21 10:00:00'),
('o007-aaaa-bbbb-cccc-000000000007', 'j008-aaaa-bbbb-cccc-000000000008', 'Remote work is here to stay. But is your organization ready for the next wave? Three pillars define the future: async communication, digital collaboration, trust-based leadership.', 'linkedin_post', 0, '2025-11-20 15:12:00', NULL),
('o008-aaaa-bbbb-cccc-000000000008', 'j010-aaaa-bbbb-cccc-000000000010', 'Tech meets sustainability! Modern enterprises are reducing their carbon footprint through green cloud solutions, energy-efficient coding, and circular IT lifecycle management. #GreenTech', 'instagram_caption', 0, '2025-11-28 11:02:00', NULL),
('o009-aaaa-bbbb-cccc-000000000009', 'j011-aaaa-bbbb-cccc-000000000011', 'DevOps is not just a methodology - it is a culture shift. CI/CD pipelines, infrastructure as code, and monitoring-first approaches are transforming software delivery at scale.', 'linkedin_post', 0, '2025-12-01 08:47:00', NULL),
('o010-aaaa-bbbb-cccc-000000000010', 'j013-aaaa-bbbb-cccc-000000000013', 'Did you know data pipelines process BILLIONS of events per second? Here are 3 tools every data engineer needs in 2026. #DataEngineering #Shorts', 'youtube_short', 0, '2025-12-05 15:32:00', NULL),
('o011-aaaa-bbbb-cccc-000000000011', 'j014-aaaa-bbbb-cccc-000000000014', 'Blockchain is NOT just crypto! Supply chain transparency, tamper-proof health records, and decentralized identity - the real applications are just beginning. #Blockchain #Web3', 'tweet', 1, '2025-12-07 10:16:30', '2025-12-08 14:00:00'),
('o012-aaaa-bbbb-cccc-000000000012', 'j016-aaaa-bbbb-cccc-000000000016', 'Subject: Edge Computing - The Next Frontier\n\nDear Subscriber,\nEdge computing is revolutionizing how we process data by bringing computation closer to the source for real-time results.', 'email_newsletter', 0, '2025-12-11 14:33:00', NULL),
('o013-aaaa-bbbb-cccc-000000000013', 'j017-aaaa-bbbb-cccc-000000000017', 'Agile project management: iterative development, cross-functional teams, and continuous feedback. The future of software delivery! #Agile #Hindi', 'tweet', 0, '2025-12-13 10:47:00', NULL),
('o014-aaaa-bbbb-cccc-000000000014', 'j019-aaaa-bbbb-cccc-000000000019', 'Getting started with Kubernetes? Here is your roadmap: 1) Understand pods and services 2) Learn kubectl commands 3) Deploy your first app 4) Master scaling and monitoring.', 'linkedin_post', 0, '2025-12-17 09:02:00', NULL),
('o015-aaaa-bbbb-cccc-000000000015', 'j001-aaaa-bbbb-cccc-000000000001', 'AI is reshaping enterprise operations through intelligent automation, predictive maintenance, and data-driven strategy. Here are 5 use cases every leader should know about.', 'linkedin_article', 0, '2025-11-10 10:03:00', NULL),
('o016-aaaa-bbbb-cccc-000000000016', 'j003-aaaa-bbbb-cccc-000000000003', 'Cloud computing enables elastic scaling, pay-as-you-go pricing, and global reach. This newsletter breaks down the top 5 cloud trends for 2026 and beyond.', 'email_summary', 0, '2025-11-15 10:34:00', NULL),
('o017-aaaa-bbbb-cccc-000000000017', 'j007-aaaa-bbbb-cccc-000000000007', 'OUTRO: Thanks for watching! If this video helped you think differently about remote work, hit that subscribe button. See you in the next one!', 'youtube_outro', 0, '2025-11-20 15:06:00', NULL),
('o018-aaaa-bbbb-cccc-000000000018', 'j004-aaaa-bbbb-cccc-000000000004', 'ML algorithms demystified: supervised for classification and regression, unsupervised for clustering, reinforcement for game AI and robotics. Which one fits your use case?', 'linkedin_carousel', 1, '2025-11-12 11:33:00', '2025-11-13 08:00:00'),
('o019-aaaa-bbbb-cccc-000000000019', 'j011-aaaa-bbbb-cccc-000000000011', 'Breaking down DevOps: 1. Version Control with Git 2. CI/CD with Jenkins 3. Containers with Docker 4. Orchestration with Kubernetes 5. Monitoring with Prometheus and Grafana.', 'linkedin_carousel', 0, '2025-12-01 08:48:00', NULL),
('o020-aaaa-bbbb-cccc-000000000020', 'j014-aaaa-bbbb-cccc-000000000014', 'Blockchain use cases beyond DeFi: Healthcare records, supply chain tracking, government IDs, intellectual property management, and carbon credit trading. The tech is maturing.', 'tweet_thread', 0, '2025-12-07 10:17:00', NULL);

-- ============================================================================
-- Verify counts
-- ============================================================================
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'contents', COUNT(*) FROM contents
UNION ALL SELECT 'repurpose_jobs', COUNT(*) FROM repurpose_jobs
UNION ALL SELECT 'generated_outputs', COUNT(*) FROM generated_outputs;
